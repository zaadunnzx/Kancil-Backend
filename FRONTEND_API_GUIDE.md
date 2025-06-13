# Dokumentasi API Kancil AI Backend untuk Frontend

Panduan lengkap untuk mengintegrasikan frontend dengan backend API Kancil AI.

## 🔧 Base Configuration

```javascript
// config/api.js
const API_BASE_URL = 'http://localhost:5001/api';

// Axios instance with default config
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor untuk handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Redirect based on current path
      if (window.location.pathname.includes('/teacher')) {
        window.location.href = '/teacher/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## 🔐 Authentication API

### 1. Register Student (with Optional Profile Photo)

```javascript
// Register student with optional photo upload
export const registerStudent = async (userData, photoFile) => {
  try {
    const formData = new FormData();
    
    // Add required fields for student
    formData.append('nama_lengkap', userData.fullName);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('role', 'student');
    formData.append('kelas', userData.grade.toString());
    
    if (userData.schoolName) {
      formData.append('nama_sekolah', userData.schoolName);
    }
    
    // Add photo file if provided (optional)
    if (photoFile) {
      formData.append('foto_profil', photoFile);
    }

    const response = await apiClient.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Register teacher (no photo required)
export const registerTeacher = async (userData) => {
  try {
    const formData = new FormData();
    
    // Add required fields for teacher
    formData.append('nama_lengkap', userData.fullName);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('role', 'teacher');
    
    if (userData.schoolName) {
      formData.append('nama_sekolah', userData.schoolName);
    }

    const response = await apiClient.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Validate photo before upload
const validatePhoto = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
  }
  
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB');
  }
  
  return true;
};

// Student Registration Component
const StudentRegistrationForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    grade: '',
    schoolName: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        validatePhoto(file);
        setPhotoFile(file);
        setError('');
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target.result);
        reader.readAsDataURL(file);
      } catch (error) {
        setError(error.message);
        setPhotoFile(null);
        setPhotoPreview(null);
        event.target.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await registerStudent(formData, photoFile);
      
      console.log('Student registration successful:', result);
      
      // Auto-login after registration
      localStorage.setItem('authToken', result.token);
      
      // Redirect to student dashboard
      navigate('/student/dashboard');
      
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <h2>Student Registration</h2>
      
      {error && (
        <div className="error-message" style={{color: 'red', marginBottom: '10px'}}>
          {error}
        </div>
      )}
      
      {/* Profile Photo Upload - Optional */}
      <div className="photo-upload-section">
        <label>Profile Photo (Optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          disabled={loading}
        />
        {photoPreview && (
          <div className="photo-preview">
            <img 
              src={photoPreview} 
              alt="Preview" 
              style={{
                width: '100px', 
                height: '100px', 
                borderRadius: '50%',
                objectFit: 'cover',
                marginTop: '10px'
              }} 
            />
          </div>
        )}
        <small style={{display: 'block', color: '#666', marginTop: '5px'}}>
          Max 5MB. Allowed: JPEG, PNG, GIF, WebP
        </small>
      </div>

      <input
        type="text"
        placeholder="Full Name *"
        value={formData.fullName}
        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
        required
        disabled={loading}
      />
      
      <input
        type="email"
        placeholder="Email *"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
        disabled={loading}
      />
      
      <input
        type="password"
        placeholder="Password (min 6 characters) *"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
        minLength={6}
        disabled={loading}
      />
      
      <select
        value={formData.grade}
        onChange={(e) => setFormData({...formData, grade: parseInt(e.target.value)})}
        required
        disabled={loading}
      >
        <option value="">Select Grade *</option>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
          <option key={grade} value={grade}>Grade {grade}</option>
        ))}
      </select>
      
      <input
        type="text"
        placeholder="School Name (optional)"
        value={formData.schoolName}
        onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
        disabled={loading}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register Student'}
      </button>

      <div className="form-note">
        <small>* Required fields</small><br/>
        <small>📸 Profile photo is optional and can be added later</small>
      </div>

      <p className="login-link">
        Already have an account? <a href="/login">Login here</a>
      </p>
    </form>
  );
};

// Teacher Registration Component
const TeacherRegistrationForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    schoolName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await registerTeacher(formData);
      
      console.log('Teacher registration successful:', result);
      
      // Auto-login after registration
      localStorage.setItem('authToken', result.token);
      
      // Redirect to teacher dashboard
      navigate('/teacher/dashboard');
      
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <h2>Teacher Registration</h2>
      
      {error && (
        <div className="error-message" style={{color: 'red', marginBottom: '10px'}}>
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Full Name *"
        value={formData.fullName}
        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
        required
        disabled={loading}
      />
      
      <input
        type="email"
        placeholder="Email *"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
        disabled={loading}
      />
      
      <input
        type="password"
        placeholder="Password (min 6 characters) *"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
        minLength={6}
        disabled={loading}
      />
      
      <input
        type="text"
        placeholder="School Name (optional)"
        value={formData.schoolName}
        onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
        disabled={loading}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register Teacher'}
      </button>

      <div className="form-note">
        <small>* Required fields</small><br/>
        <small>👨‍🏫 Teachers can add profile photo later from profile settings</small>
      </div>

      <p className="login-link">
        Already have an account? <a href="/teacher/login">Login here</a>
      </p>
    </form>
  );
};
```

### 2. Login - Role-specific Endpoints

```javascript
// Student-specific Login
export const loginStudent = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login/student', {
      email,
      password
    });
    
    localStorage.setItem('authToken', response.data.token);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Teacher-specific Login
export const loginTeacher = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login/teacher', {
      email,
      password
    });
    
    localStorage.setItem('authToken', response.data.token);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan di Student Login Page
const StudentLoginPage = () => {
  const navigate = useNavigate();
  
  const handleEmailLogin = async (email, password) => {
    try {
      const result = await loginStudent(email, password);
      console.log('Student login successful:', result.user);
      navigate('/student/dashboard');
    } catch (error) {
      console.error('Student login failed:', error.message);
      alert('Login failed: ' + error.message);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth for students
    window.location.href = `${API_BASE_URL}/auth/google/student`;
  };

  return (
    <div className="student-login">
      <h2>Student Login</h2>
      
      {/* Email/Password Form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        handleEmailLogin(email, password);
      }}>
        <input 
          type="email" 
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login with Email</button>
      </form>

      {/* Google OAuth Button */}
      <button onClick={handleGoogleLogin} className="google-login-btn">
        Login with Google
      </button>
    </div>
  );
};

// Penggunaan di Teacher Login Page
const TeacherLoginPage = () => {
  const navigate = useNavigate();
  
  const handleLogin = async (email, password) => {
    try {
      const result = await loginTeacher(email, password);
      console.log('Teacher login successful:', result.user);
      navigate('/teacher/dashboard');
    } catch (error) {
      console.error('Teacher login failed:', error.message);
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div className="teacher-login">
      <h2>Teacher Login</h2>
      
      {/* Only Email/Password - No Google OAuth */}
      <form onSubmit={(e) => {
        e.preventDefault();
        handleLogin(email, password);
      }}>
        <input 
          type="email" 
          placeholder="Teacher Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
        <p className="note">
        Teachers can only login with email/password.
        Google OAuth is only available for student accounts.
      </p>
    </div>
  );
};
```

### 3. Google OAuth (Students Only) - Auto Profile Photo

```javascript
// Google OAuth untuk student saja - otomatis dapat foto dari Google
export const googleLoginStudent = () => {
  window.location.href = `${API_BASE_URL}/auth/google/student`;
};

// Handle OAuth callback (di component callback)
export const handleGoogleCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const role = urlParams.get('role');
  
  if (token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    return { success: true, role };
  }
  return { success: false };
};

// Google OAuth Button Component
const GoogleOAuthButton = () => {
  const handleGoogleLogin = () => {
    // Redirect to Google OAuth for students
    // Backend will automatically use Google profile photo
    window.location.href = `${API_BASE_URL}/auth/google/student`;
  };

  return (
    <button onClick={handleGoogleLogin} className="google-oauth-btn">
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
      <small style={{display: 'block', fontSize: '0.8em', color: '#666'}}>
        Profile photo automatically imported
      </small>
    </button>
  );
};

// Student Login Page with Both Options
const StudentLoginPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="student-login">
      <h2>Student Login</h2>
      
      {/* Google OAuth Option - Auto gets profile photo */}
      <div className="oauth-section">
        <GoogleOAuthButton />
        <p className="oauth-note">
          ✨ Quick registration with Google account<br/>
          📸 Profile photo automatically imported
        </p>
      </div>

      <div className="divider">
        <span>OR</span>
      </div>

      {/* Email/Password Option */}
      <div className="email-login-section">
        <EmailPasswordLogin />
        <p className="register-link">
          New student? <a href="/register">Create account with photo</a>
        </p>
      </div>
    </div>
  );
};
```

### 4. Logout

```javascript
export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    // Still remove token even if API call fails
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    throw error.response?.data || error;
  }
};

// Penggunaan
const handleLogout = async () => {
  try {
    await logoutUser();
    // Redirect to appropriate login page
    if (userRole === 'teacher') {
      navigate('/teacher/login');
    } else {
      navigate('/login');
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect even if logout API fails
    navigate('/login');
  }
};
```

```javascript
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data.user;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan untuk authentication check
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, loading };
};
```

## 📚 Courses API

### 1. Get All Courses

```javascript
// services/courseService.js
export const getCourses = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.kelas) params.append('kelas', filters.kelas);
    if (filters.teacher_id) params.append('teacher_id', filters.teacher_id);
    
    const response = await apiClient.get(`/courses?${params}`);
    return response.data.courses;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan di component
const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesData = await getCourses({ subject: 'Matematika' });
        setCourses(coursesData);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div>
      {courses.map(course => (
        <div key={course.id}>
          <h3>{course.title}</h3>
          <p>Kelas: {course.kelas} | Subject: {course.subject}</p>
          <p>Code: {course.course_code}</p>
        </div>
      ))}
    </div>
  );
};
```

### 2. Create Course (Teacher)

```javascript
export const createCourse = async (courseData) => {
  try {
    const response = await apiClient.post('/courses', {
      title: courseData.title,
      subject: courseData.subject, // 'Matematika' | 'IPA' | 'IPS'
      kelas: courseData.grade,
      start_date: courseData.startDate,
      end_date: courseData.endDate
    });
    
    return response.data.course;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan di form
const CreateCourseForm = () => {
  const handleSubmit = async (formData) => {
    try {
      const newCourse = await createCourse(formData);
      console.log('Course created:', newCourse);
      // Redirect atau update state
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };
};
```

### 3. Join Course (Student)

```javascript
export const joinCourse = async (courseCode) => {
  try {
    const response = await apiClient.post('/courses/join', {
      course_code: courseCode
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan
const JoinCourseModal = () => {
  const [courseCode, setCourseCode] = useState('');

  const handleJoin = async () => {
    try {
      await joinCourse(courseCode);
      alert('Successfully joined course!');
      // Refresh course list
    } catch (error) {
      alert('Failed to join course: ' + error.message);
    }
  };
};
```

### 4. Get Course Detail

```javascript
export const getCourseDetail = async (courseId) => {
  try {
    const response = await apiClient.get(`/courses/${courseId}`);
    return response.data.course;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### 5. Update Course (Teacher)

```javascript
export const updateCourse = async (courseId, updateData) => {
  try {
    const response = await apiClient.put(`/courses/${courseId}`, updateData);
    return response.data.course;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### 6. Publish Course (Teacher)

```javascript
export const publishCourse = async (courseId) => {
  try {
    const response = await apiClient.patch(`/courses/${courseId}/publish`);
    return response.data.course;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

**Archive Course:**
```javascript
export const archiveCourse = async (courseId) => {
  try {
    const response = await apiClient.patch(`/courses/${courseId}/archive`);
    return response.data.course;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

**Unarchive Course:**
```javascript
export const unarchiveCourse = async (courseId) => {
  try {
    const response = await apiClient.patch(`/courses/${courseId}/unarchive`);
    return response.data.course;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

## 📖 SubCourses API

### 1. Get SubCourses for Course

```javascript
// services/subCourseService.js
export const getSubCourses = async (courseId) => {
  try {
    const response = await apiClient.get(`/subcourses/course/${courseId}`);
    return response.data.subCourses;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan
const CourseContent = ({ courseId }) => {
  const [subCourses, setSubCourses] = useState([]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const content = await getSubCourses(courseId);
        setSubCourses(content);
      } catch (error) {
        console.error('Failed to fetch course content:', error);
      }
    };

    fetchContent();
  }, [courseId]);

  return (
    <div>
      {subCourses.map(subCourse => (
        <div key={subCourse.id}>
          <h4>{subCourse.title}</h4>
          <p>{subCourse.summary}</p>
          <span>Type: {subCourse.content_type}</span>
          {subCourse.progress && (
            <div>Progress: {subCourse.progress.status}</div>
          )}
        </div>
      ))}
    </div>
  );
};
```

### 2. Create SubCourse (Teacher)

```javascript
export const createSubCourse = async (subCourseData) => {
  try {
    const response = await apiClient.post('/subcourses', {
      course_id: subCourseData.courseId,
      title: subCourseData.title,
      summary: subCourseData.summary,
      content_type: subCourseData.contentType, // 'video' | 'pdf_material' | 'quiz' | 'interactive'
      content_url: subCourseData.contentUrl,
      order_in_course: subCourseData.order
    });
    
    return response.data.subCourse;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### 3. Update Progress (Student)

```javascript
export const updateProgress = async (subCourseId, progressData) => {
  try {
    const response = await apiClient.patch(`/subcourses/${subCourseId}/progress`, {
      status: progressData.status, // 'in_progress' | 'completed'
      score: progressData.score // opsional
    });
    
    return response.data.progress;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan saat student menyelesaikan materi
const handleCompleteLesson = async (subCourseId, score = null) => {
  try {
    await updateProgress(subCourseId, {
      status: 'completed',
      score: score
    });
    
    // Update UI atau redirect ke lesson berikutnya
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
};
```

## 💬 Chat/AI API

### 1. Send Message to AI

```javascript
// services/chatService.js
export const sendMessageToAI = async (subCourseId, message, messageType = 'text') => {
  try {
    const response = await apiClient.post('/chat/message', {
      sub_course_id: subCourseId,
      message: message,
      message_type: messageType
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan di chat component
const ChatInterface = ({ subCourseId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message to UI
    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await sendMessageToAI(subCourseId, inputMessage);
      
      // Add AI response to UI
      const aiMessage = {
        type: 'ai',
        content: response.ai_response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            <p>{msg.content}</p>
            <small>{msg.timestamp.toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
      
      <div className="input-area">
        <input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Tanya Pak Dino..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};
```

### 2. Get Chat History

```javascript
export const getChatHistory = async (subCourseId) => {
  try {
    const response = await apiClient.get(`/chat/history/${subCourseId}`);
    return response.data.interactions;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Load chat history saat component mount
useEffect(() => {
  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory(subCourseId);
      const formattedMessages = history.map(interaction => ([
        {
          type: 'user',
          content: interaction.student_message_text,
          timestamp: new Date(interaction.interaction_timestamp)
        },
        {
          type: 'ai',
          content: interaction.ai_response_text,
          timestamp: new Date(interaction.interaction_timestamp)
        }
      ])).flat();
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  loadChatHistory();
}, [subCourseId]);
```

## 📊 Analytics API

### 1. Teacher Dashboard Analytics

```javascript
// services/analyticsService.js
export const getTeacherDashboard = async () => {
  try {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan di teacher dashboard
const TeacherDashboard = () => {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getTeacherDashboard();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    fetchAnalytics();
  }, []);

  if (!analytics) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <div className="summary-cards">
        <div className="card">
          <h3>Total Courses</h3>
          <p>{analytics.summary.totalCourses}</p>
        </div>
        <div className="card">
          <h3>Published Courses</h3>
          <p>{analytics.summary.publishedCourses}</p>
        </div>
        <div className="card">
          <h3>Total Students</h3>
          <p>{analytics.summary.totalStudents}</p>
        </div>
      </div>

      <div className="completion-rates">
        <h3>Course Completion Rates</h3>
        {analytics.completionRates.map(course => (
          <div key={course.course_title}>
            <span>{course.course_title}</span>
            <span>{Math.round((course.completed_students / course.total_students) * 100)}%</span>
          </div>
        ))}
      </div>

      <div className="recent-interactions">
        <h3>Recent Chat Interactions</h3>
        {analytics.recentInteractions.map(interaction => (
          <div key={interaction.id}>
            <span>{interaction.student.nama_lengkap}</span>
            <span>{interaction.subCourse.title}</span>
            <span>{new Date(interaction.interaction_timestamp).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 2. Student Analytics

```javascript
export const getStudentAnalytics = async (courseId = null) => {
  try {
    const params = courseId ? `?course_id=${courseId}` : '';
    const response = await apiClient.get(`/analytics/students${params}`);
    return response.data.students;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### 3. Student Dashboard

```javascript
export const getStudentDashboard = async () => {
  try {
    const response = await apiClient.get('/analytics/student/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan di student dashboard
const StudentDashboard = () => {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getStudentDashboard();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    fetchAnalytics();
  }, []);

  if (!analytics) return <div>Loading...</div>;

  return (
    <div className="student-dashboard">
      <div className="progress-summary">
        <h2>Your Progress</h2>
        <div className="stats">
          <div>Enrolled Courses: {analytics.summary.enrolledCourses}</div>
          <div>Completed Lessons: {analytics.summary.completedSubCourses}</div>
          <div>In Progress: {analytics.summary.inProgressSubCourses}</div>
          <div>Average Score: {analytics.summary.averageScore}%</div>
        </div>
      </div>

      <div className="recent-progress">
        <h3>Recent Activity</h3>
        {analytics.recentProgress.map(progress => (
          <div key={progress.id}>
            <span>{progress.subCourse.title}</span>
            <span>{progress.subCourse.course.title}</span>
            <span>{progress.status}</span>
            <span>{new Date(progress.last_accessed_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 📢 Announcements API

### 1. Create Announcement (Teacher)

```javascript
// services/announcementService.js
export const createAnnouncement = async (announcementData, attachmentFile) => {
  try {
    const formData = new FormData();
    
    // Add required fields
    formData.append('title', announcementData.title);
    formData.append('content', announcementData.content);
    
    // Add optional fields
    if (announcementData.courseId) {
      formData.append('course_id', announcementData.courseId);
    }
    if (announcementData.priority) {
      formData.append('priority', announcementData.priority);
    }
    if (announcementData.expiresAt) {
      formData.append('expires_at', announcementData.expiresAt);
    }
    
    // Add file attachment if provided
    if (attachmentFile) {
      formData.append('attachment', attachmentFile);
    }
    // Or add link attachment
    else if (announcementData.attachmentUrl) {
      formData.append('attachment_url', announcementData.attachmentUrl);
    }

    const response = await apiClient.post('/announcements', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create announcement with link only (no file)
export const createAnnouncementWithLink = async (announcementData) => {
  try {
    const response = await apiClient.post('/announcements', announcementData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Announcement creation form component
const CreateAnnouncementForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    courseId: '',
    priority: 'medium',
    expiresAt: '',
    attachmentUrl: ''
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentType, setAttachmentType] = useState('none'); // 'none', 'file', 'link'
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only images (JPEG, PNG, GIF) and PDF files are allowed');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert('File size must be less than 10MB');
        return;
      }
      
      setAttachmentFile(file);
      setAttachmentType('file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      
      if (attachmentType === 'file' && attachmentFile) {
        result = await createAnnouncement(formData, attachmentFile);
      } else if (attachmentType === 'link' && formData.attachmentUrl) {
        result = await createAnnouncementWithLink(formData);
      } else {
        result = await createAnnouncementWithLink(formData);
      }
      
      console.log('Announcement created:', result);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        courseId: '',
        priority: 'medium',
        expiresAt: '',
        attachmentUrl: ''
      });
      setAttachmentFile(null);
      setAttachmentType('none');
      
      alert('Announcement created successfully!');
    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert('Failed to create announcement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="announcement-form">
      <h2>Create Announcement</h2>
      
      <input
        type="text"
        placeholder="Announcement Title *"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        required
      />
      
      <textarea
        placeholder="Announcement Content *"
        value={formData.content}
        onChange={(e) => setFormData({...formData, content: e.target.value})}
        rows={4}
        required
      />
      
      <select
        value={formData.courseId}
        onChange={(e) => setFormData({...formData, courseId: e.target.value})}
      >
        <option value="">All Students (Global Announcement)</option>
        {courses.map(course => (
          <option key={course.id} value={course.id}>
            {course.title} ({course.course_code})
          </option>
        ))}
      </select>
      
      <select
        value={formData.priority}
        onChange={(e) => setFormData({...formData, priority: e.target.value})}
      >
        <option value="low">Low Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="high">High Priority</option>
      </select>
      
      <input
        type="datetime-local"
        placeholder="Expires At (Optional)"
        value={formData.expiresAt}
        onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
      />
      
      {/* Attachment Type Selector */}
      <div className="attachment-section">
        <label>Attachment (Optional):</label>
        <div className="attachment-type-selector">
          <label>
            <input
              type="radio"
              value="none"
              checked={attachmentType === 'none'}
              onChange={(e) => setAttachmentType(e.target.value)}
            />
            No Attachment
          </label>
          <label>
            <input
              type="radio"
              value="file"
              checked={attachmentType === 'file'}
              onChange={(e) => setAttachmentType(e.target.value)}
            />
            Upload File
          </label>
          <label>
            <input
              type="radio"
              value="link"
              checked={attachmentType === 'link'}
              onChange={(e) => setAttachmentType(e.target.value)}
            />
            Add Link
          </label>
        </div>
        
        {attachmentType === 'file' && (
          <div className="file-upload">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
            />
            {attachmentFile && (
              <p>Selected: {attachmentFile.name}</p>
            )}
            <small>Max 10MB. Allowed: Images (JPEG, PNG, GIF) and PDF</small>
          </div>
        )}
        
        {attachmentType === 'link' && (
          <input
            type="url"
            placeholder="https://example.com/link"
            value={formData.attachmentUrl}
            onChange={(e) => setFormData({...formData, attachmentUrl: e.target.value})}
          />
        )}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Announcement'}
      </button>
    </form>
  );
};
```

### 2. Get Announcements

```javascript
export const getAnnouncements = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.courseId) params.append('course_id', filters.courseId);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await apiClient.get(`/announcements?${params}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get announcements for specific course
export const getCourseAnnouncements = async (courseId, limit = 5) => {
  try {
    const response = await apiClient.get(`/announcements/course/${courseId}?limit=${limit}`);
    return response.data.announcements;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Announcements list component
const AnnouncementsList = ({ courseId = null }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await getAnnouncements({ 
          courseId,
          page: 1,
          limit: 10 
        });
        setAnnouncements(data.announcements);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [courseId]);

  const renderAttachment = (announcement) => {
    if (!announcement.attachment_url) return null;

    switch (announcement.attachment_type) {
      case 'image':
        return (
          <div className="attachment">
            <img 
              src={`${API_BASE_URL}${announcement.attachment_url}`} 
              alt="Attachment"
              style={{ maxWidth: '200px', maxHeight: '200px' }}
            />
          </div>
        );
      case 'pdf':
        return (
          <div className="attachment">
            <a 
              href={`${API_BASE_URL}${announcement.attachment_url}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="pdf-link"
            >
              📄 {announcement.attachment_filename}
            </a>
          </div>
        );
      case 'link':
        return (
          <div className="attachment">
            <a 
              href={announcement.attachment_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="external-link"
            >
              🔗 Open Link
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#44aa44';
      default: return '#666666';
    }
  };

  if (loading) return <div>Loading announcements...</div>;

  return (
    <div className="announcements-list">
      <h2>Announcements</h2>
      
      {announcements.length === 0 ? (
        <p>No announcements available.</p>
      ) : (
        <div className="announcements">
          {announcements.map(announcement => (
            <div key={announcement.id} className="announcement-card">
              <div className="announcement-header">
                <h3 className="announcement-title">{announcement.title}</h3>
                <span 
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(announcement.priority) }}
                >
                  {announcement.priority.toUpperCase()}
                </span>
              </div>
              
              <div className="announcement-meta">
                <span>By: {announcement.teacher.nama_lengkap}</span>
                {announcement.course && (
                  <span> • Course: {announcement.course.title}</span>
                )}
                <span> • {new Date(announcement.announcement_date).toLocaleDateString()}</span>
              </div>
              
              <div className="announcement-content">
                <p>{announcement.content}</p>
              </div>
              
              {renderAttachment(announcement)}
              
              {announcement.expires_at && (
                <div className="expiry-notice">
                  Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={pagination.page === 1}
            onClick={() => loadPage(pagination.page - 1)}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button 
            disabled={pagination.page === pagination.totalPages}
            onClick={() => loadPage(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
```

### 3. Update Announcement (Teacher)

```javascript
export const updateAnnouncement = async (announcementId, updateData, attachmentFile) => {
  try {
    const formData = new FormData();
    
    // Add update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        formData.append(key, updateData[key]);
      }
    });
    
    // Add file attachment if provided
    if (attachmentFile) {
      formData.append('attachment', attachmentFile);
    }

    const response = await apiClient.put(`/announcements/${announcementId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### 4. Delete Announcement (Teacher)

```javascript
export const deleteAnnouncement = async (announcementId) => {
  try {
    await apiClient.delete(`/announcements/${announcementId}`);
    return true;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### 5. Toggle Active Status

```javascript
export const toggleAnnouncementStatus = async (announcementId) => {
  try {
    const response = await apiClient.patch(`/announcements/${announcementId}/toggle-active`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

## 📁 File Upload API

### 1. Upload Single File

```javascript
// services/uploadService.js
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.file;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan di component
const FileUploader = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedFile = await uploadFile(file);
      onUploadSuccess(uploadedFile);
      console.log('File uploaded:', uploadedFile.url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileSelect}
        accept="image/*,video/*,.pdf"
        disabled={uploading}
      />
      {uploading && <span>Uploading...</span>}
    </div>
  );
};
```

### 2. Upload Multiple Files

```javascript
export const uploadMultipleFiles = async (files) => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await apiClient.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.files;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### 3. Delete File

```javascript
export const deleteFile = async (filename) => {
  try {
    await apiClient.delete(`/upload/${filename}`);
    return true;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

## 👤 User Management API

### 1. Get User Profile

```javascript
// services/userService.js
export const getUserProfile = async () => {
  try {
    const response = await apiClient.get('/users/profile');
    return response.data.user;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### 2. Update Profile

```javascript
export const updateProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data.user;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan di profile form
const ProfileForm = () => {
  const [profile, setProfile] = useState({});

  const handleSave = async () => {
    try {
      const updatedProfile = await updateProfile(profile);
      console.log('Profile updated:', updatedProfile);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };
};
```

### 3. Change Password

```javascript
export const changePassword = async (oldPassword, newPassword) => {
  try {
    await apiClient.put('/users/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    });
    return true;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

## 🔍 Real-time Features

### 1. Health Check

```javascript
export const checkServerHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Penggunaan untuk monitoring koneksi
const useServerStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await checkServerHealth();
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      }
    };

    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return isOnline;
};
```

## 🎯 Complete Integration Examples

### 1. Login Flow with Redirect

```javascript
// components/LoginForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loginUser(email, password);
      
      // Redirect based on role
      if (result.user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

### 2. Course Learning Interface

```javascript
// components/LearningInterface.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSubCourses, updateProgress } from '../services/subCourseService';
import ChatInterface from './ChatInterface';

const LearningInterface = () => {
  const { courseId } = useParams();
  const [subCourses, setSubCourses] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const lessons = await getSubCourses(courseId);
        setSubCourses(lessons);
      } catch (error) {
        console.error('Failed to load course:', error);
      }
    };

    loadCourse();
  }, [courseId]);

  const handleCompleteLesson = async () => {
    try {
      await updateProgress(subCourses[currentLesson].id, {
        status: 'completed'
      });

      // Move to next lesson
      if (currentLesson < subCourses.length - 1) {
        setCurrentLesson(currentLesson + 1);
      }

      // Refresh progress
      const updatedLessons = await getSubCourses(courseId);
      setSubCourses(updatedLessons);
    } catch (error) {
      console.error('Failed to complete lesson:', error);
    }
  };

  if (subCourses.length === 0) return <div>Loading...</div>;

  const lesson = subCourses[currentLesson];

  return (
    <div className="learning-interface">
      <div className="lesson-content">
        <h2>{lesson.title}</h2>
        <p>{lesson.summary}</p>
        
        {lesson.content_type === 'video' && (
          <video controls src={lesson.content_url} />
        )}
        
        {lesson.content_type === 'pdf_material' && (
          <iframe src={lesson.content_url} width="100%" height="600px" />
        )}

        <div className="lesson-controls">
          <button
            onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))}
            disabled={currentLesson === 0}
          >
            Previous
          </button>
          
          <button onClick={handleCompleteLesson}>
            Complete Lesson
          </button>
          
          <button
            onClick={() => setCurrentLesson(Math.min(subCourses.length - 1, currentLesson + 1))}
            disabled={currentLesson === subCourses.length - 1}
          >
            Next
          </button>
        </div>
      </div>

      <div className="sidebar">
        <button onClick={() => setShowChat(!showChat)}>
          {showChat ? 'Hide' : 'Show'} Pak Dino Chat
        </button>
        
        {showChat && (
          <ChatInterface subCourseId={lesson.id} />
        )}

        <div className="lesson-list">
          <h3>Lessons</h3>
          {subCourses.map((subCourse, index) => (
            <div
              key={subCourse.id}
              className={`lesson-item ${index === currentLesson ? 'active' : ''}`}
              onClick={() => setCurrentLesson(index)}
            >
              <span>{subCourse.title}</span>
              {subCourse.progress?.status === 'completed' && <span>✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 3. Teacher Course Management

```javascript
// components/TeacherCourseManager.jsx
import { useState, useEffect } from 'react';
import { getCourses, createCourse, publishCourse } from '../services/courseService';
import { createSubCourse } from '../services/subCourseService';

const TeacherCourseManager = () => {
  const [courses, setCourses] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const handleCreateCourse = async (courseData) => {
    try {
      await createCourse(courseData);
      setShowCreateForm(false);
      loadCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };

  const handlePublishCourse = async (courseId) => {
    try {
      await publishCourse(courseId);
      loadCourses();
    } catch (error) {
      console.error('Failed to publish course:', error);
    }
  };

  return (
    <div className="course-manager">
      <div className="header">
        <h2>My Courses</h2>
        <button onClick={() => setShowCreateForm(true)}>
          Create New Course
        </button>
      </div>

      <div className="courses-grid">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <h3>{course.title}</h3>
            <p>Subject: {course.subject} | Grade: {course.kelas}</p>
            <p>Code: {course.course_code}</p>
            <p>Status: {course.status}</p>
            
            <div className="course-actions">
              <button onClick={() => navigate(`/teacher/course/${course.id}/edit`)}>
                Edit
              </button>
              
              {course.status === 'draft' && (
                <button onClick={() => handlePublishCourse(course.id)}>
                  Publish
                </button>
              )}
              
              <button onClick={() => navigate(`/teacher/course/${course.id}/analytics`)}>
                Analytics
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <CreateCourseModal
          onSubmit={handleCreateCourse}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};
```

## 🚨 Error Handling Best Practices

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.error || 'Bad request';
      case 401:
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return 'Authentication required';
      case 403:
        return 'Access denied';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.error || 'An error occurred';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    return error.message || 'An unexpected error occurred';
  }
};

// Penggunaan dalam component
const MyComponent = () => {
  const [error, setError] = useState('');

  const handleAction = async () => {
    try {
      await someApiCall();
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    }
  };

  return (
    <div>
      {error && <div className="error-message">{error}</div>}
      {/* Component content */}
    </div>
  );
};
```

## 📱 Environment Configuration

```javascript
// config/environment.js
const config = {
  development: {
    API_BASE_URL: 'http://localhost:5001/api',
    SOCKET_URL: 'http://localhost:5001',
  },
  production: {
    API_BASE_URL: 'https://api.kancilai.com/api',
    SOCKET_URL: 'https://api.kancilai.com',
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

## 🎯 Sample Login Credentials untuk Testing

```javascript
// Sample accounts untuk testing
const SAMPLE_ACCOUNTS = {
  teacher: {
    email: 'teacher@kancil.com',
    password: 'teacher123'
  },
  students: [
    { email: 'student1@kancil.com', password: 'student123' },
    { email: 'student2@kancil.com', password: 'student123' },
    { email: 'student3@kancil.com', password: 'student123' }
  ]
};

// Available endpoints
const AVAILABLE_ENDPOINTS = {
  login: {
    student: 'POST /api/auth/login/student',
    teacher: 'POST /api/auth/login/teacher'
  },
  oauth: {
    student: 'GET /api/auth/google/student'
    // Note: No OAuth for teachers
  }
};

// Sample course codes
const SAMPLE_COURSE_CODES = ['MATH01', 'IPA01'];
```

---

## 🚀 Quick Start Integration

1. **Setup API client** dengan axios dan interceptors
2. **Implement role-specific authentication** dengan JWT token management
3. **Create service functions** untuk setiap endpoint
4. **Handle errors** dengan proper user feedback
5. **Use React hooks** untuk state management
6. **Implement real-time features** untuk chat dan progress updates

### 🔐 Available Authentication Endpoints:
- ✅ `POST /api/auth/login/student` (Email/Password + Google OAuth support)
- ✅ `POST /api/auth/login/teacher` (Email/Password only)
- ✅ `GET /api/auth/google/student` (Google OAuth for students only)
- ❌ ~~General login endpoints~~ (Removed for cleaner architecture)
- ❌ ~~Google OAuth for teachers~~ (Teachers use email/password only)

Backend API sudah ready dan fully functional untuk semua fitur frontend Kancil AI! 🎉

## 🎯 Route Configuration untuk Login System Baru

### **Frontend Routes yang Perlu Dibuat**

```javascript
// src/App.jsx atau routes configuration
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StudentLoginPage from './pages/auth/StudentLoginPage';
import TeacherLoginPage from './pages/auth/TeacherLoginPage';
import AuthCallback from './pages/auth/AuthCallback';
import AuthError from './pages/auth/AuthError';
import StudentDashboard from './pages/student/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Student Routes */}
        <Route path="/login" element={<StudentLoginPage />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        
        {/* Teacher Routes */}
        <Route path="/teacher/login" element={<TeacherLoginPage />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        
        {/* Auth Callback & Error Routes */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/error" element={<AuthError />} />
        
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};
```

### **Protected Route Component**

```javascript
// components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect to appropriate login page based on current path
    if (window.location.pathname.includes('/teacher')) {
      return <Navigate to="/teacher/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Role not allowed, redirect to appropriate dashboard
    if (user.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
```

---

## 🔐 Authentication Context untuk State Management

```javascript
// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logoutUser } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to get current user:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      
      // Redirect based on user role
      if (user?.role === 'teacher') {
        window.location.href = '/teacher/login';
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      setUser(null);
      window.location.href = '/login';
    }
  };

  const isTeacher = () => user?.role === 'teacher';
  const isStudent = () => user?.role === 'student';

  const value = {
    user,
    loading,
    login,
    logout,
    isTeacher,
    isStudent,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 📱 Complete Page Components

### **Student Login Page**

```javascript
// pages/auth/StudentLoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginStudent, googleLoginStudent } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

const StudentLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await loginStudent(email, password);
      login(result.user);
      navigate('/student/dashboard');
    } catch (error) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    googleLoginStudent();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Student Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your Kancil AI learning dashboard
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Email address"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in with Email'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Are you a teacher?{' '}
            <a href="/teacher/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLoginPage;
```

### **Teacher Login Page**

```javascript
// pages/auth/TeacherLoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginTeacher } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

const TeacherLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await loginTeacher(email, password);
      login(result.user);
      navigate('/teacher/dashboard');
    } catch (error) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Teacher Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your Kancil AI teaching dashboard
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Teacher email address"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800 text-sm text-center">
            <strong>Note:</strong> Teachers can only login with email/password. 
            Google OAuth is not available for teacher accounts.
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Are you a student?{' '}
            <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherLoginPage;
```