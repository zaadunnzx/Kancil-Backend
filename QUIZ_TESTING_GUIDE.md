# 🎯 Quiz System Testing Guide

## 📋 **Setup Instructions**

### **1. Database Setup (REQUIRED FIRST)**
Run these SQL files in pgAdmin Query Tool **in this order**:

```sql
-- 1. Fix database structure
-- Copy and run: database/fix-database-structure.sql

-- 2. Fix associations 
-- Copy and run: database/fix-associations.sql

-- 3. Create quiz system tables
-- Copy and run: database/create-new-quiz-system.sql
```

### **2. Seed Sample Data**
```bash
# Run seeding script
node scripts/seed.js
```

### **3. Start Server**
```bash
npm run dev
```

---

## 🧪 **Testing with Postman**

### **Import Collection**
1. Open Postman
2. Import: `postman/Kancil_AI_Complete_Fixed_Collection.json`
3. Look for "New Quiz System" folder

### **Sample Login Credentials**
```json
// Teacher Account
{
  "email": "teacher@kancil.com",
  "password": "teacher123"
}

// Student Accounts
{
  "email": "student1@kancil.com", 
  "password": "student123"
}
{
  "email": "student2@kancil.com",
  "password": "student123"  
}
{
  "email": "student3@kancil.com",
  "password": "student123"
}
```

---

## 🎮 **Testing Flow**

### **Step 1: Teacher Login & Setup**
1. **Login as Teacher**
   ```http
   POST /auth/login
   {
     "email": "teacher@kancil.com",
     "password": "teacher123"
   }
   ```

2. **Get Course with Quiz SubCourse**
   ```http
   GET /courses
   # Look for "Matematika Kelas 1 - Bilangan" course
   # Find subcourse with content_type: "quiz" (usually ID 3)
   ```

3. **Set Quiz Variables in Postman**
   - Set `subcourse_id` to quiz subcourse ID (e.g., 3)

### **Step 2: Teacher Quiz Management**

#### **A. Configure Quiz Settings**
```http
PUT /quiz/subcourse/{{subcourse_id}}/settings
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

#### **B. View Question Bank**
```http
GET /quiz/subcourse/{{subcourse_id}}/questions
# Should show 30 questions (12 easy, 12 medium, 6 hard)
```

#### **C. Add More Questions (Optional)**
```http
POST /quiz/subcourse/{{subcourse_id}}/questions
{
  "question_text": "Test question: 10 + 5 = ?",
  "option_a": "10",
  "option_b": "15", 
  "option_c": "20",
  "option_d": "25",
  "correct_answer": "B",
  "difficulty_level": "easy",
  "points": 10
}
```

### **Step 3: Student Login & Take Quiz**

#### **A. Login as Student**
```http
POST /auth/login
{
  "email": "student1@kancil.com",
  "password": "student123"
}
```

#### **B. Start Quiz Session**
```http
POST /quiz/subcourse/{{subcourse_id}}/start
# Response will include:
# - session_id (auto-saved to variables)
# - session_token (auto-saved to variables)  
# - 10 random questions with shuffled options
```

#### **C. Submit Answers**
```http
POST /quiz/sessions/{{session_id}}/answer
{
  "question_id": 1,
  "selected_answer": "B"
}
```

#### **D. Submit Final Quiz**
```http
POST /quiz/sessions/{{session_id}}/submit
# Response will show:
# - final_score (percentage)
# - correct_answers count
# - detailed results per question
```

#### **E. View Quiz History**
```http
GET /quiz/student/history/{{subcourse_id}}
# Shows all previous attempts for this student
```

### **Step 4: Teacher View Results**

#### **A. Get Quiz Results**
```http
GET /quiz/subcourse/{{subcourse_id}}/results
# Shows all student results with statistics
```

---

## 🔍 **What to Expect**

### **Quiz Features Working:**
- ✅ **Random Questions**: Each student gets different 10 questions from 30-question pool
- ✅ **Difficulty Distribution**: Mix of easy/medium/hard questions
- ✅ **Option Shuffling**: A,B,C,D order randomized per student
- ✅ **Anti-Cheat**: Session tokens, server-side validation
- ✅ **Multiple Attempts**: Students can retake with new questions
- ✅ **Time Limits**: Teacher-configurable time limits
- ✅ **Analytics**: Teacher can view results and statistics

### **Sample Data Included:**
- 👨‍🏫 **1 Teacher**: Pak Guru (teacher@kancil.com)
- 👨‍🎓 **3 Students**: Siswa 1, 2, 3 (student1-3@kancil.com)
- 📚 **2 Courses**: Matematika Kelas 1, IPA Kelas 2
- 📝 **Quiz Bank**: 30 math questions (various difficulties)
- ⚙️ **Quiz Settings**: Pre-configured for testing

---

## 🐛 **Troubleshooting**

### **Database Errors:**
```sql
-- If tables don't exist, run this query:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'quiz_%';

-- Should show: quiz_banks, quiz_sessions, quiz_answers, quiz_results, quiz_settings
```

### **Authentication Issues:**
- Make sure to copy token from login response to Postman variables
- Check that Authorization header is set to `Bearer {{token}}`

### **Quiz Not Starting:**
- Verify subcourse has `content_type: 'quiz'`
- Check that student is enrolled in the course
- Ensure quiz settings are configured

### **No Questions:**
- Run seeding script: `node scripts/seed.js`
- Verify questions exist: `GET /quiz/subcourse/{id}/questions`

---

## 📊 **Testing Scenarios**

### **Scenario 1: Basic Quiz Flow**
1. Teacher creates/configures quiz
2. Student takes quiz  
3. Teacher views results

### **Scenario 2: Multiple Attempts**
1. Student takes quiz (gets 70%)
2. Student retakes quiz (gets different questions)
3. Teacher sees both attempts

### **Scenario 3: Anti-Cheat Features**
1. Compare questions between different students
2. Verify options are shuffled differently
3. Check that correct answers are not exposed

### **Scenario 4: Analytics**
1. Multiple students take quiz
2. Teacher views aggregated results
3. Check average scores and completion rates

---

## 🎉 **Success Criteria**

If all tests pass, you should see:
- ✅ Students getting different questions each attempt
- ✅ Options (A,B,C,D) in different orders per student  
- ✅ Scores calculated correctly
- ✅ Teacher can view all results
- ✅ Time limits enforced
- ✅ Session tokens working
- ✅ Database relationships intact

**The quiz system is ready for production! 🚀**