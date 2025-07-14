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
  InputNumber,
  Upload,
  Image,
  Checkbox,
  Divider,
  Progress
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
  CopyOutlined,
  FilterOutlined,
  MoreOutlined,
  ExportOutlined,
  ImportOutlined,
  UploadOutlined,
  TagsOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import questionService from '../services/questionService';
import subjectService from '../services/subjectService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const QuestionManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [tags, setTags] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    subjectCode: 'all',
    examType: 'all',
    difficulty: 'all',
    status: 'all',
    tags: '',
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
    loadQuestions();
    loadTags();
    loadStatistics();
  }, [filters]);

  // Load subjects once when component mounts
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadQuestions = async () => {
    setTableLoading(true);
    try {
      const response = await questionService.getQuestions(filters);
      if (response.success) {
        setQuestions(response.data.questions || []);
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
        description: 'Không thể tải danh sách câu hỏi'
      });
    } finally {
      setTableLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await questionService.getQuestionTags();
      if (response.success) {
        setTags(response.data || []);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await questionService.getQuestionStats();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
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
  const handleCreateEdit = (question = null) => {
    setSelectedQuestion(question);
    setModalType(question ? 'edit' : 'create');
    setModalVisible(true);
    
    if (question) {
      form.setFieldsValue({
        questionText: question.questionText,
        subjectCode: question.subjectCode,
        examTypeCode: question.examTypeCode,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        difficulty: question.difficulty,
        defaultPoints: question.defaultPoints,
        tags: question.tags
      });
    } else {
      form.resetFields();
      // Set default options
      form.setFieldsValue({
        options: [
          { letter: 'A', text: '', isCorrect: false },
          { letter: 'B', text: '', isCorrect: false },
          { letter: 'C', text: '', isCorrect: false },
          { letter: 'D', text: '', isCorrect: false }
        ],
        difficulty: 'MEDIUM',
        defaultPoints: 1
      });
    }
  };

  // Handle submit
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Process correct answers
      const correctAnswers = values.options
        .filter(option => option.isCorrect)
        .map(option => option.letter);

      const questionData = {
        ...values,
        correctAnswer: {
          answers: correctAnswers,
          explanation: values.explanation
        }
      };

      let response;
      if (modalType === 'create') {
        response = await questionService.createQuestion(questionData);
      } else {
        response = await questionService.updateQuestion(selectedQuestion._id, questionData);
      }

      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        setModalVisible(false);
        loadQuestions();
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
        description: 'Không thể lưu câu hỏi'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (questionId) => {
    try {
      const response = await questionService.deleteQuestion(questionId);
      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        loadQuestions();
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
        description: 'Không thể xóa câu hỏi'
      });
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (questionId) => {
    try {
      const response = await questionService.toggleQuestionStatus(questionId);
      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        loadQuestions();
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
        description: 'Không thể thay đổi trạng thái câu hỏi'
      });
    }
  };

  // Handle bulk operations
  const handleBulkAction = (action) => {
    if (selectedRowKeys.length === 0) {
      notification.warning({
        message: 'Cảnh báo',
        description: 'Vui lòng chọn ít nhất một câu hỏi'
      });
      return;
    }

    if (action === 'delete') {
      Modal.confirm({
        title: 'Xóa hàng loạt',
        content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} câu hỏi đã chọn?`,
        okType: 'danger',
        onOk: async () => {
          try {
            const response = await questionService.bulkDeleteQuestions(selectedRowKeys);
            if (response.success) {
              notification.success({
                message: 'Thành công',
                description: response.message
              });
              setSelectedRowKeys([]);
              loadQuestions();
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
              description: 'Không thể xóa hàng loạt câu hỏi'
            });
          }
        }
      });
    } else {
      setBulkModalVisible(true);
    }
  };

  // Handle bulk submit
  const handleBulkSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await questionService.bulkUpdateQuestions(selectedRowKeys, values);
      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: response.message
        });
        setBulkModalVisible(false);
        setSelectedRowKeys([]);
        loadQuestions();
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
        description: 'Không thể cập nhật hàng loạt câu hỏi'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'EASY': return 'green';
      case 'MEDIUM': return 'orange';
      case 'HARD': return 'red';
      default: return 'default';
    }
  };

  // Table columns
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
      title: 'Câu hỏi',
      dataIndex: 'questionText',
      key: 'questionText',
      width: 350,
      render: (text, record) => (
        <Space direction="vertical" size="small" style={{ maxWidth: 350, paddingRight: '10px' }}>
          <div 
            style={{ 
              fontSize: '13px',
              fontWeight: '700',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '1.4',
              wordBreak: 'break-word'
            }}
          >
            {text.length > 120 ? `${text.substring(0, 120)}...` : text}
          </div>
          <Space>
            <Tag color="blue">{record.subjectCode}</Tag>
            <Tag color="purple">{record.examTypeCode}</Tag>
            <Tag color={getDifficultyColor(record.difficulty)}>
              {record.difficulty}
            </Tag>
            <Tag color={record.isActive ? 'green' : 'red'}>
              {record.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
            </Tag>
          </Space>
        </Space>
      )
    },
    {
      title: 'Số lựa chọn',
      key: 'optionsCount',
      width: 100,
      render: (_, record) => (
        <Badge count={record.options?.length || 0} color="blue" showZero />
      )
    },
    {
      title: 'Đáp án đúng',
      key: 'correctAnswers',
      width: 120,
      render: (_, record) => (
        <Space wrap>
          {record.correctAnswer?.answers?.map(answer => (
            <Tag key={answer} color="green">{answer}</Tag>
          )) || <Tag color="default">N/A</Tag>}
        </Space>
      )
    },
    {
      title: 'Điểm',
      dataIndex: 'defaultPoints',
      key: 'defaultPoints',
      width: 80,
      render: (points) => (
        <Badge count={points} color="orange" />
      )
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags) => (
        <Space wrap>
          {tags?.slice(0, 2).map(tag => (
            <Tag key={tag} color="geekblue" icon={<TagsOutlined />}>
              {tag}
            </Tag>
          ))}
          {tags?.length > 2 && (
            <Tag color="default">+{tags.length - 2}</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Sử dụng',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 80,
      render: (count) => (
        <Badge count={count || 0} overflowCount={99} showZero />
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
            onClick: () => {
              notification.info({
                message: 'Tính năng đang phát triển',
                description: 'Tính năng sao chép câu hỏi đang được phát triển'
              });
            }
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
                title="Xóa câu hỏi"
                description="Bạn có chắc chắn muốn xóa câu hỏi này?"
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

  // Row selection
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  return (
    <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <QuestionCircleOutlined style={{ marginRight: 8 }} />
              Ngân hàng câu hỏi
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreateEdit()}
              >
                Thêm câu hỏi
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
                onClick={() => loadQuestions()}
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
                  title="Tổng câu hỏi"
                  value={statistics.totalQuestions || 0}
                  prefix={<QuestionCircleOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Đang hoạt động"
                  value={statistics.activeQuestions || 0}
                  prefix={<QuestionCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Vô hiệu hóa"
                  value={statistics.inactiveQuestions || 0}
                  prefix={<QuestionCircleOutlined style={{ color: '#f5222d' }} />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Độ khó</Text>
                  <Space>
                    <Tag color="green">Dễ: {statistics.difficultyStats?.EASY || 0}</Tag>
                    <Tag color="orange">TB: {statistics.difficultyStats?.MEDIUM || 0}</Tag>
                    <Tag color="red">Khó: {statistics.difficultyStats?.HARD || 0}</Tag>
                  </Space>
                </Space>
              </Card>
            </Col>
          </Row>
        )}

        {/* Filters */}
        <Card>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={6}>
              <Search
                placeholder="Tìm kiếm câu hỏi..."
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Môn học"
                style={{ width: '100%' }}
                value={filters.subjectCode}
                onChange={(value) => handleFilterChange('subjectCode', value)}
              >
                <Option value="all">Tất cả môn học</Option>
                {subjects.map(subject => (
                  <Option key={subject._id} value={subject.subjectCode}>
                    {subject.subjectCode} - {subject.subjectName}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={3}>
              <Select
                placeholder="Loại đề thi"
                style={{ width: '100%' }}
                value={filters.examType}
                onChange={(value) => handleFilterChange('examType', value)}
              >
                <Option value="all">Tất cả loại</Option>
                <Option value="FE">Final Exam</Option>
                <Option value="PE">Practical Exam</Option>
                <Option value="QUIZ">Quiz</Option>
              </Select>
            </Col>
            <Col xs={24} md={3}>
              <Select
                placeholder="Độ khó"
                style={{ width: '100%' }}
                value={filters.difficulty}
                onChange={(value) => handleFilterChange('difficulty', value)}
              >
                <Option value="all">Tất cả</Option>
                <Option value="EASY">Dễ</Option>
                <Option value="MEDIUM">Trung bình</Option>
                <Option value="HARD">Khó</Option>
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
                <Option value="inactive">Vô hiệu hóa</Option>
              </Select>
            </Col>
            <Col xs={24} md={5}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setFilters({
                    search: '',
                    subjectCode: 'all',
                    examType: 'all',
                    difficulty: 'all',
                    status: 'all',
                    tags: '',
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

        {/* Bulk Actions */}
        {selectedRowKeys.length > 0 && (
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Text strong>Đã chọn {selectedRowKeys.length} câu hỏi</Text>
              </Col>
              <Col>
                <Space>
                  <Button
                    icon={<AppstoreOutlined />}
                    onClick={() => handleBulkAction('update')}
                  >
                    Cập nhật hàng loạt
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleBulkAction('delete')}
                  >
                    Xóa hàng loạt
                  </Button>
                  <Button
                    icon={<ExportOutlined />}
                    onClick={() => {
                      notification.info({
                        message: 'Tính năng đang phát triển',
                        description: 'Tính năng export đang được phát triển'
                      });
                    }}
                  >
                    Xuất đã chọn
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={questions}
            loading={tableLoading}
            rowSelection={rowSelection}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} câu hỏi`
            }}
            onChange={handleTableChange}
            rowKey="_id"
            size="small"
            scroll={{ x: 1400 }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          title={modalType === 'create' ? 'Thêm câu hỏi mới' : 'Chỉnh sửa câu hỏi'}
          open={modalVisible}
          onOk={() => form.submit()}
          onCancel={() => setModalVisible(false)}
          confirmLoading={loading}
          width={1000}
          style={{ top: 20 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Nội dung câu hỏi"
              name="questionText"
              rules={[
                { required: true, message: 'Vui lòng nhập nội dung câu hỏi!' },
                { min: 10, message: 'Nội dung câu hỏi phải có ít nhất 10 ký tự!' }
              ]}
            >
              <TextArea rows={4} placeholder="Nhập nội dung câu hỏi..." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Mã môn học"
                  name="subjectCode"
                  rules={[
                    { required: true, message: 'Vui lòng chọn mã môn học!' }
                  ]}
                >
                  <Select placeholder="Chọn môn học" showSearch>
                    {subjects.map(subject => (
                      <Option key={subject._id} value={subject.subjectCode}>
                        {subject.subjectCode} - {subject.subjectName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Loại đề thi"
                  name="examTypeCode"
                  rules={[
                    { required: true, message: 'Vui lòng nhập loại đề thi!' }
                  ]}
                >
                  <Select placeholder="Chọn loại đề thi">
                    <Option value="FE">Final Exam</Option>
                    <Option value="PE">Practical Exam</Option>
                    <Option value="QUIZ">Quiz</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Độ khó"
                  name="difficulty"
                  rules={[
                    { required: true, message: 'Vui lòng chọn độ khó!' }
                  ]}
                >
                  <Select placeholder="Chọn độ khó">
                    <Option value="EASY">Dễ</Option>
                    <Option value="MEDIUM">Trung bình</Option>
                    <Option value="HARD">Khó</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Các lựa chọn">
              <Form.List name="options">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <Row key={field.key} gutter={16} align="middle">
                        <Col span={2}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'letter']}
                            style={{ marginBottom: 8 }}
                          >
                            <Input disabled style={{ textAlign: 'center', fontWeight: 'bold' }} />
                          </Form.Item>
                        </Col>
                        <Col span={18}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'text']}
                            rules={[{ required: true, message: 'Vui lòng nhập nội dung lựa chọn!' }]}
                            style={{ marginBottom: 8 }}
                          >
                            <Input placeholder="Nhập nội dung lựa chọn..." />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'isCorrect']}
                            valuePropName="checked"
                            style={{ marginBottom: 8 }}
                          >
                            <Checkbox>Đúng</Checkbox>
                          </Form.Item>
                        </Col>
                        <Col span={1}>
                          {fields.length > 2 && (
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                            />
                          )}
                        </Col>
                      </Row>
                    ))}
                    {fields.length < 6 && (
                      <Button
                        type="dashed"
                        onClick={() => add({ letter: String.fromCharCode(65 + fields.length), text: '', isCorrect: false })}
                        block
                        icon={<PlusOutlined />}
                      >
                        Thêm lựa chọn
                      </Button>
                    )}
                  </>
                )}
              </Form.List>
            </Form.Item>

            <Form.Item
              label="Giải thích đáp án"
              name="explanation"
            >
              <TextArea rows={3} placeholder="Giải thích tại sao đáp án này đúng..." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Điểm mặc định"
                  name="defaultPoints"
                  rules={[
                    { required: true, message: 'Vui lòng nhập điểm!' },
                    { type: 'number', min: 0.5, max: 10, message: 'Điểm phải từ 0.5 đến 10!' }
                  ]}
                >
                  <InputNumber
                    min={0.5}
                    max={10}
                    step={0.5}
                    style={{ width: '100%' }}
                    placeholder="1"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Tags"
                  name="tags"
                >
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Nhập hoặc chọn tags..."
                    options={tags.map(tag => ({ value: tag.name, label: tag.name }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* Bulk Update Modal */}
        <Modal
          title="Cập nhật hàng loạt"
          open={bulkModalVisible}
          onOk={() => bulkForm.submit()}
          onCancel={() => setBulkModalVisible(false)}
          confirmLoading={loading}
          width={600}
        >
          <Form
            form={bulkForm}
            layout="vertical"
            onFinish={handleBulkSubmit}
          >
            <Text>Áp dụng cho {selectedRowKeys.length} câu hỏi đã chọn</Text>
            <Divider />

            <Form.Item
              label="Độ khó"
              name="difficulty"
            >
              <Select placeholder="Chọn độ khó để cập nhật" allowClear>
                <Option value="EASY">Dễ</Option>
                <Option value="MEDIUM">Trung bình</Option>
                <Option value="HARD">Khó</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Điểm mặc định"
              name="defaultPoints"
            >
              <InputNumber
                min={0.5}
                max={10}
                step={0.5}
                style={{ width: '100%' }}
                placeholder="Điểm để cập nhật"
              />
            </Form.Item>

            <Form.Item
              label="Tags (sẽ ghi đè)"
              name="tags"
            >
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Tags mới..."
                options={tags.map(tag => ({ value: tag.name, label: tag.name }))}
              />
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="isActive"
            >
              <Select placeholder="Chọn trạng thái" allowClear>
                <Option value={true}>Hoạt động</Option>
                <Option value={false}>Không hoạt động</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Content>
  );
};

export default QuestionManagement; 