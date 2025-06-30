# 📊 Student Analytics - Setup & Testing Guide

## 🚀 Quick Setup

### 1. **Pastikan Database & Table Sudah Ada**
```bash
# Jalankan SQL script untuk create table
# File: database/create-student-analytics.sql
```

### 2. **Seed Data Dasar**
```bash
npm run seed
```

### 3. **Seed Analytics Data**
```bash
node scripts/seed-analytics.js
```

### 4. **Test API**
```bash
# Login sebagai teacher
POST {{baseUrl}}/auth/login
{
  "email": "teacher@kancil.com",
  "password": "teacher123"
}

# Akses laporan analytics
GET {{baseUrl}}/student-analytics/teacher/reports
GET {{baseUrl}}/student-analytics/teacher/reports?month=6&year=2025
```

## 📋 Expected Output

Setelah menjalankan seeding, API akan return data seperti ini:

```json
{
  "summary": {
    "most_boring_material": {
      "subcourse": {
        "title": "Mengenal Angka 1-10",
        "course": {
          "subject": "Matematika"
        }
      },
      "avg_distracted": "8x"
    },
    "most_distracted_student": {
      "student": {
        "nama_lengkap": "Siswa 1"
      },
      "total_distracted": "12x"
    },
    "average_attention": "83%"
  },
  "material_reports": [
    {
      "materi": "Mengenal Angka 1-10",
      "topik": "Matematika",
      "distracted": 8,
      "yawn": 5,
      "tutup_mata": 2,
      "rata_rata_perhatian": "78%",
      "siswa_paling_terdistraksi": "Siswa 1"
    }
  ],
  "student_reports": [
    {
      "nama_siswa": "Siswa 1",
      "total_distracted": 24,
      "materi_paling_terdistraksi": "Mengenal Angka 1-10",
      "rata_rata_perhatian": "77%"
    }
  ]
}
```

## 🔧 API Endpoints

### **Student Endpoints**
```bash
# Submit analytics data (dari FE)
POST /api/student-analytics/session
{
  "sub_course_id": 1,
  "session_id": "unique_session_id",
  "total_duration": 600,
  "analytics_data": [
    {"timestamp": 1, "distracted": false, "yawn": false, "eyes_closed": false},
    {"timestamp": 2, "distracted": true, "yawn": false, "eyes_closed": false}
  ]
}
```

### **Teacher Endpoints**
```bash
# Dashboard laporan utama
GET /api/student-analytics/teacher/reports

# Filter per bulan
GET /api/student-analytics/teacher/reports?month=6&year=2025

# Filter per course
GET /api/student-analytics/teacher/reports?course_id=1

# Detail per siswa
GET /api/student-analytics/teacher/student/{studentId}
```

## 🐛 Troubleshooting

### **Jika data masih kosong:**
1. Pastikan table `student_analytics` sudah dibuat
2. Jalankan seeding: `node scripts/seed-analytics.js`
3. Check login sebagai teacher yang benar
4. Pastikan ada enrollment antara student dan course

### **Error 404 Route not found:**
1. Pastikan server restart setelah update routes
2. Check routes di server.js sudah include student-analytics

### **Error 403 Access denied:**
1. Login sebagai teacher, bukan student
2. Pastikan teacher punya course yang di-query

## 📝 Integration dengan Frontend

Frontend perlu kirim data dengan format:
```javascript
const analyticsData = [];
// Per detik video, record state
for (let second = 1; second <= videoDuration; second++) {
  analyticsData.push({
    timestamp: second,
    distracted: pythonAnalysis.isDistracted(second),
    yawn: pythonAnalysis.hasYawn(second), 
    eyes_closed: pythonAnalysis.eyesClosed(second)
  });
}

// Kirim ke BE
fetch('/api/student-analytics/session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sub_course_id: currentSubCourseId,
    session_id: generateUniqueId(),
    total_duration: videoDuration,
    analytics_data: analyticsData
  })
});
```

## ✅ Success Checklist

- [ ] Table `student_analytics` created
- [ ] Seed scripts berhasil dijalankan  
- [ ] Login teacher berhasil
- [ ] API return data real (bukan mock)
- [ ] Summary metrics calculated correctly
- [ ] Material & student reports populated

Sistem analytics sudah siap untuk production! 🎯