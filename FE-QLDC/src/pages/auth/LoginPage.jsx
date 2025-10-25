import { useState } from "react";
import { Form, Input, Button, Card, Typography, message, Alert } from "antd";
import {
  UserOutlined,
  LockOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const user = await login({
        identifier: values.username,
        password: values.password,
      });

      message.success("Đăng nhập thành công!");

      // Redirect dựa vào role
      const isLeader = user.role === "TO_TRUONG";
      navigate(isLeader ? "/leader/dashboard" : "/citizen/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      const errorData = error?.response?.data;
      const errorMsg =
        errorData?.message || "Đăng nhập thất bại. Vui lòng thử lại!";
      const errorDetail = errorData?.detail;

      if (errorDetail) {
        // Hiển thị message với detail
        message.error({
          content: (
            <div>
              <div>{errorMsg}</div>
              <div style={{ fontSize: "13px", marginTop: 8, color: "#999" }}>
                {errorDetail}
              </div>
            </div>
          ),
          duration: 6,
        });
      } else {
        message.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "url(https://media.istockphoto.com/id/1320991884/vi/anh/nh%C3%ACn-t%E1%BB%AB-tr%C3%AAn-kh%C3%B4ng-c%E1%BB%A7a-residential-distratic-t%E1%BA%A1i-major-mackenzie-dr-v%C3%A0-islinton-ave-ng%C3%B4i-nh%C3%A0.jpg?s=612x612&w=0&k=20&c=ozR2EvckMfAj714b261rhjXtA_NQwfMt-wsL0_4Tpgg=)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      />

      {/* Login Card */}
      <Card
        style={{
          width: 450,
          zIndex: 1,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Quản Lý Dân Cư
          </Title>
          <Text type="secondary">Đăng nhập vào hệ thống</Text>
        </div>

        {/* Thông báo đăng nhập */}
        <Alert
          message={
            <span>
              <InfoCircleOutlined /> Thông tin đăng nhập
            </span>
          }
          description={
            <div style={{ fontSize: "13px" }}>
              <div style={{ color: "#ff4d4f" }}>
                ⚠️ <strong>Lưu ý:</strong> Chỉ chủ hộ mới có tài khoản đăng nhập
              </div>
            </div>
          }
          type="info"
          showIcon={false}
          style={{ marginBottom: 24, textAlign: "left" }}
        />

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tài khoản!",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Tên đăng nhập hoặc Email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mật khẩu!",
              },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 45 }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Hệ thống quản lý dân cư tổ dân phố
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
