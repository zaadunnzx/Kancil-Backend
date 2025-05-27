require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { User, Course, SubCourse } = require('../models');

const seedData = async () => {
  try {
    // Connect and ensure all tables exist
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models first to ensure tables exist
    await sequelize.sync({ force: false });
    console.log('Database tables synchronized.');
    
    console.log('Starting database seeding...');

    // Create sample teacher
    const teacherPassword = await bcrypt.hash('teacher123', 12);
    const teacher = await User.findOrCreate({
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

    // Create sample students
    const studentPassword = await bcrypt.hash('student123', 12);
    const students = [];
    
    for (let i = 1; i <= 3; i++) {
      const student = await User.findOrCreate({
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
      students.push(student[0]);
    }

    console.log('Users created successfully');

    // Create sample courses
    const mathCourse = await Course.findOrCreate({
      where: { course_code: 'MATH01' },
      defaults: {
        title: 'Matematika Kelas 1 - Bilangan',
        subject: 'Matematika',
        kelas: 1,
        teacher_id: teacher[0].id_user,
        course_code: 'MATH01',
        status: 'published',
        published_at: new Date()
      }
    });

    const ipaCourse = await Course.findOrCreate({
      where: { course_code: 'IPA01' },
      defaults: {
        title: 'IPA Kelas 2 - Hewan dan Tumbuhan',
        subject: 'IPA',
        kelas: 2,
        teacher_id: teacher[0].id_user,
        course_code: 'IPA01',
        status: 'published',
        published_at: new Date()
      }
    });

    console.log('Courses created successfully');

    // Create sample subcourses for Math
    const mathSubCourses = [
      {
        title: 'Mengenal Angka 1-10',
        summary: 'Belajar mengenal dan menulis angka 1 sampai 10',
        content_type: 'video',
        content_url: 'https://example.com/video/angka-1-10',
        order_in_course: 1
      },
      {
        title: 'Penjumlahan Sederhana',
        summary: 'Belajar penjumlahan angka 1-10',
        content_type: 'video',
        content_url: 'https://example.com/video/penjumlahan',
        order_in_course: 2
      },
      {
        title: 'Kuis Angka',
        summary: 'Kuis untuk menguji pemahaman angka',
        content_type: 'quiz',
        content_url: 'https://example.com/quiz/angka',
        order_in_course: 3
      }
    ];

    for (const subCourseData of mathSubCourses) {
      await SubCourse.findOrCreate({
        where: { 
          course_id: mathCourse[0].id,
          order_in_course: subCourseData.order_in_course
        },
        defaults: {
          ...subCourseData,
          course_id: mathCourse[0].id
        }
      });
    }

    // Create sample subcourses for IPA
    const ipaSubCourses = [
      {
        title: 'Mengenal Hewan Peliharaan',
        summary: 'Belajar tentang berbagai hewan peliharaan',
        content_type: 'video',
        content_url: 'https://example.com/video/hewan-peliharaan',
        order_in_course: 1
      },
      {
        title: 'Bagian-bagian Tumbuhan',
        summary: 'Mempelajari akar, batang, daun, bunga',
        content_type: 'pdf_material',
        content_url: 'https://example.com/pdf/bagian-tumbuhan',
        order_in_course: 2
      }
    ];

    for (const subCourseData of ipaSubCourses) {
      await SubCourse.findOrCreate({
        where: { 
          course_id: ipaCourse[0].id,
          order_in_course: subCourseData.order_in_course
        },
        defaults: {
          ...subCourseData,
          course_id: ipaCourse[0].id
        }
      });
    }

    console.log('SubCourses created successfully');
    console.log('\n=== SAMPLE LOGIN CREDENTIALS ===');
    console.log('Teacher:');
    console.log('Email: teacher@kancil.com');
    console.log('Password: teacher123');
    console.log('\nStudents:');
    console.log('Email: student1@kancil.com, Password: student123');
    console.log('Email: student2@kancil.com, Password: student123');
    console.log('Email: student3@kancil.com, Password: student123');
    console.log('\nCourse Codes:');
    console.log('Math: MATH01');
    console.log('IPA: IPA01');
    console.log('===============================');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();