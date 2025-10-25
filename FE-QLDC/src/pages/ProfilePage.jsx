import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  message,
  Avatar,
  Upload,
  Divider,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  CameraOutlined,
  LockOutlined,
} from "@ant-design/icons";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const { Title, Text } = Typography;

const ProfilePage = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Updated profile:", values);
      message.success("Cập nhật thông tin thành công!");
    } catch (error) {
      message.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    setPasswordLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Changed password");
      message.success("Đổi mật khẩu thành công!");
      passwordForm.resetFields();
    } catch (error) {
      message.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUploadAvatar = (info) => {
    if (info.file.status === "done") {
      message.success("Cập nhật ảnh đại diện thành công!");
    } else if (info.file.status === "error") {
      message.error("Upload thất bại");
    }
  };

  return (
    <Layout>
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            <UserOutlined /> Thông Tin Cá Nhân
          </Title>
          <Text type="secondary">Quản lý thông tin tài khoản của bạn</Text>
        </div>

        {/* Avatar Section */}
        <Card bordered={false} style={{ marginBottom: 16 }}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Upload
              name="avatar"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleUploadAvatar}
            >
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  size={120}
                  icon={<UserOutlined />}
                  style={{ cursor: "pointer" }}
                />
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined />}
                  size="small"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                  }}
                />
              </div>
            </Upload>
            <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
              {user?.fullName || user?.username}
            </Title>
            <Text type="secondary">
              {user?.role === "TO_TRUONG" ? "Tổ trưởng" : "Công dân"}
            </Text>
          </div>
        </Card>

        {/* Profile Form */}
        <Card
          title="Thông tin cá nhân"
          bordered={false}
          style={{ marginBottom: 16 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
            initialValues={{
              username: user?.username,
              fullName: user?.fullName,
              email: "user@example.com",
              phone: "0123456789",
            }}
          >
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[
                { required: true, message: "Vui lòng nhập tên đăng nhập" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                size="large"
                disabled
                placeholder="Tên đăng nhập"
              />
            </Form.Item>

            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input
                prefix={<UserOutlined />}
                size="large"
                placeholder="Họ và tên đầy đủ"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { type: "email", message: "Email không hợp lệ" },
                { required: true, message: "Vui lòng nhập email" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                size="large"
                placeholder="Email"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Số điện thoại không hợp lệ",
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                size="large"
                placeholder="Số điện thoại"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                loading={loading}
              >
                Lưu thay đổi
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Change Password Form */}
        <Card
          title={
            <Space>
              <LockOutlined />
              <span>Đổi mật khẩu</span>
            </Space>
          }
          bordered={false}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="currentPassword"
              label="Mật khẩu hiện tại"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                size="large"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                size="large"
                placeholder="Nhập mật khẩu mới"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu xác nhận không khớp!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                size="large"
                placeholder="Nhập lại mật khẩu mới"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                loading={passwordLoading}
              >
                Đổi mật khẩu
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfilePage;
