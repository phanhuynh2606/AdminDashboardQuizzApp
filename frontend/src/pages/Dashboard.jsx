import React, { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Statistic,
  Row,
  Col,
  Avatar,
  Space,
  Typography,
  Button,
  notification,
  Spin,
  Alert,
  Select,
  Popconfirm,
  Tag,
  Tooltip, // Added Tooltip
} from "antd";
import {
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  TeamOutlined,
  QuestionCircleOutlined,
  TrophyOutlined,
  FileTextOutlined,
  DeleteOutlined,
  PushpinOutlined, // Added PushpinOutlined
  CheckCircleFilled, // Added CheckCircleFilled
  InfoCircleFilled, // Added InfoCircleFilled
  ExclamationCircleFilled, // Added ExclamationCircleFilled
  CloseCircleFilled, // Added CloseCircleFilled
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import adminService from "../services/adminService";
import dayjs from "dayjs";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cleanLoading, setCleanLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const { user, getDashboardData } = useAuth();

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const result = await getDashboardData();
        if (result.success) {
          setDashboardData(result.data);
        } else {
          notification.error({
            message: "Lỗi tải dữ liệu",
            description: result.message || "Không thể tải dữ liệu dashboard",
            placement: "topRight",
          });
        }
      } catch (error) {
        notification.error({
          message: "Lỗi hệ thống",
          description: "Đã xảy ra lỗi khi tải dữ liệu",
          placement: "topRight",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [getDashboardData]);

  // Handle clean activity logs
  const handleCleanActivityLogs = async () => {
    setCleanLoading(true);
    try {
      const response = await adminService.cleanActivityLogsByTime(
        selectedPeriod
      );

      if (response.success) {
        notification.success({
          message: "Dọn dẹp thành công",
          description: response.message,
          placement: "topRight",
        });
        // Reload dashboard to update stats
        const result = await getDashboardData();
        if (result.success) {
          setDashboardData(result.data);
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      notification.error({
        message: "Lỗi dọn dẹp",
        description: error.message || "Không thể dọn dẹp activity logs",
        placement: "topRight",
      });
    } finally {
      setCleanLoading(false);
    }
  };

  const periodOptions = [
    { value: "day", label: "1 ngày", color: "#ff4d4f" },
    { value: "week", label: "1 tuần", color: "#faad14" },
    { value: "month", label: "1 tháng", color: "#52c41a" },
    { value: "3months", label: "3 tháng", color: "#1890ff" },
    { value: "6months", label: "6 tháng", color: "#722ed1" },
  ];

  const statsData = [
    {
      title: "Người dùng hoạt động",
      value: dashboardData?.stats?.activeUsers || 0,
      icon: <TeamOutlined style={{ color: "#1890ff" }} />,
      color: "#1890ff",
      subtitle: `${dashboardData?.stats?.totalStudents || 0} học sinh`,
    },
    {
      title: "Tổng đề thi",
      value: dashboardData?.stats?.totalExams || 0,
      icon: <FileTextOutlined style={{ color: "#52c41a" }} />,
      color: "#52c41a",
      subtitle: `${dashboardData?.stats?.weeklyExams || 0} tuần này`,
    },
    {
      title: "Ngân hàng câu hỏi",
      value: dashboardData?.stats?.totalQuestions || 0,
      icon: <QuestionCircleOutlined style={{ color: "#faad14" }} />,
      color: "#faad14",
      subtitle: "Câu hỏi có sẵn",
    },
    {
      title: "Điểm trung bình",
      value: dashboardData?.stats?.overallAverageScore || 0,
      precision: 1,
      icon: <TrophyOutlined style={{ color: "#722ed1" }} />,
      color: "#722ed1",
      subtitle: "Của tất cả học sinh",
    },
  ];

  const getNotificationColors = (type) => {
    switch (type) {
      case "success":
        return { borderColor: "#52c41a", iconColor: "#52c41a" };
      case "info":
        return { borderColor: "#1890ff", iconColor: "#1890ff" };
      case "warning":
        return { borderColor: "#faad14", iconColor: "#faad14" };
      case "error":
        return { borderColor: "#ff4d4f", iconColor: "#ff4d4f" };
      default:
        return { borderColor: "#d9d9d9", iconColor: "#bfbfbf" };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "cyan";
      case "medium":
        return "geekblue";
      case "high":
        return "volcano";
      case "urgent":
        return "red";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Content
      style={{
        margin: "24px",
        padding: "24px",
        background: "#f0f2f5",
        minHeight: 280,
      }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Welcome Section */}
        <Card>
          <Row gutter={24} align="middle">
            <Col flex="auto">
              <Space direction="vertical" size="small">
                <Title level={3} style={{ margin: 0 }}>
                  Chào mừng, {user?.fullName || user?.username}!
                </Title>
                <Text type="secondary" style={{ fontSize: "16px" }}>
                  Hôm nay là{" "}
                  {new Date().toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </Space>
            </Col>
            <Col>
              <Avatar size={64} icon={<UserOutlined />} />
            </Col>
          </Row>
        </Card>

        {/* Statistics Cards */}
        <Row gutter={[24, 24]}>
          {statsData.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  precision={stat.precision}
                  prefix={stat.icon}
                  valueStyle={{ color: stat.color }}
                />
                {stat.subtitle && (
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {stat.subtitle}
                  </Text>
                )}
              </Card>
            </Col>
          ))}
        </Row>

        {/* Recent Activity and Quick Actions - Same Row */}
        <Row gutter={[24, 24]} style={{ alignItems: "stretch" }}>
          <Col xs={24} lg={16} style={{ display: "flex" }}>
            <Card
              title="Hoạt động gần đây"
              size="small"
              style={{ width: "100%", height: "100%" }}
              bodyStyle={{ height: "calc(100% - 60px)", overflow: "auto" }}
              extra={
                <Space>
                  <Select
                    value={selectedPeriod}
                    onChange={setSelectedPeriod}
                    style={{ width: 100 }}
                    size="small"
                  >
                    {periodOptions.map((option) => (
                      <Select.Option key={option.value} value={option.value}>
                        <Tag
                          color={option.color}
                          style={{
                            margin: 0,
                            border: "none",
                            fontSize: "11px",
                          }}
                        >
                          {option.label}
                        </Tag>
                      </Select.Option>
                    ))}
                  </Select>
                  <Popconfirm
                    title="Dọn dẹp Activity Logs"
                    description={`Xóa tất cả logs cũ hơn ${
                      periodOptions.find((p) => p.value === selectedPeriod)
                        ?.label
                    }?`}
                    onConfirm={handleCleanActivityLogs}
                    okText="Xóa"
                    cancelText="Hủy"
                    okType="danger"
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={cleanLoading}
                      size="small"
                      type="text"
                    >
                      Dọn dẹp
                    </Button>
                  </Popconfirm>
                </Space>
              }
            >
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="small"
              >
                {dashboardData?.recentActivities?.length > 0 ? (
                  dashboardData.recentActivities.map((activity, index) => (
                    <Typography.Text key={index} style={{ fontSize: "14px" }}>
                      <span
                        style={{
                          marginRight: 8,
                          color: activity.displayInfo?.color || "#1890ff",
                          fontSize: "12px",
                        }}
                      >
                        ●
                      </span>
                      {activity.description}
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: "11px", marginLeft: 8 }}
                      >
                        {new Date(activity.createdAt).toLocaleString("vi-VN")}
                      </Typography.Text>
                    </Typography.Text>
                  ))
                ) : (
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: "14px" }}
                  >
                    Chưa có hoạt động nào được ghi nhận
                  </Typography.Text>
                )}
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={8} style={{ display: "flex" }}>
            <Card
              title="Hành động nhanh"
              extra={<SettingOutlined />}
              style={{ width: "100%", height: "100%" }}
              bodyStyle={{
                height: "calc(100% - 60px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Space
                direction="vertical"
                style={{
                  width: "100%",
                  height: "100%",
                  justifyContent: "space-between",
                }}
                size="small"
              >
                <Button type="primary" block>
                  Tạo quiz mới
                </Button>
                <Button block>Thêm câu hỏi</Button>
                <Button block>Quản lý người dùng</Button>
                <Button block>Xem báo cáo</Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Notifications */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="Thông báo hệ thống" extra={<BellOutlined />}>
              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                {dashboardData?.notifications?.length > 0 ? (
                  dashboardData.notifications.map((notification, index) => {
                    const colors = getNotificationColors(notification.type);
                    return (
                      <Alert
                        key={index}
                        type={notification.type}
                        showIcon
                        style={{
                          marginBottom: 0,
                          padding: "10px 12px",
                          borderColor: colors.borderColor,
                          borderWidth: "1px",
                          borderStyle: "solid",
                          // Custom background to be lighter if needed
                          backgroundColor: `${colors.borderColor}2A`, // 10% opacity
                        }}
                        icon={
                          <div style={{ color: colors.iconColor }}>
                            {notification.type === "success" && (
                              <CheckCircleFilled />
                            )}
                            {notification.type === "info" && (
                              <InfoCircleFilled />
                            )}
                            {notification.type === "warning" && (
                              <ExclamationCircleFilled />
                            )}
                            {notification.type === "error" && (
                              <CloseCircleFilled />
                            )}
                          </div>
                        }
                        message={
                          <Row
                            gutter={[8, 4]}
                            align="top"
                            style={{ width: "100%" }}
                          >
                            <Col span={24}>
                              <Space
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  width: "100%",
                                }}
                              >
                                <Text strong style={{ fontSize: "15px" }}>
                                  {notification.title}
                                </Text>
                                <Space size={4}>
                                  {notification.isPinned && (
                                    <Tooltip title="Thông báo quan trọng">
                                      <PushpinOutlined
                                        style={{
                                          color: "goldenrod",
                                          fontSize: "16px",
                                          fontWeight: "bold",
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                  <Tag
                                    color={getPriorityColor(
                                      notification.priority
                                    )}
                                  >
                                    {notification.priority}
                                  </Tag>
                                </Space>
                              </Space>
                            </Col>
                            <Col span={24}>
                              <Text
                                type="secondary"
                                style={{ fontSize: "14px" }}
                                ellipsis={{ rows: 3 }}
                              >
                                {notification.message}
                              </Text>
                            </Col>
                            <Col span={24}>
                              <Row
                                gutter={[8, 4]}
                                align="top"
                                style={{ width: "100%" }}
                                justify="start"
                              >
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: "13px",fontWeight: "bold" }}
                                  >
                                    {notification.audience === "all"
                                      ? "Gửi tới: Tất cả"
                                      : notification.audience === "admin"
                                      ? "Gửi tới: Admin"
                                      : "Gửi tới: Sinh viên"}
                                  </Text>
                                  
                                    {notification.createdAt && (
                                    <Text
                                      type={notification.type === "success" ? "success" : notification.type === "info" ? "info" : notification.type === "warning" ? "warning" : "error"}
                                      style={{ fontSize: "13px", marginLeft: 8,fontWeight: "bold" }}
                                    >
                                      {"🧭"}
                                      {dayjs(notification.createdAt).format(
                                        "DD/MM/YYYY HH:mm"
                                      )}
                                    </Text>
                                  )}
                              </Row>
                            </Col>
                          </Row>
                        }
                      />
                    );
                  })
                ) : (
                  <Alert
                    message="Không có thông báo mới"
                    type="info"
                    showIcon
                  />
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </Content>
  );
};

export default Dashboard;
