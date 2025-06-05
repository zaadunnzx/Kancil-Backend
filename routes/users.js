const express = require('express');
const { User, Course, StudentEnrollment } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

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
      attributes: { exclude: ['password_hash', 'google_id'] },
      include: req.user.role === 'student' ? [
        {
          model: StudentEnrollment,
          as: 'enrollments',
          include: [{ model: Course, as: 'course' }]
        }
      ] : [
        {
          model: Course,
          as: 'teacherCourses'
        }
      ]
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { nama_lengkap, kelas, nama_sekolah } = req.body;
    
    const user = await User.findByPk(req.user.id_user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      nama_lengkap: nama_lengkap || user.nama_lengkap,
      kelas: req.user.role === 'student' ? (kelas || user.kelas) : user.kelas,
      nama_sekolah: nama_sekolah || user.nama_sekolah
    });

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: user.id_user,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        role: user.role,
        kelas: user.kelas,
        nama_sekolah: user.nama_sekolah,
        foto_profil_url: user.foto_profil_url
      }
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    
    // Validate input
    if (!old_password || !new_password) {
      return res.status(400).json({ 
        error: 'Both old_password and new_password are required' 
      });
    }

    // Validate new password length
    if (new_password.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }

    // Get user with password hash
    const bcrypt = require('bcryptjs');
    const user = await User.findByPk(req.user.id_user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(old_password, user.password_hash);
    if (!isOldPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Check if new password is different from old password
    const isSamePassword = await bcrypt.compare(new_password, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({ 
        error: 'New password must be different from current password' 
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(new_password, 12);

    // Update password
    await user.update({
      password_hash: newPasswordHash,
      updated_at: new Date()
    });

    res.json({ 
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;