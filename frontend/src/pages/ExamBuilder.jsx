import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Table,
  Tag,
  Modal,
  notification,
  Divider,
  InputNumber,
  Steps,
  Transfer,
  Checkbox,
  Tooltip,
  Badge,
  Progress,
  Alert
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  SaveOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import examService from '../services/examService';
import questionService from '../services/questionService';
import subjectService from '../services/subjectService';
import { useNavigate, useParams } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const ExamBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing exam
  const [form] = Form.useForm();
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [examData, setExamData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [questionFilters, setQuestionFilters] = useState({
    search: '',
    subjectCode: '',
    difficulty: 'all',
    examType: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadSubjects();
    if (id) {

      loadExamData(id);
    }
  }, [id]);

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

  const loadExamData = async (examId) => {
    try {
      setLoading(true);
      const response = await examService.getExamById(examId);
      if (response.success) {
        const exam = response.data;
        setExamData(exam);
        
        // Set form values
        form.setFieldsValue({
          title: exam.examTitle,
          description: exam.description,
          subjectCode: exam.subjectCode,
          examTypeCode: exam.examTypeCode,
          duration: exam.duration,
          totalQuestions: exam.totalQuestions,
          totalPoints: exam.totalPoints,
          passingScore: exam.passingScore,
          instructions: exam.instructions
        });

        // Load selected questions if editing
        await loadExamQuestions(examId);
        const filters = {
          ...questionFilters,
          subjectCode: exam.subjectCode,
          examType: exam.examTypeCode
        };
        loadQuestions(filters);
        setCurrentStep(1); // Start at question selection step
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tải thông tin đề thi'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExamQuestions = async (examId) => {
    try {
      const response = await examService.getExamQuestions(examId);
      if (response.success) {
        setSelectedQuestions(response.data.questions || []);
      }
    } catch (error) {
      console.error('Error loading exam questions:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tải danh sách câu hỏi của đề thi'
      });
    }
  };

  const loadQuestions = async (filters = questionFilters) => {
    try {
      setLoading(true);
      const response = await questionService.getQuestions({
        ...filters,
        status: 'active', // Only get active questions
        limit: 1000 // Get many questions for selection
      });
      
      if (response.success) {
        setAllQuestions(response.data.questions || []);
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tải danh sách câu hỏi'
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Basic exam information
  const handleBasicInfoNext = async (values) => {
    try {
      await form.validateFields();
      setExamData(values);
      
      // Load questions for the selected subject
      const filters = {
        ...questionFilters,
        subjectCode: values.subjectCode,
        examType: values.examTypeCode
      };
      setQuestionFilters(filters);
      await loadQuestions(filters);
      
      setCurrentStep(1);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Step 2: Question selection
  const handleQuestionToggle = (question, checked) => {
    if (checked) {
      if (selectedQuestions.length >= (examData?.totalQuestions || 50)) {
        notification.warning({
          message: 'Cảnh báo',
          description: `Đã đạt số lượng câu hỏi tối đa: ${examData?.totalQuestions || 50}`
        });
        return;
      }
      setSelectedQuestions([...selectedQuestions, question]);
    } else {
      setSelectedQuestions(selectedQuestions.filter(q => q._id !== question._id));
    }
  };

  const handleQuestionFilters = async (newFilters) => {
    const filters = { ...questionFilters, ...newFilters };
    setQuestionFilters(filters);
    await loadQuestions(filters);
  };

  // Step 3: Preview and save
  const handleSaveExam = async () => {
    if (selectedQuestions.length === 0) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng chọn ít nhất một câu hỏi'
      });
      return;
    }

    if (selectedQuestions.length !== examData.totalQuestions) {
      notification.error({
        message: 'Lỗi',
        description: `Số lượng câu hỏi không khớp. Cần: ${examData.totalQuestions}, Đã chọn: ${selectedQuestions.length}`
      });
      return;
    }

    try {
      setLoading(true);
      
      const examPayload = {
        examTitle: examData.title,
        examCode: examData.examCode || `${examData.subjectCode}_${examData.examTypeCode}_${Date.now()}`,
        subjectCode: examData.subjectCode,
        examTypeCode: examData.examTypeCode,
        description: examData.description,
        duration: examData.duration,
        totalQuestions: examData.totalQuestions,
        totalPoints: examData.totalPoints,
        passingScore: examData.passingScore,
        instructions: examData.instructions,
        questions: selectedQuestions.map(q => ({
          questionBankId: q._id,
          customPoints: q.defaultPoints || 1,
          customQuestionText: q.customQuestionText,
          customExplanation: q.customExplanation
        }))
      };

      let response;
      if (id) {
        // Update exam with questions
        response = await examService.updateExam(id, examPayload);
      } else {
        // Create exam with questions  
        response = await examService.createExam(examPayload);
      }

      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: id ? 'Cập nhật đề thi thành công' : 'Tạo đề thi thành công'
        });
        navigate('/exams');
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

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'EASY': return 'green';
      case 'MEDIUM': return 'orange';
      case 'HARD': return 'red';
      default: return 'default';
    }
  };

  // Question table columns
  const questionColumns = [
    {
      title: 'Chọn',
      width: 60,
      render: (_, record) => (
        <Checkbox
          checked={selectedQuestions.some(q => q._id === record._id)}
          onChange={(e) => handleQuestionToggle(record, e.target.checked)}
        />
      )
    },
    {
      title: 'Câu hỏi',
      dataIndex: 'questionText',
      ellipsis: true,
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ fontSize: '14px' }}>
            {text.length > 80 ? `${text.substring(0, 80)}...` : text}
          </Text>
          <Space>
            <Tag color="blue">{record.subjectCode}</Tag>
            <Tag color="purple">{record.examTypeCode}</Tag>
            <Tag color={getDifficultyColor(record.difficulty)}>
              {record.difficulty}
            </Tag>
          </Space>
        </Space>
      )
    },
    {
      title: 'Điểm',
      dataIndex: 'defaultPoints',
      width: 80,
      render: (points) => (
        <Badge count={points} color="orange" />
      )
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      width: 150,
      render: (tags) => (
        <Space wrap>
          {tags?.slice(0, 2).map(tag => (
            <Tag key={tag} color="geekblue" size="small">
              {tag}
            </Tag>
          ))}
          {tags?.length > 2 && (
            <Tag color="default" size="small">+{tags.length - 2}</Tag>
          )}
        </Space>
      )
    }
  ];

  // Selected questions table
  const selectedColumns = [
    {
      title: 'STT',
      width: 60,
      render: (_, __, index) => <Text strong>{index + 1}</Text>
    },
    {
      title: 'Câu hỏi',
      dataIndex: 'questionText',
      ellipsis: true,
      render: (text) => (
        <Text style={{ fontSize: '14px' }}>
          {text.length > 60 ? `${text.substring(0, 60)}...` : text}
        </Text>
      )
    },
    {
      title: 'Độ khó',
      dataIndex: 'difficulty',
      width: 100,
      render: (difficulty) => (
        <Tag color={getDifficultyColor(difficulty)}>
          {difficulty}
        </Tag>
      )
    },
    {
      title: 'Điểm',
      dataIndex: 'defaultPoints',
      width: 80,
      render: (points) => (
        <Badge count={points} color="orange" />
      )
    },
    {
      title: 'Hành động',
      width: 100,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleQuestionToggle(record, false)}
        />
      )
    }
  ];

  const steps = [
    {
      title: 'Thông tin đề thi',
      icon: <InfoCircleOutlined />,
      description: 'Nhập thông tin cơ bản của đề thi'
    },
    {
      title: 'Chọn câu hỏi',
      icon: <SearchOutlined />,
      description: 'Chọn câu hỏi từ ngân hàng câu hỏi'
    },
    {
      title: 'Xem trước & Lưu',
      icon: <CheckCircleOutlined />,
      description: 'Xem trước và lưu đề thi'
    }
  ];

  return (
    <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/exams')}
              >
                Quay lại
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                <FileTextOutlined style={{ marginRight: 8 }} />
                {id ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}
              </Title>
            </Space>
          </Col>
        </Row>

        {/* Steps */}
        <Card>
          <Steps current={currentStep} items={steps} />
        </Card>

        {/* Step Content */}
        {currentStep === 0 && (
          <Card title="Thông tin cơ bản của đề thi">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleBasicInfoNext}
              initialValues={{
                duration: 60,
                totalQuestions: 20,
                totalPoints: 20,
                passingScore: 60,
                examTypeCode: 'FE'
              }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="Tên đề thi"
                    name="title"
                    rules={[
                      { required: true, message: 'Vui lòng nhập tên đề thi!' },
                      { min: 5, message: 'Tên đề thi phải có ít nhất 5 ký tự!' }
                    ]}
                  >
                    <Input placeholder="Ví dụ: Đề thi cuối kỳ PRM392 - Spring 2024" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Môn học"
                    name="subjectCode"
                    rules={[{ required: true, message: 'Vui lòng chọn môn học!' }]}
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
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="Loại đề thi"
                    name="examTypeCode"
                    rules={[{ required: true, message: 'Vui lòng chọn loại đề thi!' }]}
                  >
                    <Select placeholder="Chọn loại đề thi">
                      <Option value="FE">Final Exam</Option>
                      <Option value="PE">Practical Exam</Option>
                      <Option value="QUIZ">Quiz</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Thời gian (phút)"
                    name="duration"
                    rules={[
                      { required: true, message: 'Vui lòng nhập thời gian!' },
                      { type: 'number', min: 10, max: 300, message: 'Thời gian từ 10-300 phút!' }
                    ]}
                  >
                    <InputNumber
                      min={10}
                      max={300}
                      style={{ width: '100%' }}
                      placeholder="60"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="Số câu hỏi"
                    name="totalQuestions"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số câu hỏi!' },
                      { type: 'number', min: 1, max: 100, message: 'Số câu hỏi từ 1-100!' }
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      style={{ width: '100%' }}
                      placeholder="20"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Tổng điểm"
                    name="totalPoints"
                    rules={[
                      { required: true, message: 'Vui lòng nhập tổng điểm!' },
                      { type: 'number', min: 1, max: 1000, message: 'Tổng điểm từ 1-1000!' }
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={1000}
                      style={{ width: '100%' }}
                      placeholder="20"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Điểm đạt (%)"
                    name="passingScore"
                    rules={[
                      { required: true, message: 'Vui lòng nhập điểm đạt!' },
                      { type: 'number', min: 1, max: 100, message: 'Điểm đạt từ 1-100%!' }
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      style={{ width: '100%' }}
                      placeholder="60"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Mô tả"
                name="description"
              >
                <TextArea
                  rows={3}
                  placeholder="Mô tả ngắn về đề thi..."
                />
              </Form.Item>

              <Form.Item
                label="Hướng dẫn làm bài"
                name="instructions"
              >
                <TextArea
                  rows={4}
                  placeholder="Hướng dẫn chi tiết cho học sinh khi làm bài..."
                />
              </Form.Item>

              <Row justify="end">
                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<ArrowRightOutlined />}>
                    Tiếp theo
                  </Button>
                </Form.Item>
              </Row>
            </Form>
          </Card>
        )}

        {currentStep === 1 && (
          <>
            {/* Question Selection */}
            <Card 
              title={`Chọn câu hỏi (${selectedQuestions.length}/${examData?.totalQuestions || 0})`}
              extra={
                <Progress
                  percent={Math.round((selectedQuestions.length / (examData?.totalQuestions || 1)) * 100)}
                  size="small"
                  style={{ width: 100 }}
                />
              }
            >
              {/* Filters */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Input
                    placeholder="Tìm kiếm câu hỏi..."
                    prefix={<SearchOutlined />}
                    value={questionFilters.search}
                    onChange={(e) => handleQuestionFilters({ search: e.target.value })}
                  />
                </Col>
                <Col span={5}>
                  <Select
                    placeholder="Độ khó"
                    style={{ width: '100%' }}
                    value={questionFilters.difficulty}
                    onChange={(value) => handleQuestionFilters({ difficulty: value })}
                  >
                    <Option value="all">Tất cả</Option>
                    <Option value="EASY">Dễ</Option>
                    <Option value="MEDIUM">Trung bình</Option>
                    <Option value="HARD">Khó</Option>
                  </Select>
                </Col>
                <Col span={11}>
                  <Alert
                    message={`Đã chọn ${selectedQuestions.length}/${examData?.totalQuestions || 0} câu hỏi`}
                    type={selectedQuestions.length === examData?.totalQuestions ? 'success' : 'info'}
                    showIcon
                  />
                </Col>
              </Row>

              <Table
                columns={questionColumns}
                dataSource={allQuestions}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} câu hỏi`
                }}
                loading={loading}
                scroll={{ x: 800 }}
                size="middle"
              />
            </Card>

            {/* Selected Questions */}
            {selectedQuestions.length > 0 && (
              <Card 
                title={`Câu hỏi đã chọn (${selectedQuestions.length})`}
                size="small"
              >
                <Table
                  columns={selectedColumns}
                  dataSource={selectedQuestions}
                  rowKey="_id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 600 }}
                />
              </Card>
            )}

            {/* Navigation */}
            <Row justify="space-between">
              <Button
                onClick={() => setCurrentStep(0)}
                icon={<ArrowLeftOutlined />}
              >
                Quay lại
              </Button>
              <Button
                type="primary"
                disabled={selectedQuestions.length !== examData?.totalQuestions}
                onClick={() => setCurrentStep(2)}
                icon={<ArrowRightOutlined />}
              >
                Tiếp theo
              </Button>
            </Row>
          </>
        )}

        {currentStep === 2 && (
          <Card title="Xem trước đề thi">
            {/* Exam Info Summary */}
            <Row gutter={24}>
              <Col span={12}>
                <Card size="small" title="Thông tin đề thi">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text><strong>Tên đề thi:</strong> {examData?.title}</Text>
                    <Text><strong>Môn học:</strong> {examData?.subjectCode}</Text>
                    <Text><strong>Loại đề thi:</strong> {examData?.examTypeCode}</Text>
                    <Text><strong>Thời gian:</strong> {examData?.duration} phút</Text>
                    <Text><strong>Tổng điểm:</strong> {examData?.totalPoints}</Text>
                    <Text><strong>Điểm đạt:</strong> {examData?.passingScore}%</Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Thống kê câu hỏi">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text><strong>Tổng câu hỏi:</strong> {selectedQuestions.length}</Text>
                    <Text>
                      <strong>Theo độ khó:</strong>
                      <div style={{ marginTop: 8 }}>
                        <Tag color="green">
                          Dễ: {selectedQuestions.filter(q => q.difficulty === 'EASY').length}
                        </Tag>
                        <Tag color="orange">
                          TB: {selectedQuestions.filter(q => q.difficulty === 'MEDIUM').length}
                        </Tag>
                        <Tag color="red">
                          Khó: {selectedQuestions.filter(q => q.difficulty === 'HARD').length}
                        </Tag>
                      </div>
                    </Text>
                    <Text>
                      <strong>Tổng điểm:</strong> {selectedQuestions.reduce((sum, q) => sum + (q.defaultPoints || 1), 0)}
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>

            <Divider />

            {/* Questions Preview */}
            <Card size="small" title="Danh sách câu hỏi">
              {selectedQuestions.map((question, index) => (
                <Card key={question._id} size="small" style={{ marginBottom: 16 }}>
                  <Row justify="space-between" align="top">
                    <Col span={20}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>
                          Câu {index + 1}: {question.questionText}
                        </Text>
                        <Space wrap>
                          {question.options?.map((option, optIndex) => (
                            <Tag 
                              key={optIndex}
                              color={question.correctAnswer?.answers?.includes(option.letter) ? 'green' : 'default'}
                            >
                              {option.letter}. {option.text}
                            </Tag>
                          ))}
                        </Space>
                      </Space>
                    </Col>
                    <Col span={4} style={{ textAlign: 'right' }}>
                      <Space direction="vertical" align="end">
                        <Tag color={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Tag>
                        <Badge count={question.defaultPoints || 1} color="orange" />
                      </Space>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Card>

            {/* Navigation & Save */}
            <Row justify="space-between">
              <Button
                onClick={() => setCurrentStep(1)}
                icon={<ArrowLeftOutlined />}
              >
                Quay lại
              </Button>
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => setPreviewVisible(true)}
                >
                  Xem trước chi tiết
                </Button>
                <Button
                  type="primary"
                  loading={loading}
                  onClick={handleSaveExam}
                  icon={<SaveOutlined />}
                >
                  {id ? 'Cập nhật đề thi' : 'Lưu đề thi'}
                </Button>
              </Space>
            </Row>
          </Card>
        )}

        {/* Preview Modal */}
        <Modal
          title="Xem trước đề thi"
          open={previewVisible}
          onCancel={() => setPreviewVisible(false)}
          width={1000}
          footer={[
            <Button key="close" onClick={() => setPreviewVisible(false)}>
              Đóng
            </Button>
          ]}
        >
          <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
            {/* Exam Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={3}>{examData?.title}</Title>
              <Paragraph>
                <Text strong>Môn: {examData?.subjectCode}</Text> | 
                <Text strong> Thời gian: {examData?.duration} phút</Text> | 
                <Text strong> Tổng điểm: {examData?.totalPoints}</Text>
              </Paragraph>
              {examData?.instructions && (
                <Alert message="Hướng dẫn làm bài" description={examData.instructions} type="info" />
              )}
            </div>

            {/* Questions */}
            {selectedQuestions.map((question, index) => (
              <Card key={question._id} style={{ marginBottom: 16 }} size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    Câu {index + 1}: {question.questionText} ({question.defaultPoints || 1} điểm)
                  </Text>
                  
                  {question.options?.map((option, optIndex) => (
                    <div key={optIndex} style={{ marginLeft: 16 }}>
                      <Text>
                        {option.letter}. {option.text}
                      </Text>
                    </div>
                  ))}
                  
                  {question.explanation && (
                    <div style={{ marginTop: 8, padding: 8, background: '#f0f0f0', borderRadius: 4 }}>
                      <Text type="secondary">
                        <strong>Giải thích:</strong> {question.explanation}
                      </Text>
                    </div>
                  )}
                </Space>
              </Card>
            ))}
          </div>
        </Modal>
      </Space>
    </Content>
  );
};

export default ExamBuilder; 