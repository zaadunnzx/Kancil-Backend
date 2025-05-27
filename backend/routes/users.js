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

module.exports = router;