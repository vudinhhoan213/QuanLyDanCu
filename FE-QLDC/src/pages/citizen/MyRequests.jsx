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
} from "antd";
import {
  FileTextOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import { editRequestService } from "../../services";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const MyRequests = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  // Reload khi có navigation state từ SubmitEditRequest
  useEffect(() => {
    if (location.state?.refresh) {
      console.log("🔄 Refreshing requests list...");
      fetchMyRequests();
      // Clear state để tránh reload liên tục
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await editRequestService.getMyRequests();
      const data = response.docs || response || [];
      setRequests(data);
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

  const columns = [
    {
      title: "Mã yêu cầu",
      dataIndex: "_id",
      key: "_id",
      render: (text) => <Text strong>{text.substring(0, 8)}...</Text>,
    },
    {
      title: "Loại yêu cầu",
      dataIndex: "requestType",
      key: "requestType",
      render: (type) => <Tag color="blue">{type || "Chỉnh sửa"}</Tag>,
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
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
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
      title: "Ngày duyệt",
      dataIndex: "reviewedAt",
      key: "reviewedAt",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
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

  return (
    <Layout>
      <div>
        {/* Page Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            <FileTextOutlined /> Yêu Cầu Của Tôi
          </Title>
        </div>

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <Card>
            <Space direction="vertical">
              <Text type="secondary">Tổng số yêu cầu</Text>
              <Title level={2} style={{ margin: 0 }}>
                {requests.length}
              </Title>
            </Space>
          </Card>
          <Card>
            <Space direction="vertical">
              <Text type="secondary">Chờ duyệt</Text>
              <Title level={2} style={{ margin: 0, color: "#faad14" }}>
                {requests.filter((r) => r.status === "PENDING").length}
              </Title>
            </Space>
          </Card>
          <Card>
            <Space direction="vertical">
              <Text type="secondary">Đã duyệt</Text>
              <Title level={2} style={{ margin: 0, color: "#52c41a" }}>
                {requests.filter((r) => r.status === "APPROVED").length}
              </Title>
            </Space>
          </Card>
        </div>

        {/* Action Button */}
        <Card bordered={false} style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/citizen/submit-edit-request")}
          >
            Gửi yêu cầu mới
          </Button>
        </Card>

        {/* Requests Table */}
        <Card bordered={false}>
          {requests.length === 0 ? (
            <Empty
              description="Chưa có yêu cầu nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/citizen/submit-edit-request")}
              >
                Gửi yêu cầu đầu tiên
              </Button>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={requests}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} yêu cầu`,
              }}
            />
          )}
        </Card>

        {/* View Detail Modal */}
        <Modal
          title={
            <Space>
              <FileTextOutlined />
              <span>Chi Tiết Yêu Cầu</span>
            </Space>
          }
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              Đóng
            </Button>,
          ]}
          width={700}
        >
          {currentRequest && (
            <div>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Mã yêu cầu">
                  {currentRequest._id}
                </Descriptions.Item>
                <Descriptions.Item label="Loại yêu cầu">
                  <Tag color="blue">
                    {currentRequest.requestType || "Chỉnh sửa"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tiêu đề">
                  {currentRequest.title || "N/A"}
                </Descriptions.Item>
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

              {/* Proposed Changes */}
              {currentRequest.proposedChanges && (
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
