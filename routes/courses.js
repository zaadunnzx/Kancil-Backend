const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Course, SubCourse, User, StudentEnrollment, StudentSubCourseProgress } = require('../models');
const { authenticate, teacherOnly, studentOnly } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Generate unique course code
const generateCourseCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Create course (teachers only)
router.post('/', authenticate, teacherOnly, validateRequest(schemas.createCourse), async (req, res, next) => {
  try {
    const { title, subject, kelas, start_date, end_date } = req.body;
    
    let course_code;
    let isUnique = false;
    
    // Generate unique course code
    while (!isUnique) {
      course_code = generateCourseCode();
      const existing = await Course.findOne({ where: { course_code } });
      if (!existing) isUnique = true;
    }

    const course = await Course.create({
      title,
      subject,
      kelas,
      teacher_id: req.user.id_user,
      course_code,
      start_date,
      end_date,
      status: 'draft'
    });

    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    next(error);
  }
});

// Get teacher's own courses
router.get('/my-courses', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, subject, kelas, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      teacher_id: req.user.id_user
    };
    
    if (subject) whereClause.subject = subject;
    if (kelas) whereClause.kelas = kelas;
    if (status) whereClause.status = status;

    const { count, rows: courses } = await Course.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id_user', 'nama_lengkap']
        },
        {
          model: SubCourse,
          as: 'subCourses',
          attributes: ['id', 'title', 'content_type', 'order_in_course']
        },
        {
          model: StudentEnrollment,
          as: 'enrollments',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id_user', 'nama_lengkap']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Calculate statistics for each course
    const coursesWithStats = courses.map(course => {
      const enrollmentCount = course.enrollments ? course.enrollments.length : 0;
      const subCourseCount = course.subCourses ? course.subCourses.length : 0;
      
      return {
        ...course.toJSON(),
        stats: {
          totalStudents: enrollmentCount,
          totalSubCourses: subCourseCount
        }
      };
    });

    res.json({
      courses: coursesWithStats,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all courses
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, subject, kelas, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (subject) whereClause.subject = subject;
    if (kelas) whereClause.kelas = kelas;
    if (status) whereClause.status = status;

    // Students only see published courses
    if (req.user.role === 'student') {
      whereClause.status = 'published';
    }

    const { count, rows: courses } = await Course.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id_user', 'nama_lengkap']
        },
        {
          model: SubCourse,
          as: 'subCourses',
          attributes: ['id', 'title', 'content_type', 'order_in_course']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      courses,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get course by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id_user', 'nama_lengkap', 'email']
        },
        {
          model: SubCourse,
          as: 'subCourses',
          order: [['order_in_course', 'ASC']]
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check access permissions
    if (req.user.role === 'student' && course.status !== 'published') {
      return res.status(403).json({ error: 'Course not available' });
    }

    // Get student's enrollment and progress if student
    let enrollment = null;
    let progress = [];
    
    if (req.user.role === 'student') {
      enrollment = await StudentEnrollment.findOne({
        where: {
          student_id: req.user.id_user,
          course_id: course.id
        }
      });

      if (enrollment) {
        progress = await StudentSubCourseProgress.findAll({
          where: {
            enrollment_student_id: req.user.id_user,
            enrollment_course_id: course.id
          },
          include: [{ model: SubCourse, as: 'subCourse' }]
        });
      }
    }

    res.json({
      course,
      enrollment,
      progress
    });
  } catch (error) {
    next(error);
  }
});

// Join course by code (students only)
router.post('/join', authenticate, async (req, res, next) => {
  try {
    const { course_code } = req.body;

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can join courses' });
    }

    if (!course_code) {
      return res.status(400).json({ error: 'Course code is required' });
    }

    const course = await Course.findOne({ 
      where: { course_code, status: 'published' } 
    });

    if (!course) {
      return res.status(404).json({ error: 'Invalid course code or course not available' });
    }

    // Check if already enrolled
    const existingEnrollment = await StudentEnrollment.findOne({
      where: {
        student_id: req.user.id_user,
        course_id: course.id
      }
    });

    if (existingEnrollment) {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    await StudentEnrollment.create({
      student_id: req.user.id_user,
      course_id: course.id
    });

    res.json({ message: 'Successfully joined course', course });
  } catch (error) {
    next(error);
  }
});

// Update course (teacher only)
router.put('/:id', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Not authorized to update this course' });
    }

    await course.update(req.body);
    res.json({ message: 'Course updated successfully', course });
  } catch (error) {
    next(error);
  }
});

// Publish course (teacher only)
router.patch('/:id/publish', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Not authorized to publish this course' });
    }

    await course.update({
      status: 'published',
      published_at: new Date()
    });

    res.json({ message: 'Course published successfully', course });
  } catch (error) {
    next(error);
  }
});

// Delete course (teacher only)
router.delete('/:id', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Not authorized to delete this course' });
    }

    await course.destroy();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;