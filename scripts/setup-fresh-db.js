require('dotenv').config();
const { Pool } = require('pg');
const { sequelize } = require('../config/database');

const setupFreshDatabase = async () => {
  try {
    console.log('🚀 Setting up fresh database from scratch...\n');

    // Connect to PostgreSQL server (not specific database)
    const adminPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: 'postgres' // Connect to default postgres database
    });

    const dbName = process.env.DB_NAME || 'kancil';

    console.log('🔍 Checking if database exists...');
    
    // Check if database exists
    const checkDb = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (checkDb.rows.length > 0) {
      console.log('🗑️ Dropping existing database...');
      
      // Terminate connections to the database
      await adminPool.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
      `, [dbName]);
      
      // Drop database
      await adminPool.query(`DROP DATABASE "${dbName}"`);
      console.log('✅ Existing database dropped');
    }

    console.log('🔧 Creating new database...');
    await adminPool.query(`CREATE DATABASE "${dbName}"`);
    console.log('✅ New database created');

    // Close admin connection
    await adminPool.end();

    console.log('🔗 Connecting to new database...');
    await sequelize.authenticate();
    console.log('✅ Connected to new database');

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

    // Verify courses table has kelas column
    const [courseColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('\n🎯 Courses table structure:');
    courseColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    const hasKelasColumn = courseColumns.some(col => col.column_name === 'kelas');
    if (hasKelasColumn) {
      console.log('  ✅ "kelas" column verified');
    } else {
      console.log('  ❌ "kelas" column missing!');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run seed');
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

setupFreshDatabase();