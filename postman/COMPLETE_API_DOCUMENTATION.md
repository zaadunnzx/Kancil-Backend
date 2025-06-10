# Kancil AI API Collection - Complete & Fixed

## 📦 **Kancil_AI_Complete_Collection.json** (FINAL VERSION)

**Master collection** yang sudah diperbaiki dan lengkap dengan semua endpoint API yang benar.

### ✅ **Fixed & Enhanced Features:**

#### **🔐 Authentication (Complete)**
- ✅ Register Student/Teacher (with photo upload)
- ✅ Login/Logout with auto-token management
- ✅ Get Current User (`/auth/me`)
- ✅ Refresh Token (`/auth/refresh`)
- ✅ Forgot Password (`/auth/forgot-password`)
- ✅ Reset Password (`/auth/reset-password`)
- ✅ Google OAuth (Student/Teacher/Callback)

#### **📚 Courses (Complete CRUD)**
- ✅ Get All Courses with filters
- ✅ Create/Update/Delete Course
- ✅ Get Course Detail
- ✅ Join Course by code
- ✅ Get My Courses
- ✅ Search Courses (`/courses/search`)
- ✅ Get Course by Code (`/courses/code/:code`)

#### **📄 SubCourses (Complete Management)**
- ✅ Get SubCourses for Course
- ✅ Create SubCourse (Quiz/Video/PDF)
- ✅ Get/Update/Delete SubCourse
- ✅ Reorder SubCourses (`/subcourses/reorder`)

#### **🎓 Student Enrollment**
- ✅ Get My Enrolled Courses (`/enrollments/my-courses`)
- ✅ Get Course Progress Summary (`/enrollments/progress/:id`)
- ✅ Leave Course (`DELETE /enrollments/:id`)

#### **📈 Enhanced Progress System**
- ✅ **Quiz Content**: Score 0-100 + detailed quiz answers
- ✅ **Video/PDF Content**: Binary scoring (0/1) + time tracking
- ✅ **Progress Analytics**: Content-type specific data
- ✅ **Multiple Attempts**: Track learning journey

#### **💬 Comments & Reactions (Complete)**
- ✅ Get/Create/Update/Delete Comments
- ✅ Pagination support
- ✅ Multiple reaction types (like, unlike, sad, disappointed)
- ✅ Add/Remove reactions

#### **👤 User Management (Fixed)**
- ✅ Get User Profile
- ✅ Update Profile
- ✅ **Change Password** (fixed - no OTP required)
- ✅ **Upload Profile Photo** (fixed field name: `foto_profil`)
- ✅ Get All Users with pagination
- ✅ Get/Delete User by ID

#### **🎓 Course Management (Admin)**
- ✅ Publish Course
- ✅ Delete Course
- ✅ Get Course Students

#### **🤖 Chat & AI**
- ✅ Send Message to AI
- ✅ Get Chat History
- ✅ Context-aware responses

#### **📁 File Upload**
- ✅ Upload Single File
- ✅ Upload Multiple Files
- ✅ Profile Photo Upload (corrected)

#### **📊 Advanced Analytics**
- ✅ Teacher Dashboard Analytics
- ✅ Student Analytics & Dashboard
- ✅ Course Performance Analytics
- ✅ Student Progress Report
- ✅ Quiz Analytics
- ✅ Engagement Analytics

#### **🔔 Notifications (NEW)**
- ✅ Get User Notifications
- ✅ Mark as Read/Mark All Read
- ✅ Delete Notification

#### **📋 Reports & Export (NEW)**
- ✅ Export Course Progress (CSV)
- ✅ Export Student Grades
- ✅ Generate Performance Report

#### **🔧 Debugging & Development**
- ✅ Check Enrollment Status
- ✅ Manual Enroll Student
- ✅ Reset Progress
- ✅ Database Health Check
- ✅ Check User Permissions

#### **🏥 Health Check**
- ✅ Basic health endpoint

### 🎯 **Auto-Managed Variables:**

```json
{
  "baseUrl": "http://localhost:5001/api",
  "token": "auto-set after login",
  "course_id": "auto-set after creating course",
  "subcourse_id": "auto-set after creating subcourse", 
  "user_id": "auto-set after login",
  "course_code": "for course search/join",
  "comment_id": "auto-set after creating comment",
  "notification_id": "for notification management",
  "refresh_token": "for token refresh"
}
```

### 🚀 **Complete Test Flow:**

```
1. 🔐 Authentication
   → Login Teacher/Student
   → Auto-set token for all requests

2. 📚 Course Management
   → Create Course (auto-set course_id)
   → Search/Filter courses
   → Publish course

3. 📄 SubCourse Creation
   → Create Quiz SubCourse
   → Create Video SubCourse
   → Test different content types

4. 📈 Progress Tracking
   → Update Quiz Progress (0-100 scoring)
   → Update Video Progress (0/1 scoring)
   → View detailed progress

5. 💬 Interactions
   → Create Comments
   → Add Reactions
   → Test pagination

6. 📊 Analytics
   → View teacher dashboard
   → Check student progress
   → Export reports

7. 🔧 Admin Functions
   → Manage users
   → Course administration
   → Debug tools
```

### 📋 **Fixed Route Issues:**

- ✅ **Password Change**: `PUT /users/change-password` (not POST)
- ✅ **Photo Upload**: Field `foto_profil` (not `photo`)
- ✅ **OAuth Routes**: Correct `/auth/google/*` endpoints
- ✅ **Progress Routes**: Proper `/subcourses/:id/progress` endpoints
- ✅ **Comment Routes**: Correct `/comments/subcourse/:id` structure
- ✅ **Analytics Routes**: Proper `/analytics/*` hierarchy
- ✅ **Search Routes**: Added `/courses/search` endpoint
- ✅ **Enrollment Routes**: Added `/enrollments/*` endpoints

### 🎮 **Ready Test Accounts:**

```
Teacher: teacher@kancil.com / teacher123
Student: student1@kancil.com / student123
```

### 📊 **Endpoint Count:**

- **Authentication**: 8 endpoints
- **Courses**: 8 endpoints  
- **SubCourses**: 6 endpoints
- **Student Enrollment**: 3 endpoints
- **Enhanced Progress**: 4 endpoints
- **Comments & Reactions**: 10 endpoints
- **User Management**: 7 endpoints
- **Course Management**: 3 endpoints
- **OAuth**: 3 endpoints
- **Chat & AI**: 2 endpoints
- **File Upload**: 3 endpoints
- **Analytics**: 8 endpoints
- **Notifications**: 3 endpoints
- **Reports**: 3 endpoints
- **Debugging**: 5 endpoints
- **Health Check**: 1 endpoint

**Total: 75+ endpoints - Complete API coverage!**

## ⚡ **Ready to Use!**

Import `Kancil_AI_Complete_Collection.json` dan semua endpoint sudah siap dengan route yang benar dan auto-token management.

**One collection, all features, zero errors! 🎉**