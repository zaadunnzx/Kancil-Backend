require('dotenv').config();
const { sequelize } = require('../../../config/database');

// Import seeding modules
const seedUsers = require('./users');
const seedCourses = require('./courses');
const seedAnalytics = require('./analytics');
const seedQuiz = require('./quiz');

const seedAllData = async () => {
  try {
    console.log('🌱 Starting comprehensive data seeding...\n');

    // Check database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Ensure all models are synced
    await sequelize.sync();
    console.log('✅ Database models synchronized');

    // Run seeding in order (maintaining referential integrity)
    console.log('\n📊 Seeding data in order...');

    // 1. Users (foundation data)
    console.log('1. 👥 Seeding users...');
    const users = await seedUsers();
    console.log('   ✅ Users seeded successfully');

    // 2. Courses and SubCourses
    console.log('2. 📚 Seeding courses...');
    const courses = await seedCourses(users.teacher, users.students);
    console.log('   ✅ Courses seeded successfully');

    // 3. Quiz data
    console.log('3. 🎯 Seeding quiz questions...');
    await seedQuiz(courses);
    console.log('   ✅ Quiz data seeded successfully');

    // 4. Analytics data (depends on everything else)
    console.log('4. 📈 Seeding analytics data...');
    await seedAnalytics(users, courses);
    console.log('   ✅ Analytics data seeded successfully');

    console.log('\n🎉 All data seeded successfully!');
    
    // Display useful information
    console.log('\n=== 🔑 LOGIN CREDENTIALS ===');
    console.log('Teacher:');
    console.log('  Email: teacher@kancil.com');
    console.log('  Password: teacher123');
    console.log('\nStudents:');
    users.students.forEach((student, index) => {
      console.log(`  Student ${index + 1}: student${index + 1}@kancil.com / student123`);
    });
    console.log('\n=== 📚 COURSE CODES ===');
    courses.forEach(course => {
      console.log(`  ${course.subject}: ${course.course_code}`);
    });
    console.log('===============================\n');

    console.log('✅ Ready to start development!');
    console.log('   → Start server: npm run dev');
    console.log('   → Test API: import postman/Kancil_AI_Complete_Collection.json');
    console.log('   → Health check: GET http://localhost:5001/api/health');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure database is set up: node scripts/database/setup.js');
    console.error('2. Check database credentials in .env');
    console.error('3. Verify PostgreSQL is running');
    process.exit(1);
  }
};

// Allow running individual seeders
const runIndividualSeeder = async (seederName) => {
  try {
    await sequelize.authenticate();
    
    switch (seederName) {
      case 'users':
        console.log('🌱 Seeding users only...');
        await seedUsers();
        break;
      case 'courses':
        console.log('🌱 Seeding courses only...');
        const teacher = await require('../../../models').User.findOne({ where: { role: 'teacher' } });
        const students = await require('../../../models').User.findAll({ where: { role: 'student' } });
        if (!teacher) throw new Error('No teacher found. Run users seeder first.');
        await seedCourses(teacher, students);
        break;
      case 'analytics':
        console.log('🌱 Seeding analytics only...');
        const allUsers = {
          teacher: await require('../../../models').User.findOne({ where: { role: 'teacher' } }),
          students: await require('../../../models').User.findAll({ where: { role: 'student' } })
        };
        const allCourses = await require('../../../models').Course.findAll();
        await seedAnalytics(allUsers, allCourses);
        break;
      case 'quiz':
        console.log('🌱 Seeding quiz only...');
        const existingCourses = await require('../../../models').Course.findAll();
        await seedQuiz(existingCourses);
        break;
      default:
        console.log('❌ Unknown seeder. Available: users, courses, analytics, quiz');
        process.exit(1);
    }
    
    console.log('✅ Individual seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Individual seeding failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  const seederName = process.argv[2];
  
  if (seederName) {
    runIndividualSeeder(seederName);
  } else {
    seedAllData();
  }
}

module.exports = {
  seedAllData,
  seedUsers,
  seedCourses,
  seedAnalytics,
  seedQuiz
};