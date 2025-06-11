# 🚀 Quiz System Setup Guide

## 📋 **Step-by-Step Implementation**

### **🔧 1. Database Setup (WAJIB DIJALANKAN DULU)**

#### **Execute SQL Files in pgAdmin:**
```sql
-- 1. Run main schema (pilih salah satu):
-- Option A: File baru yang sudah diperbaiki:
\i 'c:\kancil-be\Kancil-Backend\database\create-quiz-system-fixed.sql'

-- Option B: Atau manual copy-paste isi file tersebut ke pgAdmin Query Tool
```

#### **Expected Result:**
```
NEW QUIZ SYSTEM TABLES CREATED SUCCESSFULLY!
Ready for Quiz Implementation
Run seed-quiz-questions.js to populate with sample data
```

---

### **🌱 2. Seed Data (Isi 30 Soal Quiz)**

#### **Run Seeding Script:**
```bash
# Di terminal backend:
cd c:\kancil-be\Kancil-Backend
node scripts\seed-quiz-questions.js
```

#### **Expected Output:**
```
🎯 Starting quiz questions seeding...
📚 Processing quiz: "Kuis Matematika Dasar" (ID: 3)
   Existing questions: 0
   ✅ Created 30 new questions
   📊 Total questions now: 30
🎉 Quiz questions seeding completed!
```

---

### **🔄 3. Restart Backend**
```bash
# Restart untuk load models baru:
npm run dev
```

#### **Expected Output:**
```
Server is running on port 5001
Database synced successfully
```

---

### **📮 4. Test API dengan Postman**

#### **A. Login as Teacher:**
```json
POST {{baseUrl}}/auth/login/teacher
{
  "email": "teacher@kancil.com",
  "password": "teacher123"
}
```

#### **B. Get Quiz Questions (Verify Data):**
```json
GET {{baseUrl}}/quiz/subcourse/3/questions

Response:
{
  "questions": [...],
  "stats": {
    "total": 30,
    "easy": 10,
    "medium": 10,
    "hard": 10
  }
}
```

#### **C. Login as Student:**
```json
POST {{baseUrl}}/auth/login/student
{
  "email": "student1@kancil.com", 
  "password": "student123"
}
```

#### **D. Start Quiz Session:**
```json
POST {{baseUrl}}/quiz/subcourse/3/start

Response:
{
  "session_id": 123,
  "session_token": "abc...",
  "questions": [
    {
      "question_id": 15,  // ← PENTING: gunakan ID ini
      "question_text": "Berapa hasil dari 2 + 3?",
      "options": [
        {"key": "A", "text": "4"},
        {"key": "B", "text": "5"},
        {"key": "C", "text": "6"},
        {"key": "D", "text": "7"}
      ],
      "points": 10,
      "difficulty_level": "easy"
    }
    // ... 9 more questions
  ],
  "debug_info": {
    "example_body": {
      "question_id": 15,  // ← contoh ID untuk submit answer
      "selected_answer": "A"
    }
  }
}
```

#### **E. Submit Answer (gunakan question_id dari response):**
```json
POST {{baseUrl}}/quiz/sessions/123/answer
{
  "question_id": 15,    // ← ID dari response start quiz
  "selected_answer": "B"
}

Response:
{
  "message": "Answer submitted successfully",
  "answer": {
    "question_id": 15,
    "selected_answer": "B",
    "is_correct": true,
    "answered_at": "2024-12-21T10:30:00Z"
  }
}
```

#### **F. Submit All Answers (repeat step E for all questions):**

#### **G. Submit Quiz:**
```json
POST {{baseUrl}}/quiz/sessions/123/submit

Response:
{
  "message": "Quiz submitted successfully",
  "final_score": 80,
  "correct_answers": 8,
  "total_questions": 10,
  "time_taken_minutes": 5,
  "detailed_results": [...]
}
```

---

## 🔍 **Troubleshooting**

### **❌ Problem: "relation subcourses does not exist"**
**Solution:**
```sql
-- Check if table exists:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%course%';

-- If you see 'sub_courses' instead of 'subcourses':
-- Update the create-quiz-system-fixed.sql to use correct table name
```

### **❌ Problem: "Not enough questions in the bank"**
**Solution:**
```bash
# Run seeding script:
node scripts\seed-quiz-questions.js

# Verify in pgAdmin:
SELECT COUNT(*) FROM quiz_banks WHERE subcourse_id = 3;
-- Should return 30
```

### **❌ Problem: "Question not found in this session"**
**Solution:**
```json
// ❌ WRONG: Using hardcoded ID
{
  "question_id": 1,
  "selected_answer": "B"
}

// ✅ CORRECT: Use question_id from start quiz response
{
  "question_id": 15,  // dari response start quiz
  "selected_answer": "B"
}
```

### **❌ Problem: SyntaxError in quiz.js**
**Solution:**
```bash
# Check syntax dengan:
node -c routes/quiz.js

# Jika masih error, restart backend:
npm run dev
```

---

## 📊 **Feature Verification Checklist**

### **✅ Database:**
- [ ] Tables created: quiz_banks, quiz_sessions, quiz_answers, quiz_results, quiz_settings
- [ ] 30 questions seeded in quiz_banks
- [ ] Quiz settings configured

### **✅ API Endpoints:**
- [ ] Teacher can view questions: `GET /quiz/subcourse/:id/questions`
- [ ] Student can start quiz: `POST /quiz/subcourse/:id/start`
- [ ] Student can submit answers: `POST /quiz/sessions/:id/answer`
- [ ] Student can submit quiz: `POST /quiz/sessions/:id/submit`

### **✅ Quiz Features:**
- [ ] Random question selection (10 from 30)
- [ ] Mixed difficulty levels (easy/medium/hard)
- [ ] Option shuffling working
- [ ] Score calculation correct
- [ ] Multiple attempts allowed

### **✅ Security:**
- [ ] Session tokens generated
- [ ] Correct answers not exposed to frontend
- [ ] Time limits enforced
- [ ] Role-based access working

---

## 🎯 **Ready to Use!**

Setelah semua langkah selesai, sistem quiz sudah ready untuk:
- ✅ **Teacher**: Membuat soal, lihat hasil
- ✅ **Student**: Mengerjakan quiz, lihat history
- ✅ **Admin**: Analytics dan reporting
- ✅ **System**: Anti-cheat, scalability, performance

**Happy Testing! 🎉**