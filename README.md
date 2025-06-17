# Kancil AI Backend

Backend API untuk aplikasi Kancil AI Web - Platform pembelajaran AI untuk siswa SD.

## 🚀 Fitur Utama

- **Authentication & Authorization**: JWT + Google OAuth
- **Course Management**: CRUD courses dan subcourses
- **Student Progress Tracking**: Melacak kemajuan belajar siswa
- **AI Chatbot**: Integrasi chatbot "Pak Dino" 
- **File Upload**: Upload dan processing gambar, video, PDF
- **Analytics**: Dashboard analytics untuk guru dan siswa
- **Real-time Chat**: Interaksi dengan AI assistant

## 📋 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js

































































































































































































































































- **Database**: PostgreSQL dengan Sequelize ORM
- **Authentication**: Passport.js (JWT + Google OAuth)
- **File Processing**: Multer + Sharp
- **Validation**: Joi
- **Logging**: Winston

## 🛠 Installation

1. **Clone repository dan masuk ke folder backend**
```bash
cd "Kancil AI Web/backend"
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit file `.env` dan sesuaikan dengan konfigurasi Anda:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kancil_ai_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

4. **Setup database PostgreSQL**
```bash
# Buat database
createdb kancil_ai_db

# Atau via psql
psql -c "CREATE DATABASE kancil_ai_db;"
```

5. **Migrate database**
```bash
npm run migrate
```

6. **Seed sample data (opsional)**
```bash
npm run seed
```

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Server akan berjalan di `http://localhost:5001`

## 📁 Struktur Project

```
backend/
├── config/
│   ├── database.js          # Konfigurasi database
│   └── passport.js          # Konfigurasi authentication
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── errorHandler.js      # Error handling
│   └── validation.js        # Request validation
├── models/
│   ├── User.js              # User model
│   ├── Course.js            # Course model
│   ├── SubCourse.js         # SubCourse model
│   ├── StudentEnrollment.js # Enrollment model
│   ├── StudentSubCourseProgress.js
│   ├── ChatbotInteraction.js
│   └── index.js             # Model associations
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management
│   ├── courses.js           # Course management
│   ├── subcourses.js        # SubCourse management
│   ├── chat.js              # Chat/AI routes
│   ├── analytics.js         # Analytics & dashboard
│   └── upload.js            # File upload
├── scripts/
│   ├── migrate.js           # Database migration
│   └── seed.js              # Sample data seeding
├── utils/
│   ├── logger.js            # Logging utility
│   └── helpers.js           # Helper functions
├── uploads/                 # File uploads directory
├── logs/                    # Application logs
└── server.js                # Main application entry
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login dengan email/password
- `GET /api/auth/google` - Login dengan Google
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh JWT token

### Courses
- `GET /api/courses` - List semua courses
- `POST /api/courses` - Buat course baru (teacher)
- `GET /api/courses/:id` - Detail course
- `PUT /api/courses/:id` - Update course (teacher)
- `POST /api/courses/join` - Join course dengan kode

### SubCourses
- `GET /api/subcourses/course/:courseId` - List subcourses
- `POST /api/subcourses` - Buat subcourse baru (teacher)
- `GET /api/subcourses/:id` - Detail subcourse
- `PATCH /api/subcourses/:id/progress` - Update progress (student)

### Chat/AI
- `POST /api/chat/message` - Kirim pesan ke AI
- `GET /api/chat/history/:subCourseId` - History chat

### Analytics
- `GET /api/analytics/dashboard` - Dashboard data (teacher)
- `GET /api/analytics/students` - Student analytics (teacher)
- `GET /api/analytics/student/dashboard` - Student dashboard

### File Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `DELETE /api/upload/:filename` - Delete file

## 👥 Sample Data

Setelah menjalankan `npm run seed`, Anda dapat login dengan:

**Teacher:**
- Email: `teacher@kancil.com`
- Password: `teacher123`

**Students:**
- Email: `student1@kancil.com`, Password: `student123`
- Email: `student2@kancil.com`, Password: `student123`
- Email: `student3@kancil.com`, Password: `student123`

**Course Codes:**
- Math: `MATH01`
- IPA: `IPA01`

## 🔒 Security Features

- JWT token-based authentication
- Password hashing dengan bcrypt
- Request rate limiting
- Input validation dengan Joi
- SQL injection protection dengan Sequelize
- File upload security
- CORS configuration

## 📊 Database Schema

Database menggunakan PostgreSQL dengan skema sesuai file `struktur_DB`:

- **users** - Data pengguna (siswa & guru)
- **courses** - Data course/mata pelajaran  
- **sub_courses** - Materi dalam course
- **student_enrollments** - Pendaftaran siswa ke course
- **student_sub_course_progress** - Progress belajar siswa
- **chatbot_interactions** - Riwayat chat dengan AI

## 🤖 AI Integration

Saat ini menggunakan response sederhana untuk chatbot "Pak Dino". Untuk integrasi penuh dengan OpenAI:

1. Tambahkan `OPENAI_API_KEY` di `.env`
2. Update function `generateAIResponse` di `routes/chat.js`
3. Implementasi TTS/STT untuk fitur suara

## 🔧 Development

### Add New Model
1. Buat model di `models/`
2. Update associations di `models/index.js`
3. Run migration: `npm run migrate`

### Add New Route
1. Buat route file di `routes/`
2. Import dan use di `server.js`
3. Tambahkan validation schema jika perlu

## 📝 Logging

Log disimpan di folder `logs/`:
- `error.log` - Error logs
- `combined.log` - All logs

## 🚀 Deployment

1. Setup PostgreSQL production database
2. Update environment variables
3. Run migrations: `npm run migrate`
4. Start application: `npm start`

## 📞 Support

Untuk pertanyaan atau bantuan, silakan contact tim development Kancil AI.

---

**Kancil AI** - Platform Pembelajaran AI untuk Siswa SD