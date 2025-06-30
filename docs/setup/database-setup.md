# Database Setup Guide

Complete guide for setting up PostgreSQL database for Kancil AI Backend.

## 🗄️ Database Requirements

- **PostgreSQL**: Version 12.x or higher
- **Memory**: 4GB+ RAM recommended
- **Storage**: 50GB+ available space
- **Extensions**: No special extensions required

## 🚀 Quick Setup

### 1. Install PostgreSQL

#### Ubuntu/Debian:
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### CentOS/RHEL:
```bash
# Install PostgreSQL
sudo yum install postgresql-server postgresql-contrib

# Initialize database
sudo postgresql-setup initdb

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS:
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

#### Windows:
- Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
- Run installer and follow setup wizard
- Remember the superuser password

### 2. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Or connect directly
psql -U postgres
```

```sql
-- Create database
CREATE DATABASE kancil_ai;

-- Create user with password
CREATE USER kancil_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE kancil_ai TO kancil_user;
ALTER USER kancil_user CREATEDB;

-- Grant schema privileges
\c kancil_ai
GRANT ALL ON SCHEMA public TO kancil_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kancil_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kancil_user;

-- Exit psql
\q
```

### 3. Test Connection

```bash
# Test connection with new user
psql -h localhost -U kancil_user -d kancil_ai

# If successful, you should see:
# kancil_ai=>
```

## 🔧 Automated Setup

### Using Node.js Script

```bash
# Run automated database setup
npm run db:setup

# Or manually:
node scripts/database-setup.js
```

This script will:
- ✅ Create all required tables
- ✅ Set up relationships and constraints
- ✅ Create indexes for performance
- ✅ Insert initial data

### Setup Script Details

```javascript
// scripts/database-setup.js
const { sequelize } = require('../config/database');
const models = require('../models');

async function setupDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Sync all models (create tables)
    await sequelize.sync({ force: false });
    console.log('✅ All models synchronized');

    // Create indexes
    await createIndexes();
    console.log('✅ Indexes created');

    // Insert initial data
    await seedInitialData();
    console.log('✅ Initial data seeded');

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
```

## 📊 Database Schema

### Core Tables

#### 1. Users Table
```sql
CREATE TABLE users (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_lengkap VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role ENUM('student', 'teacher') NOT NULL,
    kelas INTEGER,
    nama_sekolah VARCHAR(255),
    foto_profil_url VARCHAR(500),
    google_id VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Courses Table
```sql
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject ENUM('Matematika', 'IPA', 'Bahasa Indonesia') NOT NULL,
    kelas INTEGER NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id_user),
    course_code VARCHAR(10) UNIQUE NOT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    cover_image_url VARCHAR(500),
    start_date DATE,
    end_date DATE,
    published_at TIMESTAMP,
    archived_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. SubCourses Table
```sql
CREATE TABLE subcourses (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type ENUM('video', 'pdf', 'image', 'quiz') NOT NULL,
    content_url VARCHAR(500),
    order_in_course INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. Student Enrollments Table
```sql
CREATE TABLE student_enrollments (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id_user),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);
```

#### 5. Student Progress Table
```sql
CREATE TABLE student_sub_course_progress (
    id SERIAL PRIMARY KEY,
    sub_course_id INTEGER REFERENCES subcourses(id),
    enrollment_student_id UUID REFERENCES users(id_user),
    status VARCHAR(50) DEFAULT 'in_progress',
    score DECIMAL(5,2) DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    quiz_answers JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sub_course_id, enrollment_student_id)
);
```

### Feature Tables

#### 6. Comments Table
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    sub_course_id INTEGER NOT NULL REFERENCES subcourses(id),
    id_user UUID NOT NULL REFERENCES users(id_user),
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES comments(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. Reactions Table
```sql
CREATE TABLE reactions (
    id SERIAL PRIMARY KEY,
    sub_course_id INTEGER NOT NULL REFERENCES subcourses(id),
    id_user UUID NOT NULL REFERENCES users(id_user),
    reaction_type ENUM('like', 'unlike', 'sad', 'disappointed') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sub_course_id, id_user)
);
```

#### 8. Chat Interactions Table
```sql
CREATE TABLE chatbot_interactions (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id_user),
    sub_course_id INTEGER REFERENCES subcourses(id),
    student_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Quiz System Tables

#### 9. Quiz Banks Table
```sql
CREATE TABLE quiz_banks (
    id SERIAL PRIMARY KEY,
    subcourse_id INTEGER REFERENCES subcourses(id),
    question_text TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') NOT NULL,
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 10. Quiz Sessions Table
```sql
CREATE TABLE quiz_sessions (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES users(id_user),
    subcourse_id INTEGER REFERENCES subcourses(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    questions_assigned JSONB NOT NULL,
    time_limit_minutes INTEGER NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status ENUM('pending', 'active', 'completed', 'expired') DEFAULT 'pending',
    attempt_number INTEGER DEFAULT 1,
    total_questions INTEGER NOT NULL
);
```

## 📊 Performance Optimization

### Indexes

```sql
-- Primary performance indexes
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_subcourses_course_id ON subcourses(course_id);
CREATE INDEX idx_enrollments_student_id ON student_enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON student_enrollments(course_id);
CREATE INDEX idx_progress_student_id ON student_sub_course_progress(enrollment_student_id);
CREATE INDEX idx_progress_subcourse_id ON student_sub_course_progress(sub_course_id);
CREATE INDEX idx_comments_subcourse_id ON comments(sub_course_id);
CREATE INDEX idx_comments_user_id ON comments(id_user);
CREATE INDEX idx_reactions_subcourse_id ON reactions(sub_course_id);
CREATE INDEX idx_chat_student_id ON chatbot_interactions(student_id);
CREATE INDEX idx_chat_subcourse_id ON chatbot_interactions(sub_course_id);

-- Composite indexes for common queries
CREATE INDEX idx_courses_teacher_status ON courses(teacher_id, status);
CREATE INDEX idx_progress_student_status ON student_sub_course_progress(enrollment_student_id, status);
```

### Database Configuration

```sql
-- Optimize PostgreSQL settings
-- Add to postgresql.conf

# Memory settings
shared_buffers = 256MB          # 25% of total RAM
effective_cache_size = 1GB      # 75% of total RAM
work_mem = 4MB                  # Per connection
maintenance_work_mem = 64MB

# Connection settings
max_connections = 100
listen_addresses = '*'

# Logging
log_statement = 'mod'
log_duration = on
log_min_duration_statement = 1000ms

# Checkpoints
checkpoint_completion_target = 0.9
checkpoint_timeout = 10min
```

## 🔄 Database Migrations

### Migration Scripts

```bash
# Create migration
npm run migration:create -- --name add_new_feature

# Run migrations
npm run migration:up

# Rollback migrations
npm run migration:down

# Check migration status
npm run migration:status
```

### Example Migration

```javascript
// migrations/20240101_add_quiz_system.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quiz_banks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      subcourse_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'subcourses',
          key: 'id'
        }
      },
      question_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      // ... other fields
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('quiz_banks');
  }
};
```

## 🗄️ Data Seeding

### Seed Development Data

```bash
# Seed all data
npm run db:seed

# Seed specific seeders
npm run db:seed:users
npm run db:seed:courses
npm run db:seed:analytics
```

### Example Seeder

```javascript
// seeders/users.js
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('teacher123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        nama_lengkap: 'Pak Guru',
        email: 'teacher@kancil.com',
        password: hashedPassword,
        role: 'teacher',
        nama_sekolah: 'SD Test',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      email: 'teacher@kancil.com'
    });
  }
};
```

## 🔍 Database Maintenance

### Regular Maintenance Tasks

```sql
-- Analyze tables for query optimization
ANALYZE;

-- Vacuum to reclaim space
VACUUM;

-- Reindex for performance
REINDEX DATABASE kancil_ai;

-- Update table statistics
UPDATE pg_stat_user_tables SET schemaname = 'public';
```

### Backup and Restore

```bash
# Create backup
pg_dump -h localhost -U kancil_user -d kancil_ai > backup.sql

# Create compressed backup
pg_dump -h localhost -U kancil_user -d kancil_ai | gzip > backup.sql.gz

# Restore from backup
psql -h localhost -U kancil_user -d kancil_ai < backup.sql

# Restore specific table
pg_restore -h localhost -U kancil_user -d kancil_ai -t users backup.sql
```

## 🚨 Troubleshooting

### Common Issues

#### Connection Refused
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check port
sudo netstat -tlnp | grep 5432
```

#### Authentication Failed
```bash
# Check pg_hba.conf
sudo nano /etc/postgresql/12/main/pg_hba.conf

# Should have line:
local   all             all                                     md5
```

#### Permission Denied
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE kancil_ai TO kancil_user;
GRANT ALL ON SCHEMA public TO kancil_user;
```

#### Table Does Not Exist
```bash
# Run database setup
npm run db:setup

# Check if tables exist
psql -h localhost -U kancil_user -d kancil_ai -c "\dt"
```

### Performance Issues

```sql
-- Check slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

## ✅ Verification

### Test Database Setup

```bash
# Run association tests
node test-associations.js

# Expected output:
✅ Database connection successful
✅ Course.subcourses association works
✅ Course.teacher association works
✅ Course.enrollments association works
✅ SubCourse.course association works
✅ Complex query works - found X courses
🎉 All associations are working correctly!
```

### Check Data Integrity

```sql
-- Verify foreign key constraints
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f';

-- Check for orphaned records
SELECT 'courses' as table_name, COUNT(*) as orphaned_count
FROM courses c
LEFT JOIN users u ON c.teacher_id = u.id_user
WHERE u.id_user IS NULL;
```

## 🔗 Related Documentation

- [Installation Guide](./installation.md) - Complete setup process
- [Environment Configuration](./environment.md) - Environment variables
- [Troubleshooting](./troubleshooting.md) - Common database issues
- [API Documentation](../api/README.md) - API endpoints

Your database is now ready for Kancil AI Backend! 🚀