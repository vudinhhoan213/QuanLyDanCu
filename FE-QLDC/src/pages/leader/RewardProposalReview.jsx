import React, { useState } from "react";
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
  Image,
} from "antd";
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import Layout from "../../components/Layout";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RewardProposalReview = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentProposal, setCurrentProposal] = useState(null);
  const [reviewNote, setReviewNote] = useState("");

  // Mock data
  const [proposals, setProposals] = useState([
    {
      key: "1",
      id: "RP-001",
      citizen: "Nguyễn Văn A",
      household: "HK-001",
      studentName: "Nguyễn Văn B",
      achievement: "Học sinh giỏi cấp trường",
      school: "THPT Nguyễn Du",
      grade: "Lớp 12A1",
      description: "Đạt giải Nhất học sinh giỏi môn Toán",
      submitDate: "2024-10-20",
      status: "pending",
    },
    {
      key: "2",
      id: "RP-002",
      citizen: "Trần Thị C",
      household: "HK-002",
      studentName: "Trần Văn D",
      achievement: "Học sinh tiên tiến",
      school: "THCS Lê Lợi",
      grade: "Lớp 9A2",
      description: "Đạt danh hiệu học sinh tiên tiến năm học 2023-2024",
      submitDate: "2024-10-19",
      status: "pending",
    },
    {
      key: "3",
      id: "RP-003",
      citizen: "Lê Thị E",
      household: "HK-003",
      studentName: "Lê Văn F",
      achievement: "Học sinh giỏi cấp quốc gia",
      school: "THPT Chuyên Lê Hồng Phong",
      grade: "Lớp 11A1",
      description: "Giải Ba Olympic Toán học toàn quốc",
      submitDate: "2024-10-18",
      status: "approved",
      reviewDate: "2024-10-19",
      reviewer: "Admin",
      reviewNote: "Đã xác minh giấy khen",
      rewardAmount: "500,000 VNĐ",
    },
    {
      key: "4",
      id: "RP-004",
      citizen: "Phạm Văn G",
      household: "HK-004",
      studentName: "Phạm Thị H",
      achievement: "Học sinh giỏi",
      school: "Tiểu học Nguyễn Trãi",
      grade: "Lớp 5A",
      description: "Học sinh giỏi cả năm",
      submitDate: "2024-10-17",
      status: "rejected",
      reviewDate: "2024-10-18",
      reviewer: "Admin",
      reviewNote: "Thiếu bằng khen gốc",
    },
  ]);

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

  const achievementConfig = {
    "Học sinh giỏi cấp quốc gia": { color: "red", reward: "1,000,000 VNĐ" },
    "Học sinh giỏi cấp tỉnh": { color: "orange", reward: "500,000 VNĐ" },
    "Học sinh giỏi cấp trường": { color: "blue", reward: "300,000 VNĐ" },
    "Học sinh tiên tiến": { color: "green", reward: "200,000 VNĐ" },
    "Học sinh giỏi": { color: "cyan", reward: "200,000 VNĐ" },
  };

  const columns = [
    {
      title: "Mã đề xuất",
      dataIndex: "id",
      key: "id",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Người đề xuất",
      dataIndex: "citizen",
      key: "citizen",
    },
    {
      title: "Tên học sinh",
      dataIndex: "studentName",
      key: "studentName",
    },
    {
      title: "Thành tích",
      dataIndex: "achievement",
      key: "achievement",
      render: (achievement) => {
        const config = achievementConfig[achievement] || { color: "default" };
        return <Tag color={config.color}>{achievement}</Tag>;
      },
    },
    {
      title: "Trường",
      dataIndex: "school",
      key: "school",
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
            type="link"
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
    setCurrentProposal(record);
    setViewModalVisible(true);
  };

  const handleReview = (record, action) => {
    const rewardAmount =
      achievementConfig[record.achievement]?.reward || "200,000 VNĐ";
    setCurrentProposal({ ...record, reviewAction: action, rewardAmount });
    setReviewNote("");
    setReviewModalVisible(true);
  };

  const handleReviewConfirm = () => {
    const updatedProposals = proposals.map((prop) => {
      if (prop.key === currentProposal.key) {
        return {
          ...prop,
          status: currentProposal.reviewAction,
          reviewDate: dayjs().format("YYYY-MM-DD"),
          reviewer: "Admin",
          reviewNote: reviewNote,
          rewardAmount: currentProposal.rewardAmount,
        };
      }
      return prop;
    });

    setProposals(updatedProposals);
    message.success(
      currentProposal.reviewAction === "approved"
        ? "Đã duyệt đề xuất khen thưởng thành công"
        : "Đã từ chối đề xuất"
    );
    setReviewModalVisible(false);
    setCurrentProposal(null);
    setReviewNote("");
  };

  const filteredProposals = proposals.filter((prop) => {
    const matchSearch = Object.values(prop).some((value) =>
      value.toString().toLowerCase().includes(searchText.toLowerCase())
    );
    const matchStatus =
      selectedStatus === "all" || prop.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: proposals.length,
    pending: proposals.filter((p) => p.status === "pending").length,
    approved: proposals.filter((p) => p.status === "approved").length,
    rejected: proposals.filter((p) => p.status === "rejected").length,
  };

  return (
    <Layout>
      <div>
        {/* Page Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            <TrophyOutlined /> Duyệt Đề Xuất Khen Thưởng
          </Title>
        </div>

        {/* Statistics */}
        <Card bordered={false} style={{ marginBottom: 16 }}>
          <Space size="large">
            <div>
              <Text type="secondary">Tổng đề xuất</Text>
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
                placeholder="Tìm kiếm đề xuất..."
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
            dataSource={filteredProposals}
            loading={loading}
            pagination={{
              total: filteredProposals.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} đề xuất`,
            }}
            scroll={{ x: 1400 }}
          />
        </Card>

        {/* View Modal */}
        <Modal
          title="Chi tiết đề xuất khen thưởng"
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              Đóng
            </Button>,
          ]}
          width={800}
        >
          {currentProposal && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã đề xuất" span={2}>
                <Text strong>{currentProposal.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Người đề xuất">
                {currentProposal.citizen}
              </Descriptions.Item>
              <Descriptions.Item label="Hộ khẩu">
                {currentProposal.household}
              </Descriptions.Item>
              <Descriptions.Item label="Tên học sinh" span={2}>
                <Text strong>{currentProposal.studentName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trường">
                {currentProposal.school}
              </Descriptions.Item>
              <Descriptions.Item label="Lớp">
                {currentProposal.grade}
              </Descriptions.Item>
              <Descriptions.Item label="Thành tích" span={2}>
                {achievementConfig[currentProposal.achievement] && (
                  <Tag
                    color={achievementConfig[currentProposal.achievement].color}
                  >
                    {currentProposal.achievement}
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>
                {currentProposal.description}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày gửi">
                {dayjs(currentProposal.submitDate).format("DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {statusConfig[currentProposal.status] && (
                  <Tag
                    color={statusConfig[currentProposal.status].color}
                    icon={statusConfig[currentProposal.status].icon}
                  >
                    {statusConfig[currentProposal.status].text}
                  </Tag>
                )}
              </Descriptions.Item>
              {currentProposal.reviewDate && (
                <>
                  <Descriptions.Item label="Ngày duyệt">
                    {dayjs(currentProposal.reviewDate).format("DD/MM/YYYY")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Người duyệt">
                    {currentProposal.reviewer}
                  </Descriptions.Item>
                  <Descriptions.Item label="Giá trị khen thưởng">
                    <Text strong style={{ color: "#52c41a" }}>
                      {currentProposal.rewardAmount}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ghi chú">
                    {currentProposal.reviewNote}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          )}
        </Modal>

        {/* Review Modal */}
        <Modal
          title={
            currentProposal?.reviewAction === "approved"
              ? "Duyệt đề xuất khen thưởng"
              : "Từ chối đề xuất"
          }
          open={reviewModalVisible}
          onOk={handleReviewConfirm}
          onCancel={() => setReviewModalVisible(false)}
          okText="Xác nhận"
          cancelText="Hủy"
        >
          {currentProposal && (
            <>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Mã đề xuất">
                  {currentProposal.id}
                </Descriptions.Item>
                <Descriptions.Item label="Học sinh">
                  {currentProposal.studentName}
                </Descriptions.Item>
                <Descriptions.Item label="Thành tích">
                  {currentProposal.achievement}
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả">
                  {currentProposal.description}
                </Descriptions.Item>
                {currentProposal.reviewAction === "approved" && (
                  <Descriptions.Item label="Giá trị khen thưởng">
                    <Text strong style={{ color: "#52c41a", fontSize: 16 }}>
                      {currentProposal.rewardAmount}
                    </Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
              <div style={{ marginTop: 16 }}>
                <Text strong>
                  Ghi chú{" "}
                  {currentProposal.reviewAction === "approved"
                    ? "duyệt"
                    : "từ chối"}
                  :
                </Text>
                <TextArea
                  rows={4}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Nhập ghi chú (không bắt buộc)"
                  style={{ marginTop: 8 }}
                />
              </div>
            </>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default RewardProposalReview;
