require('dotenv').config();
const { sequelize } = require('../config/database');

const migrateDatabase = async () => {
  try {
    console.log('Starting database migration...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models with force to recreate everything fresh
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully.');
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateDatabase();