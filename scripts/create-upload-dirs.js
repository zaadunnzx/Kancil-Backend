const fs = require('fs');
const path = require('path');

const createUploadDirectories = () => {
  const directories = [
    'uploads',
    'uploads/videos',
    'uploads/images', 
    'uploads/documents',
    'uploads/profiles',
    'uploads/announcements'
  ];

  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } else {
      console.log(`📁 Directory already exists: ${dir}`);
    }
  });

  console.log('🎉 Upload directories setup complete!');
};

createUploadDirectories();
