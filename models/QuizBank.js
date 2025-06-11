const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuizBank = sequelize.define('QuizBank', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  subcourse_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subcourses',
      key: 'id'
    }
  },
  question_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  option_a: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  option_b: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  option_c: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  option_d: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  correct_answer: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D'),
    allowNull: false
  },
  difficulty_level: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    allowNull: false
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  }
}, {
  tableName: 'quiz_banks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = QuizBank;