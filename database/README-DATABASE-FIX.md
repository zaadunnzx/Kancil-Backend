# 🔧 Database Fix Scripts - Panduan Eksekusi

## 📋 **Daftar Masalah yang Diperbaiki:**

### **1. Error: `record "new" has no field "updated_at"`**
- ✅ Menambahkan kolom `created_at` dan `updated_at` ke table `student_sub_course_progress`
- ✅ Membuat trigger auto-update untuk timestamps
- ✅ Mengupdate data existing dengan timestamp default

### **2. Error: `SubCourse is associated to Course using an alias`**
- ✅ Memperbaiki foreign key relationships
- ✅ Memastikan konsistensi nama kolom dan constraints
- ✅ Menambahkan missing associations

---

## 🚀 **Cara Menjalankan Script:**

### **Step 1: Jalankan Database Structure Fix**
1. Buka **pgAdmin 4**
2. Connect ke database `kancil` 
3. Klik kanan pada database → **Query Tool**
4. Copy-paste isi file `fix-database-structure.sql`
5. Klik **Execute/Run** (F5)

### **Step 2: Jalankan Associations Fix**
1. Masih di Query Tool yang sama
2. Copy-paste isi file `fix-associations.sql`  
3. Klik **Execute/Run** (F5)

### **Step 3: Verifikasi**
Jalankan query verifikasi ini:
```sql
-- Cek struktur table
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('student_sub_course_progress', 'courses', 'subcourses')
ORDER BY table_name, ordinal_position;

-- Cek foreign keys
SELECT tc.table_name, tc.constraint_name, kcu.column_name 
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

## 📂 **File Scripts:**

### **1. `fix-database-structure.sql`**
- Memperbaiki missing timestamps
- Menambahkan trigger auto-update  
- Mengisi data NULL dengan timestamp default
- Verifikasi struktur table

### **2. `fix-associations.sql`**
- Memperbaiki foreign key relationships
- Menambahkan missing columns
- Memastikan consistency associations
- Final verification

---

## ✅ **Expected Results Setelah Fix:**

### **Table `student_sub_course_progress` akan memiliki:**
```sql
id                    | integer              | not null
sub_course_id         | integer              | nullable  
enrollment_student_id | uuid                 | nullable
status               | character varying(50) | nullable (default: 'in_progress')
score                | integer              | nullable (default: 0)
created_at           | timestamp with time zone | nullable (default: CURRENT_TIMESTAMP)
updated_at           | timestamp with time zone | nullable (default: CURRENT_TIMESTAMP)
```

### **Foreign Keys yang akan ada:**
- `subcourses.course_id` → `courses.id`
- `student_enrollment.student_id` → `users.id_user`
- `student_enrollment.course_id` → `courses.id`
- `student_sub_course_progress.sub_course_id` → `subcourses.id`
- `student_sub_course_progress.enrollment_student_id` → `users.id_user`

---

## 🔄 **Setelah Menjalankan Script:**

### **1. Restart Backend Server**
```bash
npm run dev
```

### **2. Test API Endpoints:**
- ✅ `GET /courses` - Seharusnya tidak error lagi
- ✅ `PATCH /subcourses/:id/progress` - Seharang tidak error updated_at
- ✅ `GET /analytics/student/progress-percentage` - Ready to use
- ✅ `GET /analytics/teacher/*` - All teacher endpoints

### **3. Test di Postman:**
- Import collection `Kancil_AI_Complete_Fixed_Collection.json`
- Login sebagai teacher/student
- Test semua endpoint tanpa error

---

## ⚠️ **Catatan Penting:**

### **Backup Database (Opsional tapi Disarankan):**
```sql
-- Backup before running scripts
pg_dump -h localhost -U postgres -d kancil > kancil_backup_$(date +%Y%m%d).sql
```

### **Rollback Jika Diperlukan:**
Jika ada masalah, drop dan recreate database:
```sql
DROP DATABASE kancil;
CREATE DATABASE kancil;
-- Kemudian restore dari backup atau run migration ulang
```

---

## 🎯 **Summary:**

**Run 2 script SQL ini di pgAdmin secara berurutan dan semua error akan teratasi!**

1. **`fix-database-structure.sql`** → Fix timestamps dan struktur
2. **`fix-associations.sql`** → Fix foreign keys dan associations

**Total waktu eksekusi: ~30 detik**
**Result: Database siap untuk semua fitur Kancil AI! 🎉**