# Teacher Dashboard Analytics - Implementation Guide

## 🎯 **Fitur Baru yang Ditambahkan**

### **1. Dashboard Teacher Analytics**
Endpoint untuk statistik umum dashboard guru:

#### **A. Siswa Terdaftar (Unique Students)**
- **Endpoint**: `GET /analytics/teacher/registered-students`
- **Fungsi**: Menghitung jumlah unique siswa yang join ke semua course milik guru
- **Response**:
```json
{
  "registered_students_count": 42,
  "courses_count": 3
}
```

#### **B. Kuis Terselesaikan**
- **Endpoint**: `GET /analytics/teacher/completed-quizzes`  
- **Fungsi**: Menghitung jumlah quiz subcourse dengan status completed
- **Response**:
```json
{
  "completed_quizzes_count": 87,
  "total_quiz_subcourses": 15
}
```

#### **C. Rerata Nilai Kuis**
- **Endpoint**: `GET /analytics/teacher/average-quiz-score`
- **Fungsi**: Rata-rata skor dari semua quiz completed di semua course guru
- **Response**:
```json
{
  "average_quiz_score": 68,
  "total_completed_quizzes": 127
}
```

#### **D. Siswa yang Bergabung Hari Ini**
- **Endpoint**: `GET /analytics/teacher/students-joined-today`
- **Fungsi**: Melihat siswa yang join ke course guru hari ini
- **Response**:
```json
{
  "message": "Students who joined today retrieved successfully",
  "date": "2024-01-15",
  "students_joined_today": [
    {
      "enrollment_id": 123,
      "student": {
        "id": "student-uuid",
        "nama_lengkap": "Siswa Baru",
        "email": "siswa@example.com",
        "kelas": 5,
        "nama_sekolah": "SD Contoh",
        "foto_profil_url": "https://example.com/photo.jpg"
      },
      "course": {
        "id": 1,
        "title": "Matematika Dasar",
        "subject": "Matematika",
        "kelas": 5,
        "course_code": "MATH01"
      },
      "joined_at": "2024-01-15T14:30:00.000Z",
      "time_ago": "2 jam yang lalu"
    }
  ],
  "total_joined_today": 5,
  "courses_summary": [
    {
      "course_id": 1,
      "course_title": "Matematika Dasar",
      "course_code": "MATH01",
      "subject": "Matematika",
      "kelas": 5,
      "new_students_today": 3,
      "students": [...]
    }
  ],
  "teacher_courses_count": 2
}
```

#### **E. Siswa Aktif Hari Ini**
- **Endpoint**: `GET /analytics/teacher/students-active-today`
- **Fungsi**: Melihat siswa yang aktif belajar di course guru hari ini
- **Response**:
```json
{
  "message": "Active students today retrieved successfully",
  "date": "2024-01-15",
  "active_students_today": [
    {
      "student": {
        "id": "student-uuid",
        "nama_lengkap": "Siswa Aktif",
        "email": "siswa@example.com",
        "kelas": 5,
        "nama_sekolah": "SD Contoh"
      },
      "courses_active": [
        {
          "course_id": 1,
          "course_title": "Matematika Dasar",
          "course_code": "MATH01",
          "subject": "Matematika"
        }
      ],
      "total_activities": 5,
      "last_activity": "2024-01-15T16:45:00.000Z",
      "time_ago": "15 menit yang lalu"
    }
  ],
  "total_active_today": 8,
  "total_activities": 25
}
```

---

### **2. Topik Aktif (Course Management)**

#### **A. Get All Courses Analytics**
- **Endpoint**: `GET /analytics/teacher/courses-analytics`
- **Fungsi**: Mendapatkan analytics untuk semua course milik guru
- **Response**:
```json
{
  "courses": [
    {
      "course_id": 1,
      "title": "Matematika: Bilangan Pecahan",
      "subject": "Matematika", 
      "status": "published",
      "total_students": 28,
      "average_completion": 75,
      "upcoming_deadline": "2024-06-15T00:00:00.000Z",
      "total_subcourses": 12
    }
  ]
}
```

#### **B. Get Students in Specific Course**
- **Endpoint**: `GET /analytics/teacher/course/:courseId/students`
- **Fungsi**: Daftar siswa dalam course tertentu dengan progress dan nilai
- **Response**:
```json
{
  "course": {
    "id": 1,
    "title": "Matematika: Bilangan Pecahan",
    "subject": "Matematika"
  },
  "students": [
    {
      "student_id": "uuid",
      "nama_lengkap": "Citra Dewi",
      "kelas": 4,
      "progress_percentage": 92,
      "completed_subcourses": 11,
      "total_subcourses": 12,
      "average_quiz_score": 88,
      "last_active": "2024-05-20T10:30:00.000Z"
    }
  ]
}
```

---

### **3. Laporan Analitik Aktivitas Siswa**

#### **A. Activity Analytics Report**
- **Endpoint**: `GET /analytics/teacher/activity-report`
- **Fungsi**: Laporan lengkap aktivitas siswa dengan data attention dan distraksi
- **Response**:
```json
{
  "summary": {
    "most_boring_material": "Pengenalan Pecahan",
    "most_distracted_student": "Budi Santoso", 
    "overall_attention_rate": 79
  },
  "materials": [
    {
      "course_title": "Matematika: Bilangan Pecahan",
      "total_distracted": 8,
      "total_yawn": 5,
      "total_closed_eyes": 2,
      "total_students": 28,
      "average_attention": 78,
      "subcourses": [...]
    }
  ],
  "detailed_subcourses": [...],
  "student_distractions": [...]
}
```

---

## 🔧 **Implementasi Backend**

### **File yang Dimodifikasi/Ditambah:**

1. **`routes/analytics.js`**
   - ✅ Endpoint dashboard analytics guru
   - ✅ Endpoint course analytics dan student list
   - ✅ Endpoint laporan aktivitas siswa

2. **`models/index.js`**
   - ✅ Associations yang diperlukan untuk analytics

3. **`postman/Kancil_AI_Complete_Fixed_Collection.json`**
   - ✅ Endpoint testing untuk semua fitur baru

---

## 🎮 **Testing dengan Postman**

### **Teacher Dashboard Analytics Group:**
1. **Get Registered Students (Unique)** - Siswa terdaftar
2. **Get Completed Quizzes Count** - Kuis terselesaikan  
3. **Get Average Quiz Score** - Rerata nilai kuis

### **Teacher Course Management Group:**
1. **Get All Courses Analytics** - Topik aktif dengan analytics
2. **Get Students List for Specific Course** - Daftar siswa per course
3. **Get Activity Analytics Report** - Laporan analitik aktivitas

---

## 📊 **Data yang Dihitung:**

### **Dashboard Cards:**
- **Siswa Terdaftar**: Count unique students dari semua course guru
- **Kuis Terselesaikan**: Count quiz subcourse dengan status completed
- **Rerata Nilai Kuis**: Average score dari semua quiz completed

### **Topik Aktif:**
- **Rata-rata Penyelesaian**: % completion rata-rata semua siswa dalam course
- **Siswa Aktif**: Jumlah siswa yang enrolled dalam course
- **Status**: published/draft/archived
- **Tenggat**: Dari course end_date

### **Daftar Siswa:**
- **Progress %**: Completion percentage siswa dalam course tertentu
- **Rerata Nilai**: Average quiz score siswa dalam course tersebut
- **Terakhir Aktif**: Dari user updated_at

---

## ⚡ **Ready to Use!**

Semua endpoint sudah siap untuk digunakan dengan authentication teacher dan akan mengembalikan data sesuai dengan gambar dashboard yang diminta.

### **4. Sistem Pengumuman (Announcements)**

#### **A. Create Announcement**
- **Endpoint**: `POST /announcements`
- **Fungsi**: Guru buat pengumuman dengan lampiran (PDF/foto/link)
- **Request**:
```javascript
// With file attachment
FormData:
- title: "Kuis Matematika Besok!"
- content: "Jangan lupa, besok ada kuis..."
- course_id: 1 (optional, null = global announcement)
- priority: "high" | "medium" | "low"
- expires_at: "2024-01-20T23:59:59.000Z" (optional)
- attachment: [File Upload]

// With link attachment
JSON:
{
  "title": "Link Materi Tambahan",
  "content": "Silakan kunjungi link berikut...",
  "course_id": 1,
  "priority": "medium",
  "attachment_url": "https://example.com/materi"
}
```

- **Response**:
```json
{
  "message": "Announcement created successfully",
  "announcement": {
    "id": 1,
    "teacher_id": "teacher-uuid",
    "course_id": 1,
    "title": "Kuis Matematika Besok!",
    "content": "Jangan lupa, besok ada kuis...",
    "priority": "high",
    "is_active": true,
    "attachment_type": "pdf",
    "attachment_url": "/uploads/announcements/file.pdf",
    "attachment_filename": "quiz-guide.pdf",
    "announcement_date": "2024-01-15T10:00:00.000Z",
    "expires_at": "2024-01-20T23:59:59.000Z",
    "teacher": {
      "nama_lengkap": "Pak Budi"
    },
    "course": {
      "title": "Matematika Dasar",
      "course_code": "MATH01"
    }
  }
}
```

#### **B. Get All Announcements**
- **Endpoint**: `GET /announcements`
- **Fungsi**: List pengumuman dengan filter dan pagination
- **Query Params**:
  - `course_id`: Filter by course
  - `priority`: Filter by priority level
  - `is_active`: Filter by active status
  - `page`, `limit`: Pagination
- **Response**:
```json
{
  "announcements": [
    {
      "id": 1,
      "title": "Kuis Matematika Besok!",
      "content": "Jangan lupa, besok ada kuis...",
      "priority": "high",
      "is_active": true,
      "attachment_type": "pdf",
      "attachment_url": "/uploads/announcements/file.pdf",
      "announcement_date": "2024-01-15T10:00:00.000Z",
      "teacher": {
        "nama_lengkap": "Pak Budi"
      },
      "course": {
        "title": "Matematika Dasar"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### **C. Update Announcement**
- **Endpoint**: `PUT /announcements/:id`
- **Fungsi**: Edit pengumuman, ganti lampiran, atau hapus lampiran
- **Features**:
  - Update text content
  - Replace file attachment
  - Change to link attachment
  - Remove attachment (`remove_attachment: "true"`)
  - Update priority/expiry

#### **D. Delete Announcement**
- **Endpoint**: `DELETE /announcements/:id`
- **Fungsi**: Hapus pengumuman dan file lampiran
- **Security**: Only announcement owner can delete

#### **E. Toggle Active Status**
- **Endpoint**: `PATCH /announcements/:id/toggle-active`
- **Fungsi**: Aktifkan/nonaktifkan pengumuman tanpa menghapus
- **Response**:
```json
{
  "message": "Announcement activated successfully",
  "announcement": {
    "id": 1,
    "is_active": true
  }
}
```

#### **F. Course Announcements**
- **Endpoint**: `GET /announcements/course/:courseId`
- **Fungsi**: Pengumuman khusus untuk halaman course
- **Features**:
  - Limited results (recent announcements)
  - Only active announcements
  - Auto-filter expired announcements

### **5. Fitur Lampiran Pengumuman**

#### **A. Supported Attachment Types**
1. **File Upload** (`pdf`, `image`):
   - PDF documents (max 10MB)
   - Images: JPEG, PNG, GIF, WebP (max 10MB)
   - Auto file type detection
   - Unique filename generation
   - Secure file storage

2. **Link Attachment** (`link`):
   - External URLs
   - Google Classroom links
   - YouTube videos
   - Online resources

#### **B. File Management**
- **Upload Directory**: `/uploads/announcements/`
- **Filename Format**: `announcement-{timestamp}-{random}.{ext}`
- **Security**: File type validation, size limits
- **Auto Cleanup**: Files deleted when announcement is deleted

#### **C. Permission System**
- **Teachers**: Can create, update, delete own announcements
- **Students**: Can view announcements for enrolled courses + global announcements
- **Course Filter**: Students only see relevant announcements
- **Expiry Filter**: Auto-hide expired announcements

---

**Import collection Postman dan test dengan login sebagai teacher!** 🎉