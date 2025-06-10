# Testing API Kancil AI - Complete Guide

Panduan lengkap untuk testing semua endpoint API Kancil AI menggunakan Postman, curl, dan tools lainnya.

## 🔧 Setup Testing Environment

### Base URL
```
http://localhost:5001/api
```

### Environment Variables untuk Postman
```json
{
  "base_url": "http://localhost:5001/api",
  "auth_token": "{{token}}",
  "teacher_id": "",
  "student_id": "",
  "course_id": "",
  "subcourse_id": ""
}
```

## 📋 Postman Collection Setup

### 1. Create New Collection
- Name: `Kancil AI API`
- Add variables:
  - `baseUrl`: `http://localhost:5001/api`
  - `token`: (akan diisi setelah login)

### 2. Pre-request Script untuk Authentication
```javascript
// Pre-request Script untuk endpoints yang perlu auth
if (pm.globals.get("token")) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + pm.globals.get("token")
    });
}
```

## 🔐 1. Authentication Endpoints

### 1.1 Register User (Student)

**Postman:**
```
POST {{baseUrl}}/auth/register
Content-Type: application/json

Body (raw JSON):
{
  "nama_lengkap": "Test Student",
  "email": "teststudent@example.com",
  "password": "password123",
  "role": "student",
  "kelas": 5,
  "nama_sekolah": "SD Test"
}
```

**curl:**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama_lengkap": "Test Student",
    "email": "teststudent@example.com",
    "password": "password123",
    "role": "student",
    "kelas": 5,
    "nama_sekolah": "SD Test"
  }'
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id_user": "uuid",
    "nama_lengkap": "Test Student",
    "email": "teststudent@example.com",
    "role": "student",
    "kelas": 5,
    "nama_sekolah": "SD Test"
  }
}
```

### 1.2 Register User (Teacher)

**Postman:**
```
POST {{baseUrl}}/auth/register
Content-Type: application/json

Body (raw JSON):
{
  "nama_lengkap": "Test Teacher",
  "email": "testteacher@example.com",
  "password": "password123",
  "role": "teacher",
  "nama_sekolah": "SD Test"
}
```

### 1.3 Login

**Postman:**
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

Body (raw JSON):
{
  "email": "teacher@kancil.com",
  "password": "teacher123"
}

Tests Script:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('token');
    pm.globals.set("token", jsonData.token);
});
```

**curl:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@kancil.com",
    "password": "teacher123"
  }'
```

### 1.4 Get Current User

**Postman:**
```
GET {{baseUrl}}/auth/me
Authorization: Bearer {{token}}
```

**curl:**
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 1.5 Google OAuth (Manual Test)

**Browser:**
```
http://localhost:5001/api/auth/google
```

## 📚 2. Courses Endpoints

### 2.1 Get All Courses

**Postman:**
```
GET {{baseUrl}}/courses
Authorization: Bearer {{token}}

Query Params (optional):
- page: 1
- limit: 10
- subject: Matematika
- kelas: 5
- teacher_id: uuid
```

**curl:**
```bash
# All courses
curl -X GET http://localhost:5001/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:5001/api/courses?subject=Matematika&kelas=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2.2 Create Course (Teacher only)

**Postman:**
```
POST {{baseUrl}}/courses
Authorization: Bearer {{token}}
Content-Type: application/json

Body (raw JSON):
{
  "title": "Matematika Dasar Kelas 5",
  "subject": "Matematika",
  "kelas": 5,
  "start_date": "2024-01-15",
  "end_date": "2024-06-15"
}

Tests Script:
pm.test("Course created", function () {
    var jsonData = pm.response.json();
    pm.globals.set("course_id", jsonData.course.id);
});
```

**curl:**
```bash
curl -X POST http://localhost:5001/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Matematika Dasar Kelas 5",
    "subject": "Matematika",
    "kelas": 5,
    "start_date": "2024-01-15",
    "end_date": "2024-06-15"
  }'
```

### 2.3 Get Course Detail

**Postman:**
```
GET {{baseUrl}}/courses/{{course_id}}
Authorization: Bearer {{token}}
```

**curl:**
```bash
curl -X GET http://localhost:5001/api/courses/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2.4 Update Course

**Postman:**
```
PUT {{baseUrl}}/courses/{{course_id}}
Authorization: Bearer {{token}}
Content-Type: application/json

Body (raw JSON):
{
  "title": "Matematika Dasar Kelas 5 - Updated",
  "start_date": "2024-02-01"
}
```

### 2.5 Publish Course

**Postman:**
```
PATCH {{baseUrl}}/courses/{{course_id}}/publish
Authorization: Bearer {{token}}
```

**curl:**
```bash
curl -X PATCH http://localhost:5001/api/courses/1/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2.6 Archive Course

**Postman:**
```
PATCH {{baseUrl}}/courses/{{course_id}}/archive
Authorization: Bearer {{token}}
```

**curl:**
```bash
curl -X PATCH http://localhost:5001/api/courses/1/archive \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2.7 Unarchive Course

**Postman:**
```
PATCH {{baseUrl}}/courses/{{course_id}}/unarchive
Authorization: Bearer {{token}}
```

**curl:**
```bash
curl -X PATCH http://localhost:5001/api/courses/1/unarchive \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2.6 Join Course (Student only)

**Postman:**
```
POST {{baseUrl}}/courses/join
Authorization: Bearer {{token}}
Content-Type: application/json

Body (raw JSON):
{
  "course_code": "MATH01"
}
```

**curl:**
```bash
curl -X POST http://localhost:5001/api/courses/join \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"course_code": "MATH01"}'
```

## 📖 3. SubCourses Endpoints

### 3.1 Get SubCourses for Course

**Postman:**
```
GET {{baseUrl}}/subcourses/course/{{course_id}}
Authorization: Bearer {{token}}
```

**curl:**
```bash
curl -X GET http://localhost:5001/api/subcourses/course/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3.2 Create SubCourse (Teacher only)

**Postman:**
```
POST {{baseUrl}}/subcourses
Authorization: Bearer {{token}}
Content-Type: application/json

Body (raw JSON):
{
  "course_id": {{course_id}},
  "title": "Video Pembelajaran Matematika Dasar",
  "summary": "Video pengenalan angka 1-10",
  "content_type": "video",
  "content_url": "https://example.com/video/angka-1-10",
  "order_in_course": 1
}
```

### 3.3 Update Progress (Student only)

**Scoring Rules:**
- **Quiz**: Score 0-100 (percentage)
- **Video/PDF/Text**: Score 0 or 1 (binary completion)

**For Video/PDF completion:**
```
PATCH {{baseUrl}}/subcourses/{{subcourse_id}}/progress
Authorization: Bearer {{token}}
Content-Type: application/json

Body (raw JSON):
{
  "status": "completed",
  "score": 1
}
```

**For Quiz completion:**
```
PATCH {{baseUrl}}/subcourses/{{subcourse_id}}/progress
Authorization: Bearer {{token}}
Content-Type: application/json

Body (raw JSON):
{
  "status": "completed",
  "score": 85
}
```

**curl examples:**
```bash
# Complete video/PDF (binary scoring)
curl -X PATCH http://localhost:5001/api/subcourses/1/progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "score": 1}'

# Complete quiz (percentage scoring)
curl -X PATCH http://localhost:5001/api/subcourses/1/progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "score": 85}'
```

**Postman:**
```
POST {{baseUrl}}/subcourses
Authorization: Bearer {{token}}
Content-Type: application/json

Body (raw JSON):
{
  "course_id": 1,
  "title": "Pengenalan Penjumlahan",
  "summary": "Belajar dasar-dasar penjumlahan untuk anak kelas 5",
  "content_type": "video",
  "content_url": "https://example.com/video.mp4",
  "order_in_course": 1
}

Tests Script:
pm.test("SubCourse created", function () {
    var jsonData = pm.response.json();
    pm.globals.set("subcourse_id", jsonData.subCourse.id);
});
```

**curl:**
```bash
curl -X POST http://localhost:5001/api/subcourses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "title": "Pengenalan Penjumlahan",
    "summary": "Belajar dasar-dasar penjumlahan untuk anak kelas 5",
    "content_type": "video",
    "content_url": "https://example.com/video.mp4",
    "order_in_course": 1
  }'
```

### 3.3 Get SubCourse Detail

**Postman:**
```
GET {{baseUrl}}/subcourses/{{subcourse_id}}
Authorization: Bearer {{token}}
```

### 3.4 Update SubCourse

**Postman:**
```
PUT {{baseUrl}}/subcourses/{{subcourse_id}}
Authorization: Bearer {{token}}
Content-Type: application/json

Body (raw JSON):
{
  "title": "Pengenalan Penjumlahan - Updated",
  "summary": "Updated summary"
}
```

### 3.5 Update Progress (Student only)

**Postman:**
```
PATCH {{baseUrl}}/subcourses/{{subcourse_id}}/progress
Authorization: Bearer {{token}}
Content-Type: application/json

Body (raw JSON):
{
  "status": "completed",
  "score": 85.5
}
```

**curl:**
```bash
curl -X PATCH http://localhost:5001/api/subcourses/1/progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "score": 85.5
  }'
```

## 💬 4. Chat/AI Endpoints

### 4.1 Send Message to AI

**Postman:**
```
POST {{baseUrl}}/chat/message
Authorization: Bearer {{token}}
Content-Type: application/json

Body (raw JSON):
{
  "sub_course_id": 1,
  "message": "Bagaimana cara menghitung 2 + 3?",
  "message_type": "text"
}
```

**curl:**
```bash
curl -X POST http://localhost:5001/api/chat/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sub_course_id": 1,
    "message": "Bagaimana cara menghitung 2 + 3?",
    "message_type": "text"
  }'
```

**Expected Response:**
```json
{
  "student_message": "Bagaimana cara menghitung 2 + 3?",
  "ai_response": "Untuk menghitung 2 + 3, kamu bisa...",
  "interaction_id": 123
}
```

### 4.2 Get Chat History

**Postman:**
```
GET {{baseUrl}}/chat/history/{{subcourse_id}}
Authorization: Bearer {{token}}
```

**curl:**
```bash
curl -X GET http://localhost:5001/api/chat/history/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 5. Analytics Endpoints

### 5.1 Teacher Dashboard Analytics

**Postman:**
```
GET {{baseUrl}}/analytics/dashboard
Authorization: Bearer {{token}}
```

**curl:**
```bash
curl -X GET http://localhost:5001/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "summary": {
    "totalCourses": 2,
    "publishedCourses": 1,
    "totalStudents": 3
  },
  "completionRates": [
    {
      "course_title": "Matematika Dasar",
      "total_students": 3,
      "completed_students": 1
    }
  ],
  "recentInteractions": [...]
}
```

### 5.2 Student Analytics

**Postman:**
```
GET {{baseUrl}}/analytics/students
Authorization: Bearer {{token}}

Query Params (optional):
- course_id: 1
```

**curl:**
```bash
curl -X GET http://localhost:5001/api/analytics/students \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5.3 Student Dashboard

**Postman:**
```
GET {{baseUrl}}/analytics/student/dashboard
Authorization: Bearer {{token}}
```

**curl:**
```bash
curl -X GET http://localhost:5001/api/analytics/student/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📁 6. File Upload Endpoints

### 6.1 Upload Single File

**Postman:**
```
POST {{baseUrl}}/upload/single
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

Body (form-data):
Key: file
Type: File
Value: [Select your file]
```

**curl:**
```bash
curl -X POST http://localhost:5001/api/upload/single \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/file.pdf"
```

### 6.2 Upload Multiple Files

**Postman:**
```
POST {{baseUrl}}/upload/multiple
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

Body (form-data):
Key: files
Type: File
Value: [Select multiple files]
```

**curl:**
```bash
curl -X POST http://localhost:5001/api/upload/multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/file1.pdf" \
  -F "files=@/path/to/file2.jpg"
```

### 6.3 Delete File

**Postman:**
```
DELETE {{baseUrl}}/upload/filename.pdf
Authorization: Bearer {{token}}
```

**curl:**
```bash
curl -X DELETE http://localhost:5001/api/upload/filename.pdf \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 👤 7. User Management Endpoints

### 7.1 Get User Profile

**Postman:**
```
GET {{baseUrl}}/users/profile
Authorization: Bearer {{token}}
```

**curl:**
```bash
curl -X GET http://localhost:5001/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7.2 Update Profile

**Postman:**
```
PUT {{baseUrl}}/users/profile
Authorization: Bearer {{token}}
Content-Type: application/json

Body (raw JSON):
{
  "nama_lengkap": "Updated Name",
  "nama_sekolah": "Updated School"
}
```

**curl:**
```bash
curl -X PUT http://localhost:5001/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nama_lengkap": "Updated Name",
    "nama_sekolah": "Updated School"
  }'
```

### 7.3 Change Password

**Postman:**
```
PUT {{baseUrl}}/users/change-password
Authorization: Bearer {{token}}
Content-Type: application/json

Body (raw JSON):
{
  "old_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

### 7.4 Get All Users (Admin/Teacher)

**Postman:**
```
GET {{baseUrl}}/users
Authorization: Bearer {{token}}

Query Params (optional):
- role: student
- page: 1
- limit: 10
```

## 🔍 8. Health Check

**Postman:**
```
GET {{baseUrl}}/health
```

**curl:**
```bash
curl -X GET http://localhost:5001/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🧪 Testing Scenarios

### Scenario 1: Complete Teacher Flow

```bash
# 1. Login as teacher
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@kancil.com", "password": "teacher123"}'

# Save token from response
TOKEN="your_token_here"

# 2. Create a course
curl -X POST http://localhost:5001/api/courses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "subject": "Matematika",
    "kelas": 5
  }'

# Save course_id from response
COURSE_ID="1"

# 3. Create subcourse
curl -X POST http://localhost:5001/api/subcourses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "title": "Test Lesson",
    "summary": "Test lesson summary",
    "content_type": "video",
    "content_url": "https://example.com/video.mp4",
    "order_in_course": 1
  }'

# 4. Publish course
curl -X PATCH http://localhost:5001/api/courses/$COURSE_ID/publish \
  -H "Authorization: Bearer $TOKEN"

# 5. Check analytics
curl -X GET http://localhost:5001/api/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### Scenario 2: Complete Student Flow

```bash
# 1. Login as student
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student1@kancil.com", "password": "student123"}'

TOKEN="student_token_here"

# 2. Join course
curl -X POST http://localhost:5001/api/courses/join \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"course_code": "MATH01"}'

# 3. Get course content
curl -X GET http://localhost:5001/api/subcourses/course/1 \
  -H "Authorization: Bearer $TOKEN"

# 4. Update progress
curl -X PATCH http://localhost:5001/api/subcourses/1/progress \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "score": 90}'

# 5. Chat with AI
curl -X POST http://localhost:5001/api/chat/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sub_course_id": 1,
    "message": "Bagaimana cara menghitung 5 x 3?",
    "message_type": "text"
  }'

# 6. Check student dashboard
curl -X GET http://localhost:5001/api/analytics/student/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

## 🔧 Postman Collection Export

### Collection Structure:
```
Kancil AI API/
├── Authentication/
│   ├── Register Student
│   ├── Register Teacher
│   ├── Login
│   └── Get Current User
├── Courses/
│   ├── Get All Courses
│   ├── Create Course
│   ├── Get Course Detail
│   ├── Update Course
│   ├── Publish Course
│   ├── Archive Course
│   └── Join Course
├── SubCourses/
│   ├── Get SubCourses
│   ├── Create SubCourse
│   ├── Get SubCourse Detail
│   ├── Update SubCourse
│   └── Update Progress
├── Chat/
│   ├── Send Message
│   └── Get Chat History
├── Analytics/
│   ├── Teacher Dashboard
│   ├── Student Analytics
│   └── Student Dashboard
├── Upload/
│   ├── Upload Single File
│   ├── Upload Multiple Files
│   └── Delete File
├── Users/
│   ├── Get Profile
│   ├── Update Profile
│   ├── Change Password
│   └── Get All Users
└── Health Check
```

## 🐛 Common Testing Issues & Solutions

### 1. Token Expiration
```bash
# Error: 401 Unauthorized
# Solution: Login again to get new token
```

### 2. Permission Denied
```bash
# Error: 403 Forbidden
# Solution: Check if user role matches endpoint requirements
```

### 3. Course Not Found
```bash
# Error: 404 Not Found
# Solution: Verify course_id exists and user has access
```

### 4. File Upload Issues
```bash
# Error: File too large
# Solution: Check file size limit (10MB)

# Error: Invalid file type
# Solution: Use supported formats (images, videos, PDF)
```

## 📊 Sample Test Data

### Sample Users:
```json
{
  "teacher": {
    "email": "teacher@kancil.com",
    "password": "teacher123"
  },
  "students": [
    {"email": "student1@kancil.com", "password": "student123"},
    {"email": "student2@kancil.com", "password": "student123"},
    {"email": "student3@kancil.com", "password": "student123"}
  ]
}
```

### Sample Course Codes:
- `MATH01` - Matematika Dasar
- `IPA01` - IPA Dasar

### Sample Messages untuk AI Chat:
- "Bagaimana cara menghitung 2 + 3?"
- "Apa itu fotosintesis?"
- "Jelaskan tentang planet dalam tata surya"
- "Bagaimana cara membuat pembagian?"

---

## 🚀 Quick Test Commands

**Test Server Health:**
```bash
curl http://localhost:5001/api/health
```

**Quick Login Test:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@kancil.com", "password": "teacher123"}'
```

**Get All Sample Data:**
```bash
# Run seeding first
npm run seed

# Then test endpoints with sample users
```

Semua endpoint sudah siap untuk testing! 🎉