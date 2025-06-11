require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { 
  User, 
  Course, 
  SubCourse, 
  StudentEnrollment,
  QuizBank,
  QuizSettings,
  StudentSubCourseProgress
} = require('../models');

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

    // Enroll students in courses
    console.log('Creating student enrollments...');
    for (const student of students) {
      await StudentEnrollment.findOrCreate({
        where: {
          student_id: student.id_user,
          course_id: mathCourse[0].id
        },
        defaults: {
          student_id: student.id_user,
          course_id: mathCourse[0].id,
          enrolled_at: new Date()
        }
      });

      await StudentEnrollment.findOrCreate({
        where: {
          student_id: student.id_user,
          course_id: ipaCourse[0].id
        },
        defaults: {
          student_id: student.id_user,
          course_id: ipaCourse[0].id,
          enrolled_at: new Date()
        }
      });
    }
    console.log('Student enrollments created successfully');

    // Find quiz subcourses and create quiz settings & questions
    console.log('Setting up quiz system...');
    
    const quizSubCourses = await SubCourse.findAll({
      where: { content_type: 'quiz' }
    });

    for (const quizSubCourse of quizSubCourses) {
      // Create quiz settings
      await QuizSettings.findOrCreate({
        where: { subcourse_id: quizSubCourse.id },
        defaults: {
          subcourse_id: quizSubCourse.id,
          total_questions_in_pool: 30,
          questions_per_attempt: 10,
          time_limit_minutes: 60,
          max_attempts: null,
          shuffle_questions: true,
          shuffle_options: true,
          show_results_immediately: true
        }
      });

      // Create 30 sample quiz questions (mix of difficulties)
      const sampleQuestions = [
        // Easy questions (12 questions)
        {
          question_text: "Berapa hasil dari 2 + 3?",
          option_a: "4", option_b: "5", option_c: "6", option_d: "7",
          correct_answer: "B", difficulty_level: "easy", points: 10
        },
        {
          question_text: "Berapa hasil dari 1 + 1?",
          option_a: "1", option_b: "2", option_c: "3", option_d: "4",
          correct_answer: "B", difficulty_level: "easy", points: 10
        },
        {
          question_text: "Angka mana yang paling kecil?",
          option_a: "5", option_b: "3", option_c: "1", option_d: "4",
          correct_answer: "C", difficulty_level: "easy", points: 10
        },
        {
          question_text: "Berapa hasil dari 4 + 1?",
          option_a: "5", option_b: "6", option_c: "4", option_d: "3",
          correct_answer: "A", difficulty_level: "easy", points: 10
        },
        {
          question_text: "Berapa hasil dari 3 + 2?",
          option_a: "4", option_b: "5", option_c: "6", option_d: "7",
          correct_answer: "B", difficulty_level: "easy", points: 10
        },
        {
          question_text: "Angka mana yang paling besar?",
          option_a: "3", option_b: "7", option_c: "5", option_d: "2",
          correct_answer: "B", difficulty_level: "easy", points: 10
        },
        {
          question_text: "Berapa hasil dari 5 - 2?",
          option_a: "2", option_b: "3", option_c: "4", option_d: "5",
          correct_answer: "B", difficulty_level: "easy", points: 10
        },
        {
          question_text: "Berapa hasil dari 6 + 1?",
          option_a: "6", option_b: "7", option_c: "8", option_d: "9",
          correct_answer: "B", difficulty_level: "easy", points: 10
        },
        {
          question_text: "Berapa hasil dari 0 + 5?",
          option_a: "0", option_b: "5", option_c: "10", option_d: "15",
          correct_answer: "B", difficulty_level: "easy", points: 10
        },
        {
          question_text: "Berapa hasil dari 4 - 1?",
          option_a: "2", option_b: "3", option_c: "4", option_d: "5",
          correct_answer: "B", difficulty_level: "easy", points: 10
        },
        {
          question_text: "Berapa hasil dari 7 + 2?",
          option_a: "8", option_b: "9", option_c: "10", option_d: "11",
          correct_answer: "B", difficulty_level: "easy", points: 10
        },
        {
          question_text: "Berapa hasil dari 8 - 3?",
          option_a: "4", option_b: "5", option_c: "6", option_d: "7",
          correct_answer: "B", difficulty_level: "easy", points: 10
        },
        
        // Medium questions (12 questions)
        {
          question_text: "Berapa hasil dari 5 × 3?",
          option_a: "15", option_b: "8", option_c: "12", option_d: "20",
          correct_answer: "A", difficulty_level: "medium", points: 10
        },
        {
          question_text: "Berapa hasil dari 4 × 4?",
          option_a: "12", option_b: "16", option_c: "20", option_d: "8",
          correct_answer: "B", difficulty_level: "medium", points: 10
        },
        {
          question_text: "Berapa hasil dari 12 ÷ 3?",
          option_a: "3", option_b: "4", option_c: "5", option_d: "6",
          correct_answer: "B", difficulty_level: "medium", points: 10
        },
        {
          question_text: "Berapa hasil dari 6 × 2?",
          option_a: "10", option_b: "12", option_c: "14", option_d: "8",
          correct_answer: "B", difficulty_level: "medium", points: 10
        },
        {
          question_text: "Berapa hasil dari 15 ÷ 5?",
          option_a: "2", option_b: "3", option_c: "4", option_d: "5",
          correct_answer: "B", difficulty_level: "medium", points: 10
        },
        {
          question_text: "Berapa hasil dari 7 × 2?",
          option_a: "12", option_b: "14", option_c: "16", option_d: "18",
          correct_answer: "B", difficulty_level: "medium", points: 10
        },
        {
          question_text: "Berapa hasil dari 20 ÷ 4?",
          option_a: "4", option_b: "5", option_c: "6", option_d: "7",
          correct_answer: "B", difficulty_level: "medium", points: 10
        },
        {
          question_text: "Berapa hasil dari 3 × 5?",
          option_a: "12", option_b: "15", option_c: "18", option_d: "20",
          correct_answer: "B", difficulty_level: "medium", points: 10
        },
        {
          question_text: "Berapa hasil dari 18 ÷ 6?",
          option_a: "2", option_b: "3", option_c: "4", option_d: "5",
          correct_answer: "B", difficulty_level: "medium", points: 10
        },
        {
          question_text: "Berapa hasil dari 8 × 2?",
          option_a: "14", option_b: "16", option_c: "18", option_d: "20",
          correct_answer: "B", difficulty_level: "medium", points: 10
        },
        {
          question_text: "Berapa hasil dari 24 ÷ 8?",
          option_a: "2", option_b: "3", option_c: "4", option_d: "5",
          correct_answer: "B", difficulty_level: "medium", points: 10
        },
        {
          question_text: "Berapa hasil dari 9 × 3?",
          option_a: "24", option_b: "27", option_c: "30", option_d: "33",
          correct_answer: "B", difficulty_level: "medium", points: 10
        },

        // Hard questions (6 questions)
        {
          question_text: "Berapa hasil dari (3 + 4) × 2?",
          option_a: "10", option_b: "14", option_c: "18", option_d: "22",
          correct_answer: "B", difficulty_level: "hard", points: 10
        },
        {
          question_text: "Berapa hasil dari 15 + 8 - 5?",
          option_a: "16", option_b: "18", option_c: "20", option_d: "22",
          correct_answer: "B", difficulty_level: "hard", points: 10
        },
        {
          question_text: "Berapa hasil dari 6 × 3 - 8?",
          option_a: "8", option_b: "10", option_c: "12", option_d: "14",
          correct_answer: "B", difficulty_level: "hard", points: 10
        },
        {
          question_text: "Berapa hasil dari 20 ÷ 4 + 7?",
          option_a: "10", option_b: "12", option_c: "14", option_d: "16",
          correct_answer: "B", difficulty_level: "hard", points: 10
        },
        {
          question_text: "Berapa hasil dari (5 × 2) + (3 × 3)?",
          option_a: "17", option_b: "19", option_c: "21", option_d: "23",
          correct_answer: "B", difficulty_level: "hard", points: 10
        },
        {
          question_text: "Berapa hasil dari 25 - (3 × 4)?",
          option_a: "11", option_b: "13", option_c: "15", option_d: "17",
          correct_answer: "B", difficulty_level: "hard", points: 10
        }
      ];

      // Create each question
      for (const questionData of sampleQuestions) {
        await QuizBank.findOrCreate({
          where: {
            subcourse_id: quizSubCourse.id,
            question_text: questionData.question_text
          },
          defaults: {
            subcourse_id: quizSubCourse.id,
            ...questionData
          }
        });
      }

      console.log(`✅ Created quiz settings and 30 questions for: ${quizSubCourse.title}`);
    }

    console.log('Quiz system setup completed successfully!');
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
    console.log('===============================');    console.log('Quiz system setup completed successfully!');
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