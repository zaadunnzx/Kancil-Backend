# Quick Fix untuk Database Connection Error

## Error: "client password must be a string"

### 🚨 Solusi Cepat:

1. **Buka file `config/database.js`**
2. **Pastikan password dalam tanda kutip:**

```javascript
// ❌ SALAH
password: yourpassword,
password: 123456,

// ✅ BENAR  
password: "yourpassword",
password: "123456",
```

3. **Test koneksi:**
```bash
node debug-db.js
```

4. **Jika masih error, gunakan setup manual:**
   - Buka file `MANUAL_SETUP.sql`
   - Copy semua SQL ke PostgreSQL client (pgAdmin/DBeaver)
   - Jalankan SQL commands

### 🔧 Commands:

```bash
# Debug database connection
npm run debug-db

# Auto setup (jika koneksi OK)
npm run setup

# Manual setup: gunakan MANUAL_SETUP.sql
```

### ✅ Verification:

Setelah setup berhasil, test endpoints:
- Comments: `POST /api/comments/subcourse/1`
- Reactions: `POST /api/reactions/subcourse/1` 
- Progress: `PATCH /api/subcourses/1/progress`

### 📞 Need Help?

Jika masih ada masalah:
1. Check PostgreSQL service running
2. Verify database exists
3. Check network connectivity
4. Run debug-db.js untuk detail error