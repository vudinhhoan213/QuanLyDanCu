import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Empty,
  Modal,
  Descriptions,
  Statistic,
  Row,
  Col,
  Spin,
  message,
  Image,
  Badge,
  Divider,
  Skeleton,
} from "antd";
import {
  EyeOutlined,
  TrophyOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  IdcardOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { rewardService } from "../../services/rewardService";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const MyRewards = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    fetchMyProposals();
  }, []);

  const fetchMyProposals = async () => {
    try {
      setLoading(true);
      const response = await rewardService.proposals.getMyProposals();
      const data = response.docs || response || [];
      setProposals(data);
    } catch (error) {
      console.error("Error fetching my proposals:", error);
      message.error("Không thể tải danh sách đề xuất");
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    PENDING: {
      color: "gold",
      text: "Chờ duyệt",
      icon: <ClockCircleOutlined />,
      bgColor: "#fff7e6",
      borderColor: "#ffd591",
    },
    APPROVED: {
      color: "green",
      text: "Đã duyệt",
      icon: <CheckCircleOutlined />,
      bgColor: "#f6ffed",
      borderColor: "#b7eb8f",
    },
    REJECTED: {
      color: "red",
      text: "Từ chối",
      icon: <CloseCircleOutlined />,
      bgColor: "#fff1f0",
      borderColor: "#ffa39e",
    },
  };

  const columns = [
    {
      title: "Mã đề xuất",
      dataIndex: "_id",
      key: "_id",
      width: 120,
      render: (text) => (
        <Space>
          <IdcardOutlined style={{ color: "#1890ff" }} />
          <Text
            strong
            style={{
              fontSize: 12,
              fontFamily: "monospace",
              color: "#595959",
            }}
          >
            {text?.slice(0, 8)}...
          </Text>
        </Space>
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Text
          strong
          style={{
            color: "#262626",
            fontSize: 14,
          }}
        >
          {text || "Đề xuất khen thưởng"}
        </Text>
      ),
    },
    {
      title: "Người được đề xuất",
      dataIndex: ["citizen", "fullName"],
      key: "citizen",
      render: (text) => (
        <Space>
          <UserOutlined style={{ color: "#8c8c8c" }} />
          <Text>{text || "N/A"}</Text>
        </Space>
      ),
      ellipsis: true,
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (date) => (
        <Space>
          <CalendarOutlined style={{ color: "#8c8c8c" }} />
          <Text>{dayjs(date).format("DD/MM/YYYY")}</Text>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => {
        const config = statusConfig[status] || statusConfig.PENDING;
        return (
          <Tag
            color={config.color}
            icon={config.icon}
            style={{
              padding: "4px 12px",
              borderRadius: "12px",
              border: `1px solid ${config.borderColor}`,
              backgroundColor: config.bgColor,
              fontWeight: 500,
            }}
          >
            {config.text}
          </Tag>
        );
      },
      filters: [
        { text: "Chờ duyệt", value: "PENDING" },
        { text: "Đã duyệt", value: "APPROVED" },
        { text: "Từ chối", value: "REJECTED" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
          style={{
            borderRadius: "6px",
            boxShadow: "0 2px 4px rgba(24, 144, 255, 0.2)",
          }}
        >
          Xem
        </Button>
      ),
    },
  ];

  const handleView = (record) => {
    setCurrentReward(record);
    setViewModalVisible(true);
  };

  // Calculate statistics
  const pendingCount = proposals.filter((p) => p.status === "PENDING").length;
  const approvedCount = proposals.filter((p) => p.status === "APPROVED").length;
  const rejectedCount = proposals.filter((p) => p.status === "REJECTED").length;
  const totalCount = proposals.length;

  // Loading skeleton
  if (loading) {
    return (
      <Layout>
        <div style={{ padding: "24px" }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}
      >
        {/* Page Header with Gradient */}
        <Card
          bordered={false}
          style={{
            marginBottom: 24,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
          }}
          bodyStyle={{ padding: "32px" }}
        >
          <Row align="middle" justify="space-between">
            <Col>
              <Space size="large" align="center">
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <TrophyOutlined style={{ fontSize: 32, color: "#fff" }} />
                </div>
                <div>
                  <Title
                    level={2}
                    style={{
                      color: "#fff",
                      margin: 0,
                      marginBottom: 8,
                      fontWeight: 700,
                    }}
                  >
                    Đề Xuất Khen Thưởng
                  </Title>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.9)",
                      fontSize: 16,
                    }}
                  >
                    Quản lý và theo dõi các đề xuất khen thưởng của bạn
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => navigate("/citizen/submit-reward-proposal")}
                style={{
                  height: 48,
                  borderRadius: "8px",
                  fontSize: 16,
                  fontWeight: 600,
                  background: "#fff",
                  color: "#667eea",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0, 0, 0, 0.15)";
                }}
              >
                Đề xuất mới
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                borderTop: "4px solid #1890ff",
              }}
              hoverable
              bodyStyle={{ padding: "24px" }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#8c8c8c", fontSize: 14 }}>
                    Tổng đề xuất
                  </Text>
                }
                value={totalCount}
                prefix={<FileTextOutlined style={{ color: "#1890ff" }} />}
                valueStyle={{
                  color: "#1890ff",
                  fontSize: 28,
                  fontWeight: 700,
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                borderTop: "4px solid #faad14",
              }}
              hoverable
              bodyStyle={{ padding: "24px" }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#8c8c8c", fontSize: 14 }}>
                    Chờ duyệt
                  </Text>
                }
                value={pendingCount}
                prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
                valueStyle={{
                  color: "#faad14",
                  fontSize: 28,
                  fontWeight: 700,
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                borderTop: "4px solid #52c41a",
              }}
              hoverable
              bodyStyle={{ padding: "24px" }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#8c8c8c", fontSize: 14 }}>
                    Đã duyệt
                  </Text>
                }
                value={approvedCount}
                prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{
                  color: "#52c41a",
                  fontSize: 28,
                  fontWeight: 700,
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                borderTop: "4px solid #ff4d4f",
              }}
              hoverable
              bodyStyle={{ padding: "24px" }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#8c8c8c", fontSize: 14 }}>
                    Từ chối
                  </Text>
                }
                value={rejectedCount}
                prefix={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
                valueStyle={{
                  color: "#ff4d4f",
                  fontSize: 28,
                  fontWeight: 700,
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Table Card */}
        <Card
          bordered={false}
          style={{
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          {proposals.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <TrophyOutlined
                    style={{
                      fontSize: 64,
                      color: "#d9d9d9",
                      marginBottom: 16,
                    }}
                  />
                  <Title level={4} style={{ color: "#8c8c8c" }}>
                    Chưa có đề xuất nào
                  </Title>
                  <Paragraph style={{ color: "#bfbfbf" }}>
                    Bắt đầu bằng cách tạo đề xuất khen thưởng mới
                  </Paragraph>
                </div>
              }
              style={{ padding: "60px 0" }}
            >
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => navigate("/citizen/submit-reward-proposal")}
                style={{
                  height: 48,
                  borderRadius: "8px",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Tạo đề xuất mới
              </Button>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={proposals}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} đề xuất`,
                pageSizeOptions: ["10", "20", "50"],
                style: { marginTop: 16 },
              }}
              style={{
                borderRadius: "8px",
              }}
              rowClassName={(record, index) =>
                index % 2 === 0 ? "table-row-light" : "table-row-dark"
              }
            />
          )}
        </Card>

        {/* View Modal */}
        <Modal
          title={
            <Space>
              <TrophyOutlined style={{ color: "#667eea", fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>
                Chi tiết đề xuất khen thưởng
              </Title>
            </Space>
          }
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          footer={[
            <Button
              key="close"
              onClick={() => setViewModalVisible(false)}
              size="large"
              style={{ borderRadius: "6px" }}
            >
              Đóng
            </Button>,
          ]}
          width={900}
          style={{ top: 20 }}
        >
          {currentReward && (
            <div style={{ marginTop: 16 }}>
              <Descriptions
                bordered
                column={2}
                size="default"
                labelStyle={{
                  fontWeight: 600,
                  background: "#fafafa",
                  width: "180px",
                }}
                contentStyle={{ background: "#fff" }}
              >
                <Descriptions.Item label="Mã đề xuất" span={2}>
                  <Space>
                    <IdcardOutlined style={{ color: "#1890ff" }} />
                    <Text
                      strong
                      style={{
                        fontSize: 13,
                        fontFamily: "monospace",
                        color: "#595959",
                      }}
                    >
                      {currentReward._id}
                    </Text>
                  </Space>
                </Descriptions.Item>

                {currentReward.title && (
                  <Descriptions.Item label="Tiêu đề" span={2}>
                    <Text strong style={{ fontSize: 15, color: "#262626" }}>
                      {currentReward.title}
                    </Text>
                  </Descriptions.Item>
                )}

                <Descriptions.Item label="Người được đề xuất" span={2}>
                  <Space>
                    <UserOutlined style={{ color: "#8c8c8c" }} />
                    <Text>{currentReward.citizen?.fullName || "N/A"}</Text>
                  </Space>
                </Descriptions.Item>

                <Descriptions.Item label="Mô tả" span={2}>
                  <Paragraph
                    style={{
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      color: "#595959",
                    }}
                  >
                    {currentReward.description || "Không có mô tả"}
                  </Paragraph>
                </Descriptions.Item>

                <Descriptions.Item label="Ngày gửi">
                  <Space>
                    <CalendarOutlined style={{ color: "#8c8c8c" }} />
                    <Text>
                      {dayjs(currentReward.createdAt).format(
                        "DD/MM/YYYY HH:mm"
                      )}
                    </Text>
                  </Space>
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái">
                  {statusConfig[currentReward.status] && (
                    <Tag
                      color={statusConfig[currentReward.status].color}
                      icon={statusConfig[currentReward.status].icon}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        border: `1px solid ${
                          statusConfig[currentReward.status].borderColor
                        }`,
                        backgroundColor:
                          statusConfig[currentReward.status].bgColor,
                        fontWeight: 500,
                      }}
                    >
                      {statusConfig[currentReward.status].text}
                    </Tag>
                  )}
                </Descriptions.Item>

                {currentReward.reviewedAt && (
                  <>
                    <Descriptions.Item label="Ngày duyệt">
                      <Space>
                        <CalendarOutlined style={{ color: "#8c8c8c" }} />
                        <Text>
                          {dayjs(currentReward.reviewedAt).format(
                            "DD/MM/YYYY HH:mm"
                          )}
                        </Text>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Người duyệt">
                      <Space>
                        <UserOutlined style={{ color: "#8c8c8c" }} />
                        <Text>
                          {currentReward.reviewedBy?.fullName || "N/A"}
                        </Text>
                      </Space>
                    </Descriptions.Item>
                    {currentReward.rejectionReason && (
                      <Descriptions.Item label="Lý do từ chối" span={2}>
                        <div
                          style={{
                            padding: "12px",
                            background: "#fff1f0",
                            borderRadius: "6px",
                            border: "1px solid #ffccc7",
                          }}
                        >
                          <Text type="danger" style={{ fontSize: 14 }}>
                            {currentReward.rejectionReason}
                          </Text>
                        </div>
                      </Descriptions.Item>
                    )}
                  </>
                )}
              </Descriptions>

              {/* Evidence Images */}
              {currentReward.evidenceImages &&
                currentReward.evidenceImages.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <Divider orientation="left">
                      <Space>
                        <FileImageOutlined style={{ color: "#1890ff" }} />
                        <Text strong style={{ fontSize: 16 }}>
                          Hình ảnh minh chứng
                        </Text>
                      </Space>
                    </Divider>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        marginTop: 16,
                      }}
                    >
                      <Image.PreviewGroup>
                        {currentReward.evidenceImages.map((img, idx) => (
                          <Image
                            key={idx}
                            src={img}
                            width={120}
                            height={120}
                            style={{
                              objectFit: "cover",
                              borderRadius: "8px",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.05)";
                              e.currentTarget.style.boxShadow =
                                "0 4px 12px rgba(0, 0, 0, 0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                              e.currentTarget.style.boxShadow =
                                "0 2px 8px rgba(0, 0, 0, 0.1)";
                            }}
                          />
                        ))}
                      </Image.PreviewGroup>
                    </div>
                  </div>
                )}
            </div>
          )}
        </Modal>
      </div>

      <style>{`
        .table-row-light {
          background-color: #fafafa;
        }
        .table-row-dark {
          background-color: #fff;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #e6f7ff !important;
        }
        .ant-table-thead > tr > th {
          background-color: #fafafa;
          font-weight: 600;
        }
      `}</style>
    </Layout>
  );
};

export default MyRewards;