const crypto = require('crypto');

const generateRandomString = (length = 10) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

const generateCourseCode = () => {
  return generateRandomString(6).toUpperCase();
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const calculateProgress = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

const sanitizeEmail = (email) => {
  return email.toLowerCase().trim();
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const formatFileSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

const isImageFile = (mimetype) => {
  return mimetype.startsWith('image/');
};

const isVideoFile = (mimetype) => {
  return mimetype.startsWith('video/');
};

const isPDFFile = (mimetype) => {
  return mimetype === 'application/pdf';
};

// Validate progress score based on content type
const validateProgressScore = (contentType, score, status) => {
  if (status !== 'completed') {
    return { isValid: true, score: null };
  }

  if (contentType === 'quiz') {
    // Quiz requires numeric score (0-100)
    if (score === undefined || score === null) {
      return { 
        isValid: false, 
        error: 'Score is required for quiz completion' 
      };
    }
    
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return { 
        isValid: false, 
        error: 'Quiz score must be a number between 0 and 100' 
      };
    }
    
    return { isValid: true, score: Math.round(score) };
  } else {
    // For video, pdf, text, etc. - only 0 or 1
    if (score !== undefined && score !== null) {
      if (score !== 0 && score !== 1) {
        return { 
          isValid: false, 
          error: `For ${contentType} content, score must be 0 or 1` 
        };
      }
      return { isValid: true, score };
    } else {
      // Default to 1 for completion if not provided
      return { isValid: true, score: 1 };
    }
  }
};

// Get score type description based on content type
const getScoreTypeDescription = (contentType) => {
  return contentType === 'quiz' ? 'percentage (0-100)' : 'binary (0 or 1)';
};

module.exports = {
  generateRandomString,
  generateCourseCode,
  formatDateTime,
  calculateProgress,
  sanitizeEmail,
  isValidEmail,
  slugify,
  formatFileSize,
  getFileExtension,
  isImageFile,
  isVideoFile,
  isPDFFile,
  validateProgressScore,
  getScoreTypeDescription
};