require('dotenv').config();
const { sequelize } = require('./config/database');
const { 
  User, 
  Course, 
  SubCourse, 
  StudentEnrollment, 
  StudentSubCourseProgress,
  Comment,
  Reaction
} = require('./models');

async function testAssociations() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Test Course -> SubCourse association
    console.log('\n🔍 Testing Course -> SubCourse association...');
    const courseWithSubCourses = await Course.findOne({
      include: [{ model: SubCourse, as: 'subcourses' }]
    });
    console.log('✅ Course.subcourses association works');
    
    // Test Course -> Teacher association
    console.log('\n🔍 Testing Course -> Teacher association...');
    const courseWithTeacher = await Course.findOne({
      include: [{ model: User, as: 'teacher' }]
    });
    console.log('✅ Course.teacher association works');

    // Test Course -> Enrollments association
    console.log('\n🔍 Testing Course -> Enrollments association...');
    const courseWithEnrollments = await Course.findOne({
      include: [{ model: StudentEnrollment, as: 'enrollments' }]
    });
    console.log('✅ Course.enrollments association works');

    // Test SubCourse -> Course association
    console.log('\n🔍 Testing SubCourse -> Course association...');
    const subCourseWithCourse = await SubCourse.findOne({
      include: [{ model: Course, as: 'course' }]
    });
    console.log('✅ SubCourse.course association works');

    // Test all associations in one query (like in API)
    console.log('\n🔍 Testing complex query (like in GET /courses)...');
    const complexQuery = await Course.findAll({
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id_user', 'nama_lengkap']
        },
        {
          model: SubCourse,
          as: 'subcourses',
          attributes: ['id', 'title', 'content_type', 'order_in_course']
        },
        {
          model: StudentEnrollment,
          as: 'enrollments',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id_user', 'nama_lengkap']
            }
          ]
        }
      ],
      limit: 5
    });
    console.log('✅ Complex query works - found', complexQuery.length, 'courses');

    // Test pagination query specifically
    console.log('\n🔍 Testing paginated query...');
    const paginatedQuery = await Course.findAndCountAll({
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id_user', 'nama_lengkap']
        },
        {
          model: SubCourse,
          as: 'subcourses',
          attributes: ['id', 'title', 'content_type', 'order_in_course']
        }
      ],
      limit: 10,
      offset: 0,
      order: [['created_at', 'DESC']]
    });
    console.log('✅ Paginated query works - found', paginatedQuery.count, 'total courses');

    console.log('\n🎉 All associations are working correctly!');
    console.log('\n📝 You can now test: GET {{baseUrl}}/courses?page=1&limit=10');
    process.exit(0);
  } catch (error) {
    console.error('❌ Association test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testAssociations();