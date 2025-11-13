import React, { useState, useEffect } from "react";
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Typography,
  Space,
  Avatar,
  Divider,
  Spin,
  Alert,
  Button,
  message,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  ManOutlined,
  WomanOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import Layout from "../../components/Layout";
import { citizenService } from "../../services";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const MyHousehold = () => {
  const [loading, setLoading] = useState(true);
  const [household, setHousehold] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHouseholdData();
  }, []);

  const fetchHouseholdData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [householdData, citizenData] = await Promise.all([
        citizenService.getMyHousehold(),
        citizenService.getMe().catch(() => null),
      ]);

      setHousehold({
        ...householdData,
        currentCitizen: citizenData,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Không thể tải thông tin hộ khẩu";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" tip="Đang tải thông tin hộ khẩu..." />
        </div>
      </Layout>
    );

  if (error || !household)
    return (
      <Layout>
        <Alert
          message="Không tìm thấy thông tin hộ khẩu"
          description={
            error ||
            "Bạn chưa được gán vào hộ khẩu nào. Vui lòng liên hệ quản lý để được hỗ trợ."
          }
          type="warning"
          showIcon
        />
      </Layout>
    );

  const members = (household.members || []).map((m) => ({
    key: m._id,
    fullName: m.fullName,
    gender: m.gender === "MALE" ? "Nam" : m.gender === "FEMALE" ? "Nữ" : "Khác",
    dateOfBirth: m.dateOfBirth,
    idCard: m.nationalId,
    relationship: m.relationshipToHead || "N/A",
    phone: m.phone,
  }));

  const columns = [
    {
      title: "Họ và tên",
      dataIndex: "fullName",
      key: "fullName",
      render: (text, record) => (
        <Space>
          <Avatar
            icon={record.gender === "Nam" ? <ManOutlined /> : <WomanOutlined />}
            style={{
              backgroundColor: record.gender === "Nam" ? "#1890ff" : "#eb2f96",
            }}
          />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Ngày sinh",
      dataIndex: "dateOfBirth",
      key: "dateOfBirth",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      render: (gender) => (
        <Tag color={gender === "Nam" ? "blue" : "pink"}>{gender}</Tag>
      ),
    },
    {
      title: "CCCD/CMND",
      dataIndex: "idCard",
      key: "idCard",
      render: (text) => text || <Tag color="default">Chưa có</Tag>,
    },
    {
      title: "Quan hệ",
      dataIndex: "relationship",
      key: "relationship",
      render: (rel) => <Tag color="purple">{rel}</Tag>,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (text) => text || "-",
    },
  ];

  const currentCitizen = household.currentCitizen;

  return (
    <Layout>
      {/* Header gradient + Back button */}
      <Card
        bordered={false}
        style={{
          marginBottom: 24,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
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
              <TeamOutlined style={{ fontSize: 32, color: "#fff" }} />
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
                Hộ Khẩu Của Tôi
              </Title>
              <Text
                style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}
              >
                Thông tin hộ khẩu và danh sách thành viên
              </Text>
            </div>
          </div>

          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              style={{
                height: 40,
                borderRadius: "8px",
                color: "#fff",
                borderColor: "rgba(255, 255, 255, 0.5)",
                background: "rgba(255, 255, 255, 0.1)",
                transition: "all 0.3s ease",
              }}
              className="hover-back"
            >
              Quay lại
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
        }}
      >
        {/* Left content */}
        <div>
          {currentCitizen && (
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Thông tin cá nhân</span>
                </Space>
              }
              bordered={false}
              style={{
                marginBottom: 24,
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              className="hover-card"
            >
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Họ và tên">
                  <Text strong>{currentCitizen.fullName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Mã nhân khẩu">
                  <Tag color="blue">
                    {currentCitizen.code || currentCitizen._id}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày sinh">
                  {dayjs(currentCitizen.dateOfBirth).format("DD/MM/YYYY")}
                </Descriptions.Item>
                <Descriptions.Item label="Giới tính">
                  <Tag
                    color={
                      currentCitizen.gender === "MALE" ? "blue" : "pink"
                    }
                  >
                    {currentCitizen.gender === "MALE"
                      ? "Nam"
                      : currentCitizen.gender === "FEMALE"
                      ? "Nữ"
                      : "Khác"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="CCCD/CMND">
                  {currentCitizen.nationalId || (
                    <Tag color="default">Chưa có</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {currentCitizen.phone || <Tag color="default">Chưa có</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="Vai trò" span={2}>
                  <Tag color="gold">Chủ hộ</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>Danh sách thành viên ({members.length})</span>
              </Space>
            }
            bordered={false}
            style={{
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            className="hover-card"
          >
            <Table
              columns={columns}
              dataSource={members}
              pagination={false}
              scroll={{ x: 900 }}
              rowClassName={() => "household-row"}
            />
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card
            bordered={false}
            style={{
              borderRadius: "12px",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              position: "sticky",
              top: 24,
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            className="hover-card"
          >
            <Title level={5} style={{ marginBottom: 16 }}>
              <InfoCircleOutlined style={{ color: "#1890ff", marginRight: 8 }} />
              Hướng dẫn
            </Title>

            <p style={{ color: "#8c8c8c", fontSize: 14, margin: 0 }}>
              Kiểm tra kỹ thông tin cá nhân và thành viên hộ khẩu để đảm bảo dữ liệu chính xác.
            </p>

            <Divider style={{ margin: "16px 0" }} />

            <ul
              style={{
                paddingLeft: 18,
                color: "#8c8c8c",
                fontSize: 14,
                lineHeight: "1.7em",
                margin: 0,
              }}
            >
              <li>✓ Kiểm tra kỹ thông tin cá nhân và các thành viên trong hộ khẩu.</li>
              <li>✓ Nếu có sai sót, vui lòng liên hệ cán bộ quản lý để được hỗ trợ chỉnh sửa.</li>
              <li>✓ Dữ liệu được đồng bộ tự động từ hệ thống dân cư.</li>
            </ul>

            <Divider style={{ margin: "16px 0" }} />

            <div>
              <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>
                Lưu ý:
              </Title>
              <Alert
                message="Một số thông tin có thể bị ẩn nếu chưa được xác minh hoặc cập nhật trong hệ thống."
                type="info"
                showIcon
                style={{
                  fontSize: 13,
                  borderRadius: "6px",
                }}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Hover effects */}
      <style>{`
        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.12);
        }

        .hover-back:hover {
          background: rgba(255,255,255,0.2) !important;
          border-color: #fff !important;
          transform: scale(1.05);
        }

        .household-row:hover {
          background: #f0f5ff !important;
          transition: all 0.25s ease;
        }
      `}</style>
    </Layout>
  );
};

export default MyHousehold;
