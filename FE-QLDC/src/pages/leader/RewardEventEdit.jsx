import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  InputNumber,
  Typography,
  Space,
  message,
  Row,
  Col,
  Alert,
} from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import { rewardService } from "../../services";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RewardEventEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [event, setEvent] = useState(null);
  const [hasRegistrations, setHasRegistrations] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setFetching(true);
      const eventData = await rewardService.events.getById(id);

      // Kiểm tra xem có đăng ký chưa
      try {
        const regResponse = await rewardService.events.getRegistrations(id);
        const registeredCount = regResponse.docs?.length || 0;
        setHasRegistrations(registeredCount > 0);
      } catch (error) {
        setHasRegistrations(false);
      }

      setEvent(eventData);

      // Set form values
      form.setFieldsValue({
        name: eventData.name,
        type: eventData.type,
        description: eventData.description,
        dateRange:
          eventData.startDate && eventData.endDate
            ? [dayjs(eventData.startDate), dayjs(eventData.endDate)]
            : null,
        maxSlots: eventData.maxSlots || 0,
        budget: eventData.budget || undefined,
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      message.error("Không thể tải thông tin sự kiện");
      navigate("/leader/reward-events");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const updateData = {
        name: values.name,
        type: values.type,
        description: values.description,
        startDate: values.dateRange?.[0]?.toISOString(),
        endDate: values.dateRange?.[1]?.toISOString(),
        budget: values.budget || undefined,
      };

      // Chỉ cho phép cập nhật maxSlots nếu chưa có đăng ký
      if (!hasRegistrations) {
        updateData.maxSlots = values.maxSlots || 0;
      }

      await rewardService.events.update(id, updateData);
      message.success("Cập nhật sự kiện thành công!");
      navigate("/leader/reward-events");
    } catch (error) {
      console.error("Error updating event:", error);
      message.error(
        error.response?.data?.message || "Không thể cập nhật sự kiện. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEvent = async () => {
    try {
      await rewardService.events.close(id);
      message.success("Đã đóng sự kiện");
      navigate("/leader/reward-events");
    } catch (error) {
      console.error("Error closing event:", error);
      message.error("Không thể đóng sự kiện");
    }
  };

  if (fetching) {
    return (
      <Layout>
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            Đang tải...
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                Chỉnh sửa Sự kiện Phát quà
              </Title>
            </Col>
            <Col>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/leader/reward-events")}
              >
                Quay lại
              </Button>
            </Col>
          </Row>

          {hasRegistrations && (
            <Alert
              message="Lưu ý"
              description="Sự kiện này đã có người đăng ký. Bạn không thể thay đổi số slot tối đa. Bạn có thể đóng sự kiện sớm hoặc gia hạn thời gian."
              type="warning"
              showIcon
              closable
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="name"
                  label="Tên sự kiện"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên sự kiện" },
                  ]}
                >
                  <Input
                    placeholder="Ví dụ: Phát quà Trung Thu 2024"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="Loại sự kiện"
                  rules={[
                    { required: true, message: "Vui lòng chọn loại sự kiện" },
                  ]}
                >
                  <Select size="large" placeholder="Chọn loại sự kiện">
                    <Option value="ANNUAL">Thường niên</Option>
                    <Option value="SPECIAL">Đặc biệt</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="maxSlots"
                  label="Số slot tối đa"
                  rules={[
                    {
                      type: "number",
                      min: 0,
                      message: "Số slot phải lớn hơn hoặc bằng 0",
                    },
                  ]}
                  tooltip="Nhập 0 để không giới hạn số lượng đăng ký"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    size="large"
                    min={0}
                    placeholder="0 = không giới hạn"
                    disabled={hasRegistrations}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="dateRange"
                  label="Thời gian đăng ký"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn thời gian đăng ký",
                    },
                  ]}
                >
                  <DatePicker.RangePicker
                    style={{ width: "100%" }}
                    size="large"
                    format="DD/MM/YYYY"
                    placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="budget" label="Ngân sách (VNĐ)">
                  <InputNumber
                    style={{ width: "100%" }}
                    size="large"
                    min={0}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                    placeholder="Nhập ngân sách (tùy chọn)"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="description" label="Mô tả">
                  <TextArea
                    rows={4}
                    placeholder="Nhập mô tả chi tiết về sự kiện (tùy chọn)"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  Cập nhật
                </Button>
                {event?.status === "OPEN" && (
                  <Button
                    danger
                    size="large"
                    onClick={handleCloseEvent}
                  >
                    Đóng sự kiện
                  </Button>
                )}
                <Button
                  size="large"
                  onClick={() => navigate("/leader/reward-events")}
                >
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </Layout>
  );
};

export default RewardEventEdit;