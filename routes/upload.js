const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|mp4|mp3|avi|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and videos are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Upload single file
router.post('/single', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

// Upload multiple files
router.post('/multiple', authenticate, upload.array('files', 5), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: files
    });
  } catch (error) {
    next(error);
  }
});

// Upload profile picture
router.post('/profile-picture', authenticate, upload.single('profilePicture'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No profile picture uploaded' });
    }

    // Check if it's an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed for profile pictures' });
    }

    const profilePictureUrl = `/uploads/${req.file.filename}`;
    
    // Update user profile picture URL in database
    const { User } = require('../models');
    await User.update(
      { foto_profil_url: profilePictureUrl },
      { where: { id_user: req.user.id_user } }
    );

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePictureUrl: profilePictureUrl
    });
  } catch (error) {
    next(error);
  }
});

// Upload profile photo (alternative endpoint)
router.post('/profile-photo', authenticate, upload.single('foto_profil'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No profile photo uploaded' });
    }

    // Check if it's an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed for profile photos' });
    }

    // Generate photo URL
    const foto_profil_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    // Update user profile photo URL in database
    const { User } = require('../models');
    const user = await User.findByPk(req.user.id_user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      foto_profil_url: foto_profil_url,
      updated_at: new Date()
    });

    res.json({
      message: 'Profile photo uploaded successfully',
      foto_profil_url: foto_profil_url,
      user: {
        id: user.id_user,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        role: user.role,
        foto_profil_url: foto_profil_url
      }
    });
  } catch (error) {
    next(error);
  }
});

// Serve uploaded files with proper CORS headers
router.get('/:type/:filename', (req, res) => {
  try {
    const { type, filename } = req.params;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Validate type
    const allowedTypes = ['images', 'videos', 'documents', 'courses', 'profiles', 'announcements'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    // Construct file path
    const filePath = path.join(__dirname, '..', 'uploads', type, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

module.exports = router;