# 🎯 New Quiz System Implementation Guide

## 📋 **System Overview**

### **🔧 Core Features Implemented:**

#### **1. Advanced Question Bank System**
- ✅ **Pool Management**: Guru buat 30 soal (3x dari yang dikerjakan siswa)
- ✅ **Difficulty Levels**: Easy, Medium, Hard dengan distribusi otomatis
- ✅ **Random Selection**: Siswa dapat 10 soal random dari pool
- ✅ **Option Shuffling**: Urutan pilihan A, B, C, D diacak per siswa
- ✅ **Anti-Cheat**: Session-based dengan token validation

#### **2. Smart Quiz Sessions**
- ✅ **Dynamic Assignment**: Setiap siswa dapat soal yang berbeda
- ✅ **Time Management**: Teacher-controlled time limits
- ✅ **Multiple Attempts**: Soal baru dari pool untuk setiap attempt
- ✅ **Real-time Validation**: Server-side answer checking

#### **3. Comprehensive Analytics**
- ✅ **Teacher Dashboard**: Quiz results, student performance
- ✅ **Student Progress**: Attempt history, scores
- ✅ **Performance Metrics**: Average scores, completion rates

---

## 🗄️ **Database Schema**

### **Tables Created:**

#### **1. `quiz_banks`** - Pool Soal Guru
```sql
- id (Primary Key)
- subcourse_id (Foreign Key)
- question_text (TEXT)
- option_a, option_b, option_c, option_d (VARCHAR 500)
- correct_answer (ENUM: A, B, C, D)
- difficulty_level (ENUM: easy, medium, hard)
- points (INTEGER, default: 10)
- created_at, updated_at (TIMESTAMPS)
```

#### **2. `quiz_sessions`** - Session Kuis Siswa
```sql
- id (Primary Key)
- student_id (UUID, Foreign Key)
- subcourse_id (Integer, Foreign Key)
- session_token (VARCHAR 255, UNIQUE)
- questions_assigned (JSONB) - Questions with scrambled options
- time_limit_minutes (INTEGER)
- start_time, end_time (TIMESTAMPS)
- status (ENUM: pending, active, completed, expired)
- attempt_number (INTEGER)
- total_questions (INTEGER)
```

#### **3. `quiz_answers`** - Jawaban Siswa
```sql
- id (Primary Key)
- session_id (Foreign Key)
- question_id (Foreign Key)
- selected_answer (ENUM: A, B, C, D)
- is_correct (BOOLEAN)
- answered_at (TIMESTAMP)
- UNIQUE(session_id, question_id)
```

#### **4. `quiz_results`** - Hasil Final
```sql
- id (Primary Key)
- session_id (Foreign Key)
- student_id (UUID, Foreign Key)
- subcourse_id (Integer, Foreign Key)
- total_questions (INTEGER)
- correct_answers (INTEGER)
- final_score (INTEGER) - Percentage 0-100
- time_taken_minutes (INTEGER)
- attempt_number (INTEGER)
- completed_at (TIMESTAMP)
```

#### **5. `quiz_settings`** - Pengaturan per SubCourse
```sql
- id (Primary Key)
- subcourse_id (Integer, UNIQUE Foreign Key)
- total_questions_in_pool (INTEGER, default: 30)
- questions_per_attempt (INTEGER, default: 10)
- time_limit_minutes (INTEGER, default: 60)
- max_attempts (INTEGER, nullable)
- shuffle_questions (BOOLEAN, default: true)
- shuffle_options (BOOLEAN, default: true)
- show_results_immediately (BOOLEAN, default: true)
```

---

## 🔌 **API Endpoints**

### **👨‍🏫 Teacher Endpoints:**

#### **Quiz Management:**
```http
GET    /quiz/subcourse/{id}/settings          # Get quiz settings
PUT    /quiz/subcourse/{id}/settings          # Update quiz settings
GET    /quiz/subcourse/{id}/questions         # Get all questions
POST   /quiz/subcourse/{id}/questions         # Create question
PUT    /quiz/questions/{questionId}           # Update question
DELETE /quiz/questions/{questionId}           # Delete question
GET    /quiz/subcourse/{id}/results           # Get quiz results
```

### **👨‍🎓 Student Endpoints:**

#### **Quiz Taking:**
```http
POST   /quiz/subcourse/{id}/start             # Start new quiz session
POST   /quiz/sessions/{sessionId}/answer      # Submit answer
POST   /quiz/sessions/{sessionId}/submit      # Submit entire quiz
GET    /quiz/student/history/{subcourseId}    # Get quiz history
```

---

## 🎮 **Quiz Flow - Step by Step**

### **📝 Teacher Setup:**

#### **1. Configure Quiz Settings**
```json
PUT /quiz/subcourse/123/settings
{
  "total_questions_in_pool": 30,
  "questions_per_attempt": 10,
  "time_limit_minutes": 60,
  "max_attempts": null,
  "shuffle_questions": true,
  "shuffle_options": true,
  "show_results_immediately": true
}
```

#### **2. Create Question Bank (30 questions)**
```json
POST /quiz/subcourse/123/questions
{
  "question_text": "Berapa hasil dari 5 x 7?",
  "option_a": "30",
  "option_b": "35",
  "option_c": "40", 
  "option_d": "45",
  "correct_answer": "B",
  "difficulty_level": "easy",
  "points": 10
}
```

### **🎯 Student Quiz Taking:**

#### **1. Start Quiz Session**
```json
POST /quiz/subcourse/123/start

Response:
{
  "session_id": 456,
  "session_token": "abc123...",
  "questions": [
    {
      "question_id": 789,
      "question_text": "Berapa hasil dari 5 x 7?",
      "options": [
        {"key": "A", "text": "35"}, // Scrambled!
        {"key": "B", "text": "40"},
        {"key": "C", "text": "30"},
        {"key": "D", "text": "45"}
      ],
      "points": 10,
      "difficulty_level": "easy"
    }
    // ... 9 more questions
  ],
  "time_limit_minutes": 60,
  "total_questions": 10,
  "attempt_number": 1
}
```

#### **2. Submit Answers**
```json
POST /quiz/sessions/456/answer
{
  "question_id": 789,
  "selected_answer": "A"
}
```

#### **3. Submit Quiz**
```json
POST /quiz/sessions/456/submit

Response:
{
  "final_score": 85,
  "correct_answers": 8,
  "total_questions": 10,
  "time_taken_minutes": 15,
  "attempt_number": 1,
  "detailed_results": [
    {
      "question_text": "Berapa hasil dari 5 x 7?",
      "selected_answer": "A",
      "correct_answer": "B", 
      "is_correct": false,
      "difficulty_level": "easy"
    }
    // ... more results
  ]
}
```

---

## 🚀 **Cara Testing yang Benar:**

**Jalankan seeding data terlebih dahulu:**
```bash
# Di terminal backend:
cd c:\kancil-be\Kancil-Backend
node scripts/seed-quiz-questions.js
```

**Hasil seeding:**
```
🎯 Starting quiz questions seeding...
📚 Processing quiz: "Kuis Angka" (ID: 3)
   Existing questions: 0
   ✅ Created 30 new questions
   📊 Total questions now: 30
🎉 Quiz questions seeding completed!
```

### **Step 1: Start Quiz Session**
```json
POST {{baseUrl}}/quiz/subcourse/3/start  // Gunakan ID subcourse quiz

Response:
{
  "session_id": 123,
  "session_token": "abc123...",
  "questions": [
    {
      "question_id": 1,  // ← GUNAKAN ID INI untuk answer
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
    // ... 9 more questions with different question_ids
  ],
  "debug_info": {
    "message": "Use question_id from this response when submitting answers",
    "example_body": {
      "question_id": 1,
      "selected_answer": "A"
    }
  }
}
```

### **Step 2: Submit Answer dengan Question ID yang Benar**
```json
POST {{baseUrl}}/quiz/sessions/123/answer

Body (gunakan question_id dari response step 1):
{
  "question_id": 1,    // ← ID dari response quiz start
  "selected_answer": "B"
}

Response:
{
  "message": "Answer submitted successfully",
  "answer": {
    "question_id": 1,
    "selected_answer": "B",
    "is_correct": true,
    "answered_at": "2024-12-21T10:30:00Z"
  },
  "session_info": {
    "time_remaining_minutes": 59
  }
}
```

### **Step 3: Submit All Answers untuk Semua Questions**
Ulangi Step 2 untuk setiap question_id yang ada dalam response quiz start.

### **Step 4: Submit Quiz**
```json
POST {{baseUrl}}/quiz/sessions/123/submit

Response:
{
  "message": "Quiz submitted successfully",
  "session_id": 123,
  "final_score": 80,
  "correct_answers": 8,
  "total_questions": 10,
  "time_taken_minutes": 5,
  "attempt_number": 1,
  "detailed_results": [
    {
      "question_text": "Berapa hasil dari 2 + 3?",
      "selected_answer": "B",
      "correct_answer": "B",
      "is_correct": true,
      "difficulty_level": "easy"
    }
    // ... more results
  ]
}
```

---

## 🔒 **Security Features**

### **🛡️ Anti-Cheat Measures:**

#### **1. Session-Based Security**
- ✅ **Unique Session Tokens**: Crypto-generated per attempt
- ✅ **Time Validation**: Server-side time limit enforcement
- ✅ **Answer Encryption**: Correct answers never sent to frontend

#### **2. Question Randomization**
- ✅ **Different Questions**: Each student gets different set
- ✅ **Scrambled Options**: A, B, C, D order randomized
- ✅ **Dynamic Mapping**: Server tracks correct answer mapping

#### **3. Attempt Management**
- ✅ **Max Attempts Control**: Teacher-configurable limits
- ✅ **New Questions**: Fresh questions for each attempt
- ✅ **Latest Score**: Only last attempt score counts

---

## 📊 **Analytics & Reporting**

### **📈 Teacher Analytics:**

#### **Question Performance:**
```json
GET /quiz/subcourse/123/results
{
  "results": [
    {
      "student": {"nama_lengkap": "Budi", "kelas": 5},
      "final_score": 85,
      "attempt_number": 1,
      "completed_at": "2024-05-21T10:30:00Z"
    }
  ],
  "stats": {
    "total_attempts": 25,
    "unique_students": 20,
    "average_score": 78
  }
}
```

#### **Question Bank Stats:**
```json
GET /quiz/subcourse/123/questions
{
  "questions": [...],
  "stats": {
    "total": 30,
    "easy": 12,
    "medium": 12,
    "hard": 6
  }
}
```

### **📚 Student History:**
```json
GET /quiz/student/history/123
{
  "quiz_title": "Quiz Matematika Dasar",
  "attempts": [
    {
      "attempt_number": 2,
      "final_score": 90,
      "completed_at": "2024-05-21T10:30:00Z"
    },
    {
      "attempt_number": 1, 
      "final_score": 75,
      "completed_at": "2024-05-20T14:15:00Z"
    }
  ],
  "settings": {
    "max_attempts": null,
    "questions_per_attempt": 10,
    "time_limit_minutes": 60
  }
}
```

---

## ⚡ **Ready to Use!**

### **🚀 Setup Instructions:**

#### **1. Run Database Scripts:**
```bash
# In pgAdmin Query Tool:
1. Execute: create-new-quiz-system.sql
2. Execute: fix-courses-archive.sql
```

#### **2. Restart Backend:**
```bash
npm run dev
```

#### **3. Test with Postman:**
- Import updated collection
- Login as teacher → Create questions
- Login as student → Take quiz
- Check results and analytics

### **🎯 Key Benefits:**

- ✅ **Scalable**: Pool-based system supports large question banks
- ✅ **Secure**: Anti-cheat measures prevent inspection/cheating  
- ✅ **Flexible**: Teacher-controlled settings and time limits
- ✅ **Fair**: Random distribution ensures unique experience
- ✅ **Analytics**: Comprehensive reporting for teachers

**The new quiz system is production-ready and fully integrated! 🎉**