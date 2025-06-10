const { sequelize } = require('./config/database');

async function fixProgressTable() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('Checking and fixing student_sub_course_progress table...');
    
    // Check if updated_at column exists
    const tableInfo = await queryInterface.describeTable('student_sub_course_progress');
    console.log('Current table columns:', Object.keys(tableInfo));
    
    // Add updated_at column if it doesn't exist
    if (!tableInfo.updated_at) {
      console.log('Adding updated_at column...');
      await queryInterface.addColumn('student_sub_course_progress', 'updated_at', {
        type: require('sequelize').DataTypes.DATE,
        allowNull: false,
        defaultValue: require('sequelize').literal('CURRENT_TIMESTAMP')
      });
      console.log('✅ Added updated_at column');
    } else {
      console.log('✅ updated_at column already exists');
    }
    
    // Ensure created_at column exists
    if (!tableInfo.created_at) {
      console.log('Adding created_at column...');
      await queryInterface.addColumn('student_sub_course_progress', 'created_at', {
        type: require('sequelize').DataTypes.DATE,
        allowNull: false,
        defaultValue: require('sequelize').literal('CURRENT_TIMESTAMP')
      });
      console.log('✅ Added created_at column');
    } else {
      console.log('✅ created_at column already exists');
    }
    
    console.log('✅ Table structure fixed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  fixProgressTable();
}

module.exports = fixProgressTable;