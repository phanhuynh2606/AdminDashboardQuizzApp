import React, { useState } from 'react';
import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  Tabs,
  Divider,
  notification,
  TimePicker,
  Upload,
  Alert,
  Badge,
  Tooltip
} from 'antd';
import {
  SettingOutlined,
  MailOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  BellOutlined,
  UserOutlined,
  SaveOutlined,
  ReloadOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [generalForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [backupForm] = Form.useForm();
  const [notificationForm] = Form.useForm();

  // Current settings (mock data)
  const [currentSettings, setCurrentSettings] = useState({
    general: {
      systemName: 'Quiz Admin System',
      systemVersion: '1.0.0',
      timezone: 'Asia/Ho_Chi_Minh',
      language: 'vi',
      maintenanceMode: false,
      allowRegistration: true,
      maxStudentsPerClass: 40,
      sessionTimeout: 30,
      logoUrl: ''
    },
    email: {
      enabled: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'admin@quizapp.com',
      smtpPassword: '',
      senderName: 'Quiz Admin System',
      senderEmail: 'noreply@quizapp.com',
      enableSSL: true
    },
    security: {
      passwordMinLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      sessionExpiry: 60,
      enableTwoFactor: false,
      allowedIPs: ''
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupTime: moment('02:00', 'HH:mm'),
      retentionDays: 30,
      backupLocation: '/backups',
      includeMedia: true
    },
    notifications: {
      emailNotifications: true,
      systemAlerts: true,
      userRegistration: true,
      examCompletion: true,
      systemMaintenance: true,
      lowStorage: true
    }
  });

  // Save settings
  const handleSave = async (section, values) => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setCurrentSettings(prev => ({
          ...prev,
          [section]: { ...prev[section], ...values }
        }));
        
        notification.success({
          message: 'Lưu thành công',
          description: 'Cài đặt đã được cập nhật',
          placement: 'topRight'
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: 'Không thể lưu cài đặt',
        placement: 'topRight'
      });
      setLoading(false);
    }
  };

  // Reset to defaults
  const handleReset = (section) => {
    const forms = { 
      general: generalForm, 
      email: emailForm, 
      security: securityForm, 
      backup: backupForm,
      notifications: notificationForm 
    };
    
    forms[section].setFieldsValue(currentSettings[section]);
    notification.info({
      message: 'Đã khôi phục',
      description: 'Cài đặt đã được khôi phục về giá trị hiện tại',
      placement: 'topRight'
    });
  };

  // General Settings Tab
  const GeneralSettings = () => (
    <Card>
      <Form
        form={generalForm}
        layout="vertical"
        initialValues={currentSettings.general}
        onFinish={(values) => handleSave('general', values)}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Tên hệ thống"
              name="systemName"
              rules={[{ required: true, message: 'Vui lòng nhập tên hệ thống!' }]}
            >
              <Input placeholder="Nhập tên hệ thống" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Phiên bản"
              name="systemVersion"
            >
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Múi giờ"
              name="timezone"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</Option>
                <Option value="Asia/Bangkok">Bangkok (GMT+7)</Option>
                <Option value="Asia/Tokyo">Tokyo (GMT+9)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Ngôn ngữ"
              name="language"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="vi">Tiếng Việt</Option>
                <Option value="en">English</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Số học sinh tối đa/lớp"
              name="maxStudentsPerClass"
              rules={[{ required: true, type: 'number', min: 1, max: 100 }]}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Thời gian chờ phiên (phút)"
              name="sessionTimeout"
              rules={[{ required: true, type: 'number', min: 5, max: 120 }]}
            >
              <InputNumber min={5} max={120} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Chế độ bảo trì"
              name="maintenanceMode"
              valuePropName="checked"
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Cho phép đăng ký"
              name="allowRegistration"
              valuePropName="checked"
            >
              <Switch checkedChildren="Cho phép" unCheckedChildren="Không cho phép" />
            </Form.Item>
          </Col>
        </Row>

        <Space>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            Lưu cài đặt
          </Button>
          <Button onClick={() => handleReset('general')} icon={<ReloadOutlined />}>
            Khôi phục
          </Button>
        </Space>
      </Form>
    </Card>
  );

  // Email Settings Tab
  const EmailSettings = () => (
    <Card>
      <Alert
        message="Cấu hình Email"
        description="Cấu hình máy chủ email để gửi thông báo và xác thực"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Form
        form={emailForm}
        layout="vertical"
        initialValues={currentSettings.email}
        onFinish={(values) => handleSave('email', values)}
      >
        <Form.Item
          label="Kích hoạt email"
          name="enabled"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="SMTP Host"
              name="smtpHost"
              rules={[{ required: true, message: 'Vui lòng nhập SMTP host!' }]}
            >
              <Input placeholder="smtp.gmail.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="SMTP Port"
              name="smtpPort"
              rules={[{ required: true, type: 'number' }]}
            >
              <InputNumber min={1} max={65535} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="SMTP Username"
              name="smtpUser"
              rules={[{ required: true, type: 'email' }]}
            >
              <Input placeholder="your-email@gmail.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="SMTP Password"
              name="smtpPassword"
              rules={[{ required: true }]}
            >
              <Input.Password placeholder="Mật khẩu ứng dụng" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Tên người gửi"
              name="senderName"
              rules={[{ required: true }]}
            >
              <Input placeholder="Quiz Admin System" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Email người gửi"
              name="senderEmail"
              rules={[{ required: true, type: 'email' }]}
            >
              <Input placeholder="noreply@quizapp.com" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Kích hoạt SSL"
          name="enableSSL"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            Lưu cài đặt
          </Button>
          <Button onClick={() => handleReset('email')} icon={<ReloadOutlined />}>
            Khôi phục
          </Button>
          <Button type="default">
            Gửi email thử nghiệm
          </Button>
        </Space>
      </Form>
    </Card>
  );

  // Security Settings Tab
  const SecuritySettings = () => (
    <Card>
      <Alert
        message="Cấu hình Bảo mật"
        description="Thiết lập các chính sách bảo mật cho hệ thống"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={securityForm}
        layout="vertical"
        initialValues={currentSettings.security}
        onFinish={(values) => handleSave('security', values)}
      >
        <Title level={5}>Chính sách mật khẩu</Title>
        
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Độ dài tối thiểu"
              name="passwordMinLength"
              rules={[{ required: true, type: 'number', min: 6, max: 20 }]}
            >
              <InputNumber min={6} max={20} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Yêu cầu chữ hoa"
              name="requireUppercase"
              valuePropName="checked"
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Yêu cầu số"
              name="requireNumbers"
              valuePropName="checked"
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Yêu cầu ký tự đặc biệt"
              name="requireSpecialChars"
              valuePropName="checked"
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <Title level={5}>Bảo mật đăng nhập</Title>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Số lần đăng nhập sai tối đa"
              name="maxLoginAttempts"
              rules={[{ required: true, type: 'number', min: 3, max: 10 }]}
            >
              <InputNumber min={3} max={10} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Thời gian khóa (phút)"
              name="lockoutDuration"
              rules={[{ required: true, type: 'number', min: 5, max: 60 }]}
            >
              <InputNumber min={5} max={60} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Thời gian hết hạn phiên (phút)"
              name="sessionExpiry"
              rules={[{ required: true, type: 'number', min: 15, max: 480 }]}
            >
              <InputNumber min={15} max={480} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Xác thực 2 lớp"
              name="enableTwoFactor"
              valuePropName="checked"
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={
            <span>
              Địa chỉ IP được phép
              <Tooltip title="Danh sách IP được phép truy cập, mỗi IP một dòng. Để trống để cho phép tất cả.">
                <InfoCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
          name="allowedIPs"
        >
          <TextArea
            rows={4}
            placeholder="192.168.1.1&#10;10.0.0.1&#10;..."
          />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            Lưu cài đặt
          </Button>
          <Button onClick={() => handleReset('security')} icon={<ReloadOutlined />}>
            Khôi phục
          </Button>
        </Space>
      </Form>
    </Card>
  );

  // Backup Settings Tab
  const BackupSettings = () => (
    <Card>
      <Form
        form={backupForm}
        layout="vertical"
        initialValues={currentSettings.backup}
        onFinish={(values) => handleSave('backup', values)}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Tự động sao lưu"
              name="autoBackup"
              valuePropName="checked"
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Tần suất sao lưu"
              name="backupFrequency"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="hourly">Mỗi giờ</Option>
                <Option value="daily">Hàng ngày</Option>
                <Option value="weekly">Hàng tuần</Option>
                <Option value="monthly">Hàng tháng</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Thời gian sao lưu"
              name="backupTime"
              rules={[{ required: true }]}
            >
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Lưu trữ (ngày)"
              name="retentionDays"
              rules={[{ required: true, type: 'number', min: 1, max: 365 }]}
            >
              <InputNumber min={1} max={365} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Đường dẫn sao lưu"
          name="backupLocation"
          rules={[{ required: true }]}
        >
          <Input placeholder="/backups" />
        </Form.Item>

        <Form.Item
          label="Bao gồm file media"
          name="includeMedia"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bao gồm" unCheckedChildren="Không bao gồm" />
        </Form.Item>

        <Divider />
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={5}>Sao lưu thủ công</Title>
          <Paragraph>
            Tạo bản sao lưu ngay lập tức bao gồm cơ sở dữ liệu và files hệ thống.
          </Paragraph>
          <Button type="default" icon={<DatabaseOutlined />}>
            Tạo bản sao lưu ngay
          </Button>
        </Space>

        <Space style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            Lưu cài đặt
          </Button>
          <Button onClick={() => handleReset('backup')} icon={<ReloadOutlined />}>
            Khôi phục
          </Button>
        </Space>
      </Form>
    </Card>
  );

  // Notification Settings Tab
  const NotificationSettings = () => (
    <Card>
      <Form
        form={notificationForm}
        layout="vertical"
        initialValues={currentSettings.notifications}
        onFinish={(values) => handleSave('notifications', values)}
      >
        <Title level={5}>Thông báo email</Title>
        
        <Form.Item
          label="Kích hoạt thông báo email"
          name="emailNotifications"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item
            label="Cảnh báo hệ thống"
            name="systemAlerts"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          <Form.Item
            label="Đăng ký người dùng mới"
            name="userRegistration"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          <Form.Item
            label="Hoàn thành bài thi"
            name="examCompletion"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          <Form.Item
            label="Bảo trì hệ thống"
            name="systemMaintenance"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          <Form.Item
            label="Cảnh báo dung lượng thấp"
            name="lowStorage"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Space>

        <Space>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            Lưu cài đặt
          </Button>
          <Button onClick={() => handleReset('notifications')} icon={<ReloadOutlined />}>
            Khôi phục
          </Button>
        </Space>
      </Form>
    </Card>
  );

  const tabItems = [
    {
      key: 'general',
      label: (
        <span>
          <SettingOutlined />
          Tổng quan
        </span>
      ),
      children: <GeneralSettings />
    },
    {
      key: 'email',
      label: (
        <span>
          <MailOutlined />
          Email
        </span>
      ),
      children: <EmailSettings />
    },
    {
      key: 'security',
      label: (
        <span>
          <SecurityScanOutlined />
          Bảo mật
        </span>
      ),
      children: <SecuritySettings />
    },
    {
      key: 'backup',
      label: (
        <span>
          <DatabaseOutlined />
          Sao lưu
        </span>
      ),
      children: <BackupSettings />
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined />
          Thông báo
        </span>
      ),
      children: <NotificationSettings />
    }
  ];

  return (
    <Layout.Content style={{
      margin: '24px',
      padding: '24px',
      background: '#f0f2f5',
      minHeight: 280,
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Cài đặt hệ thống
          </Title>
          <Text type="secondary">
            Quản lý và cấu hình các thiết lập hệ thống
          </Text>
        </div>

        <Tabs
          defaultActiveKey="general"
          items={tabItems}
          size="large"
        />
      </Space>
    </Layout.Content>
  );
};

export default Settings; 