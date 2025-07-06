# TRANG QUẢN TRỊ (ADMIN) - ỨNG DỤNG ÔN TẬP TRẮC NGHIỆM

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

### Frontend
- **React.js** với **Create React App**
- **Ant Design (antd)** cho UI components
- **Axios** cho API calls
- **React Router** cho routing
- **React Hook Form** cho form handling

## Cấu trúc thư mục

```
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
```

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

### 7. Thống kê và Báo cáo (Statistics & Reports)
- **Practice analytics**: Thống kê lượt luyện tập
- **Performance metrics**: Điểm trung bình, tỷ lệ đúng/sai
- **Question analysis**: Phân tích câu hỏi khó, dễ
- **Export reports**: Xuất báo cáo ra Excel/PDF

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
```

### Semester Model
```javascript
{
  name: String (e.g., "Spring 2025"),
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Subject Model
```javascript
{
  name: String,
  code: String,
  description: String,
  semester: ObjectId (ref: Semester),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### ExamType Model
```javascript
{
  name: String (e.g., "Quiz", "Midterm", "Final"),
  description: String,
  duration: Number (minutes),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Exam Model
```javascript
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
```

### Question Model
```javascript
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
```

### PracticeHistory Model
```javascript
{
  exam: ObjectId (ref: Exam),
  sessionId: String,
  score: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  timeSpent: Number (seconds),
  answers: [{
    question: ObjectId (ref: Question),
    selectedAnswer: String,
    isCorrect: Boolean
  }],
  completedAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập admin
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/profile` - Lấy thông tin profile

### Semesters
- `GET /api/semesters` - Lấy danh sách kỳ học
- `POST /api/semesters` - Tạo kỳ học mới
- `PUT /api/semesters/:id` - Cập nhật kỳ học
- `DELETE /api/semesters/:id` - Xóa kỳ học

### Subjects
- `GET /api/subjects` - Lấy danh sách môn học
- `GET /api/subjects/semester/:semesterId` - Lấy môn học theo kỳ
- `POST /api/subjects` - Tạo môn học mới
- `PUT /api/subjects/:id` - Cập nhật môn học
- `DELETE /api/subjects/:id` - Xóa môn học

### Exam Types
- `GET /api/exam-types` - Lấy danh sách loại đề
- `POST /api/exam-types` - Tạo loại đề mới
- `PUT /api/exam-types/:id` - Cập nhật loại đề
- `DELETE /api/exam-types/:id` - Xóa loại đề

### Exams
- `GET /api/exams` - Lấy danh sách đề thi
- `GET /api/exams/subject/:subjectId` - Lấy đề thi theo môn học
- `POST /api/exams` - Tạo đề thi mới
- `PUT /api/exams/:id` - Cập nhật đề thi
- `DELETE /api/exams/:id` - Xóa đề thi
- `POST /api/exams/import` - Import đề thi từ Excel
- `GET /api/exams/:id/export` - Export đề thi ra Excel/PDF

### Questions
- `GET /api/questions/exam/:examId` - Lấy câu hỏi theo đề thi
- `POST /api/questions` - Tạo câu hỏi mới
- `PUT /api/questions/:id` - Cập nhật câu hỏi
- `DELETE /api/questions/:id` - Xóa câu hỏi
- `POST /api/questions/import` - Import câu hỏi từ Excel
- `POST /api/questions/upload-image` - Upload hình ảnh câu hỏi

### Statistics
- `GET /api/statistics/overview` - Thống kê tổng quan
- `GET /api/statistics/exam/:examId` - Thống kê theo đề thi
- `GET /api/statistics/subject/:subjectId` - Thống kê theo môn học
- `GET /api/statistics/difficult-questions` - Câu hỏi khó nhất
- `GET /api/statistics/export` - Export báo cáo thống kê

## Cài đặt và Chạy dự án

### Yêu cầu hệ thống
- Node.js (v14 trở lên)
- MongoDB (v4.4 trở lên)
- npm hoặc yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Cấu hình MongoDB connection và JWT secret trong .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Environment Variables (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quiz-admin
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10MB
```

## Tính năng nâng cao

### 1. Import/Export Excel
- **Template Excel**: Cung cấp template chuẩn cho import
- **Validation**: Kiểm tra dữ liệu khi import
- **Error handling**: Báo lỗi chi tiết khi import thất bại

### 2. Image Upload
- **Multer middleware**: Xử lý upload hình ảnh
- **File validation**: Kiểm tra định dạng và kích thước file
- **Storage management**: Quản lý lưu trữ file upload

### 3. Advanced Statistics
- **Real-time analytics**: Thống kê theo thời gian thực
- **Data visualization**: Biểu đồ trực quan với Chart.js
- **Performance insights**: Phân tích hiệu suất học tập

### 4. Security Features
- **JWT Authentication**: Bảo mật với token
- **Rate limiting**: Giới hạn số request
- **Input validation**: Kiểm tra dữ liệu đầu vào
- **CORS configuration**: Cấu hình CORS an toàn

## Testing

### Backend Testing
```bash
cd backend
npm test
npm run test:watch
npm run test:coverage
```

### Frontend Testing
```bash
cd frontend
npm test
npm run test:coverage
```

## Deployment

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
```

### Docker Deployment
```bash
docker-compose up -d
```

## Đóng góp (Contributing)

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## License

Dự án này được cấp phép theo MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## Liên hệ

- Email: admin@quizapp.com
- GitHub: [Quiz Admin App](https://github.com/your-username/quiz-admin-app)

## Changelog

### v1.0.0 (2025-01-01)
- Tính năng cơ bản: CRUD cho tất cả entities
- Authentication với JWT
- Import/Export Excel
- Thống kê cơ bản

### v1.1.0 (Planning)
- Advanced analytics
- Email notifications
- Multi-language support
- Mobile responsive improvements