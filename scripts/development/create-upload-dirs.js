const fs = require('fs');
const path = require('path');

const createUploadDirectories = () => {
  try {
    console.log('📁 Creating upload directories...');

    const directories = [
      'uploads',
      'uploads/videos',
      'uploads/images', 
      'uploads/documents',
      'uploads/profiles',
      'uploads/announcements'
    ];

    let createdCount = 0;
    let existingCount = 0;

    directories.forEach(dir => {
      const fullPath = path.join(__dirname, '../..', dir);
      
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`  ✅ Created: ${dir}`);
        createdCount++;
      } else {
        console.log(`  📁 Exists: ${dir}`);
        existingCount++;
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`  - Created: ${createdCount} directories`);
    console.log(`  - Already existed: ${existingCount} directories`);
    console.log(`  - Total: ${directories.length} directories`);

    // Set permissions (Unix-like systems)
    if (process.platform !== 'win32') {
      console.log('\n🔒 Setting directory permissions...');
      directories.forEach(dir => {
        const fullPath = path.join(__dirname, '../..', dir);
        try {
          fs.chmodSync(fullPath, 0o755);
          console.log(`  ✅ Permissions set for: ${dir}`);
        } catch (error) {
          console.log(`  ⚠️  Could not set permissions for: ${dir}`);
        }
      });
    }

    console.log('\n🎉 Upload directories setup complete!');
    console.log('\n💡 These directories are ready for:');
    console.log('  - videos: MP4, AVI, MOV, WMV files');
    console.log('  - images: JPEG, PNG, GIF, WebP files');
    console.log('  - documents: PDF, DOC, DOCX, TXT files');
    console.log('  - profiles: Profile photo uploads');
    console.log('  - announcements: Announcement attachments');

  } catch (error) {
    console.error('❌ Failed to create upload directories:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check file system permissions');
    console.error('2. Ensure sufficient disk space');
    console.error('3. Run as administrator if needed (Windows)');
    process.exit(1);
  }
};

if (require.main === module) {
  createUploadDirectories();
}

module.exports = createUploadDirectories;