const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { 
  User, 
  Course, 
  Announcement,
  AnnouncementAttachment,
  StudentEnrollment 
} = require('../models');
const { authenticate, teacherOnly } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/announcements');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'announcement-' + uniqueSuffix + fileExtension);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Create announcement (Teacher only) - Simplified version
router.post('/', authenticate, teacherOnly, upload.array('attachments', 5), async (req, res, next) => {
  try {
    const teacherId = req.user.id_user;
    const {
      title,
      content,
      course_id,
      priority = 'medium',
      status = 'published', // Default to published for simplicity
      expires_at,
      links // JSON string of links
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required'
      });
    }

    // Verify course ownership if course_id is provided
    if (course_id) {
      const course = await Course.findOne({
        where: { 
          id: course_id, 
          teacher_id: teacherId 
        }
      });

      if (!course) {
        return res.status(404).json({
          error: 'Course not found or access denied'
        });
      }
    }

    // Prepare announcement data
    const announcementData = {
      teacher_id: teacherId,
      course_id: course_id || null,
      title,
      content,
      priority,
      status,
      announcement_date: new Date()
    };

    // Add expiration date if provided
    if (expires_at) {
      announcementData.expires_at = new Date(expires_at);
    }

    // Create announcement
    const announcement = await Announcement.create(announcementData);

    // Handle file attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const attachmentData = {
          announcement_id: announcement.id,
          attachment_type: 'file',
          file_name: file.originalname,
          file_path: file.path,
          file_url: `/uploads/announcements/${file.filename}`,
          file_size: file.size,
          mime_type: file.mimetype
        };
        
        const attachment = await AnnouncementAttachment.create(attachmentData);
        attachments.push(attachment);
      }
    }

    // Handle link attachments
    if (links) {
      try {
        const linkArray = JSON.parse(links);
        for (const link of linkArray) {
          const linkAttachment = {
            announcement_id: announcement.id,
            attachment_type: 'link',
            link_url: link.url,
            link_title: link.title || link.url
          };
          
          const attachment = await AnnouncementAttachment.create(linkAttachment);
          attachments.push(attachment);
        }
      } catch (error) {
        console.error('Error parsing links:', error);
      }
    }

    // Include teacher and course info in response
    const announcementWithDetails = await Announcement.findByPk(announcement.id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id_user', 'nama_lengkap', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'subject', 'course_code'],
          required: false
        },
        {
          model: AnnouncementAttachment,
          as: 'attachments'
        }
      ]
    });

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: announcementWithDetails
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    next(error);
  }
});

// Get my announcements (Teacher only)
router.get('/my-announcements', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const { 
      course_id, 
      priority, 
      status,
      search,
      page = 1, 
      limit = 10
    } = req.query;

    const whereClause = { teacher_id: req.user.id_user };

    // Filter by course
    if (course_id) {
      whereClause.course_id = course_id;
    }

    // Filter by priority
    if (priority) {
      whereClause.priority = priority;
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Search in title or content
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { rows: announcements, count: total } = await Announcement.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id_user', 'nama_lengkap', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'subject', 'course_code'],
          required: false
        },
        {
          model: AnnouncementAttachment,
          as: 'attachments'
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['announcement_date', 'DESC']
      ],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      announcements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching my announcements:', error);
    next(error);
  }
});

// Get announcements for students
router.get('/for-students', authenticate, async (req, res, next) => {
  try {
    const { 
      course_id, 
      priority, 
      page = 1, 
      limit = 10
    } = req.query;

    const whereClause = { status: 'published' };

    // Filter by course
    if (course_id) {
      whereClause.course_id = course_id;
    }

    // Filter by priority
    if (priority) {
      whereClause.priority = priority;
    }

    // Students only see announcements for courses they're enrolled in + global announcements
    if (req.user.role === 'student') {
      const studentEnrollments = await StudentEnrollment.findAll({
        where: { student_id: req.user.id_user },
        attributes: ['course_id']
      });

      const enrolledCourseIds = studentEnrollments.map(e => e.course_id);
      
      whereClause[Op.or] = [
        { course_id: { [Op.in]: enrolledCourseIds } },
        { course_id: null } // Global announcements
      ];
    }

    // Filter out expired announcements
    whereClause[Op.and] = [
      {
        [Op.or]: [
          { expires_at: null },
          { expires_at: { [Op.gt]: new Date() } }
        ]
      }
    ];

    const offset = (page - 1) * limit;

    const { rows: announcements, count: total } = await Announcement.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id_user', 'nama_lengkap', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'subject', 'course_code'],
          required: false
        },
        {
          model: AnnouncementAttachment,
          as: 'attachments'
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['announcement_date', 'DESC']
      ],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      announcements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching announcements for students:', error);
    next(error);
  }
});

// Get all announcements (general - kept for backward compatibility)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { 
      course_id, 
      priority, 
      status = 'published',
      page = 1, 
      limit = 10
    } = req.query;

    const whereClause = { status: 'published' };

    // Filter by course
    if (course_id) {
      whereClause.course_id = course_id;
    }

    // Filter by priority
    if (priority) {
      whereClause.priority = priority;
    }

    // For students: only show announcements for courses they're enrolled in
    if (req.user.role === 'student') {
      const studentEnrollments = await StudentEnrollment.findAll({
        where: { student_id: req.user.id_user },
        attributes: ['course_id']
      });

      const enrolledCourseIds = studentEnrollments.map(e => e.course_id);
      
      whereClause[Op.or] = [
        { course_id: { [Op.in]: enrolledCourseIds } },
        { course_id: null } // Global announcements
      ];
    }

    // For teachers: only show their own announcements
    if (req.user.role === 'teacher') {
      whereClause.teacher_id = req.user.id_user;
    }

    // Filter out expired announcements
    whereClause[Op.and] = [
      {
        [Op.or]: [
          { expires_at: null },
          { expires_at: { [Op.gt]: new Date() } }
        ]
      }
    ];

    const offset = (page - 1) * limit;

    const { rows: announcements, count: total } = await Announcement.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id_user', 'nama_lengkap', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'subject', 'course_code'],
          required: false
        },
        {
          model: AnnouncementAttachment,
          as: 'attachments'
        }
      ],
      order: [
        ['priority', 'DESC'], // High priority first
        ['announcement_date', 'DESC'] // Newest first
      ],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      announcements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    next(error);
  }
});

// Get announcement by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const announcement = await Announcement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id_user', 'nama_lengkap', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'subject', 'course_code'],
          required: false
        },
        {
          model: AnnouncementAttachment,
          as: 'attachments'
        }
      ]
    });

    if (!announcement) {
      return res.status(404).json({
        error: 'Announcement not found'
      });
    }

    // Simple permission check
    if (req.user.role === 'teacher' && announcement.teacher_id !== req.user.id_user) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    res.json({ announcement });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    next(error);
  }
});

// Update announcement (Teacher only)
router.put('/:id', authenticate, teacherOnly, upload.array('new_attachments', 5), async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id_user;
    const {
      title,
      content,
      course_id,
      priority,
      status,
      expires_at,
      links,
      remove_attachment_ids
    } = req.body;

    const announcement = await Announcement.findOne({
      where: { 
        id: id,
        teacher_id: teacherId 
      },
      include: [
        {
          model: AnnouncementAttachment,
          as: 'attachments'
        }
      ]
    });

    if (!announcement) {
      return res.status(404).json({
        error: 'Announcement not found or access denied'
      });
    }

    // Verify course ownership if course_id is being updated
    if (course_id && course_id !== announcement.course_id) {
      const course = await Course.findOne({
        where: { 
          id: course_id, 
          teacher_id: teacherId 
        }
      });

      if (!course) {
        return res.status(404).json({
          error: 'Course not found or access denied'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (course_id !== undefined) updateData.course_id = course_id || null;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;
    if (expires_at !== undefined) {
      updateData.expires_at = expires_at ? new Date(expires_at) : null;
    }

    // Update announcement
    await announcement.update(updateData);

    // Handle removing existing attachments
    if (remove_attachment_ids) {
      try {
        const idsToRemove = JSON.parse(remove_attachment_ids);
        const attachmentsToRemove = await AnnouncementAttachment.findAll({
          where: { 
            id: { [Op.in]: idsToRemove },
            announcement_id: id 
          }
        });

        // Delete files from filesystem
        for (const attachment of attachmentsToRemove) {
          if (attachment.attachment_type === 'file' && attachment.file_path) {
            if (fs.existsSync(attachment.file_path)) {
              fs.unlinkSync(attachment.file_path);
            }
          }
        }

        // Delete from database
        await AnnouncementAttachment.destroy({
          where: { 
            id: { [Op.in]: idsToRemove },
            announcement_id: id 
          }
        });
      } catch (error) {
        console.error('Error removing attachments:', error);
      }
    }

    // Handle new file attachments
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const attachmentData = {
          announcement_id: announcement.id,
          attachment_type: 'file',
          file_name: file.originalname,
          file_path: file.path,
          file_url: `/uploads/announcements/${file.filename}`,
          file_size: file.size,
          mime_type: file.mimetype
        };
        
        await AnnouncementAttachment.create(attachmentData);
      }
    }

    // Handle new link attachments
    if (links) {
      try {
        const linkArray = JSON.parse(links);
        for (const link of linkArray) {
          const linkAttachment = {
            announcement_id: announcement.id,
            attachment_type: 'link',
            link_url: link.url,
            link_title: link.title || link.url
          };
          
          await AnnouncementAttachment.create(linkAttachment);
        }
      } catch (error) {
        console.error('Error parsing links:', error);
      }
    }

    // Get updated announcement with details
    const updatedAnnouncement = await Announcement.findByPk(announcement.id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id_user', 'nama_lengkap', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'subject', 'course_code'],
          required: false
        },
        {
          model: AnnouncementAttachment,
          as: 'attachments'
        }
      ]
    });

    res.json({
      message: 'Announcement updated successfully',
      announcement: updatedAnnouncement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    next(error);
  }
});

// Publish announcement (Teacher only)
router.patch('/:id/publish', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id_user;

    const announcement = await Announcement.findOne({
      where: { 
        id: id,
        teacher_id: teacherId 
      }
    });

    if (!announcement) {
      return res.status(404).json({
        error: 'Announcement not found or access denied'
      });
    }

    await announcement.update({
      status: 'published',
      announcement_date: new Date() // Update announcement date when published
    });

    res.json({
      message: 'Announcement published successfully',
      announcement
    });
  } catch (error) {
    console.error('Error publishing announcement:', error);
    next(error);
  }
});

// Archive announcement (Teacher only)
router.patch('/:id/archive', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id_user;

    const announcement = await Announcement.findOne({
      where: { 
        id: id,
        teacher_id: teacherId 
      }
    });

    if (!announcement) {
      return res.status(404).json({
        error: 'Announcement not found or access denied'
      });
    }

    await announcement.update({
      status: 'archived'
    });

    res.json({
      message: 'Announcement archived successfully',
      announcement
    });
  } catch (error) {
    console.error('Error archiving announcement:', error);
    next(error);
  }
});

// Delete announcement (Teacher only)
router.delete('/:id', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id_user;

    const announcement = await Announcement.findOne({
      where: { 
        id: id,
        teacher_id: teacherId 
      },
      include: [
        {
          model: AnnouncementAttachment,
          as: 'attachments'
        }
      ]
    });

    if (!announcement) {
      return res.status(404).json({
        error: 'Announcement not found or access denied'
      });
    }

    // Delete attachment files if exist
    if (announcement.attachments) {
      for (const attachment of announcement.attachments) {
        if (attachment.attachment_type === 'file' && attachment.file_path) {
          if (fs.existsSync(attachment.file_path)) {
            fs.unlinkSync(attachment.file_path);
          }
        }
      }
    }

    // Delete announcement (will cascade delete attachments)
    await announcement.destroy();

    res.json({
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    next(error);
  }
});

module.exports = router;