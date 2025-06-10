-- =====================================================
-- QUICK FIX FOR ASSOCIATIONS AND TIMESTAMPS
-- Run this in pgAdmin Query Tool for database 'kancil'
-- =====================================================

-- 1. ADD MISSING TIMESTAMPS TO STUDENT_SUB_COURSE_PROGRESS
DO $$
BEGIN
    -- Check and add created_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_sub_course_progress' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE student_sub_course_progress 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Check and add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_sub_course_progress' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE student_sub_course_progress 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 2. CREATE TRIGGER FOR AUTO-UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS update_student_sub_course_progress_updated_at ON student_sub_course_progress;
CREATE TRIGGER update_student_sub_course_progress_updated_at
    BEFORE UPDATE ON student_sub_course_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. UPDATE EXISTING NULL TIMESTAMPS
UPDATE student_sub_course_progress 
SET created_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL;

UPDATE student_sub_course_progress 
SET updated_at = CURRENT_TIMESTAMP 
WHERE updated_at IS NULL;

-- 4. ADD MISSING COLUMNS IF NEEDED
DO $$
BEGIN
    -- Check and add enrollment_date column to student_enrollments if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_enrollments' 
        AND column_name = 'enrollment_date'
    ) THEN
        ALTER TABLE student_enrollments 
        ADD COLUMN enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Success message
SELECT 'QUICK DATABASE FIX COMPLETED!' as status;

-- Verify fix
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('student_sub_course_progress', 'student_enrollments')
    AND column_name IN ('created_at', 'updated_at', 'enrollment_date')
ORDER BY table_name, column_name;