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
    });

    // Get course statistics
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
          as: 'subCourses',
          attributes: []
        }
      ],
      attributes: [
        'id',
        'title',
        'status',
        'created_at',
        [require('sequelize').fn('COUNT', require('sequelize').fn('DISTINCT', require('sequelize').col('enrollments.student_id'))), 'student_count'],
        [require('sequelize').fn('COUNT', require('sequelize').fn('DISTINCT', require('sequelize').col('subCourses.id'))), 'subcourse_count']
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

module.exports = router;