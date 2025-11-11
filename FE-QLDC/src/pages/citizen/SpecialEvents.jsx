import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Descriptions,
  Alert,
  Empty,
  Spin,
} from "antd";
import {
  GiftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import Layout from "../../components/Layout";
import { rewardService } from "../../services";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

const SpecialEvents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await rewardService.events.getAll({
        type: "SPECIAL",
        limit: 100,
      });

      const allEvents = response.docs || [];
      const now = new Date();

      // Lọc sự kiện: chỉ hiển thị OPEN, còn thời hạn, còn slot
      const availableEvents = allEvents
        .map((event) => {
          // Chỉ hiển thị sự kiện đang mở
          if (event.status !== "OPEN") return null;

          // Kiểm tra thời gian
          const isInTimeRange =
            (!event.startDate || now >= new Date(event.startDate)) &&
            (!event.endDate || now <= new Date(event.endDate));

          if (!isInTimeRange) return null;

          // Kiểm tra slot (đã có từ backend)
          const registeredCount = event.registeredCount || 0;
          const hasSlot =
            event.maxSlots === 0 || registeredCount < event.maxSlots;

          if (!hasSlot) return null;

          return {
            ...event,
            registeredCount,
            availableSlots:
              event.maxSlots === 0
                ? -1
                : Math.max(0, event.maxSlots - registeredCount),
          };
        })
        .filter((e) => e !== null);

      // Kiểm tra đã đăng ký chưa cho từng sự kiện
      // Lấy tất cả đăng ký của user một lần để tối ưu
      let allMyRegistrations = [];
      let registeredEventIds = new Set();

      try {
        const allRegResponse =
          await rewardService.distributions.getMyRegistrations({
            limit: 100, // Lấy tất cả đăng ký
          });
        allMyRegistrations = allRegResponse.docs || [];
        console.log(
          `📋 Loaded ${allMyRegistrations.length} total registrations for special events from server`
        );

        // Map registration event IDs để check nhanh
        // Xử lý cả trường hợp event là object hoặc string ID
        registeredEventIds = new Set(
          allMyRegistrations
            .map((reg) => {
              if (!reg.event) return null;
              // Nếu event là object, lấy _id hoặc id
              if (typeof reg.event === "object") {
                return String(reg.event._id || reg.event.id || reg.event);
              }
              // Nếu event là string, return luôn
              return String(reg.event);
            })
            .filter(Boolean)
        );

        // Lưu vào localStorage để dùng khi reload
        const eventIdsArray = Array.from(registeredEventIds);
        localStorage.setItem(
          "registeredEventIds",
          JSON.stringify(eventIdsArray)
        );
        console.log(`📋 Registered event IDs from server:`, eventIdsArray);
      } catch (error) {
        // Nếu lỗi 403 hoặc các lỗi khác, thử lấy từ localStorage
        if (error.response?.status === 403) {
          console.warn(
            "⚠️ Cannot fetch registrations (403 Forbidden) - using localStorage cache"
          );
        } else {
          console.error("❌ Error fetching all registrations:", error);
        }

        // Thử lấy từ localStorage nếu có
        try {
          const cachedIds = localStorage.getItem("registeredEventIds");
          if (cachedIds) {
            const parsedIds = JSON.parse(cachedIds);
            registeredEventIds = new Set(parsedIds);
            console.log(
              `📋 Loaded ${parsedIds.length} registered event IDs from localStorage:`,
              parsedIds
            );
          }
        } catch (e) {
          console.warn("⚠️ Could not read from localStorage:", e);
        }
      }

      const eventsWithRegistrationStatus = availableEvents.map((event) => {
        // Check xem event này đã được đăng ký chưa
        // So sánh bằng string để tránh vấn đề ObjectId
        const eventId = String(event._id);
        const isRegistered = registeredEventIds.has(eventId);

        if (isRegistered) {
          console.log(
            `✅ Special Event ${eventId} (${event.name}) - Already registered`
          );
        }

        return {
          ...event,
          isRegistered,
        };
      });

      setEvents(eventsWithRegistrationStatus);
    } catch (error) {
      console.error("Error fetching events:", error);
      message.error("Không thể tải danh sách sự kiện đặc biệt");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (event) => {
    setViewingEvent(event);
    setIsModalVisible(true);
  };

  const handleRegister = async () => {
    if (!viewingEvent) return;

    try {
      setRegistering(true);
      console.log("📤 Registering for special event:", viewingEvent._id);

      const result = await rewardService.distributions.register(
        viewingEvent._id,
        {
          quantity: 1,
        }
      );

      console.log("✅ Registration successful:", result);

      // Lưu event ID vào localStorage để giữ trạng thái khi reload
      try {
        const cachedIds = localStorage.getItem("registeredEventIds");
        const eventIdsSet = cachedIds
          ? new Set(JSON.parse(cachedIds))
          : new Set();
        eventIdsSet.add(String(viewingEvent._id));
        localStorage.setItem(
          "registeredEventIds",
          JSON.stringify(Array.from(eventIdsSet))
        );
        console.log(`💾 Saved event ${viewingEvent._id} to localStorage`);
      } catch (e) {
        console.warn("⚠️ Could not save to localStorage:", e);
      }

      // Cập nhật state ngay lập tức để UI phản hồi ngay - chuyển từ "Đăng ký ngay" sang "Đã đăng ký"
      const updatedEvent = {
        ...viewingEvent,
        isRegistered: true,
        registeredCount: (viewingEvent.registeredCount || 0) + 1,
        availableSlots:
          viewingEvent.maxSlots === 0
            ? -1
            : Math.max(
                0,
                (viewingEvent.availableSlots || viewingEvent.maxSlots) - 1
              ),
      };

      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event._id === viewingEvent._id ? updatedEvent : event
        )
      );

      // Cập nhật viewingEvent để modal hiển thị đúng trạng thái "Đã đăng ký"
      setViewingEvent(updatedEvent);

      // Hiển thị thông báo thành công
      message.success({
        content:
          "✅ Đăng ký thành công! Đăng ký đã được thêm vào lịch sử đăng ký của bạn.",
        duration: 4,
      });

      // Đánh dấu đã có đăng ký mới để refresh trang MyRegistrations
      const timestamp = Date.now().toString();
      // Đảm bảo result có đầy đủ thông tin cần thiết
      const registrationData = {
        _id: result._id || result.id,
        event: result.event || {
          _id: viewingEvent._id,
          name: viewingEvent.name,
        },
        citizen: result.citizen,
        household: result.household,
        quantity: result.quantity || 1,
        unitValue: result.unitValue || 0,
        totalValue: result.totalValue || 0,
        status: result.status || "REGISTERED",
        createdAt: result.createdAt || new Date().toISOString(),
        note: result.note,
      };

      sessionStorage.setItem("registration_updated", timestamp);
      sessionStorage.setItem("registration_event_id", viewingEvent._id);
      sessionStorage.setItem(
        "registration_data",
        JSON.stringify(registrationData)
      );
      console.log(
        "💾 Saved registration data to sessionStorage:",
        registrationData
      );

      // Dispatch custom event để refresh ngay trong cùng tab
      window.dispatchEvent(
        new CustomEvent("registrationUpdated", {
          detail: {
            eventId: viewingEvent._id,
            timestamp,
            registrationData: registrationData,
          },
        })
      );

      // Refresh danh sách sự kiện sau khi đăng ký để đảm bảo đồng bộ với server
      // Delay đủ lâu để server đã cập nhật xong registration
      setTimeout(async () => {
        await fetchEvents();
      }, 1500);

      // Đóng modal sau 1.5 giây để user thấy rõ trạng thái "Đã đăng ký"
      setTimeout(() => {
        setIsModalVisible(false);
        setViewingEvent(null);
      }, 1500);
    } catch (error) {
      console.error("❌ Error registering:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);

      const errorMsg =
        error.response?.data?.message || "Không thể đăng ký. Vui lòng thử lại!";

      // Nếu lỗi 409 (đã đăng ký), cập nhật UI ngay lập tức
      if (error.response?.status === 409) {
        message.info({
          content:
            "Bạn đã đăng ký sự kiện này rồi. Đang cập nhật trạng thái...",
          duration: 3,
        });

        // Lưu event ID vào localStorage để giữ trạng thái khi reload
        try {
          const cachedIds = localStorage.getItem("registeredEventIds");
          const eventIdsSet = cachedIds
            ? new Set(JSON.parse(cachedIds))
            : new Set();
          eventIdsSet.add(String(viewingEvent._id));
          localStorage.setItem(
            "registeredEventIds",
            JSON.stringify(Array.from(eventIdsSet))
          );
          console.log(
            `💾 Saved event ${viewingEvent._id} to localStorage (409 error)`
          );
        } catch (e) {
          console.warn("⚠️ Could not save to localStorage:", e);
        }

        // Cập nhật viewingEvent để hiển thị trạng thái đã đăng ký
        const updatedEvent = {
          ...viewingEvent,
          isRegistered: true,
        };
        setViewingEvent(updatedEvent);

        // Cập nhật events ngay lập tức
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event._id === viewingEvent._id ? updatedEvent : event
          )
        );

        // Đánh dấu đã có đăng ký để refresh trang MyRegistrations
        const timestamp = Date.now().toString();
        sessionStorage.setItem("registration_updated", timestamp);
        sessionStorage.setItem("registration_event_id", viewingEvent._id);

        // Dispatch custom event để refresh ngay trong cùng tab
        window.dispatchEvent(
          new CustomEvent("registrationUpdated", {
            detail: {
              eventId: viewingEvent._id,
              timestamp,
            },
          })
        );

        // KHÔNG gọi fetchEvents() vì đã biết là đã đăng ký rồi
        // Chỉ refresh sau một chút để đảm bảo đồng bộ (nếu cần)
        setTimeout(async () => {
          try {
            await fetchEvents();
          } catch (err) {
            console.warn(
              "⚠️ Could not refresh events, but registration status is already updated"
            );
          }
        }, 2000);
      } else {
        message.error(errorMsg);
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
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
                <TrophyOutlined /> Sự kiện Đặc biệt
              </Title>
              <Text type="secondary">
                Sự kiện khen thưởng, thành tích và mời bạn
              </Text>
            </Col>
            <Col>
              <Space>
                <Button onClick={() => navigate("/citizen/events")}>
                  Tất cả sự kiện
                </Button>
                <Button
                  type="primary"
                  icon={<TrophyOutlined />}
                  onClick={() => navigate("/citizen/submit-reward-proposal")}
                >
                  Khai báo thành tích
                </Button>
              </Space>
            </Col>
          </Row>

          <Alert
            message="Sự kiện đặc biệt"
            description="Các sự kiện này dành cho những công dân có thành tích xuất sắc hoặc được mời đặc biệt. Bạn có thể khai báo thành tích để được xem xét tham gia."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {events.length === 0 ? (
            <Empty
              description="Hiện tại không có sự kiện đặc biệt nào đang mở đăng ký"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Row gutter={[16, 16]}>
              {events.map((event) => (
                <Col xs={24} sm={24} md={12} lg={8} key={event._id}>
                  <Card
                    hoverable
                    style={{
                      height: "100%",
                      border: event.isRegistered
                        ? "2px solid #52c41a"
                        : "1px solid #d9d9d9",
                    }}
                    actions={[
                      <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(event)}
                      >
                        Xem
                      </Button>,
                      event.isRegistered ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          Đã đăng ký
                        </Tag>
                      ) : (
                        <Button
                          type="primary"
                          onClick={() => handleViewDetails(event)}
                        >
                          Đăng ký ngay
                        </Button>
                      ),
                    ]}
                  >
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      <Title level={4} style={{ margin: 0 }}>
                        {event.name}
                      </Title>
                      <Tag color="orange">Đặc biệt</Tag>
                      {event.isRegistered && (
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                          Đã đăng ký
                        </Tag>
                      )}
                      <div>
                        <Text type="secondary">
                          <CalendarOutlined />{" "}
                          {event.startDate && event.endDate
                            ? `${dayjs(event.startDate).format(
                                "DD/MM/YYYY"
                              )} - ${dayjs(event.endDate).format("DD/MM/YYYY")}`
                            : event.date
                            ? dayjs(event.date).format("DD/MM/YYYY")
                            : "N/A"}
                        </Text>
                      </div>
                      <div>
                        <Text type="secondary">
                          Slot còn lại:{" "}
                          {event.availableSlots === -1 || event.maxSlots === 0
                            ? "Không giới hạn"
                            : `${event.availableSlots}/${event.maxSlots}`}
                        </Text>
                      </div>
                      {event.description && (
                        <Paragraph
                          ellipsis={{ rows: 2, expandable: false }}
                          style={{ margin: 0, fontSize: "13px" }}
                        >
                          {event.description}
                        </Paragraph>
                      )}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Space>
      </Card>

      {/* Registration Modal */}
      <Modal
        title={
          <Space>
            <TrophyOutlined />
            <span>Đăng ký sự kiện đặc biệt</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setViewingEvent(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalVisible(false);
              setViewingEvent(null);
            }}
          >
            {viewingEvent?.isRegistered ? "Đóng" : "Hủy"}
          </Button>,
          viewingEvent && !viewingEvent.isRegistered && (
            <Button
              key="register"
              type="primary"
              loading={registering}
              onClick={handleRegister}
            >
              Xác nhận đăng ký
            </Button>
          ),
        ]}
        width={600}
      >
        {viewingEvent && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {viewingEvent.isRegistered && (
              <Alert
                message="✅ Đã đăng ký thành công!"
                description="Bạn đã đăng ký sự kiện này. Vui lòng chờ thông báo khi đến lịch nhận quà."
                type="success"
                showIcon
                closable={false}
              />
            )}

            <Descriptions bordered column={1}>
              <Descriptions.Item label="Tên sự kiện">
                {viewingEvent.name}
              </Descriptions.Item>
              <Descriptions.Item label="Loại">
                <Tag color="orange">Đặc biệt</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian đăng ký">
                {viewingEvent.startDate && viewingEvent.endDate ? (
                  <div>
                    <div>
                      Từ:{" "}
                      {dayjs(viewingEvent.startDate).format("DD/MM/YYYY HH:mm")}
                    </div>
                    <div>
                      Đến:{" "}
                      {dayjs(viewingEvent.endDate).format("DD/MM/YYYY HH:mm")}
                    </div>
                  </div>
                ) : viewingEvent.date ? (
                  dayjs(viewingEvent.date).format("DD/MM/YYYY")
                ) : (
                  "N/A"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Slot còn lại">
                {viewingEvent.availableSlots === -1 ||
                viewingEvent.maxSlots === 0
                  ? "Không giới hạn"
                  : `${viewingEvent.availableSlots || 0}/${
                      viewingEvent.maxSlots
                    }`}
              </Descriptions.Item>
              {viewingEvent.budget && (
                <Descriptions.Item label="Giá trị quà">
                  {viewingEvent.budget.toLocaleString("vi-VN")} VNĐ
                </Descriptions.Item>
              )}
              {viewingEvent.description && (
                <Descriptions.Item label="Mô tả">
                  {viewingEvent.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            {!viewingEvent.isRegistered && (
              <Alert
                message="Lưu ý"
                description="Sự kiện đặc biệt có thể yêu cầu bạn khai báo thành tích hoặc đáp ứng điều kiện nhất định. Vui lòng liên hệ tổ trưởng nếu cần hỗ trợ."
                type="warning"
                showIcon
              />
            )}
          </Space>
        )}
      </Modal>
    </Layout>
  );
};

export default SpecialEvents;
