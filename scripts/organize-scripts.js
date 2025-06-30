#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Cleanup Script - Organize old scripts files
 * This script helps organize the old scattered scripts into the new structure
 */

const BACKUP_DIR = path.join(__dirname, 'old-scripts-backup');
const ROOT_DIR = path.join(__dirname, '..');

// Files to move/organize
const OLD_FILES = [
  // Old scripts in root directory that should be organized
  { from: 'scripts/check-db.js', to: 'scripts/database/check.js', action: 'move' },
  { from: 'scripts/create-upload-dirs.js', to: 'scripts/development/create-upload-dirs.js', action: 'move' },
  { from: 'scripts/force-reset.js', to: 'scripts/database/reset.js', action: 'replace' },
  { from: 'scripts/migrate.js', to: 'scripts/database/migrate.js', action: 'replace' },
  { from: 'scripts/quick-seed-analytics.js', to: 'scripts/database/seed/analytics.js', action: 'replace' },
  { from: 'scripts/quick-setup-analytics.js', to: 'scripts/development/reset-data.js', action: 'replace' },
  { from: 'scripts/reset-db.js', to: null, action: 'backup' }, // Duplicate
  { from: 'scripts/seed-analytics.js', to: null, action: 'backup' }, // Now part of seed/analytics.js
  { from: 'scripts/seed-quiz-questions.js', to: 'scripts/database/seed/quiz.js', action: 'replace' },
  { from: 'scripts/seed.js', to: 'scripts/database/seed/index.js', action: 'replace' },
  { from: 'scripts/setup-fresh-db.js', to: 'scripts/database/setup.js', action: 'replace' },
  { from: 'scripts/setup.js', to: null, action: 'backup' }, // Duplicate
  
  // Root level files
  { from: 'test-associations.js', to: 'scripts/testing/test-associations.js', action: 'replace' }
];

function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
  }
}

function backupFile(filePath) {
  const fullPath = path.join(ROOT_DIR, filePath);
  if (fs.existsSync(fullPath)) {
    const fileName = path.basename(filePath);
    const backupPath = path.join(BACKUP_DIR, fileName);
    
    // Add timestamp if file already exists in backup
    let finalBackupPath = backupPath;
    if (fs.existsSync(backupPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const ext = path.extname(fileName);
      const base = path.basename(fileName, ext);
      finalBackupPath = path.join(BACKUP_DIR, `${base}-${timestamp}${ext}`);
    }
    
    fs.copyFileSync(fullPath, finalBackupPath);
    console.log(`  📦 Backed up: ${filePath} → ${path.relative(ROOT_DIR, finalBackupPath)}`);
    return true;
  }
  return false;
}

function moveFile(fromPath, toPath) {
  const fullFromPath = path.join(ROOT_DIR, fromPath);
  const fullToPath = path.join(ROOT_DIR, toPath);
  
  if (fs.existsSync(fullFromPath)) {
    // Create target directory if it doesn't exist
    const targetDir = path.dirname(fullToPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Backup existing target file if it exists
    if (fs.existsSync(fullToPath)) {
      backupFile(toPath);
    }
    
    fs.renameSync(fullFromPath, fullToPath);
    console.log(`  🚚 Moved: ${fromPath} → ${toPath}`);
    return true;
  }
  return false;
}

function replaceFile(fromPath, toPath) {
  const fullFromPath = path.join(ROOT_DIR, fromPath);
  const fullToPath = path.join(ROOT_DIR, toPath);
  
  if (fs.existsSync(fullFromPath)) {
    // Backup old file
    if (fs.existsSync(fullToPath)) {
      backupFile(toPath);
    }
    
    // The new file should already exist from our organization
    // Just backup the old one
    backupFile(fromPath);
    
    // Remove old file
    fs.unlinkSync(fullFromPath);
    console.log(`  🔄 Replaced: ${fromPath} (old file backed up)`);
    return true;
  }
  return false;
}

function cleanupOldFiles() {
  console.log('🧹 Starting cleanup of old script files...\n');
  
  createBackupDir();
  
  let processedFiles = 0;
  let skippedFiles = 0;
  
  for (const fileOp of OLD_FILES) {
    const { from, to, action } = fileOp;
    
    console.log(`📄 Processing: ${from}`);
    
    let processed = false;
    
    switch (action) {
      case 'move':
        if (to) {
          processed = moveFile(from, to);
        }
        break;
        
      case 'replace':
        if (to) {
          processed = replaceFile(from, to);
        }
        break;
        
      case 'backup':
        processed = backupFile(from);
        if (processed) {
          const fullPath = path.join(ROOT_DIR, from);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`  🗑️  Removed: ${from} (backed up)`);
          }
        }
        break;
    }
    
    if (processed) {
      processedFiles++;
    } else {
      console.log(`  ⏭️  Skipped: ${from} (file not found)`);
      skippedFiles++;
    }
    
    console.log('');
  }
  
  console.log('📊 Cleanup Summary:');
  console.log(`  - Processed: ${processedFiles} files`);
  console.log(`  - Skipped: ${skippedFiles} files`);
  console.log(`  - Backup location: ${path.relative(ROOT_DIR, BACKUP_DIR)}`);
  
  console.log('\n✅ Cleanup completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Review the new organized structure in scripts/');
  console.log('2. Update your npm scripts in package.json (see scripts/NPM_SCRIPTS.md)');
  console.log('3. Test the new scripts:');
  console.log('   - node scripts/database/check.js');
  console.log('   - node scripts/testing/test-api.js');
  console.log('4. Remove old-scripts-backup/ when satisfied');
}

function updatePackageJson() {
  console.log('\n📦 Updating package.json scripts...');
  
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Backup existing scripts
      if (packageJson.scripts) {
        fs.writeFileSync(
          path.join(BACKUP_DIR, 'old-package-scripts.json'),
          JSON.stringify(packageJson.scripts, null, 2)
        );
        console.log('  📦 Backed up existing package.json scripts');
      }
      
      // Update with new organized scripts
      packageJson.scripts = {
        ...packageJson.scripts,
        "db:setup": "node scripts/database/setup.js",
        "db:migrate": "node scripts/database/migrate.js", 
        "db:reset": "node scripts/database/reset.js",
        "db:check": "node scripts/database/check.js",
        
        "seed": "node scripts/database/seed/index.js",
        "seed:users": "node scripts/database/seed/users.js",
        "seed:courses": "node scripts/database/seed/courses.js",
        "seed:analytics": "node scripts/database/seed/analytics.js",
        "seed:quiz": "node scripts/database/seed/quiz.js",
        
        "test:api": "node scripts/testing/test-api.js",
        "test:associations": "node scripts/testing/test-associations.js",
        "test:api:auth": "node scripts/testing/test-api.js auth",
        "test:api:courses": "node scripts/testing/test-api.js courses",
        
        "dev:create-dirs": "node scripts/development/create-upload-dirs.js",
        "dev:reset-data": "node scripts/development/reset-data.js",
        
        "deploy:health": "node scripts/deployment/health-check.js",
        
        "setup-fresh": "npm run db:setup && npm run seed && npm run dev:create-dirs"
      };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('  ✅ Updated package.json with new scripts');
      
    } catch (error) {
      console.log(`  ❌ Failed to update package.json: ${error.message}`);
    }
  }
}

// Show current structure
function showNewStructure() {
  console.log('\n📁 New Organized Structure:');
  console.log(`
scripts/
├── README.md                      # 📖 Documentation
├── NPM_SCRIPTS.md                 # 📋 NPM commands reference
├── database/                      # 🗄️ Database operations
│   ├── setup.js                   # Fresh database setup
│   ├── migrate.js                 # Schema migrations
│   ├── reset.js                   # Reset database
│   ├── check.js                   # Health check
│   └── seed/                      # Data seeding
│       ├── index.js               # Main seeding orchestrator
│       ├── users.js               # User data
│       ├── courses.js             # Course data
│       ├── analytics.js           # Analytics data
│       └── quiz.js                # Quiz questions
├── testing/                       # 🧪 Testing utilities
│   ├── test-api.js                # API endpoint testing
│   ├── test-associations.js       # Database relationship testing
│   └── generate-test-data.js      # Test data generation
├── development/                   # 🛠️ Development utilities
│   ├── create-upload-dirs.js      # Create upload directories
│   ├── reset-data.js              # Reset development data
│   └── create-admin.js            # Create admin user
└── deployment/                    # 🚀 Deployment scripts
    ├── pre-deploy.js              # Pre-deployment checks
    ├── post-deploy.js             # Post-deployment setup
    └── health-check.js            # Production health check
  `);
}

// Main execution
if (require.main === module) {
  console.log('🎯 Kancil AI Backend - Scripts Organization Tool\n');
  
  const args = process.argv.slice(2);
  const action = args[0];
  
  switch (action) {
    case 'show':
      showNewStructure();
      break;
    case 'cleanup':
      cleanupOldFiles();
      break;
    case 'update-package':
      createBackupDir();
      updatePackageJson();
      break;
    case 'full':
    default:
      showNewStructure();
      cleanupOldFiles();
      updatePackageJson();
      break;
  }
}

module.exports = {
  cleanupOldFiles,
  updatePackageJson,
  showNewStructure
};