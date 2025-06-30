require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';

// Test configurations
const TEST_CONFIGS = {
  auth: {
    name: 'Authentication',
    tests: [
      { name: 'Health Check', method: 'GET', url: '/health' },
      { name: 'Teacher Login', method: 'POST', url: '/auth/login/teacher', data: { email: 'teacher@kancil.com', password: 'teacher123' } },
      { name: 'Student Login', method: 'POST', url: '/auth/login/student', data: { email: 'student1@kancil.com', password: 'student123' } },
      { name: 'Get Current User', method: 'GET', url: '/auth/me', requiresAuth: true }
    ]
  },
  courses: {
    name: 'Course Management',
    tests: [
      { name: 'Get All Courses', method: 'GET', url: '/courses', requiresAuth: true },
      { name: 'Create Course', method: 'POST', url: '/courses', requiresAuth: true, requiresTeacher: true, 
        data: { title: 'Test Course', subject: 'Matematika', kelas: 1 } },
      { name: 'Join Course', method: 'POST', url: '/courses/join', requiresAuth: true, requiresStudent: true,
        data: { course_code: 'MATH01' } }
    ]
  },
  subcourses: {
    name: 'SubCourse Content',
    tests: [
      { name: 'Get Course Content', method: 'GET', url: '/subcourses/course/1', requiresAuth: true },
      { name: 'Update Progress', method: 'PATCH', url: '/subcourses/1/progress', requiresAuth: true, requiresStudent: true,
        data: { status: 'completed', completion_percentage: 100 } }
    ]
  },
  analytics: {
    name: 'Analytics',
    tests: [
      { name: 'Teacher Dashboard', method: 'GET', url: '/analytics/dashboard', requiresAuth: true, requiresTeacher: true },
      { name: 'Student Dashboard', method: 'GET', url: '/analytics/student/dashboard', requiresAuth: true, requiresStudent: true }
    ]
  },
  chat: {
    name: 'AI Chat',
    tests: [
      { name: 'Send Message to AI', method: 'POST', url: '/chat/send-message', requiresAuth: true, requiresStudent: true,
        data: { sub_course_id: 1, message: 'Bagaimana cara menghitung 2 + 3?', message_type: 'text' } },
      { name: 'Get Chat History', method: 'GET', url: '/chat/history/1', requiresAuth: true, requiresStudent: true }
    ]
  }
};

// Test state
let tokens = {
  teacher: null,
  student: null
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// HTTP client with timeout
const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  validateStatus: () => true // Don't throw on HTTP errors
});

// Utility functions
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  };
  
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'success' : 'error';
  log(`${status} ${testName} ${details}`, color);
  
  testResults.total++;
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// API testing functions
async function makeRequest(test, token = null) {
  try {
    const config = {
      method: test.method.toLowerCase(),
      url: test.url,
      data: test.data
    };

    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }

    const response = await httpClient(config);
    return response;
  } catch (error) {
    return {
      status: 0,
      statusText: error.message,
      data: { error: error.message }
    };
  }
}

async function runTest(test, groupName) {
  try {
    let token = null;
    
    // Determine which token to use
    if (test.requiresAuth) {
      if (test.requiresTeacher) {
        token = tokens.teacher;
        if (!token) {
          logTest(`${groupName} - ${test.name}`, false, '(No teacher token)');
          return false;
        }
      } else if (test.requiresStudent) {
        token = tokens.student;
        if (!token) {
          logTest(`${groupName} - ${test.name}`, false, '(No student token)');
          return false;
        }
      } else {
        // Use any available token
        token = tokens.teacher || tokens.student;
        if (!token) {
          logTest(`${groupName} - ${test.name}`, false, '(No token available)');
          return false;
        }
      }
    }

    const response = await makeRequest(test, token);
    
    // Check response
    const isSuccess = response.status >= 200 && response.status < 300;
    const details = `(${response.status} ${response.statusText})`;
    
    logTest(`${groupName} - ${test.name}`, isSuccess, details);
    
    // Extract tokens from login responses
    if (isSuccess && test.url.includes('/auth/login') && response.data.token) {
      if (test.url.includes('teacher')) {
        tokens.teacher = response.data.token;
        log('Teacher token extracted', 'info');
      } else if (test.url.includes('student')) {
        tokens.student = response.data.token;
        log('Student token extracted', 'info');
      }
    }
    
    return isSuccess;
  } catch (error) {
    logTest(`${groupName} - ${test.name}`, false, `(Error: ${error.message})`);
    return false;
  }
}

async function runTestGroup(groupKey) {
  const group = TEST_CONFIGS[groupKey];
  if (!group) {
    log(`Test group '${groupKey}' not found`, 'error');
    return;
  }

  log(`\n🧪 Testing ${group.name}...`, 'info');
  
  for (const test of group.tests) {
    await runTest(test, group.name);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function runAllTests() {
  log('🚀 Starting comprehensive API testing...', 'info');
  log(`📍 Base URL: ${API_BASE_URL}`, 'info');
  
  // Reset test results
  testResults = { passed: 0, failed: 0, total: 0 };
  tokens = { teacher: null, student: null };

  // Run tests in order (authentication first)
  const testOrder = ['auth', 'courses', 'subcourses', 'analytics', 'chat'];
  
  for (const groupKey of testOrder) {
    await runTestGroup(groupKey);
  }

  // Display summary
  log('\n📊 Test Summary:', 'info');
  log(`   Total Tests: ${testResults.total}`, 'info');
  log(`   Passed: ${testResults.passed}`, 'success');
  log(`   Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`   Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`, 
      testResults.failed === 0 ? 'success' : 'warning');

  if (testResults.failed === 0) {
    log('\n🎉 All tests passed! API is working correctly.', 'success');
  } else {
    log('\n⚠️  Some tests failed. Check the logs above for details.', 'warning');
    log('💡 Common issues:', 'info');
    log('   - Server not running: npm run dev', 'info');
    log('   - Database not seeded: node scripts/database/seed/index.js', 'info');
    log('   - Wrong base URL in configuration', 'info');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testGroup = args[0];

  if (testGroup && TEST_CONFIGS[testGroup]) {
    log(`🎯 Running specific test group: ${testGroup}`, 'info');
    await runTestGroup(testGroup);
  } else if (testGroup) {
    log(`❌ Unknown test group: ${testGroup}`, 'error');
    log(`Available groups: ${Object.keys(TEST_CONFIGS).join(', ')}`, 'info');
    process.exit(1);
  } else {
    await runAllTests();
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n🛑 Testing interrupted by user', 'warning');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled rejection: ${reason}`, 'error');
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  runTestGroup,
  TEST_CONFIGS
};