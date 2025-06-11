const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuizResult = sequelize.define('QuizResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quiz_sessions',
      key: 'id'
    }
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id_user'
    }
  },
  subcourse_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subcourses',
      key: 'id'
    }
  },
  total_questions: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  correct_answers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  final_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Percentage score (0-100)'
  },
  time_taken_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  attempt_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  completed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'quiz_results',
  timestamps: false
});

module.exports = QuizResult;