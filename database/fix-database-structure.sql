-- =====================================================
-- KANCIL DATABASE FIX SCRIPT
-- Fix for association errors and missing timestamps
-- Run this in pgAdmin Query Tool for database 'kancil'
-- =====================================================

-- 1. FIX STUDENT_SUB_COURSE_PROGRESS TABLE
-- Add missing timestamps if not exists
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

-- 2. ADD ARCHIVED_AT COLUMN TO COURSES TABLE
DO $$
BEGIN
    -- Check and add archived_at column to courses
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'archived_at'
    ) THEN
        ALTER TABLE courses 
        ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. CREATE OR UPDATE TRIGGER FOR AUTO-UPDATE TIMESTAMPS
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

-- 4. FIX EXISTING DATA - SET TIMESTAMPS FOR NULL VALUES
UPDATE student_sub_course_progress 
SET created_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL;

UPDATE student_sub_course_progress 
SET updated_at = CURRENT_TIMESTAMP 
WHERE updated_at IS NULL;

-- 5. VERIFY TABLE STRUCTURE
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_sub_course_progress'
ORDER BY ordinal_position;

-- 6. CHECK FOREIGN KEY CONSTRAINTS
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'student_sub_course_progress';

-- 7. VERIFY COURSES TABLE HAS CORRECT STRUCTURE
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'courses'
ORDER BY ordinal_position;

-- 8. VERIFY SUBCOURSES TABLE HAS CORRECT STRUCTURE  
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'subcourses'
ORDER BY ordinal_position;

-- 9. VERIFY STUDENT_ENROLLMENT TABLE
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_enrollment'
ORDER BY ordinal_position;

-- 10. CHECK DATA INTEGRITY
SELECT 
    'student_sub_course_progress' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at IS NULL THEN 1 END) as null_created_at,
    COUNT(CASE WHEN updated_at IS NULL THEN 1 END) as null_updated_at
FROM student_sub_course_progress

UNION ALL

SELECT 
    'courses' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at IS NULL THEN 1 END) as null_created_at,
    COUNT(CASE WHEN updated_at IS NULL THEN 1 END) as null_updated_at
FROM courses

UNION ALL

SELECT 
    'subcourses' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at IS NULL THEN 1 END) as null_created_at,
    COUNT(CASE WHEN updated_at IS NULL THEN 1 END) as null_updated_at
FROM subcourses;

-- 11. FIX SAMPLE DATA FOR TESTING (Optional)
-- Insert sample data if tables are empty
DO $$
BEGIN
    -- Only insert if no data exists
    IF NOT EXISTS (SELECT 1 FROM courses LIMIT 1) THEN
        INSERT INTO courses (title, subject, kelas, teacher_id, course_code, status, created_at, updated_at)
        VALUES 
        ('Matematika Dasar', 'Matematika', 5, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'MATH001', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('IPA Pengenalan', 'IPA', 4, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'IPA001', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM subcourses LIMIT 1) THEN
        INSERT INTO subcourses (title, summary, content_type, content_url, course_id, order_in_course, created_at, updated_at)
        SELECT 
            'Pengenalan Bilangan',
            'Memahami konsep dasar bilangan',
            'video',
            'https://example.com/video1.mp4',
            id,
            1,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM courses WHERE course_code = 'MATH001' LIMIT 1;
    END IF;
END $$;

-- 12. FINAL VERIFICATION
SELECT 
    t.table_name,
    t.table_type,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_name IN ('courses', 'subcourses', 'student_sub_course_progress', 'student_enrollment', 'users')
    AND t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- =====================================================
-- SCRIPT COMPLETED
-- All tables should now have proper timestamps and structure
-- =====================================================

-- Show success message
SELECT 'DATABASE FIX COMPLETED SUCCESSFULLY!' as status;