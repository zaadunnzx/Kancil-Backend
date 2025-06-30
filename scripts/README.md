# Scripts Directory

Organized scripts for Kancil AI Backend development and maintenance.

## 📁 Directory Structure

```
scripts/
├── README.md                      # This file - documentation
├── database/                      # Database-related scripts
│   ├── setup.js                   # Fresh database setup
│   ├── migrate.js                 # Database migrations
│   ├── reset.js                   # Reset database
│   ├── check.js                   # Database health check
│   └── seed/                      # Data seeding scripts
│       ├── index.js               # Main seeding script
│       ├── users.js               # User data seeding
│       ├── courses.js             # Course data seeding
│       ├── analytics.js           # Analytics data seeding
│       └── quiz.js                # Quiz questions seeding
├── testing/                       # Testing scripts
│   ├── test-api.js                # Cross-platform API testing
│   ├── test-associations.js       # Database associations testing
│   └── generate-test-data.js      # Generate test data
├── development/                   # Development utilities
│   ├── create-upload-dirs.js      # Create upload directories
│   ├── reset-data.js              # Reset development data
│   └── create-admin.js            # Create admin user
└── deployment/                    # Deployment scripts
    ├── pre-deploy.js              # Pre-deployment checks
    ├── post-deploy.js             # Post-deployment setup
    └── health-check.js            # Production health check
```

## 🚀 Quick Commands

### Database Operations
```bash
# Fresh setup
node scripts/database/setup.js

# Migrate database
node scripts/database/migrate.js

# Reset database
node scripts/database/reset.js

# Seed all data
node scripts/database/seed/index.js

# Seed specific data
node scripts/database/seed/users.js
node scripts/database/seed/courses.js
node scripts/database/seed/analytics.js
node scripts/database/seed/quiz.js
```

### Testing
```bash
# Test API endpoints
node scripts/testing/test-api.js

# Test database associations
node scripts/testing/test-associations.js

# Generate test data
node scripts/testing/generate-test-data.js
```

### Development
```bash
# Create upload directories
node scripts/development/create-upload-dirs.js

# Reset development data
node scripts/development/reset-data.js

# Create admin user
node scripts/development/create-admin.js
```

### Deployment
```bash
# Pre-deployment checks
node scripts/deployment/pre-deploy.js

# Post-deployment setup
node scripts/deployment/post-deploy.js

# Health check
node scripts/deployment/health-check.js
```

## 📋 Script Descriptions

### Database Scripts
- **setup.js**: Complete fresh database setup from scratch
- **migrate.js**: Run database migrations and schema updates
- **reset.js**: Reset database to clean state
- **check.js**: Verify database connection and structure
- **seed/**: Data seeding scripts for different entities

### Testing Scripts
- **test-api.js**: Cross-platform API endpoint testing
- **test-associations.js**: Database relationship testing
- **generate-test-data.js**: Create realistic test data

### Development Scripts
- **create-upload-dirs.js**: Create necessary upload directories
- **reset-data.js**: Reset development data without affecting schema
- **create-admin.js**: Create admin user for development

### Deployment Scripts
- **pre-deploy.js**: Run checks before deployment
- **post-deploy.js**: Setup after deployment
- **health-check.js**: Verify production health

## 🔧 Usage Examples

### Complete Fresh Setup
```bash
# 1. Setup fresh database
node scripts/database/setup.js

# 2. Seed all data
node scripts/database/seed/index.js

# 3. Create upload directories
node scripts/development/create-upload-dirs.js

# 4. Test everything
node scripts/testing/test-api.js
```

### Quick Development Reset
```bash
# Reset data only (keep schema)
node scripts/development/reset-data.js

# Re-seed basic data
node scripts/database/seed/users.js
node scripts/database/seed/courses.js
```

### Production Deployment
```bash
# Pre-deployment checks
node scripts/deployment/pre-deploy.js

# Run migrations
node scripts/database/migrate.js

# Post-deployment setup
node scripts/deployment/post-deploy.js

# Health check
node scripts/deployment/health-check.js
```