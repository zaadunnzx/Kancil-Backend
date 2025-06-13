const express = require('express');
const { Op } = require('sequelize');
const { 
  User, 
  Course, 
  SubCourse, 
  StudentEnrollment, 
  StudentSubCourseProgress, 
  ChatInteraction 
} = require('../models');
const { authenticate, teacherOnly } = require('../middleware/auth');

const router = express.Router();

// Get dashboard analytics for teachers
router.get('/dashboard', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const teacherId = req.user.id_user;

    // Get total courses created by teacher
    const totalCourses = await Course.count({
      where: { teacher_id: teacherId }
    });

    // Get total students enrolled in teacher's courses
    const totalEnrollments = await StudentEnrollment.count({
      include: [
        {
          model: Course,
          as: 'course',
          where: { teacher_id: teacherId },
          required: true
        }
      ]
    });    // Get course statistics
    const courseStats = await Course.findAll({
      where: { teacher_id: teacherId },
      include: [
        {
          model: StudentEnrollment,
          as: 'enrollments',
          attributes: []
        },
        {
          model: SubCourse,
          as: 'subcourses',
          attributes: []
        }
      ],
      attributes: [
        'id',
        'title',
        'status',
        'created_at',
        [require('sequelize').fn('COUNT', require('sequelize').fn('DISTINCT', require('sequelize').col('enrollments.student_id'))), 'student_count'],
        [require('sequelize').fn('COUNT', require('sequelize').fn('DISTINCT', require('sequelize').col('subcourses.id'))), 'subcourse_count']
      ],
      group: ['Course.id'],
      order: [['created_at', 'DESC']]
    });

    // Get recent chat interactions
    const recentInteractions = await ChatInteraction.findAll({
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id_user', 'nama_lengkap']
        },
        {
          model: SubCourse,
          as: 'subCourse',
          attributes: ['id', 'title'],
          include: [
            {
              model: Course,
              as: 'course',
              where: { teacher_id: teacherId },
              attributes: ['id', 'title']
            }
          ]
        }
      ],
      order: [['interaction_timestamp', 'DESC']],
      limit: 10
    });

    // Get student progress overview
    const progressOverview = await StudentSubCourseProgress.findAll({
      include: [
        {
          model: SubCourse,
          as: 'subCourse',
          include: [
            {
              model: Course,
              as: 'course',
              where: { teacher_id: teacherId },
              attributes: ['id', 'title']
            }
          ],
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'student',
          attributes: ['id_user', 'nama_lengkap']
        }
      ],
      attributes: [
        'status',
        'score',
        'last_accessed_at'
      ],
      order: [['last_accessed_at', 'DESC']],
      limit: 20
    });

    res.json({
      overview: {
        totalCourses,
        totalEnrollments,
        totalInteractions: recentInteractions.length
      },
      courseStats,
      recentInteractions,
      progressOverview
    });
  } catch (error) {
    next(error);
  }
});

// Get detailed course analytics
router.get('/course/:courseId', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user.id_user;

    // Verify teacher owns the course
    const course = await Course.findOne({
      where: { 
        id: courseId, 
        teacher_id: teacherId 
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    // Get enrollment statistics
    const enrollmentStats = await StudentEnrollment.findAll({
      where: { course_id: courseId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id_user', 'nama_lengkap', 'kelas', 'nama_sekolah']
        }
      ],
      attributes: ['enrolled_at', 'status'],
      order: [['enrolled_at', 'DESC']]
    });

    // Get subcourse completion rates
    const subCourseStats = await SubCourse.findAll({
      where: { course_id: courseId },
      include: [
        {
          model: StudentSubCourseProgress,
          as: 'progress',
          attributes: ['status', 'score'],
          required: false
        }
      ],
      attributes: ['id', 'title', 'order_in_course'],
      order: [['order_in_course', 'ASC']]
    });

    // Get chat interaction statistics
    const chatStats = await ChatInteraction.findAll({
      include: [
        {
          model: SubCourse,
          as: 'subCourse',
          where: { course_id: courseId },
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'student',
          attributes: ['id_user', 'nama_lengkap']
        }
      ],
      attributes: ['id', 'interaction_timestamp', 'student_message_text'],
      order: [['interaction_timestamp', 'DESC']],
      limit: 50
    });

    res.json({
      course,
      enrollmentStats,
      subCourseStats,
      chatStats
    });
  } catch (error) {
    next(error);
  }
});

// Get student progress analytics
router.get('/student-progress', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const { course_id, student_id } = req.query;
    const teacherId = req.user.id_user;

    const whereClause = {};
    const includeClause = [
      {
        model: SubCourse,
        as: 'subCourse',
        include: [
          {
            model: Course,
            as: 'course',
            where: { teacher_id: teacherId },
            attributes: ['id', 'title']
          }
        ],
        attributes: ['id', 'title', 'order_in_course']
      },
      {
        model: User,
        as: 'student',
        attributes: ['id_user', 'nama_lengkap', 'kelas']
      }
    ];

    if (course_id) {
      includeClause[0].include[0].where.id = course_id;
    }

    if (student_id) {
      whereClause.enrollment_student_id = student_id;
    }

    const progressData = await StudentSubCourseProgress.findAll({
      where: whereClause,
      include: includeClause,
      order: [
        [{ model: SubCourse, as: 'subCourse' }, { model: Course, as: 'course' }, 'title', 'ASC'],
        [{ model: SubCourse, as: 'subCourse' }, 'order_in_course', 'ASC']
      ]
    });

    res.json({ progressData });
  } catch (error) {
    next(error);
  }
});

// Get learning patterns and insights
router.get('/insights', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const teacherId = req.user.id_user;

    // Most active students
    const activeStudents = await StudentSubCourseProgress.findAll({
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id_user', 'nama_lengkap']
        },
        {
          model: SubCourse,
          as: 'subCourse',
          include: [
            {
              model: Course,
              as: 'course',
              where: { teacher_id: teacherId },
              attributes: []
            }
          ],
          attributes: []
        }
      ],
      attributes: [
        'enrollment_student_id',
        [require('sequelize').fn('COUNT', '*'), 'activity_count'],
        [require('sequelize').fn('AVG', require('sequelize').col('score')), 'avg_score']
      ],
      group: ['enrollment_student_id', 'student.id_user'],
      having: require('sequelize').literal('COUNT(*) > 0'),
      order: [[require('sequelize').literal('activity_count'), 'DESC']],
      limit: 10
    });

    // Most challenging subcourses (lowest completion rates)
    const challengingContent = await SubCourse.findAll({
      include: [
        {
          model: Course,
          as: 'course',
          where: { teacher_id: teacherId },
          attributes: ['id', 'title']
        },
        {
          model: StudentSubCourseProgress,
          as: 'progress',
          attributes: []
        }
      ],
      attributes: [
        'id',
        'title',
        [require('sequelize').fn('COUNT', require('sequelize').col('progress.id')), 'attempt_count'],
        [require('sequelize').fn('AVG', require('sequelize').col('progress.score')), 'avg_score'],
        [
          require('sequelize').fn(
            'COUNT', 
            require('sequelize').literal("CASE WHEN progress.status = 'completed' THEN 1 END")
          ), 
          'completion_count'
        ]
      ],
      group: ['SubCourse.id', 'course.id'],
      having: require('sequelize').literal('COUNT(progress.id) > 0'),
      order: [[require('sequelize').literal('avg_score'), 'ASC']]
    });

    // Peak learning times
    const learningTimes = await StudentSubCourseProgress.findAll({
      include: [
        {
          model: SubCourse,
          as: 'subCourse',
          include: [
            {
              model: Course,
              as: 'course',
              where: { teacher_id: teacherId },
              attributes: []
            }
          ],
          attributes: []
        }
      ],
      attributes: [
        [require('sequelize').fn('HOUR', require('sequelize').col('last_accessed_at')), 'hour'],
        [require('sequelize').fn('COUNT', '*'), 'access_count']
      ],
      group: [require('sequelize').fn('HOUR', require('sequelize').col('last_accessed_at'))],
      order: [[require('sequelize').literal('access_count'), 'DESC']]
    });

    res.json({
      activeStudents,
      challengingContent,
      learningTimes
    });
  } catch (error) {
    next(error);
  }
});

// Get student global progress percentage
router.get('/student/progress-percentage', authenticate, async (req, res, next) => {
  try {
    // Ambil semua enrollment siswa
    const enrollments = await StudentEnrollment.findAll({
      where: { student_id: req.user.id_user }
    });
    const courseIds = enrollments.map(e => e.course_id);
    if (courseIds.length === 0) {
      return res.json({
        total_courses: 0,
        total_subcourses: 0,
        completed_subcourses: 0,
        progress_percentage: 0
      });
    }
    // Hitung total subcourse dari semua course yang diikuti
    const totalSubCourses = await SubCourse.count({
      where: { course_id: courseIds }
    });
    // Hitung subcourse yang sudah completed
    const completed = await StudentSubCourseProgress.count({
      where: {
        enrollment_student_id: req.user.id_user,
        status: 'completed',
        enrollment_course_id: courseIds
      }
    });
    const percentage = totalSubCourses === 0 ? 0 : Math.round((completed / totalSubCourses) * 100);
    res.json({
      total_courses: courseIds.length,
      total_subcourses: totalSubCourses,
      completed_subcourses: completed,
      progress_percentage: percentage
    });
  } catch (error) {
    next(error);
  }
});

// Get all pending quizzes for student ("Tugas Saya")
router.get('/student/pending-quizzes', authenticate, async (req, res, next) => {
  try {
    // Ambil semua enrollment siswa
    const enrollments = await StudentEnrollment.findAll({
      where: { student_id: req.user.id_user }
    });
    const courseIds = enrollments.map(e => e.course_id);
    if (courseIds.length === 0) return res.json({ pending_quizzes: [] });
    // Ambil semua subcourse tipe quiz dari course yang diikuti
    const quizzes = await SubCourse.findAll({
      where: {
        course_id: courseIds,
        content_type: 'quiz'
      },
      order: [['order_in_course', 'ASC']]
    });
    // Ambil progress quiz yang sudah completed
    const completedQuizIds = (await StudentSubCourseProgress.findAll({
      where: {
        enrollment_student_id: req.user.id_user,
        status: 'completed',
        enrollment_course_id: courseIds
      }
    })).map(p => p.sub_course_id);
    // Filter quiz yang belum selesai
    const pending = quizzes.filter(q => !completedQuizIds.includes(q.id));
    res.json({
      pending_quizzes: pending.map(q => ({
        id: q.id,
        title: q.title,
        course_id: q.course_id,
        order_in_course: q.order_in_course
        // Tambahkan deadline jika ada field deadline di model SubCourse
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Teacher Dashboard Analytics: Unique Registered Students
router.get('/teacher/registered-students', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const teacherId = req.user.id_user;
    const courses = await Course.findAll({ where: { teacher_id: teacherId }, attributes: ['id'] });
    const courseIds = courses.map(c => c.id);
    if (courseIds.length === 0) return res.json({ registered_students_count: 0, courses_count: 0 });
    const enrollments = await StudentEnrollment.findAll({
      where: { course_id: courseIds },
      attributes: ['student_id'],
      group: ['student_id']
    });
    res.json({ 
      registered_students_count: enrollments.length,
      courses_count: courseIds.length
    });
  } catch (error) {
    next(error);
  }
});

// Teacher Dashboard Analytics: Completed Quizzes Count
router.get('/teacher/completed-quizzes', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const teacherId = req.user.id_user;
    const courses = await Course.findAll({ where: { teacher_id: teacherId }, attributes: ['id'] });
    const courseIds = courses.map(c => c.id);
    if (courseIds.length === 0) return res.json({ completed_quizzes_count: 0, total_quiz_subcourses: 0 });
    const quizzes = await SubCourse.findAll({ where: { course_id: courseIds, content_type: 'quiz' }, attributes: ['id'] });
    const quizIds = quizzes.map(q => q.id);
    if (quizIds.length === 0) return res.json({ completed_quizzes_count: 0, total_quiz_subcourses: 0 });
    const completedCount = await StudentSubCourseProgress.count({
      where: { sub_course_id: quizIds, status: 'completed' }
    });
    res.json({ 
      completed_quizzes_count: completedCount,
      total_quiz_subcourses: quizzes.length
    });
  } catch (error) {
    next(error);
  }
});

// Teacher Dashboard Analytics: Average Quiz Score
router.get('/teacher/average-quiz-score', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const teacherId = req.user.id_user;
    
    // Debug: Log teacher ID
    console.log('Teacher ID:', teacherId);
    
    // Get all courses by teacher
    const courses = await Course.findAll({ 
      where: { teacher_id: teacherId }, 
      attributes: ['id', 'title'] 
    });
    
    console.log('Teacher courses found:', courses.length);
    const courseIds = courses.map(c => c.id);
    
    if (courseIds.length === 0) {
      return res.json({ 
        average_quiz_score: 0,
        total_completed_quizzes: 0,
        debug: 'No courses found for teacher'
      });
    }
    
    // Get all quiz subcourses from teacher's courses
    const quizzes = await SubCourse.findAll({ 
      where: { 
        course_id: courseIds, 
        content_type: 'quiz' 
      }, 
      attributes: ['id', 'title', 'course_id'] 
    });
    
    console.log('Quiz subcourses found:', quizzes.length);
    const quizIds = quizzes.map(q => q.id);
    
    if (quizIds.length === 0) {
      return res.json({ 
        average_quiz_score: 0,
        total_completed_quizzes: 0,
        debug: 'No quiz subcourses found'
      });
    }
    
    // Get all completed quiz progresses
    const progresses = await StudentSubCourseProgress.findAll({
      where: { 
        sub_course_id: quizIds, 
        status: 'completed',
        score: { [Op.not]: null } // Ensure score is not null
      },
      attributes: ['score', 'sub_course_id'],
      include: [{
        model: SubCourse,
        as: 'subcourse',
        attributes: ['title'],
        required: false
      }]
    });
    
    console.log('Completed quiz progresses found:', progresses.length);
    
    if (progresses.length === 0) {
      return res.json({ 
        average_quiz_score: 0,
        total_completed_quizzes: 0,
        debug: 'No completed quiz progresses found'
      });
    }
    
    // Calculate average score
    const validScores = progresses
      .map(p => parseFloat(p.score))
      .filter(score => !isNaN(score) && score >= 0 && score <= 100);
    
    console.log('Valid scores:', validScores);
    
    if (validScores.length === 0) {
      return res.json({ 
        average_quiz_score: 0,
        total_completed_quizzes: progresses.length,
        debug: 'No valid scores found'
      });
    }
    
    const totalScore = validScores.reduce((sum, score) => sum + score, 0);
    const averageScore = Math.round((totalScore / validScores.length) * 100) / 100;
    
    res.json({ 
      average_quiz_score: averageScore,
      total_completed_quizzes: validScores.length,
      total_quiz_subcourses: quizzes.length,
      courses_count: courses.length
    });
  } catch (error) {
    console.error('Error in average-quiz-score:', error);
    next(error);
  }
});

// Get teacher's courses with analytics (for Topik Aktif section)
router.get('/teacher/courses-analytics', authenticate, async (req, res, next) => {
  try {
    // Pastikan user adalah teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teacher only.' });
    }

    // Ambil semua course milik teacher
    const courses = await Course.findAll({
      where: { teacher_id: req.user.id_user },
      include: [
        {
          model: SubCourse,
          as: 'subcourses'
        }
      ]
    });

    const courseAnalytics = await Promise.all(courses.map(async (course) => {
      // Hitung total subcourse dalam course
      const totalSubCourses = course.subcourses.length;
      
      // Ambil semua enrollment untuk course ini
      const enrollments = await StudentEnrollment.findAll({
        where: { course_id: course.id }
      });
      
      const totalStudents = enrollments.length;
      
      if (totalStudents === 0) {
        return {
          course_id: course.id,
          title: course.title,
          subject: course.subject,
          status: course.status,
          total_students: 0,
          average_completion: 0,
          upcoming_deadline: course.end_date,
          total_subcourses: totalSubCourses
        };
      }      // Hitung rata-rata completion per siswa
      let totalCompletionPercentage = 0;
      
      for (const enrollment of enrollments) {
        // Hitung completed subcourse untuk siswa ini dalam course ini
        const completedCount = await StudentSubCourseProgress.count({
          where: {
            enrollment_student_id: enrollment.student_id,
            status: 'completed'
          },
          include: [{
            model: SubCourse,
            as: 'subcourse',
            where: { course_id: course.id },
            required: true
          }]
        });
        
        const studentCompletion = totalSubCourses === 0 ? 0 : (completedCount / totalSubCourses) * 100;
        totalCompletionPercentage += studentCompletion;
      }
      
      const averageCompletion = Math.round(totalCompletionPercentage / totalStudents);

      return {
        course_id: course.id,
        title: course.title,
        subject: course.subject,
        status: course.status,
        total_students: totalStudents,
        average_completion: averageCompletion,
        upcoming_deadline: course.end_date,
        total_subcourses: totalSubCourses
      };
    }));

    res.json({
      courses: courseAnalytics
    });
  } catch (error) {
    next(error);
  }
});

// Get students list with progress for specific course
router.get('/teacher/course/:courseId/students', authenticate, async (req, res, next) => {
  try {
    // Pastikan user adalah teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teacher only.' });
    }

    const { courseId } = req.params;
    
    // Pastikan course milik teacher ini
    const course = await Course.findOne({
      where: { 
        id: courseId,
        teacher_id: req.user.id_user 
      },
      include: [{
        model: SubCourse,
        as: 'subcourses'
      }]
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    const totalSubCourses = course.subcourses.length;
    const quizSubCourses = course.subcourses.filter(sub => sub.content_type === 'quiz');

    // Ambil semua siswa yang enrolled di course ini
    const enrollments = await StudentEnrollment.findAll({
      where: { course_id: courseId },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id_user', 'nama_lengkap', 'kelas', 'updated_at']
      }]
    });

    const studentsProgress = await Promise.all(enrollments.map(async (enrollment) => {
      const student = enrollment.student;
        // Hitung progress siswa dalam course ini
      const completedCount = await StudentSubCourseProgress.count({
        where: {
          enrollment_student_id: student.id_user,
          status: 'completed'
        },
        include: [{
          model: SubCourse,
          as: 'subcourse',
          where: { course_id: courseId },
          required: true
        }]
      });
      
      const progressPercentage = totalSubCourses === 0 ? 0 : Math.round((completedCount / totalSubCourses) * 100);
      
      // Hitung rata-rata nilai quiz dalam course ini
      const quizProgresses = await StudentSubCourseProgress.findAll({
        where: {
          enrollment_student_id: student.id_user,
          status: 'completed'
        },
        include: [{
          model: SubCourse,
          where: { 
            course_id: courseId,
            content_type: 'quiz'
          },
          required: true
        }]
      });
      
      let averageQuizScore = 0;
      if (quizProgresses.length > 0) {
        const totalScore = quizProgresses.reduce((sum, progress) => sum + (progress.score || 0), 0);
        averageQuizScore = Math.round(totalScore / quizProgresses.length);
      }

      return {
        student_id: student.id_user,
        nama_lengkap: student.nama_lengkap,
        kelas: student.kelas,
        progress_percentage: progressPercentage,
        completed_subcourses: completedCount,
        total_subcourses: totalSubCourses,
        average_quiz_score: averageQuizScore,
        last_active: student.updated_at
      };
    }));

    res.json({
      course: {
        id: course.id,
        title: course.title,
        subject: course.subject
      },
      students: studentsProgress
    });
  } catch (error) {
    next(error);
  }
});

// Get detailed analytics report for teacher (Laporan Analitik Aktivitas Siswa)
router.get('/teacher/activity-report', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teacher only.' });
    }

    // Ambil semua course milik teacher
    const teacherCourses = await Course.findAll({
      where: { teacher_id: req.user.id_user },
      include: [{
        model: SubCourse,
        as: 'subcourses'
      }]
    });

    const courseIds = teacherCourses.map(c => c.id);

    // Ambil semua siswa yang enrolled di course teacher ini
    const allEnrollments = await StudentEnrollment.findAll({
      where: { course_id: courseIds },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id_user', 'nama_lengkap']
      }]
    });

    // Hitung statistik untuk setiap subcourse
    const subCourseStats = await Promise.all(
      teacherCourses.flatMap(course => 
        course.subcourses.map(async (subCourse) => {
          // Hitung berapa siswa yang distracted, yawn, tutup mata untuk subcourse ini
          const progressData = await StudentSubCourseProgress.findAll({
            where: {
              sub_course_id: subCourse.id
            },
            include: [{
              model: User,
              as: 'student',
              attributes: ['id_user', 'nama_lengkap']
            }]
          });

          // Simulasi data distracted (karena belum ada field khusus)
          const simulatedDistracted = Math.floor(Math.random() * progressData.length);
          const simulatedYawn = Math.floor(Math.random() * progressData.length);
          const simulatedClosedEyes = Math.floor(Math.random() * progressData.length);
          
          const completedCount = progressData.filter(p => p.status === 'completed').length;
          const averageScore = progressData.length > 0 
            ? Math.round(progressData.reduce((sum, p) => sum + (p.score || 0), 0) / progressData.length)
            : 0;

          // Cari siswa yang paling sering terdistraksi (simulasi)
          const mostDistractedStudent = progressData.length > 0 
            ? progressData[Math.floor(Math.random() * progressData.length)]?.student
            : null;

          return {
            course_title: course.title,
            subcourse_id: subCourse.id,
            subcourse_title: subCourse.title,
            content_type: subCourse.content_type,
            total_enrolled: progressData.length,
            completed: completedCount,
            distracted_count: simulatedDistracted,
            yawn_count: simulatedYawn,
            closed_eyes_count: simulatedClosedEyes,
            average_attention: Math.round((1 - (simulatedDistracted / Math.max(progressData.length, 1))) * 100),
            most_distracted_student: mostDistractedStudent?.nama_lengkap || 'N/A'
          };
        })
      )
    );

    // Rangkuman untuk setiap materi/topik
    const materialSummary = {};
    subCourseStats.forEach(stat => {
      if (!materialSummary[stat.course_title]) {
        materialSummary[stat.course_title] = {
          course_title: stat.course_title,
          total_distracted: 0,
          total_yawn: 0,
          total_closed_eyes: 0,
          total_students: 0,
          average_attention: 0,
          subcourses: []
        };
      }
      
      materialSummary[stat.course_title].total_distracted += stat.distracted_count;
      materialSummary[stat.course_title].total_yawn += stat.yawn_count;
      materialSummary[stat.course_title].total_closed_eyes += stat.closed_eyes_count;
      materialSummary[stat.course_title].total_students = Math.max(materialSummary[stat.course_title].total_students, stat.total_enrolled);
      materialSummary[stat.course_title].subcourses.push(stat);
    });

    // Hitung rata-rata perhatian per materi
    Object.values(materialSummary).forEach(material => {
      const totalAttention = material.subcourses.reduce((sum, sub) => sum + sub.average_attention, 0);
      material.average_attention = material.subcourses.length > 0 
        ? Math.round(totalAttention / material.subcourses.length)
        : 0;
    });

    // Cari materi yang paling membosankan
    const mostBoringMaterial = Object.values(materialSummary).reduce((prev, current) => 
      (prev.average_attention < current.average_attention) ? prev : current
    );

    // Cari siswa yang paling sering terdistraksi secara keseluruhan
    const studentDistractionsMap = {};
    allEnrollments.forEach(enrollment => {
      const student = enrollment.student;
      if (!studentDistractionsMap[student.id_user]) {
        studentDistractionsMap[student.id_user] = {
          nama_lengkap: student.nama_lengkap,
          total_distractions: Math.floor(Math.random() * 20) // simulasi
        };
      }
    });

    const mostDistractedOverall = Object.values(studentDistractionsMap).reduce((prev, current) => 
      (prev.total_distractions > current.total_distractions) ? prev : current
    );

    res.json({
      summary: {
        most_boring_material: mostBoringMaterial?.course_title || 'N/A',
        most_distracted_student: mostDistractedOverall?.nama_lengkap || 'N/A',
        overall_attention_rate: Object.values(materialSummary).length > 0
          ? Math.round(Object.values(materialSummary).reduce((sum, m) => sum + m.average_attention, 0) / Object.values(materialSummary).length)
          : 0
      },
      materials: Object.values(materialSummary),
      detailed_subcourses: subCourseStats,
      student_distractions: Object.values(studentDistractionsMap)
    });
  } catch (error) {
    next(error);
  }
});

// Get registered students count (unique students across all teacher's courses)
router.get('/teacher/registered-students', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teacher only.' });
    }

    // Ambil semua course milik teacher
    const teacherCourses = await Course.findAll({
      where: { teacher_id: req.user.id_user },
      attributes: ['id']
    });

    const courseIds = teacherCourses.map(course => course.id);

    // Hitung unique students yang enrolled di course-course teacher ini
    const uniqueStudents = await StudentEnrollment.findAll({
      where: { course_id: courseIds },
      attributes: ['student_id'],
      group: ['student_id']
    });

    res.json({
      registered_students_count: uniqueStudents.length,
      courses_count: courseIds.length
    });
  } catch (error) {
    next(error);
  }
});

// Get completed quizzes count across all teacher's courses
router.get('/teacher/completed-quizzes', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teacher only.' });
    }

    // Ambil semua course milik teacher
    const teacherCourses = await Course.findAll({
      where: { teacher_id: req.user.id_user },
      include: [{
        model: SubCourse,
        as: 'subcourses',
        where: { content_type: 'quiz' },
        required: false
      }]
    });

    // Kumpulkan semua quiz subcourse IDs
    const quizSubCourseIds = teacherCourses.flatMap(course => 
      course.subcourses.map(sub => sub.id)
    );

    // Hitung berapa quiz yang sudah completed
    const completedQuizzes = await StudentSubCourseProgress.count({
      where: {
        sub_course_id: quizSubCourseIds,
        status: 'completed'
      }
    });

    res.json({
      completed_quizzes_count: completedQuizzes,
      total_quiz_subcourses: quizSubCourseIds.length
    });
  } catch (error) {
    next(error);
  }
});

// Get average quiz score across all teacher's courses
router.get('/teacher/average-quiz-score', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teacher only.' });
    }

    const teacherId = req.user.id_user;
    console.log('Teacher ID:', teacherId);

    // Ambil semua course milik teacher
    const teacherCourses = await Course.findAll({
      where: { teacher_id: teacherId },
      attributes: ['id', 'title']
    });

    console.log('Teacher courses found:', teacherCourses.length);

    if (teacherCourses.length === 0) {
      return res.json({
        average_quiz_score: 0,
        total_completed_quizzes: 0,
        total_quiz_subcourses: 0,
        courses_count: 0,
        debug: 'No courses found for teacher'
      });
    }

    const courseIds = teacherCourses.map(course => course.id);

    // Ambil semua quiz subcourses dari course milik teacher
    const quizSubCourses = await SubCourse.findAll({
      where: {
        course_id: courseIds,
        content_type: 'quiz'
      },
      attributes: ['id', 'title', 'course_id']
    });

    console.log('Quiz subcourses found:', quizSubCourses.length);

    if (quizSubCourses.length === 0) {
      return res.json({
        average_quiz_score: 0,
        total_completed_quizzes: 0,
        total_quiz_subcourses: 0,
        courses_count: teacherCourses.length,
        debug: 'No quiz subcourses found'
      });
    }

    const quizSubCourseIds = quizSubCourses.map(sub => sub.id);

    // Ambil semua quiz progress yang completed dengan score valid
    const completedQuizProgresses = await StudentSubCourseProgress.findAll({
      where: {
        sub_course_id: quizSubCourseIds,
        status: 'completed',
        score: { [Op.not]: null }
      },
      attributes: ['score', 'sub_course_id']
    });

    console.log('Completed quiz progresses found:', completedQuizProgresses.length);

    // Filter scores yang valid (0-100)
    const validScores = completedQuizProgresses
      .map(progress => parseFloat(progress.score))
      .filter(score => !isNaN(score) && score >= 0 && score <= 100);

    console.log('Valid scores:', validScores);

    let averageScore = 0;
    if (validScores.length > 0) {
      const totalScore = validScores.reduce((sum, score) => sum + score, 0);
      averageScore = Math.round(totalScore / validScores.length);
    }

    res.json({
      average_quiz_score: averageScore,
      total_completed_quizzes: validScores.length,
      total_quiz_subcourses: quizSubCourses.length,
      courses_count: teacherCourses.length
    });
  } catch (error) {
    console.error('Error in average-quiz-score:', error);
    next(error);
  }
});

// Get students who joined teacher's courses today
router.get('/teacher/students-joined-today', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const teacherId = req.user.id_user;
    
    // Get start and end of today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    console.log('Date range:', { startOfDay, endOfDay }); // Debug log
    
    // Find all courses by this teacher
    const teacherCourses = await Course.findAll({
      where: { teacher_id: teacherId },
      attributes: ['id', 'title', 'subject', 'kelas', 'course_code']
    });
    
    const courseIds = teacherCourses.map(course => course.id);
    
    if (courseIds.length === 0) {
      return res.json({
        message: 'No courses found for this teacher',
        students_joined_today: [],
        total_joined_today: 0,
        courses_count: 0
      });
    }
    
    // Find enrollments that happened today in teacher's courses
    const todayEnrollments = await StudentEnrollment.findAll({
      where: {
        course_id: courseIds,
        enrolled_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id_user', 'nama_lengkap', 'email', 'kelas', 'nama_sekolah', 'foto_profil_url']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'subject', 'kelas', 'course_code']
        }
      ],
      order: [['enrolled_at', 'DESC']]
    });
    
    // Format the response data
    const studentsJoinedToday = todayEnrollments.map(enrollment => ({
      enrollment_id: enrollment.id,
      student: {
        id: enrollment.student.id_user,
        nama_lengkap: enrollment.student.nama_lengkap,
        email: enrollment.student.email,
        kelas: enrollment.student.kelas,
        nama_sekolah: enrollment.student.nama_sekolah,
        foto_profil_url: enrollment.student.foto_profil_url
      },
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        subject: enrollment.course.subject,
        kelas: enrollment.course.kelas,
        course_code: enrollment.course.course_code
      },
      joined_at: enrollment.enrolled_at,
      time_ago: getTimeAgo(enrollment.enrolled_at)
    }));
    
    // Group by course for summary
    const coursesSummary = {};
    todayEnrollments.forEach(enrollment => {
      const courseId = enrollment.course.id;
      if (!coursesSummary[courseId]) {
        coursesSummary[courseId] = {
          course_id: courseId,
          course_title: enrollment.course.title,
          course_code: enrollment.course.course_code,
          subject: enrollment.course.subject,
          kelas: enrollment.course.kelas,
          new_students_today: 0,
          students: []
        };
      }
      coursesSummary[courseId].new_students_today++;
      coursesSummary[courseId].students.push({
        nama_lengkap: enrollment.student.nama_lengkap,
        joined_at: enrollment.enrolled_at
      });
    });
    
    res.json({
      message: 'Students who joined today retrieved successfully',
      date: today.toISOString().split('T')[0],
      students_joined_today: studentsJoinedToday,
      total_joined_today: todayEnrollments.length,
      courses_summary: Object.values(coursesSummary),
      teacher_courses_count: courseIds.length,
      debug_info: {
        teacher_id: teacherId,
        course_ids: courseIds,
        date_range: {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error in students-joined-today:', error);
    next(error);
  }
});

// Get students who were active today in teacher's courses
router.get('/teacher/students-active-today', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const teacherId = req.user.id_user;
    
    // Get start and end of today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // Find all courses by this teacher
    const teacherCourses = await Course.findAll({
      where: { teacher_id: teacherId },
      attributes: ['id', 'title', 'subject', 'kelas', 'course_code']
    });
    
    const courseIds = teacherCourses.map(course => course.id);
    
    if (courseIds.length === 0) {
      return res.json({
        message: 'No courses found for this teacher',
        active_students_today: [],
        total_active_today: 0
      });
    }
    
    // Find student progress activities that happened today
    const todayActivities = await StudentSubCourseProgress.findAll({
      where: {
        enrollment_course_id: courseIds,
        last_accessed_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id_user', 'nama_lengkap', 'email', 'kelas', 'nama_sekolah']
        },
        {
          model: SubCourse,
          as: 'subcourse',
          attributes: ['id', 'title', 'content_type'],
          include: [{
            model: Course,
            as: 'course',
            attributes: ['id', 'title', 'subject', 'course_code']
          }]
        }
      ],
      order: [['last_accessed_at', 'DESC']]
    });
    
    // Group by student to avoid duplicates
    const activeStudentsMap = {};
    todayActivities.forEach(activity => {
      const studentId = activity.student.id_user;
      if (!activeStudentsMap[studentId]) {
        activeStudentsMap[studentId] = {
          student: activity.student,
          courses_active: [],
          total_activities: 0,
          last_activity: activity.last_accessed_at
        };
      }
      
      activeStudentsMap[studentId].total_activities++;
      if (activity.last_accessed_at > activeStudentsMap[studentId].last_activity) {
        activeStudentsMap[studentId].last_activity = activity.last_accessed_at;
      }
      
      // Add course to active courses if not already added
      const courseExists = activeStudentsMap[studentId].courses_active.find(
        c => c.course_id === activity.subcourse.course.id
      );
      if (!courseExists) {
        activeStudentsMap[studentId].courses_active.push({
          course_id: activity.subcourse.course.id,
          course_title: activity.subcourse.course.title,
          course_code: activity.subcourse.course.course_code,
          subject: activity.subcourse.course.subject
        });
      }
    });
    
    const activeStudentsToday = Object.values(activeStudentsMap).map(item => ({
      student: {
        id: item.student.id_user,
        nama_lengkap: item.student.nama_lengkap,
        email: item.student.email,
        kelas: item.student.kelas,
        nama_sekolah: item.student.nama_sekolah
      },
      courses_active: item.courses_active,
      total_activities: item.total_activities,
      last_activity: item.last_activity,
      time_ago: getTimeAgo(item.last_activity)
    }));
    
    res.json({
      message: 'Active students today retrieved successfully',
      date: today.toISOString().split('T')[0],
      active_students_today: activeStudentsToday,
      total_active_today: activeStudentsToday.length,
      total_activities: todayActivities.length
    });
  } catch (error) {
    console.error('Error in students-active-today:', error);
    next(error);
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInHours > 0) {
    return `${diffInHours} jam yang lalu`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} menit yang lalu`;
  } else {
    return 'Baru saja';
  }
}

// Get students who joined teacher's courses today
router.get('/teacher/students-joined-today', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const teacherId = req.user.id_user;
    
    // Get start and end of today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    console.log('Date range:', { startOfDay, endOfDay }); // Debug log
    
    // Find all courses by this teacher
    const teacherCourses = await Course.findAll({
      where: { teacher_id: teacherId },
      attributes: ['id', 'title', 'subject', 'kelas', 'course_code']
    });
    
    const courseIds = teacherCourses.map(course => course.id);
    
    if (courseIds.length === 0) {
      return res.json({
        message: 'No courses found for this teacher',
        students_joined_today: [],
        total_joined_today: 0,
        courses_count: 0
      });
    }
    
    // Find enrollments that happened today in teacher's courses
    const todayEnrollments = await StudentEnrollment.findAll({
      where: {
        course_id: courseIds,
        enrolled_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id_user', 'nama_lengkap', 'email', 'kelas', 'nama_sekolah', 'foto_profil_url']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'subject', 'kelas', 'course_code']
        }
      ],
      order: [['enrolled_at', 'DESC']]
    });
    
    // Format the response data
    const studentsJoinedToday = todayEnrollments.map(enrollment => ({
      enrollment_id: enrollment.id,
      student: {
        id: enrollment.student.id_user,
        nama_lengkap: enrollment.student.nama_lengkap,
        email: enrollment.student.email,
        kelas: enrollment.student.kelas,
        nama_sekolah: enrollment.student.nama_sekolah,
        foto_profil_url: enrollment.student.foto_profil_url
      },
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        subject: enrollment.course.subject,
        kelas: enrollment.course.kelas,
        course_code: enrollment.course.course_code
      },
      joined_at: enrollment.enrolled_at,
      time_ago: getTimeAgo(enrollment.enrolled_at)
    }));
    
    // Group by course for summary
    const coursesSummary = {};
    todayEnrollments.forEach(enrollment => {
      const courseId = enrollment.course.id;
      if (!coursesSummary[courseId]) {
        coursesSummary[courseId] = {
          course_id: courseId,
          course_title: enrollment.course.title,
          course_code: enrollment.course.course_code,
          subject: enrollment.course.subject,
          kelas: enrollment.course.kelas,
          new_students_today: 0,
          students: []
        };
      }
      coursesSummary[courseId].new_students_today++;
      coursesSummary[courseId].students.push({
        nama_lengkap: enrollment.student.nama_lengkap,
        joined_at: enrollment.enrolled_at
      });
    });
    
    res.json({
      message: 'Students who joined today retrieved successfully',
      date: today.toISOString().split('T')[0],
      students_joined_today: studentsJoinedToday,
      total_joined_today: todayEnrollments.length,
      courses_summary: Object.values(coursesSummary),
      teacher_courses_count: courseIds.length,
      debug_info: {
        teacher_id: teacherId,
        course_ids: courseIds,
        date_range: {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error in students-joined-today:', error);
    next(error);
  }
});

// Get students who were active today in teacher's courses
router.get('/teacher/students-active-today', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const teacherId = req.user.id_user;
    
    // Get start and end of today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // Find all courses by this teacher
    const teacherCourses = await Course.findAll({
      where: { teacher_id: teacherId },
      attributes: ['id', 'title', 'subject', 'kelas', 'course_code']
    });
    
    const courseIds = teacherCourses.map(course => course.id);
    
    if (courseIds.length === 0) {
      return res.json({
        message: 'No courses found for this teacher',
        active_students_today: [],
        total_active_today: 0
      });
    }
    
    // Find student progress activities that happened today
    const todayActivities = await StudentSubCourseProgress.findAll({
      where: {
        enrollment_course_id: courseIds,
        last_accessed_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id_user', 'nama_lengkap', 'email', 'kelas', 'nama_sekolah']
        },
        {
          model: SubCourse,
          as: 'subcourse',
          attributes: ['id', 'title', 'content_type'],
          include: [{
            model: Course,
            as: 'course',
            attributes: ['id', 'title', 'subject', 'course_code']
          }]
        }
      ],
      order: [['last_accessed_at', 'DESC']]
    });
    
    // Group by student to avoid duplicates
    const activeStudentsMap = {};
    todayActivities.forEach(activity => {
      const studentId = activity.student.id_user;
      if (!activeStudentsMap[studentId]) {
        activeStudentsMap[studentId] = {
          student: activity.student,
          courses_active: [],
          total_activities: 0,
          last_activity: activity.last_accessed_at
        };
      }
      
      activeStudentsMap[studentId].total_activities++;
      if (activity.last_accessed_at > activeStudentsMap[studentId].last_activity) {
        activeStudentsMap[studentId].last_activity = activity.last_accessed_at;
      }
      
      // Add course to active courses if not already added
      const courseExists = activeStudentsMap[studentId].courses_active.find(
        c => c.course_id === activity.subcourse.course.id
      );
      if (!courseExists) {
        activeStudentsMap[studentId].courses_active.push({
          course_id: activity.subcourse.course.id,
          course_title: activity.subcourse.course.title,
          course_code: activity.subcourse.course.course_code,
          subject: activity.subcourse.course.subject
        });
      }
    });
    
    const activeStudentsToday = Object.values(activeStudentsMap).map(item => ({
      student: {
        id: item.student.id_user,
        nama_lengkap: item.student.nama_lengkap,
        email: item.student.email,
        kelas: item.student.kelas,
        nama_sekolah: item.student.nama_sekolah
      },
      courses_active: item.courses_active,
      total_activities: item.total_activities,
      last_activity: item.last_activity,
      time_ago: getTimeAgo(item.last_activity)
    }));
    
    res.json({
      message: 'Active students today retrieved successfully',
      date: today.toISOString().split('T')[0],
      active_students_today: activeStudentsToday,
      total_active_today: activeStudentsToday.length,
      total_activities: todayActivities.length
    });
  } catch (error) {
    console.error('Error in students-active-today:', error);
    next(error);
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInHours > 0) {
    return `${diffInHours} jam yang lalu`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} menit yang lalu`;
  } else {
    return 'Baru saja';
  }
}

module.exports = router;