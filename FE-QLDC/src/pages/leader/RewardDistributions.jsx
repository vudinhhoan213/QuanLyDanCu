import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Typography,
  message,
  Row,
  Col,
  Modal,
  Select,
  Statistic,
} from "antd";
import {
  GiftOutlined,
  SearchOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import Layout from "../../components/Layout";
import { rewardService } from "../../services";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RewardDistributions = () => {
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isDistributionModalVisible, setIsDistributionModalVisible] = useState(false);
  const [distributionNote, setDistributionNote] = useState("");
  const [viewingRegistration, setViewingRegistration] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchRegistrations();
  }, [eventFilter, statusFilter]);

  const fetchEvents = async () => {
    try {
      const response = await rewardService.events.getAll({ status: "OPEN" });
      setEvents(response.docs || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        sort: "-createdAt",
      };

      if (eventFilter) {
        params.event = eventFilter;
      }

      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const response = await rewardService.distributions.getAll(params);
      const regList = response.docs || [];

      setRegistrations(
        regList.map((reg) => ({
          key: reg._id,
          ...reg,
        }))
      );
      setPagination({
        ...pagination,
        total: response.total || 0,
      });
    } catch (error) {
      console.error("Error fetching registrations:", error);
      message.error("Không thể tải danh sách đăng ký");
    } finally {
      setLoading(false);
    }
  };

  const handleDistribute = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một người đăng ký");
      return;
    }

    // Kiểm tra xem có đăng ký nào đã được phân phát chưa
    const selectedRegistrations = registrations.filter((reg) =>
      selectedRowKeys.includes(reg._id)
    );
    const alreadyDistributed = selectedRegistrations.filter(
      (reg) => reg.status === "DISTRIBUTED"
    );

    if (alreadyDistributed.length > 0) {
      message.warning(
        `Có ${alreadyDistributed.length} đăng ký đã được phân phát quà rồi. Vui lòng bỏ chọn các đăng ký này.`
      );
      return;
    }

    setIsDistributionModalVisible(true);
  };

  const handleConfirmDistribute = async () => {
    try {
      setDistributing(true);
      const result = await rewardService.distributions.distribute(
        selectedRowKeys,
        distributionNote || undefined
      );

      message.success(
        `✅ Đã phân phát quà cho ${result.modifiedCount} đăng ký thành công!`
      );

      // Reset state
      setSelectedRowKeys([]);
      setDistributionNote("");
      setIsDistributionModalVisible(false);

      // Refresh danh sách
      await fetchRegistrations();
    } catch (error) {
      console.error("Error distributing gifts:", error);
      message.error(
        error.response?.data?.message || "Không thể phân phát quà. Vui lòng thử lại!"
      );
    } finally {
      setDistributing(false);
    }
  };

  const handleViewDetails = (registration) => {
    setViewingRegistration(registration);
    setIsDetailModalVisible(true);
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      !searchText ||
      reg.citizen?.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      reg.household?.code?.toLowerCase().includes(searchText.toLowerCase()) ||
      reg.citizen?.nationalId?.includes(searchText) ||
      reg.event?.name?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  // Statistics - chỉ tính trên filteredRegistrations để hiển thị đúng
  const stats = {
    total: filteredRegistrations.length,
    registered: filteredRegistrations.filter((r) => r.status === "REGISTERED").length,
    distributed: filteredRegistrations.filter((r) => r.status === "DISTRIBUTED").length,
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.status === "DISTRIBUTED",
    }),
  };

  const getStatusTag = (status) => {
    if (status === "DISTRIBUTED") {
      return <Tag color="green">Đã phát quà</Tag>;
    } else if (status === "REGISTERED") {
      return <Tag color="blue">Đã đăng ký</Tag>;
    } else if (status === "CANCELLED") {
      return <Tag color="red">Đã hủy</Tag>;
    }
    return <Tag color="default">Đã đăng ký</Tag>;
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => {
        return (pagination.current - 1) * pagination.pageSize + index + 1;
      },
    },
    {
      title: "Sự kiện",
      key: "event",
      width: 200,
      render: (_, record) => (
        <Text strong>{record.event?.name || "N/A"}</Text>
      ),
    },
    {
      title: "Họ tên",
      key: "fullName",
      width: 180,
      render: (_, record) => (
        <Text strong>{record.citizen?.fullName || "N/A"}</Text>
      ),
    },
    {
      title: "CMND/CCCD",
      key: "nationalId",
      width: 150,
      render: (_, record) => record.citizen?.nationalId || "N/A",
    },
    {
      title: "Hộ khẩu",
      key: "household",
      width: 120,
      render: (_, record) => record.household?.code || "N/A",
    },
    {
      title: "Thời gian đăng ký",
      key: "createdAt",
      width: 180,
      render: (_, record) =>
        record.createdAt
          ? dayjs(record.createdAt).format("DD/MM/YYYY HH:mm")
          : "N/A",
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 100,
      render: (_, record) => record.quantity || 1,
    },
    {
      title: "Giá trị",
      key: "totalValue",
      width: 150,
      render: (_, record) =>
        record.totalValue
          ? `${record.totalValue.toLocaleString("vi-VN")} VNĐ`
          : "N/A",
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 150,
      render: (_, record) => getStatusTag(record.status),
    },
    {
      title: "Thời gian phát quà",
      key: "distributedAt",
      width: 180,
      render: (_, record) =>
        record.distributedAt
          ? dayjs(record.distributedAt).format("DD/MM/YYYY HH:mm")
          : "-",
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Xem
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Title level={2} style={{ margin: 0 }}>
            <GiftOutlined /> Phân phối quà
          </Title>

          {/* Statistics */}
          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Tổng đăng ký (đang xem)"
                  value={stats.total}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Chờ phát quà"
                  value={stats.registered}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Đã chọn để phát quà"
                  value={selectedRowKeys.length}
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters and Actions */}
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<GiftOutlined />}
                  onClick={handleDistribute}
                  disabled={selectedRowKeys.length === 0 || distributing}
                  loading={distributing}
                >
                  Phân phát quà ({selectedRowKeys.length})
                </Button>
              </Space>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Tìm kiếm theo tên/CMND/hộ khẩu/sự kiện..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Select
                style={{ width: "100%" }}
                placeholder="Chọn sự kiện"
                value={eventFilter}
                onChange={setEventFilter}
                allowClear
              >
                {events.map((event) => (
                  <Option key={event._id} value={event._id}>
                    {event.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Select
                style={{ width: "100%" }}
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Option value="ALL">Tất cả trạng thái</Option>
                <Option value="REGISTERED">Đã đăng ký</Option>
                <Option value="DISTRIBUTED">Đã phát quà</Option>
              </Select>
            </Col>
          </Row>

          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredRegistrations}
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} đăng ký`,
              onChange: (page, pageSize) => {
                setPagination({ ...pagination, current: page, pageSize });
              },
            }}
            scroll={{ x: 1400 }}
          />
        </Space>
      </Card>

      {/* Distribution Modal */}
      <Modal
        title="Phân phát quà"
        open={isDistributionModalVisible}
        onOk={handleConfirmDistribute}
        onCancel={() => {
          setIsDistributionModalVisible(false);
          setDistributionNote("");
        }}
        confirmLoading={distributing}
        okText="Xác nhận phân phát"
        cancelText="Hủy"
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>
              Bạn đang phân phát quà cho {selectedRowKeys.length} đăng ký.
            </Text>
          </div>
          <div>
            <Text type="secondary">Ghi chú (tùy chọn):</Text>
            <TextArea
              rows={4}
              placeholder="Nhập ghi chú về việc phân phát quà..."
              value={distributionNote}
              onChange={(e) => setDistributionNote(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết đăng ký"
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setViewingRegistration(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={600}
      >
        {viewingRegistration && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div>
              <Text strong>Sự kiện: </Text>
              <Text>{viewingRegistration.event?.name || "N/A"}</Text>
            </div>
            <div>
              <Text strong>Họ tên: </Text>
              <Text>{viewingRegistration.citizen?.fullName || "N/A"}</Text>
            </div>
            <div>
              <Text strong>CMND/CCCD: </Text>
              <Text>{viewingRegistration.citizen?.nationalId || "N/A"}</Text>
            </div>
            <div>
              <Text strong>Hộ khẩu: </Text>
              <Text>{viewingRegistration.household?.code || "N/A"}</Text>
            </div>
            <div>
              <Text strong>Thời gian đăng ký: </Text>
              <Text>
                {viewingRegistration.createdAt
                  ? dayjs(viewingRegistration.createdAt).format(
                      "DD/MM/YYYY HH:mm:ss"
                    )
                  : "N/A"}
              </Text>
            </div>
            <div>
              <Text strong>Trạng thái: </Text>
              {getStatusTag(viewingRegistration.status)}
            </div>
            {viewingRegistration.distributedAt && (
              <div>
                <Text strong>Thời gian phát quà: </Text>
                <Text>
                  {dayjs(viewingRegistration.distributedAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )}
                </Text>
              </div>
            )}
            <div>
              <Text strong>Số lượng: </Text>
              <Text>{viewingRegistration.quantity || 1}</Text>
            </div>
            {viewingRegistration.totalValue && (
              <div>
                <Text strong>Giá trị: </Text>
                <Text>
                  {viewingRegistration.totalValue.toLocaleString("vi-VN")} VNĐ
                </Text>
              </div>
            )}
            {viewingRegistration.note && (
              <div>
                <Text strong>Ghi chú đăng ký: </Text>
                <Text>{viewingRegistration.note}</Text>
              </div>
            )}
            {viewingRegistration.distributionNote && (
              <div>
                <Text strong>Ghi chú phân phát: </Text>
                <Text>{viewingRegistration.distributionNote}</Text>
              </div>
            )}
          </Space>
        )}
      </Modal>
    </Layout>
  );
};

export default RewardDistributions;

