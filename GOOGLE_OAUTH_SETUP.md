# Google OAuth Setup Guide

Panduan lengkap untuk setup Google OAuth authentication di Kancil AI backend.

## 🔧 Google Cloud Console Setup

### 1. Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project atau select existing project
3. Enable **Google+ API** dan **Google OAuth2 API**

### 2. Create OAuth 2.0 Credentials
1. Navigate to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
3. Configure OAuth consent screen first (if not done):
   - User Type: **External** (for testing)
   - App name: `Kancil AI`
   - User support email: Your email
   - Developer contact email: Your email

### 3. Configure OAuth Client
1. Application type: **Web application**
2. Name: `Kancil AI Backend`
3. Authorized JavaScript origins:
   ```
   http://localhost:5001
   http://localhost:3000
   ```
4. Authorized redirect URIs:
   ```
   http://localhost:5001/api/auth/google/callback
   ```
5. Click **CREATE**

### 4. Get Credentials
- Copy **Client ID** dan **Client Secret**
- Add to your `.env` file:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 🚀 Backend Setup

### 1. Install Dependencies
```bash
npm install passport passport-google-oauth20
```

### 2. Environment Variables
Add to your `.env` file:
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# URLs
BACKEND_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000

# Session Secret (for session storage)
SESSION_SECRET=your_session_secret_here
```

### 3. Initialize Passport in app.js
Make sure your `app.js` includes:
```javascript
const passport = require('./config/passport');
const session = require('express-session');

// Session middleware (required for OAuth state management)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
```

## 📱 Frontend Integration

### 1. Google OAuth Buttons
Add these links in your frontend:

**For Students:**
```html
<a href="http://localhost:5001/api/auth/google/student">
  Login with Google (Student)
</a>
```


### 2. Handle OAuth Callback
Create a callback page (`/auth/callback`) in your frontend:
```javascript
// React example
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    
    if (token) {
      // Save token to localStorage atau context
      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', role);
      
      // Redirect to dashboard
      navigate(role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard');
    } else {
      // Handle error
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, navigate]);
  
  return <div>Processing login...</div>;
}
```

### 3. Handle OAuth Error
Create error page (`/auth/error`):
```javascript
function AuthError() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('message');
  
  return (
    <div>
      <h2>Authentication Failed</h2>
      <p>Error: {error}</p>
      <a href="/login">Try again</a>
    </div>
  );
}
```

## 🧪 Testing Google OAuth

### 1. Manual Testing
1. Start your backend server: `npm run dev`
2. Open browser and navigate to:
   - Student: `http://localhost:5001/api/auth/
3. Complete Google authentication
4. Should redirect to frontend with token

### 2. Test with Postman
Google OAuth requires browser interaction, so use browser for initial test.
After getting token, you can test other endpoints with the token.

### 3. Frontend Integration Test
1. Add Google OAuth buttons to your login page
2. Click button → redirected to Google
3. Complete authentication → redirected back with token
4. Frontend should save token and redirect to appropriate dashboard

## 🔄 OAuth Flow

```
User clicks "Login with Google"
↓
Frontend redirects to: /api/auth/google/student
↓
Backend redirects to Google OAuth
↓
User completes authentication on Google
↓
Google redirects to: /api/auth/google/callback
↓
Backend processes user data:
- If user exists → update profile
- If new user → create account with role
↓
Backend generates JWT token
↓
Backend redirects to frontend: /auth/callback?token=xxx&role=student
↓
Frontend saves token and redirects to dashboard
```

## 🛠️ User Data Mapping

Google Profile → Kancil AI User:
```javascript
{
  google_id: profile.id,
  nama_lengkap: profile.displayName,
  email: profile.emails[0].value,
  role: 'student' or 'teacher', // From URL parameter
  foto_profil_url: profile.photos[0].value,
  status: 'active',
  kelas: 5, // Default for students
  nama_sekolah: 'Google OAuth User' // Default
}
```

## 🐛 Common Issues

### 1. Invalid Credentials
```
Error: invalid_client
Solution: Check GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET
```

### 2. Redirect URI Mismatch
```
Error: redirect_uri_mismatch
Solution: Add correct callback URL to Google Console
```

### 3. Scope Issues
```
Error: invalid_scope
Solution: Make sure Google+ API is enabled
```

### 4. Session Issues
```
Error: Cannot read property 'googleAuthRole'
Solution: Make sure express-session is configured
```

## 🔐 Security Notes

### 1. Environment Variables
- Never commit Google credentials to git
- Use different credentials for development/production
- Rotate credentials regularly

### 2. Redirect URLs
- Only add trusted domains to authorized redirect URIs
- Use HTTPS in production
- Validate redirect parameters

### 3. User Data
- Only request necessary scopes
- Store minimal user data
- Implement proper data retention policies

## 📊 API Endpoints Summary

### Google OAuth Endpoints:
```
GET /api/auth/google              # General OAuth (defaults to student)
GET /api/auth/google/student      # OAuth for students
GET /api/auth/google/teacher      # OAuth for teachers
GET /api/auth/google/callback     # OAuth callback (handled by Passport)
```

### Regular Auth Endpoints:
```
POST /api/auth/register           # Email/password registration
POST /api/auth/login             # Email/password login
POST /api/auth/logout            # Logout (update timestamp)
GET /api/auth/me                 # Get current user
POST /api/auth/refresh           # Refresh JWT token
```

Google OAuth integration sudah siap! 🎉