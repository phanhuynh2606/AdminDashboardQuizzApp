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
  Statistic,
  Tag,
  Modal,
  Form,
  notification,
  Popconfirm,
  Spin,
  Alert,
  Tooltip,
  Badge,
  Divider,
  Switch
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  CalendarOutlined,
  BookOutlined,
  FileTextOutlined,
  EyeOutlined,
  CopyOutlined,
  FilterOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import semesterService from '../services/semesterService';
import subjectService from '../services/subjectService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const SemesterManagement = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'
  const [form] = Form.useForm();

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
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

  // Load data
  useEffect(() => {
    loadSemesters();
    loadStatistics();
  }, [filters]);

  const loadSemesters = async () => {
    setTableLoading(true);
    try {
      const response = await semesterService.getSemesters(filters);
      if (response.success) {
        setSemesters(response.data.semesters || []);
        setPagination({
          current: response.data.pagination?.page || 1,
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
        description: 'Không thể tải danh sách học kỳ'
      });
    } finally {
      setTableLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await semesterService.getSemesterStats();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1
    }));
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  // Handle table change
  const handleTableChange = (pagination, filters, sorter) => {
    setFilters(prev => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
      sortBy: sorter.field || 'createdAt',
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc'
    }));
  };

  // Handle create/edit
  const handleCreateEdit = (semester = null) => {
    setSelectedSemester(semester);
    setModalType(semester ? 'edit' : 'create');
    setModalVisible(true);
    
    if (semester) {
      form.setFieldsValue({
        name: semester.name,
        description: semester.description,
        // link: semester.link, // Hidden field
        isActive: semester.isActive
      });
    } else {
      form.resetFields();
    }
  };

  // Handle submit
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let response;
      if (modalType === 'create') {
        response = await semesterService.createSemester(values);
      } else {
        response = await semesterService.updateSemester(selectedSemester._id, values);
      }

      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        setModalVisible(false);
        loadSemesters();
        loadStatistics();
      } else {
        notification.error({
          message: 'Lỗi',
          description: response.message
        });
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: 'Không thể lưu học kỳ'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (semesterId) => {
    try {
      const response = await semesterService.deleteSemester(semesterId);
      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        loadSemesters();
        loadStatistics();
      } else {
        notification.error({
          message: 'Lỗi',
          description: response.message
        });
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: 'Không thể xóa học kỳ'
      });
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (semesterId) => {
    try {
      const response = await semesterService.toggleSemesterStatus(semesterId);
      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        loadSemesters();
        loadStatistics();
      } else {
        notification.error({
          message: 'Lỗi',
          description: response.message
        });
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: 'Không thể thay đổi trạng thái học kỳ'
      });
    }
  };

  // Table columns
  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => (
        <Text strong>{(pagination.current - 1) * pagination.pageSize + index + 1}</Text>
      )
    },
    {
      title: 'Tên học kỳ',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (name, record) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ fontSize: '14px' }}>{name}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      )
    },
    {
      title: 'Số môn học',
      key: 'subjectCount',
      width: 100,
      render: (_, record) => (
        <Badge count={record.subjectCount || 0} overflowCount={99}>
          <BookOutlined style={{ fontSize: '16px' }} />
        </Badge>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: true,
      render: (date) => (
        <Text style={{ fontSize: '12px' }}>
          {new Date(date).toLocaleDateString('vi-VN')}
        </Text>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleCreateEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleCreateEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => handleToggleStatus(record._id)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa học kỳ"
              description="Bạn có chắc chắn muốn xóa học kỳ này?"
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
              <CalendarOutlined style={{ marginRight: 8 }} />
              Quản lý học kỳ
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreateEdit()}
              >
                Thêm học kỳ
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadSemesters()}
                loading={tableLoading}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Statistics */}
        {statistics && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng số học kỳ"
                  value={statistics.totalSemesters || 0}
                  prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Đang hoạt động"
                  value={statistics.activeSemesters || 0}
                  prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng môn học"
                  value={statistics.totalSubjects || 0}
                  prefix={<BookOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng đề thi"
                  value={statistics.totalExams || 0}
                  prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Filters */}
        <Card>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Search
                placeholder="Tìm kiếm học kỳ..."
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={6}>
              <Select
                placeholder="Trạng thái"
                style={{ width: '100%' }}
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
              >
                <Option value="all">Tất cả</Option>
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Không hoạt động</Option>
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <Select
                placeholder="Sắp xếp"
                style={{ width: '100%' }}
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(value) => {
                  const [sortBy, sortOrder] = value.split('_');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
              >
                <Option value="createdAt_desc">Mới nhất</Option>
                <Option value="createdAt_asc">Cũ nhất</Option>
                <Option value="name_asc">Tên A-Z</Option>
                <Option value="name_desc">Tên Z-A</Option>
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setFilters({
                    search: '',
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
            dataSource={semesters}
            loading={tableLoading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} học kỳ`
            }}
            onChange={handleTableChange}
            rowKey="_id"
            size="middle"
          />
        </Card>

        {/* Modal */}
        <Modal
          title={modalType === 'create' ? 'Thêm học kỳ mới' : 'Chỉnh sửa học kỳ'}
          open={modalVisible}
          onOk={() => form.submit()}
          onCancel={() => setModalVisible(false)}
          confirmLoading={loading}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Tên học kỳ"
              name="name"
              rules={[
                { required: true, message: 'Vui lòng nhập tên học kỳ!' },
                { min: 2, message: 'Tên học kỳ phải có ít nhất 2 ký tự!' }
              ]}
            >
              <Input placeholder="Ví dụ: Spring 2024, Fall 2024" />
            </Form.Item>

            <Form.Item
              label="Mô tả"
              name="description"
            >
              <Input.TextArea
                rows={3}
                placeholder="Mô tả về học kỳ..."
              />
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="isActive"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Content>
  );
};

export default SemesterManagement; 