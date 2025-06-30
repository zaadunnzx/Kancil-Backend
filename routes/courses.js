const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Course, SubCourse, User, StudentEnrollment, StudentSubCourseProgress } = require('../models');
const { authenticate, teacherOnly, studentOnly } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Configure multer for course cover image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/courses';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `course-cover-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Generate unique course code
const generateCourseCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Create course (teachers only) - Support cover image upload
router.post('/', authenticate, teacherOnly, upload.single('cover_image_url'), async (req, res, next) => {
  try {
    console.log('Create course request body:', req.body);
    console.log('Create course file:', req.file);

    const { title, subject, kelas, start_date, end_date } = req.body;

    // Validate required fields manually since multer affects validation
    if (!title || !subject || !kelas) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete file:', err);
        });
      }
      return res.status(400).json({ 
        error: 'Missing required fields: title, subject, kelas' 
      });
    }

    // Validate subject
    if (!['Matematika', 'IPA', 'IPS'].includes(subject)) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete file:', err);
        });
      }
      return res.status(400).json({ 
        error: 'Subject must be one of: Matematika, IPA, IPS' 
      });
    }

    // Validate kelas
    const kelasNumber = parseInt(kelas);
    if (isNaN(kelasNumber) || kelasNumber < 1 || kelasNumber > 12) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete file:', err);
        });
      }
      return res.status(400).json({ 
        error: 'Kelas must be a number between 1 and 12' 
      });
    }

    // Generate cover image URL if file was uploaded
    let cover_image_url = null;
    if (req.file) {
      cover_image_url = `${req.protocol}://${req.get('host')}/uploads/courses/${req.file.filename}`;
    }
    
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
      kelas: kelasNumber,
      teacher_id: req.user.id_user,
      course_code,
      start_date: start_date || null,
      end_date: end_date || null,
      cover_image_url,
      status: 'draft'
    });

    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    // Clean up uploaded file if any error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to delete file:', err);
      });
    }
    next(error);
  }
});

// Create course with JSON data only (no file upload) - Alternative endpoint
router.post('/create-json', authenticate, teacherOnly, validateRequest(schemas.createCourse), async (req, res, next) => {
  try {
    const { title, subject, kelas, start_date, end_date, cover_image_url } = req.body;
    
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
      start_date: start_date || null,
      end_date: end_date || null,
      cover_image_url: cover_image_url || null,
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
      where: whereClause,      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id_user', 'nama_lengkap']
        },
        {
          model: SubCourse,
          as: 'subcourses',
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
    });    // Calculate statistics for each course
    const coursesWithStats = courses.map(course => {
      const enrollmentCount = course.enrollments ? course.enrollments.length : 0;
      const subCourseCount = course.subcourses ? course.subcourses.length : 0;
      
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
    
    // Apply filters based on user role
    if (req.user.role === 'student') {
      // Students only see published courses
      whereClause.status = 'published';
      
      // Apply additional filters if provided
      if (subject) whereClause.subject = subject;
      if (kelas) whereClause.kelas = kelas;
      // Note: status filter is ignored for students as they can only see published
      
    } else if (req.user.role === 'teacher') {
      // Teachers only see their own courses (any status)
      whereClause.teacher_id = req.user.id_user;
      
      // Apply additional filters if provided
      if (subject) whereClause.subject = subject;
      if (kelas) whereClause.kelas = kelas;
      if (status) whereClause.status = status;
      
    } else {
      // For admin or other roles - see all courses (fallback)
      if (subject) whereClause.subject = subject;
      if (kelas) whereClause.kelas = kelas;
      if (status) whereClause.status = status;
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
          as: 'subcourses',
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
      },
      filter_info: {
        user_role: req.user.role,
        applied_filters: req.user.role === 'student' 
          ? 'Only published courses visible to students'
          : req.user.role === 'teacher' 
          ? 'Only your own courses visible'
          : 'All courses visible'
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
        },        {
          model: SubCourse,
          as: 'subcourses',
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

// Update course (teacher only) - Support cover image upload
router.put('/:id', authenticate, teacherOnly, upload.single('cover_image_url'), async (req, res, next) => {
  try {
    console.log('Update course request body:', req.body);
    console.log('Update course file:', req.file);

    const course = await Course.findByPk(req.params.id);
    
    if (!course) {
      // Clean up uploaded file if course not found
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete file:', err);
        });
      }
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id_user) {
      // Clean up uploaded file if not authorized
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete file:', err);
        });
      }
      return res.status(403).json({ error: 'Not authorized to update this course' });
    }

    // Prepare update data
    const updateData = { ...req.body };

    // Handle cover image upload
    if (req.file) {
      // Delete old cover image if exists
      if (course.cover_image_url) {
        const oldImagePath = course.cover_image_url.replace(`${req.protocol}://${req.get('host')}/`, '');
        const fullOldPath = path.join(__dirname, '..', oldImagePath);
        fs.unlink(fullOldPath, (err) => {
          if (err) console.log('Old image file not found or already deleted');
        });
      }

      // Set new cover image URL
      updateData.cover_image_url = `${req.protocol}://${req.get('host')}/uploads/courses/${req.file.filename}`;
    }

    // Validate fields if provided
    if (updateData.subject && !['Matematika', 'IPA', 'IPS'].includes(updateData.subject)) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete file:', err);
        });
      }
      return res.status(400).json({ 
        error: 'Subject must be one of: Matematika, IPA, IPS' 
      });
    }

    if (updateData.kelas) {
      const kelasNumber = parseInt(updateData.kelas);
      if (isNaN(kelasNumber) || kelasNumber < 1 || kelasNumber > 12) {
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to delete file:', err);
          });
        }
        return res.status(400).json({ 
          error: 'Kelas must be a number between 1 and 12' 
        });
      }
      updateData.kelas = kelasNumber;
    }

    await course.update(updateData);
    res.json({ message: 'Course updated successfully', course });
  } catch (error) {
    // Clean up uploaded file if any error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to delete file:', err);
      });
    }
    next(error);
  }
});

// Update course with JSON data only (no file upload) - Alternative endpoint
router.put('/:id/update-json', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Not authorized to update this course' });
    }

    // Validate fields if provided
    const updateData = { ...req.body };
    
    if (updateData.subject && !['Matematika', 'IPA', 'IPS'].includes(updateData.subject)) {
      return res.status(400).json({ 
        error: 'Subject must be one of: Matematika, IPA, IPS' 
      });
    }

    if (updateData.kelas) {
      const kelasNumber = parseInt(updateData.kelas);
      if (isNaN(kelasNumber) || kelasNumber < 1 || kelasNumber > 12) {
        return res.status(400).json({ 
          error: 'Kelas must be a number between 1 and 12' 
        });
      }
      updateData.kelas = kelasNumber;
    }

    await course.update(updateData);
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

// Archive course (teacher only)
router.patch('/:id/archive', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Not authorized to archive this course' });
    }

    // Only published or draft courses can be archived
    if (course.status === 'archived') {
      return res.status(400).json({ error: 'Course is already archived' });
    }

    await course.update({
      status: 'archived',
      archived_at: new Date()
    });

    res.json({ message: 'Course archived successfully', course });
  } catch (error) {
    next(error);
  }
});

// Unarchive course (teacher only)
router.patch('/:id/unarchive', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Not authorized to unarchive this course' });
    }

    // Only archived courses can be unarchived
    if (course.status !== 'archived') {
      return res.status(400).json({ error: 'Course is not archived' });
    }

    // Unarchive to draft status by default
    await course.update({
      status: 'draft',
      archived_at: null
    });

    res.json({ message: 'Course unarchived successfully', course });
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