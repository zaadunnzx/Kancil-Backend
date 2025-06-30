# Kancil AI Backend Documentation

Complete documentation for Kancil AI Backend - AI-powered learning platform for elementary students.

## 📚 Documentation Structure

This documentation is organized into the following sections:

### 🛠️ [Setup & Installation](./setup/)
Get started with Kancil AI Backend development environment.

- **[Installation Guide](./setup/installation.md)** - Step-by-step setup process
- **[Database Setup](./setup/database-setup.md)** - PostgreSQL configuration
- **[Environment Configuration](./setup/environment.md)** - Environment variables
- **[Troubleshooting](./setup/troubleshooting.md)** - Common issues & solutions

### 🔌 [API Documentation](./api/)
Comprehensive API reference and integration guides.

- **[API Overview](./api/README.md)** - Base API configuration
- **[Authentication](./api/authentication.md)** - JWT & OAuth implementation
- **[Courses](./api/courses.md)** - Course management endpoints
- **[SubCourses](./api/subcourses.md)** - Learning content management
- **[Analytics](./api/analytics.md)** - Dashboard & reporting APIs
- **[Chat & AI](./api/chat.md)** - Chatbot integration
- **[Interactions](./api/interactions.md)** - Comments & reactions
- **[Announcements](./api/announcements.md)** - Communication system
- **[File Upload](./api/file-upload.md)** - File management
- **[Testing Guide](./api/testing.md)** - API testing with Postman

### ⚡ [Features](./features/)
Detailed documentation of core features and implementations.

- **[Course Archive System](./features/course-archive.md)** - Archive/restore courses
- **[Teacher Dashboard](./features/teacher-dashboard.md)** - Analytics & management
- **[Student Dashboard](./features/student-dashboard.md)** - Learning progress
- **[Quiz System](./features/quiz-system.md)** - Interactive assessments
- **[AI Integration](./features/ai-integration.md)** - Chatbot implementation

### 🎨 [Frontend Integration](./frontend/)
Guides for integrating frontend applications with the backend.

- **[Integration Guide](./frontend/integration-guide.md)** - Complete frontend setup
- **[Authentication](./frontend/authentication.md)** - Frontend auth implementation
- **[State Management](./frontend/state-management.md)** - Advanced patterns
- **[Components](./frontend/components.md)** - Reusable components

### 🚀 [Deployment](./deployment/)
Production deployment and infrastructure guides.

- **[Production Deployment](./deployment/production.md)** - Server deployment
- **[Staging Environment](./deployment/staging.md)** - Testing environment
- **[CI/CD Pipeline](./deployment/ci-cd.md)** - Automated deployment

## 🚀 Quick Start

For first-time users, follow this path:

1. **[Installation Guide](./setup/installation.md)** - Set up development environment
2. **[Database Setup](./setup/database-setup.md)** - Configure PostgreSQL
3. **[API Testing](./api/testing.md)** - Test API endpoints
4. **[Frontend Integration](./frontend/integration-guide.md)** - Connect frontend

## 🎯 Key Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with refresh tokens
- **Google OAuth integration** (students only)
- **Role-based access control** (student/teacher)
- **Secure password management**

### 📚 Course Management
- **Complete CRUD operations** for courses
- **Content management** (videos, PDFs, quizzes)
- **Student enrollment** system
- **Course lifecycle** (draft → published → archived)

### 📊 Progress Tracking
- **Enhanced progress system** with content-type specific scoring
- **Quiz analytics** with detailed results
- **Student engagement metrics**
- **Performance dashboards**

### 🤖 AI Integration
- **Interactive chatbot** ("Pak Dino")
- **Context-aware responses** based on course content
- **Learning assistance** and Q&A support

### 💬 Interactive Features
- **Comments system** for course content
- **Reactions** (like, sad, disappointed)
- **Real-time notifications**
- **Student-teacher communication**

### 📈 Analytics & Reporting
- **Teacher dashboard** with course analytics
- **Student progress reports**
- **Engagement tracking**
- **Performance insights**

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | Node.js 16+ | JavaScript runtime |
| **Framework** | Express.js | Web framework |
| **Database** | PostgreSQL 12+ | Primary database |
| **ORM** | Sequelize | Database modeling |
| **Authentication** | Passport.js | Authentication middleware |
| **File Upload** | Multer | File handling |
| **Validation** | Joi | Input validation |
| **Testing** | Jest/Postman | Testing framework |
| **Documentation** | Swagger/OpenAPI | API documentation |

## 🔗 External Integrations

### Google Services
- **Google OAuth** for student authentication
- **Google Cloud Storage** for file uploads (optional)

### AI Services
- **OpenAI API** for chatbot responses
- **Custom AI models** for educational content

### Email Services
- **SMTP integration** for notifications
- **SendGrid/Mailgun** support for production

## 📋 Development Workflow

### 1. Setup Development Environment
```bash
# Clone repository
git clone <repository-url>
cd Kancil-Backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configurations

# Setup database
npm run db:setup
npm run db:seed

# Start development server
npm run dev
```

### 2. API Development
- Follow RESTful conventions
- Use consistent error handling
- Implement proper validation
- Write comprehensive tests
- Document endpoints

### 3. Testing
- **Unit tests** for business logic
- **Integration tests** for API endpoints
- **Postman collections** for manual testing
- **Performance testing** for scalability

### 4. Deployment
- **Staging deployment** for testing
- **Production deployment** with monitoring
- **CI/CD pipeline** for automation

## 🧪 Testing

### Test Accounts
```javascript
// Teacher Account
{
  "email": "teacher@kancil.com",
  "password": "teacher123"
}

// Student Accounts
{
  "email": "student1@kancil.com",
  "password": "student123"
}
```

### Testing Tools
- **Postman Collection**: `postman/Kancil_AI_Complete_Collection.json`
- **Automated Scripts**: `scripts/testing/`
- **Database Tests**: `test-associations.js`

## 📊 API Endpoints Overview

### Authentication
- `POST /auth/login/student` - Student login
- `POST /auth/login/teacher` - Teacher login
- `GET /auth/google/student` - Google OAuth

### Courses
- `GET /courses` - List courses
- `POST /courses` - Create course
- `PATCH /courses/:id/publish` - Publish course

### Learning Content
- `GET /subcourses/:courseId` - Get course content
- `POST /subcourses` - Create content
- `PATCH /subcourses/:id/progress` - Update progress

### Analytics
- `GET /analytics/dashboard` - Teacher dashboard
- `GET /analytics/student/dashboard` - Student dashboard

### AI Chat
- `POST /chat/send-message` - Send message to AI
- `GET /chat/history/:subcourseId` - Chat history

[📖 **View Complete API Documentation**](./api/README.md)

## 🔧 Configuration

### Environment Variables
```env
# Core Configuration
NODE_ENV=development
PORT=5001
DB_HOST=localhost
DB_NAME=kancil_ai
JWT_SECRET=your_secret_here

# External Services
GOOGLE_CLIENT_ID=your_google_client_id
OPENAI_API_KEY=your_openai_key
```

[🔧 **View Complete Configuration Guide**](./setup/environment.md)

## 🚨 Common Issues

### Database Connection
```bash
# Error: password authentication failed
# Solution: Check password format in .env
password: "your_password"  // Must be string
```

### Port Already in Use
```bash
# Kill existing process
lsof -ti:5001 | xargs kill -9
```

### Association Errors
```bash
# Test database relationships
node test-associations.js
```

[🚨 **View Complete Troubleshooting Guide**](./setup/troubleshooting.md)

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Follow** coding standards and conventions
4. **Write** tests for new features
5. **Update** documentation as needed
6. **Commit** changes (`git commit -m 'Add amazing feature'`)
7. **Push** to branch (`git push origin feature/amazing-feature`)
8. **Open** Pull Request

### Code Standards
- **ES6+** JavaScript syntax
- **Consistent** naming conventions
- **Comprehensive** error handling
- **Proper** validation and sanitization
- **Security** best practices

## 📞 Support

- 📖 **Documentation**: Browse this documentation
- 🐛 **Issues**: [Create GitHub Issue](../../issues) for bugs
- ❓ **Questions**: Check [Troubleshooting Guide](./setup/troubleshooting.md)
- 💬 **Discussions**: [GitHub Discussions](../../discussions) for general questions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Happy Learning! 📚✨**

*Kancil AI - Making education accessible and engaging for every child.*