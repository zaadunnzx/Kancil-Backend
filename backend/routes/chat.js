const express = require('express');
const { ChatInteraction, SubCourse, Course, User, StudentEnrollment } = require('../models');
const { authenticate, studentOnly } = require('../middleware/auth');

const router = express.Router();

// Send message to AI (students only)
router.post('/message', authenticate, studentOnly, async (req, res, next) => {
  try {
    const { sub_course_id, message, message_type = 'text' } = req.body;

    if (!sub_course_id || !message) {
      return res.status(400).json({ error: 'sub_course_id and message are required' });
    }

    // Verify subcourse exists and student has access
    const subCourse = await SubCourse.findByPk(sub_course_id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!subCourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    // Check if student is enrolled
    const enrollment = await StudentEnrollment.findOne({
      where: {
        student_id: req.user.id_user,
        course_id: subCourse.course_id
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    // TODO: Integrate with actual AI service (Gemini, OpenAI, etc.)
    // For now, we'll create a simple mock response
    const mockAIResponse = `Halo! Saya Pak Dino, asisten belajar Kancil AI. 

Tentang "${message}":

Ini adalah jawaban simulasi dari AI. Dalam implementasi yang sesungguhnya, ini akan terhubung dengan layanan AI seperti:
- Google Gemini API
- OpenAI GPT API
- Atau model AI custom

Saya akan membantu kamu memahami materi "${subCourse.title}" dengan lebih baik!

Ada yang ingin kamu tanyakan lebih lanjut?`;

    // Save interaction to database
    const interaction = await ChatInteraction.create({
      student_id: req.user.id_user,
      sub_course_id,
      student_message_text: message,
      student_message_type: message_type,
      ai_response_text: mockAIResponse,
      ai_response_type: 'text',
      interaction_timestamp: new Date()
    });

    res.json({
      message: 'Message sent successfully',
      ai_response: mockAIResponse,
      interaction_id: interaction.id
    });
  } catch (error) {
    next(error);
  }
});

// Get chat history for a subcourse
router.get('/history/:subCourseId', authenticate, studentOnly, async (req, res, next) => {
  try {
    const { subCourseId } = req.params;

    // Verify subcourse exists and student has access
    const subCourse = await SubCourse.findByPk(subCourseId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!subCourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    // Check if student is enrolled
    const enrollment = await StudentEnrollment.findOne({
      where: {
        student_id: req.user.id_user,
        course_id: subCourse.course_id
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    // Get chat history
    const interactions = await ChatInteraction.findAll({
      where: {
        student_id: req.user.id_user,
        sub_course_id: subCourseId
      },
      include: [
        {
          model: SubCourse,
          as: 'subCourse',
          attributes: ['id', 'title']
        }
      ],
      order: [['interaction_timestamp', 'ASC']]
    });

    res.json({ interactions });
  } catch (error) {
    next(error);
  }
});

// Get all chat interactions for teacher analytics
router.get('/interactions', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Teacher access required' });
    }

    const { course_id, limit = 50 } = req.query;
    
    const whereClause = {};
    const includeClause = [
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
            attributes: ['id', 'title', 'teacher_id']
          }
        ]
      }
    ];

    // Filter by course if specified
    if (course_id) {
      includeClause[1].include[0].where = { 
        id: course_id,
        teacher_id: req.user.id_user 
      };
    } else {
      includeClause[1].include[0].where = { 
        teacher_id: req.user.id_user 
      };
    }

    const interactions = await ChatInteraction.findAll({
      where: whereClause,
      include: includeClause,
      order: [['interaction_timestamp', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ interactions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;