import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  List,
  Tag,
  Avatar,
  Statistic,
  Spin,
  message,
  Modal,
  Descriptions,
  Alert,
} from "antd";
import {
  TeamOutlined,
  FileTextOutlined,
  GiftOutlined,
  BellOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ManOutlined,
  WomanOutlined,
  EyeOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../../components/Layout";
import { citizenService, editRequestService } from "../../services";
import { rewardService } from "../../services/rewardService";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [householdData, setHouseholdData] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [myRewards, setMyRewards] = useState([]);
  const [isHouseholdModalVisible, setIsHouseholdModalVisible] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching dashboard data for user:", user);

      // Fetch household data
      const householdResponse = await citizenService.getMyHousehold();
      console.log("📊 Dashboard household response:", householdResponse);
      setHouseholdData(householdResponse);

      // Fetch requests
      try {
        const requestsResponse = await editRequestService.getMyRequests();
        const requests = requestsResponse.docs || requestsResponse || [];
        console.log("📋 Requests:", requests.length);
        setMyRequests(requests.slice(0, 5)); // Lấy 5 yêu cầu gần nhất
      } catch (err) {
        console.log("⚠️ No requests yet:", err.message);
        setMyRequests([]);
      }

      // Fetch reward proposals
      try {
        const rewardsResponse = await rewardService.proposals.getMyProposals();
        const rewards = rewardsResponse.docs || rewardsResponse || [];
        console.log("🏆 Reward Proposals:", rewards.length);
        setMyRewards(rewards.slice(0, 5)); // Lấy 5 đề xuất gần nhất
      } catch (err) {
        console.log("⚠️ No reward proposals yet:", err.message);
        setMyRewards([]);
      }
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);

      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;

      if (error.response?.status === 404) {
        message.error({
          content: (
            <div>
              <div>❌ {errorMsg}</div>
              <div style={{ fontSize: "12px", marginTop: 8 }}>
                Vui lòng liên hệ tổ trưởng để được thêm vào hộ khẩu.
              </div>
            </div>
          ),
          duration: 8,
        });
      } else {
        message.error(`Không thể tải dữ liệu: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    PENDING: {
      color: "gold",
      text: "Chờ duyệt",
      icon: <ClockCircleOutlined />,
    },
    APPROVED: {
      color: "green",
      text: "Đã duyệt",
      icon: <CheckCircleOutlined />,
    },
    REJECTED: {
      color: "red",
      text: "Từ chối",
      icon: <CloseCircleOutlined />,
    },
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" tip="Đang tải thông tin..." />
        </div>
      </Layout>
    );
  }

  if (!householdData) {
    return (
      <Layout>
        <Alert
          message="Không tìm thấy thông tin hộ khẩu"
          description="Bạn chưa được gán vào hộ khẩu nào. Vui lòng liên hệ tổ trưởng."
          type="warning"
          showIcon
        />
      </Layout>
    );
  }

  const { household, members = [] } = householdData;

  return (
    <Layout>
      <div>
        {/* Welcome Header */}
        <Card
          style={{
            marginBottom: 24,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
          }}
          bodyStyle={{ padding: "32px" }}
        >
          <Row align="middle" gutter={16}>
            <Col>
              <Avatar size={64} icon={<UserOutlined />} />
            </Col>
            <Col flex="auto">
              <Title level={3} style={{ color: "white", marginBottom: 4 }}>
                Chào mừng trở lại, {user?.fullName || user?.username}!
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 16 }}>
                Hộ khẩu: {household?.code} | {members.length} thành viên
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Quick Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Thành viên hộ gia đình"
                value={members.length}
                prefix={<TeamOutlined style={{ color: "#1890ff" }} />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Yêu cầu đã gửi"
                value={myRequests.length}
                prefix={<FileTextOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Đề xuất khen thưởng"
                value={myRewards.length}
                prefix={<TrophyOutlined style={{ color: "#faad14" }} />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* Household Info */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <TeamOutlined />
                  <span>Thông tin hộ khẩu</span>
                </Space>
              }
              extra={
                <Space>
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => setIsHouseholdModalVisible(true)}
                  >
                    Xem chi tiết
                  </Button>
                </Space>
              }
              bordered={false}
              style={{ height: "100%" }}
            >
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <div>
                  <Text type="secondary">Mã hộ khẩu:</Text>
                  <br />
                  <Text strong>
                    <Tag color="blue">{household?.code}</Tag>
                  </Text>
                </div>
                <div>
                  <Text type="secondary">Chủ hộ:</Text>
                  <br />
                  <Text strong>{household?.headName}</Text>
                </div>
                <div>
                  <Text type="secondary">Địa chỉ:</Text>
                  <br />
                  <Text strong>
                    {household?.address?.street}, {household?.address?.ward},{" "}
                    {household?.address?.district}, {household?.address?.city}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">Số thành viên:</Text>
                  <br />
                  <Text strong>{members.length} người</Text>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Quick Actions */}
          <Col xs={24} lg={12}>
            <Card
              title="Thao tác nhanh"
              bordered={false}
              style={{ height: "100%" }}
            >
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  size="large"
                  block
                  onClick={() => navigate("/citizen/submit-edit-request")}
                >
                  Yêu cầu chỉnh sửa
                </Button>
                <Button
                  type="default"
                  icon={<TrophyOutlined />}
                  size="large"
                  block
                  onClick={() => navigate("/citizen/submit-reward-proposal")}
                >
                  Đề xuất khen thưởng
                </Button>
                <Button
                  type="default"
                  icon={<TeamOutlined />}
                  size="large"
                  block
                  onClick={() => navigate("/citizen/household")}
                >
                  Xem hộ khẩu của tôi
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* Recent Requests */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  <span>Yêu cầu gần đây</span>
                </Space>
              }
              extra={
                <Button
                  type="link"
                  onClick={() => navigate("/citizen/my-requests")}
                >
                  Xem tất cả
                </Button>
              }
              bordered={false}
            >
              {myRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <FileTextOutlined
                    style={{ fontSize: 48, color: "#d9d9d9" }}
                  />
                  <div style={{ marginTop: 16, color: "#999" }}>
                    Chưa có yêu cầu nào
                  </div>
                  <Button
                    type="primary"
                    style={{ marginTop: 16 }}
                    onClick={() => navigate("/citizen/submit-edit-request")}
                  >
                    Gửi yêu cầu đầu tiên
                  </Button>
                </div>
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={myRequests}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={
                              statusConfig[item.status]?.icon || (
                                <ClockCircleOutlined />
                              )
                            }
                            style={{
                              backgroundColor:
                                item.status === "APPROVED"
                                  ? "#52c41a"
                                  : item.status === "REJECTED"
                                  ? "#ff4d4f"
                                  : "#faad14",
                            }}
                          />
                        }
                        title={
                          <Space>
                            <Text strong>{item.title || item.requestType}</Text>
                            <Tag
                              color={
                                statusConfig[item.status]?.color || "default"
                              }
                            >
                              {statusConfig[item.status]?.text || item.status}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary">
                              {item._id?.substring(0, 8)}...
                            </Text>
                            <Text type="secondary">
                              {dayjs(item.createdAt).format("DD/MM/YYYY")}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          {/* Recent Reward Proposals */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <TrophyOutlined />
                  <span>Đề xuất khen thưởng gần đây</span>
                </Space>
              }
              extra={
                <Button
                  type="link"
                  onClick={() => navigate("/citizen/my-rewards")}
                >
                  Xem tất cả
                </Button>
              }
              bordered={false}
            >
              {myRewards.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <TrophyOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                  <div style={{ marginTop: 16, color: "#999" }}>
                    Chưa có đề xuất khen thưởng nào
                  </div>
                  <Button
                    type="primary"
                    style={{ marginTop: 16 }}
                    onClick={() => navigate("/citizen/submit-reward-proposal")}
                  >
                    Đề xuất khen thưởng
                  </Button>
                </div>
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={myRewards}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={
                              statusConfig[item.status]?.icon || (
                                <ClockCircleOutlined />
                              )
                            }
                            style={{
                              backgroundColor:
                                item.status === "APPROVED"
                                  ? "#52c41a"
                                  : item.status === "REJECTED"
                                  ? "#ff4d4f"
                                  : "#faad14",
                            }}
                          />
                        }
                        title={
                          <Space>
                            <Text strong>{item.title}</Text>
                            <Tag
                              color={
                                statusConfig[item.status]?.color || "default"
                              }
                            >
                              {statusConfig[item.status]?.text || item.status}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary">
                              Người được đề xuất:{" "}
                              {item.citizen?.fullName || "N/A"}
                            </Text>
                            <Text type="secondary">
                              {dayjs(item.createdAt).format("DD/MM/YYYY")}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Household Detail Modal */}
        <Modal
          title={
            <Space>
              <TeamOutlined />
              <span>Chi Tiết Hộ Khẩu - {household?.code}</span>
            </Space>
          }
          open={isHouseholdModalVisible}
          onCancel={() => setIsHouseholdModalVisible(false)}
          footer={[
            <Button
              key="close"
              onClick={() => setIsHouseholdModalVisible(false)}
            >
              Đóng
            </Button>,
            <Button
              key="view"
              type="primary"
              onClick={() => {
                setIsHouseholdModalVisible(false);
                navigate("/citizen/household");
              }}
            >
              Xem trang đầy đủ
            </Button>,
          ]}
          width={900}
        >
          {household && (
            <div>
              <Card
                title="Thông tin hộ khẩu"
                bordered={false}
                style={{ marginBottom: 16 }}
              >
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="Mã hộ khẩu">
                    <Tag color="blue" style={{ fontSize: "14px" }}>
                      {household.code}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Chủ hộ">
                    <strong>{household.headName}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {household.phone || <Tag color="default">Chưa có</Tag>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số thành viên">
                    <Tag color="blue" style={{ fontSize: "14px" }}>
                      {members.length} người
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ" span={2}>
                    {household.address?.street}, {household.address?.ward},{" "}
                    {household.address?.district}, {household.address?.city}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card
                title={
                  <Space>
                    <TeamOutlined />
                    <span>Danh sách thành viên ({members.length} người)</span>
                  </Space>
                }
                bordered={false}
              >
                {members.length > 0 ? (
                  <List
                    dataSource={members}
                    renderItem={(member) => (
                      <List.Item
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          marginBottom: "8px",
                          backgroundColor: member.isHead
                            ? "#e6f7ff"
                            : "#fafafa",
                        }}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              icon={
                                member.gender === "MALE" ? (
                                  <ManOutlined />
                                ) : (
                                  <WomanOutlined />
                                )
                              }
                              style={{
                                backgroundColor:
                                  member.gender === "MALE"
                                    ? "#1890ff"
                                    : "#eb2f96",
                              }}
                            />
                          }
                          title={
                            <Space>
                              <strong>{member.fullName}</strong>
                              {member.isHead && <Tag color="gold">Chủ hộ</Tag>}
                              {member.relationshipToHead && (
                                <Tag color="purple">
                                  {member.relationshipToHead}
                                </Tag>
                              )}
                            </Space>
                          }
                          description={
                            <Space split="|">
                              <span>
                                {dayjs().diff(member.dateOfBirth, "year")} tuổi
                              </span>
                              <span>
                                {member.gender === "MALE"
                                  ? "Nam"
                                  : member.gender === "FEMALE"
                                  ? "Nữ"
                                  : "Khác"}
                              </span>
                              {member.nationalId && (
                                <span>CCCD: {member.nationalId}</span>
                              )}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#999",
                    }}
                  >
                    <TeamOutlined
                      style={{ fontSize: "48px", marginBottom: "16px" }}
                    />
                    <div>Chưa có thành viên nào</div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default CitizenDashboard;
