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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

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

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 80,
      align: "center",
      render: (_, __, index) => {
        const stt = (pagination.current - 1) * pagination.pageSize + index + 1;
        return <Text strong>#{stt}</Text>;
      },
    },
    {
      title: "Loại thành tích",
      dataIndex: "title",
      key: "title",
      ellipsis: {
        showTitle: false,
      },
      render: (text) => <Text strong>{text || "Đề xuất khen thưởng"}</Text>,
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
          <Tag color={config.color} icon={config.icon}>
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
      <div>
        {/* Header gradient */}
        <Card
          bordered={false}
          style={{
            marginBottom: 24,
            background:
              "linear-gradient(125deg, #3d4042ff 0%, #c2e8ff 34%, #4e9ef1 60%, #0094ff 82%, #00d6c6 100%)",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
          }}
          bodyStyle={{ padding: "32px" }}
          className="hover-card"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
                  Quản lý và theo dõi các đề xuất khen thưởng của bạn
                </Text>
              </div>
            </div>

            <div>
              <Button
                icon={<PlusOutlined />}
                onClick={() => navigate("/citizen/submit-reward-proposal")}
                style={{
                  background: "#fff",
                  color: "#667eea",
                  fontWeight: 500,
                  height: 40,
                  borderRadius: 8,
                  transition: "all 0.3s ease",
                }}
                className="hover-back"
              >
                Đề xuất mới
              </Button>
            </div>
          </div>

          {/* Hover effect */}
          <style>{`
            .hover-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 10px 25px rgba(102, 126, 234, 0.35);
            }
            .hover-back:hover {
              transform: translateY(-3px);
              box-shadow: 0 6px 16px rgba(0,0,0,0.15);
            }
          `}</style>
        </Card>

        {/* Table Card */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            transition: "all 0.3s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          className="hover-table-card"
        >
          {proposals.length === 0 && !loading ? (
            <Empty
              description="Chưa có đề xuất nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: "60px 0" }}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={proposals}
              loading={loading}
              rowKey="_id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} đề xuất`,
                pageSizeOptions: ["10", "20", "50"],
                onChange: (page, pageSize) => {
                  setPagination({
                    current: page,
                    pageSize: pageSize,
                  });
                },
                onShowSizeChange: (current, size) => {
                  setPagination({
                    current: 1,
                    pageSize: size,
                  });
                },
              }}
              rowClassName={() => "hoverable-row"}
            />
          )}
        </Card>

        {/* CSS hover effects */}
        <style>
          {`
            .hover-table-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            }

            .hoverable-row:hover {
              background-color: #fafafa !important;
              transition: background 0.2s ease;
            }

            .ant-btn {
              transition: all 0.2s ease;
            }
            .ant-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
          `}
        </style>
      </div>

      {/* View Modal */}
      <Modal
        title="Chi tiết đề xuất khen thưởng"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={900}
        centered
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
                <Descriptions.Item label="Loại thành tích" span={2}>
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
                    {dayjs(currentReward.createdAt).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái">
                {statusConfig[currentReward.status] && (
                  <Tag
                    color={statusConfig[currentReward.status].color}
                    icon={statusConfig[currentReward.status].icon}
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
                      <Text>{currentReward.reviewedBy?.fullName || "N/A"}</Text>
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
    </Layout>
  );
};

export default MyRewards;
