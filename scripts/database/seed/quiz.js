const { QuizBank, QuizSettings, SubCourse } = require('../../../models');

const seedQuiz = async (courses) => {
  try {
    console.log('   🎯 Setting up quiz system...');

    // Find quiz subcourses
    const quizSubCourses = await SubCourse.findAll({
      where: { content_type: 'quiz' }
    });

    if (quizSubCourses.length === 0) {
      console.log('     ℹ️  No quiz subcourses found, skipping quiz setup');
      return;
    }

    for (const quizSubCourse of quizSubCourses) {
      console.log(`     📝 Setting up quiz: ${quizSubCourse.title}`);

      // Create quiz settings
      const [settings, settingsCreated] = await QuizSettings.findOrCreate({
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

      if (settingsCreated) {
        console.log('       ✅ Quiz settings created');
      }

      // Check existing questions
      const existingQuestions = await QuizBank.count({
        where: { subcourse_id: quizSubCourse.id }
      });

      if (existingQuestions >= 30) {
        console.log(`       ℹ️  Quiz already has ${existingQuestions} questions, skipping`);
        continue;
      }

      // Create quiz questions for Math
      const mathQuestions = [
        // Easy questions (12)
        { question: 'Berapa hasil dari 1 + 1?', options: ['1', '2', '3', '4'], correct: 'B', difficulty: 'easy' },
        { question: 'Berapa hasil dari 2 + 2?', options: ['3', '4', '5', '6'], correct: 'B', difficulty: 'easy' },
        { question: 'Berapa hasil dari 3 + 1?', options: ['3', '4', '5', '6'], correct: 'B', difficulty: 'easy' },
        { question: 'Berapa hasil dari 5 - 2?', options: ['2', '3', '4', '5'], correct: 'B', difficulty: 'easy' },
        { question: 'Berapa hasil dari 4 - 1?', options: ['2', '3', '4', '5'], correct: 'B', difficulty: 'easy' },
        { question: 'Angka berapa yang lebih besar: 5 atau 3?', options: ['3', '5', 'sama', 'tidak tahu'], correct: 'B', difficulty: 'easy' },
        { question: 'Berapa hasil dari 2 + 3?', options: ['4', '5', '6', '7'], correct: 'B', difficulty: 'easy' },
        { question: 'Berapa hasil dari 6 - 1?', options: ['4', '5', '6', '7'], correct: 'B', difficulty: 'easy' },
        { question: 'Berapa hasil dari 1 + 3?', options: ['3', '4', '5', '6'], correct: 'B', difficulty: 'easy' },
        { question: 'Berapa hasil dari 7 - 2?', options: ['4', '5', '6', '7'], correct: 'B', difficulty: 'easy' },
        { question: 'Berapa hasil dari 3 + 2?', options: ['4', '5', '6', '7'], correct: 'B', difficulty: 'easy' },
        { question: 'Berapa hasil dari 4 + 1?', options: ['4', '5', '6', '7'], correct: 'B', difficulty: 'easy' },

        // Medium questions (12)
        { question: 'Berapa hasil dari 5 + 4?', options: ['8', '9', '10', '11'], correct: 'B', difficulty: 'medium' },
        { question: 'Berapa hasil dari 8 - 3?', options: ['4', '5', '6', '7'], correct: 'B', difficulty: 'medium' },
        { question: 'Berapa hasil dari 6 + 3?', options: ['8', '9', '10', '11'], correct: 'B', difficulty: 'medium' },
        { question: 'Berapa hasil dari 10 - 4?', options: ['5', '6', '7', '8'], correct: 'B', difficulty: 'medium' },
        { question: 'Berapa hasil dari 7 + 2?', options: ['8', '9', '10', '11'], correct: 'B', difficulty: 'medium' },
        { question: 'Berapa hasil dari 9 - 1?', options: ['7', '8', '9', '10'], correct: 'B', difficulty: 'medium' },
        { question: 'Berapa hasil dari 4 + 5?', options: ['8', '9', '10', '11'], correct: 'B', difficulty: 'medium' },
        { question: 'Berapa hasil dari 10 - 2?', options: ['7', '8', '9', '10'], correct: 'B', difficulty: 'medium' },
        { question: 'Berapa hasil dari 6 + 4?', options: ['9', '10', '11', '12'], correct: 'B', difficulty: 'medium' },
        { question: 'Berapa hasil dari 9 - 3?', options: ['5', '6', '7', '8'], correct: 'B', difficulty: 'medium' },
        { question: 'Berapa hasil dari 8 + 1?', options: ['8', '9', '10', '11'], correct: 'B', difficulty: 'medium' },
        { question: 'Berapa hasil dari 7 - 1?', options: ['5', '6', '7', '8'], correct: 'B', difficulty: 'medium' },

        // Hard questions (6)
        { question: 'Berapa hasil dari 8 + 7?', options: ['14', '15', '16', '17'], correct: 'B', difficulty: 'hard' },
        { question: 'Berapa hasil dari 16 - 8?', options: ['7', '8', '9', '10'], correct: 'B', difficulty: 'hard' },
        { question: 'Berapa hasil dari 9 + 6?', options: ['14', '15', '16', '17'], correct: 'B', difficulty: 'hard' },
        { question: 'Berapa hasil dari 18 - 9?', options: ['8', '9', '10', '11'], correct: 'B', difficulty: 'hard' },
        { question: 'Berapa hasil dari 7 + 8?', options: ['14', '15', '16', '17'], correct: 'B', difficulty: 'hard' },
        { question: 'Berapa hasil dari 20 - 5?', options: ['14', '15', '16', '17'], correct: 'B', difficulty: 'hard' }
      ];

      // Clear existing questions for this subcourse
      await QuizBank.destroy({
        where: { subcourse_id: quizSubCourse.id }
      });

      // Insert new questions
      const questionsToInsert = mathQuestions.map(q => ({
        subcourse_id: quizSubCourse.id,
        question_text: q.question,
        option_a: q.options[0],
        option_b: q.options[1],
        option_c: q.options[2],
        option_d: q.options[3],
        correct_answer: q.correct,
        difficulty_level: q.difficulty,
        points: q.difficulty === 'easy' ? 5 : q.difficulty === 'medium' ? 10 : 15
      }));

      await QuizBank.bulkCreate(questionsToInsert);
      console.log(`       ✅ Created ${questionsToInsert.length} quiz questions`);

      // Verify question distribution
      const easyCount = questionsToInsert.filter(q => q.difficulty_level === 'easy').length;
      const mediumCount = questionsToInsert.filter(q => q.difficulty_level === 'medium').length;
      const hardCount = questionsToInsert.filter(q => q.difficulty_level === 'hard').length;

      console.log(`       📊 Questions: ${easyCount} easy, ${mediumCount} medium, ${hardCount} hard`);
    }

    console.log('   ✅ Quiz system setup completed');

  } catch (error) {
    console.error('   ❌ Quiz seeding failed:', error.message);
    throw error;
  }
};

if (require.main === module) {
  require('dotenv').config();
  const { sequelize } = require('../../../config/database');
  const { Course } = require('../../../models');
  
  const runQuizSeeding = async () => {
    try {
      await sequelize.authenticate();
      
      const courses = await Course.findAll();
      
      if (courses.length === 0) {
        throw new Error('No courses found. Run course seeder first.');
      }
      
      await seedQuiz(courses);
      console.log('✅ Quiz seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Quiz seeding failed:', error);
      process.exit(1);
    }
  };
  
  runQuizSeeding();
}

module.exports = seedQuiz;