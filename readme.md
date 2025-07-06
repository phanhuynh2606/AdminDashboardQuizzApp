Kiến trúc hệ thống Offline/Online
1. Kiến trúc tổng quan
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Admin Panel   │    │   Push Service  │
│   (Android/iOS) │    │ (React Vite Web)|    │   (Firebase)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Backend API       │
                    │   (Node.js/Express)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Database          │
                    │   (MongoDB + Redis)    │
                    └─────────────────────────┘
2. Quy trình đồng bộ dữ liệu
2.1. Sinh viên làm bài thi (Mobile App)
Online: Gửi kết quả ngay lập tức lên server
Offline: Lưu vào SQLite local, đánh dấu syncStatus: 'pending'
Có mạng lại: Tự động đồng bộ các bài chưa sync
2.2. Xử lý đồng bộ (Backend)
Nhận data từ mobile: Validate và lưu vào database
Xử lý conflict: Kiểm tra trùng lặp dựa trên sessionId
Update sync status: Cập nhật trạng thái đồng bộ
Retry failed syncs: Thử lại các lần đồng bộ thất bại
2.3. Quản lý từ Admin Panel
Xem lịch sử: Hiển thị tất cả lịch sử thi đã đồng bộ
Theo dõi sync: Monitor trạng thái đồng bộ
Retry manual: Thử lại đồng bộ thủ công
Export reports: Xuất báo cáo chi tiết
3. Database Schema cho Offline/Online
3.1. Practice History với Sync Status
javascript
// Trạng thái đồng bộ
syncStatus: {
  type: String,
  enum: ['pending', 'synced', 'failed'],
  default: 'pending'
},

// Metadata để track
metadata: {
  appVersion: String,
  deviceInfo: String,
  networkStatus: String, // 'online' | 'offline'
  syncAttempts: Number,
  lastSyncError: String
}
3.2. Sync Queue Management
javascript
// Hàng đợi đồng bộ
const SyncQueue = {
  student: ObjectId,
  operation: String, // 'create', 'update', 'delete'
  data: Object,      // Dữ liệu cần sync
  priority: Number,  // Mức độ ưu tiên
  retryCount: Number,
  maxRetries: Number,
  status: String,    // 'pending', 'processing', 'success', 'failed'
  createdAt: Date,
  processedAt: Date
}
4. Mobile App Integration
4.1. SQLite Schema (Mobile Local Database)
sql
CREATE TABLE practice_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE,
    student_id TEXT,
    exam_id TEXT,
    score INTEGER,
    total_questions INTEGER,
    correct_answers INTEGER,
    time_spent INTEGER,
    answers TEXT, -- JSON string
    sync_status TEXT DEFAULT 'pending',
    network_status TEXT,
    created_at DATETIME,
    synced_at DATETIME
);

CREATE TABLE sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT,
    operation TEXT,
    data TEXT, -- JSON string
    retry_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at DATETIME
);
4.2. API Endpoints cho Mobile App
javascript
// Đăng ký thiết bị
POST /api/mobile/register
{
  "deviceId": "unique-device-id",
  "studentId": "student-mssv",
  "fcmToken": "firebase-token",
  "deviceInfo": "Android 11, Samsung Galaxy S21"
}

// Nộp bài thi
POST /api/mobile/submit-exam
{
  "sessionId": "unique-session-id",
  "examId": "exam-object-id",
  "studentId": "student-id",
  "score": 85,
  "totalQuestions": 20,
  "correctAnswers": 17,
  "timeSp# TRANG QUẢN TRỊ (ADMIN) - ỨNG DỤNG ÔN TẬP TRẮC NGHIỆM

## Tổng quan dự án

Ứng dụng quản trị cho hệ thống ôn tập trắc nghiệm, cho phép admin quản lý kỳ học, môn học, đề thi, câu hỏi và theo dõi thống kê lịch sử ôn tập của người dùng.

## Công nghệ sử dụng

### Backend
- **Node.js** với **Express.js**
- **MongoDB** với **Mongoose ODM**
- **JWT** cho authentication
- **Multer** cho upload file
- **ExcelJS** cho import/export Excel
- **PDFKit** cho xuất PDF
- **Firebase Admin SDK** cho push notifications
- **node-cron** cho scheduled tasks
- **Redis** cho caching và queue management

### Frontend
- **React.js** với **Create React Vite App**
- **Ant Design (antd)** cho UI components
- **Axios** cho API calls
- **React Router** cho routing
- **React Hook Form** cho form handling

## Cấu trúc thư mục
quiz-admin-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── semester.controller.js
│   │   │   ├── subject.controller.js
│   │   │   ├── examType.controller.js
│   │   │   ├── exam.controller.js
│   │   │   ├── question.controller.js
│   │   │   └── statistics.controller.js
│   │   ├── models/
│   │   │   ├── admin.model.js
│   │   │   ├── semester.model.js
│   │   │   ├── subject.model.js
│   │   │   ├── examType.model.js
│   │   │   ├── exam.model.js
│   │   │   ├── question.model.js
│   │   │   └── practiceHistory.model.js
│   │   ├── routes/
│   │   │   ├── auth.route.js
│   │   │   ├── semester.route.js
│   │   │   ├── subject.route.js
│   │   │   ├── examType.route.js
│   │   │   ├── exam.route.js
│   │   │   ├── question.route.js
│   │   │   └── statistics.route.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── upload.middleware.js
│   │   │   └── validation.middleware.js
│   │   ├── utils/
│   │   │   ├── excel.util.js
│   │   │   ├── pdf.util.js
│   │   │   └── response.util.js
│   │   ├── config/
│   │   │   └── database.js
│   │   └── app.js
│   ├── uploads/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.js
│   │   │   │   ├── Sidebar.js
│   │   │   │   ├── LoadingSpinner.js
│   │   │   │   └── ConfirmModal.js
│   │   │   ├── forms/
│   │   │   │   ├── SemesterForm.js
│   │   │   │   ├── SubjectForm.js
│   │   │   │   ├── ExamTypeForm.js
│   │   │   │   ├── ExamForm.js
│   │   │   │   └── QuestionForm.js
│   │   │   └── tables/
│   │   │       ├── SemesterTable.js
│   │   │       ├── SubjectTable.js
│   │   │       ├── ExamTable.js
│   │   │       └── QuestionTable.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Semesters.js
│   │   │   ├── Subjects.js
│   │   │   ├── ExamTypes.js
│   │   │   ├── Exams.js
│   │   │   ├── Questions.js
│   │   │   └── Statistics.js
│   │   ├── layouts/
│   │   │   ├── AuthLayout.js
│   │   │   └── MainLayout.js
│   │   ├── routes/
│   │   │   ├── AppRoutes.js
│   │   │   ├── PrivateRoute.js
│   │   │   └── PublicRoute.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── auth.service.js
│   │   │   ├── semester.service.js
│   │   │   ├── subject.service.js
│   │   │   ├── examType.service.js
│   │   │   ├── exam.service.js
│   │   │   ├── question.service.js
│   │   │   └── statistics.service.js
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   ├── helpers.js
│   │   │   └── storage.js
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── components.css
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
├── README.md
└── .gitignore


## Tính năng chính

### 1. Xác thực (Authentication)
- **Đăng nhập/Đăng xuất**: Bảo mật với JWT token
- **Middleware xác thực**: Kiểm tra quyền truy cập admin

### 2. Quản lý Kỳ học (Semester Management)
- **CRUD operations**: Thêm, sửa, xóa, hiển thị kỳ học
- **Validation**: Kiểm tra tính hợp lệ của dữ liệu
- **Search & Filter**: Tìm kiếm và lọc theo năm học

### 3. Quản lý Môn học (Subject Management)
- **CRUD operations**: Quản lý môn học theo từng kỳ
- **Relationship**: Liên kết với kỳ học
- **Bulk operations**: Thêm nhiều môn học cùng lúc

### 4. Quản lý Loại đề (Exam Type Management)
- **CRUD operations**: Quản lý các loại đề (Quiz, Midterm, Final, Practice)
- **Flexible configuration**: Cấu hình linh hoạt cho từng loại đề

### 5. Quản lý Đề thi (Exam Management)
- **CRUD operations**: Tạo, sửa, xóa đề thi
- **Import/Export**: Nhập từ Excel, xuất ra Excel/PDF
- **Configuration**: Cấu hình thời gian, số câu hỏi, mô tả

### 6. Quản lý Câu hỏi (Question Management)
- **CRUD operations**: Thêm, sửa, xóa câu hỏi
- **Rich content**: Hỗ trợ hình ảnh, giải thích đáp án
- **Bulk import**: Nhập nhiều câu hỏi từ Excel
- **Question bank**: Thư viện câu hỏi có thể tái sử dụng

### 7. Quản lý Sinh viên (Student Management)
- **CRUD operations**: Thêm, sửa, xóa, hiển thị sinh viên
- **Bulk import**: Nhập danh sách sinh viên từ Excel
- **Device tracking**: Theo dõi thiết bị của sinh viên
- **FCM token management**: Quản lý token cho push notification

### 8. Quản lý Lịch sử thi (Practice History Management)
- **View histories**: Xem lịch sử thi của tất cả sinh viên
- **Filter & search**: Lọc theo sinh viên, môn học, thời gian
- **Export reports**: Xuất báo cáo lịch sử thi
- **Sync management**: Quản lý đồng bộ dữ liệu offline

### 9. Quản lý Thông báo (Notification Management)
- **Push notifications**: Gửi thông báo đến app mobile
- **Scheduled notifications**: Lên lịch gửi thông báo
- **Template management**: Quản lý template thông báo
- **Target audience**: Gửi thông báo theo đối tượng cụ thể

### 10. Quản lý Đồng bộ (Sync Management)
- **Offline sync**: Đồng bộ dữ liệu từ app mobile
- **Retry mechanism**: Thử lại khi đồng bộ thất bại
- **Batch processing**: Xử lý đồng bộ theo batch
- **Status tracking**: Theo dõi trạng thái đồng bộ

## Models (Database Schema)

### Admin Model
```javascript
{
  username: String (unique),
  password: String (hashed),
  email: String,
  role: String (default: 'admin'),
  createdAt: Date,
  updatedAt: Date
}
Semester Model
javascript
{
  name: String (e.g., "Spring 2025"),
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
Subject Model
javascript
{
  name: String,
  code: String,
  description: String,
  semester: ObjectId (ref: Semester),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
ExamType Model
javascript
{
  name: String (e.g., "Quiz", "Midterm", "Final"),
  description: String,
  duration: Number (minutes),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
Exam Model
javascript
{
  title: String,
  description: String,
  subject: ObjectId (ref: Subject),
  examType: ObjectId (ref: ExamType),
  duration: Number (minutes),
  totalQuestions: Number,
  passingScore: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
Notifications Model
javascript
{
  title: String,
  message: String,
  type: {
    type: String,
    enum: ['new_exam', 'exam_reminder', 'system_update', 'general'],
    default: 'general'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'semester', 'subject', 'specific_students'],
    default: 'all'
  },
  targetData: {
    semester: ObjectId (ref: Semester),
    subject: ObjectId (ref: Subject),
    students: [ObjectId] (ref: Student),
    exam: ObjectId (ref: Exam)
  },
  scheduledAt: Date, // Thời gian gửi thông báo
  sentAt: Date,
  isActive: Boolean,
  createdBy: ObjectId (ref: Admin),
  createdAt: Date,
  updatedAt: Date
}
SyncQueue Model (Hàng đợi đồng bộ)
javascript
{
  student: ObjectId (ref: Student),
  dataType: {
    type: String,
    enum: ['practice_history', 'student_profile'],
    required: true
  },
  operation: {
    type: String,
    enum: ['create', 'update', 'delete'],
    required: true
  },
  data: Object, // Dữ liệu cần sync
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed'],
    default: 'pending'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastError: String,
  createdAt: Date,
  processedAt: Date
}
javascript
{
  exam: ObjectId (ref: Exam),
  question: String,
  options: [{
    label: String (A, B, C, D),
    text: String
  }],
  correctAnswer: String,
  explanation: String,
  image: String (URL),
  difficulty: String (easy, medium, hard),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
Student Model
javascript
{
  studentId: String (unique, có thể là MSSV hoặc deviceId),
  name: String,
  email: String,
  class: String,
  deviceId: String, // Để nhận diện thiết bị
  fcmToken: String, // Firebase token cho push notification
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
PracticeHistory Model
javascript
{
  student: ObjectId (ref: Student),
  exam: ObjectId (ref: Exam),
  sessionId: String, // Unique cho mỗi lần thi
  score: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  timeSpent: Number (seconds),
  answers: [{
    question: ObjectId (ref: Question),
    selectedAnswer: String,
    isCorrect: Boolean,
    timeSpent: Number // Thời gian trả lời câu này
  }],
  syncStatus: {
    type: String,
    enum: ['pending', 'synced', 'failed'],
    default: 'pending'
  },
  attemptNumber: Number, // Lần thi thứ mấy của đề này
  startedAt: Date,
  completedAt: Date,
  syncedAt: Date, // Thời gian sync lên server
  isOfflineCompleted: Boolean, // Đánh dấu hoàn thành offline
  metadata: {
    appVersion: String,
    deviceInfo: String,
    networkStatus: String // online/offline khi làm bài
  }
}
API Endpoints
Authentication
POST /api/auth/login - Đăng nhập admin
POST /api/auth/logout - Đăng xuất
GET /api/auth/profile - Lấy thông tin profile
Semesters
GET /api/semesters - Lấy danh sách kỳ học
POST /api/semesters - Tạo kỳ học mới
PUT /api/semesters/:id - Cập nhật kỳ học
DELETE /api/semesters/:id - Xóa kỳ học
Subjects
GET /api/subjects - Lấy danh sách môn học
GET /api/subjects/semester/:semesterId - Lấy môn học theo kỳ
POST /api/subjects - Tạo môn học mới
PUT /api/subjects/:id - Cập nhật môn học
DELETE /api/subjects/:id - Xóa môn học
Exam Types
GET /api/exam-types - Lấy danh sách loại đề
POST /api/exam-types - Tạo loại đề mới
PUT /api/exam-types/:id - Cập nhật loại đề
DELETE /api/exam-types/:id - Xóa loại đề
Exams
GET /api/exams - Lấy danh sách đề thi
GET /api/exams/subject/:subjectId - Lấy đề thi theo môn học
POST /api/exams - Tạo đề thi mới
PUT /api/exams/:id - Cập nhật đề thi
DELETE /api/exams/:id - Xóa đề thi
POST /api/exams/import - Import đề thi từ Excel
GET /api/exams/:id/export - Export đề thi ra Excel/PDF
Questions
GET /api/questions/exam/:examId - Lấy câu hỏi theo đề thi
POST /api/questions - Tạo câu hỏi mới
PUT /api/questions/:id - Cập nhật câu hỏi
DELETE /api/questions/:id - Xóa câu hỏi
POST /api/questions/import - Import câu hỏi từ Excel
POST /api/questions/upload-image - Upload hình ảnh câu hỏi
Statistics
GET /api/statistics/overview - Thống kê tổng quan
GET /api/statistics/exam/:examId - Thống kê theo đề thi
GET /api/statistics/subject/:subjectId - Thống kê theo môn học
GET /api/statistics/student/:studentId - Thống kê theo sinh viên
GET /api/statistics/difficult-questions - Câu hỏi khó nhất
GET /api/statistics/popular-exams - Đề thi phổ biến nhất
GET /api/statistics/export - Export báo cáo thống kê
Students (Quản lý sinh viên)
GET /api/students - Lấy danh sách sinh viên
GET /api/students/:id - Lấy thông tin sinh viên
POST /api/students - Tạo sinh viên mới
PUT /api/students/:id - Cập nhật thông tin sinh viên
DELETE /api/students/:id - Xóa sinh viên
GET /api/students/:id/history - Lịch sử thi của sinh viên
POST /api/students/bulk-import - Import sinh viên từ Excel
Practice History (Lịch sử thi)
GET /api/practice-history - Lấy tất cả lịch sử thi
GET /api/practice-history/student/:studentId - Lịch sử thi theo sinh viên
GET /api/practice-history/exam/:examId - Lịch sử thi theo đề thi
POST /api/practice-history - Tạo lịch sử thi mới (từ app)
PUT /api/practice-history/:id - Cập nhật lịch sử thi
DELETE /api/practice-history/:id - Xóa lịch sử thi
GET /api/practice-history/:id/export - Export lịch sử thi ra PDF/Excel
Sync Management (Quản lý đồng bộ)
POST /api/sync/student/:studentId - Đồng bộ dữ liệu sinh viên
GET /api/sync/pending - Lấy danh sách chờ đồng bộ
POST /api/sync/batch - Đồng bộ theo batch
PUT /api/sync/retry/:id - Thử lại đồng bộ
GET /api/sync/status/:studentId - Trạng thái đồng bộ của sinh viên
Notifications (Thông báo)
GET /api/notifications - Lấy danh sách thông báo
POST /api/notifications - Tạo thông báo mới
PUT /api/notifications/:id - Cập nhật thông báo
DELETE /api/notifications/:id - Xóa thông báo
POST /api/notifications/:id/send - Gửi thông báo
GET /api/notifications/templates - Lấy template thông báo
Mobile App APIs (Cho ứng dụng mobile)
POST /api/mobile/register - Đăng ký thiết bị
POST /api/mobile/login - Đăng nhập sinh viên
GET /api/mobile/exams - Lấy danh sách đề thi
GET /api/mobile/exams/:id/questions - Lấy câu hỏi đề thi
POST /api/mobile/submit-exam - Nộp bài thi
GET /api/mobile/history - Lịch sử thi của sinh viên
POST /api/mobile/sync - Đồng bộ dữ liệu offline
POST /api/mobile/fcm-token - Cập nhật FCM token
Cài đặt và Chạy dự án
Yêu cầu hệ thống
Node.js (v20 trở lên)
MongoDB (v6.4 trở lên)
npm
Backend Setup
bash
cd backend
npm install
.env
# Cấu hình MongoDB connection và JWT secret trong .env
npm run dev
Frontend Setup ( Dùng React Vite) 
bash
cd frontend
npm install
npm start
Environment Variables (.env)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quiz-admin
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10MB

# Sync Configuration
SYNC_RETRY_ATTEMPTS=3
SYNC_BATCH_SIZE=100
SYNC_INTERVAL=300000  # 5 minutes in milliseconds
Tính năng nâng cao
1. Import/Export Excel
Template Excel: Cung cấp template chuẩn cho import
Validation: Kiểm tra dữ liệu khi import
Error handling: Báo lỗi chi tiết khi import thất bại
2. Image Upload
Multer middleware: Xử lý upload hình ảnh
File validation: Kiểm tra định dạng và kích thước file
Storage Cloudinary: Quản lý lưu trữ file upload
3. Advanced Statistics
Real-time analytics: Thống kê theo thời gian thực
Data visualization: Biểu đồ trực quan với Chart.js
Performance insights: Phân tích hiệu suất học tập
4. Push Notifications với Firebase
FCM integration: Gửi thông báo đến app mobile
Targeted notifications: Gửi theo đối tượng cụ thể
Scheduled notifications: Lên lịch gửi thông báo
Template management: Quản lý template thông báo
5. Offline/Online Sync System
Queue management: Hàng đợi đồng bộ với Redis
Retry mechanism: Thử lại khi đồng bộ thất bại
Batch processing: Xử lý đồng bộ theo batch
Conflict resolution: Giải quyết xung đột dữ liệu
6. Student Management
Device tracking: Theo dõi thiết bị sinh viên
Practice history: Lịch sử thi chi tiết
Performance analytics: Phân tích hiệu suất học tập
Bulk operations: Thao tác hàng loạt
7. Advanced Analytics
Real-time statistics: Thống kê theo thời gian thực
Learning patterns: Phân tích mẫu học tập
Performance trends: Xu hướng hiệu suất
Comparative analysis: So sánh giữa các sinh viên/lớp

Tạo feature branch (git checkout -b feature/AmazingFeature)
Commit changes (git commit -m 'Add some AmazingFeature')
Push to branch (git push origin feature/AmazingFeature)
Tạo Pull Request
License
Dự án này được cấp phép theo MIT License - xem file LICENSE để biết thêm chi tiết.

Liên hệ
Email: admin@quizapp.com
GitHub: Quiz Admin App
Changelog
v1.0.0 (2025-01-01)
Tính năng cơ bản: CRUD cho tất cả entities
Authentication với JWT
Import/Export Excel
Thống kê cơ bản
v1.1.0 (Planning)
Advanced analytics
Email notifications
Multi-language support
Mobile responsive improvements
