import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Descriptions,
  Empty,
  Table,
  QRCode,
  Tooltip,
} from "antd";
import {
  GiftOutlined,
  EyeOutlined,
  PrinterOutlined,
  QrcodeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import Layout from "../../components/Layout";
import { rewardService } from "../../services";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const EventList = () => {
  const [loading, setLoading] = useState(true);
  const [receivedRewards, setReceivedRewards] = useState([]);
  const [viewingReward, setViewingReward] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchReceivedRewards();
  }, [pagination.current, pagination.pageSize]);

  const fetchReceivedRewards = async () => {
    try {
      setLoading(true);
      // Lấy chỉ những quà đã được phát (status = DISTRIBUTED) - filter ở backend
      const response = await rewardService.distributions.getMyRegistrations({
        page: pagination.current,
        limit: pagination.pageSize,
        sort: "-distributedAt",
        status: "DISTRIBUTED", // Filter ở backend để pagination chính xác
      });

      const allRegistrations = response.docs || [];

      // Format dữ liệu để hiển thị
      const formattedRewards = allRegistrations.map((reward) => ({
        key: reward._id,
        ...reward,
        eventName: reward.event?.name || "Không có",
        eventId: reward.event?._id || reward.event,
        rewardDescription: reward.event?.rewardDescription || reward.note || "Không có mô tả",
        distributedAt: reward.distributedAt,
        totalValue: reward.totalValue || 0,
        quantity: reward.quantity || 1,
      }));

      setReceivedRewards(formattedRewards);
      setPagination({
        ...pagination,
        total: response.total || 0, // Sử dụng total từ backend
      });
    } catch (error) {
      console.error("❌ Error fetching received rewards:", error);
      message.error(
        error.response?.data?.message || "Không thể tải danh sách quà đã nhận"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (reward) => {
    setViewingReward(reward);
    setIsModalVisible(true);
  };

  const handlePrint = (reward) => {
    window.print();
  };

  const handleShowQR = (reward) => {
    setViewingReward(reward);
    setIsQRModalVisible(true);
  };

  const getStatusTag = (status) => {
    if (status === "DISTRIBUTED") {
      return <Tag color="green">Đã được phát quà</Tag>;
    }
    if (status === "REGISTERED") {
      return <Tag color="blue">Đã đăng ký</Tag>;
    }
    return <Tag color="default">{status}</Tag>;
  };

  const columns = [
    {
      title: "Sự kiện",
      dataIndex: "eventName",
      key: "eventName",
      width: 200,
      render: (text) => <Text strong>{text || "Không có"}</Text>,
    },
    {
      title: "Thời gian nhận quà",
      key: "distributedAt",
      width: 180,
      render: (_, record) =>
        record.distributedAt
          ? dayjs(record.distributedAt).format("DD/MM/YYYY HH:mm")
          : "-",
    },
    {
      title: "Mô tả quà",
      key: "rewardDescription",
      width: 250,
      ellipsis: true,
      render: (_, record) => {
        const description = record.rewardDescription || "Không có mô tả";
        return (
          <Tooltip title={description} placement="topLeft">
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {description}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Giá trị",
      key: "totalValue",
      width: 130,
      align: "right",
      render: (_, record) =>
        record.totalValue && record.totalValue > 0
          ? `${record.totalValue.toLocaleString("vi-VN")} VNĐ`
          : "-",
    },
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<PrinterOutlined />}
            onClick={() => handlePrint(record)}
          >
            In
          </Button>
          <Button
            type="link"
            icon={<QrcodeOutlined />}
            onClick={() => handleShowQR(record)}
          >
            Mã QR
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                <GiftOutlined /> Quà đã nhận
              </Title>
              <Text type="secondary">
                Danh sách quà đã được phát từ các sự kiện
              </Text>
            </Col>
            <Col>
              <Button icon={<ReloadOutlined />} onClick={fetchReceivedRewards}>
                Làm mới
              </Button>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={receivedRewards}
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} quà đã nhận`,
              onChange: (page, pageSize) => {
                setPagination({ ...pagination, current: page, pageSize });
              },
            }}
            scroll={{ x: 1000 }}
            locale={{
              emptyText: (
                <Empty
                  description="Bạn chưa nhận quà từ sự kiện nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </Space>
      </Card>

      {/* Chi tiết quà đã nhận Modal */}
      <Modal
        title="Chi tiết quà đã nhận"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setViewingReward(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsModalVisible(false);
              setViewingReward(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={600}
      >
        {viewingReward && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Tên sự kiện">
              {viewingReward.eventName || "Không có"}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian nhận quà">
              {viewingReward.distributedAt
                ? dayjs(viewingReward.distributedAt).format("DD/MM/YYYY HH:mm")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getStatusTag(viewingReward.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả quà">
              <Text strong style={{ color: "#1890ff" }}>
                {viewingReward.rewardDescription || "Không có mô tả"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng">
              {viewingReward.quantity || 1}
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị">
              {viewingReward.totalValue && viewingReward.totalValue > 0
                ? `${viewingReward.totalValue.toLocaleString("vi-VN")} VNĐ`
                : "-"}
            </Descriptions.Item>
            {viewingReward.note && (
              <Descriptions.Item label="Ghi chú">
                {viewingReward.note}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal
        title="Mã QR quà đã nhận"
        open={isQRModalVisible}
        onCancel={() => {
          setIsQRModalVisible(false);
          setViewingReward(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsQRModalVisible(false);
              setViewingReward(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={400}
      >
        {viewingReward && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <QRCode
              value={JSON.stringify({
                id: viewingReward._id,
                event: viewingReward.eventName,
                distributedAt: viewingReward.distributedAt,
                totalValue: viewingReward.totalValue,
              })}
              size={200}
            />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                {viewingReward.eventName || "Không có"}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default EventList;