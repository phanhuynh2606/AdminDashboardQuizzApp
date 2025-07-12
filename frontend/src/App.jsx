import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentManagement from './pages/StudentManagement';
import SemesterManagement from './pages/SemesterManagement';
import SubjectManagement from './pages/SubjectManagement';
import ExamManagement from './pages/ExamManagement';
import ExamBuilder from './pages/ExamBuilder';
import QuestionManagement from './pages/QuestionManagement';
import Settings from './pages/Settings';

// Configure Ant Design theme
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

export default function App() {
  return (
    <ConfigProvider locale={viVN} theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes with Admin Layout */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="semesters" element={<SemesterManagement />} />
              <Route path="subjects" element={<SubjectManagement />} />
              <Route path="exams" element={<ExamManagement />} />
              <Route path="exam-builder" element={<ExamBuilder />} />
              <Route path="exam-builder/:id" element={<ExamBuilder />} />
              <Route path="questions" element={<QuestionManagement />} />
              <Route path="results" element={<div style={{ padding: '24px' }}>Kết quả quiz - Đang phát triển</div>} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}
