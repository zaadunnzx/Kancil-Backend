# Setup Instructions untuk Comments & Reactions

## Langkah-langkah Setup:

### 1. Jalankan migrations untuk membuat tabel baru
```bash
node setup-tables.js
```

### 2. Restart server
```bash
npm run dev
```

### 3. Test endpoints menggunakan Postman
Import collection dari: `postman/Kancil_AI_API_Collection.json`

## Endpoints Baru yang Tersedia:

### Comments:
- `GET /api/comments/subcourse/:subCourseId` - Get comments
- `POST /api/comments/subcourse/:subCourseId` - Create comment
- `PUT /api/comments/:commentId` - Update comment  
- `DELETE /api/comments/:commentId` - Delete comment

### Reactions:
- `GET /api/reactions/subcourse/:subCourseId` - Get reactions
- `POST /api/reactions/subcourse/:subCourseId` - Add/update reaction
- `DELETE /api/reactions/subcourse/:subCourseId` - Remove reaction

### Teacher Courses:
- `GET /api/courses/my-courses` - Get teacher's courses

## Troubleshooting:

Jika ada error saat migration:
1. Cek koneksi database di `config/database.js`
2. Pastikan tabel `comments` dan `reactions` belum ada
3. Jalankan manual query jika perlu:

```sql
-- Hapus tabel jika ada error
DROP TABLE IF EXISTS reactions;
DROP TABLE IF EXISTS comments;
```

Lalu jalankan ulang `node setup-tables.js`