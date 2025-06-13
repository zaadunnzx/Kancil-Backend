const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AnnouncementAttachment = sequelize.define('AnnouncementAttachment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  announcement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'announcements',
      key: 'id'
    }
  },
  attachment_type: {
    type: DataTypes.ENUM('file', 'link'),
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  link_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  link_title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'announcement_attachments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = AnnouncementAttachment;