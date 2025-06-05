// Import existing models
const User = require('./User');
const Course = require('./Course');
const SubCourse = require('./SubCourse');
const StudentEnrollment = require('./StudentEnrollment');
const StudentSubCourseProgress = require('./StudentSubCourseProgress');
const ChatbotInteraction = require('./ChatbotInteraction');

// Import new models
const Comment = require('./Comment');
const Reaction = require('./Reaction');

// Define associations
// User associations
User.hasMany(Course, { foreignKey: 'teacher_id', as: 'teacherCourses' });
User.hasMany(Comment, { foreignKey: 'id_user', as: 'comments' });
User.hasMany(Reaction, { foreignKey: 'id_user', as: 'reactions' });
User.hasMany(StudentEnrollment, { foreignKey: 'student_id', as: 'enrollments' });

// Course associations
Course.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
Course.hasMany(SubCourse, { foreignKey: 'course_id', as: 'subCourses' });
Course.hasMany(StudentEnrollment, { foreignKey: 'course_id', as: 'enrollments' });

// SubCourse associations
SubCourse.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
SubCourse.hasMany(Comment, { foreignKey: 'sub_course_id', as: 'comments' });
SubCourse.hasMany(Reaction, { foreignKey: 'sub_course_id', as: 'reactions' });
SubCourse.hasMany(ChatbotInteraction, { foreignKey: 'sub_course_id', as: 'chatInteractions' });
SubCourse.hasMany(StudentSubCourseProgress, { foreignKey: 'sub_course_id', as: 'progress' });

// Comment associations
Comment.belongsTo(User, { foreignKey: 'id_user', as: 'user' });
Comment.belongsTo(SubCourse, { foreignKey: 'sub_course_id', as: 'subCourse' });

// Reaction associations
Reaction.belongsTo(User, { foreignKey: 'id_user', as: 'user' });
Reaction.belongsTo(SubCourse, { foreignKey: 'sub_course_id', as: 'subCourse' });

// StudentEnrollment associations
StudentEnrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
StudentEnrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// StudentSubCourseProgress associations
StudentSubCourseProgress.belongsTo(SubCourse, { foreignKey: 'sub_course_id', as: 'subCourse' });

// ChatbotInteraction associations
ChatbotInteraction.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
ChatbotInteraction.belongsTo(SubCourse, { foreignKey: 'sub_course_id', as: 'subCourse' });

module.exports = {
  User,
  Course,
  SubCourse,
  StudentEnrollment,
  StudentSubCourseProgress,
  ChatbotInteraction,
  Comment,
  Reaction
};