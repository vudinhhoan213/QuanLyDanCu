import React, { useState } from "react";
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
  Statistic,
  Row,
  Col,
} from "antd";
import {
  GiftOutlined,
  TrophyOutlined,
  EyeOutlined,
  PlusOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const MyRewards = () => {
  const navigate = useNavigate();
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);

  // Mock data
  const rewards = [
    {
      key: "1",
      id: "RW-001",
      type: "event",
      eventName: "Trung Thu 2024",
      studentName: "-",
      achievement: "-",
      amount: "200,000 VNĐ",
      date: "2024-09-15",
      status: "received",
      description: "Phần quà Trung Thu cho trẻ em dưới 15 tuổi",
    },
    {
      key: "2",
      id: "RW-002",
      type: "achievement",
      eventName: "Khen thưởng học tập",
      studentName: "Nguyễn Văn B",
      achievement: "Học sinh giỏi cấp trường",
      amount: "300,000 VNĐ",
      date: "2024-08-01",
      status: "received",
      description: "Khen thưởng thành tích học tập năm học 2023-2024",
    },
    {
      key: "3",
      id: "RW-003",
      type: "event",
      eventName: "Tết Thiếu Nhi 1-6",
      studentName: "-",
      achievement: "-",
      amount: "150,000 VNĐ",
      date: "2024-06-01",
      status: "received",
      description: "Phần quà Tết Thiếu Nhi",
    },
  ];

  const typeConfig = {
    event: { color: "purple", text: "Sự kiện", icon: <GiftOutlined /> },
    achievement: {
      color: "gold",
      text: "Thành tích",
      icon: <TrophyOutlined />,
    },
  };

  const columns = [
    {
      title: "Mã phần thưởng",
      dataIndex: "id",
      key: "id",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const config = typeConfig[type];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Sự kiện/Thành tích",
      dataIndex: "eventName",
      key: "eventName",
    },
    {
      title: "Học sinh",
      dataIndex: "studentName",
      key: "studentName",
      render: (text) => text || "-",
    },
    {
      title: "Giá trị",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => (
        <Text strong style={{ color: "#52c41a" }}>
          {amount}
        </Text>
      ),
    },
    {
      title: "Ngày nhận",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: () => (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          Đã nhận
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Button
          type="link"
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
  const totalAmount = rewards.reduce((sum, reward) => {
    const amount = parseInt(reward.amount.replace(/[^0-9]/g, ""));
    return sum + amount;
  }, 0);

  const eventRewards = rewards.filter((r) => r.type === "event").length;
  const achievementRewards = rewards.filter(
    (r) => r.type === "achievement"
  ).length;

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
              <GiftOutlined /> Khen Thưởng Của Tôi
            </Title>
            <Text type="secondary">
              Danh sách khen thưởng và phần quà đã nhận
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate("/citizen/submit-reward-proposal")}
          >
            Đề xuất khen thưởng
          </Button>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Tổng phần thưởng"
                value={rewards.length}
                prefix={<GiftOutlined style={{ color: "#1890ff" }} />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Tổng giá trị"
                value={totalAmount.toLocaleString()}
                suffix="VNĐ"
                prefix={<TrophyOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text type="secondary">Phân loại</Text>
                <Space size="large">
                  <div>
                    <Text strong style={{ fontSize: 20 }}>
                      {eventRewards}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Sự kiện
                    </Text>
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 20 }}>
                      {achievementRewards}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Thành tích
                    </Text>
                  </div>
                </Space>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Table */}
        <Card bordered={false}>
          {rewards.length === 0 ? (
            <Empty
              description="Bạn chưa có phần thưởng nào"
              style={{ padding: "60px 0" }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/citizen/submit-reward-proposal")}
              >
                Đề xuất khen thưởng
              </Button>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={rewards}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} phần thưởng`,
              }}
              scroll={{ x: 1200 }}
            />
          )}
        </Card>

        {/* View Modal */}
        <Modal
          title="Chi tiết phần thưởng"
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              Đóng
            </Button>,
          ]}
          width={700}
        >
          {currentReward && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã phần thưởng" span={2}>
                <Text strong>{currentReward.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Loại" span={2}>
                {typeConfig[currentReward.type] && (
                  <Tag
                    color={typeConfig[currentReward.type].color}
                    icon={typeConfig[currentReward.type].icon}
                  >
                    {typeConfig[currentReward.type].text}
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Sự kiện" span={2}>
                {currentReward.eventName}
              </Descriptions.Item>
              {currentReward.studentName !== "-" && (
                <>
                  <Descriptions.Item label="Học sinh">
                    {currentReward.studentName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thành tích">
                    {currentReward.achievement}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Mô tả" span={2}>
                {currentReward.description}
              </Descriptions.Item>
              <Descriptions.Item label="Giá trị">
                <Text strong style={{ color: "#52c41a", fontSize: 16 }}>
                  {currentReward.amount}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày nhận">
                {dayjs(currentReward.date).format("DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={2}>
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  Đã nhận
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default MyRewards;
