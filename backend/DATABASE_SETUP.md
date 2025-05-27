# Setup Database Kancil AI dari Awal

Panduan lengkap untuk membuat database Kancil AI dari nol.

## 🚀 Pilihan 1: Otomatis menggunakan Script Node.js

**1. Pastikan PostgreSQL berjalan**
```bash
# Cek status PostgreSQL (Windows)
pg_ctl status

# Atau start PostgreSQL service
net start postgresql-x64-13
```

**2. Hapus database lama (jika ada)**
```sql
-- Buka psql sebagai superuser
psql -U postgres

-- Hapus database lama
DROP DATABASE IF EXISTS kancil_ai_db;
\q
```

**3. Jalankan setup otomatis**
```bash
cd "C:\Kancil AI Web\backend"
npm run setup-fresh
```

Script ini akan:
- ✅ Hapus database lama jika ada
- ✅ Buat database baru `kancil_ai_db`
- ✅ Buat semua tabel dengan struktur yang benar
- ✅ Verifikasi kolom `kelas` ada di tabel `courses`
- ✅ Tampilkan struktur tabel yang dibuat

**4. Setelah setup berhasil, isi sample data**
```bash
npm run seed
```

**5. Start development server**
```bash
npm run dev
```

## 🛠 Pilihan 2: Manual menggunakan SQL

**1. Buka PostgreSQL Command Line**
```bash
psql -U postgres
```

**2. Jalankan script SQL**
```sql
\i 'C:/Kancil AI Web/backend/database/create_database.sql'
```

**3. Keluar dari psql dan setup Node.js**
```sql
\q
```

```bash
cd "C:\Kancil AI Web\backend"
npm run seed
npm run dev
```

## 🔧 Troubleshooting

### Error: Database tidak bisa dihapus
```bash
# Matikan semua koneksi ke database
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'kancil_ai_db';"

# Lalu hapus database
psql -U postgres -c "DROP DATABASE kancil_ai_db;"
```

### Error: Permission denied
- Pastikan user PostgreSQL memiliki privilege CREATE DATABASE
- Jalankan sebagai superuser (postgres)

### Error: Connection refused
```bash
# Start PostgreSQL service (Windows)
net start postgresql-x64-13

# Atau (Linux/Mac)
sudo systemctl start postgresql
```

### Error: .env file
Pastikan file `.env` memiliki konfigurasi yang benar:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kancil_ai_db
DB_USER=postgres
DB_PASSWORD=your_password
```

## 📋 Verifikasi Setup

Setelah setup berhasil, cek dengan:
```bash
npm run check-db
```

Output yang diharapkan:
```
✅ Connected to database

📋 Existing tables:
  - chatbot_interactions
  - courses
  - student_enrollments
  - student_sub_course_progress
  - sub_courses
  - users

📊 Courses table structure:
  - id: integer (not null)
  - title: character varying (not null)
  - subject: USER-DEFINED (not null)
  - kelas: integer (not null)  ← Pastikan ini ada!
  - teacher_id: uuid (not null)
  - course_code: character varying (not null)
  - status: USER-DEFINED (not null)
  - cover_image_url: character varying (nullable)
  - start_date: date (nullable)
  - end_date: date (nullable)
  - published_at: timestamp without time zone (nullable)
  - created_at: timestamp without time zone (not null)
  - updated_at: timestamp without time zone (not null)
```

## 🎯 Sample Data

Setelah database setup, jalankan:
```bash
npm run seed
```

Ini akan membuat:
- 1 Teacher: `teacher@kancil.com` / `teacher123`
- 3 Students: `student1-3@kancil.com` / `student123`
- 2 Sample Courses: MATH01, IPA01
- Sample SubCourses dan materi

## 🚀 Start Development

```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## 📖 API Testing

Test endpoints:
- `GET http://localhost:5000/api/auth/me` - Test auth
- `POST http://localhost:5000/api/auth/login` - Login
- `GET http://localhost:5000/api/courses` - List courses

---
**Kancil AI Backend Database Setup** ✨