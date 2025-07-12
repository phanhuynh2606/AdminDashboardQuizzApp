# API TEST FILE - Quiz Admin Auth (2-Role System)

## 1. REGISTER ADMIN (Web Only)

POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "admin01",
  "email": "admin@example.com",
  "password": "password123",
  "fullName": "Admin User",
  "role": "admin",
  "deviceType": "web"
}

## 2. REGISTER STUDENT (Android Only)

POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "student01",
  "email": "student@example.com",
  "password": "password123",
  "fullName": "Student User",
  "role": "student",
  "deviceType": "android"
}

## 3. LOGIN ADMIN (Web)

POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123",
  "deviceType": "web"
}

## 4. LOGIN STUDENT (Android)

POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123",
  "deviceType": "android"
}

## 5. ADMIN DASHBOARD (Web Only)

GET http://localhost:5000/api/admin/dashboard
Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN

## 6. STUDENT EXAMS (Android Only)

GET http://localhost:5000/api/student/exams
Authorization: Bearer YOUR_STUDENT_ACCESS_TOKEN

## 7. STUDENT PROFILE (Android Only)

GET http://localhost:5000/api/student/profile
Authorization: Bearer YOUR_STUDENT_ACCESS_TOKEN

## 8. REFRESH TOKEN

### Admin (Web - uses cookie)
POST http://localhost:5000/api/auth/refresh-token
Content-Type: application/json

{}

### Student (Android - uses body)
POST http://localhost:5000/api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}

## 9. LOGOUT

### Admin (Web)
POST http://localhost:5000/api/auth/logout
Content-Type: application/json

{}

### Student (Android)
POST http://localhost:5000/api/auth/logout
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}

## ROLE & PLATFORM RESTRICTIONS:

### ✅ ALLOWED:
- Admin + Web → Web dashboard access
- Student + Android → Mobile app access

### ❌ BLOCKED:
- Admin + Android → "Admin can only access via web dashboard"
- Student + Web → "Students can only access via mobile app"

## ERROR RESPONSES:

### Invalid Role-Platform Combination:
```json
{
  "success": false,
  "message": "Invalid access method",
  "errors": {
    "general": "Admin can only access via web dashboard"
  }
}
```

### Platform Access Denied:
```json
{
  "success": false,
  "message": "Web access required",
  "errors": {
    "general": "This feature is only available for admin via web dashboard"
  }
}
```

## SYSTEM ARCHITECTURE:

📱 **Android App (Students)**:
- Login/Register with `deviceType: "android"`
- Access student-specific endpoints
- Store refresh token in app storage

🌐 **Web Dashboard (Admin)**:
- Login/Register with `deviceType: "web"`
- Access admin-specific endpoints
- HTTP-only cookies for refresh token

## SECURITY FEATURES:

1. **Role-Platform Binding**: Admin=Web, Student=Android
2. **Access Control**: Platform-specific middleware
3. **Token Management**: Different strategies per platform
4. **Validation**: Strict role-device validation
5. **Separation**: Clear API endpoint separation
