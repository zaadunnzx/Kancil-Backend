require('dotenv').config();
const { sequelize } = require('../../config/database');

const resetDevelopmentData = async () => {
  try {
    console.log('🔄 Resetting development data...');
    console.log('ℹ️  This will clear data but preserve database schema');

    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Get all model names except system tables
    const models = require('../../models');
    const modelNames = Object.keys(models).filter(name => 
      name !== 'sequelize' && name !== 'Sequelize'
    );

    console.log(`🗑️  Clearing data from ${modelNames.length} tables...`);

    // Clear data in reverse dependency order to avoid foreign key constraints
    const clearOrder = [
      'StudentAnalytics',
      'StudentSubCourseProgress', 
      'QuizResults',
      'QuizAnswers',
      'QuizSessions',
      'QuizBank',
      'QuizSettings',
      'Reaction',
      'Comment',
      'StudentEnrollment',
      'SubCourse',
      'Course',
      'User'
    ];

    let clearedTables = 0;

    for (const modelName of clearOrder) {
      if (models[modelName]) {
        try {
          const count = await models[modelName].count();
          await models[modelName].destroy({ where: {}, force: true });
          console.log(`  ✅ ${modelName}: ${count} records cleared`);
          clearedTables++;
        } catch (error) {
          console.log(`  ⚠️  ${modelName}: ${error.message}`);
        }
      }
    }

    // Clear any remaining tables not in the ordered list
    for (const modelName of modelNames) {
      if (!clearOrder.includes(modelName)) {
        try {
          const count = await models[modelName].count();
          if (count > 0) {
            await models[modelName].destroy({ where: {}, force: true });
            console.log(`  ✅ ${modelName}: ${count} records cleared`);
            clearedTables++;
          }
        } catch (error) {
          console.log(`  ⚠️  ${modelName}: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Reset Summary:`);
    console.log(`  - Tables processed: ${clearedTables}`);
    console.log(`  - Schema preserved: ✅`);
    console.log(`  - Data cleared: ✅`);

    console.log('\n🎉 Development data reset completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Re-seed data: node scripts/database/seed/index.js');
    console.log('2. Or seed specific data:');
    console.log('   - node scripts/database/seed/users.js');
    console.log('   - node scripts/database/seed/courses.js');
    console.log('   - node scripts/database/seed/analytics.js');

    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check database connection');
    console.error('2. Ensure no other processes are using the database');
    console.error('3. Check for foreign key constraints');
    console.error('\nFor complete reset, use: node scripts/database/reset.js');
    process.exit(1);
  }
};

if (require.main === module) {
  resetDevelopmentData();
}

module.exports = resetDevelopmentData;