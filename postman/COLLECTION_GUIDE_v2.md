# Postman Collection - Complete & Enhanced

## 📦 **Kancil_AI_Complete_Collection.json**

Collection lengkap yang menggabungkan semua fitur enhanced dalam satu file:
- ✅ Enhanced Progress System dengan content-type specific scoring  
- ✅ Fixed APIs (Change Password, Upload Photo)
- ✅ Comments & Reactions system
- ✅ All core endpoints (Auth, Courses, SubCourses, Chat, Analytics)
- ✅ Clean structure tanpa duplikasi
- ✅ Auto-token management

## 🎯 Key Enhanced Features:

### **Enhanced Progress System:**
- **Quiz Content**: Score 0-100 + detailed `quiz_answers` object
- **Video/PDF Content**: Binary scoring (0/1) + time tracking  
- **GET** progress with content-type specific data

### **Fixed APIs:**
- **Change Password**: `current_password` + `new_password` (no OTP)
- **Upload Photo**: Correct field name `foto_profil`

### **Comments & Reactions:**
- Complete CRUD operations
- Pagination support  
- Multiple reaction types (like, unlike, sad, disappointed)

## 🚀 Usage Instructions:

1. **Import Collection:**
   ```
   Import: Kancil_AI_Complete_Collection.json
   ```

2. **Set Variables:**
   - `baseUrl`: http://localhost:5001/api
   - `token`: Auto-set after login
   - `course_id`: Auto-set after creating course
   - `subcourse_id`: Auto-set after creating subcourse

3. **Test Flow:**
   ```
   1. Authentication → Login Teacher/Student
   2. Courses → Create Course  
   3. SubCourses → Create SubCourse (Quiz/Video)
   4. Enhanced Progress → Update Progress (Quiz vs Video)
   5. Comments & Reactions → Test interactions
   ```

## 📊 Example Requests:

### Quiz Progress:
```json
{
  "status": "completed",
  "score": 85.5,
  "quiz_answers": {
    "total_questions": 10,
    "correct_answers": 8
  }
}
```

### Video Progress:
```json
{
  "status": "completed", 
  "completion_percentage": 100,
  "time_spent": 180
}
```

## 📁 Collection Structure:

```
🔐 Authentication
📚 Courses
📄 SubCourses  
📈 Enhanced Progress System
💬 Comments & Reactions
👤 Fixed User APIs
🤖 Chat & AI
📊 Analytics
📁 File Upload
🏥 Health Check
```

## ⚡ Quick Start:

1. Import collection
2. Login Teacher: `teacher@kancil.com` / `teacher123`
3. Create a course
4. Create quiz & video subcourses
5. Test different progress tracking
6. Try comments & reactions

**One file, all features! 🎉**