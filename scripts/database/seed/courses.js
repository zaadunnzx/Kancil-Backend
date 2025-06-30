const { Course, SubCourse, StudentEnrollment } = require('../../../models');

const seedCourses = async (teacher, students) => {
  try {
    console.log('   📚 Creating courses and content...');

    // Create Math course
    const [mathCourse, mathCreated] = await Course.findOrCreate({
      where: { course_code: 'MATH01' },
      defaults: {
        title: 'Matematika Kelas 1 - Bilangan',
        subject: 'Matematika',
        kelas: 1,
        teacher_id: teacher.id_user,
        course_code: 'MATH01',
        status: 'published',
        published_at: new Date(),
        start_date: new Date(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      }
    });

    if (mathCreated) {
      console.log('     ✅ Math course created');
    }

    // Create IPA course
    const [ipaCourse, ipaCreated] = await Course.findOrCreate({
      where: { course_code: 'IPA01' },
      defaults: {
        title: 'IPA Kelas 2 - Hewan dan Tumbuhan',
        subject: 'IPA',
        kelas: 2,
        teacher_id: teacher.id_user,
        course_code: 'IPA01',
        status: 'published',
        published_at: new Date(),
        start_date: new Date(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    });

    if (ipaCreated) {
      console.log('     ✅ IPA course created');
    }

    // Create subcourses for Math
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
        content_url: null,
        order_in_course: 3
      },
      {
        title: 'Pengurangan Sederhana',
        summary: 'Belajar pengurangan angka 1-10',
        content_type: 'pdf_material',
        content_url: 'https://example.com/pdf/pengurangan',
        order_in_course: 4
      }
    ];

    for (const subCourseData of mathSubCourses) {
      const [subCourse, created] = await SubCourse.findOrCreate({
        where: { 
          course_id: mathCourse.id,
          order_in_course: subCourseData.order_in_course
        },
        defaults: {
          ...subCourseData,
          course_id: mathCourse.id
        }
      });

      if (created) {
        console.log(`     ✅ Math subcourse: ${subCourseData.title}`);
      }
    }

    // Create subcourses for IPA
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
      },
      {
        title: 'Habitat Hewan',
        summary: 'Mempelajari di mana hewan tinggal',
        content_type: 'video',
        content_url: 'https://example.com/video/habitat',
        order_in_course: 3
      }
    ];

    for (const subCourseData of ipaSubCourses) {
      const [subCourse, created] = await SubCourse.findOrCreate({
        where: { 
          course_id: ipaCourse.id,
          order_in_course: subCourseData.order_in_course
        },
        defaults: {
          ...subCourseData,
          course_id: ipaCourse.id
        }
      });

      if (created) {
        console.log(`     ✅ IPA subcourse: ${subCourseData.title}`);
      }
    }

    // Enroll students in courses
    console.log('   👥 Enrolling students in courses...');
    
    const courses = [mathCourse, ipaCourse];
    
    for (const student of students) {
      for (const course of courses) {
        const [enrollment, enrollmentCreated] = await StudentEnrollment.findOrCreate({
          where: {
            student_id: student.id_user,
            course_id: course.id
          },
          defaults: {
            student_id: student.id_user,
            course_id: course.id,
            enrollment_date: new Date(),
            status: 'active'
          }
        });

        if (enrollmentCreated) {
          console.log(`     ✅ ${student.nama_lengkap} enrolled in ${course.title}`);
        }
      }
    }

    console.log(`   📊 Created ${courses.length} courses with subcourses and enrollments`);

    return courses;

  } catch (error) {
    console.error('   ❌ Course seeding failed:', error.message);
    throw error;
  }
};

if (require.main === module) {
  require('dotenv').config();
  const { sequelize } = require('../../../config/database');
  const { User } = require('../../../models');
  
  const runCourseSeeding = async () => {
    try {
      await sequelize.authenticate();
      
      // Get existing users
      const teacher = await User.findOne({ where: { role: 'teacher' } });
      const students = await User.findAll({ where: { role: 'student' } });
      
      if (!teacher) {
        throw new Error('No teacher found. Run users seeder first.');
      }
      
      if (students.length === 0) {
        throw new Error('No students found. Run users seeder first.');
      }
      
      const result = await seedCourses(teacher, students);
      console.log('✅ Course seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Course seeding failed:', error);
      process.exit(1);
    }
  };
  
  runCourseSeeding();
}

module.exports = seedCourses;