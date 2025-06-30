const express = require('express');
const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Student Analytics routes are working!',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /test - Test endpoint',
      'POST /session - Submit analytics (Student)',
      'GET /teacher/reports - Teacher reports'
    ]
  });
});

// Simple session endpoint for testing
router.post('/session', (req, res) => {
  try {
    const { sub_course_id, session_id, total_duration, analytics_data } = req.body;
    
    // Basic validation
    if (!sub_course_id || !session_id || !total_duration || !analytics_data) {
      return res.status(400).json({
        error: 'Missing required fields: sub_course_id, session_id, total_duration, analytics_data'
      });
    }

    // Mock response for now
    res.status(201).json({
      message: 'Analytics data received successfully',
      data: {
        sub_course_id,
        session_id,
        total_duration,
        analytics_count: analytics_data.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// Simple teacher reports endpoint
router.get('/teacher/reports', (req, res) => {
  try {
    const { month, year, course_id, sub_course_id } = req.query;
    
    // Mock data that matches the UI structure
    const mockData = {
      summary: {
        most_boring_material: {
          subcourse: {
            title: "Pengenalan Pecahan",
            course: { subject: "Matematika" }
          },
          avg_distracted: "8.5"
        },
        most_distracted_student: {
          student: { nama_lengkap: "Budi Santoso" },
          total_distracted: 12
        },
        average_attention: 79.0
      },
      material_reports: [
        {
          materi: "Pengenalan Pecahan",
          topik: "Matematika",
          distracted: 8,
          yawn: 5,
          tutup_mata: 2,
          rata_rata_perhatian: "78%",
          siswa_paling_terdistraksi: "Budi Santoso"
        },
        {
          materi: "Pembilang dan Penyebut",
          topik: "Matematika",
          distracted: 3,
          yawn: 1,
          tutup_mata: 0,
          rata_rata_perhatian: "92%",
          siswa_paling_terdistraksi: "Ayu Pratiwi"
        }
      ],
      student_reports: [
        {
          nama_siswa: "Budi Santoso",
          total_distracted: 12,
          materi_paling_terdistraksi: "Pengenalan Pecahan",
          rata_rata_perhatian: "70%"
        },
        {
          nama_siswa: "Ayu Pratiwi",
          total_distracted: 4,
          materi_paling_terdistraksi: "Pembilang dan Penyebut",
          rata_rata_perhatian: "88%"
        }
      ],
      period: month && year ? `${year}-${String(month).padStart(2, '0')}` : new Date().getFullYear().toString(),
      total_sessions: 25,
      filters: { month, year, course_id, sub_course_id }
    };

    res.json(mockData);
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// Student detail report endpoint
router.get('/teacher/student/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;
    
    // Mock detailed student data
    const mockStudentData = {
      student: {
        id_user: studentId,
        nama_lengkap: "Budi Santoso",
        email: "budi@example.com"
      },
      detailed_report: {
        sessions: [
          {
            date: "2024-01-15T10:00:00.000Z",
            material: "Pengenalan Pecahan",
            duration: 580,
            distracted_count: 8,
            yawn_count: 5,
            eyes_closed_count: 2,
            attention_percentage: 78.5,
            completion_percentage: 96.7
          },
          {
            date: "2024-01-14T14:30:00.000Z",
            material: "Pembilang dan Penyebut",
            duration: 420,
            distracted_count: 3,
            yawn_count: 1,
            eyes_closed_count: 0,
            attention_percentage: 92.1,
            completion_percentage: 87.5
          }
        ]
      },
      period: month && year ? `${year}-${String(month).padStart(2, '0')}` : new Date().getFullYear().toString(),
      total_sessions: 2
    };

    res.json(mockStudentData);
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

module.exports = router;