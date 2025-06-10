const express = require('express');
const { 
  User, 
  Course, 
  SubCourse, 
  StudentEnrollment, 
  StudentSubCourseProgress, 
  ChatInteraction 
} = require('../models');
const { authenticate, teacherOnly } = require('../middleware/auth');
const { Op } = require('sequelize');

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
    if (courseIds.length === 0) return res.json({ count: 0 });
    const enrollments = await StudentEnrollment.findAll({
      where: { course_id: courseIds },
      attributes: ['student_id'],
      group: ['student_id']
    });
    res.json({ count: enrollments.length });
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
    if (courseIds.length === 0) return res.json({ count: 0 });
    const quizzes = await SubCourse.findAll({ where: { course_id: courseIds, content_type: 'quiz' }, attributes: ['id'] });
    const quizIds = quizzes.map(q => q.id);
    if (quizIds.length === 0) return res.json({ count: 0 });
    const completedCount = await StudentSubCourseProgress.count({
      where: { sub_course_id: quizIds, status: 'completed' }
    });
    res.json({ count: completedCount });
  } catch (error) {
    next(error);
  }
});

// Teacher Dashboard Analytics: Average Quiz Score
router.get('/teacher/average-quiz-score', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const teacherId = req.user.id_user;
    const courses = await Course.findAll({ where: { teacher_id: teacherId }, attributes: ['id'] });
    const courseIds = courses.map(c => c.id);
    if (courseIds.length === 0) return res.json({ average: 0 });
    const quizzes = await SubCourse.findAll({ where: { course_id: courseIds, content_type: 'quiz' }, attributes: ['id'] });
    const quizIds = quizzes.map(q => q.id);
    if (quizIds.length === 0) return res.json({ average: 0 });
    const progresses = await StudentSubCourseProgress.findAll({
      where: { sub_course_id: quizIds, status: 'completed' },
      attributes: ['score']
    });
    if (progresses.length === 0) return res.json({ average: 0 });
    const totalScore = progresses.reduce((sum, p) => sum + (p.score || 0), 0);
    const avg = Math.round((totalScore / progresses.length) * 100) / 100;
    res.json({ average: avg });
  } catch (error) {
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

    // Ambil semua quiz progress yang completed
    const completedQuizProgresses = await StudentSubCourseProgress.findAll({
      where: {
        sub_course_id: quizSubCourseIds,
        status: 'completed'
      },
      attributes: ['score']
    });

    let averageScore = 0;
    if (completedQuizProgresses.length > 0) {
      const totalScore = completedQuizProgresses.reduce((sum, progress) => sum + (progress.score || 0), 0);
      averageScore = Math.round(totalScore / completedQuizProgresses.length);
    }

    res.json({
      average_quiz_score: averageScore,
      total_completed_quizzes: completedQuizProgresses.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;