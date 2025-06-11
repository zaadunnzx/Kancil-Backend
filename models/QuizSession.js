const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuizSession = sequelize.define('QuizSession', {
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
  subcourse_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subcourses',
      key: 'id'
    }
  },
  session_token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  questions_assigned: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Array of question objects with scrambled options'
  },
  time_limit_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 60
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'completed', 'expired'),
    defaultValue: 'pending'
  },
  attempt_number: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  total_questions: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'quiz_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = QuizSession;