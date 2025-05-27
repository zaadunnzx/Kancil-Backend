require('dotenv').config();
const { sequelize } = require('../config/database');

const resetDatabase = async () => {
  try {
    console.log('Resetting database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Drop all tables and types
    await sequelize.query('DROP SCHEMA public CASCADE;');
    await sequelize.query('CREATE SCHEMA public;');
    await sequelize.query('GRANT ALL ON SCHEMA public TO postgres;');
    await sequelize.query('GRANT ALL ON SCHEMA public TO public;');
    
    console.log('Database reset successfully.');
    
    // Sync models with force to recreate everything
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully.');
    
    console.log('Reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  }
};

resetDatabase();