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
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { rewardService } from "../../services";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const RewardEventSchedule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Các mẫu sự kiện thường niên
  const annualTemplates = [
    {
      id: "mid-autumn",
      name: "Trung Thu",
      description: "Phát quà Trung Thu cho trẻ em",
      defaultDate: "15/08 ÂL", // 15 tháng 8 Âm lịch
      type: "ANNUAL",
    },
    {
      id: "tet",
      name: "Tết Nguyên Đán",
      description: "Phát quà Tết cho các hộ gia đình",
      defaultDate: "28/12 ÂL", // 28 tháng Chạp
      type: "ANNUAL",
    },
    {
      id: "children-day",
      name: "Quốc tế Thiếu nhi",
      description: "Phát quà ngày Quốc tế Thiếu nhi 1/6",
      defaultDate: "01/06",
      type: "ANNUAL",
    },
  ];

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
    });
    setIsEditModalVisible(true);
  };

  const handleSaveTemplate = () => {
    form.validateFields().then((values) => {
      // TODO: Lưu template đã chỉnh sửa (có thể lưu vào localStorage hoặc backend)
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
            Kích hoạt các sự kiện thường niên để hệ thống tự động tạo sự kiện
            với cấu hình mặc định. Bạn có thể chỉnh sửa sau khi tạo.
          </Text>

          <Row gutter={[16, 16]}>
            {annualTemplates.map((template) => {
              const exists = isEventExists(template);
              const eventDate = calculateDate(template);

              return (
                <Col span={24} key={template.id}>
                  <Card
                    hoverable
                    style={{
                      border: exists ? "2px solid #52c41a" : "1px solid #d9d9d9",
                    }}
                  >
                    <Row justify="space-between" align="middle">
                      <Col flex="auto">
                        <Space direction="vertical" size="small">
                          <Space>
                            <Title level={4} style={{ margin: 0 }}>
                              {template.name}
                            </Title>
                            {exists && (
                              <Tag color="green" icon={<CheckCircleOutlined />}>
                                Đã kích hoạt năm {getCurrentYear()}
                              </Tag>
                            )}
                          </Space>
                          <Text type="secondary">{template.description}</Text>
                          <Descriptions size="small" column={3}>
                            <Descriptions.Item label="Ngày diễn ra">
                              {template.defaultDate}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày dự kiến">
                              {eventDate.format("DD/MM/YYYY")}
                            </Descriptions.Item>
                          </Descriptions>
                        </Space>
                      </Col>
                      <Col>
                        <Space>
                          <Button
                            icon={<EditOutlined />}
                            onClick={() => handleEditTemplate(template)}
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            type="primary"
                            icon={<CalendarOutlined />}
                            onClick={() => handleActivate(template)}
                            disabled={exists || loading}
                            loading={loading}
                          >
                            {exists ? "Đã kích hoạt" : "Kích hoạt năm nay"}
                          </Button>
                        </Space>
                      </Col>
                    </Row>
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
          </Form>
        )}
      </Modal>
    </Layout>
  );
};

export default RewardEventSchedule;