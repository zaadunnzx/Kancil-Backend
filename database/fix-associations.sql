-- =====================================================
-- ASSOCIATIONS FIX SCRIPT
-- Fix for Sequelize association alias mismatch errors
-- Run this AFTER running fix-database-structure.sql
-- =====================================================

-- 1. VERIFY AND FIX FOREIGN KEY RELATIONSHIPS

-- Check if foreign keys exist and are properly named
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('subcourses', 'student_sub_course_progress', 'student_enrollment')
ORDER BY tc.table_name;

-- 2. ENSURE SUBCOURSES TABLE HAS PROPER FOREIGN KEY TO COURSES
DO $$
BEGIN
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'subcourses' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%course_id%'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE subcourses 
        ADD CONSTRAINT fk_subcourses_course_id 
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. ENSURE STUDENT_ENROLLMENT TABLE STRUCTURE
DO $$
BEGIN
    -- Check if student_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_enrollment' 
        AND column_name = 'student_id'
    ) THEN
        ALTER TABLE student_enrollment 
        ADD COLUMN student_id UUID;
    END IF;

    -- Check if course_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_enrollment' 
        AND column_name = 'course_id'
    ) THEN
        ALTER TABLE student_enrollment 
        ADD COLUMN course_id INTEGER;
    END IF;

    -- Add foreign keys if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'student_enrollment' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%student_id%'
    ) THEN
        ALTER TABLE student_enrollment 
        ADD CONSTRAINT fk_student_enrollment_student_id 
        FOREIGN KEY (student_id) REFERENCES users(id_user) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'student_enrollment' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%course_id%'
    ) THEN
        ALTER TABLE student_enrollment 
        ADD CONSTRAINT fk_student_enrollment_course_id 
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. ENSURE STUDENT_SUB_COURSE_PROGRESS TABLE STRUCTURE
DO $$
BEGIN
    -- Check if sub_course_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_sub_course_progress' 
        AND column_name = 'sub_course_id'
    ) THEN
        ALTER TABLE student_sub_course_progress 
        ADD COLUMN sub_course_id INTEGER;
    END IF;

    -- Check if enrollment_student_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_sub_course_progress' 
        AND column_name = 'enrollment_student_id'
    ) THEN
        ALTER TABLE student_sub_course_progress 
        ADD COLUMN enrollment_student_id UUID;
    END IF;

    -- Add foreign keys if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'student_sub_course_progress' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%sub_course_id%'
    ) THEN
        ALTER TABLE student_sub_course_progress 
        ADD CONSTRAINT fk_progress_sub_course_id 
        FOREIGN KEY (sub_course_id) REFERENCES subcourses(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'student_sub_course_progress' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%enrollment_student_id%'
    ) THEN
        ALTER TABLE student_sub_course_progress 
        ADD CONSTRAINT fk_progress_student_id 
        FOREIGN KEY (enrollment_student_id) REFERENCES users(id_user) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. ADD MISSING COLUMNS IF NEEDED
DO $$
BEGIN
    -- Add status column to student_sub_course_progress if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_sub_course_progress' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE student_sub_course_progress 
        ADD COLUMN status VARCHAR(50) DEFAULT 'in_progress';
    END IF;

    -- Add score column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_sub_course_progress' 
        AND column_name = 'score'
    ) THEN
        ALTER TABLE student_sub_course_progress 
        ADD COLUMN score INTEGER DEFAULT 0;
    END IF;

    -- Add order_in_course column to subcourses if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subcourses' 
        AND column_name = 'order_in_course'
    ) THEN
        ALTER TABLE subcourses 
        ADD COLUMN order_in_course INTEGER DEFAULT 1;
    END IF;
END $$;

-- 6. UPDATE EXISTING DATA TO ENSURE CONSISTENCY
-- Set default order for existing subcourses
WITH numbered_subcourses AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY id) as rn
    FROM subcourses 
    WHERE order_in_course IS NULL OR order_in_course = 0
)
UPDATE subcourses 
SET order_in_course = numbered_subcourses.rn
FROM numbered_subcourses 
WHERE subcourses.id = numbered_subcourses.id;

-- 7. FINAL VERIFICATION OF TABLE STRUCTURES
SELECT 
    'courses' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses'

UNION ALL

SELECT 
    'subcourses' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'subcourses'

UNION ALL

SELECT 
    'student_enrollment' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_enrollment'

UNION ALL

SELECT 
    'student_sub_course_progress' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_sub_course_progress'

ORDER BY table_name, column_name;

-- 8. SHOW ALL FOREIGN KEY RELATIONSHIPS
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- Success message
SELECT 'ASSOCIATIONS FIX COMPLETED SUCCESSFULLY!' as status;

-- =====================================================
-- END OF ASSOCIATIONS FIX SCRIPT
-- =====================================================