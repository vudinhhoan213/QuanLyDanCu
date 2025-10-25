import React, { useState, useEffect } from "react";
import {
  Card,
  List,
  Tag,
  Typography,
  Space,
  Button,
  Avatar,
  Empty,
  Badge,
  Segmented,
  message,
  Spin,
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import Layout from "../components/Layout";
import notificationService from "../services/notificationService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text } = Typography;

const NotificationPage = () => {
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Map notification type to icon and color
  const getNotificationStyle = (type) => {
    const styleMap = {
      EDIT_REQUEST: { icon: FileTextOutlined, color: "#1890ff" },
      REWARD: { icon: GiftOutlined, color: "#52c41a" },
      SYSTEM: { icon: InfoCircleOutlined, color: "#722ed1" },
      GENERAL: { icon: BellOutlined, color: "#faad14" },
    };
    return styleMap[type] || styleMap.GENERAL;
  };

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log("📬 Fetching notifications...");

      const response = await notificationService.getAll();
      console.log("📬 Notifications response:", response);

      // Backend trả về { docs, total, page, limit }
      const notificationList = response.docs || [];

      setNotifications(notificationList);
      console.log(`✅ Loaded ${notificationList.length} notifications`);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      message.error("Không thể tải thông báo. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);

      // Update local state
      setNotifications(
        notifications.map((notif) =>
          notif._id === id
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );

      message.success("Đã đánh dấu đã đọc");
    } catch (error) {
      console.error("Error marking as read:", error);
      message.error("Không thể cập nhật");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !n.isRead)
        .map((n) => n._id);

      if (unreadIds.length === 0) {
        message.info("Không có thông báo nào chưa đọc");
        return;
      }

      await notificationService.markAllAsRead(unreadIds);

      // Update local state
      setNotifications(
        notifications.map((notif) => ({
          ...notif,
          isRead: true,
          readAt: new Date(),
        }))
      );

      message.success(`Đã đánh dấu ${unreadIds.length} thông báo là đã đọc`);
    } catch (error) {
      console.error("Error marking all as read:", error);
      message.error("Không thể cập nhật tất cả");
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.isRead;
    if (filter === "read") return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Layout>
      <Spin spinning={loading} tip="Đang tải thông báo...">
        <div>
          <div
            style={{
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space>
              <Title level={2} style={{ marginBottom: 0 }}>
                <BellOutlined /> Thông Báo
              </Title>
              {unreadCount > 0 && (
                <Badge
                  count={unreadCount}
                  style={{ backgroundColor: "#ff4d4f" }}
                />
              )}
            </Space>
            {unreadCount > 0 && (
              <Button type="primary" onClick={handleMarkAllAsRead}>
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>

          <Card bordered={false} style={{ marginBottom: 16 }}>
            <Segmented
              options={[
                { label: `Tất cả (${notifications.length})`, value: "all" },
                { label: `Chưa đọc (${unreadCount})`, value: "unread" },
                {
                  label: `Đã đọc (${notifications.length - unreadCount})`,
                  value: "read",
                },
              ]}
              value={filter}
              onChange={setFilter}
              block
            />
          </Card>

          <Card bordered={false}>
            {filteredNotifications.length === 0 ? (
              <Empty
                description={
                  filter === "unread"
                    ? "Không có thông báo chưa đọc"
                    : filter === "read"
                    ? "Không có thông báo đã đọc"
                    : "Không có thông báo nào"
                }
              />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={filteredNotifications}
                renderItem={(item) => {
                  const { icon: IconComponent, color } = getNotificationStyle(
                    item.type
                  );
                  return (
                    <List.Item
                      style={{
                        backgroundColor: item.isRead
                          ? "transparent"
                          : "#f0f5ff",
                        padding: "16px",
                        borderRadius: 8,
                        marginBottom: 12,
                        cursor: "pointer",
                        transition: "all 0.3s",
                      }}
                      onClick={() => !item.isRead && handleMarkAsRead(item._id)}
                      actions={[
                        !item.isRead && (
                          <Button
                            type="link"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(item._id);
                            }}
                          >
                            Đánh dấu đã đọc
                          </Button>
                        ),
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Badge dot={!item.isRead} offset={[-5, 5]}>
                            <Avatar
                              icon={<IconComponent />}
                              style={{
                                backgroundColor: color,
                                width: 48,
                                height: 48,
                              }}
                            />
                          </Badge>
                        }
                        title={
                          <Space>
                            <Text strong={!item.isRead}>{item.title}</Text>
                            {!item.isRead && (
                              <Tag color="blue" style={{ marginLeft: 8 }}>
                                Mới
                              </Tag>
                            )}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={4}>
                            <Text type="secondary">{item.message}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <ClockCircleOutlined />{" "}
                              {dayjs(item.createdAt).fromNow()}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </div>
      </Spin>
    </Layout>
  );
};

export default NotificationPage;
