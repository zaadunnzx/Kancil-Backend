const express = require('express');
const router = express.Router();
const { Reaction, User, SubCourse } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get reactions for a subcourse
router.get('/subcourse/:subCourseId', authenticate, async (req, res) => {
  try {
    const { subCourseId } = req.params;

    // Check if subcourse exists
    const subCourse = await SubCourse.findByPk(subCourseId);
    if (!subCourse) {
      return res.status(404).json({ 
        success: false, 
        message: 'SubCourse not found' 
      });
    }

    // Get reaction counts by type
    const reactionCounts = await Reaction.findAll({
      where: { sub_course_id: subCourseId },
      attributes: [
        'reaction_type',
        [Reaction.sequelize.fn('COUNT', Reaction.sequelize.col('reaction_type')), 'count']
      ],
      group: ['reaction_type']
    });    // Get current user's reaction if any
    const userReaction = await Reaction.findOne({
      where: {
        sub_course_id: subCourseId,
        id_user: req.user.id_user
      }
    });

    // Format response
    const reactions = {
      like: 0,
      unlike: 0,
      sad: 0,
      flat: 0
    };

    reactionCounts.forEach(reaction => {
      reactions[reaction.reaction_type] = parseInt(reaction.dataValues.count);
    });

    res.json({
      success: true,
      data: {
        reactions,
        userReaction: userReaction ? userReaction.reaction_type : null,
        total: Object.values(reactions).reduce((sum, count) => sum + count, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Add or update reaction
router.post('/subcourse/:subCourseId', authenticate, async (req, res) => {  try {
    const { subCourseId } = req.params;
    const { reaction_type } = req.body;
    const userId = req.user.id_user;

    // Validate reaction type
    const validReactions = ['like', 'unlike', 'sad', 'flat'];
    if (!reaction_type || !validReactions.includes(reaction_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reaction type. Must be one of: like, unlike, sad, flat' 
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

    // Check if user already has a reaction for this subcourse
    const existingReaction = await Reaction.findOne({
      where: {
        sub_course_id: subCourseId,
        id_user: userId
      }
    });

    let reaction;
    let message;

    if (existingReaction) {
      if (existingReaction.reaction_type === reaction_type) {
        // Same reaction - remove it (toggle off)
        await existingReaction.destroy();
        message = 'Reaction removed successfully';
        reaction = null;
      } else {
        // Different reaction - update it
        await existingReaction.update({ reaction_type });
        reaction = existingReaction;
        message = 'Reaction updated successfully';
      }
    } else {
      // No existing reaction - create new one
      reaction = await Reaction.create({
        sub_course_id: subCourseId,
        id_user: userId,
        reaction_type
      });
      message = 'Reaction added successfully';
    }

    // Get updated reaction counts
    const reactionCounts = await Reaction.findAll({
      where: { sub_course_id: subCourseId },
      attributes: [
        'reaction_type',
        [Reaction.sequelize.fn('COUNT', Reaction.sequelize.col('reaction_type')), 'count']
      ],
      group: ['reaction_type']
    });

    const reactions = {
      like: 0,
      unlike: 0,
      sad: 0,
      flat: 0
    };

    reactionCounts.forEach(reactionCount => {
      reactions[reactionCount.reaction_type] = parseInt(reactionCount.dataValues.count);
    });

    res.json({
      success: true,
      message,
      data: {
        reaction: reaction ? reaction.reaction_type : null,
        reactions,
        total: Object.values(reactions).reduce((sum, count) => sum + count, 0)
      }
    });
  } catch (error) {
    console.error('Error adding/updating reaction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Remove reaction
router.delete('/subcourse/:subCourseId', authenticate, async (req, res) => {  try {
    const { subCourseId } = req.params;
    const userId = req.user.id_user;

    // Find and remove user's reaction
    const reaction = await Reaction.findOne({
      where: {
        sub_course_id: subCourseId,
        id_user: userId
      }
    });

    if (!reaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'No reaction found to remove' 
      });
    }

    await reaction.destroy();

    // Get updated reaction counts
    const reactionCounts = await Reaction.findAll({
      where: { sub_course_id: subCourseId },
      attributes: [
        'reaction_type',
        [Reaction.sequelize.fn('COUNT', Reaction.sequelize.col('reaction_type')), 'count']
      ],
      group: ['reaction_type']
    });

    const reactions = {
      like: 0,
      unlike: 0,
      sad: 0,
      flat: 0
    };

    reactionCounts.forEach(reactionCount => {
      reactions[reactionCount.reaction_type] = parseInt(reactionCount.dataValues.count);
    });

    res.json({
      success: true,
      message: 'Reaction removed successfully',
      data: {
        reactions,
        total: Object.values(reactions).reduce((sum, count) => sum + count, 0)
      }
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;