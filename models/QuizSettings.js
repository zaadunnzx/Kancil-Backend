const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuizSettings = sequelize.define('QuizSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  subcourse_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'subcourses',
      key: 'id'
    }
  },
  total_questions_in_pool: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    comment: 'Total soal yang dibuat guru (3x dari yang dikerjakan)'
  },
  questions_per_attempt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    comment: 'Jumlah soal yang dikerjakan siswa'
  },
  time_limit_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 60
  },
  max_attempts: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'NULL = unlimited attempts'
  },
  shuffle_questions: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  shuffle_options: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  show_results_immediately: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'quiz_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = QuizSettings;