'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to student_sub_course_progress table
    await queryInterface.addColumn('student_sub_course_progress', 'completion_percentage', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('student_sub_course_progress', 'time_spent', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Time spent in seconds'
    });

    await queryInterface.addColumn('student_sub_course_progress', 'attempts', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of attempts for quiz content'
    });

    await queryInterface.addColumn('student_sub_course_progress', 'quiz_answers', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Quiz answers and results for quiz content type'
    });

    // Change score column to DECIMAL for better precision
    await queryInterface.changeColumn('student_sub_course_progress', 'score', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn('student_sub_course_progress', 'completion_percentage');
    await queryInterface.removeColumn('student_sub_course_progress', 'time_spent');
    await queryInterface.removeColumn('student_sub_course_progress', 'attempts');
    await queryInterface.removeColumn('student_sub_course_progress', 'quiz_answers');

    // Revert score column back to INTEGER
    await queryInterface.changeColumn('student_sub_course_progress', 'score', {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    });
  }
};