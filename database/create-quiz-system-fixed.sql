-- =====================================================
-- FIXED NEW QUIZ SYSTEM DATABASE SCHEMA
-- Advanced Quiz System with Question Banks and Random Distribution
-- =====================================================

-- 1. CREATE QUIZ BANKS TABLE (Pool Soal Guru)
CREATE TABLE IF NOT EXISTS quiz_banks (
    id SERIAL PRIMARY KEY,
    subcourse_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    difficulty_level VARCHAR(10) NOT NULL CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subcourse_id) REFERENCES subcourses(id) ON DELETE CASCADE
);

-- 2. CREATE QUIZ SESSIONS TABLE (Session Kuis Siswa)
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL,
    subcourse_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    questions_assigned JSONB NOT NULL,
    time_limit_minutes INTEGER NOT NULL DEFAULT 60,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired')),
    attempt_number INTEGER NOT NULL DEFAULT 1,
    total_questions INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (subcourse_id) REFERENCES subcourses(id) ON DELETE CASCADE
);

-- 3. CREATE QUIZ ANSWERS TABLE (Jawaban Siswa)
CREATE TABLE IF NOT EXISTS quiz_answers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_answer CHAR(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES quiz_banks(id) ON DELETE CASCADE,
    UNIQUE(session_id, question_id)
);

-- 4. CREATE QUIZ RESULTS TABLE (Hasil Final)
CREATE TABLE IF NOT EXISTS quiz_results (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    student_id UUID NOT NULL,
    subcourse_id INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    final_score INTEGER NOT NULL DEFAULT 0,
    time_taken_minutes INTEGER,
    attempt_number INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (subcourse_id) REFERENCES subcourses(id) ON DELETE CASCADE
);

-- 5. CREATE QUIZ SETTINGS TABLE (Pengaturan per SubCourse)
CREATE TABLE IF NOT EXISTS quiz_settings (
    id SERIAL PRIMARY KEY,
    subcourse_id INTEGER NOT NULL UNIQUE,
    total_questions_in_pool INTEGER NOT NULL DEFAULT 30,
    questions_per_attempt INTEGER NOT NULL DEFAULT 10,
    time_limit_minutes INTEGER NOT NULL DEFAULT 60,
    max_attempts INTEGER DEFAULT NULL,
    shuffle_questions BOOLEAN DEFAULT TRUE,
    shuffle_options BOOLEAN DEFAULT TRUE,
    show_results_immediately BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subcourse_id) REFERENCES subcourses(id) ON DELETE CASCADE
);

-- 6. CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
DROP TRIGGER IF EXISTS update_quiz_banks_updated_at ON quiz_banks;
CREATE TRIGGER update_quiz_banks_updated_at
    BEFORE UPDATE ON quiz_banks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quiz_sessions_updated_at ON quiz_sessions;
CREATE TRIGGER update_quiz_sessions_updated_at
    BEFORE UPDATE ON quiz_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quiz_settings_updated_at ON quiz_settings;
CREATE TRIGGER update_quiz_settings_updated_at
    BEFORE UPDATE ON quiz_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_quiz_banks_subcourse ON quiz_banks(subcourse_id);
CREATE INDEX IF NOT EXISTS idx_quiz_banks_difficulty ON quiz_banks(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_student ON quiz_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_subcourse ON quiz_sessions(subcourse_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session ON quiz_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_student ON quiz_results(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_subcourse ON quiz_results(subcourse_id);

-- 8. ADD archived_at COLUMN TO COURSES TABLE IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'archived_at'
    ) THEN
        ALTER TABLE courses ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 9. VERIFICATION QUERIES
SELECT 
    'quiz_banks' as table_name,
    COUNT(*) as record_count,
    'Quiz question bank ready' as description
FROM quiz_banks

UNION ALL

SELECT 
    'quiz_settings' as table_name,
    COUNT(*) as record_count,
    'Quiz settings ready' as description
FROM quiz_settings

UNION ALL

SELECT 
    'subcourses' as table_name,
    COUNT(*) as record_count,
    'SubCourses available' as description
FROM subcourses
WHERE content_type = 'quiz';

-- Success message
SELECT 'NEW QUIZ SYSTEM TABLES CREATED SUCCESSFULLY!' as status,
       'Ready for Quiz Implementation' as message,
       'Run seed-quiz-questions.js to populate with sample data' as next_step;

-- =====================================================
-- END OF FIXED NEW QUIZ SYSTEM SCHEMA
-- =====================================================