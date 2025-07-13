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
  Tooltip,
  Badge,
  Dropdown,
  Menu,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  BookOutlined,
  CalendarOutlined,
  FileTextOutlined,
  EyeOutlined,
  CopyOutlined,
  FilterOutlined,
  MoreOutlined,
  ExportOutlined,
  ImportOutlined
} from '@ant-design/icons';
import subjectService from '../services/subjectService';
import semesterService from '../services/semesterService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [form] = Form.useForm();

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    semester: 'all',
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
    loadSubjects();
    loadSemesters();
    loadStatistics();
  }, [filters]);

  const loadSubjects = async () => {
    setTableLoading(true);
    try {
      const response = await subjectService.getSubjects(filters);
      if (response.success) {
        setSubjects(response.data.subjects || []);
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
        description: 'Không thể tải danh sách môn học'
      });
    } finally {
      setTableLoading(false);
    }
  };

  const loadSemesters = async () => {
    try {
      const response = await semesterService.getActiveSemesters();
      if (response.success) {
        setSemesters(response.data || []);
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await subjectService.getSubjectStats();
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
  const handleCreateEdit = (subject = null) => {
    setSelectedSubject(subject);
    setModalType(subject ? 'edit' : 'create');
    setModalVisible(true);
    
    if (subject) {
      form.setFieldsValue({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        semester: subject.semester?._id || subject.semester,
        description: subject.description,
        // link: subject.link, // Hidden field
        isActive: subject.isActive
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
        response = await subjectService.createSubject(values);
      } else {
        response = await subjectService.updateSubject(selectedSubject._id, values);
      }

      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        setModalVisible(false);
        loadSubjects();
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
        description: 'Không thể lưu môn học'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (subjectId) => {
    try {
      const response = await subjectService.deleteSubject(subjectId);
      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        loadSubjects();
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
        description: 'Không thể xóa môn học'
      });
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (subjectId) => {
    try {
      const response = await subjectService.toggleSubjectStatus(subjectId);
      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        loadSubjects();
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
        description: 'Không thể thay đổi trạng thái môn học'
      });
    }
  };

  // Handle duplicate
  const handleDuplicate = async (subjectId) => {
    Modal.confirm({
      title: 'Sao chép môn học',
      content: 'Bạn có muốn sao chép môn học này sang học kỳ khác?',
      onOk: async () => {
        // Here you would show a modal to select target semester
        // For now, we'll just show a message
        notification.info({
          message: 'Tính năng đang phát triển',
          description: 'Tính năng sao chép môn học đang được phát triển'
        });
      }
    });
  };

  // Get semester name by ID
  const getSemesterName = (semesterId) => {
    const semester = semesters.find(s => s._id === semesterId);
    return semester ? semester.name : 'Không xác định';
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
      title: 'Mã môn học',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      width: 120,
      sorter: true,
      render: (code) => (
        <Tag color="blue" style={{ fontWeight: 'bold' }}>
          {code}
        </Tag>
      )
    },
    {
      title: 'Tên môn học',
      dataIndex: 'subjectName',
      key: 'subjectName',
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
      title: 'Học kỳ',
      dataIndex: 'semester',
      key: 'semester',
      width: 150,
      sorter: true,
      render: (semester) => (
        <Tag color="green">
          {semester?.name || 'Không xác định'}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      sorter: true,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      )
    },
    {
      title: 'Số đề thi',
      key: 'examCount',
      dataIndex: 'examCount',
      width: 100,
      sorter: true,
      render: (count) => (
        <Badge count={count || 0} overflowCount={99} showZero>
          <FileTextOutlined style={{ fontSize: '16px' }} />
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
      render: (_, record) => {
        const menuItems = [
          {
            key: 'view',
            label: 'Xem chi tiết',
            icon: <EyeOutlined />,
            onClick: () => handleCreateEdit(record)
          },
          {
            key: 'duplicate',
            label: 'Sao chép',
            icon: <CopyOutlined />,
            onClick: () => handleDuplicate(record._id)
          },
          {
            key: 'export',
            label: 'Xuất dữ liệu',
            icon: <ExportOutlined />
          }
        ];

        return (
          <Space size="small">
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                icon={<EditOutlined style={{ color: 'orangered' }} />}
                onClick={() => handleCreateEdit(record)}
              />
            </Tooltip>
            <Tooltip title={record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
              <Button
                type="text"
                icon={<SettingOutlined style={{ color: 'darkblue' }} />}
                onClick={() => handleToggleStatus(record._id)}
              />
            </Tooltip>
            <Tooltip title="Thêm hành động">
              <Dropdown
                menu={{
                  items: menuItems
                }}
                trigger={['click']}
              >
                <Button type="text" icon={<MoreOutlined />} />
              </Dropdown>
            </Tooltip>
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xóa môn học"
                description="Bạn có chắc chắn muốn xóa môn học này?"
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
        );
      }
    }
  ];

  return (
    <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <BookOutlined style={{ marginRight: 8 }} />
              Quản lý môn học
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreateEdit()}
              >
                Thêm môn học
              </Button>
              <Button
                icon={<ImportOutlined />}
                onClick={() => {
                  notification.info({
                    message: 'Tính năng đang phát triển',
                    description: 'Tính năng import đang được phát triển'
                  });
                }}
              >
                Import
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadSubjects()}
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
                  title="Tổng môn học"
                  value={statistics.totalSubjects || 0}
                  prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Đang hoạt động"
                  value={statistics.activeSubjects || 0}
                  prefix={<BookOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng đề thi"
                  value={statistics.totalExams || 0}
                  prefix={<FileTextOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Số học kỳ"
                  value={statistics.totalSemesters || 0}
                  prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Filters */}
        <Card>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={8}>
              <Search
                placeholder="Tìm kiếm môn học..."
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Học kỳ"
                style={{ width: '100%' }}
                value={filters.semester}
                onChange={(value) => handleFilterChange('semester', value)}
              >
                <Option value="all">Tất cả học kỳ</Option>
                {semesters.map(semester => (
                  <Option key={semester._id} value={semester._id}>
                    {semester.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={3}>
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
            <Col xs={24} md={5}>
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
                <Option value="subjectCode_asc">Mã A-Z</Option>
                <Option value="subjectCode_desc">Mã Z-A</Option>
                <Option value="subjectName_asc">Tên A-Z</Option>
                <Option value="subjectName_desc">Tên Z-A</Option>
              </Select>
            </Col>
            <Col xs={24} md={1}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setFilters({
                    search: '',
                    semester: 'all',
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
            dataSource={subjects}
            loading={tableLoading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} môn học`
            }}
            onChange={handleTableChange}
            rowKey="_id"
            size="middle"
            scroll={{ x: 1000 }}
          />
        </Card>

        {/* Modal */}
        <Modal
          title={modalType === 'create' ? 'Thêm môn học mới' : 'Chỉnh sửa môn học'}
          open={modalVisible}
          onOk={() => form.submit()}
          onCancel={() => setModalVisible(false)}
          confirmLoading={loading}
          width={700}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Mã môn học"
                  name="subjectCode"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mã môn học!' },
                    { min: 2, message: 'Mã môn học phải có ít nhất 2 ký tự!' },
                    { pattern: /^[A-Z0-9]+$/, message: 'Mã môn học chỉ chứa chữ hoa và số!' }
                  ]}
                >
                  <Input 
                    placeholder="Ví dụ: PRM392, EXE101"
                    style={{ textTransform: 'uppercase' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Học kỳ"
                  name="semester"
                  rules={[
                    { required: true, message: 'Vui lòng chọn học kỳ!' }
                  ]}
                >
                  <Select placeholder="Chọn học kỳ">
                    {semesters.map(semester => (
                      <Option key={semester._id} value={semester._id}>
                        {semester.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Tên môn học"
              name="subjectName"
              rules={[
                { required: true, message: 'Vui lòng nhập tên môn học!' },
                { min: 2, message: 'Tên môn học phải có ít nhất 2 ký tự!' }
              ]}
            >
              <Input placeholder="Ví dụ: Mobile Programming, Mobile App Development" />
            </Form.Item>

            <Form.Item
              label="Mô tả"
              name="description"
            >
              <Input.TextArea
                rows={3}
                placeholder="Mô tả về môn học..."
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

export default SubjectManagement; 