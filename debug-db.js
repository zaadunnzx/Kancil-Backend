const { sequelize } = require('./config/database');

async function debugConnection() {
  try {
    console.log('🔍 Debugging database connection...\n');
    
    // Get config details (without showing password)
    const config = sequelize.config;
    console.log('Database Configuration:');
    console.log('- Host:', config.host);
    console.log('- Port:', config.port);
    console.log('- Database:', config.database);
    console.log('- Username:', config.username);
    console.log('- Password type:', typeof config.password);
    console.log('- Password length:', config.password ? config.password.length : 'undefined');
    console.log('- Dialect:', config.dialect);
    console.log('');

    // Test connection
    console.log('Testing connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test query
    console.log('\nTesting basic query...');
    const [results] = await sequelize.query("SELECT version();");
    console.log('✅ PostgreSQL version:', results[0].version);
    
    // Check existing tables
    console.log('\nChecking existing tables...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Existing tables:', tables);
    
    // Check if target tables already exist
    const targetTables = ['comments', 'reactions', 'student_sub_course_progress'];
    for (const table of targetTables) {
      const exists = tables.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'exists' : 'not found'}`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n🔧 Common Solutions:');
      console.error('1. Check if PostgreSQL server is running');
      console.error('2. Verify database credentials in config/database.js');
      console.error('3. Ensure password is a string (wrapped in quotes)');
      console.error('4. Check if database exists');
      console.error('5. Verify network connectivity to database');
      
      if (error.message.includes('password must be a string')) {
        console.error('\n⚠️ Password Issue Detected:');
        console.error('- Open config/database.js');
        console.error('- Make sure password is in quotes: password: "yourpassword"');
        console.error('- Not: password: yourpassword (without quotes)');
      }
    }
    
    process.exit(1);
  }
}

// Run debug if this file is executed directly
if (require.main === module) {
  debugConnection();
}

module.exports = debugConnection;