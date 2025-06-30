require('dotenv').config();
const { sequelize } = require('../config/database');

const quickSetupAnalytics = async () => {
  try {
    console.log('🔧 Quick Analytics Setup - Fixing Missing Data...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check current state
    const { User, Course, SubCourse, StudentEnrollment } = require('../models');
    
    const teacherCount = await User.count({ where: { role: 'teacher' } });
    const studentCount = await User.count({ where: { role: 'student' } });
    const courseCount = await Course.count();
    const subcourseCount = await SubCourse.count();
    const enrollmentCount = await StudentEnrollment.count();

    console.log('\n📊 Current Database State:');
    console.log(`   - Teachers: ${teacherCount}`);
    console.log(`   - Students: ${studentCount}`);
    console.log(`   - Courses: ${courseCount}`);
    console.log(`   - SubCourses: ${subcourseCount}`);
    console.log(`   - Enrollments: ${enrollmentCount}`);

    if (teacherCount === 0 || studentCount === 0 || courseCount === 0) {
      console.log('\n❌ Critical data missing! Running main seed is required.');
      console.log('\n🔧 Please run these commands in order:');
      console.log('   1. npm run setup-fresh     # Reset database');
      console.log('   2. npm run seed            # Create basic data');
      console.log('   3. node scripts/seed-analytics.js  # Create analytics data');
      console.log('\n💡 After that, your API will work with real data!');
      process.exit(1);
    }

    // If basic data exists, check analytics table
    try {
      await sequelize.query('SELECT 1 FROM student_analytics LIMIT 1');
      console.log('✅ student_analytics table exists');
      
      // Run analytics seeding directly
      console.log('\n🌱 Basic data found. Running analytics seeding...');
      require('./seed-analytics.js');
      
    } catch (error) {
      console.log('\n❌ student_analytics table missing!');
      console.log('\n📋 Manual Steps Required:');
      console.log('1. Open pgAdmin');
      console.log('2. Connect to your database');
      console.log('3. Run SQL script: database/create-student-analytics.sql');
      console.log('4. Then run: node scripts/seed-analytics.js');
      console.log('\n💡 This will create the analytics table and sample data.');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your .env database credentials');
    console.log('3. Ensure database exists');
    console.log('\nRun: npm run setup-fresh (to reset everything)');
    process.exit(1);
  }
};

quickSetupAnalytics();