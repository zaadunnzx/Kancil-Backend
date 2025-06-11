const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { QuizBank, QuizSession, QuizAnswer, QuizResult, QuizSettings, SubCourse, Course, User, StudentEnrollment, StudentSubCourseProgress } = require('../models');
const crypto = require('crypto');

// ==========================================
// TEACHER ENDPOINTS - Quiz Management
// ==========================================

// Get quiz settings for a subcourse
router.get('/subcourse/:id/settings', authenticate, authorize('teacher'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify subcourse belongs to teacher
    const subcourse = await SubCourse.findOne({
      where: { id },
      include: [{
        model: Course,
        as: 'course',
        where: { teacher_id: req.user.id_user }
      }]
    });
    
    if (!subcourse) {
      return res.status(404).json({ error: 'SubCourse not found or access denied' });
    }
    
    let settings = await QuizSettings.findOne({
      where: { subcourse_id: id }
    });
    
    if (!settings) {
      // Create default settings
      settings = await QuizSettings.create({
        subcourse_id: id,
        total_questions_in_pool: 30,
        questions_per_attempt: 10,
        time_limit_minutes: 60
      });
    }
    
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

// Update quiz settings
router.put('/subcourse/:id/settings', authenticate, authorize('teacher'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      total_questions_in_pool, 
      questions_per_attempt, 
      time_limit_minutes, 
      max_attempts,
      shuffle_questions,
      shuffle_options,
      show_results_immediately 
    } = req.body;
    
    // Verify subcourse belongs to teacher
    const subcourse = await SubCourse.findOne({
      where: { id },
      include: [{
        model: Course,
        as: 'course',
        where: { teacher_id: req.user.id_user }
      }]
    });
    
    if (!subcourse) {
      return res.status(404).json({ error: 'SubCourse not found or access denied' });
    }
    
    const [settings] = await QuizSettings.upsert({
      subcourse_id: id,
      total_questions_in_pool,
      questions_per_attempt,
      time_limit_minutes,
      max_attempts,
      shuffle_questions,
      shuffle_options,
      show_results_immediately
    });
    
    res.json({ 
      message: 'Quiz settings updated successfully',
      settings 
    });
  } catch (error) {
    next(error);
  }
});

// Get all questions for a quiz subcourse
router.get('/subcourse/:id/questions', authenticate, authorize('teacher'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify subcourse belongs to teacher
    const subcourse = await SubCourse.findOne({
      where: { id },
      include: [{
        model: Course,
        as: 'course',
        where: { teacher_id: req.user.id_user }
      }]
    });
    
    if (!subcourse) {
      return res.status(404).json({ error: 'SubCourse not found or access denied' });
    }
    
    const questions = await QuizBank.findAll({
      where: { subcourse_id: id },
      order: [['difficulty_level', 'ASC'], ['id', 'ASC']]
    });
    
    const questionStats = {
      total: questions.length,
      easy: questions.filter(q => q.difficulty_level === 'easy').length,
      medium: questions.filter(q => q.difficulty_level === 'medium').length,
      hard: questions.filter(q => q.difficulty_level === 'hard').length
    };
    
    res.json({ 
      questions,
      stats: questionStats
    });
  } catch (error) {
    next(error);
  }
});

// Create new question
router.post('/subcourse/:id/questions', authenticate, authorize('teacher'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      difficulty_level,
      points = 10
    } = req.body;
    
    // Verify subcourse belongs to teacher
    const subcourse = await SubCourse.findOne({
      where: { id },
      include: [{
        model: Course,
        as: 'course',
        where: { teacher_id: req.user.id_user }
      }]
    });
    
    if (!subcourse) {
      return res.status(404).json({ error: 'SubCourse not found or access denied' });
    }
    
    const question = await QuizBank.create({
      subcourse_id: id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer: correct_answer.toUpperCase(),
      difficulty_level,
      points
    });
    
    res.status(201).json({
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    next(error);
  }
});

// Update question
router.put('/questions/:questionId', authenticate, authorize('teacher'), async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      difficulty_level,
      points
    } = req.body;
    
    // Find question and verify ownership
    const question = await QuizBank.findOne({
      where: { id: questionId },
      include: [{
        model: SubCourse,
        as: 'subcourse',
        include: [{
          model: Course,
          as: 'course',
          where: { teacher_id: req.user.id_user }
        }]
      }]
    });
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found or access denied' });
    }
    
    await question.update({
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer: correct_answer.toUpperCase(),
      difficulty_level,
      points
    });
    
    res.json({
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    next(error);
  }
});

// Delete question
router.delete('/questions/:questionId', authenticate, authorize('teacher'), async (req, res, next) => {
  try {
    const { questionId } = req.params;
    
    // Find question and verify ownership
    const question = await QuizBank.findOne({
      where: { id: questionId },
      include: [{
        model: SubCourse,
        as: 'subcourse',
        include: [{
          model: Course,
          as: 'course',
          where: { teacher_id: req.user.id_user }
        }]
      }]
    });
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found or access denied' });
    }
    
    await question.destroy();
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get quiz results for teacher
router.get('/subcourse/:id/results', authenticate, authorize('teacher'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify subcourse belongs to teacher
    const subcourse = await SubCourse.findOne({
      where: { id },
      include: [{
        model: Course,
        as: 'course',
        where: { teacher_id: req.user.id_user }
      }]
    });
    
    if (!subcourse) {
      return res.status(404).json({ error: 'SubCourse not found or access denied' });
    }
    
    const results = await QuizResult.findAll({
      where: { subcourse_id: id },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id_user', 'nama_lengkap', 'kelas']
        }
      ],
      order: [['completed_at', 'DESC']]
    });
    
    // Group by student (keep latest attempt only)
    const latestResults = {};
    results.forEach(result => {
      const studentId = result.student_id;
      if (!latestResults[studentId] || result.attempt_number > latestResults[studentId].attempt_number) {
        latestResults[studentId] = result;
      }
    });
    
    const stats = {
      total_attempts: results.length,
      unique_students: Object.keys(latestResults).length,
      average_score: results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.final_score, 0) / results.length)
        : 0
    };
    
    res.json({ 
      results: Object.values(latestResults),
      stats
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// STUDENT ENDPOINTS - Quiz Taking
// ==========================================

// Start new quiz session
router.post('/subcourse/:id/start', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id_user;
    
    // Verify student is enrolled in the course
    const subcourse = await SubCourse.findOne({
      where: { id },
      include: [{
        model: Course,
        as: 'course',
        include: [{
          model: StudentEnrollment,
          as: 'enrollments',
          where: { student_id: studentId },
          required: true
        }]
      }]
    });
    
    if (!subcourse) {
      return res.status(404).json({ error: 'Quiz not found or you are not enrolled' });
    }
    
    // Get quiz settings
    const settings = await QuizSettings.findOne({
      where: { subcourse_id: id }
    });
    
    if (!settings) {
      return res.status(400).json({ error: 'Quiz settings not configured' });
    }
    
    // Check max attempts
    if (settings.max_attempts) {
      const existingAttempts = await QuizSession.count({
        where: { 
          student_id: studentId,
          subcourse_id: id,
          status: 'completed'
        }
      });
      
      if (existingAttempts >= settings.max_attempts) {
        return res.status(400).json({ 
          error: `Maximum attempts (${settings.max_attempts}) reached` 
        });
      }
    }
    
    // Get questions from bank
    const allQuestions = await QuizBank.findAll({
      where: { subcourse_id: id }
    });
    
    if (allQuestions.length < settings.questions_per_attempt) {
      return res.status(400).json({ 
        error: 'Not enough questions in the bank to start quiz' 
      });
    }
    
    // Randomly select questions ensuring all difficulty levels
    const easyQuestions = allQuestions.filter(q => q.difficulty_level === 'easy');
    const mediumQuestions = allQuestions.filter(q => q.difficulty_level === 'medium');
    const hardQuestions = allQuestions.filter(q => q.difficulty_level === 'hard');
    
    // Calculate distribution (ensure at least 1 from each level if available)
    const questionsPerDifficulty = Math.floor(settings.questions_per_attempt / 3);
    const remainder = settings.questions_per_attempt % 3;
    
    let selectedQuestions = [];
    
    // Select from each difficulty level
    selectedQuestions.push(...getRandomItems(easyQuestions, Math.min(questionsPerDifficulty + (remainder > 0 ? 1 : 0), easyQuestions.length)));
    selectedQuestions.push(...getRandomItems(mediumQuestions, Math.min(questionsPerDifficulty + (remainder > 1 ? 1 : 0), mediumQuestions.length)));
    selectedQuestions.push(...getRandomItems(hardQuestions, Math.min(questionsPerDifficulty, hardQuestions.length)));
    
    // If we don't have enough, fill from any available
    while (selectedQuestions.length < settings.questions_per_attempt && selectedQuestions.length < allQuestions.length) {
      const remaining = allQuestions.filter(q => !selectedQuestions.find(sq => sq.id === q.id));
      if (remaining.length > 0) {
        selectedQuestions.push(remaining[Math.floor(Math.random() * remaining.length)]);
      } else {
        break;
      }
    }
    
    // Shuffle questions if enabled
    if (settings.shuffle_questions) {
      selectedQuestions = shuffleArray(selectedQuestions);
    }    // Prepare questions with shuffled options
    const questionsAssigned = selectedQuestions.map(q => {
      let options = [
        { key: 'A', text: q.option_a },
        { key: 'B', text: q.option_b },
        { key: 'C', text: q.option_c },
        { key: 'D', text: q.option_d }
      ];
      
      // Shuffle options if enabled and track correct answer
      let correctAnswerKey = q.correct_answer;
      
      if (settings.shuffle_options) {
        // Create mapping of original to new keys
        const originalOrder = ['A', 'B', 'C', 'D'];
        const shuffledOrder = [...originalOrder].sort(() => Math.random() - 0.5);
        
        // Find where the correct answer moved to
        const originalIndex = originalOrder.indexOf(q.correct_answer);
        correctAnswerKey = shuffledOrder[originalIndex];
        
        // Create new shuffled options
        const shuffledOptions = shuffledOrder.map((newKey, index) => ({
          key: newKey,
          text: options[originalOrder.indexOf(shuffledOrder[index])].text
        }));
        
        options = shuffledOptions;
      }
      
      return {
        question_id: q.id,
        question_text: q.question_text,
        options: options,
        correct_answer_key: correctAnswerKey,
        difficulty_level: q.difficulty_level,
        points: q.points
      };
    });
    
    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Get current attempt number
    const lastAttempt = await QuizSession.findOne({
      where: { 
        student_id: studentId,
        subcourse_id: id
      },
      order: [['attempt_number', 'DESC']]
    });
    
    const attemptNumber = lastAttempt ? lastAttempt.attempt_number + 1 : 1;
    
    // Create quiz session
    const session = await QuizSession.create({
      student_id: studentId,
      subcourse_id: id,
      session_token: sessionToken,
      questions_assigned: questionsAssigned,
      time_limit_minutes: settings.time_limit_minutes,
      status: 'active',
      start_time: new Date(),
      attempt_number: attemptNumber,
      total_questions: selectedQuestions.length
    });
      // Prepare response (exclude correct answers)
    const questionsForStudent = questionsAssigned.map(q => ({
      question_id: q.question_id,
      question_text: q.question_text,
      options: q.options.map(opt => ({ key: opt.key, text: opt.text })),
      points: q.points,
      difficulty_level: q.difficulty_level
    }));
    
    res.json({
      session_id: session.id,
      session_token: sessionToken,
      questions: questionsForStudent,
      time_limit_minutes: settings.time_limit_minutes,
      total_questions: selectedQuestions.length,
      attempt_number: attemptNumber,
      instructions: 'Answer all questions within the time limit. You can change your answers before submitting.',      debug_info: {
        message: 'Use question_id from this response when submitting answers',
        example_body: {
          question_id: questionsForStudent[0]?.question_id,
          selected_answer: 'A'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Submit answer for a question
router.post('/sessions/:sessionId/answer', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { question_id, selected_answer } = req.body;
    const studentId = req.user.id_user;
    
    // Validate input
    if (!question_id || !selected_answer) {
      return res.status(400).json({ 
        error: 'question_id and selected_answer are required' 
      });
    }
    
    if (!['A', 'B', 'C', 'D'].includes(selected_answer)) {
      return res.status(400).json({ 
        error: 'selected_answer must be A, B, C, or D' 
      });
    }
    
    // Verify session belongs to student and is active
    const session = await QuizSession.findOne({
      where: {
        id: sessionId,
        student_id: studentId,
        status: 'active'
      }
    });
    
    if (!session) {
      return res.status(404).json({ 
        error: 'Quiz session not found or not active' 
      });
    }
    
    // Check if session has expired
    const now = new Date();
    const sessionStart = new Date(session.start_time);
    const timeElapsed = (now - sessionStart) / (1000 * 60); // minutes
    
    if (timeElapsed > session.time_limit_minutes) {
      await session.update({ status: 'expired' });
      return res.status(400).json({ 
        error: 'Quiz session has expired' 
      });
    }
    
    // Find question in session's assigned questions
    const assignedQuestions = session.questions_assigned || [];
    const questionData = assignedQuestions.find(q => q.question_id === parseInt(question_id));
    
    if (!questionData) {
      return res.status(404).json({ 
        error: 'Question not found in this session',
        debug: {
          provided_question_id: question_id,
          available_question_ids: assignedQuestions.map(q => q.question_id)
        }
      });
    }
    
    // Check if answer is correct
    const isCorrect = selected_answer === questionData.correct_answer_key;
    
    // Save or update answer
    const [answer, created] = await QuizAnswer.findOrCreate({
      where: {
        session_id: sessionId,
        question_id: parseInt(question_id)
      },
      defaults: {
        session_id: sessionId,
        question_id: parseInt(question_id),
        selected_answer,
        is_correct: isCorrect,
        answered_at: new Date()
      }
    });
    
    if (!created) {
      await answer.update({
        selected_answer,
        is_correct: isCorrect,
        answered_at: new Date()
      });
    }
    
    res.json({
      message: created ? 'Answer submitted successfully' : 'Answer updated successfully',
      answer: {
        question_id: parseInt(question_id),
        selected_answer,
        is_correct: isCorrect,
        answered_at: answer.answered_at
      },
      session_info: {
        time_remaining_minutes: Math.max(0, session.time_limit_minutes - timeElapsed)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Submit entire quiz
router.post('/sessions/:sessionId/submit', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const studentId = req.user.id_user;
    
    // Verify session belongs to student and is active
    const session = await QuizSession.findOne({
      where: {
        id: sessionId,
        student_id: studentId,
        status: 'active'
      }
    });
    
    if (!session) {
      return res.status(404).json({ 
        error: 'Quiz session not found or not active' 
      });
    }
    
    // Get all answers for this session
    const answers = await QuizAnswer.findAll({
      where: { session_id: sessionId }
    });
    
    // Calculate score
    const correctAnswers = answers.filter(a => a.is_correct).length;
    const totalQuestions = session.total_questions;
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Calculate time taken
    const now = new Date();
    const timeTakenMinutes = Math.round((now - session.start_time) / (1000 * 60));
    
    // Update session status
    await session.update({
      status: 'completed',
      end_time: now
    });
    
    // Create quiz result
    const result = await QuizResult.create({
      session_id: sessionId,
      student_id: studentId,
      subcourse_id: session.subcourse_id,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      final_score: finalScore,
      time_taken_minutes: timeTakenMinutes,
      attempt_number: session.attempt_number
    });
    
    // Update student progress untuk SubCourse
    await StudentSubCourseProgress.upsert({
      sub_course_id: session.subcourse_id,
      enrollment_student_id: studentId,
      enrollment_course_id: (await SubCourse.findByPk(session.subcourse_id)).course_id,
      status: 'completed',
      score: finalScore,
      completed_at: new Date(),
      last_accessed_at: new Date()
    });
    
    // Get quiz settings to check if results should be shown immediately
    const settings = await QuizSettings.findOne({
      where: { subcourse_id: session.subcourse_id }
    });
    
    let responseData = {
      message: 'Quiz submitted successfully',
      session_id: sessionId,
      final_score: finalScore,
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      time_taken_minutes: timeTakenMinutes,
      attempt_number: session.attempt_number
    };
    
    // Include detailed results if enabled
    if (settings && settings.show_results_immediately) {
      const detailedAnswers = await QuizAnswer.findAll({
        where: { session_id: sessionId },
        include: [{
          model: QuizBank,
          as: 'question',
          attributes: ['question_text', 'correct_answer', 'difficulty_level']
        }]
      });
      
      responseData.detailed_results = detailedAnswers.map(answer => ({
        question_text: answer.question.question_text,
        selected_answer: answer.selected_answer,
        correct_answer: answer.question.correct_answer,
        is_correct: answer.is_correct,
        difficulty_level: answer.question.difficulty_level
      }));
    }
    
    res.json(responseData);
  } catch (error) {
    next(error);
  }
});

// Get student's quiz history
router.get('/student/history/:subcourseId', authenticate, async (req, res, next) => {
  try {
    const { subcourseId } = req.params;
    const studentId = req.user.id_user;
    
    // Verify student is enrolled
    const subcourse = await SubCourse.findOne({
      where: { id: subcourseId },
      include: [{
        model: Course,
        as: 'course',
        include: [{
          model: StudentEnrollment,
          as: 'enrollments',
          where: { student_id: studentId },
          required: true
        }]
      }]
    });
    
    if (!subcourse) {
      return res.status(404).json({ 
        error: 'Quiz not found or you are not enrolled' 
      });
    }
    
    const results = await QuizResult.findAll({
      where: { 
        student_id: studentId,
        subcourse_id: subcourseId
      },
      order: [['attempt_number', 'DESC']]
    });
    
    // Get quiz settings
    const settings = await QuizSettings.findOne({
      where: { subcourse_id: subcourseId }
    });
    
    res.json({
      quiz_title: subcourse.title,
      attempts: results,
      settings: {
        max_attempts: settings?.max_attempts,
        questions_per_attempt: settings?.questions_per_attempt,
        time_limit_minutes: settings?.time_limit_minutes
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = router;