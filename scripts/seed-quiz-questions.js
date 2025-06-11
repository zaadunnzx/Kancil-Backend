require('dotenv').config();
const { sequelize } = require('../config/database');
const { 
  QuizBank,
  QuizSettings,
  SubCourse,
  Course,
  User
} = require('../models');

const seedQuizQuestions = async () => {
  try {
    await sequelize.authenticate();
    console.log('🎯 Starting quiz questions seeding...');

    // Find quiz subcourse
    const quizSubCourse = await SubCourse.findOne({
      where: { content_type: 'quiz' },
      include: [{
        model: Course,
        as: 'course',
        include: [{
          model: User,
          as: 'teacher'
        }]
      }]
    });

    if (!quizSubCourse) {
      console.log('❌ No quiz subcourse found. Creating sample data...');
      
      // Create sample teacher if not exists
      const teacher = await User.findOrCreate({
        where: { email: 'teacher@kancil.com' },
        defaults: {
          nama_lengkap: 'Pak Guru',
          email: 'teacher@kancil.com',
          password_hash: '$2a$12$example.hash',
          role: 'teacher',
          nama_sekolah: 'SD Kancil',
          status: 'active'
        }
      });

      // Create sample course
      const course = await Course.findOrCreate({
        where: { course_code: 'MATH01' },
        defaults: {
          title: 'Matematika Kelas 1',
          subject: 'Matematika',
          kelas: 1,
          teacher_id: teacher[0].id_user,
          course_code: 'MATH01',
          status: 'published'
        }
      });

      // Create quiz subcourse
      const newQuizSubCourse = await SubCourse.findOrCreate({
        where: { 
          course_id: course[0].id,
          content_type: 'quiz'
        },
        defaults: {
          course_id: course[0].id,
          title: 'Kuis Matematika Dasar',
          summary: 'Kuis untuk menguji pemahaman matematika dasar',
          content_type: 'quiz',
          content_url: 'https://example.com/quiz/math-basic',
          order_in_course: 1
        }
      });

      console.log('✅ Sample course and quiz subcourse created');
      var subcourseId = newQuizSubCourse[0].id;
    } else {
      var subcourseId = quizSubCourse.id;
    }

    console.log(`📚 Processing quiz: "${quizSubCourse?.title || 'Kuis Matematika Dasar'}" (ID: ${subcourseId})`);

    // Check existing questions
    const existingQuestions = await QuizBank.count({
      where: { subcourse_id: subcourseId }
    });

    console.log(`   Existing questions: ${existingQuestions}`);

    if (existingQuestions >= 30) {
      console.log('✅ Quiz already has 30+ questions. Skipping...');
      return;
    }

    // Create quiz settings if not exists
    await QuizSettings.findOrCreate({
      where: { subcourse_id: subcourseId },
      defaults: {
        subcourse_id: subcourseId,
        total_questions_in_pool: 30,
        questions_per_attempt: 10,
        time_limit_minutes: 60,
        max_attempts: null,
        shuffle_questions: true,
        shuffle_options: true,
        show_results_immediately: true
      }
    });

    // 30 Questions for Math Quiz - Mixed difficulty levels
    const questions = [
      // EASY QUESTIONS (10)
      {
        question_text: "Berapa hasil dari 2 + 3?",
        option_a: "4",
        option_b: "5",
        option_c: "6",
        option_d: "7",
        correct_answer: "B",
        difficulty_level: "easy"
      },
      {
        question_text: "Berapa hasil dari 5 - 2?",
        option_a: "2",
        option_b: "3",
        option_c: "4",
        option_d: "7",
        correct_answer: "B",
        difficulty_level: "easy"
      },
      {
        question_text: "Angka mana yang terbesar?",
        option_a: "3",
        option_b: "7",
        option_c: "5",
        option_d: "4",
        correct_answer: "B",
        difficulty_level: "easy"
      },
      {
        question_text: "Berapa hasil dari 3 + 4?",
        option_a: "6",
        option_b: "7",
        option_c: "8",
        option_d: "9",
        correct_answer: "B",
        difficulty_level: "easy"
      },
      {
        question_text: "Berapa hasil dari 6 - 3?",
        option_a: "2",
        option_b: "3",
        option_c: "4",
        option_d: "9",
        correct_answer: "B",
        difficulty_level: "easy"
      },
      {
        question_text: "Berapa hasil dari 1 + 8?",
        option_a: "7",
        option_b: "8",
        option_c: "9",
        option_d: "10",
        correct_answer: "C",
        difficulty_level: "easy"
      },
      {
        question_text: "Berapa hasil dari 10 - 5?",
        option_a: "4",
        option_b: "5",
        option_c: "6",
        option_d: "15",
        correct_answer: "B",
        difficulty_level: "easy"
      },
      {
        question_text: "Angka mana yang terkecil?",
        option_a: "8",
        option_b: "3",
        option_c: "6",
        option_d: "9",
        correct_answer: "B",
        difficulty_level: "easy"
      },
      {
        question_text: "Berapa hasil dari 4 + 5?",
        option_a: "8",
        option_b: "9",
        option_c: "10",
        option_d: "1",
        correct_answer: "B",
        difficulty_level: "easy"
      },
      {
        question_text: "Berapa hasil dari 7 - 4?",
        option_a: "2",
        option_b: "3",
        option_c: "4",
        option_d: "11",
        correct_answer: "B",
        difficulty_level: "easy"
      },

      // MEDIUM QUESTIONS (10)
      {
        question_text: "Berapa hasil dari 3 × 4?",
        option_a: "7",
        option_b: "10",
        option_c: "12",
        option_d: "14",
        correct_answer: "C",
        difficulty_level: "medium"
      },
      {
        question_text: "Berapa hasil dari 15 ÷ 3?",
        option_a: "3",
        option_b: "4",
        option_c: "5",
        option_d: "6",
        correct_answer: "C",
        difficulty_level: "medium"
      },
      {
        question_text: "Berapa hasil dari 6 × 7?",
        option_a: "40",
        option_b: "42",
        option_c: "44",
        option_d: "48",
        correct_answer: "B",
        difficulty_level: "medium"
      },
      {
        question_text: "Berapa hasil dari 24 ÷ 4?",
        option_a: "5",
        option_b: "6",
        option_c: "7",
        option_d: "8",
        correct_answer: "B",
        difficulty_level: "medium"
      },
      {
        question_text: "Berapa hasil dari 8 × 3?",
        option_a: "21",
        option_b: "24",
        option_c: "27",
        option_d: "30",
        correct_answer: "B",
        difficulty_level: "medium"
      },
      {
        question_text: "Berapa hasil dari 35 ÷ 5?",
        option_a: "6",
        option_b: "7",
        option_c: "8",
        option_d: "9",
        correct_answer: "B",
        difficulty_level: "medium"
      },
      {
        question_text: "Berapa hasil dari 9 × 6?",
        option_a: "52",
        option_b: "54",
        option_c: "56",
        option_d: "58",
        correct_answer: "B",
        difficulty_level: "medium"
      },
      {
        question_text: "Berapa hasil dari 48 ÷ 6?",
        option_a: "7",
        option_b: "8",
        option_c: "9",
        option_d: "10",
        correct_answer: "B",
        difficulty_level: "medium"
      },
      {
        question_text: "Berapa hasil dari 7 × 8?",
        option_a: "54",
        option_b: "56",
        option_c: "58",
        option_d: "60",
        correct_answer: "B",
        difficulty_level: "medium"
      },
      {
        question_text: "Berapa hasil dari 63 ÷ 9?",
        option_a: "6",
        option_b: "7",
        option_c: "8",
        option_d: "9",
        correct_answer: "B",
        difficulty_level: "medium"
      },

      // HARD QUESTIONS (10)
      {
        question_text: "Berapa hasil dari (5 + 3) × 2?",
        option_a: "13",
        option_b: "16",
        option_c: "18",
        option_d: "20",
        correct_answer: "B",
        difficulty_level: "hard"
      },
      {
        question_text: "Berapa hasil dari 100 - (25 + 15)?",
        option_a: "55",
        option_b: "60",
        option_c: "65",
        option_d: "70",
        correct_answer: "B",
        difficulty_level: "hard"
      },
      {
        question_text: "Berapa hasil dari 12 × 3 - 6?",
        option_a: "28",
        option_b: "30",
        option_c: "32",
        option_d: "34",
        correct_answer: "B",
        difficulty_level: "hard"
      },
      {
        question_text: "Berapa hasil dari (8 × 4) ÷ 2?",
        option_a: "14",
        option_b: "16",
        option_c: "18",
        option_d: "20",
        correct_answer: "B",
        difficulty_level: "hard"
      },
      {
        question_text: "Berapa hasil dari 15 + 7 × 2?",
        option_a: "29",
        option_b: "44",
        option_c: "22",
        option_d: "37",
        correct_answer: "A",
        difficulty_level: "hard"
      },
      {
        question_text: "Berapa hasil dari 50 ÷ (5 + 5)?",
        option_a: "4",
        option_b: "5",
        option_c: "6",
        option_d: "10",
        correct_answer: "B",
        difficulty_level: "hard"
      },
      {
        question_text: "Berapa hasil dari 3 × (9 - 4)?",
        option_a: "12",
        option_b: "15",
        option_c: "18",
        option_d: "21",
        correct_answer: "B",
        difficulty_level: "hard"
      },
      {
        question_text: "Berapa hasil dari (20 - 8) ÷ 3?",
        option_a: "3",
        option_b: "4",
        option_c: "5",
        option_d: "6",
        correct_answer: "B",
        difficulty_level: "hard"
      },
      {
        question_text: "Berapa hasil dari 6 × 4 + 8?",
        option_a: "30",
        option_b: "32",
        option_c: "34",
        option_d: "36",
        correct_answer: "B",
        difficulty_level: "hard"
      },
      {
        question_text: "Berapa hasil dari (45 ÷ 9) × 7?",
        option_a: "33",
        option_b: "35",
        option_c: "37",
        option_d: "39",
        correct_answer: "B",
        difficulty_level: "hard"
      }
    ];

    // Insert questions to database
    const questionsToCreate = questions.slice(existingQuestions).map(q => ({
      ...q,
      subcourse_id: subcourseId,
      points: 10
    }));

    if (questionsToCreate.length > 0) {
      await QuizBank.bulkCreate(questionsToCreate);
      console.log(`   ✅ Created ${questionsToCreate.length} new questions`);
    }

    const totalQuestions = await QuizBank.count({
      where: { subcourse_id: subcourseId }
    });

    console.log(`   📊 Total questions now: ${totalQuestions}`);
    console.log('🎉 Quiz questions seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding quiz questions:', error);
  } finally {
    await sequelize.close();
  }
};

// Run seeding
seedQuizQuestions();