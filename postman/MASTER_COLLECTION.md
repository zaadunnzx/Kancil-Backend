# Kancil AI Master Collection - Complete API Reference

## 📦 **Kancil_AI_Complete_Collection.json**

**Master unified collection** yang menggabungkan SEMUA endpoint API Kancil AI dalam satu file lengkap.

### 🎯 **Complete Feature Coverage:**

#### **🔐 Authentication**
- Register (Student/Teacher) + Photo Upload
- Login/Logout + OAuth Google
- JWT Token Auto-management

#### **📚 Course Management**
- CRUD Operations (Create, Read, Update, Delete)
- Course Publishing & Management
- Student Enrollment System
- Course Analytics

#### **📄 SubCourse System**  
- Quiz & Video Content Support
- Content Type Specific Handling
- Order Management
- Progress Tracking Integration

#### **📈 Enhanced Progress System**
- **Quiz Content**: Score 0-100 + detailed quiz answers
- **Video/PDF Content**: Binary scoring (0/1) + time tracking
- **Progress Analytics**: Content-type specific data
- **Multiple Attempts**: Track student learning journey

#### **💬 Comments & Reactions**
- Complete CRUD for comments
- Reaction system (like, unlike, sad, disappointed)
- Pagination support
- Real-time interaction tracking

#### **👤 User Management**
- Profile management (get, update)
- Password change (no OTP required)
- Photo upload with correct field names
- User listing and admin functions

#### **🤖 Chat & AI Integration**
- AI-powered chatbot
- Context-aware responses
- Chat history tracking
- Message type handling

#### **📊 Advanced Analytics**
- Teacher Dashboard Analytics
- Student Performance Reports
- Course Engagement Metrics
- Quiz Analytics & Insights

#### **📁 File Upload System**
- Profile photo upload (foto_profil field)
- Single & multiple file upload
- File type validation
- Size limit handling

#### **🔧 Admin & Debug Tools**
- Enrollment debugging
- Progress reset tools
- Database health checks
- Development utilities

### 🚀 **Quick Start Guide:**

1. **Import Collection:**
   ```
   Import: postman/Kancil_AI_Complete_Collection.json
   ```

2. **Auto Variables:**
   - `baseUrl`: http://localhost:5001/api
   - `token`: Auto-set after login
   - `course_id`: Auto-set after creating course
   - `subcourse_id`: Auto-set after creating subcourse
   - `user_id`: Auto-set after login
   - `comment_id`: Auto-set after creating comment

3. **Test Flow:**
   ```
   1. Authentication → Login Teacher
   2. Courses → Create Course  
   3. SubCourses → Create Quiz + Video SubCourses
   4. Enhanced Progress → Test different scoring systems
   5. Comments & Reactions → Test user interactions
   6. Analytics → View dashboard data
   ```

### 📊 **Enhanced Progress Examples:**

#### Quiz Progress (0-100 Scoring):
```json
{
  "status": "completed",
  "score": 85.5,
  "completion_percentage": 100,
  "time_spent": 300,
  "quiz_answers": {
    "question_1": "A",
    "question_2": "C",
    "total_questions": 10,
    "correct_answers": 8,
    "student_answers": ["A", "C", "B", "D", "A"],
    "correct_answers_detail": ["A", "C", "B", "A", "A"]
  }
}
```

#### Video Progress (Binary 0/1 Scoring):
```json
{
  "status": "completed",
  "completion_percentage": 100,
  "time_spent": 180
  // Score automatically set to 1 (completed) or 0 (not completed)
}
```

### 🔧 **Fixed APIs:**

#### Change Password (No OTP):
```json
{
  "current_password": "oldPassword123",
  "new_password": "newPassword456"
}
```

#### Upload Profile Photo:
- **Field Name**: `foto_profil` (not `photo`)
- **Supported**: JPEG, PNG, GIF, WebP
- **Max Size**: 5MB

### 📁 **Collection Structure:**

```
📦 Kancil_AI_Complete_Collection.json
├── 🔐 Authentication (Register, Login, OAuth, Logout)
├── 📚 Courses (CRUD, My Courses, Join Course)
├── 📄 SubCourses (CRUD, Quiz/Video specific)
├── 📈 Enhanced Progress System (Content-type aware)
├── 💬 Comments & Reactions (Full interaction system)
├── 👤 Fixed User APIs (Password, Profile, Photo)
├── 🤖 Chat & AI (Chatbot integration)
├── 📁 File Upload (Single/Multiple files)
├── 👥 User Management (Admin functions)
├── 🎓 Course Management (Admin tools)
├── 🌐 OAuth & External Auth (Google integration)
├── 📊 Analytics (Advanced reporting)
└── 🔧 Debugging & Development (Tools & utilities)
```

### ✨ **Key Benefits:**

- **One File, All Features** - No need for multiple collections
- **Auto-Token Management** - Seamless authentication
- **Content-Type Aware** - Smart progress scoring
- **Complete Coverage** - Every endpoint included
- **Ready for Testing** - Pre-configured requests
- **Development Ready** - Debug tools included

### 🎮 **Sample Test Accounts:**

```
Teacher: teacher@kancil.com / teacher123
Student: student1@kancil.com / student123
```

## ⚡ **Ready to Use!**

Import `Kancil_AI_Complete_Collection.json` and start testing all features immediately. This is the **ONLY** collection file you need for complete Kancil AI API testing.

**One collection to rule them all! 🚀**