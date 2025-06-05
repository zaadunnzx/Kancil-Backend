const express = require('express');
const { SubCourse, Course, User, StudentSubCourseProgress, StudentEnrollment, Comment, Reaction } = require('../models');
const { authenticate, teacherOnly, studentOnly } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Get subcourses for a course
router.get('/course/:courseId', authenticate, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // Verify course exists and user has access
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if student is enrolled or if user is the teacher
    if (req.user.role === 'student') {
      const enrollment = await StudentEnrollment.findOne({
        where: {
          student_id: req.user.id_user,
          course_id: courseId
        }
      });
      
      if (!enrollment && course.status !== 'published') {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'teacher' && course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const subCourses = await SubCourse.findAll({
      where: { course_id: courseId },
      include: req.user.role === 'student' ? [
        {
          model: StudentSubCourseProgress,
          as: 'progress',
          where: {
            enrollment_student_id: req.user.id_user,
            enrollment_course_id: courseId
          },
          required: false
        }
      ] : [],
      order: [['order_in_course', 'ASC']]
    });

    res.json({ subCourses });
  } catch (error) {
    next(error);
  }
});

// Get subcourse by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const subCourse = await SubCourse.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course',
          include: [{ model: User, as: 'teacher', attributes: ['id_user', 'nama_lengkap'] }]
        }
      ]
    });

    if (!subCourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    // Check access permissions
    if (req.user.role === 'student') {
      const enrollment = await StudentEnrollment.findOne({
        where: {
          student_id: req.user.id_user,
          course_id: subCourse.course_id
        }
      });
      
      if (!enrollment && subCourse.course.status !== 'published') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get progress for this subcourse
      const progress = await StudentSubCourseProgress.findOne({
        where: {
          enrollment_student_id: req.user.id_user,
          enrollment_course_id: subCourse.course_id,
          sub_course_id: subCourse.id
        }
      });

      subCourse.dataValues.progress = progress;
    } else if (req.user.role === 'teacher' && subCourse.course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ subCourse });
  } catch (error) {
    next(error);
  }
});

// Create subcourse (teachers only)
router.post('/', authenticate, teacherOnly, validateRequest(schemas.createSubCourse), async (req, res, next) => {
  try {
    console.log('Request body received:', req.body); // Debug log
    const { course_id, title, summary, content_type, content_url, order_in_course } = req.body;
    
    // Verify teacher owns the course
    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Not authorized to add content to this course' });
    }

    const subCourse = await SubCourse.create({
      course_id,
      title,
      summary,
      content_type,
      content_url,
      order_in_course
    });

    res.status(201).json({
      message: 'SubCourse created successfully',
      subCourse
    });
  } catch (error) {
    console.error('Create subcourse error:', error); // Debug log
    next(error);
  }
});

// Update subcourse (teachers only)
router.put('/:id', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const subCourse = await SubCourse.findByPk(req.params.id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!subCourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    if (subCourse.course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Not authorized to update this subcourse' });
    }

    await subCourse.update(req.body);
    res.json({ message: 'SubCourse updated successfully', subCourse });
  } catch (error) {
    next(error);
  }
});

// Update progress (students only)
router.patch('/:id/progress', authenticate, studentOnly, async (req, res, next) => {
  try {
    const { status, score } = req.body;
    const subCourseId = req.params.id;

    console.log('Progress update request:', {
      subCourseId,
      userId: req.user.id_user,
      status,
      score
    }); // Debug log

    const subCourse = await SubCourse.findByPk(subCourseId);
    if (!subCourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    console.log('SubCourse found:', {
      id: subCourse.id,
      course_id: subCourse.course_id,
      title: subCourse.title
    }); // Debug log

    // Check if student is enrolled
    const enrollment = await StudentEnrollment.findOne({
      where: {
        student_id: req.user.id_user,
        course_id: subCourse.course_id
      }
    });

    console.log('Enrollment check:', {
      student_id: req.user.id_user,
      course_id: subCourse.course_id,
      enrollment: enrollment ? 'Found' : 'Not found'
    }); // Debug log

    if (!enrollment) {
      // Auto-enroll student if course is published
      const course = await Course.findByPk(subCourse.course_id);
      if (course && course.status === 'published') {
        console.log('Auto-enrolling student to published course'); // Debug log
        const newEnrollment = await StudentEnrollment.create({
          student_id: req.user.id_user,
          course_id: subCourse.course_id,
          enrollment_date: new Date()
        });
        console.log('Auto-enrollment successful:', newEnrollment.id); // Debug log
      } else {
        return res.status(403).json({ 
          error: 'Not enrolled in this course',
          debug: {
            student_id: req.user.id_user,
            course_id: subCourse.course_id,
            course_status: course ? course.status : 'Course not found'
          }
        });
      }
    }

    // Update or create progress
    const [progress, created] = await StudentSubCourseProgress.upsert({
      enrollment_student_id: req.user.id_user,
      enrollment_course_id: subCourse.course_id,
      sub_course_id: subCourseId,
      status: status || 'in_progress',
      score: score || null,
      last_accessed_at: new Date()
    });

    res.json({
      message: created ? 'Progress created' : 'Progress updated',
      progress
    });
  } catch (error) {
    next(error);
  }
});

// Check enrollment status (debug endpoint)
router.get('/debug/enrollment/:courseId', authenticate, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findByPk(courseId);
    const enrollment = await StudentEnrollment.findOne({
      where: {
        student_id: req.user.id_user,
        course_id: courseId
      }
    });

    const allEnrollments = await StudentEnrollment.findAll({
      where: { student_id: req.user.id_user }
    });

    res.json({
      course: course ? {
        id: course.id,
        title: course.title,
        status: course.status,
        teacher_id: course.teacher_id
      } : null,
      enrollment: enrollment ? {
        id: enrollment.id,
        student_id: enrollment.student_id,
        course_id: enrollment.course_id,
        enrollment_date: enrollment.enrollment_date
      } : null,
      user: {
        id: req.user.id_user,
        role: req.user.role,
        email: req.user.email
      },
      allEnrollments: allEnrollments.map(e => ({
        course_id: e.course_id,
        enrollment_date: e.enrollment_date
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Manual enrollment endpoint (for testing)
router.post('/debug/enroll/:courseId', authenticate, studentOnly, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await StudentEnrollment.findOne({
      where: {
        student_id: req.user.id_user,
        course_id: courseId
      }
    });

    if (existingEnrollment) {
      return res.json({
        message: 'Already enrolled',
        enrollment: existingEnrollment
      });
    }

    // Create enrollment
    const enrollment = await StudentEnrollment.create({
      student_id: req.user.id_user,
      course_id: courseId,
      enrollment_date: new Date()
    });

    res.status(201).json({
      message: 'Enrollment created successfully',
      enrollment
    });
  } catch (error) {
    next(error);
  }
});

// Delete subcourse (teachers only)
router.delete('/:id', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const subCourse = await SubCourse.findByPk(req.params.id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!subCourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    if (subCourse.course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Not authorized to delete this subcourse' });
    }

    await subCourse.destroy();
    res.json({ message: 'SubCourse deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;