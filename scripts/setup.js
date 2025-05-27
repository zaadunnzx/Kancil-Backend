require('dotenv').config();
const { sequelize } = require('../config/database');

const setupDatabase = async () => {
  try {
    console.log('🚀 Setting up database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Create fresh database schema
    console.log('🔄 Creating fresh database schema...');
    await sequelize.sync({ force: true });
    console.log('✅ Database schema created successfully.');
    
    console.log('🎉 Database setup completed!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run seed');
    console.log('2. Start server: npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
};

setupDatabase();