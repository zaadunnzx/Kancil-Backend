# Kancil AI API Testing Script for Windows PowerShell
# Usage: .\test-api.ps1 [endpoint_group]

param(
    [string]$TestGroup = "all"
)

$BaseUrl = "http://localhost:5001/api"
$TeacherToken = ""
$StudentToken = ""
$CourseId = ""
$SubcourseId = ""

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

# Function to make HTTP requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        $params = @{
            Method = $Method
            Uri = $Uri
            Headers = $Headers
            ContentType = 'application/json'
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        return $_.Exception.Response
    }
}

# Function to check if server is running
function Test-ServerHealth {
    Write-Status "Checking if server is running..."
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET
        if ($response.status -eq "OK") {
            Write-Success "Server is running!"
            return $true
        }
    }
    catch {
        Write-Error "Server is not running. Please start the server first."
        return $false
    }
}

# Function to test authentication
function Test-Authentication {
    Write-Status "Testing Authentication endpoints..."
    
    # Test login teacher
    Write-Status "Login as teacher..."
    $loginData = @{
        email = "teacher@kancil.com"
        password = "teacher123"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-ApiRequest -Method POST -Uri "$BaseUrl/auth/login" -Body $loginData
        if ($response.token) {
            $script:TeacherToken = $response.token
            Write-Success "Teacher login successful"
        } else {
            Write-Error "Teacher login failed"
            return $false
        }
    }
    catch {
        Write-Error "Teacher login failed: $($_.Exception.Message)"
        return $false
    }
    
    # Test login student
    Write-Status "Login as student..."
    $studentLoginData = @{
        email = "student1@kancil.com"
        password = "student123"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-ApiRequest -Method POST -Uri "$BaseUrl/auth/login" -Body $studentLoginData
        if ($response.token) {
            $script:StudentToken = $response.token
            Write-Success "Student login successful"
        } else {
            Write-Error "Student login failed"
            return $false
        }
    }
    catch {
        Write-Error "Student login failed: $($_.Exception.Message)"
        return $false
    }
    
    # Test get current user
    Write-Status "Testing get current user..."
    $headers = @{ Authorization = "Bearer $TeacherToken" }
    
    try {
        $response = Invoke-ApiRequest -Method GET -Uri "$BaseUrl/auth/me" -Headers $headers
        if ($response.user.email -eq "teacher@kancil.com") {
            Write-Success "Get current user successful"
            return $true
        } else {
            Write-Error "Get current user failed"
            return $false
        }
    }
    catch {
        Write-Error "Get current user failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to test courses
function Test-Courses {
    Write-Status "Testing Courses endpoints..."
    $headers = @{ Authorization = "Bearer $TeacherToken" }
    
    # Test get all courses
    Write-Status "Getting all courses..."
    try {
        $response = Invoke-ApiRequest -Method GET -Uri "$BaseUrl/courses" -Headers $headers
        if ($response.courses) {
            Write-Success "Get all courses successful"
        } else {
            Write-Error "Get all courses failed"
        }
    }
    catch {
        Write-Error "Get all courses failed: $($_.Exception.Message)"
    }
    
    # Test create course
    Write-Status "Creating new course..."
    $courseData = @{
        title = "Test Course from PowerShell"
        subject = "Matematika"
        kelas = 5
        start_date = "2024-01-15"
        end_date = "2024-06-15"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-ApiRequest -Method POST -Uri "$BaseUrl/courses" -Headers $headers -Body $courseData
        if ($response.course) {
            $script:CourseId = $response.course.id
            Write-Success "Course created with ID: $CourseId"
        } else {
            Write-Error "Course creation failed"
            return $false
        }
    }
    catch {
        Write-Error "Course creation failed: $($_.Exception.Message)"
        return $false
    }
    
    # Test get course detail
    Write-Status "Getting course detail..."
    try {
        $response = Invoke-ApiRequest -Method GET -Uri "$BaseUrl/courses/$CourseId" -Headers $headers
        if ($response.course.title -eq "Test Course from PowerShell") {
            Write-Success "Get course detail successful"
        } else {
            Write-Error "Get course detail failed"
        }
    }
    catch {
        Write-Error "Get course detail failed: $($_.Exception.Message)"
    }
      # Test publish course
    Write-Status "Publishing course..."
    try {
        $response = Invoke-ApiRequest -Method PATCH -Uri "$BaseUrl/courses/$CourseId/publish" -Headers $headers
        Write-Success "Course publish request sent"
    }
    catch {
        Write-Warning "Course publish failed: $($_.Exception.Message)"
    }
    
    # Test archive course
    Write-Status "Archiving course..."
    try {
        $response = Invoke-ApiRequest -Method PATCH -Uri "$BaseUrl/courses/$CourseId/archive" -Headers $headers
        Write-Success "Course archive request sent"
    }
    catch {
        Write-Warning "Course archive failed: $($_.Exception.Message)"
    }
    
    # Test unarchive course
    Write-Status "Unarchiving course..."
    try {
        $response = Invoke-ApiRequest -Method PATCH -Uri "$BaseUrl/courses/$CourseId/unarchive" -Headers $headers
        Write-Success "Course unarchive request sent"
    }
    catch {
        Write-Warning "Course unarchive failed: $($_.Exception.Message)"
    }
    
    return $true
}

# Function to test subcourses
function Test-SubCourses {
    Write-Status "Testing SubCourses endpoints..."
    $headers = @{ Authorization = "Bearer $TeacherToken" }
    
    # Test create subcourse
    Write-Status "Creating subcourse..."
    $subcourseData = @{
        course_id = [int]$CourseId
        title = "Test SubCourse from PowerShell"
        summary = "This is a test subcourse created from PowerShell script"
        content_type = "video"
        content_url = "https://example.com/video.mp4"
        order_in_course = 1
    } | ConvertTo-Json
    
    try {
        $response = Invoke-ApiRequest -Method POST -Uri "$BaseUrl/subcourses" -Headers $headers -Body $subcourseData
        if ($response.subCourse) {
            $script:SubcourseId = $response.subCourse.id
            Write-Success "SubCourse created with ID: $SubcourseId"
        } else {
            Write-Error "SubCourse creation failed"
            return $false
        }
    }
    catch {
        Write-Error "SubCourse creation failed: $($_.Exception.Message)"
        return $false
    }
    
    # Test get subcourses for course
    Write-Status "Getting subcourses for course..."
    try {
        $response = Invoke-ApiRequest -Method GET -Uri "$BaseUrl/subcourses/course/$CourseId" -Headers $headers
        if ($response.subCourses) {
            Write-Success "Get subcourses successful"
        } else {
            Write-Error "Get subcourses failed"
        }
    }
    catch {
        Write-Error "Get subcourses failed: $($_.Exception.Message)"
    }
    
    return $true
}

# Function to test student features
function Test-StudentFeatures {
    Write-Status "Testing Student features..."
    $teacherHeaders = @{ Authorization = "Bearer $TeacherToken" }
    $studentHeaders = @{ Authorization = "Bearer $StudentToken" }
    
    # Get course code first
    try {
        $courseResponse = Invoke-ApiRequest -Method GET -Uri "$BaseUrl/courses/$CourseId" -Headers $teacherHeaders
        $courseCode = $courseResponse.course.course_code
        
        # Test join course
        Write-Status "Student joining course..."
        $joinData = @{ course_code = $courseCode } | ConvertTo-Json
        
        $response = Invoke-ApiRequest -Method POST -Uri "$BaseUrl/courses/join" -Headers $studentHeaders -Body $joinData
        Write-Success "Student join course request sent"
    }
    catch {
        Write-Warning "Student join course failed: $($_.Exception.Message)"
    }
    
    # Test update progress
    Write-Status "Updating student progress..."
    $progressData = @{
        status = "completed"
        score = 85.5
    } | ConvertTo-Json
    
    try {
        $response = Invoke-ApiRequest -Method PATCH -Uri "$BaseUrl/subcourses/$SubcourseId/progress" -Headers $studentHeaders -Body $progressData
        Write-Success "Progress update request sent"
    }
    catch {
        Write-Warning "Progress update failed: $($_.Exception.Message)"
    }
}

# Function to test chat
function Test-Chat {
    Write-Status "Testing Chat endpoints..."
    $headers = @{ Authorization = "Bearer $StudentToken" }
    
    # Test send message to AI
    Write-Status "Sending message to AI..."
    $messageData = @{
        sub_course_id = [int]$SubcourseId
        message = "Bagaimana cara menghitung 2 + 3?"
        message_type = "text"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-ApiRequest -Method POST -Uri "$BaseUrl/chat/message" -Headers $headers -Body $messageData
        if ($response.ai_response) {
            Write-Success "AI chat message successful"
        } else {
            Write-Error "AI chat message failed"
        }
    }
    catch {
        Write-Error "AI chat message failed: $($_.Exception.Message)"
    }
    
    # Test get chat history
    Write-Status "Getting chat history..."
    try {
        $response = Invoke-ApiRequest -Method GET -Uri "$BaseUrl/chat/history/$SubcourseId" -Headers $headers
        if ($response.interactions) {
            Write-Success "Get chat history successful"
        } else {
            Write-Warning "Get chat history returned no data"
        }
    }
    catch {
        Write-Warning "Get chat history failed: $($_.Exception.Message)"
    }
}

# Function to test analytics
function Test-Analytics {
    Write-Status "Testing Analytics endpoints..."
    
    # Test teacher dashboard
    Write-Status "Getting teacher dashboard analytics..."
    $teacherHeaders = @{ Authorization = "Bearer $TeacherToken" }
    
    try {
        $response = Invoke-ApiRequest -Method GET -Uri "$BaseUrl/analytics/dashboard" -Headers $teacherHeaders
        if ($response.summary) {
            Write-Success "Teacher dashboard analytics successful"
        } else {
            Write-Error "Teacher dashboard analytics failed"
        }
    }
    catch {
        Write-Error "Teacher dashboard analytics failed: $($_.Exception.Message)"
    }
    
    # Test student dashboard
    Write-Status "Getting student dashboard analytics..."
    $studentHeaders = @{ Authorization = "Bearer $StudentToken" }
    
    try {
        $response = Invoke-ApiRequest -Method GET -Uri "$BaseUrl/analytics/student/dashboard" -Headers $studentHeaders
        if ($response.summary) {
            Write-Success "Student dashboard analytics successful"
        } else {
            Write-Warning "Student dashboard analytics returned no data"
        }
    }
    catch {
        Write-Warning "Student dashboard analytics failed: $($_.Exception.Message)"
    }
}

# Function to test file upload
function Test-Upload {
    Write-Status "Testing File Upload endpoints..."
    $headers = @{ Authorization = "Bearer $TeacherToken" }
    
    # Create a test file
    $testContent = "This is a test file for upload"
    $testFile = "test-upload.txt"
    $testContent | Out-File -FilePath $testFile -Encoding UTF8
    
    Write-Status "Uploading single file..."
    try {
        # Note: File upload testing in PowerShell requires different approach
        Write-Warning "File upload testing requires manual verification via Postman or frontend"
    }
    catch {
        Write-Error "File upload test failed: $($_.Exception.Message)"
    }
    finally {
        # Clean up test file
        if (Test-Path $testFile) {
            Remove-Item $testFile
        }
    }
}

# Function to test user management
function Test-Users {
    Write-Status "Testing User Management endpoints..."
    $headers = @{ Authorization = "Bearer $TeacherToken" }
    
    # Test get profile
    Write-Status "Getting user profile..."
    try {
        $response = Invoke-ApiRequest -Method GET -Uri "$BaseUrl/users/profile" -Headers $headers
        if ($response.user) {
            Write-Success "Get user profile successful"
        } else {
            Write-Error "Get user profile failed"
        }
    }
    catch {
        Write-Error "Get user profile failed: $($_.Exception.Message)"
    }
    
    # Test update profile
    Write-Status "Updating user profile..."
    $updateData = @{ nama_lengkap = "Updated Teacher Name PowerShell" } | ConvertTo-Json
    
    try {
        $response = Invoke-ApiRequest -Method PUT -Uri "$BaseUrl/users/profile" -Headers $headers -Body $updateData
        Write-Success "Update profile request sent"
    }
    catch {
        Write-Warning "Update profile failed: $($_.Exception.Message)"
    }
}

# Function to run all tests
function Start-AllTests {
    Write-Status "Running complete API test suite..."
    Write-Host "==================================" -ForegroundColor Cyan
    
    if (!(Test-ServerHealth)) {
        exit 1
    }
    
    if (Test-Authentication) {
        Test-Courses
        Test-SubCourses
        Test-StudentFeatures
        Test-Chat
        Test-Analytics
        Test-Upload
        Test-Users
    } else {
        Write-Error "Authentication tests failed. Skipping other tests."
        exit 1
    }
    
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Success "All tests completed!"
}

# Function to show usage
function Show-Usage {
    Write-Host "Kancil AI API Testing Script for PowerShell" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\test-api.ps1 [test_group]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Test Groups:" -ForegroundColor White
    Write-Host "  all        - Run all tests (default)" -ForegroundColor Gray
    Write-Host "  auth       - Test authentication endpoints" -ForegroundColor Gray
    Write-Host "  courses    - Test courses endpoints" -ForegroundColor Gray
    Write-Host "  subcourses - Test subcourses endpoints" -ForegroundColor Gray
    Write-Host "  student    - Test student features" -ForegroundColor Gray
    Write-Host "  chat       - Test chat endpoints" -ForegroundColor Gray
    Write-Host "  analytics  - Test analytics endpoints" -ForegroundColor Gray
    Write-Host "  upload     - Test file upload endpoints" -ForegroundColor Gray
    Write-Host "  users      - Test user management endpoints" -ForegroundColor Gray
    Write-Host "  health     - Test server health" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\test-api.ps1              # Run all tests" -ForegroundColor Gray
    Write-Host "  .\test-api.ps1 auth         # Test only authentication" -ForegroundColor Gray
    Write-Host "  .\test-api.ps1 courses      # Test only courses" -ForegroundColor Gray
}

# Main script execution
switch ($TestGroup.ToLower()) {
    "all" {
        Start-AllTests
    }
    "auth" {
        if (Test-ServerHealth) {
            Test-Authentication
        }
    }
    "courses" {
        if (Test-ServerHealth) {
            if (Test-Authentication) {
                Test-Courses
            }
        }
    }
    "subcourses" {
        if (Test-ServerHealth) {
            if (Test-Authentication) {
                Test-Courses
                Test-SubCourses
            }
        }
    }
    "student" {
        if (Test-ServerHealth) {
            if (Test-Authentication) {
                Test-Courses
                Test-SubCourses
                Test-StudentFeatures
            }
        }
    }
    "chat" {
        if (Test-ServerHealth) {
            if (Test-Authentication) {
                Test-Courses
                Test-SubCourses
                Test-StudentFeatures
                Test-Chat
            }
        }
    }
    "analytics" {
        if (Test-ServerHealth) {
            if (Test-Authentication) {
                Test-Analytics
            }
        }
    }
    "upload" {
        if (Test-ServerHealth) {
            if (Test-Authentication) {
                Test-Upload
            }
        }
    }
    "users" {
        if (Test-ServerHealth) {
            if (Test-Authentication) {
                Test-Users
            }
        }
    }
    "health" {
        Test-ServerHealth
    }
    "help" {
        Show-Usage
    }
    default {
        Write-Error "Unknown test group: $TestGroup"
        Show-Usage
        exit 1
    }
}