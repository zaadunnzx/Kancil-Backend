# Setup Instructions untuk Comments & Reactions + Enhanced Progress

## ⚠️ Database Connection Error Solutions

Jika mengalami error: **"client password must be a string"**, ikuti langkah berikut:

### 1. Debug Koneksi Database
```bash
node debug-db.js
```

### 2. Periksa File `config/database.js`
Pastikan password dalam format string (dengan tanda kutip):

**❌ Salah:**
```javascript
password: yourpassword,  // Tanpa tanda kutip
password: 123456,        // Number
```

**✅ Benar:**
```javascript
password: "yourpassword",  // Dengan tanda kutip
password: "123456",        // String
```

### 3. Alternatif Setup Manual

Jika tetap ada masalah koneksi, gunakan setup manual:

```bash
# Buka PostgreSQL client (psql, pgAdmin, atau DBeaver)
# Jalankan script SQL yang ada di MANUAL_SETUP.sql
```

## Langkah-langkah Setup:

### Option A: Automatic Setup (Jika koneksi DB OK)
```bash
node setup-tables.js
```

### Option B: Manual Setup (Jika ada masalah koneksi)
1. Buka file `MANUAL_SETUP.sql`
2. Copy semua SQL commands
3. Jalankan di PostgreSQL client (psql, pgAdmin, DBeaver, etc.)

### 4. Restart Server
```bash
npm run dev
```

### 5. Test Endpoints
Import collection dari: `postman/Kancil_AI_API_Collection.json`

## Troubleshooting Database Issues:

### Error: "client password must be a string"
```bash
# 1. Check config file
cat config/database.js

# 2. Debug connection
node debug-db.js

# 3. Fix password format in config/database.js
# Make sure: password: "yourpassword"
```

### Error: "database does not exist"
```sql
-- Connect to PostgreSQL as superuser and create database
CREATE DATABASE your_database_name;
```

### Error: "relation does not exist"
```bash
# Run manual setup
# Copy commands from MANUAL_SETUP.sql to your PostgreSQL client
```

### Error: "connection refused"
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # Mac
# Check Windows Services for PostgreSQL
```

## Verification Commands:

### Check if setup succeeded:
```sql
-- Check if new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('comments', 'reactions');

-- Check enhanced progress columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'student_sub_course_progress'
AND column_name IN ('completion_percentage', 'time_spent', 'attempts', 'quiz_answers');
```