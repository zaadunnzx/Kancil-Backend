const bcrypt = require('bcryptjs');
const { User } = require('../../../models');

const seedUsers = async () => {
  try {
    console.log('   🔑 Creating users...');

    // Create teacher
    const teacherPassword = await bcrypt.hash('teacher123', 12);
    const [teacher, teacherCreated] = await User.findOrCreate({
      where: { email: 'teacher@kancil.com' },
      defaults: {
        nama_lengkap: 'Pak Guru',
        email: 'teacher@kancil.com',
        password_hash: teacherPassword,
        role: 'teacher',
        nama_sekolah: 'SD Kancil',
        status: 'active'
      }
    });

    if (teacherCreated) {
      console.log('     ✅ Teacher created');
    } else {
      console.log('     ℹ️  Teacher already exists');
    }

    // Create students
    const studentPassword = await bcrypt.hash('student123', 12);
    const students = [];
    
    for (let i = 1; i <= 3; i++) {
      const [student, studentCreated] = await User.findOrCreate({
        where: { email: `student${i}@kancil.com` },
        defaults: {
          nama_lengkap: `Siswa ${i}`,
          email: `student${i}@kancil.com`,
          password_hash: studentPassword,
          role: 'student',
          kelas: Math.floor(Math.random() * 3) + 1, // Random class 1-3
          nama_sekolah: 'SD Kancil',
          status: 'active'
        }
      });
      
      students.push(student);
      
      if (studentCreated) {
        console.log(`     ✅ Student ${i} created`);
      } else {
        console.log(`     ℹ️  Student ${i} already exists`);
      }
    }

    // Create additional students for testing
    for (let i = 4; i <= 6; i++) {
      const [student, studentCreated] = await User.findOrCreate({
        where: { email: `student${i}@kancil.com` },
        defaults: {
          nama_lengkap: `Siswa ${i}`,
          email: `student${i}@kancil.com`,
          password_hash: studentPassword,
          role: 'student',
          kelas: Math.floor(Math.random() * 3) + 1,
          nama_sekolah: 'SD Kancil',
          status: 'active'
        }
      });
      
      students.push(student);
      
      if (studentCreated) {
        console.log(`     ✅ Additional student ${i} created`);
      }
    }

    console.log(`   📊 Total users: 1 teacher + ${students.length} students`);

    return {
      teacher,
      students
    };

  } catch (error) {
    console.error('   ❌ User seeding failed:', error.message);
    throw error;
  }
};

if (require.main === module) {
  require('dotenv').config();
  const { sequelize } = require('../../../config/database');
  
  const runUserSeeding = async () => {
    try {
      await sequelize.authenticate();
      const result = await seedUsers();
      console.log('✅ User seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('❌ User seeding failed:', error);
      process.exit(1);
    }
  };
  
  runUserSeeding();
}

module.exports = seedUsers;