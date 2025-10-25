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
  PlusOutlined,
  TrophyOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import { editRequestService } from "../../services";
import { rewardService } from "../../services/rewardService";
import dayjs from "dayjs";

const { Title, Text } = Typography;

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

  useEffect(() => {
    fetchAllRequests();
  }, []);

  // Reload khi có navigation state từ SubmitEditRequest hoặc SubmitRewardProposal
  useEffect(() => {
    if (location.state?.refresh) {
      console.log("🔄 Refreshing requests list...");
      fetchAllRequests();
      // Clear state để tránh reload liên tục
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);

      // Fetch cả 2 loại requests song song
      const [editResponse, rewardResponse] = await Promise.all([
        editRequestService.getMyRequests().catch(() => ({ docs: [] })),
        rewardService.proposals.getMyProposals().catch(() => ({ docs: [] })),
      ]);

      const editData = editResponse.docs || editResponse || [];
      const rewardData = rewardResponse.docs || rewardResponse || [];

      // Thêm type để phân biệt
      const formattedEditRequests = editData.map((item) => ({
        ...item,
        requestCategory: "EDIT",
      }));

      const formattedRewardProposals = rewardData.map((item) => ({
        ...item,
        requestCategory: "REWARD",
      }));

      setEditRequests(formattedEditRequests);
      setRewardProposals(formattedRewardProposals);

      // Merge và sort theo ngày tạo
      const merged = [
        ...formattedEditRequests,
        ...formattedRewardProposals,
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllRequests(merged);
    } catch (error) {
      console.error("Error fetching requests:", error);
      message.error("Không thể tải danh sách yêu cầu");
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

  const handleView = (record) => {
    setCurrentRequest(record);
    setViewModalVisible(true);
  };

  const requestCategoryConfig = {
    EDIT: {
      color: "blue",
      text: "Chỉnh sửa",
      icon: <EditOutlined />,
    },
    REWARD: {
      color: "gold",
      text: "Khen thưởng",
      icon: <TrophyOutlined />,
    },
  };

  const columns = [
    {
      title: "Mã yêu cầu",
      dataIndex: "_id",
      key: "_id",
      width: 120,
      render: (text) => (
        <Text strong style={{ fontSize: 12 }}>
          {text.substring(0, 8)}...
        </Text>
      ),
    },
    {
      title: "Loại",
      dataIndex: "requestCategory",
      key: "requestCategory",
      width: 140,
      render: (category) => {
        const config = requestCategoryConfig[category];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
      filters: [
        { text: "Chỉnh sửa", value: "EDIT" },
        { text: "Khen thưởng", value: "REWARD" },
      ],
      onFilter: (value, record) => record.requestCategory === value,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: "descend",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const config = statusConfig[status] || statusConfig.PENDING;
        return (
          <Tag icon={config.icon} color={config.color}>
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
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
        >
          Xem chi tiết
        </Button>
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

  // Get filtered data based on active tab
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
        {/* Page Header */}
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>
              <FileTextOutlined /> Yêu Cầu Của Tôi
            </Title>
            <Text type="secondary">
              Quản lý tất cả yêu cầu chỉnh sửa và đề xuất khen thưởng
            </Text>
          </div>
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate("/citizen/submit-edit-request")}
            >
              Yêu cầu chỉnh sửa
            </Button>
            <Button
              type="primary"
              icon={<TrophyOutlined />}
              onClick={() => navigate("/citizen/submit-reward-proposal")}
            >
              Đề xuất khen thưởng
            </Button>
          </Space>
        </div>

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <Card>
            <Space direction="vertical">
              <Text type="secondary">Tổng số yêu cầu</Text>
              <Title level={2} style={{ margin: 0 }}>
                {allRequests.length}
              </Title>
            </Space>
          </Card>
          <Card>
            <Space direction="vertical">
              <Text type="secondary">Chờ duyệt</Text>
              <Title level={2} style={{ margin: 0, color: "#faad14" }}>
                {allRequests.filter((r) => r.status === "PENDING").length}
              </Title>
            </Space>
          </Card>
          <Card>
            <Space direction="vertical">
              <Text type="secondary">Đã duyệt</Text>
              <Title level={2} style={{ margin: 0, color: "#52c41a" }}>
                {allRequests.filter((r) => r.status === "APPROVED").length}
              </Title>
            </Space>
          </Card>
          <Card>
            <Space direction="vertical">
              <Text type="secondary">Từ chối</Text>
              <Title level={2} style={{ margin: 0, color: "#ff4d4f" }}>
                {allRequests.filter((r) => r.status === "REJECTED").length}
              </Title>
            </Space>
          </Card>
        </div>

        {/* Tabs and Table */}
        <Card bordered={false}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "all",
                label: (
                  <span>
                    <FileTextOutlined /> Tất cả ({allRequests.length})
                  </span>
                ),
              },
              {
                key: "edit",
                label: (
                  <span>
                    <EditOutlined /> Chỉnh sửa ({editRequests.length})
                  </span>
                ),
              },
              {
                key: "reward",
                label: (
                  <span>
                    <TrophyOutlined /> Khen thưởng ({rewardProposals.length})
                  </span>
                ),
              },
            ]}
          />
          {filteredRequests.length === 0 ? (
            <Empty
              description="Chưa có yêu cầu nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: "60px 0" }}
            >
              <Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate("/citizen/submit-edit-request")}
                >
                  Gửi yêu cầu chỉnh sửa
                </Button>
                <Button
                  type="primary"
                  icon={<TrophyOutlined />}
                  onClick={() => navigate("/citizen/submit-reward-proposal")}
                >
                  Đề xuất khen thưởng
                </Button>
              </Space>
            </Empty>
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
              scroll={{ x: 1200 }}
            />
          )}
        </Card>

        {/* View Detail Modal */}
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
            <div>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Mã yêu cầu">
                  <Text style={{ fontSize: 12 }}>{currentRequest._id}</Text>
                </Descriptions.Item>
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
                <Descriptions.Item label="Tiêu đề">
                  <Text strong>{currentRequest.title || "N/A"}</Text>
                </Descriptions.Item>

                {/* Reward-specific fields */}
                {currentRequest.requestCategory === "REWARD" && (
                  <>
                    <Descriptions.Item label="Người được đề xuất">
                      {currentRequest.citizen?.fullName || "N/A"}
                    </Descriptions.Item>
                    {currentRequest.criteria && (
                      <Descriptions.Item label="Tiêu chí">
                        {currentRequest.criteria}
                      </Descriptions.Item>
                    )}
                  </>
                )}

                {/* Edit request-specific fields */}
                {currentRequest.requestCategory === "EDIT" &&
                  currentRequest.requestType && (
                    <Descriptions.Item label="Loại yêu cầu">
                      <Tag color="blue">{currentRequest.requestType}</Tag>
                    </Descriptions.Item>
                  )}

                <Descriptions.Item label="Mô tả">
                  {currentRequest.description || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày gửi">
                  {dayjs(currentRequest.createdAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {(() => {
                    const config =
                      statusConfig[currentRequest.status] ||
                      statusConfig.PENDING;
                    return (
                      <Tag icon={config.icon} color={config.color}>
                        {config.text}
                      </Tag>
                    );
                  })()}
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
                    {currentRequest.rejectionReason && (
                      <Descriptions.Item label="Lý do từ chối">
                        <Alert
                          message={currentRequest.rejectionReason}
                          type="error"
                          showIcon
                        />
                      </Descriptions.Item>
                    )}
                  </>
                )}
              </Descriptions>

              {/* Evidence Images (for Reward Proposals) */}
              {currentRequest.requestCategory === "REWARD" &&
                currentRequest.evidenceImages &&
                currentRequest.evidenceImages.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Text strong>Hình ảnh minh chứng:</Text>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginTop: 8,
                      }}
                    >
                      <Image.PreviewGroup>
                        {currentRequest.evidenceImages.map((img, idx) => (
                          <Image
                            key={idx}
                            src={img}
                            width={100}
                            height={100}
                            style={{ objectFit: "cover", borderRadius: 4 }}
                          />
                        ))}
                      </Image.PreviewGroup>
                    </div>
                  </div>
                )}

              {/* Proposed Changes (for Edit Requests) */}
              {currentRequest.requestCategory === "EDIT" &&
                currentRequest.proposedChanges && (
                  <Card
                    title="Nội dung thay đổi đề xuất"
                    style={{ marginTop: 16 }}
                  >
                    <pre
                      style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                    >
                      {JSON.stringify(currentRequest.proposedChanges, null, 2)}
                    </pre>
                  </Card>
                )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default MyRequests;
