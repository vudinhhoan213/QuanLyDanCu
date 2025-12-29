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
  Row,
  Col,
  Select,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  ExportOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { rewardService } from "../../services";
import {
  exportEventsToExcel,
  exportRegistrationsToExcel,
} from "../../utils/exportExcel";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const RewardEventList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ANNUAL"); // Mặc định chỉ hiển thị sự kiện thường niên
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [viewingEvent, setViewingEvent] = useState(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, [pagination.current, pagination.pageSize, statusFilter, typeFilter]);

  useEffect(() => {
    // Reset selection khi filter thay đổi
    setSelectedRowKeys([]);
  }, [statusFilter, typeFilter]);

  const buildEventStats = async (eventId) => {
    let eligible = 0;
    let distributed = 0;

    let distributions = [];
    let achievements = [];

    try {
      const distRes = await rewardService.distributions.getAll({
        event: eventId,
        limit: 1000,
      });
      distributions = distRes.docs || [];
    } catch (err) {
      distributions = [];
    }

    try {
      const achRes = await rewardService.achievements.getAll({ limit: 1000 });
      achievements = achRes.docs || [];
    } catch (err) {
      achievements = [];
    }

    const distributionIds = new Set(
      distributions
        .map((d) => d.citizen?._id || d.citizen)
        .filter(Boolean)
        .map((id) => id.toString())
    );
    const achievementIds = new Set(
      achievements
        .map((a) => a.citizen?._id || a.citizen)
        .filter(Boolean)
        .map((id) => id.toString())
    );

    const mergedIds = new Set([...distributionIds, ...achievementIds]);
    distributed = distributions.filter((d) => d.status === "DISTRIBUTED").length;

    // Fallback to summary eligible count if greater
    try {
      const summary = await rewardService.events.getSummary(eventId);
      const summaryEligible = summary?.eligibleCount || 0;
      eligible = Math.max(mergedIds.size, summaryEligible);
    } catch (err) {
      eligible = mergedIds.size;
    }

    return { eligible, distributed };
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const response = await rewardService.events.getAll(params);
      const eventList = response.docs || [];

      const eventsWithEligible = await Promise.all(
        eventList.map(async (event) => {
          try {
            const stats = await buildEventStats(event._id);
            return {
              key: event._id,
              ...event,
              eligibleCount: stats.eligible,
              distributedCount: stats.distributed,
            };
          } catch (error) {
            console.error(
              `Error fetching stats for event ${event._id}:`,
              error
            );
            return {
              key: event._id,
              ...event,
              eligibleCount: 0,
              distributedCount: 0,
            };
          }
        })
      );

      setEvents(eventsWithEligible);
      setPagination({
        ...pagination,
        total: response.total || 0,
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      message.error("Không thể tải danh sách sự kiện");
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      OPEN: { color: "green", text: "Đang phát" },
      CLOSED: { color: "orange", text: "Đóng" },
      EXPIRED: { color: "red", text: "Hết hạn" },
      ENDED: { color: "default", text: "Đã kết thúc" },
      PLANNED: { color: "blue", text: "Đã lên kế hoạch" },
      ONGOING: { color: "green", text: "Đang diễn ra" },
      COMPLETED: { color: "default", text: "Hoàn thành" },
    };
    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getTypeText = (type) => {
    const typeMap = {
      ANNUAL: "Thường niên",
      SPECIAL: "Đặc biệt",
      SPECIAL_OCCASION: "Dịp đặc biệt",
      SCHOOL_YEAR: "Năm học",
    };
    return typeMap[type] || type;
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một sự kiện để xóa");
      return;
    }

    try {
      // Xóa tuần tự để đảm bảo không có lỗi
      for (const eventId of selectedRowKeys) {
        await rewardService.events.delete(eventId);
      }

      message.success(`Đã xóa ${selectedRowKeys.length} sự kiện thành công`);
      setSelectedRowKeys([]);
      fetchEvents();
    } catch (error) {
      console.error("Error bulk deleting events:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể xóa một số sự kiện";
      message.error(errorMsg);
    }
  };

  const handleViewDetails = async (eventId) => {
    try {
      const event = await rewardService.events.getById(eventId);
      const stats = await buildEventStats(eventId);

      setViewingEvent({
        ...event,
        registeredCount: stats.eligible,
        distributedCount: stats.distributed,
      });

      setIsViewModalVisible(true);
    } catch (error) {
      console.error("Error fetching event details:", error);
      message.error("Không thể tải chi tiết sự kiện");
    }
  };

  const handleExportEvents = () => {
    try {
      // Export toàn bộ danh sách sự kiện
      if (events.length === 0) {
        message.warning("Không có dữ liệu để xuất");
        return;
      }

      exportEventsToExcel(events);
      message.success("Xuất danh sách sự kiện thành công!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("Không thể xuất danh sách. Vui lòng thử lại!");
    }
  };

  const handleExportRegistrations = async (eventId, eventName) => {
    try {
      message.loading({
        content: "Đang tải danh sách đăng ký...",
        key: "export",
      });

      // Fetch registrations for this event
      const response = await rewardService.events.getRegistrations(eventId);
      const registrations = response.docs || [];

      if (registrations.length === 0) {
        message.warning({
          content: "Sự kiện này chưa có đăng ký",
          key: "export",
        });
        return;
      }

      exportRegistrationsToExcel(registrations, eventName);
      message.success({
        content: "Xuất danh sách đăng ký thành công!",
        key: "export",
      });
    } catch (error) {
      console.error("Error exporting registrations:", error);
      message.error({
        content: "Không thể xuất danh sách. Vui lòng thử lại!",
        key: "export",
      });
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      !searchText ||
      event.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      getTypeText(event.type)?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const columns = [
    {
      title: "Tên sự kiện",
      dataIndex: "name",
      key: "name",
      width: 220,
      ellipsis: true,
      render: (text, record) => (
        <Button
          type="link"
          style={{
            padding: 0,
            height: "auto",
            fontWeight: 600,
            textAlign: "left",
          }}
          onClick={() => handleViewDetails(record._id)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Thông tin",
      key: "info",
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0} style={{ fontSize: "12px" }}>
          <div>
            <Tag>{getTypeText(record.type)}</Tag>
            {getStatusTag(record.status)}
          </div>
          {record.startDate && record.endDate ? (
            <Text type="secondary">
              {dayjs(record.startDate).format("DD/MM/YYYY")} -{" "}
              {dayjs(record.endDate).format("DD/MM/YYYY")}
            </Text>
          ) : record.date ? (
            <Text type="secondary">
              {dayjs(record.date).format("DD/MM/YYYY")}
            </Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: "Thống kê",
      key: "statistics",
      width: 150,
      align: "center",
      render: (_, record) => {
        const eligible = record.eligibleCount || 0;
        const distributed = record.distributedCount || 0;
        const ratio =
          eligible > 0 ? ((distributed / eligible) * 100).toFixed(1) : 0;
        return (
          <Space direction="vertical" size={0} style={{ fontSize: "12px" }}>
            <Text strong style={{ fontSize: "14px" }}>
              {eligible} người
            </Text>
            <Text type="secondary">
              Đã nhận:{" "}
              <Text
                strong
                style={{ color: distributed > 0 ? "#52c41a" : "#999" }}
              >
                {distributed}
              </Text>{" "}
              ({ratio}%)
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      fixed: "right",
      align: "center",
      render: (_, record) => {
        return (
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record._id)}
          >
            Chi tiết
          </Button>
        );
      },
    },
  ];

  return (
    <Layout>
      <style>
        {`
          .ant-modal-body::-webkit-scrollbar {
            display: none;
          }
          .ant-modal-body {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      <div>
        {/* Header gradient */}
        <Card
          bordered={false}
          style={{
            marginBottom: 24,
            background:
              "linear-gradient(90deg,rgba(117, 142, 183, 1) 0%, rgba(9, 9, 121, 1) 35%, rgba(0, 212, 255, 1) 100%)",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
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
                <CalendarOutlined style={{ fontSize: 32, color: "#fff" }} />
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
                  Quản lý Sự kiện Phát quà
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
                  Quản lý và theo dõi các sự kiện phát quà trong hệ thống
                </Text>
              </div>
            </div>

            <div>
              <Space>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBulkDelete}
                  disabled={selectedRowKeys.length === 0}
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
                  Xóa đã chọn ({selectedRowKeys.length})
                </Button>
                <Button
                  icon={<ExportOutlined />}
                  onClick={handleExportEvents}
                  disabled={events.length === 0}
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
                  Xuất Excel
                </Button>
                <Button
                  icon={<CalendarOutlined />}
                  onClick={() => navigate("/leader/reward-events/schedule")}
                  style={{
                    background: "#fff",
                    color: "#1890ff",
                    fontWeight: 500,
                    height: 40,
                    borderRadius: 8,
                    transition: "all 0.3s ease",
                  }}
                  className="hover-back"
                >
                  Lịch tự động
                </Button>
              </Space>
            </div>
          </div>

          {/* Hover effect */}
          <style>{`
            .hover-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 10px 25px rgba(24, 144, 255, 0.35);
            }
            .hover-back:hover {
              transform: translateY(-3px);
              box-shadow: 0 6px 16px rgba(0,0,0,0.15);
            }
          `}</style>
        </Card>

        {/* Content Card */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            transition: "all 0.3s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          className="hover-table-card"
        >
          <Space
            style={{ marginBottom: 16, width: "100%" }}
            direction="vertical"
          >
            <Row gutter={16}>
              <Col span={8}>
                <Input
                  placeholder="Tìm kiếm theo tên/loại..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="Lọc theo trạng thái"
                  style={{ width: "100%" }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  allowClear
                >
                  <Option value="OPEN">Mở</Option>
                  <Option value="CLOSED">Đóng</Option>
                  <Option value="EXPIRED">Hết hạn</Option>
                  <Option value="ENDED">Đã kết thúc</Option>
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  placeholder="Lọc theo loại"
                  style={{ width: "100%" }}
                  value={typeFilter}
                  onChange={setTypeFilter}
                  disabled
                >
                  <Option value="ANNUAL">Thường niên</Option>
                </Select>
              </Col>
            </Row>
          </Space>

          <Table
            rowSelection={{
              selectedRowKeys,
              onChange: (selectedKeys) => {
                setSelectedRowKeys(selectedKeys);
              },
            }}
            columns={columns}
            dataSource={filteredEvents}
            loading={loading}
            rowKey="_id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} sự kiện`,
              onChange: (page, pageSize) => {
                setPagination({ ...pagination, current: page, pageSize });
              },
            }}
            scroll={{ x: 700 }}
            rowClassName={() => "hoverable-row"}
          />
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

      {/* View Details Modal */}
      <Modal
        title="Chi tiết sự kiện"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingEvent(null);
        }}
        footer={[
          <Button
            key="export"
            type="primary"
            icon={<ExportOutlined />}
            onClick={() => {
              if (viewingEvent) {
                handleExportRegistrations(viewingEvent._id, viewingEvent.name);
              }
            }}
            disabled={
              !viewingEvent || (viewingEvent.registeredCount || 0) === 0
            }
          >
            Xuất danh sách đăng ký
          </Button>,
          <Button
            key="view"
            onClick={() => {
              if (viewingEvent) {
                navigate(
                  `/leader/reward-events/${viewingEvent._id}/registrations`
                );
              }
            }}
          >
            Xem danh sách đăng ký
          </Button>,
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
        centered
        bodyStyle={{
          maxHeight: "70vh",
          overflow: "auto",
          padding: "24px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        style={{
          overflow: "hidden",
        }}
      >
        {viewingEvent && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Tên sự kiện" span={2}>
              {viewingEvent.name}
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              {getTypeText(viewingEvent.type)}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getStatusTag(viewingEvent.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian bắt đầu">
              {viewingEvent.startDate
                ? dayjs(viewingEvent.startDate).format("DD/MM/YYYY HH:mm")
                : viewingEvent.date
                ? dayjs(viewingEvent.date).format("DD/MM/YYYY")
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian kết thúc">
              {viewingEvent.endDate
                ? dayjs(viewingEvent.endDate).format("DD/MM/YYYY HH:mm")
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Số người đăng ký">
              <Text
                strong
                style={{
                  color:
                    (viewingEvent.registeredCount || 0) > 0
                      ? "#1890ff"
                      : "#999",
                }}
              >
                {viewingEvent.registeredCount || 0}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số người nhận quà">
              <Text
                strong
                style={{
                  color:
                    (viewingEvent.distributedCount || 0) > 0
                      ? "#52c41a"
                      : "#999",
                }}
              >
                {viewingEvent.distributedCount || 0}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tỷ lệ nhận quà">
              <Text strong>
                {viewingEvent.distributedCount || 0} /{" "}
                {viewingEvent.registeredCount || 0}
              </Text>
            </Descriptions.Item>
            {viewingEvent.rewardDescription && (
              <Descriptions.Item label="Phần thưởng" span={2}>
                <Text strong style={{ color: "#1890ff" }}>
                  {viewingEvent.rewardDescription}
                </Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ngân sách" span={2}>
              <Text strong>50 - 100 triệu VNĐ</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={2}>
              {viewingEvent.description || "Không có mô tả"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(viewingEvent.createdAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối">
              {dayjs(viewingEvent.updatedAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Layout>
  );
};

export default RewardEventList;
