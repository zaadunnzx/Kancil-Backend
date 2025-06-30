require('dotenv').config();
const { sequelize } = require('../../config/database');

const checkDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Check tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📋 Existing tables:');
    if (tables.length === 0) {
      console.log('  ❌ No tables found');
    } else {
      tables.forEach(table => console.log(`  - ${table.table_name}`));
    }
    console.log();

    // Check critical tables structure
    const criticalTables = ['users', 'courses', 'subcourses', 'student_enrollments'];
    
    for (const tableName of criticalTables) {
      try {
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `);

        if (columns.length > 0) {
          console.log(`📊 ${tableName} table structure:`);
          columns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
          });
          console.log();
        } else {
          console.log(`❌ ${tableName} table does not exist\n`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${tableName}: ${error.message}\n`);
      }
    }

    // Check for common issues
    console.log('🔍 Common Issues Check:');
    
    // Check for updated_at columns
    try {
      const [progressColumns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'student_sub_course_progress' 
        AND column_name IN ('created_at', 'updated_at');
      `);
      
      if (progressColumns.length === 2) {
        console.log('  ✅ Timestamp columns exist in progress table');
      } else {
        console.log('  ❌ Missing timestamp columns in progress table');
      }
    } catch (error) {
      console.log('  ❌ Cannot check progress table structure');
    }

    // Check for associations
    try {
      const [fkeys] = await sequelize.query(`
        SELECT 
          tc.table_name, 
          tc.constraint_name, 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_name;
      `);

      console.log(`  ✅ Found ${fkeys.length} foreign key relationships`);
    } catch (error) {
      console.log('  ❌ Cannot check foreign key relationships');
    }

    console.log('\n🎉 Database check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('\nPossible issues:');
    console.error('1. PostgreSQL is not running');
    console.error('2. Database does not exist');
    console.error('3. Wrong credentials in .env file');
    console.error('4. Network connection issues');
    process.exit(1);
  }
};

if (require.main === module) {
  checkDatabase();
}

module.exports = checkDatabase;