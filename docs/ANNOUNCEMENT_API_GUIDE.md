# API Announcement System - Dokumentasi Lengkap

## 🎯 **Fitur Announcement untuk Guru**

Sistem pengumuman lengkap dengan support lampiran file dan link.

### **📝 Fitur Utama:**
- ✅ **CRUD Operations** - Create, Read, Update, Delete pengumuman
- ✅ **File Attachments** - Upload PDF, gambar, dokumen Office
- ✅ **Link Attachments** - Tambahkan link eksternal
- ✅ **Priority System** - Low, Medium, High, Urgent
- ✅ **Status Management** - Draft, Published, Archived
- ✅ **Course Specific** - Pengumuman untuk course tertentu atau global
- ✅ **Expiration Date** - Pengumuman otomatis expired
- ✅ **Access Control** - Hanya guru yang bisa buat, siswa bisa lihat yang published

---

## 🔌 **API Endpoints**

### **👨‍🏫 Teacher Endpoints:**

#### **1. Create Announcement**
```http
POST /api/announcements
Content-Type: multipart/form-data
Authorization: Bearer <teacher_token>

FormData:
- title: "Ujian Tengah Semester" (required)
- content: "Ujian akan dilaksanakan..." (required)
- course_id: 1 (optional - null untuk global announcement)
- priority: "high" (optional: low|medium|high|urgent, default: medium)
- status: "draft" (optional: draft|published|archived, default: draft)
- announcement_date: "2024-01-20T10:00:00Z" (optional, default: now)
- expires_at: "2024-02-20T10:00:00Z" (optional)
- attachments: [file1.pdf, image1.jpg] (optional, max 5 files, 10MB each)
- links: JSON string of links (optional)
```

**Links Format:**
```json
[
  {
    "url": "https://example.com/schedule",
    "title": "Jadwal Ujian"
  },
  {
    "url": "https://drive.google.com/syllabus",
    "title": "Silabus"
  }
]
```

**Response:**
```json
{
  "message": "Announcement created successfully",
  "announcement": {
    "id": 1,
    "title": "Ujian Tengah Semester",
    "content": "Ujian akan dilaksanakan...",
    "priority": "high",
    "status": "draft",
    "announcement_date": "2024-01-20T10:00:00Z",
    "expires_at": "2024-02-20T10:00:00Z",
    "time_ago": "Baru saja",
    "teacher": {
      "id_user": "uuid",
      "nama_lengkap": "Pak Budi",
      "foto_profil_url": "..."
    },
    "course": {
      "id": 1,
      "title": "Matematika Dasar",
      "course_code": "MATH01"
    },
    "attachments": [
      {
        "id": 1,
        "attachment_type": "file",
        "file_name": "jadwal_ujian.pdf",
        "file_url": "http://localhost:5001/uploads/announcements/...",
        "file_size": 245760,
        "mime_type": "application/pdf"
      },
      {
        "id": 2,
        "attachment_type": "link",
        "link_url": "https://example.com/schedule",
        "link_title": "Jadwal Ujian"
      }
    ]
  }
}
```

#### **2. Get My Announcements (Teacher)**
```http
GET /api/announcements/my-announcements
Authorization: Bearer <teacher_token>

Query Parameters:
- page: 1 (optional)
- limit: 10 (optional) 
- status: "published" (optional: draft|published|archived)
- course_id: 1 (optional)
- priority: "high" (optional)
- search: "ujian" (optional - search in title and content)
```

**Response:**
```json
{
  "message": "Announcements retrieved successfully",
  "data": {
    "announcements": [
      {
        "id": 1,
        "title": "Ujian Tengah Semester",
        "content": "Ujian akan dilaksanakan...",
        "priority": "high",
        "status": "published",
        "time_ago": "2 jam yang lalu",
        "teacher": {...},
        "course": {...},
        "attachments": [...]
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

#### **3. Update Announcement**
```http
PUT /api/announcements/:id
Content-Type: multipart/form-data
Authorization: Bearer <teacher_token>

FormData:
- title: "Updated Title" (optional)
- content: "Updated content" (optional)
- priority: "urgent" (optional)
- status: "published" (optional)
- new_attachments: [new_file.pdf] (optional)
- new_links: JSON string of new links (optional)
- remove_attachment_ids: JSON string of IDs to remove (optional)
```

#### **4. Publish Announcement**
```http
PATCH /api/announcements/:id/publish
Authorization: Bearer <teacher_token>
```

#### **5. Archive Announcement**
```http
PATCH /api/announcements/:id/archive
Authorization: Bearer <teacher_token>
```

#### **6. Delete Announcement**
```http
DELETE /api/announcements/:id
Authorization: Bearer <teacher_token>
```

---

### **👨‍🎓 Student Endpoints:**

#### **1. Get Announcements for Students**
```http
GET /api/announcements/for-students
Authorization: Bearer <student_token>

Query Parameters:
- page: 1 (optional)
- limit: 10 (optional)
- course_id: 1 (optional)
- priority: "high" (optional)
```

**Response:**
```json
{
  "message": "Announcements retrieved successfully", 
  "data": {
    "announcements": [
      {
        "id": 1,
        "title": "Ujian Tengah Semester",
        "content": "Ujian akan dilaksanakan...",
        "priority": "high",
        "status": "published",
        "time_ago": "2 jam yang lalu",
        "teacher": {
          "nama_lengkap": "Pak Budi"
        },
        "course": {
          "title": "Matematika Dasar"
        },
        "attachments": [...]
      }
    ],
    "pagination": {...}
  }
}
```

#### **2. Get Single Announcement**
```http
GET /api/announcements/:id
Authorization: Bearer <token>
```

---

## 🗄️ **Database Schema**

### **Announcements Table:**
```sql
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES users(id_user),
  course_id INTEGER REFERENCES courses(id), -- NULL = global announcement
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  announcement_date TIMESTAMP NOT NULL DEFAULT NOW(),
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Announcement Attachments Table:**
```sql
CREATE TABLE announcement_attachments (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id),
  attachment_type ENUM('file', 'link') NOT NULL,
  file_name VARCHAR(255), -- For files
  file_path VARCHAR(500), -- Server path
  file_url VARCHAR(500),  -- Public URL
  link_url VARCHAR(500),  -- For external links
  link_title VARCHAR(255), -- Display title for links
  file_size INTEGER,      -- In bytes
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 **Business Logic**

### **Access Control:**
- **Teachers**: Hanya bisa melihat dan mengelola announcement mereka sendiri
- **Students**: Hanya bisa melihat announcement published dari course yang mereka ikuti
- **Global Announcements**: course_id = NULL, visible untuk semua student guru tersebut

### **Priority System:**
- **Urgent**: Ditampilkan paling atas, warna merah
- **High**: Prioritas tinggi, warna orange  
- **Medium**: Prioritas normal, warna biru
- **Low**: Prioritas rendah, warna abu-abu

### **Status Flow:**
```
draft → published → archived
  ↑         ↓
  └─────────┘ (can revert to draft)
```

### **File Support:**
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
- **Text**: TXT
- **Max Size**: 10MB per file
- **Max Files**: 5 files per announcement

---

## 🎮 **Testing Examples**

### **Create Announcement with Files & Links:**
```bash
curl -X POST http://localhost:5001/api/announcements \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Ujian Tengah Semester" \
  -F "content=Ujian akan dilaksanakan pada tanggal 25 Januari 2024" \
  -F "course_id=1" \
  -F "priority=high" \
  -F "status=published" \
  -F "attachments=@jadwal_ujian.pdf" \
  -F "attachments=@contoh_soal.jpg" \
  -F 'links=[{"url":"https://meet.google.com/abc-defg-hij","title":"Link Google Meet"}]'
```

### **Get Student Announcements:**
```bash
curl -X GET "http://localhost:5001/api/announcements/for-students?page=1&limit=5" \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

---

## 🔧 **Implementation Notes**

### **File Upload Handling:**
- Files disimpan di `uploads/announcements/`
- Filename format: `announcement-{timestamp}-{random}.ext`
- Auto cleanup jika create/update gagal
- Physical file deletion saat hapus attachment

### **Link Validation:**
- URL harus format HTTP/HTTPS
- Title optional tapi recommended
- Support deep linking ke Google Drive, YouTube, dll

### **Performance Optimizations:**
- Database indexes pada teacher_id, course_id, status
- Pagination untuk list endpoints
- Eager loading untuk related data

### **Error Handling:**
- File size validation
- File type restrictions  
- Access permission checks
- Graceful file cleanup on errors

---

## ✅ **Ready to Use!**

API Announcement sudah lengkap dengan:
- ✅ **Full CRUD operations**
- ✅ **File & link attachments**  
- ✅ **Access control & permissions**
- ✅ **Priority & status management**
- ✅ **Expiration handling**
- ✅ **Student & teacher specific endpoints**

**Import Postman collection dan test semua fitur announcement! 🎉**