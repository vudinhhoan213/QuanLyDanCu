import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Divider,
  message,
  Avatar,
  Descriptions,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Badge,
  List,
  Upload,
} from "antd";

import {
  BellOutlined, 
  CheckOutlined, 
  UserAddOutlined, 
  UserDeleteOutlined,
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  GiftOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  IdcardOutlined,
  CalendarOutlined,
  ManOutlined,
  WomanOutlined,
  CrownOutlined,
  EditOutlined,
  SaveOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  CameraOutlined,
  UploadOutlined,
  DeleteOutlined,
  HomeOutlined, 
  SendOutlined,
  SwapOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  RocketOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../../components/Layout";
import dayjs from "dayjs";
import {
  householdService,
  citizenService,
  editRequestService,
  rewardService,
  notificationService,
  uploadService,
} from "../../services";


const NotificationType = {
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  INFO: "info",
  AWARD: "award",
};
  
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const LeaderDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaderInfo, setLeaderInfo] = useState(null);
  const [stats, setStats] = useState({
    households: { total: 0, increase: 0, percentage: 0 },
    citizens: { total: 0, increase: 0, percentage: 0 },
    pendingRequests: { total: 0, decrease: 0, percentage: 0 },
    rewards: { total: 0, increase: 0, percentage: 0 },
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationModalVisible, setIsNotificationModalVisible] =
    useState(false);
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] =
    useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const getNotificationIcon = (category) => {
  const iconStyle = { fontSize: "20px" };

  switch (category) {
    case "add":
      return <UserAddOutlined style={iconStyle} />;
    case "delete":
      return <UserDeleteOutlined style={iconStyle} />;
    case "edit":
      return <EditOutlined style={iconStyle} />;
    case "tam-tru":
      return <HomeOutlined style={iconStyle} />;
    case "tam-vang":
      return <SendOutlined style={iconStyle} />;
    case "chuyen-den":
    case "chuyen-di":
      return <SwapOutlined style={iconStyle} />;
    case "khen-thuong":
      return <TrophyOutlined style={iconStyle} />;
    default:
      return <InfoCircleOutlined style={iconStyle} />;
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case "success":
      return "#52c41a";
    case "warning":
      return "#faad14";
    case "error":
      return "#ff4d4f";
    case "info":
      return "#1890ff";
    case "award":
      return "#fadb14";
    default:
      return "#1890ff";
  }
};

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Vừa xong";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  return `${Math.floor(seconds / 86400)} ngày trước`;
};

const QuickAction = ({ icon, title, description, onClick, color }) => (
  <motion.div 
    whileHover={{ scale: 1.05 }} 
    whileTap={{ scale: 0.95 }}
    style={{ height: '100%' }}
  >
    <Card 
      hoverable 
      bordered={false}
      onClick={onClick}
      style={{ 
        textAlign: 'center',
        background: `linear-gradient(135deg, ${color}15, ${color}08)`,
        border: `1px solid ${color}20`,
        borderRadius: '12px',
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      bodyStyle={{ padding: '20px 16px' }}
    >
      {/* Icon lớn ở giữa */}
      <div 
        style={{ 
          fontSize: 32,
          color: color,
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      
      {/* Tiêu đề */}
      <Text strong style={{ 
        display: 'block', 
        marginBottom: 4,
        fontSize: '16px',
        color: '#1a1a1a'
      }}>
        {title}
      </Text>
      
      {/* Mô tả */}
      <Text type="secondary" style={{ 
        fontSize: 12,
        lineHeight: '1.4'
      }}>
        {description}
      </Text>
    </Card>
  </motion.div>
);



  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch leader info
        try {
          const leaderResponse = await citizenService.getMe();
          setLeaderInfo(leaderResponse);
        } catch (err) {
        }

        // Fetch all stats in parallel
        const [
          householdStats,
          citizenStats,
          requestStats,
          rewardStats,
          requests,
        ] = await Promise.all([
          householdService.getStats().catch(() => ({ total: 0 })),
          citizenService.getStats().catch(() => ({ total: 0 })),
          editRequestService.getStats().catch(() => ({ pending: 0 })),
          rewardService.proposals.getStats().catch(() => ({ total: 0 })),
          editRequestService
            .getAll({ limit: 5, status: "pending" })
            .catch(() => []),
        ]);

        // Update stats
        setStats({
          households: {
            total: householdStats.total || 0,
            increase: householdStats.lastMonthIncrease || 0,
            percentage: householdStats.percentageChange || 0,
          },
          citizens: {
            total: citizenStats.total || 0,
            increase: citizenStats.lastMonthIncrease || 0,
            percentage: citizenStats.percentageChange || 0,
          },
          pendingRequests: {
            total: requestStats.pending || 0,
            decrease: requestStats.lastMonthChange || 0,
            percentage: requestStats.percentageChange || 0,
          },
          rewards: {
            total: rewardStats.total || 0,
            increase: rewardStats.thisMonthTotal || 0,
            percentage: rewardStats.percentageChange || 0,
          },
        });

        // Update recent requests
        // Handle response structure: { docs, total } or array
        const requestsData = requests.docs || requests || [];
        if (Array.isArray(requestsData)) {
          setRecentRequests(
            requestsData.slice(0, 5).map((req, index) => ({
              key: req._id || index,
              id: req.code || req._id,
              citizen: req.citizenId?.fullName || req.fullName || "N/A",
              type: req.requestType || "N/A",
              date: req.createdAt || new Date().toISOString(),
              status: req.status || "pending",
            }))
          );
        }

        // Fetch notifications (chỉ lấy yêu cầu mới, không lấy phản hồi)
        try {
          const notificationsResponse = await notificationService.getAll({
            limit: 50,
            sort: "-createdAt",
          });
          const allNotifs =
            notificationsResponse.docs || notificationsResponse || [];

          // Filter: CHỈ lấy thông báo "yêu cầu mới" (title có "Mới")
          // Loại bỏ thông báo phản hồi (title có "được duyệt" hoặc "bị từ chối")
          const newRequestNotifs = allNotifs.filter((n) => {
  const title = n.title || "";
  // Loại bỏ thông báo phản hồi (title có "được duyệt" hoặc "bị từ chối")
  return !title.includes("được duyệt") && !title.includes("bị từ chối");
});

          console.log(
            
          );
          setNotifications(newRequestNotifs);
          const unread = newRequestNotifs.filter((n) => !n.isRead).length;
          setUnreadCount(unread);
        } catch (err) {
          console.log("⚠️ No notifications yet:", err.message);
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        message.error("Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleEditProfile = () => {
    // Nếu đã có thông tin, điền vào form
    if (leaderInfo) {
      profileForm.setFieldsValue({
        fullName: leaderInfo.fullName,
        avatarUrl: leaderInfo.avatarUrl || "",
        email: leaderInfo.email || "",
        phone: leaderInfo.phone || "",
        nationalId: leaderInfo.nationalId || "",
        dateOfBirth: leaderInfo.dateOfBirth
          ? dayjs(leaderInfo.dateOfBirth)
          : null,
        gender: leaderInfo.gender,
        ethnicity: leaderInfo.ethnicity || "Kinh",
        nationality: leaderInfo.nationality || "Việt Nam",
        educationLevel: leaderInfo.educationLevel || "",
        occupation: leaderInfo.occupation || "",
      });
    } else {
      // Nếu chưa có thông tin, để form trống với giá trị mặc định
      profileForm.setFieldsValue({
        fullName: user?.fullName || "",
        avatarUrl: "",
        email: "",
        phone: "",
        nationalId: "",
        dateOfBirth: null,
        gender: undefined,
        ethnicity: "Kinh",
        nationality: "Việt Nam",
        educationLevel: "",
        occupation: "",
      });
    }
    setIsEditProfileModalVisible(true);
  };

  const handleUpdateProfile = async (values) => {
    setUpdateLoading(true);
    try {
      const updateData = {
        ...values,
        dateOfBirth: values.dateOfBirth
          ? values.dateOfBirth.toISOString()
          : null,
      };
      const updatedLeader = await citizenService.updateMe(updateData);
      setLeaderInfo(updatedLeader);

      if (!leaderInfo) {
        message.success("Thông tin cá nhân đã được lưu thành công!");
      } else {
        message.success("Cập nhật thông tin thành công!");
      }

      setIsEditProfileModalVisible(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại"
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateAvatar = async () => {
    if (fileList.length === 0) {
      message.warning("Vui lòng tải ảnh đại diện");
      return;
    }

    setUploading(true);
    try {
      const file = fileList[0].originFileObj;

      const response = await uploadService.uploadAvatar(file);
    

      // Update leader info với avatar mới
      setLeaderInfo(response.citizen);
      message.success("Cập nhật ảnh đại diện thành công!");

      // Reset form
      setFileList([]);
      setIsAvatarModalVisible(false);
    } catch (error) {
      console.error("❌ Error uploading avatar:", error);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra khi upload ảnh"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await uploadService.deleteAvatar();
      const updatedLeader = await citizenService.getMe();
      setLeaderInfo(updatedLeader);
      message.success("Đã xóa ảnh đại diện");
    } catch (error) {
      console.error("❌ Error deleting avatar:", error);
      message.error("Có lỗi xảy ra khi xóa ảnh");
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      message.success("Đã đánh dấu đã đọc");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      message.error("Không thể đánh dấu đã đọc");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !n.isRead)
        .map((n) => n._id);
      if (unreadIds.length === 0) {
        message.info("Không có thông báo chưa đọc");
        return;
      }
      await notificationService.markAllAsRead(unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      message.success("Đã đánh dấu tất cả đã đọc");
    } catch (error) {
      console.error("Error marking all as read:", error);
      message.error("Không thể đánh dấu tất cả đã đọc");
    }
  };



  return (
    <Layout>
      <div>
        {/* Page Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Tổ Trưởng
          </Title>
        </div>

        {/* Welcome Card with Leader Info */}
        <Card
          style={{
            marginBottom: 24,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
          }}
          bodyStyle={{ padding: "32px" }}
        >
          <Row align="middle" gutter={24}>
            <Col>
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  size={80}
                  src={uploadService.getAvatarUrl(leaderInfo?.avatarUrl)}
                  icon={
                    !leaderInfo?.avatarUrl &&
                    (leaderInfo?.gender === "MALE" ? (
                      <ManOutlined />
                    ) : (
                      <WomanOutlined />
                    ))
                  }
                  style={{
                    backgroundColor: leaderInfo?.avatarUrl
                      ? "#fff"
                      : leaderInfo?.gender === "MALE"
                      ? "#1890ff"
                      : "#eb2f96",
                  }}
                  onError={(e) => {
                    return true; // Fallback to icon
                  }}
                />
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined />}
                  size="small"
                  onClick={() => {
                    setFileList([]);
                    setAvatarPreviewError(false);
                    setIsAvatarModalVisible(true);
                  }}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  }}
                />
              </div>
            </Col>
            <Col flex="auto">
              <Space direction="vertical" size={4}>
                <Title level={3} style={{ color: "white", marginBottom: 0 }}>
                  Chào mừng,{" "}
                  {leaderInfo?.fullName || user?.fullName || user?.username}!
                </Title>
                <Space size="middle">
                  <Tag
                    color="gold"
                    icon={<CrownOutlined />}
                    style={{ fontSize: "14px" }}
                  >
                    Tổ trưởng
                  </Tag>
                  {leaderInfo?.citizenCode && (
                    <Tag
                      color="blue"
                      style={{ fontSize: "14px", color: "white" }}
                    >
                      {leaderInfo.citizenCode}
                    </Tag>
                  )}
                </Space>
              </Space>
            </Col>
            <Col>
              <Space>
                {leaderInfo ? (
                  <Button
                    type="primary"
                    size="large"
                    icon={<EditOutlined />}
                    onClick={handleEditProfile}
                  >
                    Chỉnh sửa
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    icon={<EditOutlined />}
                    onClick={() => setIsEditProfileModalVisible(true)}
                  >
                    Điền thông tin cá nhân
                  </Button>
                )}
              </Space>
            </Col>
          </Row>

          {/* Leader Details */}
          {leaderInfo ? (
            <div style={{ marginTop: 24 }}>
              <Descriptions
                column={{ xs: 1, sm: 2, md: 4 }}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <Descriptions.Item
                  label={
                    <Text style={{ color: "rgba(255, 255, 255, 0.85)" }}>
                      <IdcardOutlined /> CCCD/CMND
                    </Text>
                  }
                >
                  <Text strong style={{ color: "white" }}>
                    {leaderInfo.nationalId || "Chưa có"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Text style={{ color: "rgba(255, 255, 255, 0.85)" }}>
                      <CalendarOutlined /> Ngày sinh
                    </Text>
                  }
                >
                  <Text strong style={{ color: "white" }}>
                    {leaderInfo.dateOfBirth
                      ? dayjs(leaderInfo.dateOfBirth).format("DD/MM/YYYY")
                      : "Chưa có"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Text style={{ color: "rgba(255, 255, 255, 0.85)" }}>
                      Giới tính
                    </Text>
                  }
                >
                  <Text strong style={{ color: "white" }}>
                    {leaderInfo.gender === "MALE"
                      ? "Nam"
                      : leaderInfo.gender === "FEMALE"
                      ? "Nữ"
                      : "Khác"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Text style={{ color: "rgba(255, 255, 255, 0.85)" }}>
                      Nghề nghiệp
                    </Text>
                  }
                >
                  <Text strong style={{ color: "white" }}>
                    {leaderInfo.occupation || "Chưa có"}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </div>
          ) : (
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <IdcardOutlined
                  style={{ fontSize: 48, color: "white", marginBottom: 16 }}
                />
                <Text
                  strong
                  style={{ color: "white", fontSize: 16, display: "block" }}
                >
                  Vui lòng điền thông tin cá nhân của bạn
                </Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.85)" }}>
                  Để sử dụng đầy đủ chức năng hệ thống
                </Text>
              </div>
            </div>
          )}
        </Card>

        {/* Statistics Cards */}
<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
  <Col xs={24} sm={12} lg={6}>
    <Card 
      bordered={false} 
      hoverable
      style={{ 
        background: 'linear-gradient(135deg, #1890ff15, #1890ff08)',
        borderLeft: '4px solid #1890ff'
      }}
    >
      <Statistic
        title="Tổng Hộ Khẩu"
        value={stats.households.total}
        prefix={<TeamOutlined style={{ color: "#1890ff" }} />}
        suffix={
          <Space size={4} style={{ fontSize: 14 }}>
            <ArrowUpOutlined style={{ color: "#3f8600" }} />
            <Text type="success">{stats.households.percentage}%</Text>
          </Space>
        }
      />
      <Text type="secondary" style={{ fontSize: 12 }}>
        +{stats.households.increase} so với tháng trước
      </Text>
    </Card>
  </Col>

  <Col xs={24} sm={12} lg={6}>
    <Card 
      bordered={false} 
      hoverable
      style={{ 
        background: 'linear-gradient(135deg, #52c41a15, #52c41a08)',
        borderLeft: '4px solid #52c41a'
      }}
    >
      <Statistic
        title="Tổng Công Dân"
        value={stats.citizens.total}
        prefix={<UserOutlined style={{ color: "#52c41a" }} />}
        suffix={
          <Space size={4} style={{ fontSize: 14 }}>
            <ArrowUpOutlined style={{ color: "#3f8600" }} />
            <Text type="success">{stats.citizens.percentage}%</Text>
          </Space>
        }
      />
      <Text type="secondary" style={{ fontSize: 12 }}>
        +{stats.citizens.increase} so với tháng trước
      </Text>
    </Card>
  </Col>

  <Col xs={24} sm={12} lg={6}>
    <Card 
      bordered={false} 
      hoverable
      style={{ 
        background: 'linear-gradient(135deg, #faad1415, #faad1408)',
        borderLeft: '4px solid #faad14'
      }}
    >
      <Statistic
        title="Yêu Cầu Chờ Duyệt"
        value={stats.pendingRequests.total}
        prefix={<FileTextOutlined style={{ color: "#faad14" }} />}
        suffix={
          <Space size={4} style={{ fontSize: 14 }}>
            <ArrowDownOutlined style={{ color: "#cf1322" }} />
            <Text type="danger">
              {Math.abs(stats.pendingRequests.percentage)}%
            </Text>
          </Space>
        }
      />
      <Text type="secondary" style={{ fontSize: 12 }}>
        {stats.pendingRequests.decrease} so với tháng trước
      </Text>
    </Card>
  </Col>

  <Col xs={24} sm={12} lg={6}>
    <Card 
      bordered={false} 
      hoverable
      style={{ 
        background: 'linear-gradient(135deg, #eb2f9615, #eb2f9608)',
        borderLeft: '4px solid #eb2f96'
      }}
    >
      <Statistic
        title="Khen Thưởng Tháng Này"
        value={stats.rewards.total}
        prefix={<GiftOutlined style={{ color: "#eb2f96" }} />}
        suffix={
          <Space size={4} style={{ fontSize: 14 }}>
            <ArrowUpOutlined style={{ color: "#3f8600" }} />
            <Text type="success">{stats.rewards.percentage}%</Text>
          </Space>
        }
      />
      <Text type="secondary" style={{ fontSize: 12 }}>
        +{stats.rewards.increase} so với tháng trước
      </Text>
    </Card>
  </Col>
</Row>

        {/* Notifications Card */}
<Card
  title={
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
        }}>
          <BellOutlined style={{ fontSize: '20px', color: 'white' }} />
        </div>
        <div>
          <Title level={5} style={{ margin: 0, color: '#1f2937' }}>
            Thông báo mới
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            Các yêu cầu cần xử lý
          </Text>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {unreadCount > 0 && (
          <Badge 
            count={unreadCount} 
            style={{ 
              backgroundColor: '#ff4d4f',
              boxShadow: '0 2px 6px rgba(255, 77, 79, 0.3)'
            }}
          />
        )}
        {unreadCount > 0 && (
          <Button 
            type="link" 
            onClick={handleMarkAllAsRead}
            style={{ 
              padding: '4px 8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#1890ff'
            }}
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </div>
    </div>
  }
  bordered={false}
  style={{ 
    marginBottom: 24,
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f0f0f0'
  }}
  bodyStyle={{ padding: '8px 0' }}
>
  {notifications.length === 0 ? (
    <div style={{ 
      textAlign: 'center', 
      padding: '48px 24px',
      background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
      borderRadius: '12px',
      margin: '8px 16px'
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <BellOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
      </div>
      <Title level={5} style={{ color: '#bfbfbf', marginBottom: 8 }}>
        Không có thông báo
      </Title>
      <Text type="secondary" style={{ fontSize: '14px' }}>
        Tất cả yêu cầu đã được xử lý
      </Text>
    </div>
  ) : (
    <div style={{ padding: '0 8px' }}>
      <List
        dataSource={notifications.slice(0, 5)}
        renderItem={(item, index) => {
          const color = getNotificationColor(item.type);

          return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <List.Item
                style={{
                  padding: '16px 12px',
                  background: !item.isRead 
                    ? `linear-gradient(135deg, ${color}08, ${color}04)` 
                    : '#ffffff',
                  borderRadius: '12px',
                  border: !item.isRead 
                    ? `1px solid ${color}20` 
                    : '1px solid #f0f0f0',
                  margin: '8px 0',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => !item.isRead && handleMarkAsRead(item._id)}
              >
                {!item.isRead && (
                  <div 
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      background: `linear-gradient(180deg, ${color}, ${color}80)`,
                      borderRadius: '4px 0 0 4px'
                    }}
                  />
                )}
                
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: color,
                        border: `1px solid ${color}30`,
                        marginRight: 12
                      }}
                    >
                      {getNotificationIcon(item.category)}
                    </div>
                  }
                  title={
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: 1 }}>
                        <Text 
                          strong 
                          style={{ 
                            fontSize: '14px',
                            color: !item.isRead ? '#1f2937' : '#9ca3af',
                            lineHeight: '1.4'
                          }}
                        >
                          {item.title.replace(' Mới', '')}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Text 
                            style={{ 
                              fontSize: '13px',
                              color: !item.isRead ? '#6b7280' : '#d1d5db',
                              lineHeight: '1.4'
                            }}
                          >
                            {item.message}
                          </Text>
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-end',
                        gap: 4
                      }}>
                        <Text
                          type="secondary"
                          style={{ 
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#9ca3af'
                          }}
                        >
                          {getTimeAgo(item.createdAt)}
                        </Text>
                        {!item.isRead && (
                          <Badge 
                            status="processing" 
                            color={color}
                            text={
                              <Text 
                                style={{ 
                                  fontSize: '11px',
                                  color: color,
                                  fontWeight: 500
                                }}
                              >
                                Mới
                              </Text>
                            }
                          />
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            </motion.div>
          );
        }}
      />
      
      {notifications.length > 5 && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: 16,
          padding: '16px 0 8px'
        }}>
          <Button
            type="link"
            onClick={() => setIsNotificationModalVisible(true)}
            style={{ 
              fontSize: '14px',
              fontWeight: 500,
              color: '#1890ff'
            }}
            icon={<EyeOutlined />}
          >
            Xem tất cả {notifications.length} thông báo
          </Button>
        </div>
      )}
    </div>
  )}
</Card>

        {/* Quick Actions */}
        <Divider />
        <Card 
  title={
    <Space>
      <RocketOutlined />
      <span>Thao tác nhanh</span>
    </Space>
  } 
  bordered={false}
  style={{ marginBottom: 24 }}
>
  <Row gutter={[16, 16]}>
    <Col xs={12} sm={8} md={6}>
      <QuickAction
        icon={<TeamOutlined />}
        title="Hộ khẩu"
        description="Quản lý hộ khẩu"
        color="#1890ff"
        onClick={() => navigate("/leader/households")}
      />
    </Col>
    <Col xs={12} sm={8} md={6}>
      <QuickAction
        icon={<UserOutlined />}
        title="Công dân"
        description="Quản lý công dân"
        color="#52c41a"
        onClick={() => navigate("/leader/citizens")}
      />
    </Col>
    <Col xs={12} sm={8} md={6}>
      <QuickAction
        icon={<FileTextOutlined />}
        title="Yêu cầu"
        description="Duyệt yêu cầu"
        color="#faad14"
        onClick={() => navigate("/leader/edit-requests")}
      />
    </Col>
    <Col xs={12} sm={8} md={6}>
      <QuickAction
        icon={<GiftOutlined />}
        title="Khen thưởng"
        description="Đề xuất khen thưởng"
        color="#eb2f96"
        onClick={() => navigate("/leader/reward-proposals")}
      />
    </Col>
  </Row>
</Card>

        {/* Edit Profile Modal */}
        <Modal
          title={
            <Space>
              <EditOutlined />
              <span>
                {leaderInfo
                  ? "Chỉnh sửa thông tin cá nhân"
                  : "Điền thông tin cá nhân"}
              </span>
            </Space>
          }
          open={isEditProfileModalVisible}
          onCancel={() => setIsEditProfileModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleUpdateProfile}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fullName"
                  label="Họ và tên"
                  rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    size="large"
                    placeholder="Họ và tên đầy đủ"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ type: "email", message: "Email không hợp lệ" }]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    size="large"
                    placeholder="Email"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="avatarUrl"
                  label="URL ảnh đại diện"
                  rules={[
                    {
                      type: "url",
                      message:
                        "Vui lòng nhập URL hợp lệ (bắt đầu với http:// hoặc https://)",
                    },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    size="large"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[
                    {
                      pattern: /^[0-9]{10}$/,
                      message: "Số điện thoại không hợp lệ (10 số)",
                    },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    size="large"
                    placeholder="Số điện thoại"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="nationalId"
                  label="CCCD/CMND"
                  rules={[
                    {
                      pattern: /^[0-9]{9,12}$/,
                      message: "CCCD/CMND không hợp lệ (9-12 số)",
                    },
                  ]}
                >
                  <Input
                    prefix={<IdcardOutlined />}
                    size="large"
                    placeholder="Số CCCD/CMND"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="dateOfBirth"
                  label="Ngày sinh"
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày sinh" },
                  ]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    size="large"
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày sinh"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="gender"
                  label="Giới tính"
                  rules={[
                    { required: true, message: "Vui lòng chọn giới tính" },
                  ]}
                >
                  <Select size="large" placeholder="Chọn giới tính">
                    <Option value="MALE">Nam</Option>
                    <Option value="FEMALE">Nữ</Option>
                    <Option value="OTHER">Khác</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="ethnicity" label="Dân tộc">
                  <Input size="large" placeholder="Dân tộc" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="nationality" label="Quốc tịch">
                  <Input size="large" placeholder="Quốc tịch" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="educationLevel" label="Trình độ học vấn">
                  <Select size="large" placeholder="Chọn trình độ">
                    <Option value="Tiểu học">Tiểu học</Option>
                    <Option value="THCS">THCS</Option>
                    <Option value="THPT">THPT</Option>
                    <Option value="Trung cấp">Trung cấp</Option>
                    <Option value="Cao đẳng">Cao đẳng</Option>
                    <Option value="Đại học">Đại học</Option>
                    <Option value="Thạc sĩ">Thạc sĩ</Option>
                    <Option value="Tiến sĩ">Tiến sĩ</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="occupation" label="Nghề nghiệp">
                  <Input size="large" placeholder="Nghề nghiệp" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={updateLoading}
                >
                  {leaderInfo ? "Lưu thay đổi" : "Lưu thông tin"}
                </Button>
                <Button
                  size="large"
                  onClick={() => setIsEditProfileModalVisible(false)}
                >
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Notifications Modal */}
        <Modal
          title={
            <Space>
              <Badge count={unreadCount} offset={[10, 0]}>
                <BellOutlined />
              </Badge>
              <span>Thông báo</span>
            </Space>
          }
          open={isNotificationModalVisible}
          onCancel={() => setIsNotificationModalVisible(false)}
          footer={[
            <Button
              key="close"
              onClick={() => setIsNotificationModalVisible(false)}
            >
              Đóng
            </Button>,
          ]}
          width={800}
        >
          {notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <BellOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
              <div style={{ marginTop: 16, color: "#999" }}>
                Chưa có thông báo nào
              </div>
            </div>
          ) : (
            <>
              {unreadCount > 0 && (
                <div style={{ marginBottom: 16, textAlign: "right" }}>
                  <Button type="link" onClick={handleMarkAllAsRead}>
                    Đánh dấu tất cả đã đọc
                  </Button>
                </div>
              )}
              <div
                style={{
                  maxHeight: "500px",
                  overflowY: "auto",
                  paddingRight: "8px",
                }}
              >
                <List
  dataSource={notifications}
  renderItem={(item) => {
    const color = getNotificationColor(item.type);

    return (
      <motion.div
        key={item._id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
      >
        <List.Item
          style={{
            padding: "16px",
            backgroundColor: !item.isRead ? "#f0f7ff" : "#fff",
            borderRadius: "8px",
            borderBottom: "1px solid #f0f0f0",
            cursor: "pointer",
            marginBottom: 8,
          }}
          onClick={() => !item.isRead && handleMarkAsRead(item._id)}
        >
          <List.Item.Meta
            avatar={
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: `${color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: color,
                }}
              >
                {getNotificationIcon(item.category)}
              </div>
            }
            title={
              <div style={{ display: "flex", alignItems: "center" }}>
                <Text strong style={{ fontSize: 15 }}>
                  {item.title.replace(' Mới', '')}
                </Text>
                {!item.isRead && <Badge status="processing" color={color} />}
                <Text
                  type="secondary"
                  style={{ marginLeft: "auto", fontSize: 12 }}
                >
                  {getTimeAgo(item.createdAt)}
                </Text>
              </div>
            }
            description={
              <Text style={{ color: "#64748b" }}>{item.message}</Text>
            }
          />
        </List.Item>
      </motion.div>
    );
  }}
/>

              </div>
            </>
          )}
        </Modal>

        {/* Avatar Update Modal */}
        <Modal
          title="Cập nhật ảnh đại diện"
          open={isAvatarModalVisible}
          onCancel={() => {
            setFileList([]);
            setIsAvatarModalVisible(false);
          }}
          footer={null}
          width={500}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            {/* Avatar hiện tại */}
            <Avatar
              size={100}
              src={uploadService.getAvatarUrl(leaderInfo?.avatarUrl)}
              icon={
                leaderInfo?.gender === "MALE" ? (
                  <ManOutlined />
                ) : (
                  <WomanOutlined />
                )
              }
              style={{
                backgroundColor:
                  leaderInfo?.gender === "MALE" ? "#1890ff" : "#eb2f96",
              }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Ảnh đại diện hiện tại</Text>
            </div>
          </div>

          {/* Upload component */}
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={({ fileList: newFileList }) => setFileList(newFileList)}
            beforeUpload={(file) => {
              // Kiểm tra file type
              const isImage = file.type.startsWith("image/");
              if (!isImage) {
                message.error("Bạn chỉ có thể upload file ảnh!");
                return Upload.LIST_IGNORE;
              }
              // Kiểm tra file size (5MB)
              const isLt5M = file.size / 1024 / 1024 < 5;
              if (!isLt5M) {
                message.error("Ảnh phải nhỏ hơn 5MB!");
                return Upload.LIST_IGNORE;
              }
              return false; // Prevent auto upload
            }}
            onPreview={(file) => {
              // Preview ảnh
              const url = URL.createObjectURL(file.originFileObj);
              window.open(url);
            }}
            maxCount={1}
          >
            {fileList.length < 1 && (
              <div>
                <UploadOutlined style={{ fontSize: 32, color: "#1890ff" }} />
                <div style={{ marginTop: 8 }}>Chọn ảnh</div>
                <div style={{ fontSize: 12, color: "#999" }}>
                  JPG, PNG, GIF (Max: 5MB)
                </div>
              </div>
            )}
          </Upload>

          {/* Buttons */}
          <Space
            style={{
              width: "100%",
              justifyContent: "space-between",
              marginTop: 24,
            }}
          >
            {leaderInfo?.avatarUrl && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteAvatar}
              >
                Xóa ảnh
              </Button>
            )}
            <Space style={{ marginLeft: "auto" }}>
              <Button
                onClick={() => {
                  setFileList([]);
                  setIsAvatarModalVisible(false);
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={handleUpdateAvatar}
                loading={uploading}
                disabled={fileList.length === 0}
              >
                Upload
              </Button>
            </Space>
          </Space>
        </Modal>
      </div>
    </Layout>
  );
};

export default LeaderDashboard;
