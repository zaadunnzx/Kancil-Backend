const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatbotInteraction = sequelize.define('ChatbotInteraction', {
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
      model: 'sub_courses',
      key: 'id'
    }
  },
  student_message_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  student_message_type: {
    type: DataTypes.ENUM('text', 'speech_input', 'speech_output'),
    defaultValue: 'text'
  },
  ai_response_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ai_response_mode: {
    type: DataTypes.ENUM('text', 'speech_input', 'speech_output'),
    defaultValue: 'text'
  },
  interaction_timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'chatbot_interactions',
  timestamps: false
});

module.exports = ChatbotInteraction;