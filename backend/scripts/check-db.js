require('dotenv').config();
const { sequelize } = require('../config/database');

const checkDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // Check tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📋 Existing tables:');
    tables.forEach(table => console.log(`  - ${table.table_name}`));
    console.log();

    // Check courses table structure if exists
    try {
      const [courseColumns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'courses' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);

      if (courseColumns.length > 0) {
        console.log('📊 Courses table structure:');
        courseColumns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      } else {
        console.log('❌ Courses table does not exist');
      }
    } catch (error) {
      console.log('❌ Courses table does not exist or error checking:', error.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  }
};

checkDatabase();