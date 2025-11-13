import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Space,
  message,
  Spin,
  Row,
  Col,
  Divider,
  Alert,
} from "antd";
import {
  FileTextOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  InfoCircleOutlined,
  FileDoneOutlined,
  FileProtectOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { editRequestService } from "../../services";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SubmitEditRequest = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const requestTypes = [
    { value: "ADD_MEMBER", label: "Thêm nhân khẩu", icon: <EditOutlined /> },
    { value: "EDIT_INFO", label: "Chỉnh sửa thông tin", icon: <EditOutlined /> },
    { value: "REMOVE_MEMBER", label: "Xóa nhân khẩu", icon: <EditOutlined /> },
    { value: "TEMP_ABSENCE", label: "Đăng ký tạm vắng", icon: <EditOutlined /> },
    { value: "TEMP_RESIDENCE", label: "Đăng ký tạm trú", icon: <EditOutlined /> },
    { value: "MOVE_OUT", label: "Chuyển đi", icon: <EditOutlined /> },
    { value: "MOVE_IN", label: "Chuyển đến", icon: <EditOutlined /> },
    { value: "OTHER", label: "Khác", icon: <InfoCircleOutlined /> },
  ];

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const requestData = {
        requestType: values.requestType,
        title: values.title,
        description: values.description,
        proposedChanges: { details: values.details, ...values },
      };
      await editRequestService.create(requestData);
      message.success("✅ Gửi yêu cầu thành công!");
      form.resetFields();
      navigate("/citizen/my-requests");
    } catch (error) {
      console.error("Error submitting request:", error);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div
        style={{
          padding: "24px",
          background: "#f5f5f5",
          minHeight: "100vh",
          transition: "all 0.3s ease",
        }}
      >
        {/* Header Gradient */}
        <Card
          bordered={false}
          style={{
            marginBottom: 24,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
          }}
          bodyStyle={{ padding: "32px" }}
          hoverable
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(118, 75, 162, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
          }}
        >
          <Row align="middle" justify="space-between">
            <Col xs={24} md={18}>
              <Space size="large" align="center" wrap>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 32, color: "#fff" }} />
                </div>
                <div>
                  <Title
                    level={2}
                    style={{ color: "#fff", margin: 0, marginBottom: 8 }}
                  >
                    Gửi Yêu Cầu Chỉnh Sửa
                  </Title>
                  <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
                    Gửi yêu cầu chỉnh sửa thông tin hộ khẩu/nhân khẩu
                  </Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} md={6} style={{ textAlign: "right", marginTop: 16 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/citizen/my-requests")}
                style={{
                  height: 40,
                  borderRadius: "8px",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.1)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
              >
                Quay lại
              </Button>
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          {/* Main Form */}
          <Col xs={24} lg={16}>
            <Card
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              hoverable
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}
              bodyStyle={{ padding: "32px" }}
            >
              <Spin spinning={loading}>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  requiredMark={false}
                  size="large"
                >
                  {/* --- LOẠI YÊU CẦU --- */}
                  <Form.Item
                    name="requestType"
                    label={
                      <Space>
                        <EditOutlined style={{ color: "#1890ff" }} />
                        <Text strong style={{ fontSize: 15 }}>
                          Loại yêu cầu
                        </Text>
                      </Space>
                    }
                    rules={[{ required: true, message: "Vui lòng chọn loại yêu cầu" }]}
                  >
                    <Select placeholder="Chọn loại yêu cầu" style={{ borderRadius: "8px" }}>
                      {requestTypes.map((type) => (
                        <Option key={type.value} value={type.value}>
                          <Space>
                            {type.icon} {type.label}
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {/* --- TIÊU ĐỀ --- */}
                  <Form.Item
                    name="title"
                    label={
                      <Space>
                        <FileTextOutlined style={{ color: "#f5c518" }} /> {/* vàng */}
                        <Text strong style={{ fontSize: 15 }}>
                          Tiêu đề
                        </Text>
                      </Space>
                    }
                    rules={[
                      { required: true, message: "Vui lòng nhập tiêu đề" },
                      { min: 10, message: "Tiêu đề phải có ít nhất 10 ký tự" },
                    ]}
                  >
                    <Input placeholder="Nhập tiêu đề" style={{ borderRadius: "8px" }} />
                  </Form.Item>

                  {/* --- MÔ TẢ --- */}
                  <Form.Item
                    name="description"
                    label={
                      <Space>
                        <FileDoneOutlined style={{ color: "#722ed1" }} /> {/* tím */}
                        <Text strong style={{ fontSize: 15 }}>
                          Mô tả
                        </Text>
                      </Space>
                    }
                    rules={[
                      { required: true, message: "Vui lòng nhập mô tả" },
                      { min: 20, message: "Mô tả phải có ít nhất 20 ký tự" },
                      { max: 1000, message: "Mô tả không được quá 1000 ký tự" },
                    ]}
                  >
                    <TextArea
                      rows={6}
                      placeholder="Mô tả chi tiết nội dung"
                      showCount
                      maxLength={1000}
                      style={{ borderRadius: "8px" }}
                    />
                  </Form.Item>

                  {/* --- NỘI DUNG CỤ THỂ --- */}
                  <Form.Item
                    name="details"
                    label={
                      <Space>
                        <FileProtectOutlined style={{ color: "#52c41a" }} /> {/* xanh lá */}
                        <Text strong style={{ fontSize: 15 }}>
                          Nội dung cụ thể (không bắt buộc)
                        </Text>
                      </Space>
                    }
                  >
                    <TextArea
                      rows={4}
                      placeholder="Thông tin chi tiết"
                      showCount
                      maxLength={500}
                      style={{ borderRadius: "8px" }}
                    />
                  </Form.Item>

                  <Divider />

                  {/* --- NÚT GỬI --- */}
                  <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                    <Space size="middle">
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SendOutlined />}
                        loading={loading}
                        size="large"
                        style={{
                          height: 48,
                          borderRadius: "8px",
                          fontSize: 16,
                          fontWeight: 600,
                          minWidth: 150,
                          boxShadow: "0 4px 12px rgba(24,144,255,0.3)",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 16px rgba(24,144,255,0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(24,144,255,0.3)";
                        }}
                      >
                        Gửi yêu cầu
                      </Button>
                      <Button
                        size="large"
                        onClick={() => navigate("/citizen/my-requests")}
                        style={{
                          height: 48,
                          borderRadius: "8px",
                          fontSize: 16,
                          minWidth: 120,
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f0f0f0";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        Hủy
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Spin>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                position: "sticky",
                top: 24,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              hoverable
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div>
                  <Title level={5} style={{ marginBottom: 16 }}>
                    <InfoCircleOutlined style={{ color: "#1890ff" }} /> Hướng dẫn
                  </Title>
                  <Paragraph style={{ color: "#8c8c8c", fontSize: 14, margin: 0 }}>
                    Điền đầy đủ thông tin để gửi yêu cầu chỉnh sửa.
                  </Paragraph>
                </div>

                <Divider />

                <div>
                  <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>
                    Yêu cầu:
                  </Title>
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    <Text style={{ fontSize: 13, color: "#595959" }}>
                      ✓ Chọn loại yêu cầu
                    </Text>
                    <Text style={{ fontSize: 13, color: "#595959" }}>
                      ✓ Nhập tiêu đề
                    </Text>
                    <Text style={{ fontSize: 13, color: "#595959" }}>
                      ✓ Mô tả chi tiết (tối thiểu 20 ký tự)
                    </Text>
                  </Space>
                </div>

                <Divider />

                <div>
                  <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>
                    Lưu ý:
                  </Title>
                  <Alert
                    message="Yêu cầu sẽ được gửi đến Tổ trưởng để xem xét và duyệt. Vui lòng đảm bảo thông tin chính xác."
                    type="info"
                    showIcon
                    style={{ fontSize: 13, borderRadius: "6px" }}
                  />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

export default SubmitEditRequest;
