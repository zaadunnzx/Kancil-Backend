const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentSubCourseProgress = sequelize.define('StudentSubCourseProgress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  enrollment_student_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  enrollment_course_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sub_course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sub_courses',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
    defaultValue: 'not_started'
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_accessed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'student_sub_course_progress',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['enrollment_student_id', 'enrollment_course_id', 'sub_course_id'],
      name: 'uq_student_subcourse_progress'
    }
  ]
});

module.exports = StudentSubCourseProgress;