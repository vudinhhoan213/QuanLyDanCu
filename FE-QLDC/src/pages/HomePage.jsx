import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Typography,
  Row,
  Col,
  Layout,
  Space,
  Divider,
} from "antd";
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  SafetyOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FacebookOutlined,
  TwitterOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

const { Title, Paragraph, Text } = Typography;
const { Header, Content, Footer } = Layout;

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <HomeOutlined style={{ fontSize: 48, color: "#1890ff" }} />,
      title: "Quản lý hộ khẩu",
      description:
        "Theo dõi và quản lý thông tin hộ khẩu, nhân khẩu một cách dễ dàng",
    },
    {
      icon: <UserOutlined style={{ fontSize: 48, color: "#52c41a" }} />,
      title: "Quản lý công dân",
      description: "Cập nhật thông tin công dân, tạm trú, tạm vắng",
    },
    {
      icon: <TeamOutlined style={{ fontSize: 48, color: "#722ed1" }} />,
      title: "Yêu cầu chỉnh sửa",
      description: "Gửi và theo dõi các yêu cầu chỉnh sửa thông tin",
    },
    {
      icon: <TrophyOutlined style={{ fontSize: 48, color: "#faad14" }} />,
      title: "Khen thưởng",
      description: "Quản lý khen thưởng cho học sinh và sự kiện đặc biệt",
    },
  ];

  const handleGetStarted = () => {
    if (user) {
      const isLeader = user.role === "TO_TRUONG";
      navigate(isLeader ? "/leader/dashboard" : "/citizen/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Header */}
      <Header
        style={{
          position: "fixed",
          zIndex: 1000,
          width: "100%",
          background: "rgba(0, 21, 41, 0.95)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          padding: "0 50px",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space size="middle">
            <SafetyOutlined style={{ fontSize: 28, color: "#1890ff" }} />
            <Title
              level={4}
              style={{ color: "white", margin: 0, fontWeight: "bold" }}
            >
              QUẢN LÝ DÂN CƯ
            </Title>
          </Space>
          <Space size="large">
            <Button
              type="link"
              style={{ color: "white" }}
              onClick={() => navigate("/")}
            >
              Trang chủ
            </Button>
            <Button type="link" style={{ color: "white" }}>
              Giới thiệu
            </Button>
            <Button type="link" style={{ color: "white" }}>
              Liên hệ
            </Button>
            {user ? (
              <Button type="primary" onClick={handleGetStarted}>
                Vào hệ thống
              </Button>
            ) : (
              <Button type="primary" onClick={() => navigate("/login")}>
                Đăng nhập
              </Button>
            )}
          </Space>
        </div>
      </Header>

      {/* Hero Section */}
      <Content style={{ marginTop: 64 }}>
        <div
          style={{
            minHeight: "calc(100vh - 64px)",
            backgroundImage:
              "url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7g14K2Main1VUMYyLhXKTfK3x8dq8ZnuI7A&s)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            position: "relative",
          }}
        >
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(0, 21, 41, 0.88) 0%, rgba(24, 144, 255, 0.75) 100%)",
            }}
          />

          {/* Hero Content */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              padding: "100px 50px 80px",
              maxWidth: "1400px",
              margin: "0 auto",
            }}
          >
            {/* Hero Title */}
            <div style={{ textAlign: "center", marginBottom: 80 }}>
              <SafetyOutlined
                style={{
                  fontSize: 120,
                  color: "white",
                  marginBottom: 24,
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
              <Title
                level={1}
                style={{
                  color: "white",
                  fontSize: 56,
                  fontWeight: "bold",
                  marginBottom: 16,
                  textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                HỆ THỐNG QUẢN LÝ DÂN CƯ
              </Title>
              <Paragraph
                style={{
                  color: "white",
                  fontSize: 20,
                  maxWidth: 700,
                  margin: "0 auto 40px",
                  lineHeight: 1.8,
                  textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }}
              >
                Giải pháp hiện đại, toàn diện cho quản lý hộ khẩu, nhân khẩu và
                khen thưởng. Mang đến sự tiện lợi và hiệu quả cho cộng đồng.
              </Paragraph>
              <Space size="large">
                <Button
                  type="primary"
                  size="large"
                  onClick={handleGetStarted}
                  style={{
                    height: 50,
                    padding: "0 40px",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  {user ? "Vào Hệ Thống" : "Bắt Đầu Ngay"}
                </Button>
                <Button
                  size="large"
                  style={{
                    height: 50,
                    padding: "0 40px",
                    fontSize: 16,
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    borderColor: "white",
                  }}
                >
                  Tìm Hiểu Thêm
                </Button>
              </Space>
            </div>

            {/* Features Section */}
            <Row gutter={[24, 24]} style={{ marginBottom: 80 }}>
              {features.map((feature, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                  <Card
                    hoverable
                    style={{
                      textAlign: "center",
                      height: "100%",
                      background: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(10px)",
                      border: "none",
                      borderRadius: 12,
                      transition: "all 0.3s ease",
                    }}
                    bodyStyle={{ padding: "32px 24px" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-8px)";
                      e.currentTarget.style.boxShadow =
                        "0 12px 24px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.1)";
                    }}
                  >
                    <div style={{ marginBottom: 16 }}>{feature.icon}</div>
                    <Title level={4} style={{ marginBottom: 12 }}>
                      {feature.title}
                    </Title>
                    <Paragraph style={{ color: "#666", marginBottom: 0 }}>
                      {feature.description}
                    </Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Stats Section */}
            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <Card
                  style={{
                    textAlign: "center",
                    background: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: 12,
                  }}
                  bodyStyle={{ padding: "40px 24px" }}
                >
                  <Title
                    level={2}
                    style={{ color: "white", marginBottom: 8, fontSize: 48 }}
                  >
                    1000+
                  </Title>
                  <Text style={{ color: "white", fontSize: 18 }}>
                    Hộ gia đình
                  </Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  style={{
                    textAlign: "center",
                    background: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: 12,
                  }}
                  bodyStyle={{ padding: "40px 24px" }}
                >
                  <Title
                    level={2}
                    style={{ color: "white", marginBottom: 8, fontSize: 48 }}
                  >
                    5000+
                  </Title>
                  <Text style={{ color: "white", fontSize: 18 }}>Công dân</Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  style={{
                    textAlign: "center",
                    background: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: 12,
                  }}
                  bodyStyle={{ padding: "40px 24px" }}
                >
                  <Title
                    level={2}
                    style={{ color: "white", marginBottom: 8, fontSize: 48 }}
                  >
                    24/7
                  </Title>
                  <Text style={{ color: "white", fontSize: 18 }}>Hỗ trợ</Text>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </Content>

      {/* Footer */}
      <Footer style={{ background: "#001529", padding: "48px 50px 24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <Row gutter={[48, 32]}>
            <Col xs={24} md={8}>
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Space size="middle">
                  <SafetyOutlined style={{ fontSize: 32, color: "#1890ff" }} />
                  <Title level={4} style={{ color: "white", margin: 0 }}>
                    QUẢN LÝ DÂN CƯ
                  </Title>
                </Space>
                <Paragraph
                  style={{
                    color: "rgba(255, 255, 255, 0.65)",
                    marginBottom: 0,
                  }}
                >
                  Hệ thống quản lý dân cư hiện đại, giúp tổ chức và quản lý
                  thông tin hộ khẩu, nhân khẩu một cách hiệu quả và chính xác.
                </Paragraph>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Title level={5} style={{ color: "white", marginBottom: 16 }}>
                Liên Hệ
              </Title>
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Space>
                  <EnvironmentOutlined
                    style={{ color: "#1890ff", fontSize: 16 }}
                  />
                  <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                    Phường 1, Quận 1, TP.HCM
                  </Text>
                </Space>
                <Space>
                  <PhoneOutlined style={{ color: "#1890ff", fontSize: 16 }} />
                  <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                    0123 456 789
                  </Text>
                </Space>
                <Space>
                  <MailOutlined style={{ color: "#1890ff", fontSize: 16 }} />
                  <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                    contact@qldc.vn
                  </Text>
                </Space>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Title level={5} style={{ color: "white", marginBottom: 16 }}>
                Theo Dõi Chúng Tôi
              </Title>
              <Space size="large">
                <FacebookOutlined
                  style={{ fontSize: 24, color: "#1890ff", cursor: "pointer" }}
                />
                <TwitterOutlined
                  style={{ fontSize: 24, color: "#1890ff", cursor: "pointer" }}
                />
                <LinkedinOutlined
                  style={{ fontSize: 24, color: "#1890ff", cursor: "pointer" }}
                />
              </Space>
            </Col>
          </Row>
          <Divider
            style={{
              borderColor: "rgba(255, 255, 255, 0.2)",
              margin: "32px 0 24px",
            }}
          />
          <div style={{ textAlign: "center" }}>
            <Text style={{ color: "rgba(255, 255, 255, 0.45)" }}>
              © 2024 Hệ Thống Quản Lý Dân Cư. All rights reserved.
            </Text>
          </div>
        </div>
      </Footer>
    </Layout>
  );
};

export default HomePage;
