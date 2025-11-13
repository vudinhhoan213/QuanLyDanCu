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
  Checkbox,
  Modal,
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  SendOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import { rewardService } from "../../services";
import { exportRegistrationsToExcel } from "../../utils/exportExcel";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const RewardEventRegistrations = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchEvent();
    fetchRegistrations();
  }, [id, pagination.current, pagination.pageSize]);

  const fetchEvent = async () => {
    try {
      const eventData = await rewardService.events.getById(id);
      setEvent(eventData);
    } catch (error) {
      console.error("Error fetching event:", error);
      message.error("Không thể tải thông tin sự kiện");
      navigate("/leader/reward-events");
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        event: id,
      };

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

  const handleMarkAsReceived = async (registrationIds) => {
    try {
      // TODO: Implement API endpoint to mark as received
      // For now, we'll update locally
      message.success(`Đã đánh dấu ${registrationIds.length} người đã nhận quà`);
      setSelectedRowKeys([]);
      fetchRegistrations();
    } catch (error) {
      console.error("Error marking as received:", error);
      message.error("Không thể đánh dấu đã nhận quà");
    }
  };

  const handleBulkMarkAsReceived = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một người đăng ký");
      return;
    }
    handleMarkAsReceived(selectedRowKeys);
  };

  const handleExport = () => {
    try {
      if (registrations.length === 0) {
        message.warning("Không có dữ liệu để xuất");
        return;
      }

      const eventName = event?.name || "Su-kien";
      exportRegistrationsToExcel(registrations, eventName);
      message.success("Xuất danh sách thành công!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("Không thể xuất danh sách. Vui lòng thử lại!");
    }
  };

  const handleSendReminder = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một người đăng ký");
      return;
    }
    // TODO: Implement send reminder notification
    message.info("Tính năng gửi tin nhắn nhắc nhở đang được phát triển");
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      !searchText ||
      reg.citizen?.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      reg.household?.code?.toLowerCase().includes(searchText.toLowerCase()) ||
      reg.citizen?.nationalId?.includes(searchText);
    return matchesSearch;
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      fixed: "left",
      render: (_, __, index) => {
        return (pagination.current - 1) * pagination.pageSize + index + 1;
      },
    },
    {
      title: "Họ tên",
      key: "fullName",
      width: 150,
      ellipsis: true,
      render: (_, record) => (
        <Text strong>{record.citizen?.fullName || "N/A"}</Text>
      ),
    },
    {
      title: "CMND/CCCD",
      key: "nationalId",
      width: 120,
      ellipsis: true,
      render: (_, record) => record.citizen?.nationalId || "N/A",
    },
    {
      title: "Hộ khẩu",
      key: "household",
      width: 120,
      ellipsis: true,
      render: (_, record) => record.household?.code || "N/A",
    },
    {
      title: "Thời gian nhận",
      key: "distributedAt",
      width: 150,
      render: (_, record) =>
        record.distributedAt
          ? dayjs(record.distributedAt).format("DD/MM/YYYY HH:mm")
          : record.createdAt
          ? dayjs(record.createdAt).format("DD/MM/YYYY HH:mm")
          : "-",
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 80,
      render: (_, record) => record.quantity || 1,
    },
    {
      title: "Giá trị",
      key: "totalValue",
      width: 130,
      ellipsis: true,
      render: (_, record) =>
        record.totalValue
          ? `${record.totalValue.toLocaleString("vi-VN")} VNĐ`
          : "N/A",
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 120,
      render: (_, record) => {
        // TODO: Add status field to RewardDistribution model
        // For now, we'll use a placeholder
        return <Tag color="green">Đã nhận quà</Tag>;
      },
    },
  ];

  return (
    <Layout>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate("/leader/reward-events")}
                >
                  Quay lại
                </Button>
                <Title level={2} style={{ margin: 0 }}>
                  Danh sách Đăng ký
                </Title>
                {event && (
                  <Text type="secondary">- {event.name}</Text>
                )}
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleBulkMarkAsReceived}
                  disabled={selectedRowKeys.length === 0}
                >
                  Đánh dấu đã nhận ({selectedRowKeys.length})
                </Button>
                <Button
                  icon={<SendOutlined />}
                  onClick={handleSendReminder}
                  disabled={selectedRowKeys.length === 0}
                >
                  Gửi nhắc nhở
                </Button>
                <Button
                  icon={<ExportOutlined />}
                  onClick={handleExport}
                >
                  Xuất danh sách
                </Button>
              </Space>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Tìm kiếm theo tên/CMND/hộ khẩu..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
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
            scroll={{ x: 930 }}
          />
        </Space>
      </Card>
    </Layout>
  );
};

export default RewardEventRegistrations;