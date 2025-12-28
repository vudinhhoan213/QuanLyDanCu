import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Space,
  message,
  Upload,
  Spin,
  Row,
  Col,
  Divider,
  Alert,
} from "antd";
import {
  TrophyOutlined,
  SendOutlined,
  UploadOutlined,
  UserOutlined,
  FileTextOutlined,
  FileImageOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { citizenService } from "../../services/citizenService";
import { rewardService } from "../../services/rewardService";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SubmitRewardProposal = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingHousehold, setLoadingHousehold] = useState(false);
  const [householdMembers, setHouseholdMembers] = useState([]);
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();

  const achievementTypes = [
    {
      value: "national",
      label: "Học sinh giỏi cấp quốc gia",
    },
    {
      value: "provincial",
      label: "Học sinh giỏi cấp tỉnh",
    },
    {
      value: "district",
      label: "Học sinh giỏi cấp trường",
    },
    {
      value: "excellent",
      label: "Học sinh tiên tiến",
    },
    { value: "good", label: "Học sinh giỏi" },
  ];

  // Fetch household members on mount
  useEffect(() => {
    fetchHouseholdMembers();
  }, []);

  const fetchHouseholdMembers = async () => {
    setLoadingHousehold(true);
    try {
      const household = await citizenService.getMyHousehold();
      if (household && household.members) {
        // Filter to show only children or students (age < 25)
        const members = household.members.filter((member) => {
          const age = member.dateOfBirth
            ? new Date().getFullYear() -
              new Date(member.dateOfBirth).getFullYear()
            : 0;
          return age < 25 && member._id; // Only students/children
        });
        setHouseholdMembers(members);
      }
    } catch (error) {
      console.error("Error fetching household:", error);
      message.error("Không thể tải thông tin hộ khẩu");
    } finally {
      setLoadingHousehold(false);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (values) => {
    // Validate file upload
    if (!fileList || fileList.length === 0) {
      message.error("Vui lòng tải lên ít nhất 1 minh chứng");
      return;
    }

    setLoading(true);
    try {
      // Get selected achievement type to create title
      const selectedAchievement = achievementTypes.find(
        (a) => a.value === values.achievementType
      );

      // Convert uploaded files to base64
      const evidenceImages = [];
      for (const file of fileList) {
        if (file.originFileObj) {
          try {
            const base64 = await fileToBase64(file.originFileObj);
            evidenceImages.push(base64);
          } catch (error) {
            console.error("Error converting file to base64:", error);
            message.warning(`Không thể xử lý file: ${file.name}`);
          }
        }
      }

      if (evidenceImages.length === 0) {
        message.error("Không thể xử lý các file đã tải lên. Vui lòng thử lại.");
        setLoading(false);
        return;
      }

      // Create clean proposal payload - only required fields
      const proposalData = {
        citizen: values.citizenId,
        title: selectedAchievement
          ? selectedAchievement.label
          : "Đề xuất khen thưởng",
        description: values.description.trim(),
        evidenceImages: evidenceImages,
      };

      await rewardService.proposals.create(proposalData);
      message.success("Gửi đề xuất khen thưởng thành công!");

      // Reset form
      form.resetFields();
      setFileList([]);

      // Navigate to my rewards
      navigate("/citizen/my-rewards");
    } catch (error) {
      console.error("Error submitting proposal:", error);
      message.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi gửi đề xuất. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  return (
    <Layout>
      <div
        style={{
          padding: "24px",
          background: "#f5f5f5",
          minHeight: "100vh",
        }}
      >
        {/* Header with Gradient */}
        <Card
          bordered={false}
          style={{
            marginBottom: 24,
            background:
              "linear-gradient(140deg, #182c3bff 0%, #a8ddff 34%, #367cc9 58%, #009bff 82%, #00d1be 100%)",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
          }}
          bodyStyle={{ padding: "32px" }}
        >
          <Row align="middle" justify="space-between">
            <Col xs={24} md={18}>
              <Space size="large" align="center" wrap>
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
                  <TrophyOutlined style={{ fontSize: 32, color: "#fff" }} />
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
                    Đề Xuất Khen Thưởng
                  </Title>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.9)",
                      fontSize: 16,
                    }}
                  >
                    Điền thông tin để đề xuất khen thưởng cho học sinh
                  </Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} md={6} style={{ textAlign: "right", marginTop: 16 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/citizen/my-rewards")}
                style={{
                  height: 40,
                  borderRadius: "8px",
                  color: "#fff",
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  background: "rgba(255, 255, 255, 0.1)",
                }}
              >
                Quay lại
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Main Form Card */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
              bodyStyle={{ padding: "32px" }}
            >
              <Spin spinning={loadingHousehold || loading}>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  requiredMark={false}
                  size="large"
                >
                  {/* Student Selection */}
                  <Form.Item
                    name="citizenId"
                    label={
                      <Space>
                        <UserOutlined style={{ color: "#1890ff" }} />
                        <Text strong style={{ fontSize: 15 }}>
                          Học sinh
                        </Text>
                      </Space>
                    }
                    rules={[
                      { required: true, message: "Vui lòng chọn học sinh" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn học sinh từ hộ khẩu"
                      loading={loadingHousehold}
                      showSearch
                      filterOption={(input, option) =>
                        option.children
                          .toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      }
                      style={{
                        borderRadius: "8px",
                      }}
                    >
                      {householdMembers.map((member) => (
                        <Option key={member._id} value={member._id}>
                          {member.fullName}
                          {member.citizenID ? ` - ${member.citizenID}` : ""}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {/* Achievement Type */}
                  <Form.Item
                    name="achievementType"
                    label={
                      <Space>
                        <TrophyOutlined style={{ color: "#faad14" }} />
                        <Text strong style={{ fontSize: 15 }}>
                          Loại thành tích
                        </Text>
                      </Space>
                    }
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn loại thành tích",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Chọn loại thành tích"
                      style={{
                        borderRadius: "8px",
                      }}
                    >
                      {achievementTypes.map((type) => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {/* Description */}
                  <Form.Item
                    name="description"
                    label={
                      <Space>
                        <FileTextOutlined style={{ color: "#52c41a" }} />
                        <Text strong style={{ fontSize: 15 }}>
                          Mô tả
                        </Text>
                      </Space>
                    }
                    rules={[
                      { required: true, message: "Vui lòng nhập mô tả" },
                      {
                        min: 20,
                        message: "Mô tả phải có ít nhất 20 ký tự",
                      },
                      {
                        max: 1000,
                        message: "Mô tả không được quá 1000 ký tự",
                      },
                    ]}
                  >
                    <TextArea
                      rows={6}
                      placeholder="Mô tả chi tiết về thành tích, giải thưởng đạt được, thời gian, địa điểm..."
                      showCount
                      maxLength={1000}
                      style={{
                        borderRadius: "8px",
                      }}
                    />
                  </Form.Item>

                  {/* Evidence Upload */}
                  <Form.Item
                    label={
                      <Space>
                        <FileImageOutlined style={{ color: "#722ed1" }} />
                        <Text strong style={{ fontSize: 15 }}>
                          Minh chứng
                        </Text>
                        <Text type="danger">*</Text>
                      </Space>
                    }
                    required
                    help={
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Tải lên giấy khen, bằng khen hoặc các minh chứng liên
                        quan (tối đa 5 file, bắt buộc)
                      </Text>
                    }
                  >
                    <Upload
                      listType="picture-card"
                      fileList={fileList}
                      onChange={handleFileChange}
                      beforeUpload={() => false}
                      accept="image/*"
                      maxCount={5}
                    >
                      {fileList.length < 5 && (
                        <div>
                          <UploadOutlined
                            style={{ fontSize: 24, color: "#8c8c8c" }}
                          />
                          <div style={{ marginTop: 8, color: "#8c8c8c" }}>
                            Tải lên
                          </div>
                        </div>
                      )}
                    </Upload>
                    {fileList.length === 0 && (
                      <Alert
                        message="Vui lòng tải lên ít nhất 1 minh chứng"
                        type="warning"
                        showIcon
                        style={{
                          marginTop: 12,
                          borderRadius: "6px",
                        }}
                      />
                    )}
                  </Form.Item>

                  <Divider />

                  {/* Action Buttons */}
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
                          boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 16px rgba(24, 144, 255, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(24, 144, 255, 0.3)";
                        }}
                      >
                        Gửi đề xuất
                      </Button>
                      <Button
                        size="large"
                        onClick={() => navigate("/citizen/my-rewards")}
                        style={{
                          height: 48,
                          borderRadius: "8px",
                          fontSize: 16,
                          minWidth: 120,
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

          {/* Info Sidebar */}
          <Col xs={24} lg={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                position: "sticky",
                top: 24,
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                <div>
                  <Title level={5} style={{ marginBottom: 16 }}>
                    <InfoCircleOutlined style={{ color: "#1890ff" }} /> Hướng
                    dẫn
                  </Title>
                  <Paragraph
                    style={{ color: "#8c8c8c", fontSize: 14, margin: 0 }}
                  >
                    Điền đầy đủ thông tin để gửi đề xuất khen thưởng cho học
                    sinh trong hộ khẩu của bạn.
                  </Paragraph>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <div>
                  <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>
                    Yêu cầu:
                  </Title>
                  <Space
                    direction="vertical"
                    size="small"
                    style={{ width: "100%" }}
                  >
                    <Text style={{ fontSize: 13, color: "#595959" }}>
                      ✓ Chọn học sinh từ hộ khẩu
                    </Text>
                    <Text style={{ fontSize: 13, color: "#595959" }}>
                      ✓ Chọn loại thành tích
                    </Text>
                    <Text style={{ fontSize: 13, color: "#595959" }}>
                      ✓ Mô tả chi tiết (tối thiểu 20 ký tự)
                    </Text>
                    <Text style={{ fontSize: 13, color: "#595959" }}>
                      ✓ Tải lên ít nhất 1 minh chứng
                    </Text>
                  </Space>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <div>
                  <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>
                    Lưu ý:
                  </Title>
                  <Alert
                    message="Đề xuất sẽ được gửi đến tổ trưởng để xem xét và duyệt. Vui lòng đảm bảo thông tin chính xác."
                    type="info"
                    showIcon
                    style={{
                      fontSize: 13,
                      borderRadius: "6px",
                    }}
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

export default SubmitRewardProposal;
