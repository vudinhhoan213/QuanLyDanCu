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

const { Title } = Typography;
const { Option } = Select;

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
          status: c.status === "ALIVE" ? "active" : "inactive",
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
      title: "Họ và tên",
      dataIndex: "fullName",
      key: "fullName",
      fixed: "left",
      width: 200,
      render: (text, record) => (
        <Space>
          <Avatar
            size="small"
            icon={record.gender === "Nam" ? <ManOutlined /> : <WomanOutlined />}
            style={{
              backgroundColor: record.gender === "Nam" ? "#1890ff" : "#eb2f96",
            }}
          />
          <span style={{ fontWeight: "bold" }}>{text}</span>
        </Space>
      ),
    },
    {
      title: "Mã NK",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "Ngày sinh",
      dataIndex: "dateOfBirth",
      key: "dateOfBirth",
      width: 120,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      width: 100,
      align: "center",
      render: (gender) => (
        <Tag color={gender === "Nam" ? "blue" : "pink"}>{gender}</Tag>
      ),
    },
    {
      title: "CCCD/CMND",
      dataIndex: "idCard",
      key: "idCard",
      width: 150,
      render: (text) => text || <Tag color="default">Chưa có</Tag>,
    },
    {
      title: "Hộ khẩu",
      dataIndex: "household",
      key: "household",
      width: 120,
    },
    {
      title: "Quan hệ",
      dataIndex: "relationship",
      key: "relationship",
      width: 120,
      render: (rel) => <Tag color="purple">{rel}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status === "active" ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 200,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            Xem
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="⚠️ Xóa vĩnh viễn nhân khẩu này?"
            description="Dữ liệu sẽ bị xóa hoàn toàn khỏi hệ thống và không thể khôi phục!"
            onConfirm={() => handleDelete(record.key)}
            okText="Xóa vĩnh viễn"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
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
    form.setFieldsValue({
      fullName: record.fullName,
      dateOfBirth: dayjs(record.dateOfBirth),
      gender: record.gender, // "Nam" or "Nữ" - đúng cho Select
      idCard: record.idCard,
      household: record.householdId,
      relationship: record.relationship,
      phone: record.phone,
      status: record.status, // "active" or "inactive" - đúng cho Select
    });
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
        nationalId: values.idCard, // Backend uses 'nationalId', not 'idCard'
        phone: values.phone,
        status: values.status === "active" ? "ALIVE" : "MOVED_OUT",
      };

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
    Object.values(citizen).some((value) =>
      value.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  return (
    <Layout>
      <div>
        {/* Page Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Quản Lý Nhân Khẩu
          </Title>
        </div>

        {/* Action Bar */}
        <Card bordered={false} style={{ marginBottom: 16 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Input
              placeholder="Tìm kiếm nhân khẩu..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm nhân khẩu mới
            </Button>
          </Space>
        </Card>

        {/* Table */}
        <Card bordered={false}>
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
            scroll={{ x: 1400 }}
          />
        </Card>

        {/* View Modal */}
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
            <div style={{ padding: "10px 0" }}>
              <Card
                title="Thông tin cá nhân"
                bordered={false}
                style={{ marginBottom: 16 }}
              >
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#666" }}>Họ và tên:</strong>
                      <div style={{ fontSize: "16px", marginTop: "4px" }}>
                        {viewingCitizen.fullName}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: "#666" }}>Mã nhân khẩu:</strong>
                      <div style={{ fontSize: "16px", marginTop: "4px" }}>
                        <Tag color="blue">{viewingCitizen.id}</Tag>
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: "#666" }}>Ngày sinh:</strong>
                      <div style={{ fontSize: "16px", marginTop: "4px" }}>
                        {dayjs(viewingCitizen.dateOfBirth).format("DD/MM/YYYY")}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: "#666" }}>Giới tính:</strong>
                      <div style={{ marginTop: "4px" }}>
                        <Tag
                          color={
                            viewingCitizen.gender === "Nam" ? "blue" : "pink"
                          }
                        >
                          {viewingCitizen.gender}
                        </Tag>
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: "#666" }}>CCCD/CMND:</strong>
                      <div style={{ fontSize: "16px", marginTop: "4px" }}>
                        {viewingCitizen.idCard || (
                          <Tag color="default">Chưa có</Tag>
                        )}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: "#666" }}>Số điện thoại:</strong>
                      <div style={{ fontSize: "16px", marginTop: "4px" }}>
                        {viewingCitizen.phone || (
                          <Tag color="default">Chưa có</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </Space>
              </Card>

              <Card
                title="Thông tin hộ khẩu"
                bordered={false}
                style={{ marginBottom: 16 }}
              >
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#666" }}>Hộ khẩu:</strong>
                      <div style={{ fontSize: "16px", marginTop: "4px" }}>
                        {viewingCitizen.household === "Chưa có hộ khẩu" ? (
                          <Tag color="default">Chưa có hộ khẩu</Tag>
                        ) : (
                          <Tag color="blue">{viewingCitizen.household}</Tag>
                        )}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: "#666" }}>
                        Quan hệ với chủ hộ:
                      </strong>
                      <div style={{ marginTop: "4px" }}>
                        {viewingCitizen.relationship ? (
                          <Tag color="purple">
                            {viewingCitizen.relationship}
                          </Tag>
                        ) : (
                          <Tag color="default">N/A</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </Space>
              </Card>

              <Card title="Trạng thái" bordered={false}>
                <div>
                  <strong style={{ color: "#666" }}>
                    Trạng thái hiện tại:
                  </strong>
                  <div style={{ marginTop: "8px" }}>
                    <Tag
                      color={
                        viewingCitizen.status === "active" ? "green" : "default"
                      }
                      style={{ fontSize: "14px", padding: "4px 12px" }}
                    >
                      {viewingCitizen.status === "active"
                        ? "Hoạt động"
                        : "Không hoạt động"}
                    </Tag>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Modal>

        {/* Add/Edit Modal */}
        <Modal
          title={editingCitizen ? "Chỉnh sửa nhân khẩu" : "Thêm nhân khẩu mới"}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={700}
          okText="Lưu"
          cancelText="Hủy"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input placeholder="Nhập họ và tên đầy đủ" />
            </Form.Item>

            <Space style={{ width: "100%" }} size="large">
              <Form.Item
                name="dateOfBirth"
                label="Ngày sinh"
                rules={[{ required: true, message: "Vui lòng chọn ngày sinh" }]}
                style={{ flex: 1 }}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày sinh"
                />
              </Form.Item>

              <Form.Item
                name="gender"
                label="Giới tính"
                rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
                style={{ flex: 1 }}
              >
                <Select placeholder="Chọn giới tính">
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                </Select>
              </Form.Item>
            </Space>

            <Form.Item name="idCard" label="CCCD/CMND">
              <Input placeholder="Nhập số CCCD/CMND" maxLength={12} />
            </Form.Item>

            <Space style={{ width: "100%" }} size="large">
              <Form.Item
                name="household"
                label="Hộ khẩu (không bắt buộc - có thể gán sau)"
                style={{ flex: 1 }}
              >
                <Select
                  placeholder="Chọn hộ khẩu (hoặc bỏ trống)"
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
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

              <Form.Item
                name="relationship"
                label="Quan hệ với chủ hộ (nếu có)"
                style={{ flex: 1 }}
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
            </Space>

            <Form.Item name="phone" label="Số điện thoại">
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
              initialValue="active"
            >
              <Select placeholder="Chọn trạng thái">
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Không hoạt động</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default CitizenManagement;
