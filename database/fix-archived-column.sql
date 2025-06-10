-- =====================================================
-- FIX ARCHIVED_AT COLUMN MISSING
-- Add missing archived_at column to courses table
-- Run this in pgAdmin Query Tool for database 'kancil'
-- =====================================================

-- 1. CHECK IF ARCHIVED_AT COLUMN EXISTS
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
    AND column_name = 'archived_at';

-- 2. ADD ARCHIVED_AT COLUMN IF NOT EXISTS
DO $$
BEGIN
    -- Check if archived_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'archived_at'
    ) THEN
        ALTER TABLE courses 
        ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        
        RAISE NOTICE 'Column archived_at added successfully';
    ELSE
        RAISE NOTICE 'Column archived_at already exists';
    END IF;
END $$;

-- 3. VERIFY COURSES TABLE STRUCTURE
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;

-- 4. CHECK IF PUBLISHED_AT COLUMN EXISTS (might be missing too)
DO $$
BEGIN
    -- Check if published_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'published_at'
    ) THEN
        ALTER TABLE courses 
        ADD COLUMN published_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        
        RAISE NOTICE 'Column published_at added successfully';
    ELSE
        RAISE NOTICE 'Column published_at already exists';
    END IF;
END $$;

-- 5. UPDATE EXISTING PUBLISHED COURSES WITH PUBLISHED_AT
UPDATE courses 
SET published_at = created_at 
WHERE status = 'published' AND published_at IS NULL;

-- 6. VERIFY ALL STATUS-RELATED COLUMNS
SELECT 
    id,
    title,
    status,
    created_at,
    published_at,
    archived_at
FROM courses 
ORDER BY created_at DESC;

-- 7. FINAL VERIFICATION MESSAGE
SELECT 'ARCHIVED_AT COLUMN FIX COMPLETED SUCCESSFULLY!' as status;