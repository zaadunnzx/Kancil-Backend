const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { SubCourse, Course, User, StudentSubCourseProgress, StudentEnrollment, Comment, Reaction } = require('../models');
const { authenticate, teacherOnly, studentOnly } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'videos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: video-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'video-' + uniqueSuffix + extension);
  }
});

// File filter for videos only
const fileFilter = (req, file, cb) => {
  // Allow video files
  const allowedTypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('video/');

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: fileFilter
});

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

    // Cari subcourse selanjutnya berdasarkan order_in_course
    const nextSubCourse = await SubCourse.findOne({
      where: {
        course_id: subCourse.course_id,
        order_in_course: subCourse.order_in_course + 1
      }
    });

    res.json({
      subCourse,
      nextActivity: nextSubCourse ? {
        id: nextSubCourse.id,
        title: nextSubCourse.title,
        content_type: nextSubCourse.content_type
      } : null
    });
  } catch (error) {
    next(error);
  }
});

// Create subcourse (teachers only) - Modified to handle video upload
router.post('/', authenticate, teacherOnly, (req, res, next) => {
  // Add custom error handling for multer
  upload.single('video_file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
      }
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }
    
    // Continue with the actual route handler
    handleSubcourseCreation(req, res, next);
  });
});

// Separate the main logic into its own function
async function handleSubcourseCreation(req, res, next) {
  try {
    console.log('Request body received:', req.body); // Debug log
    console.log('Uploaded file:', req.file); // Debug log
    console.log('Content-Type header:', req.get('Content-Type')); // Debug log
    
    const { course_id, title, summary, content_type, content_url, order_in_course } = req.body;
    
    // Verify teacher owns the course
    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Not authorized to add content to this course' });
    }

    let finalContentUrl = content_url;

    // Handle video upload if content_type is video
    if (content_type === 'video') {
      if (req.file) {
        // Create video URL from uploaded file
        finalContentUrl = `/uploads/videos/${req.file.filename}`;
        console.log('Video uploaded successfully:', finalContentUrl);
      } else if (!content_url) {
        // Provide more detailed error information
        return res.status(400).json({ 
          error: 'For video content, either upload a video file or provide a video URL',
          debug: {
            file_received: !!req.file,
            content_url_provided: !!content_url,
            content_type: req.get('Content-Type'),
            expected_field_name: 'video_file',
            supported_formats: 'mp4, avi, mov, wmv, flv, webm, mkv',
            max_file_size: '100MB'
          }
        });
      }
    }

    const subCourse = await SubCourse.create({
      course_id,
      title,
      summary,
      content_type,
      content_url: finalContentUrl,
      order_in_course
    });

    // Include course info in response
    const subCourseWithCourse = await SubCourse.findByPk(subCourse.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'subject']
        }
      ]
    });

    res.status(201).json({
      message: 'SubCourse created successfully',
      subCourse: subCourseWithCourse,
      upload_info: req.file ? {
        original_name: req.file.originalname,
        file_size: req.file.size,
        file_path: finalContentUrl
      } : null
    });
  } catch (error) {
    console.error('Create subcourse error:', error); // Debug log
    
    // Clean up uploaded file if database operation fails
    if (req.file) {
      const filePath = req.file.path;
      fs.unlink(filePath, (unlinkError) => {
        if (unlinkError) {
          console.error('Failed to delete uploaded file:', unlinkError);
        }
      });
    }
    
    next(error);
  }
}

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
    }    // Validate score based on content type
    let validatedScore = null;
    
    if (status === 'completed') {
      if (subCourse.content_type === 'quiz') {
        // Quiz requires numeric score (0-100)
        if (score === undefined || score === null) {
          return res.status(400).json({ 
            error: 'Score is required for quiz completion',
            content_type: subCourse.content_type,
            expected_score_format: 'number between 0-100'
          });
        }
        
        if (typeof score !== 'number' || score < 0 || score > 100) {
          return res.status(400).json({ 
            error: 'Quiz score must be a number between 0 and 100',
            content_type: subCourse.content_type,
            received_score: score,
            expected_score_format: 'number between 0-100'
          });
        }
        
        validatedScore = Math.round(score);
      } else {
        // For video, pdf_material, text, audio, image, pdf - only 0 or 1
        if (score !== undefined && score !== null) {
          if (score !== 0 && score !== 1) {
            return res.status(400).json({ 
              error: `For ${subCourse.content_type} content, score must be 0 (incomplete) or 1 (complete)`,
              content_type: subCourse.content_type,
              received_score: score,
              expected_score_format: '0 or 1 only'
            });
          }
          validatedScore = score;
        } else {
          // Default to 1 for completion if not provided
          validatedScore = 1;
        }
      }
    }    const progressData = {
      enrollment_student_id: req.user.id_user,
      enrollment_course_id: subCourse.course_id,
      sub_course_id: subCourseId,
      status: status || 'in_progress',
      score: validatedScore,
      last_accessed_at: new Date()
    };

    // Set completion timestamp
    if (status === 'completed') {
      progressData.completed_at = new Date();
    } else if (status === 'in_progress') {
      progressData.started_at = new Date();
    }

    // Use findOrCreate to avoid upsert issues with timestamps
    const [progress, created] = await StudentSubCourseProgress.findOrCreate({
      where: {
        enrollment_student_id: req.user.id_user,
        enrollment_course_id: subCourse.course_id,
        sub_course_id: subCourseId
      },
      defaults: progressData
    });

    // If not created, update the existing record
    if (!created) {
      await progress.update(progressData);
    }    // Get the updated progress with subcourse info
    const updatedProgress = await StudentSubCourseProgress.findOne({
      where: {
        enrollment_student_id: req.user.id_user,
        sub_course_id: subCourseId
      },
      include: [
        {
          model: SubCourse,
          as: 'subcourse',
          attributes: ['id', 'title', 'content_type']
        }
      ]
    });

    res.json({
      message: created ? 'Progress created successfully' : 'Progress updated successfully',
      progress: updatedProgress,
      scoring_info: {
        content_type: subCourse.content_type,
        score_type: subCourse.content_type === 'quiz' ? 'percentage (0-100)' : 'binary (0 or 1)',
        actual_score: validatedScore,
        scoring_rules: {
          quiz: 'Requires numeric score between 0-100 (percentage)',
          video: 'Binary score: 0 (not watched) or 1 (watched)',
          pdf_material: 'Binary score: 0 (not read) or 1 (read)',
          text: 'Binary score: 0 (not read) or 1 (read)',
          audio: 'Binary score: 0 (not listened) or 1 (listened)',
          image: 'Binary score: 0 (not viewed) or 1 (viewed)',
          pdf: 'Binary score: 0 (not read) or 1 (read)'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get student progress with detailed scoring
router.get('/:id/progress', authenticate, studentOnly, async (req, res, next) => {
  try {
    const subCourseId = req.params.id;
    const studentId = req.user.id_user;

    // Get subcourse with course info
    const subCourse = await SubCourse.findByPk(subCourseId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!subCourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    // Check enrollment
    const enrollment = await StudentEnrollment.findOne({
      where: {
        student_id: studentId,
        course_id: subCourse.course_id
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    // Get progress
    const progress = await StudentSubCourseProgress.findOne({
      where: {
        enrollment_student_id: studentId,
        enrollment_course_id: subCourse.course_id,
        sub_course_id: subCourseId
      }
    });

    // Format response based on content type
    const responseData = {
      sub_course_id: parseInt(subCourseId),
      content_type: subCourse.content_type,
      status: progress ? progress.status : 'not_started',
      completion_percentage: progress ? progress.completion_percentage : 0,
      time_spent: progress ? progress.time_spent : 0,
      attempts: progress ? progress.attempts : 0,
      last_accessed_at: progress ? progress.last_accessed_at : null,
      completed_at: progress ? progress.completed_at : null
    };

    // Add score based on content type
    if (subCourse.content_type === 'quiz') {
      responseData.score = progress ? progress.score : null;
      responseData.quiz_answers = progress ? progress.quiz_answers : null;
    } else {
      // For video/pdf: return binary completion (0 or 1)
      responseData.completed = progress && progress.score === 1.0 ? 1 : 0;
    }

    res.json({
      message: 'Progress retrieved successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
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