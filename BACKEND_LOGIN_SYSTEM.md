# Backend Login System Documentation

## 🔐 Authentication System Overview

Backend Kancil AI sekarang mendukung sistem login yang terpisah untuk siswa dan guru:

### **📱 Student Authentication**
- ✅ **Email/Password Login** via `/api/auth/login/student`
- ✅ **Google OAuth Login** via `/api/auth/google/student` 
- ✅ **General Login** via `/api/auth/login` (dengan validasi role)

### **👨‍🏫 Teacher Authentication**  
- ✅ **Email/Password Only** via `/api/auth/login/teacher`
- ❌ **No Google OAuth** (teachers cannot register/login via Google)

## 🚀 API Endpoints

### **Authentication Endpoints**

#### **General Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "student" // optional, for validation
}
```

#### **Student Login (Email/Password)**
```http
POST /api/auth/login/student
Content-Type: application/json

{
  "email": "student@example.com", 
  "password": "password123"
}
```

#### **Teacher Login (Email/Password)**
```http
POST /api/auth/login/teacher
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "password123"
}
```

#### **Student Google OAuth**
```http
GET /api/auth/google/student
# Redirects to Google OAuth, then back to frontend
```

#### **Teacher Google OAuth (Blocked)**
```http
GET /api/auth/google/teacher
# Returns error - teachers cannot use Google OAuth
```

### **Response Format**

#### **Successful Login Response**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nama_lengkap": "John Doe",
    "email": "john@example.com", 
    "role": "student",
    "kelas": 5,
    "nama_sekolah": "SD Example",
    "foto_profil_url": "https://example.com/photo.jpg"
  }
}
```

#### **Error Response**
```json
{
  "error": "Invalid credentials"
}
```

## 🔒 Role-Based Validation

### **Student Login Validation**
- Endpoint: `/api/auth/login/student`
- Only users with `role: 'student'` can login
- Error if teacher tries to login: `"Invalid student credentials"`

### **Teacher Login Validation**  
- Endpoint: `/api/auth/login/teacher`
- Only users with `role: 'teacher'` can login
- Error if student tries to login: `"Invalid teacher credentials"`

### **Google OAuth Validation**
- `/api/auth/google/student` - Only creates/allows student accounts
- `/api/auth/google/teacher` - Blocked, redirects to error page
- New Google users automatically get `role: 'student'`
- Existing teacher accounts cannot login via Google OAuth

## 🌐 OAuth Flow

### **Student Google OAuth Flow**
```
1. Frontend: User clicks "Login with Google" 
2. Redirect to: GET /api/auth/google/student
3. Google authentication page
4. Google redirects to: /api/auth/google/callback
5. Backend processes user:
   - New user → Create student account  
   - Existing user → Verify & login
6. Redirect to: {FRONTEND_URL}/auth/callback?token=xxx&role=student
7. Frontend processes token and redirects to dashboard
```

### **Teacher Google OAuth (Blocked)**
```
1. Frontend: User clicks teacher Google login
2. Redirect to: GET /api/auth/google/teacher  
3. Backend immediately redirects to: 
   {FRONTEND_URL}/auth/error?message=teacher_oauth_not_allowed
4. Frontend shows error message
```

## 🛠️ Environment Configuration

Required environment variables:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# URLs
BACKEND_URL=http://localhost:5001
FRONTEND_URL=http://localhost:5174

# Session
SESSION_SECRET=your_session_secret
```

## 🧪 Testing with Postman

### **Import Collection**
Import `postman/Kancil_AI_API_Collection.json` ke Postman.

### **Test Endpoints**

#### **1. Test Student Login**
```bash
# Use: "Login Student (Role-specific)" request
POST /api/auth/login/student
{
  "email": "student1@kancil.com",
  "password": "student123"  
}
```

#### **2. Test Teacher Login**
```bash
# Use: "Login Teacher (Role-specific)" request  
POST /api/auth/login/teacher
{
  "email": "teacher@kancil.com",
  "password": "teacher123"
}
```

#### **3. Test Google OAuth (Browser)**
```bash
# Open in browser for student OAuth:
http://localhost:5001/api/auth/google/student

# This will redirect to error for teacher OAuth:
http://localhost:5001/api/auth/google/teacher
```

#### **4. Test Role Validation**
```bash
# Try student login with teacher credentials - should fail
POST /api/auth/login/student  
{
  "email": "teacher@kancil.com",
  "password": "teacher123"
}
# Expected: 401 "Invalid student credentials"

# Try teacher login with student credentials - should fail
POST /api/auth/login/teacher
{
  "email": "student1@kancil.com", 
  "password": "student123"
}
# Expected: 401 "Invalid teacher credentials"
```

## 🔧 Error Handling

### **Common Error Codes**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Invalid credentials | Wrong email/password |
| 401 | Invalid student credentials | Student endpoint with non-student account |
| 401 | Invalid teacher credentials | Teacher endpoint with non-teacher account |
| 401 | Account is not active | User account is disabled |
| 403 | This account is not authorized as {role} | Role mismatch in general login |

### **OAuth Error Handling**
- Authentication failure → Redirect to `/auth/error?message=authentication_failed`
- Teacher OAuth attempt → Redirect to `/auth/error?message=teacher_oauth_not_allowed`
- Missing token → Redirect to `/auth/error?message=authentication_failed`

## 🎯 Frontend Integration

### **Frontend Login URLs**
- **Student Login Page**: `http://localhost:5174/login`
  - Shows Google OAuth button + Email/Password form
  - Calls: `/api/auth/login/student` atau `/api/auth/google/student`

- **Teacher Login Page**: `http://localhost:5174/teacher/login`  
  - Shows Email/Password form only
  - Calls: `/api/auth/login/teacher`

### **OAuth Callback Handling**
Frontend harus handle route:
- `/auth/callback?token=xxx&role=yyy` - Success
- `/auth/error?message=xxx` - Error

## 📊 Database Schema

No database changes required. Using existing `users` table:

```sql
-- Example users for testing
INSERT INTO users (nama_lengkap, email, password_hash, role, status) VALUES
('Student Test', 'student1@kancil.com', '$hashed_password', 'student', 'active'),
('Teacher Test', 'teacher@kancil.com', '$hashed_password', 'teacher', 'active');
```

## 🔄 Migration Guide

### **From Old System**
1. Keep existing `/api/auth/login` endpoint (backward compatibility)
2. Add new role-specific endpoints
3. Update frontend to use new endpoints
4. Configure Google OAuth with proper restrictions

### **Breaking Changes**
- Google OAuth for teachers is now blocked
- Role validation is now stricter
- Error messages are more specific

Sistem login backend sudah ready! 🎉