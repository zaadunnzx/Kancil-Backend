const express = require('express');
const router = express.Router();
const { Comment, User, SubCourse } = require('../models');
const { authenticate } = require('../middleware/auth');

// Get all comments for a subcourse
router.get('/subcourse/:subCourseId', authenticate, async (req, res) => {
  try {
    const { subCourseId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Check if subcourse exists
    const subCourse = await SubCourse.findByPk(subCourseId);
    if (!subCourse) {
      return res.status(404).json({ 
        success: false, 
        message: 'SubCourse not found' 
      });
    }

    const comments = await Comment.findAndCountAll({
      where: { 
        sub_course_id: subCourseId,
        parent_id: null // Only root comments (not nested)
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id_user', 'nama_lengkap', 'foto_profil_url', 'role']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        comments: comments.rows,
        pagination: {
          total: comments.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(comments.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Create a new comment
router.post('/subcourse/:subCourseId', authenticate, async (req, res) => {  try {
    const { subCourseId } = req.params;
    const { content } = req.body;
    const userId = req.user.id_user;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content is required' 
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content must be less than 1000 characters' 
      });
    }

    // Check if subcourse exists
    const subCourse = await SubCourse.findByPk(subCourseId);
    if (!subCourse) {
      return res.status(404).json({ 
        success: false, 
        message: 'SubCourse not found' 
      });
    }

    // Create comment
    const comment = await Comment.create({
      sub_course_id: subCourseId,
      id_user: userId,
      content: content.trim()
    });

    // Fetch the created comment with user info
    const createdComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id_user', 'nama_lengkap', 'foto_profil_url', 'role']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: createdComment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Update a comment
router.put('/:commentId', authenticate, async (req, res) => {  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id_user;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content is required' 
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content must be less than 1000 characters' 
      });
    }

    // Find comment
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }    // Check if user owns the comment
    if (comment.id_user !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only edit your own comments' 
      });
    }

    // Update comment
    await comment.update({
      content: content.trim()
    });

    // Fetch updated comment with user info
    const updatedComment = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id_user', 'nama_lengkap', 'foto_profil_url', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Delete a comment
router.delete('/:commentId', authenticate, async (req, res) => {  try {
    const { commentId } = req.params;
    const userId = req.user.id_user;

    // Find comment
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }    // Check if user owns the comment
    if (comment.id_user !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own comments' 
      });
    }

    // Delete comment
    await comment.destroy();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;