require('dotenv').config();
const { sequelize } = require('../config/database');

const forceReset = async () => {
  try {
    console.log('🔄 Force resetting database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Drop and recreate schema completely
    console.log('🗑️ Dropping all existing data...');
    await sequelize.drop();
    
    console.log('🔧 Creating fresh schema...');
    await sequelize.sync({ force: true });
    
    console.log('✅ Database force reset completed!');
    console.log('\n📋 Next step: Run "npm run seed" to add sample data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Force reset failed:', error.message);
    process.exit(1);
  }
};

forceReset();