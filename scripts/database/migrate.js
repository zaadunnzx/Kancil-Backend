require('dotenv').config();
const { sequelize } = require('../../config/database');

const migrateDatabase = async () => {
  try {
    console.log('🔄 Running database migrations...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync models without force (preserve existing data)
    await sequelize.sync({ alter: true });
    console.log('✅ Database schema updated successfully');
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  migrateDatabase();
}

module.exports = migrateDatabase;