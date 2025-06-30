# Course Archive System

Complete archive/unarchive functionality for course management.

## 🎯 Features Overview

### Archive Course (Teacher Only)
- **Endpoint**: `PATCH /courses/:id/archive`
- **Authorization**: Teacher only (course owner)
- **Function**: Archive course to make it inactive
- **Status**: Courses with `published` or `draft` status can be archived

### Unarchive Course (Teacher Only)
- **Endpoint**: `PATCH /courses/:id/unarchive`
- **Authorization**: Teacher only (course owner)  
- **Function**: Restore archived course back to draft status
- **Status**: Only `archived` courses can be unarchived

## 📊 Course Status Flow

```
draft → publish → published
  ↑         ↓         ↓
  └───────archive────→ archived
            ↓         ↓  
           unarchive──┘
```

### Status Transitions:
1. **Draft** → **Published**: Via `PATCH /courses/:id/publish`
2. **Published** → **Archived**: Via `PATCH /courses/:id/archive`
3. **Draft** → **Archived**: Via `PATCH /courses/:id/archive`
4. **Archived** → **Draft**: Via `PATCH /courses/:id/unarchive`

### Business Rules:
- ✅ **Archive**: `draft` and `published` courses can be archived
- ✅ **Unarchive**: `archived` courses return to `draft` status
- ❌ **Archive**: `archived` courses cannot be archived again
- ❌ **Unarchive**: Non-`archived` courses cannot be unarchived

## 📋 API Reference

### Archive Course
```http
PATCH /api/courses/:id/archive
Authorization: Bearer <teacher-token>
```

**Success Response:**
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

**Error Responses:**
```json
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

### Unarchive Course
```http
PATCH /api/courses/:id/unarchive
Authorization: Bearer <teacher-token>
```

**Success Response:**
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

## 🔧 Implementation Details

### Database Schema
```sql
-- Courses table includes:
status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft'
archived_at TIMESTAMP NULL
published_at TIMESTAMP NULL
```

### Backend Route Implementation
```javascript
// Archive course (teacher only)
router.patch('/:id/archive', authenticate, teacherOnly, async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.teacher_id !== req.user.id_user) {
      return res.status(403).json({ error: 'Not authorized to archive this course' });
    }
    
    if (course.status === 'archived') {
      return res.status(400).json({ error: 'Course is already archived' });
    }
    
    await course.update({
      status: 'archived',
      archived_at: new Date()
    });
    
    res.json({ message: 'Course archived successfully', course });
  } catch (error) {
    next(error);
  }
});
```

## 🎮 Frontend Integration

### JavaScript Functions
```javascript
// Archive course
export const archiveCourse = async (courseId) => {
  try {
    const response = await apiClient.patch(`/courses/${courseId}/archive`);
    return response.data.course;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Unarchive course
export const unarchiveCourse = async (courseId) => {
  try {
    const response = await apiClient.patch(`/courses/${courseId}/unarchive`);
    return response.data.course;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### React Component Example
```javascript
const CourseActions = ({ course, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this course?')) return;
    
    setLoading(true);
    try {
      const updatedCourse = await archiveCourse(course.id);
      onUpdate(updatedCourse);
      toast.success('Course archived successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to archive course');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async () => {
    setLoading(true);
    try {
      const updatedCourse = await unarchiveCourse(course.id);
      onUpdate(updatedCourse);
      toast.success('Course restored from archive');
    } catch (error) {
      toast.error(error.message || 'Failed to restore course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-actions">
      {course.status !== 'archived' && (
        <button 
          onClick={handleArchive} 
          disabled={loading}
          className="btn btn-secondary"
        >
          {loading ? 'Archiving...' : 'Archive Course'}
        </button>
      )}
      
      {course.status === 'archived' && (
        <button 
          onClick={handleUnarchive} 
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Restoring...' : 'Restore Course'}
        </button>
      )}
    </div>
  );
};
```

## 🔍 Course Visibility Rules

### For Students:
- **Visible**: Only `published` courses
- **Hidden**: `draft` and `archived` courses
- **Enrollment**: Cannot join `archived` courses

### For Teachers:
- **Visible**: All courses they own (all statuses)
- **Management**: Full control over their courses
- **Analytics**: Can view data for all statuses

### For System:
- **Active Analytics**: Only `published` courses counted
- **Course History**: `archived` courses in separate section
- **Progress Data**: Preserved for `archived` courses

## 🧪 Testing with Postman

### Test Sequence:
1. **Login as teacher**
2. **Create course** (status: draft)
3. **Publish course** (status: published) 
4. **Archive course** (status: archived)
5. **Unarchive course** (status: draft)

### Postman Requests:
```
# Archive Course
PATCH {{baseUrl}}/courses/{{course_id}}/archive
Authorization: Bearer {{token}}

# Unarchive Course
PATCH {{baseUrl}}/courses/{{course_id}}/unarchive
Authorization: Bearer {{token}}
```

## 🔗 Integration with Other APIs

### Course Filtering:
```javascript
// Get only active courses
GET /api/courses?status=published

// Get archived courses
GET /api/courses?status=archived

// Get all courses (teacher only)
GET /api/courses
```

### Analytics Impact:
- **Dashboard Metrics**: Exclude archived courses from active counts
- **Teacher Analytics**: Show separate metrics for archived courses
- **Student Progress**: Maintain history even for archived courses

## ✅ Ready to Use!

The archive system provides:
- ✅ **Complete course lifecycle management**
- ✅ **Proper authorization and validation**
- ✅ **Clean status transitions**
- ✅ **Frontend-ready API responses**
- ✅ **Comprehensive error handling**
- ✅ **Integration with existing systems**

Import the Postman collection and test the archive/unarchive functionality! 🎉