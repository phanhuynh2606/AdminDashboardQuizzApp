// pages/QuizHistory.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Progress,
  Typography,
  Row,
  Col,
  Statistic,
  Modal,
  message,
  Tooltip,
  Divider,
  Badge
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import practiceHistoryService from '../services/exam-history';
import moment from 'moment';
import { Content } from 'antd/es/layout/layout';


const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { confirm } = Modal;

const QuizHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    userSessionId: user?.sessionId || '',
    subjectCode: '',
    examTypeCode: '',
    isCompleted: '',
    dateRange: null
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [detailModal, setDetailModal] = useState({
    visible: false,
    data: null,
    loading: false
  });
const getExamTypeName = (code) => {
    const examTypeNames = {
      'PE': 'Thực hành',
      'FE': 'Cuối kỳ',
      'QUIZ': 'Trắc nghiệm',
      'MIDTERM': 'Giữa kỳ',
    };
    return examTypeNames[code] || code;
  };
  
  const [subjects, setSubjects] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  // Tải dữ liệu
  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        ...params
      };

      // Xử lý khoảng thời gian
      if (filters.dateRange && filters.dateRange.length === 2) {
        queryParams.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        queryParams.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await practiceHistoryService.getHistories(queryParams);
      
      if (response.success) {
        setData(response.data.histories);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
        setStats(response.data.stats);
       // Cập nhật subjects và examTypes từ response
        if (response.data.subjects) {
          setSubjects(response.data.subjects.map(code => ({ 
            code, 
            name: code // Function để convert code thành tên
          })));
        }
        
        if (response.data.examTypes) {
          setExamTypes(response.data.examTypes.map(code => ({ 
            code, 
            name: getExamTypeName(code) // Function để convert code thành tên
          })));
        }
      }
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Tải chi tiết lịch sử
  const fetchHistoryDetail = async (id) => {
    setDetailModal(prev => ({ ...prev, loading: true }));
    try {
      const response = await practiceHistoryService.getHistoryDetail(id);
      if (response.success) {
        setDetailModal(prev => ({
          ...prev,
          data: response.data,
          loading: false
        }));
      }
    } catch (error) {
      message.error('Lỗi khi tải chi tiết: ' + error.message);
      setDetailModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Xóa lịch sử
  const handleDelete = (id) => {
    confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa lịch sử làm bài này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await practiceHistoryService.deleteHistory(id);
          message.success('Đã xóa lịch sử thành công');
          fetchData();
        } catch (error) {
          message.error('Lỗi khi xóa: ' + error.message);
        }
      }
    });
  };

  // Xóa nhiều lịch sử
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một mục để xóa');
      return;
    }

    confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} lịch sử làm bài?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => practiceHistoryService.deleteHistory(id)));
          message.success('Đã xóa lịch sử thành công');
          setSelectedRowKeys([]);
          fetchData();
        } catch (error) {
          message.error('Lỗi khi xóa: ' + error.message);
        }
      }
    });
  };

  // Xuất dữ liệu
  const handleExport = async () => {
    try {
      const response = await practiceHistoryService.exportHistories(filters);
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz_history_${moment().format('YYYY-MM-DD')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Đã xuất dữ liệu thành công');
    } catch (error) {
      message.error('Lỗi khi xuất dữ liệu: ' + error.message);
    }
  };

  // Cột bảng
  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Bài thi',
      dataIndex: ['examId', 'title'],
      key: 'examTitle',
      width: 200,
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-500 text-sm">
            {record.subjectCode} - {record.examTypeCode}
          </div>
        </div>
      )
    },
    {
      title: 'Thời gian bắt đầu',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 150,
      render: (text) => moment(text).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Thời gian kết thúc',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 120,
      render: (text) => moment(text).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Điểm số',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score, record) => (
        <div className="text-center">
          <div className="text-lg font-semibold">{score.toFixed(2)}/100</div>
          <Progress
            percent={score}
            size="small"
            strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#f5222d'}
            showInfo={false}
          />
        </div>
      )
    },
    {
      title: 'Câu đúng',
      key: 'correctAnswers',
      width: 100,
      render: (_, record) => (
        <div className="text-center">
          <div className="text-green-600 font-medium">
            {record.correctAnswers}/{record.totalQuestions}
          </div>
          <div className="text-gray-500 text-sm">
            {record.totalQuestions > 0 ? Math.round((record.correctAnswers / record.totalQuestions) * 100) : 0}%
          </div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isCompleted',
      key: 'isCompleted',
      width: 100,
      render: (isCompleted) => (
        <Badge
          status={isCompleted ? 'success' : 'processing'}
          text={isCompleted ? 'Hoàn thành' : 'Đang làm'}
        />
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setDetailModal({ visible: true, data: null, loading: false });
                fetchHistoryDetail(record._id);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record._id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // Row selection
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      disabled: record.isCompleted === false
    })
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  return (
    <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={3} className="!mb-0">
          <ClockCircleOutlined className="mr-2" style={{ fontSize: '24px', color: '#3798edff' ,marginRight: '8px' }} />
          Lịch sử làm bài
        </Title>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={loading}
          >
            Xuất Excel
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchData()}
            disabled={loading}
          >
            Tải lại
          </Button>
        </Space>
      </div>

      {/* Thống kê */}
      <Row gutter={[16, 16]} style={{ marginTop: 16, marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số lần làm bài"
              value={stats.totalAttempts || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đã hoàn thành"
              value={stats.completedAttempts || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Điểm trung bình"
              value={stats.averageScore || 0}
              precision={1}
              suffix="/100"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng thời gian"
              value={Math.round((stats.totalTimeSpent || 0) / 60)}
              suffix="phút"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Chọn môn học"
              value={filters.subjectCode}
              onChange={(value) => setFilters(prev => ({ ...prev, subjectCode: value }))}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="">Tất cả môn học</Option>
              {subjects.map(subject => (
                <Option key={subject.code} value={subject.code}>
                  {subject.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Chọn loại bài thi"
              value={filters.examTypeCode}
              onChange={(value) => setFilters(prev => ({ ...prev, examTypeCode: value }))}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="">Tất cả loại bài thi</Option>
              {examTypes.map(type => (
                <Option key={type.code} value={type.code}>
                  {type.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Trạng thái"
              value={filters.isCompleted}
              onChange={(value) => setFilters(prev => ({ ...prev, isCompleted: value }))}
              style={{ width: '100%' }}
              allowClear
            > 
              <Option value="">Tất cả</Option>
              <Option value="true">Hoàn thành</Option>
              <Option value="false">Đang làm</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => fetchData()}
              loading={loading}
            >
              Tìm kiếm
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <Card>
          <Space>
            <Text strong>Đã chọn {selectedRowKeys.length} mục</Text>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
            >
              Xóa đã chọn
            </Button>
          </Space>
        </Card>
      )}

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            }
          }}
          rowSelection={rowSelection}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết lịch sử làm bài"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, data: null, loading: false })}
        footer={null}
        width={800}
      >
        {detailModal.loading ? (
          <div className="text-center py-8">
            <span>Đang tải...</span>
          </div>
        ) : detailModal.data ? (
          <DetailContent data={detailModal.data} />
        ) : null}
      </Modal>
    </Content>
  );
};

// Component hiển thị chi tiết
const DetailContent = ({ data }) => {
  // Helper function để format thời gian từ startTime và endTime
  const formatExamDuration = (startTime, endTime) => {
    // Kiểm tra đầu vào
    if (!startTime || !endTime) {
      return '0 giây';
    }

  // Chuyển đổi thành moment objects
  const start = moment(startTime);
  const end = moment(endTime);

  // Kiểm tra tính hợp lệ của thời gian
  if (!start.isValid() || !end.isValid()) {
    return '0 giây';
  }

  // Tính tổng số giây
  const totalSeconds = end.diff(start, 'seconds');

  // Nếu thời gian âm hoặc bằng 0
  if (totalSeconds <= 0) {
    return '0 giây';
  }

  // Logic hiển thị theo từng khoảng thời gian
  if (totalSeconds < 60) {
    // Dưới 1 phút: chỉ hiển thị giây
    return `${totalSeconds} giây`;
  } 
  else if (totalSeconds < 3600) {
    // Dưới 1 giờ: hiển thị phút và giây
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (seconds === 0) {
      return `${minutes} phút`;
    } else {
      return `${minutes} phút ${seconds} giây`;
    }
  } 
  else {
    // Trên 1 giờ: hiển thị giờ, phút, giây
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    let result = `${hours} giờ`;
    
    if (minutes > 0) {
      result += ` ${minutes} phút`;
    }
    
    if (seconds > 0) {
      result += ` ${seconds} giây`;
    }
    
    return result;
  }
}
  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  const getAnswerStatus = (answer) => {
    if (answer.isCorrect) {
      return <Tag color="success">Đúng</Tag>;
    }
    return <Tag color="error">Sai</Tag>;
  };

  return (
    <div className="space-y-6">
      {/* Thông tin chung */}
      <Card title="Thông tin chung" size="small">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div>
              <Text strong>Bài thi:</Text>
              <div>{data.examId?.examTitle}</div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Text strong>Mô tả:</Text>
              <div>{data.examId?.description || 'Không có mô tả'}</div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Text strong>Môn học:</Text>
              <div>{data.subjectCode}</div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Text strong>Loại bài thi:</Text>
              <div>{data.examTypeCode}</div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Text strong>Thời gian bắt đầu:</Text>
              <div>{moment(data.startTime).format('DD/MM/YYYY HH:mm:ss')}</div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Text strong>Thời gian kết thúc:</Text>
              <div>
                {data.endTime ? moment(data.endTime).format('DD/MM/YYYY HH:mm:ss') : 'Chưa hoàn thành'}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Kết quả */}
      <Card title="Kết quả" size="small">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic
              title="Điểm số"
              value={data.score.toFixed(2)}
              suffix="/100"
              valueStyle={{ color: getScoreColor(data.score) }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Câu đúng"
              value={data.correctAnswers}
              suffix={`/${data.totalQuestions}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Thời gian làm bài"
              value={`${formatExamDuration(data.startTime, data.endTime)}`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>
        <div className="mt-4">
          <Progress
            percent={data.totalQuestions > 0 ? Math.round((data.correctAnswers / data.totalQuestions) * 100) : 0}
            strokeColor={getScoreColor(data.score)}
            format={() => `${data.correctAnswers}/${data.totalQuestions}`}
          />
        </div>
      </Card>

      {/* Chi tiết câu trả lời */}
      {data.answers && data.answers.length > 0 && (
        <Card title="Chi tiết câu trả lời" size="small">
          <div className="space-y-4 max-h-400 overflow-y-auto">
            {data.answers.map((answer, index) => (
              <div key={index} className="border-b pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Text strong>Câu {index + 1}:</Text>
                  {getAnswerStatus(answer)}
                </div>
                
                {answer.questionId && (
                  <div className="mb-2">
                    <Text>{answer.questionId.content}</Text>
                  </div>
                )}
                
                <div className="pl-4">
                  <div className="mb-1">
                    <Text type="secondary">Đáp án đã chọn:</Text>
                    <span className="ml-2 font-medium">{answer.selectedAnswer || 'Chưa chọn'}</span>
                  </div>
                  
                  {answer.questionId?.correctAnswer && (
                    <div className="mb-1">
                      <Text type="secondary">Đáp án đúng:</Text>
                      <span className="ml-2 text-green-600 font-medium">
                        {answer.questionId.correctAnswer}
                      </span>
                    </div>
                  )}
                  
                  {answer.questionId?.explanation && (
                    <div>
                      <Text type="secondary">Giải thích:</Text>
                      <div className="ml-2 text-gray-600 text-sm">
                        {answer.questionId.explanation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default QuizHistory;