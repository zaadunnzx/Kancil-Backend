'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('announcements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      teacher_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id_user'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      course_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'courses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'NULL = announcement for all courses by teacher'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      announcement_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        defaultValue: 'published'
      },
      // Legacy fields for backward compatibility with existing routes
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      attachment_type: {
        type: Sequelize.ENUM('pdf', 'image', 'link'),
        allowNull: true
      },
      attachment_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      attachment_filename: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Optional expiration date for announcement'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('announcements', ['teacher_id'], {
      name: 'idx_announcements_teacher'
    });
    
    await queryInterface.addIndex('announcements', ['course_id'], {
      name: 'idx_announcements_course'
    });

    await queryInterface.addIndex('announcements', ['status'], {
      name: 'idx_announcements_status'
    });

    await queryInterface.addIndex('announcements', ['is_active'], {
      name: 'idx_announcements_active'
    });

    await queryInterface.addIndex('announcements', ['announcement_date'], {
      name: 'idx_announcements_date'
    });

    await queryInterface.addIndex('announcements', ['priority'], {
      name: 'idx_announcements_priority'
    });

    await queryInterface.addIndex('announcements', ['expires_at'], {
      name: 'idx_announcements_expires'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('announcements');
  }
};