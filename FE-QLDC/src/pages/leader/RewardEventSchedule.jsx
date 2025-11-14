import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  message,
  Switch,
  Descriptions,
  Tag,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Input,
  Badge,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { rewardService } from "../../services";
import { ANNUAL_OCCASIONS } from "../../constants/annualOccasions";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const RewardEventSchedule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [templateOverrides, setTemplateOverrides] = useState(() => {
    // Load từ localStorage nếu có
    try {
      const saved = localStorage.getItem("annualOccasionOverrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sử dụng danh sách dịp cố định từ constants và merge với overrides
  const annualTemplates = ANNUAL_OCCASIONS.map((template) => {
    const override = templateOverrides[template.id];
    return override ? { ...template, ...override } : template;
  });

  useEffect(() => {
    fetchExistingEvents();
  }, []);

  const fetchExistingEvents = async () => {
    try {
      const response = await rewardService.events.getAll({
        type: "ANNUAL",
        limit: 100,
      });
      const eventList = response.docs || [];
      setEvents(eventList);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const getCurrentYear = () => {
    return dayjs().year();
  };

  const calculateDate = (template) => {
    const currentYear = getCurrentYear();
    
    if (template.defaultDate.includes("ÂL")) {
      // Xử lý ngày âm lịch - đơn giản hóa, có thể cần thư viện chuyển đổi
      // Ví dụ: 15/08 ÂL -> tính toán ngày dương lịch tương ứng
      // Tạm thời dùng ngày ước tính
      const month = parseInt(template.defaultDate.split("/")[0]);
      const day = parseInt(template.defaultDate.split("/")[1]);
      // Ước tính: thêm khoảng 1 tháng cho âm lịch
      return dayjs().month(month + 1).date(day);
    } else {
      // Ngày dương lịch
      const [day, month] = template.defaultDate.split("/").map(Number);
      return dayjs().year(currentYear).month(month - 1).date(day);
    }
  };

  const handleActivate = async (template) => {
    try {
      setLoading(true);

      const eventDate = calculateDate(template);
      const startDate = eventDate.subtract(7, "days"); // Mở đăng ký trước 7 ngày
      const endDate = eventDate.subtract(1, "day"); // Đóng đăng ký trước 1 ngày

      const eventData = {
        name: `${template.name} ${getCurrentYear()}`,
        type: template.type,
        description: template.description,
        rewardDescription: template.rewardDescription || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: "OPEN",
      };

      await rewardService.events.create(eventData);
      message.success(`Đã tạo sự kiện "${template.name} ${getCurrentYear()}"`);
      fetchExistingEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      message.error(
        error.response?.data?.message || "Không thể tạo sự kiện. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      name: template.name,
      description: template.description,
      rewardDescription: template.rewardDescription || "",
    });
    setIsEditModalVisible(true);
  };

  const handleSaveTemplate = () => {
    form.validateFields().then((values) => {
      if (!editingTemplate) return;

      // Lưu override vào localStorage
      const newOverrides = {
        ...templateOverrides,
        [editingTemplate.id]: {
          name: values.name,
          description: values.description,
          rewardDescription: values.rewardDescription || undefined,
        },
      };
      setTemplateOverrides(newOverrides);
      localStorage.setItem("annualOccasionOverrides", JSON.stringify(newOverrides));

      message.success("Đã lưu cấu hình mẫu");
      setIsEditModalVisible(false);
      setEditingTemplate(null);
      form.resetFields();
    });
  };

  const isEventExists = (template) => {
    const eventName = `${template.name} ${getCurrentYear()}`;
    return events.some((e) => e.name === eventName);
  };

  return (
    <Layout>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate("/leader/reward-events")}
                >
                  Quay lại
                </Button>
                <Title level={2} style={{ margin: 0 }}>
                  <CalendarOutlined /> Lịch Tự động Sự kiện Thường niên
                </Title>
              </Space>
            </Col>
          </Row>

          <Text type="secondary">
            Danh sách các dịp cố định trong năm. Kích hoạt các dịp để hệ thống tự động tạo sự kiện
            với cấu hình mặc định. Bạn có thể chỉnh sửa sau khi tạo.
          </Text>

          <Row gutter={[16, 16]}>
            {annualTemplates.map((template) => {
              const exists = isEventExists(template);
              const eventDate = calculateDate(template);
              const targetInfo = template.targetAge
                ? `Trẻ em ${template.targetAge.min}-${template.targetAge.max} tuổi`
                : template.targetGender === "FEMALE"
                ? "Phụ nữ"
                : "Tất cả mọi người";

              return (
                <Col xs={24} sm={24} md={12} lg={8} key={template.id}>
                  <Card
                    hoverable
                    style={{
                      border: exists ? "2px solid #52c41a" : "1px solid #d9d9d9",
                      height: "100%",
                    }}
                    cover={
                      <div
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          fontSize: "48px",
                          backgroundColor: exists ? "#f6ffed" : "#fafafa",
                        }}
                      >
                        {template.icon || <GiftOutlined />}
                      </div>
                    }
                  >
                    <Space direction="vertical" size="small" style={{ width: "100%" }}>
                      <Row justify="space-between" align="middle">
                        <Col flex="auto">
                          <Title level={4} style={{ margin: 0 }}>
                            {template.name}
                          </Title>
                        </Col>
                        {exists && (
                          <Col>
                            <Tag color="green" icon={<CheckCircleOutlined />}>
                              Đã kích hoạt
                            </Tag>
                          </Col>
                        )}
                      </Row>
                      <Text type="secondary" style={{ fontSize: "13px" }}>
                        {template.description}
                      </Text>
                      <Descriptions size="small" column={1} bordered>
                        <Descriptions.Item label="Ngày diễn ra">
                          <Text strong>{template.defaultDate}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày dự kiến">
                          <Text strong style={{ color: "#1890ff" }}>
                            {eventDate.format("DD/MM/YYYY")}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Đối tượng">
                          <Text>{targetInfo}</Text>
                        </Descriptions.Item>
                        {template.rewardDescription && (
                          <Descriptions.Item label="Phần thưởng">
                            <Text strong style={{ color: "#1890ff" }}>
                              {template.rewardDescription}
                            </Text>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                      <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => handleEditTemplate(template)}
                          size="small"
                        >
                          Chỉnh sửa
                        </Button>
                        <Button
                          type="primary"
                          icon={<CalendarOutlined />}
                          onClick={() => handleActivate(template)}
                          disabled={exists || loading}
                          loading={loading}
                          size="small"
                        >
                          {exists ? "Đã kích hoạt" : "Kích hoạt"}
                        </Button>
                      </Space>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Space>
      </Card>

      {/* Edit Template Modal */}
      <Modal
        title="Chỉnh sửa Mẫu Sự kiện"
        open={isEditModalVisible}
        onOk={handleSaveTemplate}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingTemplate(null);
          form.resetFields();
        }}
        okText="Lưu"
        cancelText="Hủy"
      >
        {editingTemplate && (
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Tên sự kiện"
              rules={[{ required: true, message: "Vui lòng nhập tên" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item
              name="rewardDescription"
              label="Phần thưởng"
              tooltip="Mô tả phần thưởng sẽ được áp dụng khi kích hoạt sự kiện (ví dụ: 200.000 VNĐ tiền mặt, 1 bộ quà Tết...)"
            >
              <Input.TextArea
                rows={3}
                placeholder="Ví dụ: 200.000 VNĐ tiền mặt, 1 bộ quà Tết (bánh kẹo, trà, rượu)..."
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Layout>
  );
};

export default RewardEventSchedule;