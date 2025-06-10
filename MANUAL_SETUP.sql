-- Manual Setup SQL untuk Comments & Reactions + Enhanced Progress
-- Jalankan SQL ini secara manual jika ada masalah koneksi database

-- ================================================
-- 1. CREATE COMMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    sub_course_id INTEGER NOT NULL,
    id_user UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id INTEGER NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_comments_subcourse 
        FOREIGN KEY (sub_course_id) 
        REFERENCES sub_courses(id) 
        ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_comments_user 
        FOREIGN KEY (id_user) 
        REFERENCES users(id_user) 
        ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_comments_parent 
        FOREIGN KEY (parent_id) 
        REFERENCES comments(id) 
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_sub_course ON comments(sub_course_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(id_user);

-- ================================================
-- 2. CREATE REACTIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS reactions (
    id SERIAL PRIMARY KEY,
    sub_course_id INTEGER NOT NULL,
    id_user UUID NOT NULL,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'unlike', 'sad', 'disappointed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_reactions_subcourse 
        FOREIGN KEY (sub_course_id) 
        REFERENCES sub_courses(id) 
        ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_reactions_user 
        FOREIGN KEY (id_user) 
        REFERENCES users(id_user) 
        ON UPDATE CASCADE ON DELETE CASCADE,
        
    -- Unique constraint: one reaction per user per subcourse
    CONSTRAINT uq_reactions_user_subcourse 
        UNIQUE (sub_course_id, id_user)
);

-- Create indexes for reactions
CREATE INDEX IF NOT EXISTS idx_reactions_sub_course ON reactions(sub_course_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(id_user);

-- ================================================
-- 3. ENHANCE PROGRESS TABLE
-- ================================================

-- Add new columns to student_sub_course_progress table
ALTER TABLE student_sub_course_progress 
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0 NOT NULL;

ALTER TABLE student_sub_course_progress 
ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0 NOT NULL;

ALTER TABLE student_sub_course_progress 
ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0 NOT NULL;

ALTER TABLE student_sub_course_progress 
ADD COLUMN IF NOT EXISTS quiz_answers JSONB;

-- Update score column to DECIMAL for better precision
-- Note: This might require recreating the column if it exists as INTEGER
-- Backup data first if needed
DO $$
BEGIN
    -- Check if score column is INTEGER and convert to DECIMAL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_sub_course_progress' 
        AND column_name = 'score' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE student_sub_course_progress 
        ALTER COLUMN score TYPE DECIMAL(5,2);
    END IF;
END $$;

-- ================================================
-- 4. ADD COMMENTS TO COLUMNS (DOCUMENTATION)
-- ================================================
COMMENT ON COLUMN student_sub_course_progress.completion_percentage IS 'Completion percentage (0-100)';
COMMENT ON COLUMN student_sub_course_progress.time_spent IS 'Time spent in seconds';
COMMENT ON COLUMN student_sub_course_progress.attempts IS 'Number of attempts for quiz content';
COMMENT ON COLUMN student_sub_course_progress.quiz_answers IS 'Quiz answers and results for quiz content type';
COMMENT ON COLUMN student_sub_course_progress.score IS 'Score: 0-100 for quiz, 0-1 for others';

-- ================================================
-- 5. VERIFY SETUP (OPTIONAL)
-- ================================================

-- Check if all tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('comments', 'reactions') THEN '✅ New table created'
        WHEN table_name = 'student_sub_course_progress' THEN '✅ Enhanced table'
        ELSE '✅ Existing table'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('comments', 'reactions', 'student_sub_course_progress', 'sub_courses', 'users')
ORDER BY table_name;

-- Check new columns in progress table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_sub_course_progress'
AND column_name IN ('completion_percentage', 'time_spent', 'attempts', 'quiz_answers', 'score')
ORDER BY column_name;

-- ================================================
-- SETUP COMPLETE!
-- ================================================
-- Tables ready:
-- ✅ comments (with foreign keys and indexes)
-- ✅ reactions (with unique constraint and indexes)  
-- ✅ student_sub_course_progress (enhanced with new scoring fields)
--
-- Ready to use enhanced progress system with:
-- - Quiz scoring (0-100 + quiz_answers)
-- - Video/PDF binary scoring (0/1)
-- - Time tracking and attempt counting
-- ================================================