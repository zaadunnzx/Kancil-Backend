# API Testing Manual - Fixed Endpoints

## ✅ Fixed API Endpoints

### 1. **Change Password API**
```
PUT {{baseUrl}}/users/change-password
Content-Type: application/json

Body:
{
  "old_password": "teacher123",
  "new_password": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password changed successfully",
  "timestamp": "2024-12-01T12:00:00.000Z"
}
```

### 2. **Upload Profile Photo API**
```
POST {{baseUrl}}/upload/profile-photo
Content-Type: multipart/form-data

Body (form-data):
- foto_profil: [file] (image file: JPEG, PNG, GIF, WebP - Max 5MB)
```

**Response:**
```json
{
  "message": "Profile photo uploaded successfully",
  "foto_profil_url": "http://localhost:5001/uploads/profile-12345-67890.jpg",
  "user": {
    "id": "uuid",
    "nama_lengkap": "User Name",
    "email": "user@example.com",
    "role": "student",
    "foto_profil_url": "http://localhost:5001/uploads/profile-12345-67890.jpg"
  }
}
```

## 🧪 Testing Instructions

### **1. Test Change Password**

**With curl:**
```bash
# First login to get token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@kancil.com", "password": "teacher123"}' \
  | jq -r '.token')

# Then change password
curl -X PUT http://localhost:5001/api/users/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "teacher123",
    "new_password": "newpassword123"
  }'
```

**With Postman:**
1. Login first with teacher account
2. Use "Change Password" request
3. Update body with current and new password
4. Send request

### **2. Test Upload Profile Photo**

**With curl:**
```bash
# Login first to get token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student1@kancil.com", "password": "student123"}' \
  | jq -r '.token')

# Upload profile photo
curl -X POST http://localhost:5001/api/upload/profile-photo \
  -H "Authorization: Bearer $TOKEN" \
  -F "foto_profil=@/path/to/your/photo.jpg"
```

**With Postman:**
1. Login first with any account
2. Use "Upload Profile Photo" request
3. Select file in form-data with key "foto_profil"
4. Send request

## 🔧 Common Issues & Solutions

### **Change Password Issues:**
- **401 Unauthorized**: Login token expired, login again
- **400 Bad Request**: Check old_password and new_password fields
- **401 Current password incorrect**: Verify old password is correct

### **Upload Photo Issues:**
- **400 No file uploaded**: Make sure file is attached with key "foto_profil"
- **400 Invalid file type**: Use only JPEG, PNG, GIF, WebP files
- **413 File too large**: Keep file size under 5MB

## 📁 File Structure

Both endpoints are now properly implemented:
- `routes/users.js` - Contains change password endpoint
- `routes/upload.js` - Contains profile photo upload endpoint
- `server.js` - Routes are properly registered

## ✅ Verification

**Check if endpoints are working:**

1. **Health Check:**
```bash
curl http://localhost:5001/api/health
```

2. **List all routes (if you have route debugging):**
```bash
# The server should now respond to:
# PUT /api/users/change-password
# POST /api/upload/profile-photo
```

3. **Test with simple requests:**
```bash
# Should return 401 (need auth) not 404 (route not found)
curl -X PUT http://localhost:5001/api/users/change-password
curl -X POST http://localhost:5001/api/upload/profile-photo
```

Both APIs are now fixed and ready for testing! 🎉