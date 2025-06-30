# Kancil AI Backend API Documentation

Comprehensive API documentation for integrating with Kancil AI Backend.

## 🔗 Quick Links

- [Authentication](./authentication.md) - JWT & OAuth integration
- [Courses](./courses.md) - Course management APIs
- [SubCourses](./subcourses.md) - Learning content APIs
- [Analytics](./analytics.md) - Dashboard & reporting
- [Chat](./chat.md) - AI chatbot integration
- [Interactions](./interactions.md) - Comments & reactions
- [Announcements](./announcements.md) - Announcement system
- [File Upload](./file-upload.md) - File management
- [Testing](./testing.md) - API testing guide

## 🚀 Quick Start

1. [Setup Development Environment](../setup/installation.md)
2. [Configure Environment Variables](../setup/environment.md)
3. [Authentication Integration](./authentication.md)
4. [Test with Postman](./testing.md)

## 📋 Base Configuration

```javascript
// config/api.js
const API_BASE_URL = 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 🎯 Environment Configuration

| Environment | Base URL | Description |
|------------|----------|-------------|
| Development | `http://localhost:5001/api` | Local development |
| Staging | `https://staging-api.kancil.com/api` | Testing environment |
| Production | `https://api.kancil.com/api` | Live environment |

## 📋 Available Endpoints

### Authentication
- `POST /auth/login/student` - Student login
- `POST /auth/login/teacher` - Teacher login
- `GET /auth/google/student` - Google OAuth (students only)
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - Logout user

### Courses
- `GET /courses` - Get all courses (with filters)
- `POST /courses` - Create course (teacher only)
- `GET /courses/:id` - Get course details
- `PUT /courses/:id` - Update course (teacher only)
- `PATCH /courses/:id/publish` - Publish course
- `PATCH /courses/:id/archive` - Archive course
- `POST /courses/join` - Join course by code (student)

### SubCourses
- `GET /subcourses/:courseId` - Get all subcourses in course
- `POST /subcourses` - Create subcourse (teacher only)
- `POST /subcourses/upload-video` - Upload video content
- `PATCH /subcourses/:id/progress` - Update student progress

### Analytics
- `GET /analytics/dashboard` - Teacher dashboard
- `GET /analytics/student/dashboard` - Student dashboard
- `POST /analytics/session` - Submit learning session data
- `GET /analytics/courses/:id` - Course analytics

### Chat/AI
- `POST /chat/send-message` - Send message to AI "Pak Dino"
- `GET /chat/history/:subcourseId` - Get chat history
- `DELETE /chat/clear/:subcourseId` - Clear chat history

### Interactions
- `POST /interactions/comments` - Add comment
- `GET /interactions/comments/:subcourseId` - Get comments
- `POST /interactions/reactions` - Add reaction
- `GET /interactions/reactions/:subcourseId` - Get reactions

### Announcements
- `GET /announcements` - Get announcements
- `POST /announcements` - Create announcement (teacher)
- `PUT /announcements/:id` - Update announcement
- `DELETE /announcements/:id` - Delete announcement

### File Upload
- `POST /upload/video` - Upload video file
- `POST /upload/image` - Upload image file
- `POST /upload/document` - Upload document file
- `GET /uploads/:filename` - Serve uploaded file

## 🔒 Authentication Headers

All protected endpoints require JWT token in Authorization header:

```javascript
headers: {
  'Authorization': 'Bearer <your-jwt-token>',
  'Content-Type': 'application/json'
}
```

## 📊 Response Format

### Success Response
```json
{
  "message": "Success message",
  "data": { ... },
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

## 🚨 Common Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Invalid data format |
| 500 | Server Error | Internal server error |

## 🧪 Testing Tools

- **Postman Collection**: [Download here](../../postman/Kancil_AI_Complete_Collection.json)
- **Automated Tests**: `node test-associations.js`
- **API Health Check**: `GET /api/health`

## 📈 Rate Limiting

API implements rate limiting to prevent abuse:

```javascript
// Default limits
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
}
```

## 🔧 Pagination

List endpoints support pagination:

```javascript
// Request
GET /api/courses?page=1&limit=10

// Response
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🎯 Best Practices

### Frontend Integration:
1. **Always handle errors gracefully**
2. **Implement token refresh logic**
3. **Use loading states for better UX**
4. **Validate input before sending requests**
5. **Handle network errors**

### Security:
1. **Never expose JWT secrets**
2. **Validate all user inputs**
3. **Use HTTPS in production**
4. **Implement proper CORS**
5. **Regular security audits**

## 🔗 Related Documentation

- [Authentication Guide](./authentication.md) - Detailed auth implementation
- [Course Management](./courses.md) - Course API examples
- [Testing Guide](./testing.md) - API testing strategies
- [Troubleshooting](../setup/troubleshooting.md) - Common issues

[See individual sections for detailed implementation examples and React integration patterns]