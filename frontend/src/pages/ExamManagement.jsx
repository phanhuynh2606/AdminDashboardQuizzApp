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
  Switch,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  FileTextOutlined,
  BookOutlined,
  CalendarOutlined,
  EyeOutlined,
  CopyOutlined,
  FilterOutlined,
  MoreOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import examService from '../services/examService';
import subjectService from '../services/subjectService';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const ExamManagement = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [duplicateForm] = Form.useForm();

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    semester: 'all',
    subject: 'all',
    examType: 'all',
    status: 'all',
    published: 'all',
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
    loadExams();
    loadSubjects();
    loadExamTypes();
    loadStatistics();
  }, [filters]);

  const loadExams = async () => {
    setTableLoading(true);
    try {
      const response = await examService.getExams(filters);
      if (response.success) {
        setExams(response.data.exams || []);
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
        description: 'Không thể tải danh sách đề thi'
      });
    } finally {
      setTableLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectService.getActiveSubjects();
      if (response.success) {
        setSubjects(response.data || []);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadExamTypes = async () => {
    try {
      const response = await examService.getExamTypes();
      if (response.success) {
        setExamTypes(response.data || []);
      }
    } catch (error) {
      console.error('Error loading exam types:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await examService.getExamStats();
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
  const handleCreateEdit = (exam = null) => {
    setSelectedExam(exam);
    setModalType(exam ? 'edit' : 'create');
    setModalVisible(true);
    
    if (exam) {
      form.setFieldsValue({
        examTitle: exam.examTitle,
        examCode: exam.examCode,
        subjectId: exam.subject?._id || exam.subjectId,
        examTypeId: exam.examType?._id || exam.examTypeId,
        description: exam.description,
        duration: exam.duration,
        isActive: exam.isActive
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
        response = await examService.createExam(values);
      } else {
        response = await examService.updateExam(selectedExam._id, values);
      }

      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        setModalVisible(false);
        loadExams();
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
        description: 'Không thể lưu đề thi'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (examId) => {
    try {
      const response = await examService.deleteExam(examId);
      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        loadExams();
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
        description: 'Không thể xóa đề thi'
      });
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (examId) => {
    try {
      const response = await examService.toggleExamStatus(examId);
      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        loadExams();
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
        description: 'Không thể thay đổi trạng thái đề thi'
      });
    }
  };

  // Handle toggle published
  const handleTogglePublished = async (examId) => {
    try {
      const response = await examService.toggleExamPublished(examId);
      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        loadExams();
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
        description: 'Không thể thay đổi trạng thái xuất bản'
      });
    }
  };

  // Handle duplicate
  const handleDuplicate = (exam) => {
    setSelectedExam(exam);
    setDuplicateModalVisible(true);
    duplicateForm.setFieldsValue({
      examTitle: `${exam.examTitle} - Copy`,
      examCode: `${exam.examCode}_COPY`
    });
  };

  // Handle duplicate submit
  const handleDuplicateSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await examService.duplicateExam(selectedExam._id, values);
      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        setDuplicateModalVisible(false);
        loadExams();
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
        description: 'Không thể sao chép đề thi'
      });
    } finally {
      setLoading(false);
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
      title: 'Mã đề thi',
      dataIndex: 'examCode',
      key: 'examCode',
      width: 120,
      sorter: true,
      render: (code) => (
        <Tag color="blue" style={{ fontWeight: 'bold' }}>
          {code}
        </Tag>
      )
    },
    {
      title: 'Tên đề thi',
      dataIndex: 'examTitle',
      key: 'examTitle',
      sorter: true,
      render: (title, record) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ fontSize: '14px' }}>{title}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Môn học',
      key: 'subject',
      width: 120,
      render: (_, record) => (
        <Tag color="green">
          {record.subject?.subjectCode || record.subjectCode}
        </Tag>
      )
    },
    {
      title: 'Loại',
      key: 'examType',
      width: 100,
      render: (_, record) => (
        <Tag color="orange">
          {record.examType?.typeCode || record.examTypeCode}
        </Tag>
      )
    },
    {
      title: 'Thời gian',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{duration} phút</Text>
        </Space>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? 'Hoạt động' : 'Không hoạt động'}
          </Tag>
          <Tag color={record.isPublished ? 'blue' : 'default'}>
            {record.isPublished ? 'Đã xuất bản' : 'Chưa xuất bản'}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Số câu hỏi',
      key: 'totalQuestions',
      width: 100,
      render: (_, record) => {
        const count = record.totalQuestions || 0;
        const hasQuestions = count > 0;
        
        return (
          <Space>
            <Badge 
              count={count} 
              overflowCount={99}
              style={{ 
                backgroundColor: hasQuestions ? '#52c41a' : '#d9d9d9',
                color: hasQuestions ? '#fff' : '#999'
              }}
            >
              <FileTextOutlined 
                style={{ 
                  fontSize: '16px',
                  color: hasQuestions ? '#52c41a' : '#d9d9d9'
                }} 
              />
            </Badge>
            {!hasQuestions && (
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Chưa có câu hỏi
              </Text>
            )}
          </Space>
        );
      }
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
      width: 200,
      render: (_, record) => {
        const menuItems = [
          {
            key: 'view',
            label: 'Xem chi tiết',
            icon: <EyeOutlined />,
            onClick: () => handleCreateEdit(record)
          },
          {
            key: 'add-questions',
            label: 'Thêm câu hỏi',
            icon: <DatabaseOutlined />,
            onClick: () => navigate(`/exam-builder/${record._id}`)
          },
          {
            key: 'duplicate',
            label: 'Sao chép',
            icon: <CopyOutlined />,
            onClick: () => handleDuplicate(record)
          },
          {
            key: 'publish',
            label: record.isPublished ? 'Hủy xuất bản' : 'Xuất bản',
            icon: record.isPublished ? <StopOutlined /> : <CheckCircleOutlined />,
            onClick: () => handleTogglePublished(record._id)
          },
          {
            key: 'export',
            label: 'Xuất dữ liệu',
            icon: <ExportOutlined />
          }
        ];

        return (
          <Space size="small">
            <Tooltip title="Chỉnh sửa thông tin">
              <Button
                type="text"
                icon={<EditOutlined style={{ color: 'orangered' }} />}
                onClick={() => handleCreateEdit(record)}
              />
            </Tooltip>
            <Tooltip title="Thêm/Chỉnh sửa câu hỏi">
              <Button
                type="text"
                icon={<DatabaseOutlined />}
                onClick={() => navigate(`/exam-builder/${record._id}`)}
                style={{ color: '#52c41a' }}
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
                title="Xóa đề thi"
                description="Bạn có chắc chắn muốn xóa đề thi này?"
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
              <FileTextOutlined style={{ marginRight: 8 }} />
              Quản lý đề thi
            </Title>
          </Col>
          <Col>
            <Space>
              <Tooltip title="Tạo nhanh thông tin cơ bản của đề thi (chưa có câu hỏi)">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreateEdit()}
                >
                  Tạo thông tin đề thi
                </Button>
              </Tooltip>
              <Tooltip title="Tạo đề thi hoàn chỉnh với câu hỏi được chọn từ ngân hàng câu hỏi">
                <Button
                  type="primary"
                  icon={<DatabaseOutlined />}
                  onClick={() => navigate('/exam-builder')}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  Tạo đề thi hoàn chỉnh
                </Button>
              </Tooltip>
              <Tooltip title="Import đề thi từ file Excel/CSV">
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
              </Tooltip>
              <Tooltip title="Làm mới danh sách đề thi">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => loadExams()}
                  loading={tableLoading}
                >
                  Làm mới
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>

        {/* Statistics */}
        {statistics && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng đề thi"
                  value={statistics.totalExams || 0}
                  prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Đang hoạt động"
                  value={statistics.activeExams || 0}
                  prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Đã xuất bản"
                  value={statistics.publishedExams || 0}
                  prefix={<CheckCircleOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng câu hỏi"
                  value={statistics.totalQuestions || 0}
                  prefix={<BookOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Filters */}
        <Card>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={6}>
              <Search
                placeholder="Tìm kiếm đề thi..."
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Môn học"
                style={{ width: '100%' }}
                value={filters.subject}
                onChange={(value) => handleFilterChange('subject', value)}
              >
                <Option value="all">Tất cả môn học</Option>
                {subjects.map(subject => (
                  <Option key={subject._id} value={subject._id}>
                    {subject.subjectCode}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Loại đề thi"
                style={{ width: '100%' }}
                value={filters.examType}
                onChange={(value) => handleFilterChange('examType', value)}
              >
                <Option value="all">Tất cả loại</Option>
                {examTypes.map(type => (
                  <Option key={type._id} value={type._id}>
                    {type.typeCode}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={4}>
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
            <Col xs={24} md={4}>
              <Select
                placeholder="Xuất bản"
                style={{ width: '100%' }}
                value={filters.published}
                onChange={(value) => handleFilterChange('published', value)}
              >
                <Option value="all">Tất cả</Option>
                <Option value="published">Đã xuất bản</Option>
                <Option value="unpublished">Chưa xuất bản</Option>
              </Select>
            </Col>
            <Col xs={24} md={2}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setFilters({
                    search: '',
                    semester: 'all',
                    subject: 'all',
                    examType: 'all',
                    status: 'all',
                    published: 'all',
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
            dataSource={exams}
            loading={tableLoading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} đề thi`
            }}
            onChange={handleTableChange}
            rowKey="_id"
            size="middle"
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          title={modalType === 'create' ? 'Tạo thông tin đề thi mới' : 'Chỉnh sửa thông tin đề thi'}
          open={modalVisible}
          onOk={() => form.submit()}
          onCancel={() => setModalVisible(false)}
          confirmLoading={loading}
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
                  label="Tên đề thi"
                  name="examTitle"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên đề thi!' },
                    { min: 5, message: 'Tên đề thi phải có ít nhất 5 ký tự!' }
                  ]}
                >
                  <Input placeholder="Ví dụ: PRM392 Final Exam - Spring 2025" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Mã đề thi"
                  name="examCode"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mã đề thi!' },
                    { min: 3, message: 'Mã đề thi phải có ít nhất 3 ký tự!' },
                    { pattern: /^[A-Z0-9_]+$/, message: 'Mã đề thi chỉ chứa chữ hoa, số và dấu gạch dưới!' }
                  ]}
                >
                  <Input 
                    placeholder="Ví dụ: PRM392_FE_SPRING25"
                    style={{ textTransform: 'uppercase' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Môn học"
                  name="subjectId"
                  rules={[
                    { required: true, message: 'Vui lòng chọn môn học!' }
                  ]}
                >
                  <Select placeholder="Chọn môn học">
                    {subjects.map(subject => (
                      <Option key={subject._id} value={subject._id}>
                        {subject.subjectCode} - {subject.subjectName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Loại đề thi"
                  name="examTypeId"
                  rules={[
                    { required: true, message: 'Vui lòng chọn loại đề thi!' }
                  ]}
                >
                  <Select placeholder="Chọn loại đề thi">
                    {examTypes.map(type => (
                      <Option key={type._id} value={type._id}>
                        {type.typeCode} - {type.typeName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Mô tả"
              name="description"
            >
              <Input.TextArea
                rows={3}
                placeholder="Mô tả về đề thi..."
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Thời gian làm bài (phút)"
                  name="duration"
                  rules={[
                    { required: true, message: 'Vui lòng nhập thời gian làm bài!' },
                    { type: 'number', min: 5, max: 300, message: 'Thời gian phải từ 5 đến 300 phút!' }
                  ]}
                >
                  <InputNumber 
                    min={5} 
                    max={300} 
                    style={{ width: '100%' }}
                    placeholder="Ví dụ: 60"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Trạng thái"
                  name="isActive"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* Duplicate Modal */}
        <Modal
          title="Sao chép đề thi"
          open={duplicateModalVisible}
          onOk={() => duplicateForm.submit()}
          onCancel={() => setDuplicateModalVisible(false)}
          confirmLoading={loading}
          width={600}
        >
          <Form
            form={duplicateForm}
            layout="vertical"
            onFinish={handleDuplicateSubmit}
          >
            <Form.Item
              label="Tên đề thi mới"
              name="examTitle"
              rules={[
                { required: true, message: 'Vui lòng nhập tên đề thi!' },
                { min: 5, message: 'Tên đề thi phải có ít nhất 5 ký tự!' }
              ]}
            >
              <Input placeholder="Tên cho đề thi được sao chép" />
            </Form.Item>

            <Form.Item
              label="Mã đề thi mới"
              name="examCode"
              rules={[
                { required: true, message: 'Vui lòng nhập mã đề thi!' },
                { min: 3, message: 'Mã đề thi phải có ít nhất 3 ký tự!' },
                { pattern: /^[A-Z0-9_]+$/, message: 'Mã đề thi chỉ chứa chữ hoa, số và dấu gạch dưới!' }
              ]}
            >
              <Input 
                placeholder="Mã cho đề thi được sao chép"
                style={{ textTransform: 'uppercase' }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Content>
  );
};

export default ExamManagement; 