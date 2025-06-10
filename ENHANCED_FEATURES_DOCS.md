# Enhanced API Features Documentation

## 🔧 Fixed APIs

### 1. Change Password API
- **Endpoint**: `PUT /users/change-password`
- **Status**: ✅ Fixed
- **Method**: Simple password change (current + new password, no OTP)

### 2. Upload Profile Photo API  
- **Endpoint**: `POST /upload/profile-photo`
- **Status**: ✅ Fixed
- **Method**: Multipart form upload

## 🎯 Enhanced Progress System

### Overview
The progress system now supports different scoring mechanisms based on content type:

### Quiz Content (`content_type: 'quiz'`)
- **Score Range**: 0-100 (percentage)
- **Required Fields**: `score`, `quiz_answers`
- **Response Format**:
```json
{
  "data": {
    "progress": {
      "sub_course_id": 1,
      "content_type": "quiz",
      "status": "completed",
      "score": 85.5,
      "completion_percentage": 100,
      "time_spent": 300,
      "attempts": 2,
      "quiz_answers": {
        "question_1": "answer_a",
        "question_2": "answer_c",
        "total_questions": 10,
        "correct_answers": 8
      },
      "completed_at": "2024-12-01T10:30:00Z"
    }
  }
}
```

### Video/PDF/Other Content
- **Score**: Binary (0 = incomplete, 1 = complete)
- **Response Format**:
```json
{
  "data": {
    "progress": {
      "sub_course_id": 1,
      "content_type": "video",
      "status": "completed", 
      "completed": 1,
      "completion_percentage": 100,
      "time_spent": 180,
      "attempts": 1,
      "completed_at": "2024-12-01T10:30:00Z"
    }
  }
}
```

## 📝 API Examples

### Update Quiz Progress
```http
PATCH /api/subcourses/1/progress
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "completed",
  "score": 85.5,
  "completion_percentage": 100,
  "time_spent": 300,
  "quiz_answers": {
    "question_1": "answer_a",
    "question_2": "answer_c",
    "total_questions": 10,
    "correct_answers": 8
  }
}
```

### Update Video/PDF Progress
```http
PATCH /api/subcourses/1/progress
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "completed",
  "completion_percentage": 100,
  "time_spent": 180
}
```

### Get Progress Details
```http
GET /api/subcourses/1/progress
Authorization: Bearer <token>
```

### Change Password
```http
PUT /api/users/change-password
Content-Type: application/json
Authorization: Bearer <token>

{
  "current_password": "oldPassword123",
  "new_password": "newPassword456"
}
```

### Upload Profile Photo
```http
POST /api/upload/profile-photo
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- foto_profil: [image file]
```

## 🗄️ Database Schema Changes

### StudentSubCourseProgress Table Updates:
```sql
ALTER TABLE student_sub_course_progress 
ADD COLUMN completion_percentage INTEGER DEFAULT 0,
ADD COLUMN time_spent INTEGER DEFAULT 0 COMMENT 'Time spent in seconds',
ADD COLUMN attempts INTEGER DEFAULT 0 COMMENT 'Number of attempts for quiz content',
ADD COLUMN quiz_answers JSON COMMENT 'Quiz answers and results for quiz content type',
MODIFY COLUMN score DECIMAL(5,2) NULL COMMENT 'Score: 0-100 for quiz, 0-1 for others';
```

## ⚡ Key Features

1. **Content-Type Aware Scoring**: Different scoring logic for quiz vs media content
2. **Detailed Progress Tracking**: Time spent, attempts, completion percentage
3. **Quiz Answer Storage**: Store quiz responses and results
4. **Enhanced User Management**: Simple password change, profile photo upload
5. **Backward Compatibility**: Existing progress records still work

## 🔒 Security & Validation

- Input validation for all fields
- Score range validation based on content type
- Authentication required for all endpoints
- File type validation for photo uploads
- Password strength requirements

## 📊 Response Patterns

All APIs follow consistent response pattern:
```json
{
  "success": true,
  "message": "Descriptive message",
  "data": { /* response data */ }
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional error info"
}
```