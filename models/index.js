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

// Import new quiz models
const QuizBank = require('./QuizBank');
const QuizSession = require('./QuizSession');
const QuizAnswer = require('./QuizAnswer');
const QuizResult = require('./QuizResult');
const QuizSettings = require('./QuizSettings');

// Define associations
// User associations
User.hasMany(Course, { foreignKey: 'teacher_id', as: 'teacherCourses' });
User.hasMany(Comment, { foreignKey: 'id_user', as: 'comments' });
User.hasMany(Reaction, { foreignKey: 'id_user', as: 'reactions' });
User.hasMany(StudentEnrollment, { foreignKey: 'student_id', as: 'enrollments' });

// Course associations
Course.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
Course.hasMany(SubCourse, { 
  foreignKey: 'course_id', 
  as: 'subcourses' 
});
Course.hasMany(StudentEnrollment, { 
  foreignKey: 'course_id', 
  as: 'enrollments' 
});

// SubCourse associations
SubCourse.belongsTo(Course, { 
  foreignKey: 'course_id', 
  as: 'course' 
});
SubCourse.hasMany(Comment, { foreignKey: 'sub_course_id', as: 'comments' });
SubCourse.hasMany(Reaction, { foreignKey: 'sub_course_id', as: 'reactions' });
SubCourse.hasMany(ChatbotInteraction, { foreignKey: 'sub_course_id', as: 'chatInteractions' });
SubCourse.hasMany(StudentSubCourseProgress, { 
  foreignKey: 'sub_course_id', 
  as: 'progress' 
});
SubCourse.hasMany(QuizBank, { 
  foreignKey: 'subcourse_id', 
  as: 'quiz_questions' 
});
SubCourse.hasOne(QuizSettings, { 
  foreignKey: 'subcourse_id', 
  as: 'quiz_settings' 
});

// Comment associations
Comment.belongsTo(User, { foreignKey: 'id_user', as: 'user' });
Comment.belongsTo(SubCourse, { foreignKey: 'sub_course_id', as: 'subCourse' });

// Reaction associations
Reaction.belongsTo(User, { foreignKey: 'id_user', as: 'user' });
Reaction.belongsTo(SubCourse, { foreignKey: 'sub_course_id', as: 'subCourse' });

// StudentEnrollment associations
StudentEnrollment.belongsTo(User, { 
  foreignKey: 'student_id', 
  as: 'student' 
});
StudentEnrollment.belongsTo(Course, { 
  foreignKey: 'course_id', 
  as: 'course' 
});

// StudentSubCourseProgress associations
StudentSubCourseProgress.belongsTo(SubCourse, { 
  foreignKey: 'sub_course_id', 
  as: 'subcourse' 
});
StudentSubCourseProgress.belongsTo(User, { 
  foreignKey: 'enrollment_student_id', 
  as: 'student' 
});

// ChatbotInteraction associations
ChatbotInteraction.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
ChatbotInteraction.belongsTo(SubCourse, { foreignKey: 'sub_course_id', as: 'subCourse' });

// Quiz System Associations
QuizBank.belongsTo(SubCourse, { 
  foreignKey: 'subcourse_id', 
  as: 'subcourse' 
});
QuizSettings.belongsTo(SubCourse, { 
  foreignKey: 'subcourse_id', 
  as: 'subcourse' 
});
QuizSession.belongsTo(User, { 
  foreignKey: 'student_id', 
  as: 'student' 
});
QuizSession.belongsTo(SubCourse, { 
  foreignKey: 'subcourse_id', 
  as: 'subcourse' 
});
QuizSession.hasMany(QuizAnswer, { 
  foreignKey: 'session_id', 
  as: 'answers' 
});
QuizSession.hasOne(QuizResult, { 
  foreignKey: 'session_id', 
  as: 'result' 
});
QuizAnswer.belongsTo(QuizSession, { 
  foreignKey: 'session_id', 
  as: 'session' 
});
QuizAnswer.belongsTo(QuizBank, { 
  foreignKey: 'question_id', 
  as: 'question' 
});
QuizResult.belongsTo(QuizSession, { 
  foreignKey: 'session_id', 
  as: 'session' 
});
QuizResult.belongsTo(User, { 
  foreignKey: 'student_id', 
  as: 'student' 
});
QuizResult.belongsTo(SubCourse, { 
  foreignKey: 'subcourse_id', 
  as: 'subcourse' 
});

module.exports = {
  User,
  Course,
  SubCourse,
  StudentEnrollment,
  StudentSubCourseProgress,
  ChatbotInteraction,
  Comment,
  Reaction,
  QuizBank,
  QuizSession,
  QuizAnswer,
  QuizResult,
  QuizSettings
};