
require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Course, SubCourse, StudentEnrollment, StudentAnalytics } = require('../models');

const quickSeed = async () => {
  try {
    console.log('🌱 Quick seeding analytics data...');
    
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get sample data
    const teacher = await User.findOne({ where: { role: 'teacher' } });
    const students = await User.findAll({ where: { role: 'student' }, limit: 3 });
    const subcourses = await SubCourse.findAll({ 
      include: [{ model: Course, as: 'course' }],
      limit: 3 
    });

    if (!teacher || students.length === 0 || subcourses.length === 0) {
      console.log('❌ Please run: npm run seed first');
      process.exit(1);
    }

    // Clear existing analytics
    await StudentAnalytics.destroy({ where: {} });
    console.log('🗑️ Cleared existing analytics');

    // Create sample data
    const analyticsData = [];
    
    for (const student of students) {
      for (const subcourse of subcourses) {
        // Create enrollment if doesn't exist
        await StudentEnrollment.findOrCreate({
          where: {
            student_id: student.id_user,
            course_id: subcourse.course_id
          },
          defaults: {
            enrollment_date: new Date(),
            status: 'active'
          }
        });

        // Create 2 sessions per student per subcourse
        for (let i = 0; i < 2; i++) {
          const sessionId = `session_${student.nama_lengkap.replace(/\s+/g, '_')}_${subcourse.id}_${i}_${Date.now()}`;
          const daysAgo = Math.floor(Math.random() * 7); // Last 7 days
          const sessionStart = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
          
          const totalDuration = 600; // 10 minutes
          const watchedDuration = 580; // 9 min 40 sec
          const distractedCount = Math.floor(Math.random() * 15) + 3; // 3-18 distractions
          const yawnCount = Math.floor(distractedCount * 0.4); // 40% of distractions include yawns
          const eyesClosedCount = Math.floor(distractedCount * 0.2); // 20% include closed eyes
          
          const attentionPercentage = Math.floor(85 + Math.random() * 10); // 85-95%
          const completionPercentage = 97;

          analyticsData.push({
            student_id: student.id_user,
            sub_course_id: subcourse.id,
            session_id: sessionId,
            session_start: sessionStart,
            session_end: new Date(sessionStart.getTime() + (watchedDuration * 1000)),
            total_duration: totalDuration,
            watched_duration: watchedDuration,
            distracted_count: distractedCount,
            yawn_count: yawnCount,
            eyes_closed_count: eyesClosedCount,
            distracted_duration: distractedCount,
            eyes_closed_duration: eyesClosedCount,
            attention_percentage: attentionPercentage,
            completion_percentage: completionPercentage,
            analytics_data: {
              per_second_data: Array.from({length: watchedDuration}, (_, i) => ({
                timestamp: i + 1,
                distracted: i < distractedCount && Math.random() < 0.05,
                yawn: i < yawnCount && Math.random() < 0.02,
                eyes_closed: i < eyesClosedCount && Math.random() < 0.01
              }))
            }
          });
        }
      }
    }

    // Insert all analytics data
    await StudentAnalytics.bulkCreate(analyticsData);
    console.log(`✅ Created ${analyticsData.length} analytics sessions`);
    
    console.log('🎉 Quick seeding completed!');
    console.log('🧪 Test API now: GET {{baseUrl}}/student-analytics/teacher/reports');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Quick seed failed:', error);
    process.exit(1);
  }
};

quickSeed();
