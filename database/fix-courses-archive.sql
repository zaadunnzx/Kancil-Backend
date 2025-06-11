-- =====================================================
-- FIX COURSES TABLE - ADD ARCHIVE FIELDS
-- Add missing archived_at and published_at columns
-- Run this script to fix archive course functionality
-- =====================================================

-- 1. ADD ARCHIVED_AT COLUMN IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'archived_at'
    ) THEN
        ALTER TABLE courses 
        ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        
        RAISE NOTICE 'Added archived_at column to courses table';
    ELSE
        RAISE NOTICE 'archived_at column already exists in courses table';
    END IF;
END $$;

-- 2. ADD PUBLISHED_AT COLUMN IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'published_at'
    ) THEN
        ALTER TABLE courses 
        ADD COLUMN published_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        
        RAISE NOTICE 'Added published_at column to courses table';
    ELSE
        RAISE NOTICE 'published_at column already exists in courses table';
    END IF;
END $$;

-- 3. UPDATE EXISTING PUBLISHED COURSES
UPDATE courses 
SET published_at = created_at 
WHERE status = 'published' 
AND published_at IS NULL;

-- 4. VERIFY COURSES TABLE STRUCTURE
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses'
AND column_name IN ('status', 'archived_at', 'published_at', 'created_at', 'updated_at')
ORDER BY column_name;

-- 5. SHOW SAMPLE DATA
SELECT 
    id,
    title,
    status,
    created_at,
    published_at,
    archived_at
FROM courses 
LIMIT 5;

-- Success message
SELECT 'COURSES ARCHIVE SYSTEM FIXED SUCCESSFULLY!' as status,
       'Archive and Unarchive endpoints should now work' as message;

-- =====================================================
-- END OF COURSES ARCHIVE FIX
-- =====================================================