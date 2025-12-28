import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Typography,
  Modal,
  message,
  Descriptions,
  Select,
} from "antd";
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import Layout from "../../components/Layout";
import { editRequestService } from "../../services/editRequestService";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const REQUEST_TYPE = {
  ADD_MEMBER: "THEM_NHAN_KHAU",
  EDIT_INFO: "CHINH_SUA_THONG_TIN",
  REMOVE_MEMBER: "XOA_NHAN_KHAU",
  TEMP_ABSENCE: "TAM_VANG",
  TEMP_RESIDENCE: "TAM_TRU",
  MOVE_OUT: "CHUYEN_DI",
  MOVE_IN: "CHUYEN_DEN",
  OTHER: "KHAC",
};

const REQUEST_TYPE_LABELS = {
  [REQUEST_TYPE.ADD_MEMBER]: "Thêm nhân khẩu",
  [REQUEST_TYPE.EDIT_INFO]: "Chỉnh sửa thông tin",
  [REQUEST_TYPE.REMOVE_MEMBER]: "Xóa nhân khẩu",
  [REQUEST_TYPE.TEMP_ABSENCE]: "Tạm vắng",
  [REQUEST_TYPE.TEMP_RESIDENCE]: "Tạm trú",
  [REQUEST_TYPE.MOVE_OUT]: "Chuyển đi",
  [REQUEST_TYPE.MOVE_IN]: "Chuyển đến",
  [REQUEST_TYPE.OTHER]: "Khác",
  // Legacy codes (hiển thị đẹp cho dữ liệu cũ)
  ADD_MEMBER: "Thêm nhân khẩu",
  EDIT_INFO: "Chỉnh sửa thông tin",
  REMOVE_MEMBER: "Xóa nhân khẩu",
  TEMP_ABSENCE: "Tạm vắng",
  TEMP_RESIDENCE: "Tạm trú",
  MOVE_OUT: "Chuyển đi",
  MOVE_IN: "Chuyển đến",
  OTHER: "Khác",
};

const getRequestTypeLabel = (value) =>
  REQUEST_TYPE_LABELS[value] || value || "Khác";

const isTempAbsence = (value) =>
  value === REQUEST_TYPE.TEMP_ABSENCE || value === "TEMP_ABSENCE";

const isTempResidence = (value) =>
  value === REQUEST_TYPE.TEMP_RESIDENCE || value === "TEMP_RESIDENCE";

const EditRequestReview = () => {
  const [loading, setLoading] = useState(false);
  const [processingReview, setProcessingReview] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [requests, setRequests] = useState([]);

  // Fetch requests from backend
  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log("Đang tải danh sách yêu cầu chỉnh sửa...");

      const response = await editRequestService.getAll();
      console.log("Danh sách yêu cầu:", response);

      // Backend trả về { docs, total, page, limit }
      const requestList = response.docs || [];

      // Transform data to match table format
      const transformedRequests = requestList.map((req) => {
        const requestTypeLabel =
          REQUEST_TYPE_LABELS[req.requestType] || req.requestType || "Khác";

        return {
          key: req._id,
          _id: req._id,
          id: req._id.slice(-8).toUpperCase(), // Mã rút gọn từ _id
          citizen: req.citizen?.fullName || req.requestedBy?.fullName || "N/A",
          citizenId: req.citizen?._id,
          household: req.citizen?.household?.code || "N/A",
          householdId: req.citizen?.household?._id,
          requestType: req.requestType,
          requestTypeLabel,
          type: req.title || requestTypeLabel || "Chỉnh sửa thông tin",
          description: req.reason || req.description || "N/A",
          proposedChanges: req.proposedChanges,
          submitDate: req.createdAt,
          status: req.status.toLowerCase(), // PENDING -> pending
          reviewDate: req.reviewedAt,
          reviewer: req.reviewedBy?.fullName || req.reviewedBy?.username,
          reviewNote: req.rejectionReason || "N/A",
        };
      });

      setRequests(transformedRequests);
      console.log(`Đã tải ${transformedRequests.length} yêu cầu`);
    } catch (error) {
      console.error("Lỗi tải danh sách yêu cầu:", error);
      message.error("Không thể tải danh sách yêu cầu. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const formatDate = (value) =>
    value ? dayjs(value).format("DD/MM/YYYY") : "N/A";

  const formatDateTime = (value) =>
    value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "N/A";

  const getFromDate = (req) => {
    if (!req) return "N/A";
    if (isTempAbsence(req.requestType)) {
      return formatDate(
        req.proposedChanges?.temporaryAbsenceFrom || req.temporaryAbsenceFrom
      );
    }
    if (isTempResidence(req.requestType)) {
      return formatDate(
        req.proposedChanges?.temporaryResidenceFrom ||
          req.temporaryResidenceFrom
      );
    }
    return formatDate(req.submitDate);
  };

  const getToDate = (req) => {
    if (!req) return "N/A";
    if (isTempAbsence(req.requestType)) {
      return formatDate(
        req.proposedChanges?.temporaryAbsenceTo || req.temporaryAbsenceTo
      );
    }
    if (isTempResidence(req.requestType)) {
      return formatDate(
        req.proposedChanges?.temporaryResidenceTo || req.temporaryResidenceTo
      );
    }
    return "N/A";
  };

  const getDestination = (req) => {
    if (!req) return "N/A";
    if (isTempAbsence(req.requestType)) {
      return (
        req.proposedChanges?.temporaryAbsenceAddress ||
        req.temporaryAbsenceAddress ||
        "N/A"
      );
    }
    if (isTempResidence(req.requestType)) {
      return (
        req.proposedChanges?.temporaryResidenceAddress ||
        req.temporaryResidenceAddress ||
        "N/A"
      );
    }
    return "N/A";
  };

  const statusConfig = {
    pending: {
      color: "gold",
      text: "Chờ duyệt",
      icon: <ClockCircleOutlined />,
    },
    approved: {
      color: "green",
      text: "Đã duyệt",
      icon: <CheckCircleOutlined />,
    },
    rejected: {
      color: "red",
      text: "Từ chối",
      icon: <CloseCircleOutlined />,
    },
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 70,
      align: "center",
      render: (_, __, index) => (
        <Text strong style={{ color: "#1890ff" }}>
          #{index + 1}
        </Text>
      ),
    },
    {
      title: "Công dân",
      dataIndex: "citizen",
      key: "citizen",
    },
    {
      title: "Hộ khẩu",
      dataIndex: "household",
      key: "household",
    },
    {
      title: "Loại yêu cầu",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: "Ngày gửi",
      dataIndex: "submitDate",
      key: "submitDate",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const config = statusConfig[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
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
          {record.status === "pending" && (
            <>
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleReview(record, "approved")}
                style={{ color: "#52c41a" }}
              >
                Duyệt
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleReview(record, "rejected")}
              >
                Từ chối
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleView = (record) => {
    setCurrentRequest(record);
    setViewModalVisible(true);
  };

  const handleReview = (record, action) => {
    setCurrentRequest({ ...record, reviewAction: action });
    setReviewNote("");
    setReviewModalVisible(true);
  };

  const handleReviewConfirm = async () => {
    try {
      if (!currentRequest) return;
      setProcessingReview(true);
      console.log(
        `${
          currentRequest.reviewAction === "approved" ? "Approving" : "Rejecting"
        } request:`,
        currentRequest._id
      );

      if (currentRequest.reviewAction === "approved") {
        await editRequestService.approve(currentRequest._id, {
          note: reviewNote || "Đã duyệt",
        });
        message.success("Đã duyệt yêu cầu thành công");
      } else {
        await editRequestService.reject(currentRequest._id, {
          reason: reviewNote || "Từ chối yêu cầu",
        });
        message.success("Đã từ chối yêu cầu");
      }

      await fetchRequests();

      setReviewModalVisible(false);
      setCurrentRequest(null);
      setReviewNote("");
    } catch (error) {
      console.error("Lỗi duyệt yêu cầu:", error);
      message.error(
        error.response?.data?.message ||
          "Không thể xử lý yêu cầu. Vui lòng thử lại!"
      );
    } finally {
      setProcessingReview(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchSearch = Object.values(req).some((value) =>
      value.toString().toLowerCase().includes(searchText.toLowerCase())
    );
    const matchStatus =
      selectedStatus === "all" || req.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const reviewNotePlaceholder =
    currentRequest?.reviewAction === "approved"
      ? "Ghi chú phê duyệt (ví dụ: Đã kiểm tra giấy tờ, thông tin hợp lệ...)"
      : "Lý do từ chối (ví dụ: Thiếu giấy tờ xác thực, thông tin chưa đúng...)";

  return (
    <Layout>
      <div>
        {/* Page Header */}
        <div
          style={{
            background:
              "linear-gradient(90deg,rgba(255, 123, 137, 1) 0%, rgba(9, 9, 121, 1) 35%, rgba(0, 212, 255, 1) 100%)",
            borderRadius: "12px",
            padding: "24px 32px",
            marginBottom: 24,
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.15)",
          }}
        >
          <Space align="center" size={16}>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            ></div>
            <div>
              <Title
                level={2}
                style={{ margin: 0, color: "#fff", fontSize: "24px" }}
              >
                Duyệt yêu cầu chỉnh sửa
              </Title>
              <div
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "14px",
                  marginTop: "4px",
                }}
              >
                Quản lý và duyệt các yêu cầu chỉnh sửa thông tin từ công dân
              </div>
            </div>
          </Space>
        </div>

        {/* Statistics */}
        <Card bordered={false} style={{ marginBottom: 16 }}>
          <Space size="large">
            <div>
              <Text type="secondary">Tổng yêu cầu</Text>
              <Title level={3} style={{ margin: 0 }}>
                {stats.total}
              </Title>
            </div>
            <div>
              <Text type="secondary">Chờ duyệt</Text>
              <Title level={3} style={{ margin: 0, color: "#faad14" }}>
                {stats.pending}
              </Title>
            </div>
            <div>
              <Text type="secondary">Đã duyệt</Text>
              <Title level={3} style={{ margin: 0, color: "#52c41a" }}>
                {stats.approved}
              </Title>
            </div>
            <div>
              <Text type="secondary">Từ chối</Text>
              <Title level={3} style={{ margin: 0, color: "#ff4d4f" }}>
                {stats.rejected}
              </Title>
            </div>
          </Space>
        </Card>

        {/* Filter Bar */}
        <Card bordered={false} style={{ marginBottom: 16 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space>
              <Input
                placeholder="Tìm kiếm yêu cầu..."
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
              <Select
                style={{ width: 150 }}
                value={selectedStatus}
                onChange={setSelectedStatus}
              >
                <Option value="all">Tất cả</Option>
                <Option value="pending">Chờ duyệt</Option>
                <Option value="approved">Đã duyệt</Option>
                <Option value="rejected">Từ chối</Option>
              </Select>
            </Space>
          </Space>
        </Card>

        {/* Table */}
        <Card bordered={false}>
          <Table
            columns={columns}
            dataSource={filteredRequests}
            loading={loading}
            pagination={{
              total: filteredRequests.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} yêu cầu`,
            }}
          />
        </Card>

        {/* View Modal */}
        <Modal
          title="Chi tiết yêu cầu"
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              Đóng
            </Button>,
          ]}
          width={820}
          bodyStyle={{ background: "#f7f9fc", padding: 16 }}
        >
          {currentRequest && (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div
                style={{
                  background:
                    "linear-gradient(120deg, rgba(0, 82, 204, 0.08) 0%, rgba(0, 199, 255, 0.08) 100%)",
                  border: "1px solid #e6f4ff",
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <Title level={4} style={{ margin: "4px 0 8px" }}>
                    {currentRequest.type}
                  </Title>
                  <Space wrap size={8}>
                    <Tag color="blue">{currentRequest.citizen}</Tag>
                    {currentRequest.requestType && (
                      <Tag color="geekblue">
                        {currentRequest.requestTypeLabel ||
                          getRequestTypeLabel(currentRequest.requestType)}
                      </Tag>
                    )}
                  </Space>
                </div>
                <div style={{ textAlign: "right" }}>
                  {statusConfig[currentRequest.status] && (
                    <Tag
                      color={statusConfig[currentRequest.status].color}
                      icon={statusConfig[currentRequest.status].icon}
                      style={{ marginBottom: 8 }}
                    >
                      {statusConfig[currentRequest.status].text}
                    </Tag>
                  )}
                  <div>
                    <Text type="secondary">Gửi lúc</Text>
                    <div>{formatDateTime(currentRequest.submitDate)}</div>
                  </div>
                  {currentRequest.reviewDate && (
                    <div style={{ marginTop: 6 }}>
                      <Text type="secondary">Xử lý</Text>
                      <div>{formatDateTime(currentRequest.reviewDate)}</div>
                    </div>
                  )}
                </div>
              </div>

              <Descriptions
                bordered
                size="small"
                column={2}
                labelStyle={{ width: 150, fontWeight: 500 }}
              >
                <Descriptions.Item label="Công dân">
                  {currentRequest.citizen}
                </Descriptions.Item>
                <Descriptions.Item label="Hộ khẩu">
                  {currentRequest.household}
                </Descriptions.Item>
                <Descriptions.Item label="Loại yêu cầu">
                  <Tag color="blue">{currentRequest.type}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Phân loại">
                  {currentRequest.requestType ? (
                    <Tag color="geekblue">
                      {currentRequest.requestTypeLabel ||
                        getRequestTypeLabel(currentRequest.requestType)}
                    </Tag>
                  ) : (
                    "Không có"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày đi">
                  {getFromDate(currentRequest)}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày về">
                  {getToDate(currentRequest)}
                </Descriptions.Item>
                <Descriptions.Item label="Nơi đến" span={2}>
                  {getDestination(currentRequest)}
                </Descriptions.Item>
                <Descriptions.Item label="Lý do" span={2}>
                  {currentRequest.description}
                </Descriptions.Item>
              </Descriptions>
            </Space>
          )}
        </Modal>

        {/* Review Modal */}
        <Modal
          title={
            currentRequest?.reviewAction === "approved"
              ? "Duyệt yêu cầu"
              : "Từ chối yêu cầu"
          }
          open={reviewModalVisible}
          onOk={handleReviewConfirm}
          onCancel={() => setReviewModalVisible(false)}
          okText={
            currentRequest?.reviewAction === "approved" ? "Duyệt" : "Từ chối"
          }
          cancelText="Hủy"
          okButtonProps={{
            icon:
              currentRequest?.reviewAction === "approved" ? (
                <CheckCircleOutlined />
              ) : (
                <CloseCircleOutlined />
              ),
            danger: currentRequest?.reviewAction === "rejected",
            loading: processingReview,
          }}
        >
          {currentRequest && (
            <Space direction="vertical" size={14} style={{ width: "100%" }}>
              <div
                style={{
                  background: "#f6f8ff",
                  border: "1px solid #e5ebf5",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                  align="start"
                >
                  <div>
                    <Text type="secondary">Yêu cầu #{currentRequest.id}</Text>
                    <div style={{ marginTop: 4, fontWeight: 600 }}>
                      {currentRequest.type}
                    </div>
                  </div>
                  <Tag
                    color={
                      currentRequest.reviewAction === "approved"
                        ? "green"
                        : "red"
                    }
                    icon={
                      currentRequest.reviewAction === "approved" ? (
                        <CheckCircleOutlined />
                      ) : (
                        <CloseCircleOutlined />
                      )
                    }
                  >
                    {currentRequest.reviewAction === "approved"
                      ? "Phê duyệt"
                      : "Từ chối"}
                  </Tag>
                </Space>
              </div>

              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Công dân">
                  {currentRequest.citizen}
                </Descriptions.Item>
                <Descriptions.Item label="Loại yêu cầu">
                  {currentRequest.type}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày đi">
                  {getFromDate(currentRequest)}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày về">
                  {getToDate(currentRequest)}
                </Descriptions.Item>
                <Descriptions.Item label="Nơi đến">
                  {getDestination(currentRequest)}
                </Descriptions.Item>
                <Descriptions.Item label="Lý do yêu cầu">
                  {currentRequest.description}
                </Descriptions.Item>
              </Descriptions>

              <div
                style={{
                  marginTop: 4,
                  padding: 12,
                  background: "#f9fbfd",
                  border: "1px solid #e8eef5",
                  borderRadius: 10,
                }}
              >
                <Text strong>Ghi chú xử lý</Text>
                <TextArea
                  rows={4}
                  showCount
                  maxLength={300}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={reviewNotePlaceholder}
                  style={{ marginTop: 8 }}
                />
                <Text
                  type="secondary"
                  style={{ display: "block", marginTop: 6 }}
                >
                  Ghi chú sẽ được lưu vào lịch sử và gửi cùng thông báo cho công
                  dân.
                </Text>
              </div>
            </Space>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default EditRequestReview;
