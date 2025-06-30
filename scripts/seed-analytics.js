require('dotenv').config();
const { sequelize } = require('../config/database');
const { 
  User, 
  Course, 
  SubCourse, 
  StudentEnrollment,
  StudentAnalytics
} = require('../models');

const seedAnalyticsData = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if table exists
    try {
      await sequelize.query('SELECT 1 FROM student_analytics LIMIT 1');
      console.log('✅ student_analytics table exists');
    } catch (error) {
      console.log('❌ student_analytics table not found. Please create it first:');
      console.log('   Run SQL script: database/create-student-analytics.sql');
      console.log('   Or run: npm run setup-fresh');
      process.exit(1);
    }

    // Get existing data
    const teacher = await User.findOne({ where: { role: 'teacher' } });
    const students = await User.findAll({ where: { role: 'student' } });
    const courses = await Course.findAll();
    const subcourses = await SubCourse.findAll({
      include: [{
        model: Course,
        as: 'course'
      }]
    });

    console.log('📊 Current database state:');
    console.log(`   - Teachers: ${teacher ? 1 : 0}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Courses: ${courses.length}`);
    console.log(`   - SubCourses: ${subcourses.length}`);

    // Check if we need to run main seed first
    if (!teacher || students.length === 0 || courses.length === 0 || subcourses.length === 0) {
      console.log('\n❌ Missing required data!');
      console.log('\n🔧 Please run the main seed script first:');
      console.log('   npm run seed');
      console.log('\n   This will create:');
      console.log('   ✓ Sample teacher and students');
      console.log('   ✓ Sample courses and subcourses');
      console.log('   ✓ Student enrollments');
      console.log('\n   Then run this script again:');
      console.log('   node scripts/seed-analytics.js');
      process.exit(1);
    }

    console.log('\n🌱 All required data found. Proceeding with analytics seeding...');

    // Clear existing analytics data
    const existingCount = await StudentAnalytics.count();
    if (existingCount > 0) {
      console.log(`🗑️  Clearing ${existingCount} existing analytics records...`);
      await StudentAnalytics.destroy({ where: {} });
    }

    // Create realistic analytics sessions
    const now = new Date();
    const analyticsData = [];

    // Create sessions for each student in each subcourse they're enrolled in
    for (const student of students) {
      // Get student's enrollments
      const enrollments = await StudentEnrollment.findAll({
        where: { student_id: student.id_user },
        include: [{
          model: Course,
          as: 'course',
          include: [{
            model: SubCourse,
            as: 'subcourses'
          }]
        }]
      });

      for (const enrollment of enrollments) {
        const course = enrollment.course;
        
        for (const subcourse of course.subcourses) {
          // Create 1-3 sessions per student per subcourse
          const sessionCount = Math.floor(Math.random() * 3) + 1;
          
          for (let i = 0; i < sessionCount; i++) {
            const sessionData = createRealisticSession(student, subcourse, i, now);
            analyticsData.push(sessionData);
          }
        }
      }
    }

    console.log(`📊 Creating ${analyticsData.length} analytics sessions...`);

    // Insert analytics data
    let successCount = 0;
    for (const data of analyticsData) {
      try {
        await StudentAnalytics.create(data);
        successCount++;
        if (successCount % 5 === 0) {
          console.log(`   ✅ Created ${successCount}/${analyticsData.length} sessions...`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create session: ${data.session_id}`, error.message);
      }
    }

    console.log(`\n🎉 Analytics seeding completed successfully!`);
    console.log(`📊 Created ${successCount} analytics sessions`);
    
    // Show summary statistics
    const stats = await getAnalyticsStats();
    console.log('\n📈 Analytics Summary:');
    console.log(`   - Total sessions: ${stats.totalSessions}`);
    console.log(`   - Average attention: ${stats.avgAttention}%`);
    console.log(`   - Most distracted student: ${stats.mostDistracted.student}`);
    console.log(`   - Most boring material: ${stats.mostBoring.material}`);

    console.log('\n🧪 Test the API now:');
    console.log('   GET {{baseUrl}}/student-analytics/teacher/reports');
    console.log('   GET {{baseUrl}}/student-analytics/teacher/reports?month=6&year=2025');
    console.log('\n💡 The reports will now show real data from database!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.error('Full error:', error.stack);
    process.exit(1);
  }
};

// Create realistic session data for a student
function createRealisticSession(student, subcourse, sessionIndex, baseDate) {
  // Create variety in student performance
  const studentPerformance = getStudentPerformanceProfile(student.nama_lengkap);
  
  // Session timing (spread over last 30 days)
  const daysAgo = Math.floor(Math.random() * 30);
  const sessionStart = new Date(baseDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  
  // Video duration (5-15 minutes)
  const totalDuration = Math.floor(Math.random() * 600) + 300; // 5-15 minutes
  const watchedDuration = Math.floor(totalDuration * (0.7 + Math.random() * 0.3)); // 70-100% watched
  
  // Calculate distraction based on student profile and material
  const baseDistraction = studentPerformance.distractionRate;
  const materialDifficulty = getMaterialDifficulty(subcourse.title);
  const actualDistraction = Math.min(baseDistraction * materialDifficulty, 0.3); // Max 30% distracted
  
  const distractedCount = Math.floor(watchedDuration * actualDistraction);
  const yawnCount = Math.floor(distractedCount * (0.3 + Math.random() * 0.4)); // 30-70% of distractions include yawns
  const eyesClosedCount = Math.floor(distractedCount * (0.1 + Math.random() * 0.2)); // 10-30% include closed eyes
  
  const distractedDuration = distractedCount;
  const eyesClosedDuration = eyesClosedCount;
  
  const attentiveDuration = watchedDuration - distractedDuration;
  const attentionPercentage = watchedDuration > 0 ? Math.round((attentiveDuration / watchedDuration) * 100) : 0;
  const completionPercentage = Math.round((watchedDuration / totalDuration) * 100);
  
  return {
    student_id: student.id_user,
    sub_course_id: subcourse.id,
    session_id: `session_${student.nama_lengkap.replace(/\s+/g, '_').toLowerCase()}_${subcourse.id}_${sessionIndex}_${Date.now()}`,
    session_start: sessionStart,
    session_end: new Date(sessionStart.getTime() + (watchedDuration * 1000)),
    total_duration: totalDuration,
    watched_duration: watchedDuration,
    distracted_count: distractedCount,
    yawn_count: yawnCount,
    eyes_closed_count: eyesClosedCount,
    distracted_duration: distractedDuration,
    eyes_closed_duration: eyesClosedDuration,
    attention_percentage: attentionPercentage,
    completion_percentage: completionPercentage,
    analytics_data: {
      per_second_data: generateMockPerSecondData(watchedDuration, distractedCount, yawnCount, eyesClosedCount),
      student_profile: studentPerformance.profile,
      material_difficulty: materialDifficulty
    }
  };
}

// Get student performance profile based on name
function getStudentPerformanceProfile(studentName) {
  const profiles = {
    'excellent': { distractionRate: 0.02, profile: 'excellent_student' },
    'good': { distractionRate: 0.05, profile: 'good_student' }, 
    'average': { distractionRate: 0.10, profile: 'average_student' },
    'struggling': { distractionRate: 0.20, profile: 'struggling_student' }
  };
  
  // Assign profile based on name hash for consistency
  const hash = studentName.length + studentName.charCodeAt(0);
  const profileKeys = Object.keys(profiles);
  const profileKey = profileKeys[hash % profileKeys.length];
  
  return profiles[profileKey];
}

// Get material difficulty multiplier
function getMaterialDifficulty(materialTitle) {
  const title = materialTitle.toLowerCase();
  if (title.includes('pengenalan') || title.includes('dasar')) return 1.0;
  if (title.includes('lanjut') || title.includes('komplek')) return 1.3;
  if (title.includes('ujian') || title.includes('test')) return 1.1;
  return 1.0;
}

// Generate per-second analytics data
function generateMockPerSecondData(duration, distractedCount, yawnCount, eyesClosedCount) {
  const data = [];
  let distractedUsed = 0;
  let yawnUsed = 0;
  let eyesClosedUsed = 0;

  for (let i = 1; i <= duration; i++) {
    const dataPoint = {
      timestamp: i,
      distracted: false,
      yawn: false,
      eyes_closed: false
    };

    // Distribute events realistically
    if (distractedUsed < distractedCount && Math.random() < 0.02) {
      dataPoint.distracted = true;
      distractedUsed++;
    }

    if (yawnUsed < yawnCount && Math.random() < 0.01) {
      dataPoint.yawn = true;
      yawnUsed++;
    }

    if (eyesClosedUsed < eyesClosedCount && Math.random() < 0.005) {
      dataPoint.eyes_closed = true;
      eyesClosedUsed++;
    }

    data.push(dataPoint);
  }

  return data;
}

// Get analytics statistics
async function getAnalyticsStats() {
  const totalSessions = await StudentAnalytics.count();
  
  const avgAttentionResult = await StudentAnalytics.findOne({
    attributes: [[sequelize.fn('AVG', sequelize.col('attention_percentage')), 'avg_attention']]
  });
  
  const mostDistractedResult = await StudentAnalytics.findAll({
    attributes: [
      'student_id',
      [sequelize.fn('SUM', sequelize.col('distracted_count')), 'total_distracted']
    ],
    include: [{
      model: User,
      as: 'student',
      attributes: ['nama_lengkap']
    }],
    group: ['student_id', 'student.id_user', 'student.nama_lengkap'],
    order: [[sequelize.fn('SUM', sequelize.col('distracted_count')), 'DESC']],
    limit: 1
  });

  const mostBoringResult = await StudentAnalytics.findAll({
    attributes: [
      'sub_course_id',
      [sequelize.fn('AVG', sequelize.col('distracted_count')), 'avg_distracted']
    ],
    include: [{
      model: SubCourse,
      as: 'subcourse',
      attributes: ['title']
    }],
    group: ['sub_course_id', 'subcourse.id', 'subcourse.title'],
    order: [[sequelize.fn('AVG', sequelize.col('distracted_count')), 'DESC']],
    limit: 1
  });

  return {
    totalSessions,
    avgAttention: Math.round(avgAttentionResult?.dataValues?.avg_attention || 0),
    mostDistracted: {
      student: mostDistractedResult[0]?.student?.nama_lengkap || 'N/A'
    },
    mostBoring: {
      material: mostBoringResult[0]?.subcourse?.title || 'N/A'
    }
  };
}

seedAnalyticsData();