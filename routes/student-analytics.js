const express = require('express');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Import models with error handling
let StudentAnalytics, User, SubCourse, Course, StudentEnrollment;
try {
  const models = require('../models');
  StudentAnalytics = models.StudentAnalytics;
  User = models.User;
  SubCourse = models.SubCourse;
  Course = models.Course;
  StudentEnrollment = models.StudentEnrollment;
} catch (error) {
  console.error('Error importing models:', error);
}

const { authenticate, teacherOnly, studentOnly } = require('../middleware/auth');

const router = express.Router();

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  res.json({
    message: 'Student Analytics routes are working!',
    timestamp: new Date().toISOString(),
    available_endpoints: [
      'POST /session - Submit analytics data (Student)',
      'GET /teacher/reports - Get analytics reports (Teacher)',
      'GET /teacher/student/:id - Get student detail (Teacher)'
    ]
  });
});

// Test route to verify routes are working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Student Analytics routes are working!',
    timestamp: new Date().toISOString(),
    route: 'GET /api/student-analytics/test'
  });
});

// ================================================
// STUDENT ENDPOINTS (for sending analytics data)
// ================================================

// POST /api/student-analytics/session - Student sends analytics data
router.post('/session', authenticate, async (req, res, next) => {
  try {
    console.log('Session endpoint hit by user:', req.user.nama_lengkap);
    console.log('Request body:', req.body);
    
    const student_id = req.user.id_user;
    const {
      sub_course_id,
      session_id,
      total_duration,
      analytics_data,
      session_start,
      session_end
    } = req.body;

    // Validate required fields
    if (!sub_course_id || !session_id || !total_duration || !analytics_data) {
      return res.status(400).json({
        error: 'Missing required fields: sub_course_id, session_id, total_duration, analytics_data'
      });
    }

    // Validate analytics_data format
    if (!Array.isArray(analytics_data) || analytics_data.length === 0) {
      return res.status(400).json({
        error: 'analytics_data must be a non-empty array'
      });
    }

    // Verify subcourse exists and student has access
    const subcourse = await SubCourse.findByPk(sub_course_id, {
      include: [{
        model: Course,
        as: 'course'
      }]
    });

    if (!subcourse) {
      return res.status(404).json({ error: 'SubCourse not found' });
    }

    // Check if student is enrolled in the course
    const enrollment = await StudentEnrollment.findOne({
      where: {
        student_id: student_id,
        course_id: subcourse.course_id
      }
    });

    if (!enrollment) {
      return res.status(403).json({ 
        error: 'Not enrolled in this course',
        course: subcourse.course.title
      });
    }

    // Calculate analytics metrics from the data
    const metrics = calculateAnalyticsMetrics(analytics_data, total_duration);

    // Prepare analytics record
    const analyticsRecord = {
      student_id,
      sub_course_id,
      session_id,
      session_start: session_start ? new Date(session_start) : new Date(),
      session_end: session_end ? new Date(session_end) : null,
      total_duration,
      watched_duration: analytics_data.length, // seconds of data received
      distracted_count: metrics.distracted_count,
      yawn_count: metrics.yawn_count,
      eyes_closed_count: metrics.eyes_closed_count,
      distracted_duration: metrics.distracted_duration,
      eyes_closed_duration: metrics.eyes_closed_duration,
      attention_percentage: metrics.attention_percentage,
      completion_percentage: metrics.completion_percentage,
      analytics_data: {
        per_second_data: analytics_data,
        processed_at: new Date(),
        total_data_points: analytics_data.length
      }
    };

    // Check if session already exists (prevent duplicates)
    const existingSession = await StudentAnalytics.findOne({
      where: {
        student_id,
        sub_course_id,
        session_id
      }
    });

    let savedAnalytics;
    if (existingSession) {
      // Update existing session
      savedAnalytics = await existingSession.update(analyticsRecord);
      console.log('Updated existing analytics session:', session_id);
    } else {
      // Create new session
      savedAnalytics = await StudentAnalytics.create(analyticsRecord);
      console.log('Created new analytics session:', session_id);
    }

    res.status(201).json({
      message: 'Analytics data saved successfully',
      analytics: {
        id: savedAnalytics.id,
        student_id: savedAnalytics.student_id,
        sub_course_id: savedAnalytics.sub_course_id,
        session_id: savedAnalytics.session_id,
        distracted_count: savedAnalytics.distracted_count,
        yawn_count: savedAnalytics.yawn_count,
        eyes_closed_count: savedAnalytics.eyes_closed_count,
        attention_percentage: parseFloat(savedAnalytics.attention_percentage),
        completion_percentage: parseFloat(savedAnalytics.completion_percentage),
        created_at: savedAnalytics.created_at
      },
      metrics_calculated: metrics
    });

  } catch (error) {
    console.error('Error in session endpoint:', error);
    next(error);
  }
});

// Helper function to calculate metrics from analytics data
function calculateAnalyticsMetrics(analyticsData, totalDuration) {
  let distracted_count = 0;
  let yawn_count = 0;
  let eyes_closed_count = 0;
  let distracted_duration = 0;
  let eyes_closed_duration = 0;

  analyticsData.forEach(dataPoint => {
    if (dataPoint.distracted) {
      distracted_count++;
      distracted_duration++;
    }
    if (dataPoint.yawn) {
      yawn_count++;
    }
    if (dataPoint.eyes_closed) {
      eyes_closed_count++;
      eyes_closed_duration++;
    }
  });

  // Calculate attention percentage
  const attentive_duration = analyticsData.length - distracted_duration;
  const attention_percentage = analyticsData.length > 0 
    ? Math.round((attentive_duration / analyticsData.length) * 100) 
    : 0;

  // Calculate completion percentage
  const completion_percentage = totalDuration > 0 
    ? Math.round((analyticsData.length / totalDuration) * 100) 
    : 0;

  return {
    distracted_count,
    yawn_count,
    eyes_closed_count,
    distracted_duration,
    eyes_closed_duration,
    attention_percentage,
    completion_percentage
  };
}

// ================================================
// TEACHER ENDPOINTS (for viewing reports)
// ================================================

// GET /api/student-analytics/teacher/reports - Main dashboard for teachers
router.get('/teacher/reports', authenticate, teacherOnly, async (req, res, next) => {
  try {
    console.log('Reports endpoint hit by user:', req.user.nama_lengkap);
    console.log('Query params:', req.query);
    
    const teacher_id = req.user.id_user;
    const { 
      course_id, 
      sub_course_id, 
      month, 
      year = new Date().getFullYear() 
    } = req.query;

    // Build date filter
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      dateFilter = {
        session_start: {
          [Op.between]: [startDate, endDate]
        }
      };
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      dateFilter = {
        session_start: {
          [Op.between]: [startDate, endDate]
        }
      };
    }

    // Get teacher's courses
    const teacherCourses = await Course.findAll({
      where: { teacher_id },
      include: [{
        model: SubCourse,
        as: 'subcourses',
        where: sub_course_id ? { id: sub_course_id } : {},
        required: !!sub_course_id
      }]
    });

    if (course_id) {
      const courseExists = teacherCourses.find(c => c.id == course_id);
      if (!courseExists) {
        return res.status(403).json({ error: 'Access denied to this course' });
      }
    }

    const courseIds = course_id ? [course_id] : teacherCourses.map(c => c.id);
    const subcourseIds = teacherCourses
      .flatMap(c => c.subcourses)
      .filter(sc => !sub_course_id || sc.id == sub_course_id)
      .map(sc => sc.id);

    console.log('Teacher courses:', courseIds);
    console.log('Subcourse IDs:', subcourseIds);

    // Get analytics data
    const analyticsData = await StudentAnalytics.findAll({
      where: {
        sub_course_id: { [Op.in]: subcourseIds },
        ...dateFilter
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id_user', 'nama_lengkap', 'email']
        },
        {
          model: SubCourse,
          as: 'subcourse',
          include: [{
            model: Course,
            as: 'course',
            attributes: ['id', 'title', 'subject']
          }]
        }
      ],
      order: [['session_start', 'DESC']]
    });

    console.log('Found analytics records:', analyticsData.length);

    if (analyticsData.length === 0) {
      // Return empty but valid structure
      return res.json({
        summary: {
          most_boring_material: null,
          most_distracted_student: null,
          average_attention: 0
        },
        material_reports: [],
        student_reports: [],
        period: month ? `${year}-${String(month).padStart(2, '0')}` : year.toString(),
        total_sessions: 0,
        message: 'No analytics data found. Please run: npm run seed:analytics'
      });
    }

    // Calculate summary metrics
    const summary = calculateSummaryMetrics(analyticsData);
    
    // Group data by material (subcourse)
    const materialReports = generateMaterialReports(analyticsData);
    
    // Group data by student
    const studentReports = generateStudentReports(analyticsData);

    res.json({
      summary,
      material_reports: materialReports,
      student_reports: studentReports,
      period: month ? `${year}-${String(month).padStart(2, '0')}` : year.toString(),
      total_sessions: analyticsData.length,
      metadata: {
        teacher: req.user.nama_lengkap,
        generated_at: new Date().toISOString(),
        filters: {
          course_id: course_id || null,
          sub_course_id: sub_course_id || null,
          month: month || null,
          year: year
        }
      }
    });

  } catch (error) {
    console.error('Error in reports endpoint:', error);
    next(error);
  }
});

// GET /api/student-analytics/teacher/student/:studentId - Detail laporan per siswa
router.get('/teacher/student/:studentId', authenticate, async (req, res, next) => {
  try {
    console.log('Student detail endpoint hit by user:', req.user.nama_lengkap);
    console.log('Student ID:', req.params.studentId);
    console.log('Query params:', req.query);
    
    const { studentId } = req.params;
    const { month, year = new Date().getFullYear() } = req.query;

    // Mock response for testing
    const mockResponse = {
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
          }
        ]
      },
      period: month ? `${year}-${String(month).padStart(2, '0')}` : year.toString(),
      total_sessions: 3,
      teacher: req.user.nama_lengkap,
      timestamp: new Date().toISOString()
    };

    res.json(mockResponse);

  } catch (error) {
    console.error('Error in student detail endpoint:', error);
    next(error);
  }
});

// ================================================
// HELPER FUNCTIONS
// ================================================

function calculateSummaryMetrics(analyticsData) {
  if (analyticsData.length === 0) {
    return {
      most_boring_material: null,
      most_distracted_student: null,
      average_attention: 0
    };
  }

  // Group by subcourse to find most boring material
  const materialStats = {};
  const studentStats = {};

  analyticsData.forEach(record => {
    const subcourseId = record.sub_course_id;
    const studentId = record.student_id;

    // Material stats
    if (!materialStats[subcourseId]) {
      materialStats[subcourseId] = {
        subcourse: record.subcourse,
        total_sessions: 0,
        total_distracted: 0,
        total_attention: 0
      };
    }
    materialStats[subcourseId].total_sessions++;
    materialStats[subcourseId].total_distracted += record.distracted_count;
    materialStats[subcourseId].total_attention += parseFloat(record.attention_percentage);

    // Student stats
    if (!studentStats[studentId]) {
      studentStats[studentId] = {
        student: record.student,
        total_distracted: 0,
        total_sessions: 0
      };
    }
    studentStats[studentId].total_distracted += record.distracted_count;
    studentStats[studentId].total_sessions++;
  });

  // Find most boring material (highest average distraction)
  let mostBoringMaterial = null;
  let highestAvgDistraction = 0;

  Object.values(materialStats).forEach(stat => {
    const avgDistraction = stat.total_distracted / stat.total_sessions;
    if (avgDistraction > highestAvgDistraction) {
      highestAvgDistraction = avgDistraction;
      mostBoringMaterial = {
        subcourse: stat.subcourse,
        avg_distracted: Math.round(avgDistraction).toString() + 'x'
      };
    }
  });

  // Find most distracted student
  let mostDistractedStudent = null;
  let highestTotalDistraction = 0;

  Object.values(studentStats).forEach(stat => {
    if (stat.total_distracted > highestTotalDistraction) {
      highestTotalDistraction = stat.total_distracted;
      mostDistractedStudent = {
        student: stat.student,
        total_distracted: stat.total_distracted.toString() + 'x'
      };
    }
  });

  // Calculate average attention
  const totalAttention = analyticsData.reduce((sum, record) => 
    sum + parseFloat(record.attention_percentage), 0);
  const averageAttention = Math.round(totalAttention / analyticsData.length).toString() + '%';

  return {
    most_boring_material: mostBoringMaterial,
    most_distracted_student: mostDistractedStudent,
    average_attention: averageAttention
  };
}

function generateMaterialReports(analyticsData) {
  const materialStats = {};

  analyticsData.forEach(record => {
    const subcourseId = record.sub_course_id;
    
    if (!materialStats[subcourseId]) {
      materialStats[subcourseId] = {
        subcourse: record.subcourse,
        sessions: [],
        total_distracted: 0,
        total_yawn: 0,
        total_eyes_closed: 0,
        total_attention: 0,
        students: new Set()
      };
    }

    const stat = materialStats[subcourseId];
    stat.sessions.push(record);
    stat.total_distracted += record.distracted_count;
    stat.total_yawn += record.yawn_count;
    stat.total_eyes_closed += record.eyes_closed_count;
    stat.total_attention += parseFloat(record.attention_percentage);
    stat.students.add(record.student_id);
  });

  return Object.values(materialStats).map(stat => {
    const sessionCount = stat.sessions.length;
    
    // Find most distracted student for this material
    const studentDistraction = {};
    stat.sessions.forEach(session => {
      const studentId = session.student_id;
      if (!studentDistraction[studentId]) {
        studentDistraction[studentId] = {
          student: session.student,
          total_distracted: 0
        };
      }
      studentDistraction[studentId].total_distracted += session.distracted_count;
    });

    const mostDistractedStudent = Object.values(studentDistraction)
      .sort((a, b) => b.total_distracted - a.total_distracted)[0];

    return {
      materi: stat.subcourse.title,
      topik: stat.subcourse.course.subject,
      distracted: Math.round(stat.total_distracted / sessionCount),
      yawn: Math.round(stat.total_yawn / sessionCount),
      tutup_mata: Math.round(stat.total_eyes_closed / sessionCount),
      rata_rata_perhatian: `${Math.round(stat.total_attention / sessionCount)}%`,
      siswa_paling_terdistraksi: mostDistractedStudent ? mostDistractedStudent.student.nama_lengkap : '-'
    };
  });
}

function generateStudentReports(analyticsData) {
  const studentStats = {};

  analyticsData.forEach(record => {
    const studentId = record.student_id;
    
    if (!studentStats[studentId]) {
      studentStats[studentId] = {
        student: record.student,
        sessions: [],
        total_distracted: 0,
        total_attention: 0,
        materials: {}
      };
    }

    const stat = studentStats[studentId];
    stat.sessions.push(record);
    stat.total_distracted += record.distracted_count;
    stat.total_attention += parseFloat(record.attention_percentage);

    // Track distraction per material
    const materialKey = record.subcourse.title;
    if (!stat.materials[materialKey]) {
      stat.materials[materialKey] = 0;
    }
    stat.materials[materialKey] += record.distracted_count;
  });

  return Object.values(studentStats).map(stat => {
    const sessionCount = stat.sessions.length;
    
    // Find most distracted material for this student
    const mostDistractedMaterial = Object.entries(stat.materials)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      nama_siswa: stat.student.nama_lengkap,
      total_distracted: stat.total_distracted,
      materi_paling_terdistraksi: mostDistractedMaterial ? mostDistractedMaterial[0] : '-',
      rata_rata_perhatian: `${Math.round(stat.total_attention / sessionCount)}%`
    };
  });
}

function generateDetailedStudentReport(studentAnalytics) {
  // Implementation for detailed student report
  // This would include session-by-session breakdown, trends, etc.
  return {
    sessions: studentAnalytics.map(record => ({
      date: record.session_start,
      material: record.subcourse.title,
      duration: record.watched_duration,
      distracted_count: record.distracted_count,
      yawn_count: record.yawn_count,
      eyes_closed_count: record.eyes_closed_count,
      attention_percentage: record.attention_percentage,
      completion_percentage: record.completion_percentage
    }))
  };
}

// Ensure router is exported
module.exports = router;