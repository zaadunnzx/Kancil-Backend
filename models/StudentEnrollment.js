const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentEnrollment = sequelize.define('StudentEnrollment', {
  student_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: 'users',
      key: 'id_user'
    }
  },
  course_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  enrollment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'student_enrollments',
  timestamps: false
});

module.exports = StudentEnrollment;