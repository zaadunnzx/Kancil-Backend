# Installation Guide

Complete setup guide for Kancil AI Backend development environment.

## 📋 Prerequisites

- **Node.js** 16.x or higher
- **PostgreSQL** 12.x or higher
- **npm** or **yarn**
- **Git**

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd Kancil-Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` file with your configurations:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kancil_ai
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Google OAuth (Optional for student login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Server Configuration
PORT=5001
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=100MB
UPLOAD_PATH=uploads/
```

### 4. Database Setup
```bash
# Create database
createdb kancil_ai

# Or using psql
psql -U postgres -c "CREATE DATABASE kancil_ai;"
```

### 5. Initialize Database
```bash
# Setup database structure and relationships
npm run db:setup
```

### 6. Seed Sample Data (Optional)
```bash
# Add sample users, courses, and data for testing
npm run db:seed
```

### 7. Test Database Associations
```bash
# Verify all database relationships are working
node test-associations.js
```

Expected output:
```bash
✅ Database connection successful
✅ Course.subcourses association works
✅ Course.teacher association works
✅ Course.enrollments association works
✅ SubCourse.course association works
✅ Complex query works - found 3 courses
✅ Paginated query works - found 5 total courses
🎉 All associations are working correctly!
```

### 8. Start Development Server
```bash
npm run dev
```

Server will start at: `http://localhost:5001`

## 🔧 Alternative Setup Methods

### Using Docker (Recommended for consistent environment)
```bash
# Build and start containers
docker-compose up -d

# Run database setup in container
docker-compose exec backend npm run db:setup

# Seed data
docker-compose exec backend npm run db:seed

# Test associations
docker-compose exec backend node test-associations.js
```

### Manual Database Setup
If automatic setup fails, try manual setup:

1. **Create Database Tables**:
```bash
node scripts/database/setup-fresh.js
```

2. **Run Specific Migrations**:
```bash
node scripts/database/migrate.js
```

3. **Seed Specific Data**:
```bash
node scripts/database/seed/users.js
node scripts/database/seed/courses.js
node scripts/database/seed/analytics.js
```

## ✅ Verify Installation

### 1. Test Database Connection
```bash
node test-associations.js
```

### 2. Test API Health
```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### 3. Test Authentication
```bash
# Test teacher login
curl -X POST http://localhost:5001/api/auth/login/teacher \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@kancil.com", "password": "teacher123"}'
```

### 4. Test Course API
```bash
# Get courses (requires auth token)
curl -X GET http://localhost:5001/api/courses \
  -H "Authorization: Bearer <your-token>"
```

## 📁 Project Structure

After successful installation:
```
Kancil-Backend/
├── config/                    # Configuration files
├── middleware/               # Express middleware
├── models/                   # Database models
├── routes/                   # API routes
├── uploads/                  # File uploads directory
├── logs/                     # Application logs
├── test-associations.js      # Database testing script
├── server.js                # Main server file
└── .env                     # Environment variables
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Error: database "kancil" does not exist
# Solution:
createdb kancil_ai
```

#### Port Already in Use
```bash
# Error: Port 5001 is already in use
# Solution: Kill existing process
lsof -ti:5001 | xargs kill -9
# Or change port in .env file
```

#### JWT Secret Missing
```bash
# Error: JWT_SECRET is required
# Solution: Add to .env file
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
```

#### Association Errors
```bash
# Error: association "subcourses" does not exist
# Solution: Run association test
node test-associations.js

# If still fails, check models/index.js
```

For more issues, see [Troubleshooting Guide](./troubleshooting.md).

## 📱 Next Steps

1. [Configure Environment Variables](./environment.md)
2. [Setup Database Schema](./database-setup.md)
3. [Start API Development](../api/README.md)
4. [Test with Postman](../api/testing.md)
5. [Deploy to Production](../deployment/production.md)

## 🔗 Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run test            # Run tests
npm run lint            # Check code style

# Database
npm run db:setup        # Setup database
npm run db:seed         # Seed sample data
npm run db:reset        # Reset database

# Testing
node test-associations.js    # Test database relationships
npm run test:api            # Test API endpoints
```

## 📞 Support

If you encounter issues during installation:

1. Check [Troubleshooting Guide](./troubleshooting.md)
2. Review [Environment Configuration](./environment.md)
3. Test with [API Testing Guide](../api/testing.md)
4. Create GitHub issue if problem persists

Happy coding! 🚀