const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  subject: {
    type: DataTypes.ENUM('Matematika', 'IPA', 'IPS'),
    allowNull: false
  },
  kelas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  teacher_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id_user'
    }
  },
  course_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('published', 'draft', 'archived'),
    defaultValue: 'draft'
  },
  cover_image_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  archived_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Course;