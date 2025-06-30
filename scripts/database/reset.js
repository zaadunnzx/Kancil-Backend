require('dotenv').config();
const { sequelize } = require('../../config/database');

const resetDatabase = async () => {
  try {
    console.log('🔄 Resetting database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Drop all tables and recreate schema
    console.log('🗑️ Dropping all existing data...');
    await sequelize.drop();
    
    console.log('🔧 Creating fresh schema...');
    await sequelize.sync({ force: true });
    
    console.log('✅ Database reset completed!');
    console.log('\n📋 Next step: Run data seeding scripts');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;