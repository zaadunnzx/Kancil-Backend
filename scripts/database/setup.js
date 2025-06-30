require('dotenv').config();
const { sequelize } = require('../../config/database');
const bcrypt = require('bcryptjs');

const setupFreshDatabase = async () => {
  try {
    console.log('🚀 Setting up fresh database from scratch...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('📋 Creating database tables...');
    await sequelize.sync({ force: true });
    console.log('✅ All tables created successfully');

    // Verify tables were created
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📊 Created tables:');
    tables.forEach(table => console.log(`  ✓ ${table.table_name}`));

    // Verify courses table has required columns
    const [courseColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('\n🎯 Courses table structure verified:');
    courseColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    const hasKelasColumn = courseColumns.some(col => col.column_name === 'kelas');
    if (hasKelasColumn) {
      console.log('  ✅ Required columns verified');
    } else {
      console.log('  ❌ Missing required columns!');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: node scripts/database/seed/index.js');
    console.log('2. Start server: npm run dev');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check your .env database credentials');
    console.error('3. Ensure you have permission to create databases');
    process.exit(1);
  }
};

if (require.main === module) {
  setupFreshDatabase();
}

module.exports = setupFreshDatabase;