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
  Alert,
  message,
  Image,
  Tabs,
} from "antd";
import {
  FileTextOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  EditOutlined,
  StopOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import { editRequestService } from "../../services";
import { rewardService } from "../../services/rewardService";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const MyRequests = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [editRequests, setEditRequests] = useState([]);
  const [rewardProposals, setRewardProposals] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAllRequests();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchAllRequests();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const [editResponse, rewardResponse] = await Promise.all([
        editRequestService.getMyRequests().catch(() => ({ docs: [] })),
        rewardService.proposals.getMyProposals().catch(() => ({ docs: [] })),
      ]);

      const editData = editResponse.docs || editResponse || [];
      const rewardData = rewardResponse.docs || rewardResponse || [];

      const formattedEditRequests = editData.map((item) => ({
        ...item,
        requestCategory: "EDIT",
      }));

      const formattedRewardProposals = rewardData.map((item) => ({
        ...item,
        requestCategory: "REWARD",
      }));

      const merged = [
        ...formattedEditRequests,
        ...formattedRewardProposals,
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setEditRequests(formattedEditRequests);
      setRewardProposals(formattedRewardProposals);
      setAllRequests(merged);
    } catch (error) {
      console.error("Error fetching requests:", error);
      message.error("Không thể tải danh sách yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) =>
    value ? dayjs(value).format("DD/MM/YYYY") : "N/A";

  const statusConfig = {
    PENDING: { color: "gold", text: "Chờ duyệt" },
    APPROVED: { color: "green", text: "Đã duyệt" },
    REJECTED: { color: "red", text: "Từ chối" },
  };

  const requestCategoryConfig = {
    EDIT: { color: "blue", text: "Chỉnh sửa", icon: <EditOutlined /> },
    REWARD: { color: "gold", text: "Khen thưởng", icon: <TrophyOutlined /> },
  };

  const handleView = (record) => {
    setCurrentRequest(record);
    setViewModalVisible(true);
  };

  const handleCancelRequest = (record) => {
    setRequestToCancel(record);
    setCancelModalVisible(true);
  };

  const confirmCancelRequest = async () => {
    if (!requestToCancel) return;
    try {
      setCancelling(true);
      if (requestToCancel.requestCategory === "EDIT") {
        await editRequestService.cancelRequest(requestToCancel._id);
      } else if (requestToCancel.requestCategory === "REWARD") {
        await rewardService.proposals.cancel(requestToCancel._id);
      }
      message.success("Đã xóa yêu cầu thành công");
      await fetchAllRequests();
      setCancelModalVisible(false);
      setRequestToCancel(null);
    } catch (error) {
      console.error("Error cancelling request:", error);
      message.error("Không thể xóa yêu cầu. Vui lòng thử lại.");
    } finally {
      setCancelling(false);
    }
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => (
        <Text strong style={{ color: "#1890ff" }}>
          #{index + 1}
        </Text>
      ),
    },
    {
      title: "Loại",
      dataIndex: "requestCategory",
      key: "requestCategory",
      width: 120,
      render: (category) => {
        const config = requestCategoryConfig[category];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text, record) => {
        const displayTitle =
          record.proposedChanges?.title || record.title || "N/A";
        return (
          <div
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "350px",
            }}
          >
            {displayTitle}
          </div>
        );
      },
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 115,
      render: (date) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {dayjs(date).format("DD/MM/YYYY")}
          </div>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {dayjs(date).format("HH:mm")}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 115,
      render: (status) => {
        const config = statusConfig[status] || statusConfig.PENDING;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            Xem
          </Button>
          {record.status === "PENDING" && (
            <Button
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleCancelRequest(record)}
            >
              Xóa
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" tip="Đang tải danh sách yêu cầu..." />
        </div>
      </Layout>
    );
  }

  const getFilteredRequests = () => {
    switch (activeTab) {
      case "edit":
        return editRequests;
      case "reward":
        return rewardProposals;
      default:
        return allRequests;
    }
  };

  const filteredRequests = getFilteredRequests();

  return (
    <Layout>
      <div>
        {/* Header gradient + 2 nút hành động */}
        <Card
          bordered={false}
          style={{
            marginBottom: 24,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                <FileTextOutlined style={{ fontSize: 32, color: "#fff" }} />
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
                  Yêu Cầu Của Tôi
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
                  Quản lý tất cả yêu cầu chỉnh sửa và đề xuất khen thưởng
                </Text>
              </div>
            </div>

            <div>
              <Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate("/citizen/submit-edit-request")}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderColor: "rgba(255,255,255,0.5)",
                    color: "#fff",
                    fontWeight: 500,
                    height: 40,
                    borderRadius: 8,
                    transition: "all 0.3s ease",
                  }}
                  className="hover-back"
                >
                  Yêu cầu chỉnh sửa
                </Button>
                <Button
                  icon={<TrophyOutlined />}
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
                  Đề xuất khen thưởng
                </Button>
              </Space>
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

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {[
            {
              bg: "#f0f5ff",
              icon: <FileTextOutlined />,
              text: "Tổng số yêu cầu",
              color: "#1890ff",
              count: allRequests.length,
            },
            {
              bg: "#fffbe6",
              icon: <ClockCircleOutlined />,
              text: "Chờ duyệt",
              color: "#faad14",
              count: allRequests.filter((r) => r.status === "PENDING").length,
            },
            {
              bg: "#f6ffed",
              icon: <CheckCircleOutlined />,
              text: "Đã duyệt",
              color: "#52c41a",
              count: allRequests.filter((r) => r.status === "APPROVED").length,
            },
            {
              bg: "#fff1f0",
              icon: <CloseCircleOutlined />,
              text: "Từ chối",
              color: "#ff4d4f",
              count: allRequests.filter((r) => r.status === "REJECTED").length,
            },
          ].map((item, i) => (
            <Card
              key={i}
              hoverable
              style={{
                background: item.bg,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                borderRadius: 12,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
              }}
            >
              <Space direction="vertical" size={4}>
                <Text type="secondary">
                  {item.icon} {item.text}
                </Text>
                <Title level={2} style={{ margin: 0, color: item.color }}>
                  {item.count}
                </Title>
              </Space>
            </Card>
          ))}
        </div>

        {/* Wrap Tabs + Table */}
        <div style={{ marginBottom: 24 }}>
          {/* Tabs + Table */}
          <div>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                transition: "all 0.3s ease",
                cursor: "pointer",
                marginBottom: 16,
              }}
              className="hover-table-card"
            >
              <div className="hover-tabs-wrapper">
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={[
                    { key: "all", label: `Tất cả (${allRequests.length})` },
                    {
                      key: "edit",
                      label: `Chỉnh sửa (${editRequests.length})`,
                    },
                    {
                      key: "reward",
                      label: `Khen thưởng (${rewardProposals.length})`,
                    },
                  ]}
                />
              </div>

              {filteredRequests.length === 0 ? (
                <Empty
                  description="Chưa có yêu cầu nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: "60px 0" }}
                />
              ) : (
                <Table
                  columns={columns}
                  dataSource={filteredRequests}
                  rowKey="_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} yêu cầu`,
                  }}
                  rowClassName={() => "hoverable-row"}
                />
              )}
            </Card>
          </div>
        </div>

        {/* CSS hover / hiệu ứng nổi */}
        <style>
          {`
    /* Card bảng nổi */
    .hover-table-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }

    /* Tabs nổi khi hover */
    .hover-tabs-wrapper:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.12);
      transition: all 0.25s ease;
    }

    /* Hiệu ứng nổi cho hàng bảng */
    .hoverable-row:hover {
      background-color: #fafafa !important;
      transition: background 0.2s ease;
    }

    /* Hiệu ứng nổi cho các nút hành động */
    .ant-btn {
      transition: all 0.2s ease;
    }
    .ant-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }

  `}
        </style>

        {/* Modal xem chi tiết */}
        <Modal
          title={
            <Space>
              {currentRequest?.requestCategory === "REWARD" ? (
                <TrophyOutlined />
              ) : (
                <FileTextOutlined />
              )}
              <span>
                Chi Tiết{" "}
                {currentRequest?.requestCategory === "REWARD"
                  ? "Đề Xuất Khen Thưởng"
                  : "Yêu Cầu Chỉnh Sửa"}
              </span>
            </Space>
          }
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              Đóng
            </Button>,
          ]}
          width={800}
        >
          {currentRequest && (
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <Descriptions
                bordered
                column={1}
                labelStyle={{
                  fontWeight: 600,
                  width: "25%",
                  backgroundColor: "#fafafa",
                }}
              >
                <Descriptions.Item label="Loại">
                  {requestCategoryConfig[currentRequest.requestCategory] && (
                    <Tag
                      color={
                        requestCategoryConfig[currentRequest.requestCategory]
                          .color
                      }
                      icon={
                        requestCategoryConfig[currentRequest.requestCategory]
                          .icon
                      }
                    >
                      {
                        requestCategoryConfig[currentRequest.requestCategory]
                          .text
                      }
                    </Tag>
                  )}
                </Descriptions.Item>

                {currentRequest.requestCategory === "EDIT" &&
                  currentRequest.requestType && (
                    <Descriptions.Item label="Phân loại">
                      <Tag color="blue">{currentRequest.requestType}</Tag>
                    </Descriptions.Item>
                  )}
                {currentRequest.requestCategory === "EDIT" &&
                  currentRequest.requestType === "TEMP_ABSENCE" && (
                    <Descriptions.Item label="Tạm vắng">
                      <div>
                        <div>
                          Từ:{" "}
                          {formatDate(
                            currentRequest.proposedChanges
                              ?.temporaryAbsenceFrom ||
                              currentRequest.temporaryAbsenceFrom
                          )}{" "}
                          - Đến:{" "}
                          {formatDate(
                            currentRequest.proposedChanges
                              ?.temporaryAbsenceTo ||
                              currentRequest.temporaryAbsenceTo
                          )}
                        </div>
                        <div>
                          Nơi vắng:{" "}
                          {currentRequest.proposedChanges
                            ?.temporaryAbsenceAddress ||
                            currentRequest.temporaryAbsenceAddress ||
                            "N/A"}
                        </div>
                      </div>
                    </Descriptions.Item>
                  )}
                {currentRequest.requestCategory === "EDIT" &&
                  currentRequest.requestType === "TEMP_RESIDENCE" && (
                    <Descriptions.Item label="Tạm trú">
                      <div>
                        <div>
                          Từ:{" "}
                          {formatDate(
                            currentRequest.proposedChanges
                              ?.temporaryResidenceFrom ||
                              currentRequest.temporaryResidenceFrom
                          )}{" "}
                          - Đến:{" "}
                          {formatDate(
                            currentRequest.proposedChanges
                              ?.temporaryResidenceTo ||
                              currentRequest.temporaryResidenceTo
                          )}
                        </div>
                        <div>
                          Địa chỉ:{" "}
                          {currentRequest.proposedChanges
                            ?.temporaryResidenceAddress ||
                            currentRequest.temporaryResidenceAddress ||
                            "N/A"}
                        </div>
                      </div>
                    </Descriptions.Item>
                  )}

                {currentRequest.proposedChanges?.details && (
                  <Descriptions.Item label="Thông tin bổ sung">
                    <div
                      style={{
                        backgroundColor: "#f0f2f5",
                        padding: "8px 12px",
                        borderRadius: 4,
                        fontSize: 13,
                      }}
                    >
                      {currentRequest.proposedChanges.details}
                    </div>
                  </Descriptions.Item>
                )}

                <Descriptions.Item label="Ngày gửi">
                  {dayjs(currentRequest.createdAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái">
                  <Tag color={statusConfig[currentRequest.status]?.color}>
                    {statusConfig[currentRequest.status]?.text}
                  </Tag>
                </Descriptions.Item>

                {currentRequest.reviewedAt && (
                  <>
                    <Descriptions.Item label="Ngày duyệt">
                      {dayjs(currentRequest.reviewedAt).format(
                        "DD/MM/YYYY HH:mm"
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người duyệt">
                      {currentRequest.reviewedBy?.fullName || "N/A"}
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>

              {currentRequest.rejectionReason && (
                <Alert
                  message="Lý do từ chối"
                  description={currentRequest.rejectionReason}
                  type="error"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}

              {currentRequest.requestCategory === "REWARD" &&
                currentRequest.evidenceImages &&
                currentRequest.evidenceImages.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Text strong style={{ marginBottom: 8, display: "block" }}>
                      Hình ảnh minh chứng:
                    </Text>
                    <Image.PreviewGroup>
                      <Space wrap>
                        {currentRequest.evidenceImages.map((img, idx) => (
                          <Image
                            key={idx}
                            width={120}
                            height={120}
                            src={img}
                            style={{
                              objectFit: "cover",
                              borderRadius: 8,
                              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                            }}
                          />
                        ))}
                      </Space>
                    </Image.PreviewGroup>
                  </div>
                )}
            </div>
          )}
        </Modal>

        {/* Modal xác nhận xóa */}
        <Modal
          open={cancelModalVisible}
          title={
            <span style={{ color: "#ff4d4f" }}>
              <StopOutlined /> Xác nhận xóa yêu cầu
            </span>
          }
          onCancel={() => setCancelModalVisible(false)}
          footer={[
            <Button key="back" onClick={() => setCancelModalVisible(false)}>
              Hủy
            </Button>,
            <Button
              key="confirm"
              danger
              type="primary"
              loading={cancelling}
              onClick={confirmCancelRequest}
            >
              Xác nhận xóa
            </Button>,
          ]}
        >
          <p>
            Bạn có chắc chắn muốn xóa yêu cầu này không? <br />
            Hành động này <strong>không thể hoàn tác</strong>.
          </p>
        </Modal>
      </div>

      {/* Hiệu ứng nổi cho hàng trong bảng */}
      <style>
        {`
          .hoverable-row:hover {
            background-color: #fafafa !important;
            transition: background 0.2s ease;
          }
        `}
      </style>
      <style>
        {`
    .hoverable-row:hover {
      background-color: #fafafa !important;
      transition: background 0.2s ease;
    }

    /* Hiệu ứng nổi cho các nút hành động */
    .ant-btn {
      transition: all 0.2s ease;
    }
    .ant-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    /* Hiệu ứng nổi cho hai nút đầu trang */
    .ant-space .ant-btn {
      transition: all 0.25s ease;
    }
    .ant-space .ant-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }
  `}
      </style>
    </Layout>
  );
};

export default MyRequests;
