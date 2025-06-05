const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reaction = sequelize.define('Reaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sub_course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sub_courses',
      key: 'id'
    }
  },
  id_user: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id_user'
    }
  },
  reaction_type: {
    type: DataTypes.ENUM('like', 'sad', 'flat'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['like', 'sad', 'flat']],
        msg: 'Reaction type must be like, sad, and flat'
      }
    }
  }
}, {
  tableName: 'reactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['sub_course_id', 'id_user']
    }
  ]
});

module.exports = Reaction;