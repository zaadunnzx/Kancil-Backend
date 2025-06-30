# API Testing Guide

Comprehensive guide for testing Kancil AI Backend APIs using Postman and automated scripts.

## 🚀 Quick Start

### 1. Import Postman Collection
```bash
# Download collection
curl -O postman/Kancil_AI_Complete_Collection.json

# Import to Postman:
# File → Import → Upload Files → Select collection file
```

### 2. Setup Environment
Import environment file: `postman/Kancil_Development.postman_environment.json`

Variables automatically set:
```json
{
  "baseUrl": "http://localhost:5001/api",
  "token": "auto-set after login",
  "course_id": "auto-set after creating course",
  "subcourse_id": "auto-set after creating subcourse",
  "user_id": "auto-set after login"
}
```

### 3. Test Flow
```
1. Authentication → Login as teacher/student
2. Courses → Create/manage courses
3. SubCourses → Add learning content
4. Analytics → View dashboard data
5. Chat → Test AI interaction
```

## 🧪 Automated Testing

### Run API Tests
```bash
# Cross-platform API testing
node scripts/testing/test-api.js

# Test database associations
node scripts/testing/test-associations.js

# Test specific endpoint group
node scripts/testing/test-api.js auth
node scripts/testing/test-api.js courses
node scripts/testing/test-api.js analytics
```

### Expected Output
```bash
✅ Server health check passed
✅ Teacher login successful
✅ Student login successful
✅ Course creation successful
✅ SubCourse creation successful
✅ Analytics endpoints working
✅ Chat functionality working

🎉 All tests passed!
```

## 📋 Test Scenarios

### Authentication Testing
```javascript
// Test teacher login
POST {{baseUrl}}/auth/login/teacher
{
  "email": "teacher@kancil.com",
  "password": "teacher123"
}

// Test student login
POST {{baseUrl}}/auth/login/student
{
  "email": "student1@kancil.com", 
  "password": "student123"
}

// Test Google OAuth (student only)
GET {{baseUrl}}/auth/google/student
```

### Course Management Testing
```javascript
// Create course (teacher only)
POST {{baseUrl}}/courses
{
  "title": "Test Course",
  "subject": "Mathematics",
  "kelas": 5
}

// Publish course
PATCH {{baseUrl}}/courses/{{course_id}}/publish

// Archive course
PATCH {{baseUrl}}/courses/{{course_id}}/archive
```

### Content Testing
```javascript
// Create video subcourse
POST {{baseUrl}}/subcourses
Content-Type: multipart/form-data
- course_id: {{course_id}}
- title: "Video Lesson"
- content_type: "video"
- video_file: [upload video file]
```

### Analytics Testing
```javascript
// Teacher dashboard
GET {{baseUrl}}/analytics/dashboard

// Student progress
GET {{baseUrl}}/analytics/student/dashboard

// Submit analytics data
POST {{baseUrl}}/analytics/session
{
  "sub_course_id": 1,
  "session_id": "session-123",
  "total_duration": 600,
  "analytics_data": [...]
}
```

## 🎯 Test Accounts

### Pre-seeded Accounts
```javascript
// Teacher Account
{
  "email": "teacher@kancil.com",
  "password": "teacher123",
  "role": "teacher"
}

// Student Accounts
{
  "email": "student1@kancil.com",
  "password": "student123", 
  "role": "student",
  "kelas": 5
}

{
  "email": "student2@kancil.com",
  "password": "student123",
  "role": "student", 
  "kelas": 5
}
```

## 🔧 Custom Testing Scripts

### Create Test Data
```bash
# Generate sample analytics data
node scripts/testing/generate-test-data.js

# Create additional test users
node scripts/development/create-test-users.js

# Reset database for testing
node scripts/development/reset-data.js
```

### Performance Testing
```bash
# Test API performance
npm run test:performance

# Load testing with artillery
artillery run performance-tests/api-load-test.yml
```

## 📊 API Response Validation

### Success Response Format
```json
{
  "message": "Success message",
  "data": { ... },
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50
  }
}
```

### Error Response Format
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

## 🚨 Troubleshooting

### Common Issues

#### 404 Route Not Found
```bash
# Check server is running
curl http://localhost:5001/api/health

# Verify base URL in Postman environment
baseUrl = "http://localhost:5001/api"
```

#### 401 Unauthorized
```bash
# Check token is set after login
echo $token

# Re-login if token expired
POST {{baseUrl}}/auth/login/teacher
```

#### 500 Server Error
```bash
# Check database connection
node scripts/testing/test-associations.js

# Check server logs
tail -f logs/error.log
```

### Debug Mode
```bash
# Start server in debug mode
DEBUG=* npm run dev

# Enable verbose logging
NODE_ENV=development DEBUG=true npm run dev
```

## 📈 Coverage Reports

```bash
# Generate test coverage
npm run test:coverage

# View coverage report
open coverage/index.html
```

## 🎮 Interactive Testing

### Postman Collection Features
- ✅ **Auto-token management** - Tokens set automatically after login
- ✅ **Variable extraction** - IDs extracted from responses
- ✅ **Pre-request scripts** - Automatic data setup
- ✅ **Test assertions** - Response validation
- ✅ **Environment switching** - Dev/staging/production

### Run Collection
1. **Individual Requests** - Test one endpoint at a time
2. **Run Collection** - Execute all requests in sequence
3. **Run Folder** - Test specific feature group
4. **Scheduled Runs** - Automated testing with Newman

## 🔗 Related Documentation

- [API Overview](./README.md) - API introduction
- [Authentication](./authentication.md) - Auth implementation
- [Troubleshooting](../setup/troubleshooting.md) - Common issues
- [Contributing](../deployment/ci-cd.md) - Development guidelines

## 📋 Testing Checklist

### Before Testing:
- [ ] Server running on correct port
- [ ] Database seeded with sample data
- [ ] Postman collection imported
- [ ] Environment variables configured

### Authentication Tests:
- [ ] Teacher login successful
- [ ] Student login successful
- [ ] Google OAuth working (students)
- [ ] Role-based access working
- [ ] Token expiration handling

### Course Management Tests:
- [ ] Create course (teacher)
- [ ] Update course (teacher)
- [ ] Publish course (teacher)
- [ ] Archive/unarchive course
- [ ] Join course (student)
- [ ] Course filtering and search

### Content Tests:
- [ ] Create subcourse (video/PDF/quiz)
- [ ] Upload files successfully
- [ ] Update student progress
- [ ] Comments and reactions
- [ ] AI chat functionality

### Analytics Tests:
- [ ] Teacher dashboard data
- [ ] Student progress tracking
- [ ] Course analytics
- [ ] Export functionality

### Error Handling Tests:
- [ ] Invalid credentials
- [ ] Unauthorized access
- [ ] Missing required fields
- [ ] File upload limits
- [ ] Database connection errors

## 🎯 Best Practices

### Test Organization:
1. **Group related tests** in folders
2. **Use descriptive names** for requests
3. **Include assertions** for validation
4. **Document expected responses**
5. **Handle error scenarios**

### Environment Management:
1. **Separate environments** for dev/staging/prod
2. **Use environment variables** for URLs
3. **Secure sensitive data**
4. **Version control configurations**

### Automation:
1. **Write reusable test scripts**
2. **Use CI/CD for automated testing**
3. **Monitor API performance**
4. **Schedule regular test runs**

Happy Testing! 🚀