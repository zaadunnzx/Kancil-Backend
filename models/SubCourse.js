const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubCourse = sequelize.define('SubCourse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },  content_type: {
    type: DataTypes.ENUM('video', 'quiz', 'pdf_material', 'text', 'audio', 'image', 'pdf'),
    allowNull: false
  },
  content_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  order_in_course: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'sub_courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['course_id', 'order_in_course'],
      name: 'uq_sub_courses_course_order'
    }
  ]
});

module.exports = SubCourse;