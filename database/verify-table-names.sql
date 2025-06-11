-- =====================================================
-- VERIFIKASI NAMA TABEL SEBELUM MEMBUAT QUIZ SYSTEM
-- Jalankan query ini dulu untuk memastikan nama tabel yang benar
-- =====================================================

-- Cek semua tabel yang ada di database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Cek spesifik untuk tabel sub_courses / subcourses
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name LIKE '%course%' 
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Cek apakah ada subcourse dengan content_type = 'quiz'
DO $$
BEGIN
    -- Cek jika tabel sub_courses ada
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sub_courses' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Tabel "sub_courses" ditemukan ✅';
        
        -- Cek jumlah quiz subcourses
        PERFORM COUNT(*) FROM sub_courses WHERE content_type = 'quiz';
        RAISE NOTICE 'Quiz subcourses: % records', (SELECT COUNT(*) FROM sub_courses WHERE content_type = 'quiz');
        
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'subcourses' AND table_schema = 'public'  
    ) THEN
        RAISE NOTICE 'Tabel "subcourses" ditemukan ✅';
        RAISE NOTICE 'Quiz subcourses: % records', (SELECT COUNT(*) FROM subcourses WHERE content_type = 'quiz');
        
    ELSE
        RAISE NOTICE 'TIDAK ADA tabel sub_courses atau subcourses! ❌';
        RAISE NOTICE 'Silakan jalankan database setup terlebih dahulu';
    END IF;
END $$;

-- Pesan hasil
SELECT 'VERIFIKASI SELESAI - CEK OUTPUT DI ATAS' as status;