// Instruksi  update db tambah comments table
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      sub_course_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sub_courses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_user: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id_user'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reaction_type: {
        type: Sequelize.ENUM('happy', 'sad', 'flat'),
        allowNull: false
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

    // Add unique constraint
    await queryInterface.addConstraint('reactions', {
      fields: ['sub_course_id', 'id_user'],
      type: 'unique',
      name: 'reactions_sub_course_id_user_id'
    });

    // Add indexes
    await queryInterface.addIndex('reactions', ['sub_course_id'], {
      name: 'idx_reactions_sub_course'
    });
    
    await queryInterface.addIndex('reactions', ['id_user'], {
      name: 'idx_reactions_user'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reactions');
  }
};