import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Row,
  Col,
  Divider,
  notification
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);



  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const result = await login(values.email, values.password);
      console.log(result)
      if (result.success) {
        notification.success({
          message: 'Đăng nhập thành công!',
          description: 'Chào mừng bạn đến với Admin Dashboard',
          placement: 'topRight',
        });
        
        // Navigation will be handled by useEffect when isAuthenticated changes
      } else {
        // Handle specific field errors
        if (result.errors) {
        notification.error({
          message: 'Đăng nhập thất bại',
          description: result.errors.general || 'Vui lòng kiểm tra lại thông tin đăng nhập',
          placement: 'topRight',
        });
      }
    }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px'
    }}>
      <Row justify="center" align="middle" style={{ width: '100%' }}>
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          <Card
            style={{
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: 'none',
            }}
            bodyStyle={{
              padding: '40px 32px',
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Header */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <LoginOutlined style={{ fontSize: '32px', color: 'white' }} />
                </div>
                <Title level={2} style={{ margin: '0 0 8px', color: '#1f2937' }}>
                  Admin Dashboard
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Đăng nhập để truy cập hệ thống quản trị
                </Text>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {/* Login Form */}
              <Form
                form={form}
                name="login"
                onFinish={handleSubmit}
                layout="vertical"
                size="large"
                autoComplete="off"
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    {
                      required: true,
                      message: 'Vui lòng nhập email!'
                    },
                    {
                      type: 'email',
                      message: 'Email không hợp lệ!'
                    }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                    placeholder="Nhập email của bạn"
                    autoComplete="email"
                    style={{
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    {
                      required: true,
                      message: 'Vui lòng nhập mật khẩu!'
                    },
                    {
                      min: 6,
                      message: 'Mật khẩu phải có ít nhất 6 ký tự!'
                    }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                    placeholder="Nhập mật khẩu của bạn"
                    autoComplete="current-password"
                    style={{
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: '0' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{
                      height: '48px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      fontSize: '16px',
                      fontWeight: '500'
                    }}
                  >
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Button>
                </Form.Item>
              </Form>

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  © 2025 Quiz Admin System. Được phát triển cho quản trị viên.
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Login; 