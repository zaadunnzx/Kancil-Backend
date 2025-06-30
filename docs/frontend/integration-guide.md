# Frontend Integration Guide

Complete guide for integrating frontend applications with Kancil AI Backend.

## 🚀 Getting Started

### Base API Configuration

```javascript
// config/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT token
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## 🔐 Authentication Integration

### Authentication Context

```javascript
// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginStudent, loginTeacher, getCurrentUser, logoutUser } from '../services/authService';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      getCurrentUser()
        .then((userData) => {
          setUser(userData);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials, userType) => {
    try {
      const loginFn = userType === 'student' ? loginStudent : loginTeacher;
      const userData = await loginFn(credentials.email, credentials.password);
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('userRole', userType);
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/';
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### Protected Routes

```javascript
// components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### Login Components

```javascript
// components/LoginForm.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginForm = ({ userType }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || 
    (userType === 'teacher' ? '/teacher-dashboard' : '/student-dashboard');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(credentials, userType);
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (userType === 'student') {
      window.location.href = `${process.env.REACT_APP_API_URL}/auth/google/student`;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {userType === 'teacher' ? 'Teacher Login' : 'Student Login'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {userType === 'student' && (
        <div className="mt-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Login with Google
          </button>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
```

## 📚 Course Management Integration

### Course Service

```javascript
// services/courseService.js
import apiClient from '../config/api';

export const getCourses = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    
    const response = await apiClient.get(`/courses?${params}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createCourse = async (courseData) => {
  try {
    const response = await apiClient.post('/courses', courseData);
    return response.data.course;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateCourse = async (courseId, updateData) => {
  try {
    const response = await apiClient.put(`/courses/${courseId}`, updateData);
    return response.data.course;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const publishCourse = async (courseId) => {
  try {
    const response = await apiClient.patch(`/courses/${courseId}/publish`);
    return response.data.course;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const archiveCourse = async (courseId) => {
  try {
    const response = await apiClient.patch(`/courses/${courseId}/archive`);
    return response.data.course;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const joinCourse = async (courseCode) => {
  try {
    const response = await apiClient.post('/courses/join', { course_code: courseCode });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### Course Components

```javascript
// components/CourseCard.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CourseCard = ({ course, onUpdate, onJoin }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const isTeacher = user?.role === 'teacher';
  const isOwner = isTeacher && course.teacher_id === user.id_user;

  const handlePublish = async () => {
    setLoading(true);
    try {
      const updatedCourse = await publishCourse(course.id);
      onUpdate?.(updatedCourse);
    } catch (error) {
      alert(error.message || 'Failed to publish course');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this course?')) return;
    
    setLoading(true);
    try {
      const updatedCourse = await archiveCourse(course.id);
      onUpdate?.(updatedCourse);
    } catch (error) {
      alert(error.message || 'Failed to archive course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {course.cover_image_url && (
        <img 
          src={course.cover_image_url} 
          alt={course.title}
          className="w-full h-48 object-cover rounded-md mb-4"
        />
      )}
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-gray-800">{course.title}</h3>
        <p className="text-gray-600">Subject: {course.subject}</p>
        <p className="text-gray-600">Class: {course.kelas}</p>
        {course.teacher && (
          <p className="text-gray-600">Teacher: {course.teacher.nama_lengkap}</p>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {course.subcourses?.length || 0} lessons
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              course.status === 'published' ? 'bg-green-100 text-green-800' :
              course.status === 'archived' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {course.status}
            </span>
          </div>
          
          <div className="flex space-x-2">
            {!isTeacher && course.status === 'published' && (
              <button
                onClick={() => onJoin?.(course.course_code)}
                className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Join Course
              </button>
            )}
            
            {isOwner && (
              <>
                {course.status === 'draft' && (
                  <button
                    onClick={handlePublish}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                  >
                    {loading ? 'Publishing...' : 'Publish'}
                  </button>
                )}
                
                {course.status !== 'archived' && (
                  <button
                    onClick={handleArchive}
                    disabled={loading}
                    className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                  >
                    {loading ? 'Archiving...' : 'Archive'}
                  </button>
                )}
                
                <button
                  onClick={() => window.location.href = `/courses/${course.id}/edit`}
                  className="bg-yellow-500 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
```

## 🤖 AI Chat Integration

### Chat Service

```javascript
// services/chatService.js
import apiClient from '../config/api';

export const sendMessage = async (subCourseId, message, messageType = 'text') => {
  try {
    const response = await apiClient.post('/chat/send-message', {
      sub_course_id: subCourseId,
      message,
      message_type: messageType
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getChatHistory = async (subCourseId) => {
  try {
    const response = await apiClient.get(`/chat/history/${subCourseId}`);
    return response.data.interactions;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const clearChatHistory = async (subCourseId) => {
  try {
    const response = await apiClient.delete(`/chat/clear/${subCourseId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### Chat Component

```javascript
// components/ChatInterface.js
import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, getChatHistory } from '../services/chatService';

const ChatInterface = ({ subCourseId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, [subCourseId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory(subCourseId);
      setMessages(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    const userMessage = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, {
      id: Date.now(),
      student_message: userMessage,
      created_at: new Date().toISOString(),
      isUser: true
    }]);

    try {
      const response = await sendMessage(subCourseId, userMessage);
      
      // Add AI response to chat
      setMessages(prev => [...prev, {
        ...response,
        isUser: false
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now(),
        ai_response: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
        isUser: false,
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow-md">
      {/* Chat Header */}
      <div className="bg-blue-500 text-white p-4 rounded-t-lg">
        <h3 className="font-bold">Chat with Pak Dino</h3>
        <p className="text-sm opacity-90">Ask questions about the lesson</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation with Pak Dino!</p>
            <p className="text-sm">Ask questions about the lesson content.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.isUser
                    ? 'bg-blue-500 text-white'
                    : msg.isError
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">
                  {msg.isUser ? msg.student_message : msg.ai_response}
                </p>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
```

## 📊 Analytics Integration

### Analytics Service

```javascript
// services/analyticsService.js
import apiClient from '../config/api';

export const getTeacherDashboard = async () => {
  try {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStudentDashboard = async () => {
  try {
    const response = await apiClient.get('/analytics/student/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const submitAnalyticsSession = async (sessionData) => {
  try {
    const response = await apiClient.post('/analytics/session', sessionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

## 🔧 Error Handling

### Global Error Handler

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 401:
        return 'You are not authorized. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 422:
        return error.response.data?.message || 'Invalid data provided.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.response.data?.message || 'An unexpected error occurred.';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred.';
  }
};

// Hook for error handling
export const useErrorHandler = () => {
  const [error, setError] = useState(null);

  const handleError = (error) => {
    const message = handleApiError(error);
    setError(message);
    setTimeout(() => setError(null), 5000); // Clear after 5 seconds
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
};
```

## 🎯 Best Practices

### Environment Configuration

```javascript
// .env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_ENVIRONMENT=development

// .env.production
REACT_APP_API_URL=https://api.kancil.com/api
REACT_APP_GOOGLE_CLIENT_ID=your_production_google_client_id
REACT_APP_ENVIRONMENT=production
```

### Code Organization

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   ├── auth/           # Authentication components
│   ├── course/         # Course-related components
│   └── chat/           # Chat components
├── contexts/           # React contexts
├── services/           # API service functions
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── config/             # Configuration files
└── pages/              # Page components
```

### Performance Optimization

```javascript
// Lazy loading for better performance
const TeacherDashboard = React.lazy(() => import('./pages/TeacherDashboard'));
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const CourseDetail = React.lazy(() => import('./pages/CourseDetail'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <TeacherDashboard />
</Suspense>
```

## 🔗 Related Documentation

- [Authentication API](../api/authentication.md) - Backend auth implementation
- [Course API](../api/courses.md) - Course management endpoints
- [State Management](./state-management.md) - Advanced state patterns
- [Components](./components.md) - Reusable component examples

This integration guide provides a solid foundation for building a React frontend that communicates effectively with the Kancil AI Backend! 🚀