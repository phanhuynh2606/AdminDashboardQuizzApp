import React, { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Space,
  Input,
  Select,
  Card,
  Typography,
  Modal,
  Form,
  notification,
  Popconfirm,
  Tag,
  Avatar,
  Row,
  Col,
  Statistic,
  DatePicker
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import moment from 'moment';
import adminService from '../services/adminService';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [form] = Form.useForm();

  // Load students data
  useEffect(() => {
    loadStudents();
  }, [pagination.current, pagination.pageSize, searchText, selectedLevel, selectedStatus]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        role: 'student', // Only get students
        status: selectedStatus,
        level: selectedLevel,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });


      if (response.success) {
        setStudents(response.data.users);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.totalUsers
        }));
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi tải dữ liệu',
        description: error.message || 'Không thể tải danh sách người dùng',
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debounce
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  // Handle filter changes
  const handleLevelChange = (value) => {
    setSelectedLevel(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Table columns
  const columns = [
    {
      title: 'Thông tin học sinh',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 250,
      render: (text, record) => (
        <Space>
          <Avatar size={40} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.studentId}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Liên hệ',
      dataIndex: 'email',
      key: 'contact',
      width: 200,
      render: (email, record) => (
        <div>
          <div>
            <MailOutlined style={{ marginRight: 4, color: '#1890ff' }} />
            {email}
          </div>
          <div style={{ marginTop: 4 }}>
            <PhoneOutlined style={{ marginRight: 4, color: '#52c41a' }} />
            {record.phone || 'Không có'}
          </div>
        </div>
      ),
    },
    {
      title: 'Trình độ',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level) => {
        const colors = {
          'Beginner': 'green',
          'Intermediate': 'orange', 
          'Advanced': 'red'
        };
        return <Tag color={colors[level] || 'blue'}>{level}</Tag>;
      },
    },
    {
      title: 'Môn quan tâm',
      dataIndex: 'favoriteSubjects',
      key: 'favoriteSubjects',
      width: 150,
      render: (subjects) => (
        <div>
          {subjects && subjects.length > 0 ? (
            subjects.map(subject => (
              <Tag key={subject} size="small" style={{ marginBottom: 2 }}>
                {subject}
              </Tag>
            ))
          ) : (
            <Tag size="small" style={{ marginBottom: 2 }}>
              Không có
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (status) => (
        <Tag color={status === true ? 'green' : 'red'}>
          {status === true ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Điểm TB',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 80,
      render: (score) => (
        <span style={{ 
          color: score >= 8 ? '#52c41a' : score >= 6.5 ? '#faad14' : '#ff4d4f',
          fontWeight: 500 
        }}>
          {score}
        </span>
      ),
    },
    {
      title: 'Số quiz đã làm',
      dataIndex: 'totalQuizzes',
      key: 'totalQuizzes',
      width: 100,
      align: 'center',
    },
    {
      title: 'Thời gian học',
      dataIndex: 'totalStudyTime',
      key: 'totalStudyTime',
      width: 100,
      align: 'center',
      render: (time) => `${time}h`,
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : 'Chưa đăng nhập',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Handle add new student
  const handleAdd = () => {
    setEditingStudent(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Handle edit student
  const handleEdit = (student) => {
    setEditingStudent(student);
    form.setFieldsValue({
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      level: student.level,
      favoriteSubjects: student.favoriteSubjects || [],
      status: student.status,
      dateOfBirth: student.dateOfBirth ? moment(student.dateOfBirth) : null,
      isActive: student.isActive
    });
    setIsModalVisible(true);
  };

  // Handle delete student
  const handleDelete = async (id) => {
    try {
      const response = await adminService.deleteUser(id);
      
      if (response.success) {
        notification.success({
          message: 'Xóa thành công',
          description: response.message || 'Người dùng đã được xóa khỏi hệ thống',
          placement: 'topRight'
        });
        // Reload data
        loadStudents();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: error.message || 'Có lỗi xảy ra khi xóa người dùng',
        placement: 'topRight'
      });
    }
  };

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      const studentData = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
        favoriteSubjects: values.favoriteSubjects || [],
        role: 'student'
      };

      let response;
      if (editingStudent) {
        // Remove password from update data
        delete studentData.password;
        response = await adminService.updateUser(editingStudent._id, studentData);
      } else {
        // Password is already in form values
        response = await adminService.createUser(studentData);
      }

      if (response.success) {
        notification.success({
          message: editingStudent ? 'Cập nhật thành công' : 'Thêm thành công',
          description: response.message || (editingStudent ? 
            'Thông tin người dùng đã được cập nhật' : 
            'Người dùng mới đã được thêm vào hệ thống'),
          placement: 'topRight'
        });
        
        setIsModalVisible(false);
        form.resetFields();
        // Reload data
        loadStudents();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: error.message || 'Có lỗi xảy ra khi lưu thông tin người dùng',
        placement: 'topRight'
      });
    }
  };

  // Statistics
  const stats = {
    total: pagination.total,
    active: students.filter(s => s.status === 'active').length,
    inactive: students.filter(s => s.status === 'inactive').length,
    averageScore: students.length > 0 ? 
      (students.reduce((sum, s) => sum + (s.averageScore || 0), 0) / students.length).toFixed(1) : 0
  };

  return (
    <Layout.Content style={{
      margin: '24px',
      padding: '24px',
      background: '#f0f2f5',
      minHeight: 280,
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            Quản lý người dùng
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadStudents}
              loading={loading}
            >
              Làm mới
            </Button>
            <Button 
              icon={<ExportOutlined />} 
              type="default"
            >
              Xuất Excel
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Thêm người dùng
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng số người dùng"
                value={stats.total}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đang hoạt động"
                value={stats.active}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Không hoạt động"
                value={stats.inactive}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Điểm trung bình"
                value={stats.averageScore}
                precision={1}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Search
                placeholder="Tìm kiếm theo tên, email hoặc mã người dùng..."
                allowClear
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col>
              <Select
                placeholder="Chọn trình độ"
                value={selectedLevel}
                onChange={handleLevelChange}
                style={{ width: 140 }}
              >
                <Option value="all">Tất cả trình độ</Option>
                <Option value="Beginner">Beginner</Option>
                <Option value="Intermediate">Intermediate</Option>
                <Option value="Advanced">Advanced</Option>
              </Select>
            </Col>
            <Col>
              <Select
                placeholder="Trạng thái"
                value={selectedStatus}
                onChange={handleStatusChange}
                style={{ width: 140 }}
              >
                <Option value="all">Tất cả</Option>
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Không hoạt động</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Students Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={students}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} của ${total} người dùng`,
              onChange: (page, pageSize) => {
                setPagination(prev => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize
                }));
              },
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Space>

      {/* Add/Edit User Modal */}
      <Modal
        title={editingStudent ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okText={editingStudent ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input placeholder="Nhập email" disabled={!!editingStudent} />
              </Form.Item>
            </Col>
          </Row>

          {!editingStudent && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Mật khẩu"
                  name="password"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                  ]}
                  initialValue="123456"
                >
                  <Input.Password placeholder="Nhập mật khẩu" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Trình độ"
                name="level"
                rules={[{ required: true, message: 'Vui lòng chọn trình độ!' }]}
              >
                <Select placeholder="Chọn trình độ">
                  <Option value="Beginner">Beginner</Option>
                  <Option value="Intermediate">Intermediate</Option>
                  <Option value="Advanced">Advanced</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Ngày sinh"
                name="dateOfBirth"
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Trạng thái"
                name="isActive"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value={true}>Hoạt động</Option>
                  <Option value={false}>Không hoạt động</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Môn học quan tâm"
                name="favoriteSubjects"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 môn!' }]}
              >
                <Select 
                  mode="multiple" 
                  placeholder="Chọn môn học quan tâm"
                  style={{ width: '100%' }}
                >
                  <Option value="Toán">Toán</Option>
                  <Option value="Lý">Vật Lý</Option>
                  <Option value="Hóa">Hóa Học</Option>
                  <Option value="Sinh">Sinh Học</Option>
                  <Option value="Văn">Ngữ Văn</Option>
                  <Option value="Sử">Lịch Sử</Option>
                  <Option value="Địa">Địa Lý</Option>
                  <Option value="Anh">Tiếng Anh</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Layout.Content>
  );
};

export default StudentManagement; 