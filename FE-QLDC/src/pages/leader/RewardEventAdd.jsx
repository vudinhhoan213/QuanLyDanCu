import React, { useState } from "react";
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
} from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { rewardService } from "../../services";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RewardEventAdd = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const eventData = {
        name: values.name,
        type: values.type,
        description: values.description,
        startDate: values.dateRange?.[0]?.toISOString(),
        endDate: values.dateRange?.[1]?.toISOString(),
        budget: values.budget || undefined,
        status: "OPEN",
      };

      await rewardService.events.create(eventData);
      message.success("Tạo sự kiện thành công!");
      navigate("/leader/reward-events");
    } catch (error) {
      console.error("Error creating event:", error);
      message.error(
        error.response?.data?.message || "Không thể tạo sự kiện. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                Tạo Sự kiện Phát quà Mới
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

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              type: "ANNUAL",
            }}
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
                    disabledDate={(current) => current && current < dayjs().startOf("day")}
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
                  Tạo sự kiện
                </Button>
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

export default RewardEventAdd;

