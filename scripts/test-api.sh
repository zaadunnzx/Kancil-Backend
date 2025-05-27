#!/bin/bash

# Kancil AI API Testing Script
# Usage: ./test-api.sh [endpoint_group]

BASE_URL="http://localhost:5001/api"
TEACHER_TOKEN=""
STUDENT_TOKEN=""
COURSE_ID=""
SUBCOURSE_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if server is running
check_server() {
    print_status "Checking if server is running..."
    response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
    if [ $response -eq 200 ]; then
        print_success "Server is running!"
    else
        print_error "Server is not running. Please start the server first."
        exit 1
    fi
}

# Function to test authentication
test_auth() {
    print_status "Testing Authentication endpoints..."
    
    # Test login teacher
    print_status "Login as teacher..."
    response=$(curl -s -X POST $BASE_URL/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email": "teacher@kancil.com", "password": "teacher123"}')
    
    if echo $response | grep -q "token"; then
        TEACHER_TOKEN=$(echo $response | jq -r '.token')
        print_success "Teacher login successful"
    else
        print_error "Teacher login failed: $response"
        return 1
    fi
    
    # Test login student
    print_status "Login as student..."
    response=$(curl -s -X POST $BASE_URL/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email": "student1@kancil.com", "password": "student123"}')
    
    if echo $response | grep -q "token"; then
        STUDENT_TOKEN=$(echo $response | jq -r '.token')
        print_success "Student login successful"
    else
        print_error "Student login failed: $response"
        return 1
    fi
    
    # Test get current user
    print_status "Testing get current user..."
    response=$(curl -s -X GET $BASE_URL/auth/me \
        -H "Authorization: Bearer $TEACHER_TOKEN")
    
    if echo $response | grep -q "teacher@kancil.com"; then
        print_success "Get current user successful"
    else
        print_error "Get current user failed: $response"
    fi
}

# Function to test courses
test_courses() {
    print_status "Testing Courses endpoints..."
    
    # Test get all courses
    print_status "Getting all courses..."
    response=$(curl -s -X GET $BASE_URL/courses \
        -H "Authorization: Bearer $TEACHER_TOKEN")
    
    if echo $response | grep -q "courses"; then
        print_success "Get all courses successful"
    else
        print_error "Get all courses failed: $response"
    fi
    
    # Test create course (as teacher)
    print_status "Creating new course..."
    response=$(curl -s -X POST $BASE_URL/courses \
        -H "Authorization: Bearer $TEACHER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Test Course from Script",
            "subject": "Matematika",
            "kelas": 5,
            "start_date": "2024-01-15",
            "end_date": "2024-06-15"
        }')
    
    if echo $response | grep -q "course"; then
        COURSE_ID=$(echo $response | jq -r '.course.id')
        print_success "Course created with ID: $COURSE_ID"
    else
        print_error "Course creation failed: $response"
        return 1
    fi
    
    # Test get course detail
    print_status "Getting course detail..."
    response=$(curl -s -X GET $BASE_URL/courses/$COURSE_ID \
        -H "Authorization: Bearer $TEACHER_TOKEN")
    
    if echo $response | grep -q "Test Course from Script"; then
        print_success "Get course detail successful"
    else
        print_error "Get course detail failed: $response"
    fi
    
    # Test publish course
    print_status "Publishing course..."
    response=$(curl -s -X PATCH $BASE_URL/courses/$COURSE_ID/publish \
        -H "Authorization: Bearer $TEACHER_TOKEN")
    
    if echo $response | grep -q "published"; then
        print_success "Course published successfully"
    else
        print_warning "Course publish response: $response"
    fi
}

# Function to test subcourses
test_subcourses() {
    print_status "Testing SubCourses endpoints..."
    
    # Test create subcourse
    print_status "Creating subcourse..."
    response=$(curl -s -X POST $BASE_URL/subcourses \
        -H "Authorization: Bearer $TEACHER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "course_id": '$COURSE_ID',
            "title": "Test SubCourse from Script",
            "summary": "This is a test subcourse created from script",
            "content_type": "video",
            "content_url": "https://example.com/video.mp4",
            "order_in_course": 1
        }')
    
    if echo $response | grep -q "subCourse"; then
        SUBCOURSE_ID=$(echo $response | jq -r '.subCourse.id')
        print_success "SubCourse created with ID: $SUBCOURSE_ID"
    else
        print_error "SubCourse creation failed: $response"
        return 1
    fi
    
    # Test get subcourses for course
    print_status "Getting subcourses for course..."
    response=$(curl -s -X GET $BASE_URL/subcourses/course/$COURSE_ID \
        -H "Authorization: Bearer $TEACHER_TOKEN")
    
    if echo $response | grep -q "subCourses"; then
        print_success "Get subcourses successful"
    else
        print_error "Get subcourses failed: $response"
    fi
}

# Function to test student features
test_student_features() {
    print_status "Testing Student features..."
    
    # Test join course
    print_status "Student joining course..."
    # First get course code
    course_code=$(curl -s -X GET $BASE_URL/courses/$COURSE_ID \
        -H "Authorization: Bearer $TEACHER_TOKEN" | jq -r '.course.course_code')
    
    response=$(curl -s -X POST $BASE_URL/courses/join \
        -H "Authorization: Bearer $STUDENT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"course_code": "'$course_code'"}')
    
    if echo $response | grep -q "successfully\|already"; then
        print_success "Student joined course successfully"
    else
        print_error "Student join course failed: $response"
    fi
    
    # Test update progress
    print_status "Updating student progress..."
    response=$(curl -s -X PATCH $BASE_URL/subcourses/$SUBCOURSE_ID/progress \
        -H "Authorization: Bearer $STUDENT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"status": "completed", "score": 85.5}')
    
    if echo $response | grep -q "progress\|completed"; then
        print_success "Progress updated successfully"
    else
        print_warning "Progress update response: $response"
    fi
}

# Function to test chat
test_chat() {
    print_status "Testing Chat endpoints..."
    
    # Test send message to AI
    print_status "Sending message to AI..."
    response=$(curl -s -X POST $BASE_URL/chat/message \
        -H "Authorization: Bearer $STUDENT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "sub_course_id": '$SUBCOURSE_ID',
            "message": "Bagaimana cara menghitung 2 + 3?",
            "message_type": "text"
        }')
    
    if echo $response | grep -q "ai_response"; then
        print_success "AI chat message successful"
    else
        print_error "AI chat message failed: $response"
    fi
    
    # Test get chat history
    print_status "Getting chat history..."
    response=$(curl -s -X GET $BASE_URL/chat/history/$SUBCOURSE_ID \
        -H "Authorization: Bearer $STUDENT_TOKEN")
    
    if echo $response | grep -q "interactions"; then
        print_success "Get chat history successful"
    else
        print_warning "Get chat history response: $response"
    fi
}

# Function to test analytics
test_analytics() {
    print_status "Testing Analytics endpoints..."
    
    # Test teacher dashboard
    print_status "Getting teacher dashboard analytics..."
    response=$(curl -s -X GET $BASE_URL/analytics/dashboard \
        -H "Authorization: Bearer $TEACHER_TOKEN")
    
    if echo $response | grep -q "summary"; then
        print_success "Teacher dashboard analytics successful"
    else
        print_error "Teacher dashboard analytics failed: $response"
    fi
    
    # Test student dashboard
    print_status "Getting student dashboard analytics..."
    response=$(curl -s -X GET $BASE_URL/analytics/student/dashboard \
        -H "Authorization: Bearer $STUDENT_TOKEN")
    
    if echo $response | grep -q "summary"; then
        print_success "Student dashboard analytics successful"
    else
        print_warning "Student dashboard analytics response: $response"
    fi
}

# Function to test file upload
test_upload() {
    print_status "Testing File Upload endpoints..."
    
    # Create a test file
    echo "This is a test file for upload" > test-upload.txt
    
    # Test single file upload
    print_status "Uploading single file..."
    response=$(curl -s -X POST $BASE_URL/upload/single \
        -H "Authorization: Bearer $TEACHER_TOKEN" \
        -F "file=@test-upload.txt")
    
    if echo $response | grep -q "url"; then
        print_success "Single file upload successful"
        uploaded_filename=$(echo $response | jq -r '.file.filename')
    else
        print_error "Single file upload failed: $response"
    fi
    
    # Clean up test file
    rm -f test-upload.txt
}

# Function to test user management
test_users() {
    print_status "Testing User Management endpoints..."
    
    # Test get profile
    print_status "Getting user profile..."
    response=$(curl -s -X GET $BASE_URL/users/profile \
        -H "Authorization: Bearer $TEACHER_TOKEN")
    
    if echo $response | grep -q "user"; then
        print_success "Get user profile successful"
    else
        print_error "Get user profile failed: $response"
    fi
    
    # Test update profile
    print_status "Updating user profile..."
    response=$(curl -s -X PUT $BASE_URL/users/profile \
        -H "Authorization: Bearer $TEACHER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"nama_lengkap": "Updated Teacher Name"}')
    
    if echo $response | grep -q "Updated Teacher Name"; then
        print_success "Update user profile successful"
    else
        print_warning "Update profile response: $response"
    fi
}

# Function to run all tests
run_all_tests() {
    print_status "Running complete API test suite..."
    echo "=================================="
    
    check_server
    
    if test_auth; then
        test_courses
        test_subcourses
        test_student_features
        test_chat
        test_analytics
        test_upload
        test_users
    else
        print_error "Authentication tests failed. Skipping other tests."
        exit 1
    fi
    
    echo "=================================="
    print_success "All tests completed!"
}

# Function to show usage
show_usage() {
    echo "Kancil AI API Testing Script"
    echo ""
    echo "Usage: $0 [test_group]"
    echo ""
    echo "Test Groups:"
    echo "  all        - Run all tests (default)"
    echo "  auth       - Test authentication endpoints"
    echo "  courses    - Test courses endpoints"
    echo "  subcourses - Test subcourses endpoints"
    echo "  student    - Test student features"
    echo "  chat       - Test chat endpoints"
    echo "  analytics  - Test analytics endpoints"
    echo "  upload     - Test file upload endpoints"
    echo "  users      - Test user management endpoints"
    echo "  health     - Test server health"
    echo ""
    echo "Examples:"
    echo "  $0              # Run all tests"
    echo "  $0 auth         # Test only authentication"
    echo "  $0 courses      # Test only courses"
}

# Main script execution
case "${1:-all}" in
    "all")
        run_all_tests
        ;;
    "auth")
        check_server
        test_auth
        ;;
    "courses")
        check_server
        test_auth
        test_courses
        ;;
    "subcourses")
        check_server
        test_auth
        test_courses
        test_subcourses
        ;;
    "student")
        check_server
        test_auth
        test_courses
        test_subcourses
        test_student_features
        ;;
    "chat")
        check_server
        test_auth
        test_courses
        test_subcourses
        test_student_features
        test_chat
        ;;
    "analytics")
        check_server
        test_auth
        test_analytics
        ;;
    "upload")
        check_server
        test_auth
        test_upload
        ;;
    "users")
        check_server
        test_auth
        test_users
        ;;
    "health")
        check_server
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Unknown test group: $1"
        show_usage
        exit 1
        ;;
esac