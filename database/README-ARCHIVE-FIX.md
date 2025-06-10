# 🔧 Fix Archive/Unarchive Endpoints Error

## ❌ **Error yang Terjadi:**
```json
{
    "error": "column \"archived_at\" does not exist"
}
```

## 🎯 **Penyebab Masalah:**
- Kolom `archived_at` belum ada di table `courses`
- Model Course sudah mendefinisikan kolom ini, tapi database belum diupdate
- Migration tidak menambahkan kolom `archived_at` secara otomatis

## ✅ **Solusi Quick Fix:**

### **Step 1: Jalankan SQL Script**
1. Buka **pgAdmin 4**
2. Connect ke database `kancil`
3. Klik kanan database → **Query Tool**
4. Copy-paste isi file `database/fix-archived-column.sql`
5. Klik **Execute/Run (F5)**

### **Step 2: Restart Server**
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### **Step 3: Test Archive/Unarchive**
Test di Postman:
- `PATCH /courses/:id/archive`
- `PATCH /courses/:id/unarchive`

---

## 📋 **SQL Commands (Manual):**

Jika ingin menjalankan manual, eksekusi query ini di pgAdmin:

```sql
-- Add archived_at column
ALTER TABLE courses 
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add published_at column (jika belum ada)
ALTER TABLE courses 
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update existing published courses
UPDATE courses 
SET published_at = created_at 
WHERE status = 'published' AND published_at IS NULL;

-- Verify structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;
```

---

## 🧪 **Testing Archive/Unarchive:**

### **Archive Course:**
```bash
PATCH {{baseUrl}}/courses/{{course_id}}/archive
Authorization: Bearer {{teacher_token}}
```

**Expected Response:**
```json
{
  "message": "Course archived successfully",
  "course": {
    "id": 1,
    "status": "archived",
    "archived_at": "2024-05-21T10:30:00.000Z"
  }
}
```

### **Unarchive Course:**
```bash
PATCH {{baseUrl}}/courses/{{course_id}}/unarchive
Authorization: Bearer {{teacher_token}}
```

**Expected Response:**
```json
{
  "message": "Course unarchived successfully", 
  "course": {
    "id": 1,
    "status": "draft",
    "archived_at": null
  }
}
```

---

## 🔄 **Course Status Flow:**

```
draft → publish → published
  ↓       ↓         ↓
archive → archive → archive
  ↓       ↓         ↓  
archived → archived → archived
  ↓
unarchive (kembali ke draft)
```

---

## 🎯 **Business Rules:**

### **Archive:**
- ✅ Only teacher who owns the course can archive
- ✅ Can archive courses with any status (draft, published)
- ✅ Sets `status = 'archived'` and `archived_at = NOW()`

### **Unarchive:**
- ✅ Only teacher who owns the course can unarchive
- ✅ Can only unarchive courses with `status = 'archived'`
- ✅ Sets `status = 'draft'` and `archived_at = NULL`
- ✅ Course needs to be published again after unarchive

---

## 📡 **Updated Postman Collection:**

Endpoint baru yang ditambahkan:
- `PATCH /courses/:id/archive` - Archive course
- `PATCH /courses/:id/unarchive` - Unarchive course

Import ulang collection atau tambahkan manual di Postman.

---

## ✅ **Expected Results After Fix:**

1. **Archive endpoint works** ✅
2. **Unarchive endpoint works** ✅  
3. **Database has archived_at column** ✅
4. **Course status transitions correctly** ✅
5. **Postman collection updated** ✅

**Setelah menjalankan fix ini, semua archive/unarchive functionality akan berfungsi normal! 🎉**