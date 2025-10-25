import React, { useState } from "react";
import {
  Card,
  Table,
  Input,
  Space,
  Tag,
  Typography,
  DatePicker,
  Select,
} from "antd";
import {
  SearchOutlined,
  AuditOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import Layout from "../../components/Layout";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AuditLogs = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");

  // Mock data
  const logs = [
    {
      key: "1",
      id: "LOG-001",
      user: "Admin",
      action: "CREATE",
      entity: "Household",
      entityId: "HK-001",
      description: "Tạo hộ khẩu mới HK-001",
      timestamp: "2024-10-20 14:30:00",
      ip: "192.168.1.1",
    },
    {
      key: "2",
      id: "LOG-002",
      user: "Admin",
      action: "UPDATE",
      entity: "Citizen",
      entityId: "NK-001",
      description: "Cập nhật thông tin nhân khẩu NK-001",
      timestamp: "2024-10-20 13:15:00",
      ip: "192.168.1.1",
    },
    {
      key: "3",
      id: "LOG-003",
      user: "User123",
      action: "APPROVE",
      entity: "EditRequest",
      entityId: "REQ-001",
      description: "Phê duyệt yêu cầu chỉnh sửa REQ-001",
      timestamp: "2024-10-19 10:45:00",
      ip: "192.168.1.2",
    },
  ];

  const actionConfig = {
    CREATE: { color: "green", text: "Tạo mới" },
    UPDATE: { color: "blue", text: "Cập nhật" },
    DELETE: { color: "red", text: "Xóa" },
    APPROVE: { color: "cyan", text: "Phê duyệt" },
    REJECT: { color: "orange", text: "Từ chối" },
  };

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Người dùng",
      dataIndex: "user",
      key: "user",
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: "Hành động",
      dataIndex: "action",
      key: "action",
      render: (action) => {
        const config = actionConfig[action];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Đối tượng",
      dataIndex: "entity",
      key: "entity",
    },
    {
      title: "Mã đối tượng",
      dataIndex: "entityId",
      key: "entityId",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
    },
  ];

  const filteredLogs = logs.filter((log) => {
    const matchSearch = Object.values(log).some((value) =>
      value.toString().toLowerCase().includes(searchText.toLowerCase())
    );
    const matchAction =
      selectedAction === "all" || log.action === selectedAction;
    return matchSearch && matchAction;
  });

  return (
    <Layout>
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            <AuditOutlined /> Nhật Ký Hệ Thống
          </Title>
        </div>

        <Card bordered={false} style={{ marginBottom: 16 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space>
              <Input
                placeholder="Tìm kiếm..."
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
              <Select
                style={{ width: 150 }}
                value={selectedAction}
                onChange={setSelectedAction}
              >
                <Option value="all">Tất cả</Option>
                <Option value="CREATE">Tạo mới</Option>
                <Option value="UPDATE">Cập nhật</Option>
                <Option value="DELETE">Xóa</Option>
                <Option value="APPROVE">Phê duyệt</Option>
                <Option value="REJECT">Từ chối</Option>
              </Select>
              <RangePicker format="DD/MM/YYYY" />
            </Space>
          </Space>
        </Card>

        <Card bordered={false}>
          <Table
            columns={columns}
            dataSource={filteredLogs}
            loading={loading}
            pagination={{
              total: filteredLogs.length,
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} bản ghi`,
            }}
            scroll={{ x: 1400 }}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default AuditLogs;
