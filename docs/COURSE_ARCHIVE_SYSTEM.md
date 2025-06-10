# Course Archive System - Implementation Guide

## 🎯 **Fitur Archive Course yang Ditambahkan**

### **1. Archive Course (Teacher Only)**
- **Endpoint**: `PATCH /courses/:id/archive`
- **Fungsi**: Mengarsipkan course agar tidak aktif
- **Authorization**: Teacher only (pemilik course)
- **Status**: Course dengan status `published` atau `draft` dapat diarsipkan

#### **Request:**
```javascript
PATCH /api/courses/{course_id}/archive
Authorization: Bearer {teacher_token}
```

#### **Response Success:**
```json
{
  "message": "Course archived successfully",
  "course": {
    "id": 1,
    "title": "Matematika Dasar",
    "status": "archived",
    "archived_at": "2024-05-21T10:30:00.000Z",
    "teacher_id": "uuid",
    "created_at": "2024-01-15T08:00:00.000Z",
    "updated_at": "2024-05-21T10:30:00.000Z"
  }
}
```

#### **Error Responses:**
```javascript
// Course not found
{
  "error": "Course not found"
}

// Not authorized
{
  "error": "Not authorized to archive this course"
}

// Already archived
{
  "error": "Course is already archived"
}
```

---

### **2. Unarchive Course (Teacher Only)**
- **Endpoint**: `PATCH /courses/:id/unarchive`
- **Fungsi**: Mengembalikan course dari status archived ke draft
- **Authorization**: Teacher only (pemilik course)
- **Status**: Hanya course dengan status `archived` yang dapat di-unarchive

#### **Request:**
```javascript
PATCH /api/courses/{course_id}/unarchive
Authorization: Bearer {teacher_token}
```

#### **Response Success:**
```json
{
  "message": "Course unarchived successfully",
  "course": {
    "id": 1,
    "title": "Matematika Dasar",
    "status": "draft",
    "archived_at": null,
    "teacher_id": "uuid",
    "created_at": "2024-01-15T08:00:00.000Z",
    "updated_at": "2024-05-21T10:35:00.000Z"
  }
}
```

#### **Error Responses:**
```javascript
// Course not found
{
  "error": "Course not found"
}

// Not authorized
{
  "error": "Not authorized to unarchive this course"
}

// Not archived
{
  "error": "Course is not archived"
}
```

---

## 📊 **Course Status Flow**

```
draft → publish → archived
  ↑         ↓         ↓
  └───────────────────┘
     (via unarchive)
```

### **Status Transitions:**
1. **Draft** → **Published**: Via `PATCH /courses/:id/publish`
2. **Published** → **Archived**: Via `PATCH /courses/:id/archive`
3. **Draft** → **Archived**: Via `PATCH /courses/:id/archive`
4. **Archived** → **Draft**: Via `PATCH /courses/:id/unarchive`

### **Business Rules:**
- ✅ **Archive**: `draft` dan `published` course dapat diarsipkan
- ✅ **Unarchive**: `archived` course dikembalikan ke status `draft`
- ❌ **Archive**: `archived` course tidak bisa diarsipkan lagi
- ❌ **Unarchive**: Non-`archived` course tidak bisa di-unarchive

---

## 🔧 **Implementation Details**

### **Backend Route (routes/courses.js):**
```javascript
// Archive course (teacher only)
router.patch('/:id/archive', authenticate, teacherOnly, async (req, res, next) => {
  // ... validation logic ...
  
  await course.update({
    status: 'archived',
    archived_at: new Date()
  });
});

// Unarchive course (teacher only)
router.patch('/:id/unarchive', authenticate, teacherOnly, async (req, res, next) => {
  // ... validation logic ...
  
  await course.update({
    status: 'draft',
    archived_at: null
  });
});
```

### **Database Fields:**
- **status**: ENUM('draft', 'published', 'archived')
- **archived_at**: TIMESTAMP (nullable)

---

## 🎮 **Testing dengan Postman**

### **1. Archive Course:**
```
PATCH {{baseUrl}}/courses/{{course_id}}/archive
Authorization: Bearer {{token}}
```

### **2. Unarchive Course:**
```
PATCH {{baseUrl}}/courses/{{course_id}}/unarchive
Authorization: Bearer {{token}}
```

### **Testing Workflow:**
1. Login sebagai teacher
2. Create course (status: draft)
3. Publish course (status: published) 
4. Archive course (status: archived)
5. Unarchive course (status: draft)

---

## 🔍 **Integration dengan API Lain**

### **Get All Courses (dengan filter status):**
```javascript
GET /api/courses?status=archived
GET /api/courses?status=published
GET /api/courses?status=draft
```

### **Course Visibility untuk Student:**
- Students **TIDAK** dapat melihat `archived` courses
- Students hanya dapat melihat `published` courses
- Teachers dapat melihat semua course milik mereka (semua status)

### **Analytics Impact:**
- Archived courses **TIDAK** dihitung dalam analytics aktif
- Archived courses dapat ditampilkan di section "Course History"
- Progress dari archived courses tetap tersimpan

---

## 🚀 **Frontend Implementation**

### **JavaScript Functions:**
```javascript
// Archive course
const archiveCourse = async (courseId) => {
  const response = await apiClient.patch(`/courses/${courseId}/archive`);
  return response.data.course;
};

// Unarchive course
const unarchiveCourse = async (courseId) => {
  const response = await apiClient.patch(`/courses/${courseId}/unarchive`);
  return response.data.course;
};
```

### **UI Components:**
```javascript
const CourseActions = ({ course }) => {
  const handleArchive = async () => {
    try {
      await archiveCourse(course.id);
      toast.success('Course archived successfully');
      refreshCourseList();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUnarchive = async () => {
    try {
      await unarchiveCourse(course.id);
      toast.success('Course restored from archive');
      refreshCourseList();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      {course.status !== 'archived' && (
        <button onClick={handleArchive}>Archive Course</button>
      )}
      {course.status === 'archived' && (
        <button onClick={handleUnarchive}>Restore Course</button>
      )}
    </div>
  );
};
```

---

## ✅ **Ready to Use!**

API Archive Course sudah siap digunakan dengan:
- ✅ **Backend routes** implemented
- ✅ **Authorization** checks
- ✅ **Status validation** logic
- ✅ **Error handling** comprehensive
- ✅ **Testing scripts** updated
- ✅ **Documentation** complete

**Import Postman collection dan test archive/unarchive functionality! 🎉**