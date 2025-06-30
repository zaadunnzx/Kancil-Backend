# Authentication API

Complete authentication system with JWT tokens and Google OAuth integration.

## 🔐 Student Authentication

### Login with Email/Password
```javascript
export const loginStudent = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login/student', {
      email,
      password
    });
    
    // Store token
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('userRole', 'student');
    
    return response.data.user;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### Google OAuth Login
```javascript
export const loginWithGoogle = () => {
  window.location.href = `${API_BASE_URL}/auth/google/student`;
};

// Handle OAuth callback
export const handleGoogleCallback = async (code) => {
  try {
    const response = await apiClient.get(`/auth/google/student/callback?code=${code}`);
    localStorage.setItem('authToken', response.data.token);
    return response.data.user;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

## 👨‍🏫 Teacher Authentication

### Login (Email/Password Only)
```javascript
export const loginTeacher = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login/teacher', {
      email,
      password
    });
    
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('userRole', 'teacher');
    
    return response.data.user;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

## 📱 React Authentication Context

```javascript
// contexts/AuthContext.js
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      getCurrentUser().then(setUser).catch(() => {
        localStorage.removeItem('authToken');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);
  
  const login = async (credentials, role) => {
    const loginFn = role === 'student' ? loginStudent : loginTeacher;
    const userData = await loginFn(credentials.email, credentials.password);
    setUser(userData);
    return userData;
  };
  
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    setUser(null);
    window.location.href = '/';
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 🔒 Protected Routes

```javascript
// components/ProtectedRoute.js
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```

## 📋 API Endpoints

### Student Login
```http
POST /api/auth/login/student
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id_user": "uuid",
    "nama_lengkap": "Student Name",
    "email": "student@example.com",
    "role": "student",
    "kelas": 5,
    "nama_sekolah": "SD Example",
    "foto_profil_url": "https://example.com/photo.jpg"
  }
}
```

### Teacher Login
```http
POST /api/auth/login/teacher
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "password123"
}
```

### Google OAuth (Students Only)
```http
GET /api/auth/google/student
# Redirects to Google OAuth, then back to frontend
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## 🔄 OAuth Flow

### Student Google OAuth Flow
```
1. Frontend: User clicks "Login with Google" 
2. Redirect to: GET /api/auth/google/student
3. Google authentication page
4. Google redirects to: /api/auth/google/student/callback
5. Backend processes user:
   - New user → Create student account  
   - Existing user → Verify & login
6. Redirect to: {FRONTEND_URL}/auth/callback?token=xxx&role=student
7. Frontend processes token and redirects to dashboard
```

### Teacher Google OAuth (Blocked)
```
1. Frontend: User clicks teacher Google login
2. Redirect to: GET /api/auth/google/teacher  
3. Backend immediately redirects to: 
   {FRONTEND_URL}/auth/error?message=teacher_oauth_not_allowed
4. Frontend shows error message
```

## 🚨 Error Handling

```javascript
// Common authentication errors
const handleAuthError = (error) => {
  switch (error.status) {
    case 401:
      return 'Invalid credentials';
    case 403:
      return 'Access denied';
    case 429:
      return 'Too many login attempts. Please try again later.';
    default:
      return 'Login failed. Please try again.';
  }
};
```

### Common Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Invalid credentials | Wrong email/password |
| 401 | Invalid student credentials | Student endpoint with non-student account |
| 401 | Invalid teacher credentials | Teacher endpoint with non-teacher account |
| 401 | Account is not active | User account is disabled |
| 403 | This account is not authorized as {role} | Role mismatch in general login |

## 🎯 Frontend Integration Examples

### Login Form Component
```javascript
const LoginForm = ({ userType }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(credentials, userType);
      navigate(userType === 'teacher' ? '/teacher-dashboard' : '/student-dashboard');
    } catch (error) {
      alert(handleAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={credentials.email}
        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      
      {userType === 'student' && (
        <button type="button" onClick={loginWithGoogle}>
          Login with Google
        </button>
      )}
    </form>
  );
};
```

### OAuth Callback Handler
```javascript
// pages/AuthCallback.js
const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const error = searchParams.get('error');
    
    if (error) {
      navigate(`/login?error=${error}`);
      return;
    }
    
    if (token && role) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', role);
      navigate(role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard');
    } else {
      navigate('/login?error=authentication_failed');
    }
  }, [searchParams, navigate]);
  
  return <div>Processing authentication...</div>;
};
```

## 🔐 Security Features

### Token Management
- **JWT tokens** with configurable expiration
- **Refresh token** mechanism for long sessions
- **Secure storage** recommendations for frontend
- **Automatic token cleanup** on logout

### Role-Based Access
- **Student-specific endpoints** blocked for teachers
- **Teacher-only endpoints** require teacher role
- **Course ownership validation** for teacher actions
- **Enrollment validation** for student access

### OAuth Security
- **Students only** can use Google OAuth
- **Teachers blocked** from OAuth authentication
- **Secure callback handling** with state validation
- **Profile data validation** from OAuth providers

## 🧪 Testing Authentication

### Manual Testing
```bash
# Test student login
curl -X POST http://localhost:5001/api/auth/login/student \
  -H "Content-Type: application/json" \
  -d '{"email": "student1@kancil.com", "password": "student123"}'

# Test teacher login
curl -X POST http://localhost:5001/api/auth/login/teacher \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@kancil.com", "password": "teacher123"}'
```

### Postman Testing
1. Import collection from `postman/Kancil_AI_Complete_Collection.json`
2. Use "Authentication" folder for login requests
3. Token will be automatically saved for subsequent requests
4. Test role-specific endpoints to verify authorization

## 🔗 Related Documentation

- [API Overview](./README.md) - API base configuration
- [Course Management](./courses.md) - Protected course endpoints
- [Testing Guide](./testing.md) - Authentication testing strategies
- [Frontend Integration](../frontend/authentication.md) - Frontend implementation details