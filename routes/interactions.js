const express = require('express');
const { Comment, Reaction, SubCourse, Course, User, StudentEnrollment } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// =========================
// COMMENTS ENDPOINTS
// =========================

// Create comment on subcourse
router.post('/comments', authenticate, validateRequest(schemas.createComment), async (req, res, next) => {
  try {
    const { sub_course_id, content, parent_id } = req.body;

    // Verify subcourse exists
    const subCourse = await SubCourse.findByPk(sub_course_id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!subCourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    // Check if user has access to the course
    if (req.user.role === 'student') {
      // Student must be enrolled in the course
      const enrollment = await StudentEnrollment.findOne({
        where: {
          student_id: req.user.id_user,
          course_id: subCourse.course_id
        }
      });

      if (!enrollment && subCourse.course.status !== 'published') {
        return res.status(403).json({ error: 'Not enrolled in this course' });
      }
    } else if (req.user.role === 'teacher') {
      // Teacher must own the course
      if (subCourse.course.teacher_id !== req.user.id_user) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // If parent_id is provided, verify it exists
    if (parent_id) {
      const parentComment = await Comment.findByPk(parent_id);
      if (!parentComment || parentComment.sub_course_id !== sub_course_id) {
        return res.status(400).json({ error: 'Invalid parent comment' });
      }
    }

    // Create comment
    const comment = await Comment.create({
      sub_course_id,
      id_user: req.user.id_user,
      content,
      parent_id: parent_id || null
    });

    // Get comment with user info
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id_user', 'nama_lengkap', 'role', 'foto_profil_url']
        }
      ]
    });

    res.status(201).json({
      message: 'Comment created successfully',
      comment: commentWithUser
    });
  } catch (error) {
    next(error);
  }
});

// Get comments for a subcourse
router.get('/comments/subcourse/:subCourseId', authenticate, async (req, res, next) => {
  try {
    const { subCourseId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Verify subcourse exists and user has access
    const subCourse = await SubCourse.findByPk(subCourseId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!subCourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    // Check access
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
    } else if (req.user.role === 'teacher' && subCourse.course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get comments (only top-level, no nesting as requested)
    const { count, rows: comments } = await Comment.findAndCountAll({
      where: { 
        sub_course_id: subCourseId,
        parent_id: null // Only top-level comments
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id_user', 'nama_lengkap', 'role', 'foto_profil_url']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      comments,
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

// Update comment (only author can update)
router.put('/comments/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0 || content.length > 1000) {
      return res.status(400).json({ error: 'Content must be between 1-1000 characters' });
    }

    const comment = await Comment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id_user', 'nama_lengkap', 'role']
        }
      ]
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only comment author can update
    if (comment.id_user !== req.user.id_user) {
      return res.status(403).json({ error: 'Can only update your own comments' });
    }

    await comment.update({ content: content.trim() });

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    next(error);
  }
});

// Delete comment (only author can delete)
router.delete('/comments/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only comment author can delete
    if (comment.id_user !== req.user.id_user) {
      return res.status(403).json({ error: 'Can only delete your own comments' });
    }

    await comment.destroy();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =========================
// REACTIONS ENDPOINTS
// =========================

// Add or update reaction to subcourse
router.post('/reactions', authenticate, validateRequest(schemas.addReaction), async (req, res, next) => {
  try {
    const { sub_course_id, reaction_type } = req.body;

    // Verify subcourse exists
    const subCourse = await SubCourse.findByPk(sub_course_id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!subCourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    // Check access (students must be enrolled)
    if (req.user.role === 'student') {
      const enrollment = await StudentEnrollment.findOne({
        where: {
          student_id: req.user.id_user,
          course_id: subCourse.course_id
        }
      });

      if (!enrollment && subCourse.course.status !== 'published') {
        return res.status(403).json({ error: 'Not enrolled in this course' });
      }
    }

    // Upsert reaction (update if exists, create if not)
    const [reaction, created] = await Reaction.upsert({
      sub_course_id,
      id_user: req.user.id_user,
      reaction_type
    }, {
      returning: true
    });

    // Get reaction counts for this subcourse
    const reactionCounts = await Reaction.findAll({
      where: { sub_course_id },
      attributes: [
        'reaction_type',
        [require('sequelize').fn('COUNT', '*'), 'count']
      ],
      group: ['reaction_type']
    });

    const counts = {
      like: 0,
      unlike: 0,
      sad: 0,
      flat: 0
    };

    reactionCounts.forEach(r => {
      counts[r.reaction_type] = parseInt(r.dataValues.count);
    });

    res.json({
      message: created ? 'Reaction added' : 'Reaction updated',
      reaction,
      reactionCounts: counts
    });
  } catch (error) {
    next(error);
  }
});

// Remove reaction from subcourse
router.delete('/reactions/subcourse/:subCourseId', authenticate, async (req, res, next) => {
  try {
    const { subCourseId } = req.params;

    const reaction = await Reaction.findOne({
      where: {
        sub_course_id: subCourseId,
        id_user: req.user.id_user
      }
    });

    if (!reaction) {
      return res.status(404).json({ error: 'Reaction not found' });
    }

    await reaction.destroy();

    // Get updated reaction counts
    const reactionCounts = await Reaction.findAll({
      where: { sub_course_id: subCourseId },
      attributes: [
        'reaction_type',
        [require('sequelize').fn('COUNT', '*'), 'count']
      ],
      group: ['reaction_type']
    });

    const counts = {
      like: 0,
      unlike: 0,
      sad: 0,
      flat: 0
    };

    reactionCounts.forEach(r => {
      counts[r.reaction_type] = parseInt(r.dataValues.count);
    });

    res.json({
      message: 'Reaction removed',
      reactionCounts: counts
    });
  } catch (error) {
    next(error);
  }
});

// Get reactions for a subcourse
router.get('/reactions/subcourse/:subCourseId', authenticate, async (req, res, next) => {
  try {
    const { subCourseId } = req.params;

    // Verify subcourse exists
    const subCourse = await SubCourse.findByPk(subCourseId);
    if (!subCourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    // Get reaction counts
    const reactionCounts = await Reaction.findAll({
      where: { sub_course_id: subCourseId },
      attributes: [
        'reaction_type',
        [require('sequelize').fn('COUNT', '*'), 'count']
      ],
      group: ['reaction_type']
    });

    const counts = {
      like: 0,
      unlike: 0,
      sad: 0,
      flat: 0
    };

    reactionCounts.forEach(r => {
      counts[r.reaction_type] = parseInt(r.dataValues.count);
    });

    // Get current user's reaction
    const userReaction = await Reaction.findOne({
      where: {
        sub_course_id: subCourseId,
        id_user: req.user.id_user
      }
    });

    res.json({
      reactionCounts: counts,
      userReaction: userReaction ? userReaction.reaction_type : null
    });
  } catch (error) {
    next(error);
  }
});

// Get reactions with user details (for analytics)
router.get('/reactions/subcourse/:subCourseId/details', authenticate, async (req, res, next) => {
  try {
    const { subCourseId } = req.params;

    // Verify subcourse exists and check access
    const subCourse = await SubCourse.findByPk(subCourseId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!subCourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    // Only teachers can see detailed reactions
    if (req.user.role !== 'teacher' || subCourse.course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const reactions = await Reaction.findAll({
      where: { sub_course_id: subCourseId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id_user', 'nama_lengkap', 'role']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ reactions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;