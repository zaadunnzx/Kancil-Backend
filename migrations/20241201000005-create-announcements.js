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
        defaultValue: 'draft'
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

    // Create announcement attachments table
    await queryInterface.createTable('announcement_attachments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      announcement_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'announcements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      attachment_type: {
        type: Sequelize.ENUM('file', 'link'),
        allowNull: false
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Original filename for file attachments'
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Server file path for file attachments'
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Public URL to access file'
      },
      link_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'External link URL'
      },
      link_title: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Display title for external links'
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'File size in bytes'
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'MIME type of uploaded file'
      },
      created_at: {
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

    await queryInterface.addIndex('announcements', ['announcement_date'], {
      name: 'idx_announcements_date'
    });

    await queryInterface.addIndex('announcement_attachments', ['announcement_id'], {
      name: 'idx_attachments_announcement'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('announcement_attachments');
    await queryInterface.dropTable('announcements');
  }
};