const { QueryInterface, Sequelize } = require('sequelize');
const { sequelize } = require('./config/database');

async function runMigrations() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    // Test database connection first
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
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
    });    console.log('Updating student progress table with enhanced scoring...');
    
    // Add new columns to student_sub_course_progress for enhanced scoring
    try {
      await queryInterface.addColumn('student_sub_course_progress', 'completion_percentage', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
      console.log('✅ Added completion_percentage column');
    } catch (error) {
      console.log('⚠️ Column completion_percentage already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('student_sub_course_progress', 'time_spent', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
      console.log('✅ Added time_spent column');
    } catch (error) {
      console.log('⚠️ Column time_spent already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('student_sub_course_progress', 'attempts', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
      console.log('✅ Added attempts column');
    } catch (error) {
      console.log('⚠️ Column attempts already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('student_sub_course_progress', 'quiz_answers', {
        type: Sequelize.JSON,
        allowNull: true
      });
      console.log('✅ Added quiz_answers column');
    } catch (error) {
      console.log('⚠️ Column quiz_answers already exists, skipping...');
    }

    // Update score column to DECIMAL for better precision
    try {
      await queryInterface.changeColumn('student_sub_course_progress', 'score', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      });
      console.log('✅ Updated score column to DECIMAL(5,2)');
    } catch (error) {
      console.log('⚠️ Score column already updated, skipping...');
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n🔧 Database Connection Error Solutions:');
      console.error('1. Check your database credentials in config/database.js');
      console.error('2. Ensure PostgreSQL server is running');
      console.error('3. Verify database name, username, and password');
      console.error('4. Check if password is properly quoted as string');
      console.error('\n📝 Alternative: Run SQL manually:');
      console.error('Use the SQL commands in MANUAL_SETUP.sql file');
    }
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;