import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Modal,
  Form,
  notification,
  Popconfirm,
  Tooltip,
  Divider,
  DatePicker,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  FilterOutlined,
  MoreOutlined,
  PushpinOutlined,
  BellOutlined
} from '@ant-design/icons';
import notificationService from '../services/notificationService'; // We'll create this service later
import moment from 'moment';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [form] = Form.useForm();

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    targetAudience: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    loadNotifications();
  }, [filters]);

  const loadNotifications = async () => {
    setTableLoading(true);
    try {
      const response = await notificationService.getNotifications(filters);
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setPagination({
          current: response.data.pagination?.currentPage || 1,
          pageSize: response.data.pagination?.limit || 10,
          total: response.data.pagination?.total || 0
        });
      } else {
        notification.error({
          message: 'Lỗi tải dữ liệu',
          description: response.message
        });
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: 'Không thể tải danh sách thông báo'
      });
    } finally {
      setTableLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleTableChange = (pagination, sorter) => {
    setFilters(prev => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
      sortBy: sorter.field || 'createdAt',
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc'
    }));
  };

  const handleCreateEdit = (notificationData = null) => {
    setSelectedNotification(notificationData);
    setModalType(notificationData ? 'edit' : 'create');
    setModalVisible(true);
    
    if (notificationData) {
      form.setFieldsValue({
        ...notificationData,
        scheduledAt: notificationData.scheduledAt ? moment(notificationData.scheduledAt) : null,
        expiredAt: notificationData.expiredAt ? moment(notificationData.expiredAt) : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        type: 'info',
        priority: 'medium',
        category: 'announcement',
        targetAudience: 'all',
        isActive: true,
        isPinned: false,
      });
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let response;
      if (modalType === 'create') {
        response = await notificationService.createNotification(values);
      } else {
        response = await notificationService.updateNotification(selectedNotification._id, values);
      }

      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        setModalVisible(false);
        loadNotifications();
      } else {
        notification.error({
          message: 'Lỗi',
          description: response.message
        });
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: 'Không thể lưu thông báo'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        loadNotifications();
      } else {
        notification.error({
          message: 'Lỗi',
          description: response.message
        });
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: 'Không thể xóa thông báo'
      });
    }
  };

  const getTagColor = (type) => {
    switch (type) {
      case 'success': return 'green';
      case 'info': return 'blue';
      case 'warning': return 'orange';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'cyan';
      case 'medium': return 'geekblue';
      case 'high': return 'volcano';
      case 'urgent': return 'red';
      default: return 'default';
    }
  };

  const getTextAudience = (audience) => {
    switch (audience) {
      case 'all': return 'Tất cả';
      case 'admin': return 'Admin';
      case 'student': return 'Sinh viên';
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 50,
      render: (_, __, index) => (
        <Text strong>{(pagination.current - 1) * pagination.pageSize + index + 1}</Text>
      )
    },
    {
      title: 'Tiêu đề & Nội dung',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (text, record) => (
        <Space direction="vertical" size="small" style={{ maxWidth: '280px' }}>
          <Text strong>{text}</Text>
          <Text type="secondary" ellipsis={{ rows: 2, expandable: false }}>
            {record.message}
          </Text>
        </Space>
      )
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => (
        <Tag color={getTagColor(type)}>{type}</Tag>
      )
    },
    {
      title: 'Đối tượng',
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      width: 100,
      render: (audience) => (
        <Tag color="purple">{getTextAudience(audience)}</Tag>
      )
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const isVisible = record.isActive && (!record.scheduledAt || moment(record.scheduledAt).isSameOrBefore()) && (!record.expiredAt || moment(record.expiredAt).isAfter());
        return (
          <Tag color={isVisible ? 'green' : 'red'}>
            {isVisible ? 'Hiển thị' : 'Ẩn'}
          </Tag>
        );
      }
    },
    {
      title: 'Ghim',
      dataIndex: 'isPinned',
      key: 'isPinned',
      width: 60,
      render: (isPinned) => isPinned ? <PushpinOutlined style={{ color: 'gold' }} /> : '-'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: true,
      render: (date) => (
        <Text style={{ fontSize: '12px' }}>
          {moment(date).format('DD/MM/YYYY')}
        </Text>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: 'orangered' }} />}
              onClick={() => handleCreateEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: 'darkblue' }} />}
              onClick={() => handleCreateEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa thông báo"
              description="Bạn có chắc chắn muốn xóa thông báo này?"
              onConfirm={() => handleDelete(record._id)}
              okText="Xóa"
              cancelText="Hủy"
              okType="danger"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <BellOutlined style={{ marginRight: 8 }} />
              Quản lý thông báo
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreateEdit()}
              >
                Thêm thông báo
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadNotifications()}
                loading={tableLoading}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Filters */}
        <Card>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={6}>
              <Search
                placeholder="Tìm kiếm tiêu đề/nội dung..."
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Loại"
                style={{ width: '100%' }}
                value={filters.type}
                onChange={(value) => handleFilterChange('type', value)}
              >
                <Option value="all">Tất cả loại</Option>
                <Option value="success">Success</Option>
                <Option value="info">Info</Option>
                <Option value="warning">Warning</Option>
                <Option value="error">Error</Option>
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Danh mục"
                style={{ width: '100%' }}
                value={filters.category}
                onChange={(value) => handleFilterChange('category', value)}
              >
                <Option value="all">Tất cả danh mục</Option>
                <Option value="system">Hệ thống</Option>
                <Option value="maintenance">Bảo trì</Option>
                <Option value="security">Bảo mật</Option>
                <Option value="feature">Tính năng</Option>
                <Option value="announcement">Thông báo</Option>
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Đối tượng"
                style={{ width: '100%' }}
                value={filters.targetAudience}
                onChange={(value) => handleFilterChange('targetAudience', value)}
              >
                <Option value="all">Tất cả đối tượng</Option>
                <Option value="admin">Admin</Option>
                <Option value="student">Sinh viên</Option>
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setFilters({
                    search: '',
                    type: 'all',
                    category: 'all',
                    targetAudience: 'all',
                    status: 'all',
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                    page: 1,
                    limit: 10
                  });
                }}
              >
                Xóa bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={notifications}
            loading={tableLoading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} thông báo`
            }}
            onChange={handleTableChange}
            rowKey="_id"
            size="small"
            scroll={{ x: 1000 }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          title={modalType === 'create' ? 'Thêm thông báo mới' : 'Chỉnh sửa thông báo'}
          open={modalVisible}
          onOk={() => form.submit()}
          onCancel={() => setModalVisible(false)}
          confirmLoading={loading}
          width={700}
          style={{ top: 20 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Tiêu đề"
              name="title"
              rules={[{ required: true, message: 'Vui lòng nhập tiêu đề thông báo!' }]}
            >
              <Input placeholder="Tiêu đề thông báo..." />
            </Form.Item>

            <Form.Item
              label="Nội dung"
              name="message"
              rules={[{ required: true, message: 'Vui lòng nhập nội dung thông báo!' }]}
            >
              <TextArea rows={4} placeholder="Nội dung chi tiết của thông báo..." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Loại"
                  name="type"
                  rules={[{ required: true, message: 'Vui lòng chọn loại thông báo!' }]}
                >
                  <Select placeholder="Chọn loại">
                    <Option value="success">Success</Option>
                    <Option value="info">Info</Option>
                    <Option value="warning">Warning</Option>
                    <Option value="error">Error</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Danh mục"
                  name="category"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
                >
                  <Select placeholder="Chọn danh mục">
                    <Option value="system">Hệ thống</Option>
                    <Option value="maintenance">Bảo trì</Option>
                    <Option value="security">Bảo mật</Option>
                    <Option value="feature">Tính năng</Option>
                    <Option value="announcement">Thông báo</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Đối tượng"
                  name="targetAudience"
                  rules={[{ required: true, message: 'Vui lòng chọn đối tượng!' }]}
                >
                  <Select placeholder="Chọn đối tượng">
                    <Option value="all">Tất cả</Option>
                    <Option value="admin">Admin</Option>
                    <Option value="student">Sinh viên</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Độ ưu tiên"
                  name="priority"
                  rules={[{ required: true, message: 'Vui lòng chọn độ ưu tiên!' }]}
                >
                  <Select placeholder="Chọn độ ưu tiên">
                    <Option value="low">Thấp</Option>
                    <Option value="medium">Trung bình</Option>
                    <Option value="high">Cao</Option>
                    <Option value="urgent">Khẩn cấp</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Thời gian hiển thị"
                  name="scheduledAt"
                >
                  <DatePicker showTime style={{ width: '100%' }} placeholder="Chọn ngày/giờ hiển thị" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Thời gian hết hạn"
                  name="expiredAt"
                >
                  <DatePicker showTime style={{ width: '100%' }} placeholder="Chọn ngày/giờ hết hạn" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Trạng thái kích hoạt"
              name="isActive"
              valuePropName="checked"
            >
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Ẩn" />
            </Form.Item>

            <Form.Item
              label="Ghim thông báo"
              name="isPinned"
              valuePropName="checked"
            >
              <Switch checkedChildren="Ghim" unCheckedChildren="Bỏ ghim" />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Content>
  );
};

export default NotificationManagement; 