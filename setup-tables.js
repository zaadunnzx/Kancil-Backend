const { QueryInterface, Sequelize } = require('sequelize');
const { sequelize } = require('./config/database');

async function runMigrations() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('Creating comments table...');
    
    // Create comments table
    await queryInterface.createTable('comments', {
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
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Add indexes for comments
    await queryInterface.addIndex('comments', ['sub_course_id'], {
      name: 'idx_comments_sub_course'
    });
    
    await queryInterface.addIndex('comments', ['id_user'], {
      name: 'idx_comments_user'
    });

    console.log('Creating reactions table...');
    
    // Create reactions table
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

    // Add indexes for reactions
    await queryInterface.addIndex('reactions', ['sub_course_id'], {
      name: 'idx_reactions_sub_course'
    });
    
    await queryInterface.addIndex('reactions', ['id_user'], {
      name: 'idx_reactions_user'
    });

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;