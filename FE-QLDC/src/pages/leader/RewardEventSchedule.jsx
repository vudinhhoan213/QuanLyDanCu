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
  Table,
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  GiftOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { rewardService } from "../../services";
import { ANNUAL_OCCASIONS } from "../../constants/annualOccasions";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const RewardEventSchedule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
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

  const getEventName = (template) => {
    const name = template.name || "";
    const hasYear = /\b(19|20)\d{2}\b/.test(name);
    return hasYear ? name : `${name} ${getCurrentYear()}`;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      OPEN: { color: "green", text: "Đang phát" },
      CLOSED: { color: "orange", text: "Đóng" },
      EXPIRED: { color: "red", text: "Hết hạn" },
      ENDED: { color: "default", text: "Đã kết thúc" },
      PLANNED: { color: "blue", text: "Đã lên kế hoạch" },
      ONGOING: { color: "green", text: "Đang diễn ra" },
      COMPLETED: { color: "default", text: "Hoàn thành" },
    };
    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getTypeText = (type) => {
    const typeMap = {
      ANNUAL: "Thường niên",
      SPECIAL: "Đặc biệt",
      SPECIAL_OCCASION: "Dịp đặc biệt",
      SCHOOL_YEAR: "Năm học",
    };
    return typeMap[type] || type;
  };

  const calculateDate = (template) => {
    const currentYear = getCurrentYear();

    if (template.eventDateOverride) {
      return dayjs(template.eventDateOverride);
    }

    const isLunar =
      template.defaultDate.includes("ÂL") ||
      template.defaultDate.includes("A,L");
    if (isLunar) {
      // Xử lý ngày âm lịch - đơn giản hóa, có thể cần thư viện chuyển đổi
      // Ví dụ: 15/08 ÂL -> tính toán ngày dương lịch tương ứng
      // Tạm thời dùng ngày ước tính
      const month = parseInt(template.defaultDate.split("/")[0]);
      const day = parseInt(template.defaultDate.split("/")[1]);
      // Ước tính: thêm khoảng 1 tháng cho âm lịch
      return dayjs()
        .month(month + 1)
        .date(day);
    } else {
      // Ngày dương lịch
      const [day, month] = template.defaultDate.split("/").map(Number);
      return dayjs()
        .year(currentYear)
        .month(month - 1)
        .date(day);
    }
  };

  const handleActivate = async (template) => {
    try {
      setLoading(true);

      const eventDate = calculateDate(template);
      const startOverride = template.startDateOverride
        ? dayjs(template.startDateOverride)
        : null;
      const endOverride = template.endDateOverride
        ? dayjs(template.endDateOverride)
        : null;
      const startDate = startOverride || eventDate.subtract(1, "day");
      const endDate = endOverride || eventDate.add(3, "days");
      const mainDate = startOverride || eventDate;

      // Tạo sự kiện với thời gian phát quà (không có đăng ký)
      const eventData = {
        name: getEventName(template),
        type: template.type,
        description: template.description,
        rewardDescription: template.rewardDescription || undefined,
        date: mainDate.toISOString(), // Ngày phát quà chính
        startDate: startDate.toISOString(), // Bắt đầu phát quà (có thể trước 1 ngày)
        endDate: endDate.toISOString(), // Kết thúc phát quà (có thể sau 3 ngày)
        status: "OPEN",
        budget: template.budget || undefined,
      };

      const createdEvent = await rewardService.events.create(eventData);
      message.success(`Đã tạo sự kiện "${eventData.name}"`);

      // Nếu có targetAge, tự động tạo danh sách phân phối
      if (template.targetAge) {
        try {
          message.loading({
            content: "Đang tạo danh sách phân phối quà...",
            key: "generate",
            duration: 0,
          });

          await rewardService.distributions.generateFromAgeRange(
            createdEvent._id,
            template.targetAge.min || 0,
            template.targetAge.max || 18,
            {
              quantity: 1,
              unitValue: template.budget || 50000,
            },
            false
          );

          message.success({
            content: "Đã tạo danh sách phân phối quà tự động!",
            key: "generate",
          });
        } catch (genError) {
          console.error("Error generating distributions:", genError);
          message.warning({
            content:
              "Đã tạo sự kiện nhưng không thể tự động tạo danh sách. Bạn có thể tạo thủ công sau.",
            key: "generate",
          });
        }
      }

      fetchExistingEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      message.error(
        error.response?.data?.message ||
          "Không thể tạo sự kiện. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    const startOverride = template.startDateOverride
      ? dayjs(template.startDateOverride)
      : null;
    const endOverride = template.endDateOverride
      ? dayjs(template.endDateOverride)
      : null;
    editForm.setFieldsValue({
      name: template.name,
      description: template.description,
      rewardDescription: template.rewardDescription || "",
      budget: template.budget || undefined,
      dateRangeOverride:
        startOverride && endOverride ? [startOverride, endOverride] : undefined,
      eventDateOverride: template.eventDateOverride
        ? dayjs(template.eventDateOverride)
        : undefined,
      targetAgeMin: template.targetAge?.min,
      targetAgeMax: template.targetAge?.max,
      targetGender: template.targetGender || "ALL",
    });
    setIsEditModalVisible(true);
  };

  const handleSaveTemplate = () => {
    editForm.validateFields().then((values) => {
      if (!editingTemplate) return;

      const startOverride = values.dateRangeOverride?.[0]
        ? values.dateRangeOverride[0].toISOString()
        : undefined;
      const endOverride = values.dateRangeOverride?.[1]
        ? values.dateRangeOverride[1].toISOString()
        : undefined;

      const eventDateOverride = values.eventDateOverride
        ? values.eventDateOverride.toISOString()
        : undefined;

      const hasAgeMin =
        values.targetAgeMin !== undefined && values.targetAgeMin !== null;
      const hasAgeMax =
        values.targetAgeMax !== undefined && values.targetAgeMax !== null;
      if (hasAgeMin && hasAgeMax && values.targetAgeMin > values.targetAgeMax) {
        message.error("Tuổi tối thiểu không được lớn hơn tuổi tối đa");
        return;
      }
      const hasAge = hasAgeMin || hasAgeMax;
      const targetAge = hasAge
        ? {
            min: hasAgeMin ? values.targetAgeMin : 0,
            max: hasAgeMax
              ? values.targetAgeMax
              : hasAgeMin
              ? values.targetAgeMin
              : 0,
          }
        : undefined;

      const targetGender =
        values.targetGender && values.targetGender !== "ALL"
          ? values.targetGender
          : undefined;

      // Luu override vao localStorage
      const newOverrides = {
        ...templateOverrides,
        [editingTemplate.id]: {
          name: values.name,
          description: values.description,
          rewardDescription: values.rewardDescription || undefined,
          budget: values.budget || undefined,
          startDateOverride: startOverride,
          endDateOverride: endOverride,
          eventDateOverride,
          targetAge,
          targetGender,
        },
      };
      setTemplateOverrides(newOverrides);
      localStorage.setItem(
        "annualOccasionOverrides",
        JSON.stringify(newOverrides)
      );

      message.success("Da luu cau hinh mau");
      setIsEditModalVisible(false);
      setEditingTemplate(null);
      editForm.resetFields();
    });
  };

  const openCreateModal = () => {
    setCreateModalVisible(true);
    createForm.resetFields();
    createForm.setFieldsValue({ type: "ANNUAL" });
  };

  const handleCreateEvent = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);

      const hasAgeMin =
        values.targetAgeMin !== undefined && values.targetAgeMin !== null;
      const hasAgeMax =
        values.targetAgeMax !== undefined && values.targetAgeMax !== null;
      if (hasAgeMin && hasAgeMax && values.targetAgeMin > values.targetAgeMax) {
        message.error("Tuổi tối thiểu không được lớn hơn tuổi tối đa");
        setCreateLoading(false);
        return;
      }
      const hasAge = hasAgeMin || hasAgeMax;
      const targetAge = hasAge
        ? {
            min: hasAgeMin ? values.targetAgeMin : 0,
            max: hasAgeMax
              ? values.targetAgeMax
              : hasAgeMin
              ? values.targetAgeMin
              : 0,
          }
        : undefined;

      const targetGender =
        values.targetGender && values.targetGender !== "ALL"
          ? values.targetGender
          : undefined;

      const eventData = {
        name: values.name,
        type: values.type || "ANNUAL",
        description: values.description || "",
        rewardDescription: values.rewardDescription || undefined,
        startDate: values.dateRange?.[0]?.toISOString(),
        endDate: values.dateRange?.[1]?.toISOString(),
        budget: values.budget || undefined,
        status: "OPEN",
        targetAge,
        targetGender,
      };

      await rewardService.events.create(eventData);
      message.success("Ž?Aœ t §­o s ¯ñ ki ¯Øn m ¯>i!");
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchExistingEvents();
    } catch (error) {
      if (error?.errorFields) return;
      console.error("Error creating manual event:", error);
      message.error(error.response?.data?.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const isEventExists = (template) => {
    const eventName = getEventName(template);
    return events.some((e) => e.name === eventName);
  };

  const getTargetText = (template) => {
    if (template.targetAge) {
      return `Trẻ em ${template.targetAge.min}-${template.targetAge.max} tuổi`;
    }
    if (template.targetGender === "FEMALE") return "Phụ nữ";
    if (template.targetGender === "MALE") return "Nam";
    return "Tất cả mọi người";
  };

  const formatDate = (value) =>
    value ? dayjs(value).format("DD/MM/YYYY") : "N/A";

  const eventColumns = [
    {
      title: "Tên sự kiện",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Button
          type="link"
          onClick={() =>
            navigate(`/leader/reward-events/${record._id}/registrations`)
          }
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag>{getTypeText(type)}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_, record) =>
        record.startDate && record.endDate ? (
          <Text type="secondary">
            {formatDate(record.startDate)} - {formatDate(record.endDate)}
          </Text>
        ) : record.date ? (
          <Text type="secondary">{formatDate(record.date)}</Text>
        ) : (
          "N/A"
        ),
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          onClick={() =>
            navigate(`/leader/reward-events/${record._id}/registrations`)
          }
        >
          Xem danh sách
        </Button>
      ),
    },
  ];

  return (
    <Layout>
      <div>
        {/* Header gradient */}
        <Card
          bordered={false}
          style={{
            marginBottom: 24,
            background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
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
                <CalendarOutlined style={{ fontSize: 32, color: "#fff" }} />
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
                  Sự kiện Phát quà Thường niên
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
                  Quản lý và kích hoạt các sự kiện phát quà thường niên
                </Text>
              </div>
            </div>

            <div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
                style={{
                  marginRight: 8,
                  fontWeight: 600,
                  height: 40,
                  borderRadius: 8,
                  boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
                }}
              >
                Tạo sự kiện thường niên
              </Button>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/leader/reward-events")}
                style={{
                  background: "#fff",
                  color: "#1890ff",
                  fontWeight: 500,
                  height: 40,
                  borderRadius: 8,
                  transition: "all 0.3s ease",
                }}
                className="hover-back"
              >
                Quay lại
              </Button>
            </div>
          </div>

          {/* Hover effect */}
          <style>{`
            .hover-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 10px 25px rgba(24, 144, 255, 0.35);
            }
            .hover-back:hover {
              transform: translateY(-3px);
              box-shadow: 0 6px 16px rgba(0,0,0,0.15);
            }
          `}</style>
        </Card>

        {/* Content Card */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            transition: "all 0.3s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Text
              type="secondary"
              style={{ fontSize: "14px", lineHeight: "1.6" }}
            >
              Hệ thống quản lý các sự kiện thường niên. Kích hoạt các dịp lễ để
              hệ thống tạo sự kiện phát quà theo cấu hình mặc định. Đối với các
              dịp có đối tượng cụ thể (theo độ tuổi hoặc giới tính), hệ thống sẽ
              tự động tạo danh sách phân phối quà phù hợp. Bạn có thể tùy chỉnh
              mẫu sự kiện trước khi kích hoạt.
            </Text>

            <Row gutter={[16, 16]}>
              {annualTemplates.map((template) => {
                const exists = isEventExists(template);
                const eventDate = calculateDate(template);
                const targetInfo = getTargetText(template);

                return (
                  <Col xs={24} sm={24} md={12} lg={8} key={template.id}>
                    <Card
                      hoverable
                      style={{
                        border: exists
                          ? "2px solid #52c41a"
                          : "1px solid #d9d9d9",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      bodyStyle={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        padding: "16px",
                      }}
                      cover={
                        <div
                          style={{
                            textAlign: "center",
                            padding: "24px 20px",
                            fontSize: "48px",
                            backgroundColor: exists ? "#f6ffed" : "#fafafa",
                            minHeight: "100px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {template.icon || <GiftOutlined />}
                        </div>
                      }
                    >
                      <Space
                        direction="vertical"
                        size="middle"
                        style={{ width: "100%", flex: 1 }}
                      >
                        <Row justify="space-between" align="middle">
                          <Col flex="auto">
                            <Title
                              level={4}
                              style={{ margin: 0, fontSize: "16px" }}
                            >
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

                        <Text
                          type="secondary"
                          style={{
                            fontSize: "13px",
                            minHeight: "40px",
                            display: "block",
                            lineHeight: "1.5",
                          }}
                        >
                          {template.description}
                        </Text>

                        <Descriptions
                          size="small"
                          column={1}
                          bordered
                          style={{ marginBottom: 0 }}
                        >
                          <Descriptions.Item label="Ngày diễn ra">
                            <Text strong>
                              {template.eventDateOverride
                                ? dayjs(template.eventDateOverride).format(
                                    "DD/MM/YYYY"
                                  )
                                : template.defaultDate}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Ngày dự kiến">
                            <Text strong style={{ color: "#1890ff" }}>
                              {eventDate.format("DD/MM/YYYY")}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Đối tượng">
                            <Text>{targetInfo}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item
                            label="Phần thưởng"
                            style={{ minHeight: "32px" }}
                          >
                            <Text
                              strong
                              style={{
                                color: template.rewardDescription
                                  ? "#1890ff"
                                  : "#d9d9d9",
                              }}
                            >
                              {template.rewardDescription || "Chưa cấu hình"}
                            </Text>
                          </Descriptions.Item>
                        </Descriptions>

                        <Space
                          style={{
                            width: "100%",
                            justifyContent: "flex-end",
                            marginTop: "auto",
                            paddingTop: "8px",
                          }}
                        >
                          <Button
                            icon={<EditOutlined />}
                            onClick={() => handleEditTemplate(template)}
                            size="small"
                          >
                            Chỉnh sửa
                          </Button>
                          {exists ? (
                            <Button
                              type="default"
                              icon={<EyeOutlined />}
                              onClick={() => {
                                const event = events.find(
                                  (e) => e.name === getEventName(template)
                                );
                                if (event) {
                                  navigate(
                                    `/leader/reward-events/${event._id}/registrations`
                                  );
                                }
                              }}
                              size="small"
                            >
                              Xem danh sách
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              icon={<CalendarOutlined />}
                              onClick={() => handleActivate(template)}
                              disabled={loading}
                              loading={loading}
                              size="small"
                            >
                              Kích hoạt
                            </Button>
                          )}
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Space>
        </Card>

        {events.length > 0 && (
          <Card
            bordered={false}
            style={{ marginTop: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <Space
              direction="vertical"
              size="middle"
              style={{ width: "100%" }}
            >
              <Title level={4} style={{ margin: 0 }}>
                Sự kiện đã tạo
              </Title>
              <Table
                columns={eventColumns}
                dataSource={events}
                rowKey="_id"
                pagination={false}
              />
            </Space>
          </Card>
        )}
      </div>

      {/* Create Event Modal */}
      <Modal
        title="Tạo Sự kiện Phát quà Thường niên"
        open={createModalVisible}
        onOk={handleCreateEvent}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        okText="Tạo sự kiện"
        cancelText="Hủy"
        confirmLoading={createLoading}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ type: "ANNUAL", targetGender: "ALL" }}
        >
          <Form.Item
            name="name"
            label="Tên sự kiện"
            rules={[{ required: true, message: "Vui lòng nhập tên sự kiện" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Thời gian phát quà"
            rules={[
              { required: true, message: "Vui lòng chọn thời gian phát quà" },
            ]}
          >
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>

          <Form.Item
            label="Đối tượng (tuổi)"
            tooltip="Để trống nếu áp dụng cho tất cả"
            style={{ marginBottom: 8 }}
          >
            <Space>
              <Form.Item name="targetAgeMin" noStyle>
                <InputNumber
                  min={0}
                  placeholder="Từ tuổi"
                  style={{ width: 120 }}
                />
              </Form.Item>
              <Form.Item name="targetAgeMax" noStyle>
                <InputNumber
                  min={0}
                  placeholder="Đến tuổi"
                  style={{ width: 120 }}
                />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            name="targetGender"
            label="Giới tính"
            tooltip="Chỉ chọn nếu giới hạn theo giới"
          >
            <Select>
              <Option value="ALL">Tất cả</Option>
              <Option value="MALE">Nam</Option>
              <Option value="FEMALE">Nữ</Option>
            </Select>
          </Form.Item>

          <Form.Item name="budget" label="Ngân sách (VNĐ)">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              placeholder="Nhập ngân sách (tùy chọn)"
            />
          </Form.Item>

          <Form.Item name="rewardDescription" label="Phần thưởng">
            <Input.TextArea
              rows={3}
              placeholder="Phần thưởng/tiền mặt tháng, ví dụ: 200.000 VNĐ, 1 bộ quà..."
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea
              rows={3}
              placeholder="Thêm chi tiết về sự kiện (tùy chọn)"
            />
          </Form.Item>

          <Form.Item name="type" initialValue="ANNUAL" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        title="Chỉnh sửa Mẫu Sự kiện"
        open={isEditModalVisible}
        onOk={handleSaveTemplate}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingTemplate(null);
          editForm.resetFields();
        }}
        okText="Lưu"
        cancelText="Hủy"
      >
        {editingTemplate && (
          <Form form={editForm} layout="vertical">
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
              name="eventDateOverride"
              label="Ngày diễn ra (dương lịch)"
              tooltip="Ghi đè ngày diễn ra nếu khác mặc định"
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
              />
            </Form.Item>
            <Form.Item
              name="dateRangeOverride"
              label="Thời gian phát quà"
              tooltip="Chọn khoảng thời gian phát quà thay cho mẫu này"
            >
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
              />
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
            <Form.Item
              label="Đối tượng (tuổi)"
              tooltip="Để trống nếu áp dụng cho tất cả"
              style={{ marginBottom: 8 }}
            >
              <Space>
                <Form.Item name="targetAgeMin" noStyle>
                  <InputNumber
                    min={0}
                    placeholder="Từ tuổi"
                    style={{ width: 120 }}
                  />
                </Form.Item>
                <Form.Item name="targetAgeMax" noStyle>
                  <InputNumber
                    min={0}
                    placeholder="Đến tuổi"
                    style={{ width: 120 }}
                  />
                </Form.Item>
              </Space>
            </Form.Item>
            <Form.Item
              name="targetGender"
              label="Giới tính"
              tooltip="Chỉ chọn nếu giới hạn theo giới"
            >
              <Input.Group compact>
                <Input
                  style={{ display: "none" }}
                  readOnly
                  value={undefined}
                  tabIndex={-1}
                />
                <select
                  value={editForm.getFieldValue("targetGender") || "ALL"}
                  onChange={(e) =>
                    editForm.setFieldsValue({ targetGender: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "6px 11px",
                    borderRadius: 6,
                    border: "1px solid #d9d9d9",
                  }}
                >
                  <option value="ALL">Tất cả</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                </select>
              </Input.Group>
            </Form.Item>
            <Form.Item
              name="budget"
              label="Ngân sách (VNĐ)"
              tooltip="Ngân sách cho mỗi phần quà (dùng để tự động tạo danh sách phân phối)"
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                placeholder="Nhập ngân sách (tùy chọn)"
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Layout>
  );
};

export default RewardEventSchedule;
