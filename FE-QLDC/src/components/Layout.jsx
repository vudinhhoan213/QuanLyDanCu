import { useState } from "react";
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Badge,
  Button,
} from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  GiftOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AuditOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isLeader = user?.role === "TO_TRUONG";

  // Menu items cho Leader (Tổ trưởng)
  const leaderMenuItems = [
    {
      key: "/leader/dashboard",
      icon: <HomeOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/leader/dashboard"),
    },
    {
      key: "/leader/households",
      icon: <TeamOutlined />,
      label: "Quản lý Hộ khẩu",
      onClick: () => navigate("/leader/households"),
    },
    {
      key: "/leader/citizens",
      icon: <UserOutlined />,
      label: "Quản lý Nhân khẩu",
      onClick: () => navigate("/leader/citizens"),
    },
    {
      key: "/leader/edit-requests",
      icon: <FileTextOutlined />,
      label: "Duyệt Yêu cầu",
      onClick: () => navigate("/leader/edit-requests"),
    },
    {
      key: "rewards",
      icon: <GiftOutlined />,
      label: "Khen thưởng",
      children: [
        {
          key: "/leader/reward-proposals",
          label: "Duyệt Đề xuất",
          onClick: () => navigate("/leader/reward-proposals"),
        },
        {
          key: "/leader/reward-events",
          label: "Sự kiện phát quà",
          onClick: () => navigate("/leader/reward-events"),
        },
        {
          key: "/leader/reward-distributions",
          label: "Phân phối quà",
          onClick: () => navigate("/leader/reward-distributions"),
        },
        {
          key: "/leader/student-achievements",
          label: "Thành tích học sinh",
          onClick: () => navigate("/leader/student-achievements"),
        },
      ],
    },
    {
      key: "/leader/audit-logs",
      icon: <AuditOutlined />,
      label: "Nhật ký",
      onClick: () => navigate("/leader/audit-logs"),
    },
  ];

  // Menu items cho Citizen (Công dân)
  const citizenMenuItems = [
    {
      key: "/citizen/dashboard",
      icon: <HomeOutlined />,
      label: "Trang chủ",
      onClick: () => navigate("/citizen/dashboard"),
    },
    {
      key: "/citizen/household",
      icon: <TeamOutlined />,
      label: "Hộ khẩu của tôi",
      onClick: () => navigate("/citizen/household"),
    },
    {
      key: "/citizen/submit-edit-request",
      icon: <FileTextOutlined />,
      label: "Yêu cầu chỉnh sửa",
      onClick: () => navigate("/citizen/submit-edit-request"),
    },
    {
      key: "/citizen/submit-reward-proposal",
      icon: <TrophyOutlined />,
      label: "Đề xuất khen thưởng",
      onClick: () => navigate("/citizen/submit-reward-proposal"),
    },
    {
      key: "/citizen/my-requests",
      icon: <FileTextOutlined />,
      label: "Yêu cầu của tôi",
      onClick: () => navigate("/citizen/my-requests"),
    },
    {
      key: "/citizen/my-rewards",
      icon: <GiftOutlined />,
      label: "Khen thưởng của tôi",
      onClick: () => navigate("/citizen/my-rewards"),
    },
  ];

  const menuItems = isLeader ? leaderMenuItems : citizenMenuItems;

  // User menu dropdown
  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: () => {
        logout();
        navigate("/login");
      },
    },
  ];

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: collapsed ? 16 : 20,
            fontWeight: "bold",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {collapsed ? "QLDC" : "Quản Lý Dân Cư"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>

      {/* Main Layout */}
      <AntLayout
        style={{ marginLeft: collapsed ? 80 : 200, transition: "all 0.2s" }}
      >
        {/* Header */}
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,21,41,0.08)",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Notifications */}
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                onClick={() => navigate("/notifications")}
              />
            </Badge>

            {/* User Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <Avatar icon={<UserOutlined />} />
                <span>{user?.fullName || user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: "24px",
            padding: 24,
            minHeight: 280,
            background: "#f0f2f5",
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
