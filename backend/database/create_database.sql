-- Script SQL untuk membuat database Kancil AI dari awal
-- Jalankan di PostgreSQL sebagai superuser

-- Drop database jika sudah ada (opsional)
-- DROP DATABASE IF EXISTS kancil_ai_db;

-- Buat database baru
CREATE DATABASE kancil_ai_db
WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Indonesian_Indonesia.1252'
    LC_CTYPE = 'Indonesian_Indonesia.1252';

-- Connect ke database yang baru dibuat
\c kancil_ai_db;

-- Buat ENUM types
CREATE TYPE user_role AS ENUM ('student', 'teacher');
CREATE TYPE course_status AS ENUM ('published', 'draft', 'archived');
CREATE TYPE subject_type AS ENUM ('Matematika', 'IPA', 'IPS');
CREATE TYPE content_type AS ENUM ('video', 'pdf_material', 'quiz', 'interactive');
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE message_type AS ENUM ('text', 'voice', 'image');
CREATE TYPE response_mode AS ENUM ('text', 'voice');

-- Buat tabel users
CREATE TABLE users (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_lengkap VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'student',
    kelas INTEGER CHECK (kelas >= 1 AND kelas <= 12),
    nama_sekolah VARCHAR(255),
    password_hash VARCHAR(255),
    foto_profil_url VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    google_id VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat tabel courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject subject_type NOT NULL,
    kelas INTEGER NOT NULL CHECK (kelas >= 1 AND kelas <= 12),
    teacher_id UUID NOT NULL REFERENCES users(id_user),
    course_code VARCHAR(20) UNIQUE NOT NULL,
    status course_status DEFAULT 'draft',
    cover_image_url VARCHAR(255),
    start_date DATE,
    end_date DATE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat tabel sub_courses
CREATE TABLE sub_courses (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content_type content_type NOT NULL,
    content_url TEXT,
    order_in_course INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat tabel student_enrollments
CREATE TABLE student_enrollments (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id_user),
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Buat tabel student_sub_course_progress
CREATE TABLE student_sub_course_progress (
    id SERIAL PRIMARY KEY,
    enrollment_student_id UUID NOT NULL,
    enrollment_course_id INTEGER NOT NULL,
    sub_course_id INTEGER NOT NULL REFERENCES sub_courses(id) ON DELETE CASCADE,
    status progress_status DEFAULT 'not_started',
    score DECIMAL(5,2),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    FOREIGN KEY (enrollment_student_id, enrollment_course_id) 
        REFERENCES student_enrollments(student_id, course_id),
    UNIQUE(enrollment_student_id, enrollment_course_id, sub_course_id)
);

-- Buat tabel chatbot_interactions
CREATE TABLE chatbot_interactions (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id_user),
    sub_course_id INTEGER NOT NULL REFERENCES sub_courses(id) ON DELETE CASCADE,
    student_message_text TEXT NOT NULL,
    student_message_type message_type DEFAULT 'text',
    ai_response_text TEXT NOT NULL,
    ai_response_mode response_mode DEFAULT 'text',
    interaction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat indexes untuk performa
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_subcourses_course ON sub_courses(course_id);
CREATE INDEX idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX idx_enrollments_course ON student_enrollments(course_id);
CREATE INDEX idx_progress_student ON student_sub_course_progress(enrollment_student_id);
CREATE INDEX idx_progress_course ON student_sub_course_progress(enrollment_course_id);
CREATE INDEX idx_chat_student ON chatbot_interactions(student_id);
CREATE INDEX idx_chat_subcourse ON chatbot_interactions(sub_course_id);
CREATE INDEX idx_chat_timestamp ON chatbot_interactions(interaction_timestamp);

-- Tambahkan trigger untuk updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_courses_updated_at BEFORE UPDATE ON sub_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Set privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Database setup completed
SELECT 'Database Kancil AI setup completed successfully!' as message;