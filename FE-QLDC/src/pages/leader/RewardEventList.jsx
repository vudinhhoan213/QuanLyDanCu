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
  Popconfirm,
  Descriptions,
  Row,
  Col,
  Select,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CloseOutlined,
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
  const [typeFilter, setTypeFilter] = useState("");
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [viewingEvent, setViewingEvent] = useState(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [pagination.current, pagination.pageSize, statusFilter, typeFilter]);

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

      // Backend đã trả về registeredCount và distributedCount, không cần tính lại

      setEvents(
        eventList.map((e) => ({
          key: e._id,
          ...e,
        }))
      );
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
      OPEN: { color: "green", text: "Mở" },
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

  const handleCloseEvent = async (eventId) => {
    try {
      await rewardService.events.close(eventId);
      message.success("Đã đóng sự kiện");
      fetchEvents();
    } catch (error) {
      console.error("Error closing event:", error);
      message.error("Không thể đóng sự kiện");
    }
  };

  const handleDelete = async (eventId) => {
    try {
      await rewardService.events.delete(eventId);
      message.success("Đã xóa sự kiện thành công");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      const errorMsg = error.response?.data?.message || "Không thể xóa sự kiện";
      message.error(errorMsg);
    }
  };

  const handleViewDetails = async (eventId) => {
    try {
      const event = await rewardService.events.getById(eventId);

      // Fetch registration và distribution count
      try {
        const regResponse = await rewardService.events.getRegistrations(
          eventId
        );
        const registeredCount = regResponse.docs?.length || 0;
        const distributedCount = regResponse.docs?.filter(
          (reg) => reg.status === "DISTRIBUTED"
        ).length || 0;
        setViewingEvent({ 
          ...event, 
          registeredCount,
          distributedCount,
        });
      } catch (error) {
        setViewingEvent({ 
          ...event, 
          registeredCount: 0,
          distributedCount: 0,
        });
      }

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
      width: 200,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => <Tag>{getTypeText(type)}</Tag>,
    },
    {
      title: "Thời gian đăng ký",
      key: "registrationTime",
      width: 200,
      render: (_, record) => {
        if (record.startDate && record.endDate) {
          return (
            <div>
              <div>{dayjs(record.startDate).format("DD/MM/YYYY")}</div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                đến {dayjs(record.endDate).format("DD/MM/YYYY")}
              </Text>
            </div>
          );
        }
        return record.date ? dayjs(record.date).format("DD/MM/YYYY") : "N/A";
      },
    },
    {
      title: "Tỷ lệ nhận quà",
      key: "distributionRate",
      width: 120,
      render: (_, record) => {
        const distributed = record.distributedCount || 0;
        const registered = record.registeredCount || 0;
        return (
          <Text>
            {distributed}/{registered || 0}
          </Text>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 300,
      fixed: "right",
      render: (_, record) => {
        const hasRegistrations = (record.registeredCount || 0) > 0;
        const canEdit =
          !hasRegistrations &&
          (record.status === "OPEN" || record.status === "PLANNED");
        const canClose = record.status === "OPEN";
        const canDelete =
          !hasRegistrations &&
          (record.status === "OPEN" ||
            record.status === "PLANNED" ||
            record.status === "CLOSED");

        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record._id)}
            >
              Xem
            </Button>
            {canEdit && (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() =>
                  navigate(`/leader/reward-events/${record._id}/edit`)
                }
              >
                Chỉnh sửa
              </Button>
            )}
            {canClose && (
              <Popconfirm
                title="Bạn có chắc muốn đóng sự kiện này?"
                onConfirm={() => handleCloseEvent(record._id)}
                okText="Đóng"
                cancelText="Hủy"
              >
                <Button type="link" danger icon={<CloseOutlined />}>
                  Đóng sớm
                </Button>
              </Popconfirm>
            )}
            {canDelete && (
              <Popconfirm
                title="Bạn có chắc muốn xóa sự kiện này?"
                description="Hành động này không thể hoàn tác. Sự kiện sẽ bị xóa vĩnh viễn."
                onConfirm={() => handleDelete(record._id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            )}
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() =>
                navigate(`/leader/reward-events/${record._id}/registrations`)
              }
            >
              Xem đăng ký
            </Button>
            {(record.registeredCount || 0) > 0 && (
              <Button
                type="link"
                icon={<ExportOutlined />}
                onClick={() =>
                  handleExportRegistrations(record._id, record.name)
                }
                style={{ color: "#1890ff" }}
              >
                Xuất Excel
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Layout>
      <Card>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <CalendarOutlined /> Quản lý Sự kiện Phát quà
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExportEvents}
                disabled={events.length === 0}
              >
                Xuất Excel
              </Button>
              <Button
                icon={<CalendarOutlined />}
                onClick={() => navigate("/leader/reward-events/schedule")}
              >
                Lịch tự động
              </Button>
            </Space>
          </Col>
        </Row>

        <Space style={{ marginBottom: 16, width: "100%" }} direction="vertical">
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
                allowClear
              >
                <Option value="ANNUAL">Thường niên</Option>
                <Option value="SPECIAL">Đặc biệt</Option>
              </Select>
            </Col>
          </Row>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredEvents}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sự kiện`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

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
                {viewingEvent.distributedCount || 0} / {viewingEvent.registeredCount || 0}
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
              {viewingEvent.budget
                ? `${viewingEvent.budget.toLocaleString("vi-VN")} VNĐ`
                : "N/A"}
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