# Environment Configuration

Complete guide for configuring environment variables and settings.

## 🔧 Environment Files

### Development Environment (.env)
```env
# Development Environment Configuration
NODE_ENV=development
PORT=5001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kancil_ai
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# Google OAuth (Development)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# URLs
BACKEND_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=100MB
UPLOAD_PATH=uploads/

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Development Features
DEBUG=true
ENABLE_CORS=true
```

### Production Environment (.env.production)
```env
# Production Environment Configuration
NODE_ENV=production
PORT=5001

# Database Configuration (Use environment variables or secrets)
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=kancil_ai_prod
DB_USER=kancil_user
DB_PASSWORD=${DATABASE_PASSWORD}

# JWT Configuration (Use strong secrets)
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# Google OAuth (Production)
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

# URLs (Production domains)
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com

# File Upload Configuration
MAX_FILE_SIZE=100MB
UPLOAD_PATH=/var/www/kancil-backend/uploads

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

# Logging
LOG_LEVEL=error
LOG_FILE=/var/log/kancil-backend/app.log

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
ENABLE_CORS=false
TRUSTED_ORIGINS=https://app.yourdomain.com
```

### Testing Environment (.env.test)
```env
# Testing Environment Configuration
NODE_ENV=test
PORT=5002

# Test Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kancil_ai_test
DB_USER=postgres
DB_PASSWORD=your_password

# JWT (Test secrets)
JWT_SECRET=test_secret_for_testing_only
JWT_EXPIRES_IN=1h

# Disable external services in tests
GOOGLE_CLIENT_ID=mock_client_id
GOOGLE_CLIENT_SECRET=mock_client_secret

# URLs (Test)
BACKEND_URL=http://localhost:5002
FRONTEND_URL=http://localhost:3001

# File Upload (Test)
MAX_FILE_SIZE=10MB
UPLOAD_PATH=test-uploads/

# Logging (Test)
LOG_LEVEL=warn
LOG_FILE=logs/test.log

# Test Configuration
ENABLE_CORS=true
DEBUG=false
```

## 📋 Environment Variable Reference

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development`, `production`, `test` | ✅ |
| `PORT` | Server port | `5001` | ✅ |
| `DB_HOST` | Database host | `localhost` | ✅ |
| `DB_PORT` | Database port | `5432` | ✅ |
| `DB_NAME` | Database name | `kancil_ai` | ✅ |
| `DB_USER` | Database user | `postgres` | ✅ |
| `DB_PASSWORD` | Database password | `your_password` | ✅ |
| `JWT_SECRET` | JWT signing secret | `32_char_minimum_secret` | ✅ |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `JWT_EXPIRES_IN` | JWT expiration | `7d` | `24h`, `30d` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - | `your_google_client_id` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | - | `your_google_secret` |
| `BACKEND_URL` | Backend base URL | `http://localhost:5001` | `https://api.domain.com` |
| `FRONTEND_URL` | Frontend base URL | `http://localhost:3000` | `https://app.domain.com` |
| `MAX_FILE_SIZE` | File upload limit | `100MB` | `50MB`, `500MB` |
| `UPLOAD_PATH` | Upload directory | `uploads/` | `/var/www/uploads/` |
| `LOG_LEVEL` | Logging level | `info` | `debug`, `warn`, `error` |
| `LOG_FILE` | Log file path | `logs/app.log` | `/var/log/app.log` |
| `SMTP_HOST` | Email server host | - | `smtp.gmail.com` |
| `SMTP_PORT` | Email server port | `587` | `465`, `25` |
| `SMTP_USER` | Email username | - | `your_email@gmail.com` |
| `SMTP_PASS` | Email password | - | `your_app_password` |
| `RATE_LIMIT_WINDOW` | Rate limit window (minutes) | `15` | `5`, `30` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | `50`, `200` |
| `DEBUG` | Enable debug mode | `false` | `true`, `false` |
| `ENABLE_CORS` | Enable CORS | `true` | `true`, `false` |
| `TRUSTED_ORIGINS` | Trusted CORS origins | `*` | `https://domain.com` |

## 🔐 Security Configuration

### JWT Configuration
```env
# Generate strong JWT secret (32+ characters)
JWT_SECRET=your_super_secure_jwt_secret_32_chars_minimum

# Set appropriate expiration
JWT_EXPIRES_IN=7d  # 7 days for production
JWT_EXPIRES_IN=1h  # 1 hour for testing
```

### Google OAuth Setup
```env
# Get credentials from Google Cloud Console
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_secret_here

# Configure redirect URIs in Google Console:
# Development: http://localhost:5001/api/auth/google/callback
# Production: https://api.yourdomain.com/api/auth/google/callback
```

### Database Security
```env
# Use strong passwords
DB_PASSWORD=complex_password_with_numbers_123_symbols_!@#

# Limit database user permissions
# CREATE USER kancil_user WITH ENCRYPTED PASSWORD 'secure_password';
# GRANT CONNECT ON DATABASE kancil_ai TO kancil_user;
# GRANT USAGE ON SCHEMA public TO kancil_user;
# GRANT CREATE ON SCHEMA public TO kancil_user;
```

## 🌍 Environment-Specific Settings

### Development Settings
```env
# Enable debugging
DEBUG=true
LOG_LEVEL=debug

# Relaxed CORS for development
ENABLE_CORS=true

# Local file storage
UPLOAD_PATH=uploads/

# Mock external services
SMTP_HOST=localhost
```

### Production Settings
```env
# Disable debugging
DEBUG=false
LOG_LEVEL=error

# Strict CORS
ENABLE_CORS=false
TRUSTED_ORIGINS=https://yourdomain.com

# Secure file storage
UPLOAD_PATH=/var/www/secure-uploads/

# Real email service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Testing Settings
```env
# Fast tests
JWT_EXPIRES_IN=1h

# Isolated test database
DB_NAME=kancil_ai_test

# Mock services
GOOGLE_CLIENT_ID=mock_id
GOOGLE_CLIENT_SECRET=mock_secret

# Temporary uploads
UPLOAD_PATH=test-uploads/
```

## 🚀 Configuration Loading

### Environment Loading Order
1. `.env.${NODE_ENV}.local` (highest priority)
2. `.env.local`
3. `.env.${NODE_ENV}`
4. `.env` (lowest priority)

### Configuration Validation
```javascript
// config/validation.js
const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(5001),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  MAX_FILE_SIZE: Joi.string().default('100MB'),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info')
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = envVars;
```

## 🔧 Dynamic Configuration

### Database Configuration
```javascript
// config/database.js
module.exports = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'kancil_ai',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres',
    logging: false,
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    }
  }
};
```

### File Upload Configuration
```javascript
// config/upload.js
const path = require('path');

module.exports = {
  uploadPath: process.env.UPLOAD_PATH || 'uploads/',
  maxFileSize: process.env.MAX_FILE_SIZE || '100MB',
  allowedTypes: {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    videos: ['.mp4', '.avi', '.mov', '.wmv', '.webm'],
    documents: ['.pdf', '.doc', '.docx', '.ppt', '.pptx']
  },
  storage: process.env.NODE_ENV === 'production' ? 'cloud' : 'local'
};
```

## 🚨 Common Configuration Issues

### JWT Secret Too Short
```bash
# Error: JWT secret must be at least 32 characters
# Solution: Generate a proper secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Connection Failed
```bash
# Error: password authentication failed
# Solution: Check password format and user permissions
# Make sure password is in quotes: DB_PASSWORD="your_password"
```

### Google OAuth Not Working
```bash
# Error: invalid_client
# Solution: Check client ID and secret
# Verify redirect URI in Google Console matches your backend URL
```

### File Upload Issues
```bash
# Error: ENOENT: no such file or directory
# Solution: Create upload directory
mkdir -p uploads/{images,videos,documents}
```

## 📋 Environment Checklist

### Development Setup:
- [ ] `.env` file created and configured
- [ ] Database connection working
- [ ] JWT secret set (32+ characters)
- [ ] Upload directory exists
- [ ] Google OAuth configured (optional)
- [ ] All required variables set

### Production Deployment:
- [ ] `.env.production` file secured
- [ ] Environment variables in deployment platform
- [ ] Database connection secured with SSL
- [ ] JWT secret stored securely
- [ ] File upload path configured
- [ ] CORS configured for production domain
- [ ] Email service configured
- [ ] Logging configured

### Security Review:
- [ ] No secrets in version control
- [ ] Strong passwords used
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SSL/TLS certificates installed
- [ ] Environment variable validation working

## 🔗 Related Documentation

- [Installation Guide](./installation.md) - Complete setup process
- [Troubleshooting](./troubleshooting.md) - Common issues
- [Database Setup](./database-setup.md) - Database configuration
- [Production Deployment](../deployment/production.md) - Production environment