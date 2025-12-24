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
  PhoneOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import Layout from "../../components/Layout";
import { citizenService, householdService } from "../../services";
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

      const response = await citizenService.getMyHousehold();

      // Handle both response formats
      const householdData = response.household || response;
      const membersData = response.members || response.members || [];

      setHousehold({
        ...householdData,
        members: membersData,
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
          background:
            "linear-gradient(150deg, #092747ff 0%, #8dc7ff 30%, #2f6fbd 55%, #0085ff 80%, #00b89a 100%)",
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
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
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
      <div>
        {household && (
          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>Thông tin hộ khẩu</span>
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
              <Descriptions.Item label="Mã hộ khẩu">
                <Tag color="blue">{household.code}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Chủ hộ">
                <Text strong>{household.headName || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                <Text>{household.phone || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số nhân khẩu">
                <Tag color="cyan">{household.members?.length || 0} người</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                <Text>
                  {household.address
                    ? `${household.address.street || ""}, ${
                        household.address.ward || ""
                      }, ${household.address.district || ""}, ${
                        household.address.city || ""
                      }`
                    : "N/A"}
                </Text>
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
