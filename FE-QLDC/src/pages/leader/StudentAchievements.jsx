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
  Image,
  Descriptions,
} from "antd";
import {
  SearchOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Layout from "../../components/Layout";
import dayjs from "dayjs";
import { rewardService } from "../../services";

const { Title, Text } = Typography;
const { Option } = Select;

const StudentAchievements = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [achievementFilter, setAchievementFilter] = useState("all");
  const [rewardStatusFilter, setRewardStatusFilter] = useState("all");
  const [achievements, setAchievements] = useState([]);
  const [rewardProposals, setRewardProposals] = useState([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("StudentAchievements: Component mounted, fetching data...");
    fetchRewardProposals();
  }, []);

  // Parse description để lấy thông tin trường, lớp, ngày
  const parseProposalDescription = (description) => {
    if (!description)
      return { schoolName: "", className: "", achievementDate: "" };

    // Format: "- Trường: ..." hoặc "Trường: ..."
    const schoolMatch =
      description.match(/[-•]\s*Trường:\s*(.+?)(?:\n|$)/i) ||
      description.match(/Trường:\s*(.+?)(?:\n|$)/i);
    const classMatch =
      description.match(/[-•]\s*Lớp:\s*(.+?)(?:\n|$)/i) ||
      description.match(/Lớp:\s*(.+?)(?:\n|$)/i);
    const dateMatch =
      description.match(/[-•]\s*Ngày đạt thành tích:\s*(.+?)(?:\n|$)/i) ||
      description.match(/Ngày đạt thành tích:\s*(.+?)(?:\n|$)/i);

    return {
      schoolName: schoolMatch ? schoolMatch[1].trim() : "",
      className: classMatch ? classMatch[1].trim() : "",
      achievementDate: dateMatch ? dateMatch[1].trim() : "",
    };
  };

  // Parse criteria để lấy loại thành tích
  const parseAchievementType = (criteria) => {
    if (!criteria) return "KHAC";

    if (
      criteria.includes("Học sinh giỏi cấp quốc gia") ||
      criteria.includes("Học sinh giỏi")
    ) {
      return "GIOI";
    } else if (criteria.includes("Học sinh tiên tiến")) {
      return "TIEN_TIEN";
    }
    return "KHAC";
  };

  // Extract năm học từ description hoặc createdAt
  const getSchoolYear = (description, createdAt) => {
    // Nếu có ngày trong description, lấy năm từ đó
    const dateMatch = description?.match(
      /Ngày đạt thành tích:\s*(\d{2}\/\d{2}\/(\d{4}))/
    );
    if (dateMatch && dateMatch[2]) {
      const year = parseInt(dateMatch[2]);
      return `${year - 1}-${year}`;
    }

    // Nếu không, lấy từ createdAt
    if (createdAt) {
      const date = new Date(createdAt);
      const year = date.getFullYear();
      return `${year - 1}-${year}`;
    }

    return "";
  };

  const fetchRewardProposals = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("StudentAchievements: Fetching reward proposals...");
      // Lấy tất cả reward proposals (không filter status để hiển thị cả PENDING và APPROVED)
      const response = await rewardService.proposals.getAll();
      console.log("StudentAchievements: Reward proposals response:", response);

      const proposalsList = response?.docs || response || [];
      console.log("StudentAchievements: Proposals list:", proposalsList);

      // Chuyển đổi reward proposals thành achievements
      const formattedAchievements = proposalsList.map((proposal) => {
        const descriptionInfo = parseProposalDescription(proposal.description);
        const achievementType = parseAchievementType(proposal.criteria);
        const schoolYear = getSchoolYear(
          proposal.description,
          proposal.createdAt
        );

        return {
          key: proposal._id,
          id: proposal._id,
          _id: proposal._id,
          proposalId: proposal._id,
          citizen: proposal.citizen,
          citizenName: proposal.citizen?.fullName || "N/A",
          citizenId: proposal.citizen?._id,
          nationalId: proposal.citizen?.nationalId || "N/A",
          schoolYear: schoolYear,
          schoolName: descriptionInfo.schoolName,
          className: descriptionInfo.className,
          achievement: achievementType,
          achievementDate: descriptionInfo.achievementDate,
          notebooksRewarded: 0, // Không có trong reward proposal
          evidenceImages: proposal.evidenceImages || [],
          createdAt: proposal.createdAt,
          status: proposal.status, // PENDING, APPROVED, REJECTED
          title: proposal.title,
          description: proposal.description,
          criteria: proposal.criteria,
          reviewedBy: proposal.reviewedBy,
          approvedAt: proposal.approvedAt,
        };
      });

      console.log(
        "StudentAchievements: Formatted achievements:",
        formattedAchievements
      );
      setAchievements(formattedAchievements);

      // Lưu danh sách proposals đã APPROVED để check trạng thái
      const approvedProposals = proposalsList.filter(
        (p) => p.status === "APPROVED"
      );
      setRewardProposals(approvedProposals);
    } catch (error) {
      console.error(
        "StudentAchievements: Error fetching reward proposals:",
        error
      );
      setError(error.message || "Không thể tải danh sách thành tích học sinh");
      message.error("Không thể tải danh sách thành tích học sinh");
      setAchievements([]);
      setRewardProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record) => {
    setCurrentAchievement({
      ...record,
    });
    setViewModalVisible(true);
  };

  const achievementConfig = {
    GIOI: {
      label: "Giỏi",
      color: "gold",
    },
    TIEN_TIEN: {
      label: "Tiên tiến",
      color: "blue",
    },
    KHAC: {
      label: "Khác",
      color: "default",
    },
  };

  const getAchievementTag = React.useCallback((achievement) => {
    try {
      if (!achievement) return <Tag>N/A</Tag>;
      const config = achievementConfig[achievement] || achievementConfig.KHAC;
      return <Tag color={config.color}>{config.label}</Tag>;
    } catch (error) {
      console.error("Error rendering achievement tag:", error);
      return <Tag>N/A</Tag>;
    }
  }, []);

  const getRewardStatusTag = React.useCallback((status) => {
    try {
      if (status === "APPROVED") {
        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Đã duyệt khen thưởng
          </Tag>
        );
      } else if (status === "PENDING") {
        return (
          <Tag color="gold" icon={<ClockCircleOutlined />}>
            Chờ duyệt
          </Tag>
        );
      } else if (status === "REJECTED") {
        return (
          <Tag color="red" icon={<ClockCircleOutlined />}>
            Đã từ chối
          </Tag>
        );
      }
      return (
        <Tag color="default" icon={<ClockCircleOutlined />}>
          Chưa duyệt
        </Tag>
      );
    } catch (error) {
      console.error("Error rendering reward status tag:", error);
      return <Tag>N/A</Tag>;
    }
  }, []);

  const filteredAchievements = React.useMemo(() => {
    if (!Array.isArray(achievements)) return [];

    return achievements.filter((ach) => {
      try {
        const matchSearch =
          !searchText ||
          (ach.citizenName || "")
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (ach.nationalId || "").includes(searchText) ||
          (ach.schoolName || "")
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (ach.className || "")
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (ach.schoolYear || "").includes(searchText);

        const matchAchievement =
          achievementFilter === "all" ||
          ach.achievement === achievementFilter.toUpperCase();

        const matchRewardStatus =
          rewardStatusFilter === "all" ||
          (rewardStatusFilter === "approved" && ach.status === "APPROVED") ||
          (rewardStatusFilter === "none" && ach.status !== "APPROVED");

        return matchSearch && matchAchievement && matchRewardStatus;
      } catch (error) {
        console.error("Error filtering achievement:", error);
        return false;
      }
    });
  }, [achievements, searchText, achievementFilter, rewardStatusFilter]);

  const stats = React.useMemo(() => {
    if (!Array.isArray(achievements)) {
      return { total: 0, withReward: 0, withoutReward: 0, gioi: 0 };
    }

    try {
      return {
        total: achievements.length,
        withReward: achievements.filter((a) => a.status === "APPROVED").length,
        withoutReward: achievements.filter((a) => a.status !== "APPROVED")
          .length,
        gioi: achievements.filter((a) => a.achievement === "GIOI").length,
      };
    } catch (error) {
      console.error("Error calculating stats:", error);
      return { total: 0, withReward: 0, withoutReward: 0, gioi: 0 };
    }
  }, [achievements]);

  const columns = React.useMemo(
    () => [
      {
        title: "STT",
        key: "index",
        width: 80,
        align: "center",
        render: (_, __, index) => index + 1,
      },
      {
        title: "Họ tên học sinh",
        key: "citizenName",
        width: 250,
        render: (_, record) => (
          <Space>
            <UserOutlined />
            <Text strong>{record?.citizenName || "N/A"}</Text>
          </Space>
        ),
      },
      {
        title: "CCCD",
        key: "nationalId",
        width: 180,
        render: (_, record) => record?.nationalId || "N/A",
      },
      {
        title: "Năm học",
        key: "schoolYear",
        width: 150,
        align: "center",
        render: (_, record) => record?.schoolYear || "N/A",
      },
      {
        title: "Thành tích",
        key: "achievement",
        width: 300,
        render: (_, record) => <Text>{record?.title || "N/A"}</Text>,
      },
    ],
    []
  );

  // Debug log
  if (typeof console !== "undefined") {
    console.log(
      "StudentAchievements: Render - achievements:",
      achievements.length,
      "loading:",
      loading,
      "error:",
      error
    );
  }

  // Ensure component always renders something
  try {
    return (
      <Layout>
        <div>
          {/* Header gradient */}
          <Card
            bordered={false}
            style={{
              marginBottom: 24,
              background:
                "linear-gradient(120deg, #35475aff 0%, #7fc4ff 30%, #2b6fd6 55%, #008dff 80%, #00c4b4 100%)",
              border: "none",
              borderRadius: "12px",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            bodyStyle={{ padding: "32px" }}
            className="hover-card"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
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
                <TrophyOutlined style={{ fontSize: 32, color: "#fff" }} />
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
                  Thành tích học sinh
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
                  Quản lý và theo dõi thành tích học tập của học sinh
                </Text>
              </div>
            </div>

            {/* Hover effect */}
            <style>{`
              .hover-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 25px rgba(24, 144, 255, 0.35);
              }
            `}</style>
          </Card>

          <div style={{ padding: "0", minHeight: "100vh" }}>
            {/* Error Message */}
            {error && (
              <Card
                bordered={false}
                style={{
                  marginBottom: 16,
                  backgroundColor: "#fff2f0",
                  borderColor: "#ffccc7",
                }}
              >
                <Text type="danger">Lỗi: {error}</Text>
              </Card>
            )}

            {/* Statistics */}
            <Card
              bordered={false}
              style={{
                marginBottom: 16,
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <Space size="large">
                <div>
                  <Text type="secondary">Tổng thành tích</Text>
                  <Title level={3} style={{ margin: 0 }}>
                    {stats.total}
                  </Title>
                </div>
                <div>
                  <Text type="secondary">Đã duyệt khen thưởng</Text>
                  <Title level={3} style={{ margin: 0, color: "#52c41a" }}>
                    {stats.withReward}
                  </Title>
                </div>
                <div>
                  <Text type="secondary">Chưa duyệt khen thưởng</Text>
                  <Title level={3} style={{ margin: 0, color: "#faad14" }}>
                    {stats.withoutReward}
                  </Title>
                </div>
                <div>
                  <Text type="secondary">Học sinh giỏi</Text>
                  <Title level={3} style={{ margin: 0, color: "#faad14" }}>
                    {stats.gioi}
                  </Title>
                </div>
              </Space>
            </Card>

            {/* Filter Bar */}
            <Card
              bordered={false}
              style={{
                marginBottom: 16,
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Space>
                  <Input
                    placeholder="Tìm kiếm thành tích..."
                    prefix={<SearchOutlined />}
                    style={{ width: 300 }}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />
                  <Select
                    style={{ width: 150 }}
                    value={achievementFilter}
                    onChange={setAchievementFilter}
                  >
                    <Option value="all">Tất cả thành tích</Option>
                    <Option value="GIOI">Giỏi</Option>
                    <Option value="TIEN_TIEN">Tiên tiến</Option>
                    <Option value="KHAC">Khác</Option>
                  </Select>
                  <Select
                    style={{ width: 180 }}
                    value={rewardStatusFilter}
                    onChange={setRewardStatusFilter}
                  >
                    <Option value="all">Tất cả</Option>
                    <Option value="approved">Đã duyệt khen thưởng</Option>
                    <Option value="none">Chưa duyệt khen thưởng</Option>
                  </Select>
                </Space>
              </Space>
            </Card>

            {/* Table */}
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "all 0.3s ease",
              }}
              className="hover-table-card"
            >
              {!loading &&
              filteredAchievements.length === 0 &&
              achievements.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Text type="secondary">Chưa có thành tích học sinh nào</Text>
                </div>
              ) : !loading &&
                filteredAchievements.length === 0 &&
                achievements.length > 0 ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Text type="secondary">
                    Không tìm thấy thành tích nào phù hợp với bộ lọc
                  </Text>
                </div>
              ) : (
                <Table
                  columns={columns}
                  dataSource={filteredAchievements}
                  loading={loading}
                  rowKey="id"
                  pagination={{
                    total: filteredAchievements.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} thành tích`,
                  }}
                  rowClassName={() => "hoverable-row"}
                />
              )}
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

          {/* View Modal */}
          <Modal
            title="Chi tiết thành tích học sinh"
            open={viewModalVisible}
            onCancel={() => setViewModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setViewModalVisible(false)}>
                Đóng
              </Button>,
            ]}
            width={800}
          >
            {currentAchievement && (
              <div>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Họ tên học sinh">
                    <Text strong>{currentAchievement.citizenName}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="CMND/CCCD">
                    {currentAchievement.nationalId}
                  </Descriptions.Item>
                  <Descriptions.Item label="Năm học">
                    {currentAchievement.schoolYear || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trường">
                    {currentAchievement.schoolName || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lớp">
                    {currentAchievement.className || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thành tích">
                    {getAchievementTag(currentAchievement.achievement)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số vở thưởng">
                    {currentAchievement.notebooksRewarded || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Khen thưởng">
                    <Text strong>{currentAchievement.title || "N/A"}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mô tả">
                    {currentAchievement.description || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tiêu chí">
                    {currentAchievement.criteria || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái khen thưởng">
                    {getRewardStatusTag(currentAchievement.status)}
                  </Descriptions.Item>
                  {currentAchievement.status === "APPROVED" && (
                    <>
                      <Descriptions.Item label="Người duyệt">
                        {currentAchievement.reviewedBy?.fullName || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày duyệt">
                        {currentAchievement.approvedAt
                          ? dayjs(currentAchievement.approvedAt).format(
                              "DD/MM/YYYY HH:mm:ss"
                            )
                          : "N/A"}
                      </Descriptions.Item>
                    </>
                  )}
                  {currentAchievement.achievementDate && (
                    <Descriptions.Item label="Ngày đạt thành tích">
                      {currentAchievement.achievementDate}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Thời gian khai báo">
                    {currentAchievement.createdAt
                      ? dayjs(currentAchievement.createdAt).format(
                          "DD/MM/YYYY HH:mm:ss"
                        )
                      : "N/A"}
                  </Descriptions.Item>
                </Descriptions>

                {currentAchievement.evidenceImages &&
                  currentAchievement.evidenceImages.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <Text strong>Ảnh minh chứng:</Text>
                      <Image.PreviewGroup>
                        <Row gutter={16} style={{ marginTop: 8 }}>
                          {currentAchievement.evidenceImages.map(
                            (image, index) => (
                              <Col span={6} key={index}>
                                <Image
                                  src={image}
                                  alt={`Evidence ${index + 1}`}
                                  style={{
                                    width: "100%",
                                    height: "150px",
                                    objectFit: "cover",
                                  }}
                                />
                              </Col>
                            )
                          )}
                        </Row>
                      </Image.PreviewGroup>
                    </div>
                  )}
              </div>
            )}
          </Modal>
        </div>
      </Layout>
    );
  } catch (renderError) {
    console.error("StudentAchievements: Render error:", renderError);
    return (
      <Layout>
        <div style={{ padding: "24px" }}>
          <Card bordered={false}>
            <Text type="danger">
              Đã xảy ra lỗi khi hiển thị trang:{" "}
              {renderError?.message || "Unknown error"}
            </Text>
          </Card>
        </div>
      </Layout>
    );
  }
};

export default StudentAchievements;
