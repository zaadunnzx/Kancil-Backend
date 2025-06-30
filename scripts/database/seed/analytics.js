const { StudentAnalytics, SubCourse, StudentSubCourseProgress } = require('../../../models');

const seedAnalytics = async (users, courses) => {
  try {
    console.log('   📈 Creating analytics data...');

    const { teacher, students } = users;

    // Get all subcourses
    const subcourses = await SubCourse.findAll({
      include: [{ model: require('../../../models').Course, as: 'course' }]
    });

    if (subcourses.length === 0) {
      console.log('     ℹ️  No subcourses found, skipping analytics');
      return;
    }

    // Clear existing analytics
    await StudentAnalytics.destroy({ where: {} });
    console.log('     🗑️  Cleared existing analytics data');

    // Create analytics sessions for each student
    const analyticsData = [];
    let totalSessions = 0;

    for (const student of students) {
      for (const subcourse of subcourses) {
        // Create 2-3 sessions per student per subcourse
        const sessionCount = Math.floor(Math.random() * 2) + 2; // 2-3 sessions

        for (let i = 0; i < sessionCount; i++) {
          const session = createRealisticSession(student, subcourse, i);
          analyticsData.push(session);
          totalSessions++;

          // Also create progress record
          await StudentSubCourseProgress.findOrCreate({
            where: {
              sub_course_id: subcourse.id,
              enrollment_student_id: student.id_user
            },
            defaults: {
              sub_course_id: subcourse.id,
              enrollment_student_id: student.id_user,
              status: session.completion_percentage >= 80 ? 'completed' : 'in_progress',
              score: subcourse.content_type === 'quiz' ? 
                Math.floor(Math.random() * 40) + 60 : // Quiz: 60-100
                (session.completion_percentage >= 80 ? 1 : 0), // Other: 0 or 1
              completion_percentage: session.completion_percentage,
              time_spent: session.watched_duration,
              attempts: subcourse.content_type === 'quiz' ? Math.floor(Math.random() * 3) + 1 : 1
            }
          });
        }
      }
    }

    // Bulk insert analytics data
    if (analyticsData.length > 0) {
      await StudentAnalytics.bulkCreate(analyticsData);
      console.log(`     ✅ Created ${analyticsData.length} analytics sessions`);
    }

    // Calculate and display statistics
    const stats = await calculateAnalyticsStats();
    console.log(`     📊 Analytics Statistics:`);
    console.log(`       - Total sessions: ${totalSessions}`);
    console.log(`       - Average attention: ${stats.avgAttention}%`);
    console.log(`       - Students with data: ${students.length}`);
    console.log(`       - Subcourses covered: ${subcourses.length}`);

  } catch (error) {
    console.error('   ❌ Analytics seeding failed:', error.message);
    throw error;
  }
};

// Create realistic analytics session data
function createRealisticSession(student, subcourse, sessionIndex) {
  const baseDate = new Date();
  
  // Student performance profile
  const studentProfile = getStudentProfile(student.nama_lengkap);
  
  // Session timing (spread over last 30 days)
  const daysAgo = Math.floor(Math.random() * 30);
  const sessionStart = new Date(baseDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  
  // Content duration based on type
  let totalDuration;
  switch (subcourse.content_type) {
    case 'video':
      totalDuration = Math.floor(Math.random() * 600) + 300; // 5-15 minutes
      break;
    case 'quiz':
      totalDuration = Math.floor(Math.random() * 900) + 600; // 10-25 minutes
      break;
    default:
      totalDuration = Math.floor(Math.random() * 300) + 180; // 3-8 minutes
  }
  
  // Watched duration (70-100% of total)
  const watchedDuration = Math.floor(totalDuration * (0.7 + Math.random() * 0.3));
  
  // Calculate distractions based on student profile and content difficulty
  const materialDifficulty = getMaterialDifficulty(subcourse.title);
  const baseDistraction = studentProfile.distractionRate * materialDifficulty;
  
  const distractedCount = Math.floor(watchedDuration * baseDistraction);
  const yawnCount = Math.floor(distractedCount * (0.3 + Math.random() * 0.4));
  const eyesClosedCount = Math.floor(distractedCount * (0.1 + Math.random() * 0.2));
  
  const attentiveDuration = watchedDuration - distractedCount;
  const attentionPercentage = Math.max(0, Math.round((attentiveDuration / watchedDuration) * 100));
  const completionPercentage = Math.round((watchedDuration / totalDuration) * 100);
  
  return {
    student_id: student.id_user,
    sub_course_id: subcourse.id,
    session_id: `session_${student.nama_lengkap.replace(/\s+/g, '_')}_${subcourse.id}_${sessionIndex}_${Date.now()}`,
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
      per_second_data: generatePerSecondData(watchedDuration, distractedCount, yawnCount, eyesClosedCount),
      student_profile: studentProfile.type,
      material_difficulty: materialDifficulty,
      session_quality: attentionPercentage >= 80 ? 'good' : attentionPercentage >= 60 ? 'average' : 'poor'
    }
  };
}

// Get student performance profile
function getStudentProfile(studentName) {
  const profiles = {
    'excellent': { distractionRate: 0.05, type: 'excellent_student' },
    'good': { distractionRate: 0.10, type: 'good_student' },
    'average': { distractionRate: 0.15, type: 'average_student' },
    'struggling': { distractionRate: 0.25, type: 'struggling_student' }
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
  if (title.includes('pengenalan') || title.includes('dasar') || title.includes('mengenal')) return 0.8;
  if (title.includes('lanjut') || title.includes('kompleks') || title.includes('sulit')) return 1.5;
  if (title.includes('quiz') || title.includes('ujian') || title.includes('test')) return 1.3;
  return 1.0;
}

// Generate realistic per-second data
function generatePerSecondData(duration, distractedCount, yawnCount, eyesClosedCount) {
  const data = [];
  let distractedUsed = 0;
  let yawnUsed = 0;
  let eyesClosedUsed = 0;

  for (let i = 1; i <= duration; i++) {
    const shouldBeDistracted = distractedUsed < distractedCount && Math.random() < 0.03;
    const shouldYawn = yawnUsed < yawnCount && shouldBeDistracted && Math.random() < 0.4;
    const shouldCloseEyes = eyesClosedUsed < eyesClosedCount && Math.random() < 0.01;

    data.push({
      timestamp: i,
      distracted: shouldBeDistracted,
      yawn: shouldYawn,
      eyes_closed: shouldCloseEyes
    });

    if (shouldBeDistracted) distractedUsed++;
    if (shouldYawn) yawnUsed++;
    if (shouldCloseEyes) eyesClosedUsed++;
  }

  return data;
}

// Calculate analytics statistics
async function calculateAnalyticsStats() {
  try {
    const { sequelize } = require('../../../config/database');
    
    const [avgAttentionResult] = await sequelize.query(`
      SELECT AVG(attention_percentage) as avg_attention
      FROM student_analytics
    `);
    
    return {
      avgAttention: Math.round(avgAttentionResult[0]?.avg_attention || 85)
    };
  } catch (error) {
    return { avgAttention: 85 };
  }
}

if (require.main === module) {
  require('dotenv').config();
  const { sequelize } = require('../../../config/database');
  const { User, Course } = require('../../../models');
  
  const runAnalyticsSeeding = async () => {
    try {
      await sequelize.authenticate();
      
      const teacher = await User.findOne({ where: { role: 'teacher' } });
      const students = await User.findAll({ where: { role: 'student' } });
      const courses = await Course.findAll();
      
      if (!teacher || students.length === 0 || courses.length === 0) {
        throw new Error('Missing prerequisite data. Run users and courses seeders first.');
      }
      
      await seedAnalytics({ teacher, students }, courses);
      console.log('✅ Analytics seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Analytics seeding failed:', error);
      process.exit(1);
    }
  };
  
  runAnalyticsSeeding();
}

module.exports = seedAnalytics;