const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentAnalytics = sequelize.define('StudentAnalytics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id_user'
    }
  },
  sub_course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subcourses',
      key: 'id'
    }
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  session_start: {
    type: DataTypes.DATE,
    allowNull: false
  },
  session_end: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Total video duration in seconds'
  },
  watched_duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Actually watched duration in seconds'
  },
  distracted_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of distracted moments'
  },
  yawn_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of yawns detected'
  },
  eyes_closed_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of eyes closed moments'
  },
  distracted_duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total distracted time in seconds'
  },
  eyes_closed_duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total eyes closed time in seconds'
  },
  attention_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Calculated attention percentage'
  },
  completion_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Video completion percentage'
  },
  analytics_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Detailed per-second analytics data'
  }
}, {
  tableName: 'student_analytics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'sub_course_id', 'session_id']
    },
    {
      fields: ['student_id']
    },
    {
      fields: ['sub_course_id']
    },
    {
      fields: ['session_start']
    },
    {
      fields: ['student_id', 'sub_course_id']
    }
  ]
});

module.exports = StudentAnalytics;