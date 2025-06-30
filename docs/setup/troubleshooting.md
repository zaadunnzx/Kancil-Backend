# Troubleshooting Guide

Common issues and solutions for Kancil AI Backend development.

## 🔧 Database Issues

### Error: `database "kancil" does not exist`
```bash
# Solution: Create database
createdb kancil_ai

# Or using psql
psql -U postgres -c "CREATE DATABASE kancil_ai;"
```

### Error: `record "new" has no field "updated_at"`
```bash
# Solution: Run database fixes
# 1. Go to pgAdmin 4
# 2. Run scripts from database/fix-database-structure.sql
# 3. Run scripts from database/fix-associations.sql
```

### Error: `association "subcourses" does not exist`
```bash
# Solution: Test associations
node test-associations.js

# If fails, check models/index.js for proper associations
```

### Error: `client password must be a string`
```bash
# Solution: Check config/database.js
# Make sure password is in quotes:
# ❌ Wrong: password: yourpassword,
# ✅ Correct: password: "yourpassword",
```

## 🚨 Server Issues

### Error: `Port 5001 is already in use`
```bash
# Solution 1: Kill existing process
lsof -ti:5001 | xargs kill -9

# Solution 2: Change port in .env
PORT=5002
```

### Error: `JWT_SECRET is required`
```bash
# Solution: Add JWT secret to .env
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
```

### Error: Module not found
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 API Issues

### Error: `401 Unauthorized`
```bash
# Check if token is set in request headers
Authorization: Bearer <your-jwt-token>

# Re-login if token expired
POST /api/auth/login/teacher
```

### Error: `404 Route not found`
```bash
# Check server is running
curl http://localhost:5001/api/health

# Verify route exists in routes folder
```

### Error: `403 Forbidden`
```bash
# Check user role permissions
# Students can't access teacher-only endpoints
# Teachers can't access student-specific data
```

## 🔍 Development Issues

### Error: `npm install` fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error: File upload fails
```bash
# Check uploads directory exists
mkdir -p uploads/{videos,images,documents}

# Check file permissions
chmod 755 uploads/
```

### Error: Database connection fails
```bash
# Check PostgreSQL is running
# Windows:
net start postgresql-x64-13

# Linux/Mac:
sudo systemctl start postgresql
brew services start postgresql
```

## 🧪 Testing Issues

### Error: `Association test failed`
```bash
# Check database has sample data
npm run db:seed

# Verify tables exist
psql -d kancil_ai -c "\dt"
```

### Error: Postman collection not working
```bash
# Check baseUrl in environment
baseUrl = "http://localhost:5001/api"

# Verify server is running on correct port
```

### Error: Google OAuth not working
```bash
# Check Google credentials in .env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Verify redirect URI in Google Console
http://localhost:5001/api/auth/google/callback
```

## 🔄 Model & Association Issues

### Error: `Cannot read property of undefined`
```bash
# Check model associations in models/index.js
# Verify foreign keys are correct
# Test with: node test-associations.js
```

### Error: `Sequelize validation error`
```bash
# Check model validations
# Verify required fields are provided
# Check data types match model definitions
```

## 📊 Analytics Issues

### Error: `Analytics returning null`
```bash
# Check if sample data exists
# Run: npm run db:seed
# Verify student progress data exists
```

### Error: `Teacher analytics empty`
```bash
# Make sure teacher has courses
# Check students are enrolled
# Verify progress data exists
```

## 🤖 Chat/AI Issues

### Error: `AI response empty`
```bash
# Check if subcourse context exists
# Verify student is enrolled in course
# Check chat history table has data
```

## 🔐 Authentication Issues

### Error: `Google OAuth fails`
```bash
# Check Google OAuth setup
# Verify callback URL matches
# Test in incognito mode
```

### Error: `Token expired`
```bash
# Login again to get fresh token
# Check token expiration time
# Implement refresh token logic
```

## 📁 File Management Issues

### Error: `File upload size limit`
```bash
# Check multer configuration
# Verify file size limits in code
# Increase limits if needed:
# - Images: 5MB
# - Videos: 100MB
# - Documents: 10MB
```

### Error: `File type not allowed`
```bash
# Check file type validation
# Supported types:
# - Images: JPEG, PNG, GIF, WebP
# - Videos: MP4, AVI, MOV, WMV
# - Documents: PDF, DOC, DOCX
```

## 🔧 Environment Issues

### Error: `.env file not loaded`
```bash
# Check .env file exists in root directory
# Verify no syntax errors in .env
# Restart server after .env changes
```

### Error: `NODE_ENV not set`
```bash
# Set NODE_ENV in .env
NODE_ENV=development

# Or set when starting:
NODE_ENV=development npm run dev
```

## 🚀 Performance Issues

### Error: `Slow database queries`
```bash
# Check database indexes
# Use EXPLAIN ANALYZE for slow queries
# Consider pagination for large datasets
```

### Error: `Memory leaks`
```bash
# Check for unclosed database connections
# Monitor memory usage
# Use process monitoring tools
```

## 📞 Getting Help

### Steps to Get Help:

1. **Check Error Logs**:
   ```bash
   tail -f logs/error.log
   tail -f logs/combined.log
   ```

2. **Test Basic Functionality**:
   ```bash
   # Health check
   curl http://localhost:5001/api/health
   
   # Database test
   node test-associations.js
   ```

3. **Verify Environment**:
   ```bash
   # Check Node.js version
   node --version
   
   # Check PostgreSQL status
   pg_isready
   ```

4. **Review Configuration**:
   - Check `.env` file
   - Verify database connection
   - Test API endpoints

5. **Create Detailed Issue**:
   - Include error messages
   - Provide steps to reproduce
   - Share relevant logs
   - Specify environment details

## 🎯 Prevention Tips

### Best Practices:
- Always backup database before major changes
- Use version control for configuration files
- Test in development before production
- Monitor logs regularly
- Keep dependencies updated
- Use proper error handling

### Regular Maintenance:
```bash
# Weekly tasks
npm audit
npm outdated

# Database maintenance
VACUUM ANALYZE; -- In PostgreSQL

# Log rotation
logrotate /etc/logrotate.conf
```

---

**Need more help?** Check the [Installation Guide](./installation.md) or create a GitHub issue with detailed information about your problem.