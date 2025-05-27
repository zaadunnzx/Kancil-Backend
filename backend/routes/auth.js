const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');
const { validateRequest, schemas } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Configure multer for profile photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
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

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id_user, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register with photo upload support
router.post('/register', upload.single('foto_profil'), async (req, res, next) => {
  try {
    console.log('Register request body:', req.body);
    console.log('Register file:', req.file);

    const { nama_lengkap, email, password, role, kelas, nama_sekolah } = req.body;

    // Validate required fields manually since multer affects validation
    if (!nama_lengkap || !email || !password || !role) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete file:', err);
        });
      }
      return res.status(400).json({ 
        error: 'Missing required fields: nama_lengkap, email, password, role' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete file:', err);
        });
      }
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete file:', err);
        });
      }
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate role
    if (!['student', 'teacher'].includes(role)) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete file:', err);
        });
      }
      return res.status(400).json({ error: 'Role must be either student or teacher' });
    }

    // For students, validate kelas
    if (role === 'student') {
      const kelasNumber = parseInt(kelas);
      if (!kelas || isNaN(kelasNumber) || kelasNumber < 1 || kelasNumber > 12) {
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to delete file:', err);
          });
        }
        return res.status(400).json({ error: 'Kelas is required for students and must be between 1-12' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      // Clean up uploaded file if user already exists
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete file:', err);
        });
      }
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Generate photo URL if file was uploaded
    let foto_profil_url = null;
    if (req.file) {
      foto_profil_url = `${req.protocol}://${req.get('host')}/uploads/profiles/${req.file.filename}`;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      nama_lengkap,
      email,
      password_hash,
      role,
      kelas: role === 'student' ? parseInt(kelas) : null,
      nama_sekolah: nama_sekolah || null,
      foto_profil_url,
      status: 'active'
    });

    // Generate token
    const token = generateToken(user);

    // Update last login
    user.last_login = new Date();
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      token,
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
    // Clean up uploaded file if any error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to delete file:', err);
      });
    }
    next(error);
  }
});

// Student Login (Email/Password + Google OAuth available)
router.post('/login/student', validateRequest(schemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find student
    const user = await User.findOne({ 
      where: { 
        email,
        role: 'student' 
      } 
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid student credentials or account not found' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Student account is not active' });
    }

    // Generate token
    const token = generateToken(user);

    // Update last login
    user.last_login = new Date();
    await user.save();

    res.json({
      message: 'Student login successful',
      token,
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

// Teacher Login (Email/Password only - No Google OAuth)
router.post('/login/teacher', validateRequest(schemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find teacher
    const user = await User.findOne({ 
      where: { 
        email,
        role: 'teacher' 
      } 
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid teacher credentials or account not found' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Teacher account is not active' });
    }

    // Generate token
    const token = generateToken(user);

    // Update last login
    user.last_login = new Date();
    await user.save();

    res.json({
      message: 'Teacher login successful',
      token,
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

// Google OAuth for students only
router.get('/google/student', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: 'student'
  })(req, res, next);
});

router.get('/google/callback', 
  (req, res, next) => {
    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/auth/error?message=authentication_failed`
    })(req, res, next);
  },
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=authentication_failed`);
      }

      const token = generateToken(req.user);
      
      // Update last login
      req.user.last_login = new Date();
      await req.user.save();

      // Redirect to frontend with token and role
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&role=${req.user.role}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=authentication_failed`);
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    // req.user is already populated by the authenticate middleware
    const user = {
      id: req.user.id_user,
      nama_lengkap: req.user.nama_lengkap,
      email: req.user.email,
      role: req.user.role,
      kelas: req.user.kelas,
      nama_sekolah: req.user.nama_sekolah,
      foto_profil_url: req.user.foto_profil_url,
      status: req.user.status,
      last_login: req.user.last_login
    };

    res.json({ 
      message: 'User data retrieved successfully',
      user: user
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Refresh token
router.post('/refresh', authenticate, async (req, res, next) => {
  try {
    const token = generateToken(req.user);
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// Logout (client-side token deletion)
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Update user's last_logout timestamp
    const user = await User.findByPk(req.user.id_user);
    if (user) {
      user.last_logout = new Date();
      await user.save();
    }

    res.json({ 
      message: 'Logout successful',
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;