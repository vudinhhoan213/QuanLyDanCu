import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Avatar,
  Descriptions,
  Checkbox,
  Row,
  Col,
  Divider,
  Alert,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  ManOutlined,
  WomanOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { citizenService, householdService } from "../../services";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const formatDate = (value) =>
  value ? dayjs(value).format("DD/MM/YYYY") : "N/A";

const CitizenManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingCitizen, setEditingCitizen] = useState(null);
  const [viewingCitizen, setViewingCitizen] = useState(null);
  const [form] = Form.useForm();
  const [citizens, setCitizens] = useState([]);
  const [households, setHouseholds] = useState([]);

  // Fetch citizens from API
  useEffect(() => {
    fetchCitizens();
    fetchHouseholds();
  }, []);

  const fetchCitizens = async () => {
    try {
      setLoading(true);
      const response = await citizenService.getAll();
      // Backend returns { docs, total, page, limit }
      const data = response.docs || response || [];
      setCitizens(
        data.map((c) => ({
          key: c._id,
          id: c.code || c._id,
          fullName: c.fullName,
          dateOfBirth: c.dateOfBirth,
          gender:
            c.gender === "MALE" ? "Nam" : c.gender === "FEMALE" ? "Nữ" : "Khác",
          genderValue: c.gender, // Keep original for edit
          idCard: c.nationalId, // Backend uses 'nationalId'
          household: c.household?.code || "Chưa có hộ khẩu",
          householdId: c.household?._id || c.household,
          relationship: c.relationshipToHead,
          phone: c.phone,
          email: c.email,
          occupation: c.occupation,
          residenceStatus: c.residenceStatus || "THUONG_TRU",
          residenceStatusValue: c.residenceStatus || "THUONG_TRU",
          temporaryResidenceAddress: c.temporaryResidenceAddress,
          temporaryResidenceFrom: c.temporaryResidenceFrom,
          temporaryResidenceTo: c.temporaryResidenceTo,
          temporaryAbsenceAddress: c.temporaryAbsenceAddress,
          temporaryAbsenceFrom: c.temporaryAbsenceFrom,
          temporaryAbsenceTo: c.temporaryAbsenceTo,
          movedOutDate: c.movedOutDate,
          deathDate: c.deathDate,
          note: c.note,
          status:
            c.status === "ALIVE"
              ? "active"
              : c.status === "DECEASED"
              ? "deceased"
              : "inactive",
          statusValue: c.status, // Keep original
        }))
      );
    } catch (error) {
      console.error("Error fetching citizens:", error);
      message.error("Không thể tải danh sách nhân khẩu");
    } finally {
      setLoading(false);
    }
  };

  const fetchHouseholds = async () => {
    try {
      const response = await householdService.getAll();
      // Backend returns { docs, total, page, limit }
      const data = response.docs || response || [];
      setHouseholds(data);
    } catch (error) {
      console.error("Error fetching households:", error);
    }
  };

  const columns = [
    {
      title: "Thông tin nhân khẩu",
      dataIndex: "fullName",
      key: "fullName",
      render: (text, record) => (
        <div>
          <Space style={{ marginBottom: 4 }}>
            <Avatar
              size="default"
              icon={
                record.gender === "Nam" ? <ManOutlined /> : <WomanOutlined />
              }
              style={{
                backgroundColor:
                  record.gender === "Nam" ? "#1890ff" : "#eb2f96",
              }}
            />
            <div>
              <div
                style={{ fontWeight: 600, fontSize: "14px", color: "#262626" }}
              >
                {text}
              </div>
              <Space size={4} style={{ fontSize: "12px", color: "#8c8c8c" }}>
                <span>{record.gender}</span>
                <span>•</span>
                <span>{dayjs(record.dateOfBirth).format("DD/MM/YYYY")}</span>
                {record.idCard && (
                  <>
                    <span>•</span>
                    <span>{record.idCard}</span>
                  </>
                )}
              </Space>
            </div>
          </Space>
        </div>
      ),
    },
    {
      title: "Hộ khẩu & Quan hệ",
      dataIndex: "household",
      key: "household",
      render: (household, record) => (
        <div>
          <div style={{ marginBottom: 4, fontSize: "13px" }}>
            <Tag color="blue" style={{ margin: 0 }}>
              {household}
            </Tag>
          </div>
          {record.relationship && (
            <Tag color="purple" style={{ fontSize: "12px" }}>
              {record.relationship}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái cư trú",
      dataIndex: "residenceStatus",
      key: "residenceStatus",
      align: "center",
      render: (status) => {
        const statusMap = {
          THUONG_TRU: { label: "Thường trú", color: "green" },
          TAM_TRU: { label: "Tạm trú", color: "blue" },
          TAM_VANG: { label: "Tạm vắng", color: "orange" },
        };
        const statusInfo = statusMap[status] || statusMap.THUONG_TRU;
        return (
          <Tag
            color={statusInfo.color}
            style={{ fontSize: "13px", padding: "2px 12px" }}
          >
            {statusInfo.label}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => {
        const statusMap = {
          active: { label: "Hoạt động", color: "success" },
          deceased: { label: "Đã qua đời", color: "red" },
          inactive: { label: "Chuyển đi", color: "default" },
        };
        const statusInfo = statusMap[status] || statusMap.active;
        return (
          <Tag
            color={statusInfo.color}
            style={{ fontSize: "13px", padding: "2px 12px" }}
          >
            {statusInfo.label}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          />
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa vĩnh viễn nhân khẩu này?"
            description="Dữ liệu sẽ bị xóa hoàn toàn khỏi hệ thống và không thể khôi phục!"
            onConfirm={() => handleDelete(record.key)}
            okText="Xóa vĩnh viễn"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="primary"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleView = (record) => {
    setViewingCitizen(record);
    setIsViewModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCitizen(record);
    // Chỉ coi là trẻ mới sinh nếu note chính xác là "mới sinh"
    const isNewborn = record.note === "mới sinh";

    // Đảm bảo set giá trị đúng cách, đặc biệt là CCCD và nghề nghiệp
    const formValues = {
      fullName: record.fullName,
      dateOfBirth: dayjs(record.dateOfBirth),
      gender: record.gender, // "Nam" or "Nữ" - đúng cho Select
      idCard: record.idCard || "",
      household: record.householdId,
      relationship: record.relationship,
      phone: record.phone || "",
      email: record.email || "",
      occupation: record.occupation || "",
      residenceStatus:
        record.residenceStatusValue === "THUONG_TRU"
          ? "THUONG_TRU"
          : record.residenceStatusValue === "TAM_TRU"
          ? "TAM_TRU"
          : "TAM_VANG",
      temporaryResidenceAddress: record.temporaryResidenceAddress || "",
      movedOutDate: record.movedOutDate ? dayjs(record.movedOutDate) : null,
      deathDate: record.deathDate ? dayjs(record.deathDate) : null,
      status: record.status, // "active", "deceased", or "inactive"
      isNewborn: isNewborn,
    };

    // Reset form trước khi set giá trị mới để đảm bảo hiển thị đúng
    form.resetFields();
    setTimeout(() => {
      form.setFieldsValue(formValues);
    }, 0);
    setIsModalVisible(true);
  };

  const handleDelete = async (key) => {
    try {
      await citizenService.delete(key);
      message.success({
        content: "✅ Đã xóa vĩnh viễn nhân khẩu khỏi hệ thống",
        duration: 3,
      });
      fetchCitizens(); // Refresh list
      console.log(`🗑️ Deleted citizen: ${key}`);
    } catch (error) {
      console.error("Error deleting citizen:", error);
      const errorMsg = error.response?.data?.message || error.message;
      message.error(`Không thể xóa nhân khẩu: ${errorMsg}`);
    }
  };

  const handleAdd = () => {
    setEditingCitizen(null);
    form.resetFields();
    // Đảm bảo giá trị mặc định
    setTimeout(() => {
      form.setFieldsValue({
        isNewborn: false,
        residenceStatus: "THUONG_TRU",
        status: "active",
        idCard: "",
        occupation: "",
      });
    }, 0);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      const citizenData = {
        fullName: values.fullName,
        dateOfBirth: values.dateOfBirth.format("YYYY-MM-DD"),
        gender:
          values.gender === "Nam"
            ? "MALE"
            : values.gender === "Nữ"
            ? "FEMALE"
            : "OTHER",
        phone: values.phone,
        email: values.email,
        residenceStatus: values.residenceStatus || "THUONG_TRU",
      };

      // Xử lý trẻ mới sinh: để trống occupation và CMND
      if (values.isNewborn) {
        citizenData.occupation = "";
        citizenData.nationalId = "";
        citizenData.residenceStatus = "THUONG_TRU";
        citizenData.note = "mới sinh";
      } else {
        // Không phải trẻ mới sinh thì có thể có CMND và nghề nghiệp
        // Luôn gửi giá trị, kể cả khi là chuỗi rỗng để cho phép xóa dữ liệu
        citizenData.nationalId = values.idCard || "";
        citizenData.occupation = values.occupation || "";
      }

      // Xử lý trạng thái nhân khẩu
      if (values.status === "deceased") {
        // Nhân khẩu qua đời
        citizenData.status = "DECEASED";
        citizenData.deathDate = values.deathDate
          ? values.deathDate.format("YYYY-MM-DD")
          : new Date().toISOString().split("T")[0];
        citizenData.note = "Đã qua đời";
      } else if (values.status === "inactive") {
        // Nhân khẩu chuyển đi
        citizenData.status = "MOVED_OUT";
        // Ngày chuyển đi là bắt buộc
        if (values.movedOutDate) {
          citizenData.movedOutDate = values.movedOutDate.format("YYYY-MM-DD");
        } else {
          // Nếu không có ngày chuyển đi, dùng ngày hiện tại
          citizenData.movedOutDate = new Date().toISOString().split("T")[0];
        }
        // Nơi chuyển đến là bắt buộc
        citizenData.temporaryResidenceAddress =
          values.temporaryResidenceAddress || "";
        // Xóa các trường không liên quan khi chuyển đi
        citizenData.deathDate = undefined;
      } else {
        // Nhân khẩu đang hoạt động
        citizenData.status = "ALIVE";
      }

      // Chỉ thêm household nếu có giá trị
      if (values.household) {
        citizenData.household = values.household;
      }

      // Chỉ thêm relationshipToHead nếu có giá trị
      if (values.relationship) {
        citizenData.relationshipToHead = values.relationship;
      }

      if (editingCitizen) {
        // Update existing citizen
        await citizenService.update(editingCitizen.key, citizenData);
        message.success("Cập nhật nhân khẩu thành công");
      } else {
        // Create new citizen
        await citizenService.create(citizenData);
        message.success("Thêm nhân khẩu mới thành công");
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingCitizen(null);
      fetchCitizens(); // Refresh list
    } catch (error) {
      console.error("Error saving citizen:", error);
      const errorMsg = error.response?.data?.message || error.message;
      message.error(
        editingCitizen
          ? `Không thể cập nhật: ${errorMsg}`
          : `Không thể thêm mới: ${errorMsg}`
      );
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingCitizen(null);
  };

  const filteredCitizens = citizens.filter((citizen) =>
    Object.values(citizen).some(
      (value) =>
        value != null &&
        value.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  return (
    <Layout>
      <div>
        {/* Page Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "12px",
            padding: "24px 32px",
            marginBottom: 24,
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.15)",
          }}
        >
          <Space align="center" size={16}>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserOutlined style={{ fontSize: "28px", color: "#fff" }} />
            </div>
            <div>
              <Title
                level={2}
                style={{ margin: 0, color: "#fff", fontSize: "24px" }}
              >
                Quản Lý Nhân Khẩu
              </Title>
              <div
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "14px",
                  marginTop: "4px",
                }}
              >
                Quản lý thông tin cá nhân của các nhân khẩu trong khu vực
              </div>
            </div>
          </Space>
        </div>

        {/* Action Bar */}
        <Card
          bordered={false}
          style={{
            marginBottom: 16,
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <Space
            style={{ width: "100%", justifyContent: "space-between" }}
            wrap
          >
            <Input
              placeholder="Tìm kiếm theo tên, CCCD, số điện thoại..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              style={{
                width: 350,
                borderRadius: "8px",
              }}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size="large"
              style={{ borderRadius: "8px" }}
            >
              Thêm nhân khẩu mới
            </Button>
          </Space>
        </Card>

        {/* Table */}
        <Card
          bordered={false}
          style={{
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <Table
            columns={columns}
            dataSource={filteredCitizens}
            loading={loading}
            pagination={{
              total: filteredCitizens.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} nhân khẩu`,
            }}
            rowClassName={(record, index) =>
              index % 2 === 0 ? "" : "table-row-light"
            }
          />
        </Card>

        {/* Xem thông tin nhân khẩu */}
        <Modal
          title={
            <Space>
              <Avatar
                icon={
                  viewingCitizen?.gender === "Nam" ? (
                    <ManOutlined />
                  ) : (
                    <WomanOutlined />
                  )
                }
                style={{
                  backgroundColor:
                    viewingCitizen?.gender === "Nam" ? "#1890ff" : "#eb2f96",
                }}
              />
              <span>Thông Tin Nhân Khẩu - {viewingCitizen?.fullName}</span>
            </Space>
          }
          open={isViewModalVisible}
          onCancel={() => setIsViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsViewModalVisible(false)}>
              Đóng
            </Button>,
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setIsViewModalVisible(false);
                handleEdit(viewingCitizen);
              }}
            >
              Chỉnh sửa
            </Button>,
          ]}
          width={800}
        >
          {viewingCitizen && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Họ và tên" span={2}>
                <Text strong>{viewingCitizen.fullName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Mã nhân khẩu">
                <Tag color="blue">{viewingCitizen.id}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                <Tag color={viewingCitizen.gender === "Nam" ? "blue" : "pink"}>
                  {viewingCitizen.gender}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {dayjs(viewingCitizen.dateOfBirth).format("DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="CCCD/CMND">
                {viewingCitizen.idCard || <Tag color="default">Chưa có</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại" span={2}>
                {viewingCitizen.phone || <Tag color="default">Chưa có</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>
                {viewingCitizen.email || <Tag color="default">Chưa có</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Hộ khẩu">
                {viewingCitizen.household === "Chưa có hộ khẩu" ? (
                  <Tag color="default">Chưa có hộ khẩu</Tag>
                ) : (
                  <Tag color="blue">{viewingCitizen.household}</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Quan hệ với chủ hộ">
                {viewingCitizen.relationship ? (
                  <Tag color="purple">{viewingCitizen.relationship}</Tag>
                ) : (
                  <Tag color="default">N/A</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái cư trú">
                {(() => {
                  const statusMap = {
                    THUONG_TRU: { label: "Thường trú", color: "green" },
                    TAM_TRU: { label: "Tạm trú", color: "blue" },
                    TAM_VANG: { label: "Tạm vắng", color: "orange" },
                  };
                  const status =
                    viewingCitizen.residenceStatusValue || "THUONG_TRU";
                  const statusInfo = statusMap[status] || statusMap.THUONG_TRU;
                  return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
                })()}
              </Descriptions.Item>

              {viewingCitizen.residenceStatusValue === "TAM_TRU" && (
                <>
                  <Descriptions.Item label="Th???i h???n t???m trA?">
                    {formatDate(viewingCitizen.temporaryResidenceFrom)} -
                    {formatDate(viewingCitizen.temporaryResidenceTo)}
                  </Descriptions.Item>
                  <Descriptions.Item label="????<a ch??% t???m trA?" span={2}>
                    {viewingCitizen.temporaryResidenceAddress || (
                      <Tag color="default">Ch??a cA3</Tag>
                    )}
                  </Descriptions.Item>
                </>
              )}

              {viewingCitizen.residenceStatusValue === "TAM_VANG" && (
                <>
                  <Descriptions.Item label="Th???i h???n t???m v??_ng">
                    {formatDate(viewingCitizen.temporaryAbsenceFrom)} -
                    {formatDate(viewingCitizen.temporaryAbsenceTo)}
                  </Descriptions.Item>
                  <Descriptions.Item label="N??i t???m v??_ng ?`???n" span={2}>
                    {viewingCitizen.temporaryAbsenceAddress || (
                      <Tag color="default">Ch??a cA3</Tag>
                    )}
                  </Descriptions.Item>
                </>
              )}

              <Descriptions.Item label="Trạng thái">
                {(() => {
                  const statusMap = {
                    active: { label: "Hoạt động", color: "success" },
                    deceased: { label: "Đã qua đời", color: "red" },
                    inactive: { label: "Chuyển đi", color: "default" },
                  };
                  const statusInfo =
                    statusMap[viewingCitizen.status] || statusMap.active;
                  return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
                })()}
              </Descriptions.Item>
              {viewingCitizen.movedOutDate && (
                <Descriptions.Item label="Ngày chuyển đi">
                  {dayjs(viewingCitizen.movedOutDate).format("DD/MM/YYYY")}
                </Descriptions.Item>
              )}
              {viewingCitizen.deathDate && (
                <Descriptions.Item label="Ngày qua đời">
                  {dayjs(viewingCitizen.deathDate).format("DD/MM/YYYY")}
                </Descriptions.Item>
              )}
              {viewingCitizen.temporaryResidenceAddress &&
                viewingCitizen.status === "inactive" && (
                  <Descriptions.Item label="N??i chuy???n ?`???n" span={2}>
                    {viewingCitizen.temporaryResidenceAddress}
                  </Descriptions.Item>
                )}
              {viewingCitizen.note && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {viewingCitizen.note}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>

        {/* Add/Edit Modal */}
        <Modal
          title={
            <Space>
              <UserOutlined />
              <span>
                {editingCitizen ? "Chỉnh sửa nhân khẩu" : "Thêm nhân khẩu mới"}
              </span>
            </Space>
          }
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={1000}
          okText="Lưu thông tin"
          cancelText="Hủy"
          style={{ top: 10 }}
          okButtonProps={{ size: "large" }}
          cancelButtonProps={{ size: "large" }}
          bodyStyle={{ padding: "16px 20px" }}
        >
          <Form form={form} layout="vertical" size="small">
            {/* Thông tin cơ bản */}
            <Divider
              orientation="left"
              style={{ marginTop: 0, marginBottom: 12 }}
            >
              <Typography.Text strong>Thông tin cơ bản</Typography.Text>
            </Divider>
            <Row gutter={16}>
              {/* Hàng 1: Họ và tên - Full width */}
              <Col span={24}>
                <Form.Item
                  name="fullName"
                  label="Họ và tên"
                  rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                >
                  <Input placeholder="Nhập họ và tên đầy đủ" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              {/* Hàng 2: Ngày sinh, Giới tính */}
              <Col span={12}>
                <Form.Item
                  name="dateOfBirth"
                  label="Ngày sinh"
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày sinh" },
                  ]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày sinh"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="gender"
                  label="Giới tính"
                  rules={[
                    { required: true, message: "Vui lòng chọn giới tính" },
                  ]}
                >
                  <Select placeholder="Chọn giới tính">
                    <Option value="Nam">Nam</Option>
                    <Option value="Nữ">Nữ</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="idCard" label="CCCD/CMND">
              <Input placeholder="Nhập số CCCD/CMND" maxLength={12} />
            </Form.Item>

            <Row gutter={16}>
              {/* Hàng 4: Hộ khẩu, Quan hệ */}
              <Col span={12}>
                <Form.Item
                  name="household"
                  label="Hộ khẩu"
                  tooltip="Không bắt buộc - có thể gán sau"
                >
                  <Select
                    placeholder="Chọn hộ khẩu"
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {Array.isArray(households) &&
                      households.map((h) => (
                        <Option key={h._id} value={h._id}>
                          {h.code || h._id} - {h.headOfHousehold}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="relationship"
                  label="Quan hệ với chủ hộ"
                  tooltip="Nếu có"
                >
                  <Select placeholder="Chọn quan hệ">
                    <Option value="Chủ hộ">Chủ hộ</Option>
                    <Option value="Vợ">Vợ</Option>
                    <Option value="Chồng">Chồng</Option>
                    <Option value="Con">Con</Option>
                    <Option value="Cha">Cha</Option>
                    <Option value="Mẹ">Mẹ</Option>
                    <Option value="Khác">Khác</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              {/* Hàng 5: Số điện thoại, Email */}
              <Col span={12}>
                <Form.Item name="phone" label="Số điện thoại">
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="email" label="Email">
                  <Input placeholder="Nhập email" type="email" />
                </Form.Item>
              </Col>
            </Row>

            {/* Thông tin liên hệ */}
            <Divider
              orientation="left"
              style={{ marginTop: 8, marginBottom: 12 }}
            >
              <Typography.Text strong>Thông tin liên hệ</Typography.Text>
            </Divider>

            {/* Trạng thái và đặc biệt */}
            <Divider
              orientation="left"
              style={{ marginTop: 8, marginBottom: 12 }}
            >
              <Typography.Text strong>Trạng thái và đặc biệt</Typography.Text>
            </Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="residenceStatus"
                  label="Trạng thái cư trú"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn trạng thái cư trú",
                    },
                  ]}
                  initialValue="THUONG_TRU"
                >
                  <Select placeholder="Chọn trạng thái cư trú">
                    <Option value="THUONG_TRU">Thường trú</Option>
                    <Option value="TAM_TRU">Tạm trú</Option>
                    <Option value="TAM_VANG">Tạm vắng</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái nhân khẩu"
                  rules={[
                    { required: true, message: "Vui lòng chọn trạng thái" },
                  ]}
                  initialValue="active"
                >
                  <Select
                    placeholder="Chọn trạng thái"
                    onChange={(value) => {
                      // Tự động xóa các trường không liên quan khi thay đổi trạng thái
                      if (value === "active") {
                        form.setFieldsValue({
                          movedOutDate: null,
                          temporaryResidenceAddress: "",
                          deathDate: null,
                        });
                      } else if (value === "inactive") {
                        form.setFieldsValue({
                          deathDate: null,
                        });
                      } else if (value === "deceased") {
                        form.setFieldsValue({
                          movedOutDate: null,
                          temporaryResidenceAddress: "",
                        });
                      }
                    }}
                  >
                    <Option value="active">Hoạt động</Option>
                    <Option value="inactive">Chuyển đi</Option>
                    <Option value="deceased">Đã qua đời</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="isNewborn"
                  valuePropName="checked"
                  tooltip="Đánh dấu nếu là trẻ mới sinh (sẽ để trống nghề nghiệp và CMND)"
                  initialValue={false}
                >
                  <Checkbox
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        // Khi chọn trẻ mới sinh, tự động xóa CCCD và nghề nghiệp
                        form.setFieldsValue({
                          idCard: "",
                          occupation: "",
                        });
                      }
                    }}
                  >
                    <Typography.Text strong>Trẻ mới sinh</Typography.Text>
                  </Checkbox>
                </Form.Item>
              </Col>
            </Row>

            {/* Thông tin bổ sung theo trạng thái */}
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.status !== currentValues.status
              }
            >
              {({ getFieldValue }) => {
                const status = getFieldValue("status");

                if (status === "inactive") {
                  return (
                    <>
                      <Divider
                        orientation="left"
                        style={{ marginTop: 8, marginBottom: 8 }}
                      >
                        <Typography.Text strong type="warning">
                          Thông tin chuyển đi
                        </Typography.Text>
                      </Divider>
                      <Alert
                        message="Nhân khẩu đang được đánh dấu là 'Chuyển đi'"
                        description="Vui lòng điền đầy đủ thông tin ngày chuyển đi và nơi chuyển đến."
                        type="info"
                        showIcon
                        style={{ marginBottom: 8 }}
                        size="small"
                      />
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="movedOutDate"
                            label="Ngày chuyển đi"
                            rules={[
                              {
                                required: true,
                                message: "Vui lòng chọn ngày chuyển đi",
                              },
                            ]}
                          >
                            <DatePicker
                              style={{ width: "100%" }}
                              format="DD/MM/YYYY"
                              placeholder="Chọn ngày chuyển đi"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="temporaryResidenceAddress"
                            label="Nơi chuyển đến"
                            rules={[
                              {
                                required: true,
                                message: "Vui lòng nhập nơi chuyển đến",
                              },
                            ]}
                          >
                            <Input placeholder="Nhập địa chỉ nơi chuyển đến" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  );
                }

                if (status === "deceased") {
                  return (
                    <>
                      <Divider
                        orientation="left"
                        style={{ marginTop: 8, marginBottom: 8 }}
                      >
                        <Typography.Text strong type="danger">
                          Thông tin qua đời
                        </Typography.Text>
                      </Divider>
                      <Alert
                        message="Nhân khẩu đang được đánh dấu là 'Đã qua đời'"
                        description="Vui lòng điền ngày qua đời."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 8 }}
                        size="small"
                      />
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="deathDate"
                            label="Ngày qua đời"
                            rules={[
                              {
                                required: true,
                                message: "Vui lòng chọn ngày qua đời",
                              },
                            ]}
                          >
                            <DatePicker
                              style={{ width: "100%" }}
                              format="DD/MM/YYYY"
                              placeholder="Chọn ngày qua đời"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  );
                }

                return null;
              }}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default CitizenManagement;
