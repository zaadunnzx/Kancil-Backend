# API Testing Guide - Quick Start

Panduan cepat untuk testing semua API Kancil AI menggunakan berbagai tools.

## 🚀 Quick Testing Methods

### 1. **Postman Collection (Recommended)**
Import collection yang sudah siap pakai:

```bash
# Import file ini ke Postman:
./postman/Kancil_AI_API_Collection.json
```

**Setup di Postman:**
1. Import collection
2. Set environment variables:
   - `baseUrl`: `http://localhost:5000/api`
3. Login dulu dengan "Login Teacher" atau "Login Student"
4. Token akan otomatis tersimpan
5. Test endpoint lainnya

### 2. **Automated Scripts**

**Linux/Mac:**
```bash
# Make script executable
chmod +x ./scripts/test-api.sh

# Run all tests
./scripts/test-api.sh

# Run specific test group
./scripts/test-api.sh auth
./scripts/test-api.sh courses
./scripts/test-api.sh chat
```

**Windows PowerShell:**
```powershell
# Run all tests
.\scripts\test-api.ps1

# Run specific test group
.\scripts\test-api.ps1 auth
.\scripts\test-api.ps1 courses
.\scripts\test-api.ps1 chat
```

### 3. **Manual curl Commands**

**Quick Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Login & Get Token:**
```bash
# Login Teacher
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@kancil.com", "password": "teacher123"}'

# Login Student  
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student1@kancil.com", "password": "student123"}'
```

## 📋 Pre-requisites

### 1. Server Running
```bash
# Make sure server is running on port 5000
npm run dev
# or
npm start
```

### 2. Database Seeded
```bash
# Run seeding first
npm run seed
```

### 3. Sample Accounts Available
- **Teacher**: `teacher@kancil.com` / `teacher123`
- **Students**: 
  - `student1@kancil.com` / `student123`
  - `student2@kancil.com` / `student123` 
  - `student3@kancil.com` / `student123`

## 🎯 Testing Scenarios

### **Scenario 1: Complete Teacher Workflow**

1. **Login as Teacher**
2. **Create Course**
3. **Add SubCourse/Lessons**
4. **Publish Course**
5. **Check Analytics**

### **Scenario 2: Complete Student Workflow**

1. **Login as Student**
2. **Join Course (using course code)**
3. **View Course Content**
4. **Complete Lessons**
5. **Chat with AI**
6. **Check Progress**

### **Scenario 3: Full Integration Test**

1. **Teacher creates & publishes course**
2. **Student joins & completes course**
3. **Teacher monitors analytics**
4. **Student chats with AI**
5. **Both check dashboards**

## 🔧 Available Test Tools

### **1. Postman Collection**
- ✅ Ready-to-import collection
- ✅ Auto token management  
- ✅ Test scripts included
- ✅ Environment variables
- ✅ Request examples

### **2. Bash Script (Linux/Mac)**
- ✅ Colored output
- ✅ Error handling
- ✅ Modular testing
- ✅ Progress tracking
- ✅ Cleanup functions

### **3. PowerShell Script (Windows)**
- ✅ Native Windows support
- ✅ Colored output
- ✅ Error handling
- ✅ Modular testing
- ✅ Progress tracking

### **4. Manual curl Examples**
- ✅ Copy-paste ready
- ✅ All endpoints covered
- ✅ Sample data included
- ✅ Error examples

## 📊 Testing Results

### **Expected Success Responses:**

**Authentication:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id_user": "uuid",
    "role": "teacher",
    "email": "teacher@kancil.com"
  }
}
```

**Course Creation:**
```json
{
  "message": "Course created successfully",
  "course": {
    "id": 1,
    "title": "Test Course",
    "course_code": "MATH01",
    "status": "draft"
  }
}
```

**AI Chat:**
```json
{
  "student_message": "Bagaimana cara menghitung 2 + 3?",
  "ai_response": "Untuk menghitung 2 + 3, kamu bisa...",
  "interaction_id": 123
}
```

## 🐛 Common Issues & Solutions

### **1. Server Not Running**
```bash
Error: ECONNREFUSED
Solution: Start server with `npm run dev`
```

### **2. Database Not Seeded**
```bash
Error: User not found
Solution: Run `npm run seed`
```

### **3. Invalid Token**
```bash
Error: 401 Unauthorized
Solution: Login again to get fresh token
```

### **4. Permission Denied**
```bash
Error: 403 Forbidden  
Solution: Check user role (student vs teacher endpoints)
```

## 🔍 Endpoint Categories

### **🔐 Authentication (Public)**
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /auth/google` - Google OAuth
- `GET /auth/me` - Get current user (protected)

### **📚 Courses (Protected)**
- `GET /courses` - Get all courses
- `POST /courses` - Create course (teacher only)
- `GET /courses/:id` - Get course detail
- `PUT /courses/:id` - Update course (teacher only)
- `PATCH /courses/:id/publish` - Publish course (teacher only)
- `POST /courses/join` - Join course (student only)

### **📖 SubCourses (Protected)**
- `GET /subcourses/course/:id` - Get course content
- `POST /subcourses` - Create subcourse (teacher only)
- `GET /subcourses/:id` - Get subcourse detail
- `PUT /subcourses/:id` - Update subcourse (teacher only)
- `PATCH /subcourses/:id/progress` - Update progress (student only)

### **💬 Chat/AI (Protected)**
- `POST /chat/message` - Send message to AI
- `GET /chat/history/:id` - Get chat history

### **📊 Analytics (Protected)**
- `GET /analytics/dashboard` - Teacher dashboard
- `GET /analytics/students` - Student analytics (teacher only)
- `GET /analytics/student/dashboard` - Student dashboard

### **📁 File Upload (Protected)**
- `POST /upload/single` - Upload single file
- `POST /upload/multiple` - Upload multiple files
- `DELETE /upload/:filename` - Delete file

### **👤 User Management (Protected)**
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update profile
- `PUT /users/change-password` - Change password
- `GET /users` - Get all users (admin/teacher only)

### **🔍 System**
- `GET /health` - Health check (public)

## ⚡ Quick Commands

**Test Everything:**
```bash
# Linux/Mac
./scripts/test-api.sh

# Windows
.\scripts\test-api.ps1
```

**Test Specific Feature:**
```bash
# Test only authentication
./scripts/test-api.sh auth

# Test only courses
./scripts/test-api.sh courses

# Test only chat
./scripts/test-api.sh chat
```

**Manual Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Get Sample Token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@kancil.com", "password": "teacher123"}' \
  | jq -r '.token'
```

---

## 🎉 Ready to Test!

1. **Start server**: `npm run dev`
2. **Seed database**: `npm run seed`  
3. **Choose testing method**:
   - Import Postman collection (easiest)
   - Run automated script (comprehensive)
   - Use manual curl commands (flexible)

All endpoints are ready and fully functional! 🚀