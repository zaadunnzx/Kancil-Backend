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
  isPDFFile
};