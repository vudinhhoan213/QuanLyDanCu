import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Divider,
  message,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  GiftOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import {
  householdService,
  citizenService,
  editRequestService,
  rewardService,
} from "../../services";

const { Title, Text } = Typography;

const LeaderDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    households: { total: 0, increase: 0, percentage: 0 },
    citizens: { total: 0, increase: 0, percentage: 0 },
    pendingRequests: { total: 0, decrease: 0, percentage: 0 },
    rewards: { total: 0, increase: 0, percentage: 0 },
  });
  const [recentRequests, setRecentRequests] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all stats in parallel
        const [
          householdStats,
          citizenStats,
          requestStats,
          rewardStats,
          requests,
        ] = await Promise.all([
          householdService.getStats().catch(() => ({ total: 0 })),
          citizenService.getStats().catch(() => ({ total: 0 })),
          editRequestService.getStats().catch(() => ({ pending: 0 })),
          rewardService.proposals.getStats().catch(() => ({ total: 0 })),
          editRequestService
            .getAll({ limit: 5, status: "pending" })
            .catch(() => []),
        ]);

        // Update stats
        setStats({
          households: {
            total: householdStats.total || 0,
            increase: householdStats.lastMonthIncrease || 0,
            percentage: householdStats.percentageChange || 0,
          },
          citizens: {
            total: citizenStats.total || 0,
            increase: citizenStats.lastMonthIncrease || 0,
            percentage: citizenStats.percentageChange || 0,
          },
          pendingRequests: {
            total: requestStats.pending || 0,
            decrease: requestStats.lastMonthChange || 0,
            percentage: requestStats.percentageChange || 0,
          },
          rewards: {
            total: rewardStats.total || 0,
            increase: rewardStats.thisMonthTotal || 0,
            percentage: rewardStats.percentageChange || 0,
          },
        });

        // Update recent requests
        // Handle response structure: { docs, total } or array
        const requestsData = requests.docs || requests || [];
        if (Array.isArray(requestsData)) {
          setRecentRequests(
            requestsData.slice(0, 5).map((req, index) => ({
              key: req._id || index,
              id: req.code || req._id,
              citizen: req.citizenId?.fullName || req.fullName || "N/A",
              type: req.requestType || "N/A",
              date: req.createdAt || new Date().toISOString(),
              status: req.status || "pending",
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        message.error("Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const requestColumns = [
    {
      title: "Mã yêu cầu",
      dataIndex: "id",
      key: "id",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Công dân",
      dataIndex: "citizen",
      key: "citizen",
    },
    {
      title: "Loại yêu cầu",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Ngày gửi",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusConfig = {
          pending: { color: "gold", text: "Chờ duyệt" },
          approved: { color: "green", text: "Đã duyệt" },
          rejected: { color: "red", text: "Từ chối" },
        };
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/leader/edit-requests/${record.id}`)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <Layout>
      <div>
        {/* Page Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Dashboard Tổ Trưởng
          </Title>
          <Text type="secondary">Tổng quan hệ thống quản lý dân cư</Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Tổng Hộ Khẩu"
                value={stats.households.total}
                prefix={<TeamOutlined style={{ color: "#1890ff" }} />}
                suffix={
                  <Space size={4} style={{ fontSize: 14 }}>
                    <ArrowUpOutlined style={{ color: "#3f8600" }} />
                    <Text type="success">{stats.households.percentage}%</Text>
                  </Space>
                }
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                +{stats.households.increase} so với tháng trước
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Tổng Công Dân"
                value={stats.citizens.total}
                prefix={<UserOutlined style={{ color: "#52c41a" }} />}
                suffix={
                  <Space size={4} style={{ fontSize: 14 }}>
                    <ArrowUpOutlined style={{ color: "#3f8600" }} />
                    <Text type="success">{stats.citizens.percentage}%</Text>
                  </Space>
                }
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                +{stats.citizens.increase} so với tháng trước
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Yêu Cầu Chờ Duyệt"
                value={stats.pendingRequests.total}
                prefix={<FileTextOutlined style={{ color: "#faad14" }} />}
                suffix={
                  <Space size={4} style={{ fontSize: 14 }}>
                    <ArrowDownOutlined style={{ color: "#cf1322" }} />
                    <Text type="danger">
                      {Math.abs(stats.pendingRequests.percentage)}%
                    </Text>
                  </Space>
                }
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {stats.pendingRequests.decrease} so với tháng trước
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Khen Thưởng Tháng Này"
                value={stats.rewards.total}
                prefix={<GiftOutlined style={{ color: "#eb2f96" }} />}
                suffix={
                  <Space size={4} style={{ fontSize: 14 }}>
                    <ArrowUpOutlined style={{ color: "#3f8600" }} />
                    <Text type="success">{stats.rewards.percentage}%</Text>
                  </Space>
                }
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                +{stats.rewards.increase} so với tháng trước
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Recent Requests Table */}
        <Card
          title={
            <Space>
              <FileTextOutlined />
              <span>Yêu cầu chỉnh sửa gần đây</span>
            </Space>
          }
          extra={
            <Button
              type="primary"
              onClick={() => navigate("/leader/edit-requests")}
            >
              Xem tất cả
            </Button>
          }
          bordered={false}
        >
          <Table
            columns={requestColumns}
            dataSource={recentRequests}
            pagination={{ pageSize: 5 }}
            loading={loading}
            scroll={{ x: 800 }}
          />
        </Card>

        {/* Quick Actions */}
        <Divider />
        <Card title="Thao tác nhanh" bordered={false} style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Button
                type="default"
                icon={<TeamOutlined />}
                size="large"
                block
                onClick={() => navigate("/leader/households")}
              >
                Quản lý Hộ khẩu
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                type="default"
                icon={<UserOutlined />}
                size="large"
                block
                onClick={() => navigate("/leader/citizens")}
              >
                Quản lý Công dân
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                type="default"
                icon={<FileTextOutlined />}
                size="large"
                block
                onClick={() => navigate("/leader/edit-requests")}
              >
                Duyệt Yêu cầu
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                type="default"
                icon={<GiftOutlined />}
                size="large"
                block
                onClick={() => navigate("/leader/reward-proposals")}
              >
                Duyệt Khen thưởng
              </Button>
            </Col>
          </Row>
        </Card>
      </div>
    </Layout>
  );
};

export default LeaderDashboard;
