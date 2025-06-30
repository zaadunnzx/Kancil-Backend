# NPM Scripts - Quick Reference

## 🚀 Quick Setup Commands

```bash
# Complete fresh setup (recommended for new environment)
npm run setup-fresh

# Individual setup steps
npm run db:setup          # Setup fresh database
npm run seed              # Seed all data
npm run dev:create-dirs   # Create upload directories
```

## 🗄️ Database Operations

```bash
# Database management
npm run db:setup          # Fresh database setup
npm run db:migrate        # Run migrations (preserve data)
npm run db:reset          # Reset database completely
npm run db:check          # Health check database

# Data seeding
npm run seed              # Seed all data (users + courses + analytics + quiz)
npm run seed:users        # Seed users only
npm run seed:courses      # Seed courses only  
npm run seed:analytics    # Seed analytics data only
npm run seed:quiz         # Seed quiz questions only
```

## 🧪 Testing Commands

```bash
# API testing
npm run test:api          # Test all API endpoints
npm run test:associations # Test database relationships

# Specific API tests
npm run test:api:auth     # Test authentication only
npm run test:api:courses  # Test course management only
```

## 🛠️ Development Utilities

```bash
# Development helpers
npm run dev:create-dirs   # Create upload directories
npm run dev:reset-data    # Reset data (keep schema)

# Production health check
npm run deploy:health     # Check production health
```

## 📋 Common Workflows

### **New Development Environment**
```bash
git clone <repo>
cd Kancil-Backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run setup-fresh
npm run dev
```

### **Reset Development Environment**
```bash
npm run dev:reset-data    # Clear data only
npm run seed              # Re-seed fresh data
```

### **Complete Reset (Nuclear Option)**
```bash
npm run db:reset          # Drop and recreate everything
npm run seed              # Add fresh data
npm run dev:create-dirs   # Recreate directories
```

### **Production Health Check**
```bash
npm run deploy:health     # Check system health
```

### **Testing Workflow**
```bash
npm run test:associations # Test database
npm run test:api          # Test all endpoints
npm run test:api:auth     # Test specific group
```

## 🎯 Script Details

| Script | Purpose | Safe for Production |
|--------|---------|-------------------|
| `db:setup` | Fresh database setup | ❌ (destructive) |
| `db:migrate` | Schema updates only | ✅ (preserves data) |
| `db:reset` | Complete reset | ❌ (destructive) |
| `seed` | Add sample data | ✅ (with caution) |
| `test:api` | API endpoint testing | ✅ (read-only) |
| `deploy:health` | System health check | ✅ (safe) |

## 💡 Tips

- Use `npm run db:migrate` in production instead of `db:setup`
- Always backup before running destructive commands
- Use `test:api` to verify system after deployment
- Run `deploy:health` regularly in production
- Use individual seeders for specific data needs