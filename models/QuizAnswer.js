const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuizAnswer = sequelize.define('QuizAnswer', {
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
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quiz_banks',
      key: 'id'
    }
  },
  selected_answer: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D'),
    allowNull: true
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  answered_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'quiz_answers',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['session_id', 'question_id']
    }
  ]
});

module.exports = QuizAnswer;