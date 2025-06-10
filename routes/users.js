const express = require('express');
const bcrypt = require('bcrypt');
const { User, Course, StudentEnrollment } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Get all users (teachers only)
router.get('/', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await User.findAll({
      attributes: { exclude: ['password_hash', 'google_id'] },
      order: [['created_at', 'DESC']]
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id_user, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { nama_lengkap, nama_sekolah, kelas } = req.body;
    const user = await User.findByPk(req.user.id_user);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};
    if (nama_lengkap) updateData.nama_lengkap = nama_lengkap;
    if (nama_sekolah) updateData.nama_sekolah = nama_sekolah;
    if (kelas && user.role === 'student') updateData.kelas = kelas;

    await user.update(updateData);

    const updatedUser = await User.findByPk(req.user.id_user, {
      attributes: { exclude: ['password_hash'] }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    // Validate input
    if (!current_password || !new_password) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }

    const user = await User.findByPk(req.user.id_user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(new_password, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({ 
        error: 'New password must be different from current password' 
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await user.update({ 
      password_hash: newPasswordHash,
      updated_at: new Date()
    });

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;