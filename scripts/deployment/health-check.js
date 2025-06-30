require('dotenv').config();
const { sequelize } = require('../../config/database');

const healthCheck = async () => {
  try {
    console.log('🏥 Performing production health check...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

    const startTime = Date.now();

    // 1. Database connection test
    console.log('\n🗄️  Testing database connection...');
    await sequelize.authenticate();
    const dbTime = Date.now() - startTime;
    console.log(`  ✅ Database connected (${dbTime}ms)`);

    // 2. Check critical tables exist
    console.log('\n📋 Checking critical tables...');
    const criticalTables = ['users', 'courses', 'subcourses', 'student_enrollments'];
    
    for (const tableName of criticalTables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = result[0].count;
        console.log(`  ✅ ${tableName}: ${count} records`);
      } catch (error) {
        console.log(`  ❌ ${tableName}: ${error.message}`);
        throw new Error(`Critical table ${tableName} is not accessible`);
      }
    }

    // 3. Check environment variables
    console.log('\n⚙️  Checking environment configuration...');
    const requiredEnvVars = [
      'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
      'JWT_SECRET', 'PORT'
    ];

    let missingVars = [];
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`  ✅ ${envVar}: configured`);
      } else {
        console.log(`  ❌ ${envVar}: missing`);
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // 4. Check optional configurations
    console.log('\n🔧 Checking optional configurations...');
    const optionalEnvVars = [
      'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
      'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'
    ];

    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        console.log(`  ✅ ${envVar}: configured`);
      } else {
        console.log(`  ⚠️  ${envVar}: not configured (optional)`);
      }
    }

    // 5. Check file system permissions
    console.log('\n📁 Checking file system...');
    const fs = require('fs');
    const path = require('path');

    const uploadDirs = ['uploads', 'uploads/videos', 'uploads/images', 'uploads/documents'];
    for (const dir of uploadDirs) {
      const fullPath = path.join(__dirname, '../..', dir);
      if (fs.existsSync(fullPath)) {
        try {
          // Test write permission
          const testFile = path.join(fullPath, '.test');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          console.log(`  ✅ ${dir}: writable`);
        } catch (error) {
          console.log(`  ❌ ${dir}: not writable`);
          throw new Error(`Upload directory ${dir} is not writable`);
        }
      } else {
        console.log(`  ⚠️  ${dir}: does not exist`);
      }
    }

    // 6. Performance metrics
    console.log('\n📊 Performance metrics...');
    const totalTime = Date.now() - startTime;
    console.log(`  ⏱️  Total health check time: ${totalTime}ms`);
    console.log(`  🗄️  Database response time: ${dbTime}ms`);

    // Final status
    console.log('\n🎉 Health check completed successfully!');
    console.log('\n📋 System Status: HEALTHY ✅');
    console.log('  - Database: ✅ Connected');
    console.log('  - Tables: ✅ Accessible');
    console.log('  - Environment: ✅ Configured');
    console.log('  - File System: ✅ Writable');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
    console.error('\n📋 System Status: UNHEALTHY ❌');
    
    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Check database connection and credentials');
    console.error('2. Verify all required environment variables are set');
    console.error('3. Ensure upload directories exist and are writable');
    console.error('4. Check PostgreSQL service is running');
    console.error('5. Verify network connectivity');

    process.exit(1);
  }
};

// Allow scheduling health checks
const scheduleHealthCheck = (intervalMinutes = 60) => {
  console.log(`🕐 Scheduling health checks every ${intervalMinutes} minutes...`);
  
  // Run initial check
  healthCheck();
  
  // Schedule periodic checks
  setInterval(async () => {
    console.log('\n🔄 Scheduled health check...');
    try {
      await healthCheck();
    } catch (error) {
      console.error('Scheduled health check failed:', error.message);
    }
  }, intervalMinutes * 60 * 1000);
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0];
  
  if (action === 'schedule') {
    const interval = parseInt(args[1]) || 60;
    scheduleHealthCheck(interval);
  } else {
    healthCheck();
  }
}

module.exports = { healthCheck, scheduleHealthCheck };