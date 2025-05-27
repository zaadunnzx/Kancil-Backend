const User = require('./User');
const Course = require('./Course');
const SubCourse = require('./SubCourse');
const StudentEnrollment = require('./StudentEnrollment');
const StudentSubCourseProgress = require('./StudentSubCourseProgress');
const ChatInteraction = require('./ChatbotInteraction');

// User associations
User.hasMany(Course, { foreignKey: 'teacher_id', as: 'teacherCourses' });
User.hasMany(StudentEnrollment, { foreignKey: 'student_id', as: 'enrollments' });
User.hasMany(ChatInteraction, { foreignKey: 'student_id', as: 'chatInteractions' });

// Course associations
Course.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
Course.hasMany(SubCourse, { foreignKey: 'course_id', as: 'subCourses' });
Course.hasMany(StudentEnrollment, { foreignKey: 'course_id', as: 'enrollments' });

// SubCourse associations
SubCourse.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
SubCourse.hasMany(StudentSubCourseProgress, { foreignKey: 'sub_course_id', as: 'progress' });
SubCourse.hasMany(ChatInteraction, { foreignKey: 'sub_course_id', as: 'chatInteractions' });

// StudentEnrollment associations
StudentEnrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
StudentEnrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// StudentSubCourseProgress associations
StudentSubCourseProgress.belongsTo(User, { foreignKey: 'enrollment_student_id', as: 'student' });
StudentSubCourseProgress.belongsTo(Course, { foreignKey: 'enrollment_course_id', as: 'course' });
StudentSubCourseProgress.belongsTo(SubCourse, { foreignKey: 'sub_course_id', as: 'subCourse' });

// ChatInteraction associations
ChatInteraction.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
ChatInteraction.belongsTo(SubCourse, { foreignKey: 'sub_course_id', as: 'subCourse' });

module.exports = {
  User,
  Course,
  SubCourse,
  StudentEnrollment,
  StudentSubCourseProgress,
  ChatInteraction
};