import React, { useState, useEffect } from "react";
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
} from "antd";
import {
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
  authService,
} from "../../services";

const { Title, Text } = Typography;
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
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] =
    useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] =
    useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

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
          console.log("⚠️ Could not fetch leader info:", err.message);
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

  const handleChangePassword = async (values) => {
    setPasswordLoading(true);
    try {
      await authService.changePassword(
        values.currentPassword,
        values.newPassword
      );
      message.success("Đổi mật khẩu thành công!");
      passwordForm.resetFields();
      setIsChangePasswordModalVisible(false);
    } catch (error) {
      console.error("Error changing password:", error);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const requestColumns = [
    {
      title: "Mã yêu cầu",
      dataIndex: "id",
      key: "id",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Công dân",
      dataIndex: "citizen",
      key: "citizen",
    },
    {
      title: "Loại yêu cầu",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Ngày gửi",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusConfig = {
          pending: { color: "gold", text: "Chờ duyệt" },
          approved: { color: "green", text: "Đã duyệt" },
          rejected: { color: "red", text: "Từ chối" },
        };
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/leader/edit-requests/${record.id}`)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <Layout>
      <div>
        {/* Page Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Dashboard Tổ Trưởng
          </Title>
          <Text type="secondary">Tổng quan hệ thống quản lý dân cư</Text>
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
              <Avatar
                size={80}
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
                  <>
                    <Button
                      type="primary"
                      size="large"
                      icon={<EditOutlined />}
                      onClick={handleEditProfile}
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      size="large"
                      icon={<LockOutlined />}
                      onClick={() => setIsChangePasswordModalVisible(true)}
                      style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        color: "white",
                      }}
                    >
                      Đổi mật khẩu
                    </Button>
                  </>
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
            <Card bordered={false} hoverable>
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
            <Card bordered={false} hoverable>
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
            <Card bordered={false} hoverable>
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
            <Card bordered={false} hoverable>
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

        {/* Recent Requests Table */}
        <Card
          title={
            <Space>
              <FileTextOutlined />
              <span>Yêu cầu chỉnh sửa gần đây</span>
            </Space>
          }
          extra={
            <Button
              type="primary"
              onClick={() => navigate("/leader/edit-requests")}
            >
              Xem tất cả
            </Button>
          }
          bordered={false}
        >
          <Table
            columns={requestColumns}
            dataSource={recentRequests}
            pagination={{ pageSize: 5 }}
            loading={loading}
            scroll={{ x: 800 }}
          />
        </Card>

        {/* Quick Actions */}
        <Divider />
        <Card title="Thao tác nhanh" bordered={false} style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Button
                type="default"
                icon={<TeamOutlined />}
                size="large"
                block
                onClick={() => navigate("/leader/households")}
              >
                Quản lý Hộ khẩu
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                type="default"
                icon={<UserOutlined />}
                size="large"
                block
                onClick={() => navigate("/leader/citizens")}
              >
                Quản lý Công dân
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                type="default"
                icon={<FileTextOutlined />}
                size="large"
                block
                onClick={() => navigate("/leader/edit-requests")}
              >
                Duyệt Yêu cầu
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                type="default"
                icon={<GiftOutlined />}
                size="large"
                block
                onClick={() => navigate("/leader/reward-proposals")}
              >
                Duyệt Khen thưởng
              </Button>
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

        {/* Change Password Modal */}
        <Modal
          title={
            <Space>
              <LockOutlined />
              <span>Đổi mật khẩu</span>
            </Space>
          }
          open={isChangePasswordModalVisible}
          onCancel={() => setIsChangePasswordModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="currentPassword"
              label="Mật khẩu hiện tại"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mật khẩu hiện tại",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                size="large"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                size="large"
                placeholder="Nhập mật khẩu mới"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              dependencies={["newPassword"]}
              rules={[
                {
                  required: true,
                  message: "Vui lòng xác nhận mật khẩu mới",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu xác nhận không khớp!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                size="large"
                placeholder="Nhập lại mật khẩu mới"
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={passwordLoading}
                >
                  Đổi mật khẩu
                </Button>
                <Button
                  size="large"
                  onClick={() => setIsChangePasswordModalVisible(false)}
                >
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default LeaderDashboard;
