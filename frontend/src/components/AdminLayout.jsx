import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Button,
  notification
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
  BellOutlined,
  SearchOutlined,
  TeamOutlined,
  QuestionCircleOutlined,
  TrophyOutlined,
  CalendarOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider } = Layout;
const { Title } = Typography;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get current selected menu key based on path
  const getSelectedKey = () => {
    const pathToKey = {
      '/dashboard': '1',
      '/students': '2',
      '/semesters': '3',
      '/subjects': '4',
      '/exams': '5',
      '/exam-builder': '5-1',
      '/questions': '6',
      '/results': '7',
      '/settings': '8'
    };
    return pathToKey[location.pathname] || '1';
  };

  // Get page title based on current path
  const getPageTitle = () => {
    const pathToTitle = {
      '/dashboard': 'Dashboard',
      '/students': 'Quản lý người dùng',
      '/semesters': 'Quản lý học kỳ',
      '/subjects': 'Quản lý môn học',
      '/exams': 'Quản lý đề thi',
      '/exam-builder': 'Tạo đề thi',
      '/questions': 'Ngân hàng câu hỏi',
      '/results': 'Kết quả quiz',
      '/settings': 'Cài đặt hệ thống'
    };
    return pathToTitle[location.pathname] || 'Dashboard';
  };

  const handleMenuClick = (key) => {
    const routes = {
      '1': '/dashboard',
      '2': '/students',
      '3': '/semesters',
      '4': '/subjects',
      '5': '/exams',
      '5-1': '/exam-builder',
      '6': '/questions',
      '7': '/results',
      '8': '/settings'
    };
    
    if (routes[key]) {
      navigate(routes[key]);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      notification.success({
        message: 'Đăng xuất thành công',
        description: 'Bạn đã đăng xuất khỏi hệ thống',
        placement: 'topRight',
      });
      navigate('/login');
    } catch (error) {
      notification.error({
        message: 'Lỗi đăng xuất',
        description: 'Đã xảy ra lỗi khi đăng xuất',
        placement: 'topRight',
      });
    }
  };

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => handleMenuClick('1')
    },
    {
      key: '2',
      icon: <TeamOutlined />,
      label: 'Quản lý người dùng',
      onClick: () => handleMenuClick('2')
    },
    {
      type: 'divider',
    },
    {
      key: 'management',
      label: 'Quản lý học tập',
      type: 'group',
    },
    {
      key: '3',
      icon: <CalendarOutlined />,
      label: 'Quản lý học kỳ',
      onClick: () => handleMenuClick('3')
    },
    {
      key: '4',
      icon: <BookOutlined />,
      label: 'Quản lý môn học',
      onClick: () => handleMenuClick('4')
    },
    {
      key: '5',
      icon: <FileTextOutlined />,
      label: 'Quản lý đề thi',
      onClick: () => handleMenuClick('5')
    },
    {
      key: '5-1',
      icon: <DatabaseOutlined />,
      label: 'Tạo đề thi',
      onClick: () => handleMenuClick('5-1')
    },
    {
      key: '6',
      icon: <QuestionCircleOutlined />,
      label: 'Ngân hàng câu hỏi',
      onClick: () => handleMenuClick('6')
    },
    {
      type: 'divider',
    },
    {
      key: 'analytics',
      label: 'Thống kê & Báo cáo',
      type: 'group',
    },
    {
      key: '7',
      icon: <TrophyOutlined />,
      label: 'Kết quả quiz',
      onClick: () => handleMenuClick('7')
    },
    {
      type: 'divider',
    },
    {
      key: '8',
      icon: <SettingOutlined />,
      label: 'Cài đặt hệ thống',
      onClick: () => handleMenuClick('8')
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        }}
        width={250}
      >
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '16px'
        }}>
          {!collapsed ? (
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
              Quiz Admin
            </Title>
          ) : (
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
              QA
            </Title>
          )}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{ border: 'none' }}
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Space>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 40, height: 40 }}
            />
            <Title level={4} style={{ margin: 0 }}>
              {getPageTitle()}
            </Title>
          </Space>

          <Space size="middle">
            <Button
              type="text"
              icon={<SearchOutlined />}
              style={{ fontSize: '16px', width: 40, height: 40 }}
            />
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ fontSize: '16px', width: 40, height: 40 }}
            />
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.fullName || user?.username}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Main Content - This will render the page content */}
        <Outlet />
      </Layout>
    </Layout>
  );
};

export default AdminLayout; 