# Postman Collection - Unified & Complete

## 📦 Single Complete Collection:

### **Kancil_AI_API_Collection.json** (Complete & Enhanced)
One unified collection containing all features:
- ✅ Enhanced Progress System with content-type specific scoring
- ✅ Fixed APIs (Change Password, Upload Photo)
- ✅ Comments & Reactions system
- ✅ Complete Authentication with auto-token handling
- ✅ All CRUD operations for courses, subcourses, users
- ✅ File upload and analytics endpoints

## 🎯 Key Enhanced Endpoints:

### **Enhanced Progress System:**
```
PATCH /subcourses/:id/progress
GET /subcourses/:id/progress
```

**Quiz Content (0-100 scoring):**
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
    "correct_answers": 8
  }
}
```

**Video/PDF Content (Binary 0/1):**
```json
{
  "status": "completed",
  "completion_percentage": 100,
  "time_spent": 180
}
```

### **Fixed APIs:**
```
PUT /users/change-password
POST /upload/profile-photo
```

**Change Password:**
```json
{
  "current_password": "oldPassword123",
  "new_password": "newPassword456"
}
```

**Upload Photo:** 
- Form field: `foto_profil` (not `photo`)
- Supports: JPEG, PNG, GIF, WebP
- Max size: 5MB

### **Comments & Reactions:**
```
GET /comments/subcourse/:id
POST /comments/subcourse/:id
GET /reactions/subcourse/:id
POST /reactions/subcourse/:id
DELETE /reactions/subcourse/:id
```

## 🚀 Usage Instructions:

1. **Import Single Collection:**
   ```
   Import: Kancil_AI_API_Collection.json
   ```

2. **Set Variables:**
   - `baseUrl`: http://localhost:5001/api
   - `token`: Your JWT token (auto-set after login)
   - `course_id`: Course ID for testing
   - `subcourse_id`: SubCourse ID for testing

3. **Test Flow:**
   ```
   1. Authentication → Login Teacher/Student
   2. Courses → Create Course  
   3. SubCourses → Create SubCourse (Quiz/Video)
   4. Enhanced Progress → Update Quiz/Video Progress
   5. Enhanced Progress → Get Detailed Progress
   6. Comments & Reactions → Test interactions
   ```

## 📊 Response Examples:

### Quiz Progress Response:
```json
{
  "message": "Progress retrieved successfully",
  "data": {
    "sub_course_id": 1,
    "content_type": "quiz",
    "status": "completed",
    "score": 85.5,
    "completion_percentage": 100,
    "time_spent": 300,
    "attempts": 2,
    "quiz_answers": {...},
    "completed_at": "2024-12-01T10:30:00Z"
  }
}
```

### Video Progress Response:
```json
{
  "message": "Progress retrieved successfully", 
  "data": {
    "sub_course_id": 2,
    "content_type": "video",
    "status": "completed",
    "completed": 1,
    "completion_percentage": 100,
    "time_spent": 180,
    "attempts": 1,
    "completed_at": "2024-12-01T10:30:00Z"
  }
}
```

## 🔧 Testing Tips:

1. **Set up Authentication first** - Login to get token
2. **Create test data** - Course and SubCourse with different content types
3. **Test different content types** - Quiz vs Video scoring
4. **Verify responses** - Check content-type specific fields
5. **Test edge cases** - Partial progress, multiple attempts

## ⚠️ Notes:

- **Single unified collection** contains all features
- **Auto-token management** after login
- **Content-type aware scoring** system
- **Complete CRUD operations** for all entities
- **Enhanced documentation** with examples

## 📁 Collection Structure:

```
Kancil_AI_API_Collection.json
├── Authentication (Register, Login, OAuth, Logout)
├── Courses (CRUD, My Courses, Join Course)
├── SubCourses (CRUD, Progress Tracking)
├── Enhanced Progress System (Quiz/Video specific)
├── Comments & Reactions (Full interaction system)
├── Fixed User APIs (Password, Profile Photo)
├── Chat & AI (Chatbot integration)
├── Analytics (Dashboard, Student analytics)
├── File Upload & Management
└── User Management (Profile, Users list)
```