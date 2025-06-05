# Kancil Backend API

Backend API untuk aplikasi pembelajaran Kancil AI dengan fitur komentar dan reaksi pada subcourse.

## Fitur Baru

### 1. Comments System
Siswa dan guru dapat memberikan komentar pada subcourse dengan fitur:
- CRUD operations (Create, Read, Update, Delete)
- Pagination untuk performa yang baik
- Hanya pemilik komentar yang bisa edit/delete
- Validasi content (max 1000 karakter)

#### Endpoints Comments:
- `GET /api/comments/subcourse/:subCourseId` - Mendapatkan komentar untuk subcourse
- `POST /api/comments/subcourse/:subCourseId` - Membuat komentar baru
- `PUT /api/comments/:commentId` - Update komentar
- `DELETE /api/comments/:commentId` - Hapus komentar

### 2. Reactions System
Siswa dapat memberikan reaksi pada subcourse dengan emoji:
- **happy** - 👍 Suka
- **sad** - 😢 Sedih
- **flat** - 🙂 datar

#### Fitur Reactions:
- Toggle reaction (klik lagi untuk remove)
- Statistik jumlah setiap reaksi
- User hanya bisa memberikan 1 reaksi per subcourse
- Real-time update statistik

#### Endpoints Reactions:
- `GET /api/reactions/subcourse/:subCourseId` - Mendapatkan statistik reaksi
- `POST /api/reactions/subcourse/:subCourseId` - Tambah/update reaksi
- `DELETE /api/reactions/subcourse/:subCourseId` - Hapus reaksi

### 3. Teacher My Courses
API untuk guru melihat course yang mereka miliki:
- `GET /api/courses/my-courses` - Mendapatkan semua course milik guru
- Includes statistik enrollment dan subcourse count
- Sorted by creation date (terbaru dulu)

## Database Schema

### Table Comments
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  sub_course_id INTEGER NOT NULL REFERENCES sub_courses(id),
  id_user UUID NOT NULL REFERENCES users(id_user),
  content TEXT NOT NULL,
  parent_id INTEGER REFERENCES comments(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table Reactions
```sql
CREATE TABLE reactions (
  id SERIAL PRIMARY KEY,
  sub_course_id INTEGER NOT NULL REFERENCES sub_courses(id),
  id_user UUID NOT NULL REFERENCES users(id_user),
  reaction_type ENUM('happy', 'sad', 'flat') NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sub_course_id, id_user)
);
```

## Cara Penggunaan

### 1. Menambahkan Komentar
```javascript
POST /api/comments/subcourse/1
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Penjelasan materi sangat bagus dan mudah dipahami!"
}
```

### 2. Memberikan Reaksi
```javascript
POST /api/reactions/subcourse/1
Content-Type: application/json
Authorization: Bearer <token>

{
  "reaction_type": "happy"
}
```

### 3. Melihat Course Guru
```javascript
GET /api/courses/my-courses
Authorization: Bearer <teacher_token>
```

## Autentikasi

Semua endpoint memerlukan autentikasi JWT token melalui header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format

Semua response menggunakan format standar:
```javascript
{
  "success": true/false,
  "message": "Descriptive message",
  "data": {...}, // Response data
  "error": "Error message if any"
}
```

## Testing

Gunakan Postman collection yang telah disediakan di `/postman/Kancil_AI_API_Collection.json` untuk testing semua endpoint.

## Keamanan

- Input validation untuk semua data
- Authorization checks untuk aksi CRUD
- Rate limiting untuk mencegah spam
- SQL injection protection dengan Sequelize ORM