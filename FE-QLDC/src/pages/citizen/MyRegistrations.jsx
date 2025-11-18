import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  message,
  Button,
  Descriptions,
  Modal,
  QRCode,
} from "antd";
import {
  GiftOutlined,
  PrinterOutlined,
  QrcodeOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import Layout from "../../components/Layout";
import { rewardService } from "../../services";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const MyRegistrations = () => {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [viewingRegistration, setViewingRegistration] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchRegistrations = useCallback(async (page, pageSize) => {
    try {
      setLoading(true);
      console.log(`📋 [MyRegistrations] ===== FETCHING REGISTRATIONS =====`);
      console.log(`📋 [MyRegistrations] Page: ${page}, PageSize: ${pageSize}`);

      const response = await rewardService.distributions.getMyRegistrations({
        page: page,
        limit: pageSize,
      });

      console.log(`📋 [MyRegistrations] ===== API RESPONSE =====`);
      console.log(
        `📋 [MyRegistrations] Full response:`,
        JSON.stringify(response, null, 2)
      );
      console.log(`📋 [MyRegistrations] Response type:`, typeof response);
      console.log(`📋 [MyRegistrations] Has docs:`, !!response.docs);
      console.log(
        `📋 [MyRegistrations] Docs length:`,
        response.docs?.length || 0
      );
      console.log(`📋 [MyRegistrations] Total:`, response.total || 0);

      const regList = response.docs || [];

      if (regList.length > 0) {
        console.log(
          `✅ [MyRegistrations] ===== FOUND ${regList.length} REGISTRATIONS =====`
        );
        regList.forEach((reg, index) => {
          console.log(`📋 [MyRegistrations] Registration ${index + 1}:`, {
            id: reg._id,
            eventId: reg.event?._id || reg.event,
            eventName: reg.event?.name,
            eventType: typeof reg.event,
            eventIsObject: typeof reg.event === "object",
            citizenId: reg.citizen,
            householdId: reg.household,
            createdAt: reg.createdAt,
          });
        });
      } else {
        console.log(`⚠️ [MyRegistrations] ===== NO REGISTRATIONS FOUND =====`);
        console.log(`⚠️ [MyRegistrations] This could mean:`);
        console.log(
          `⚠️ [MyRegistrations] 1. User hasn't registered for any events`
        );
        console.log(`⚠️ [MyRegistrations] 2. API returned empty array`);
        console.log(`⚠️ [MyRegistrations] 3. Filter might be too restrictive`);
      }

      // Merge với registrations hiện tại để tránh mất optimistic updates
      setRegistrations((prev) => {
        // Tạo map từ server data
        const serverRegMap = new Map();
        regList.forEach((reg) => {
          serverRegMap.set(reg._id, { key: reg._id, ...reg });
        });

        // Merge với existing registrations
        const existingRegMap = new Map();
        prev.forEach((reg) => {
          existingRegMap.set(reg._id, reg);
        });

        // Ưu tiên server data, nhưng giữ lại những registration chưa có trong server (optimistic)
        const merged = [];

        // Thêm server data trước
        serverRegMap.forEach((reg, id) => {
          merged.push(reg);
        });

        // Thêm optimistic updates chưa có trong server (nếu có)
        existingRegMap.forEach((reg, id) => {
          if (!serverRegMap.has(id)) {
            // Chỉ thêm nếu là registration mới (có timestamp gần đây)
            const regAge =
              Date.now() - new Date(reg.createdAt || Date.now()).getTime();
            if (regAge < 60000) {
              // Chỉ giữ lại nếu tạo trong vòng 1 phút
              merged.push(reg);
            }
          }
        });

        // Sắp xếp theo createdAt mới nhất
        merged.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        console.log(
          `✅ [MyRegistrations] Merged ${merged.length} registrations (${regList.length} from server, ${prev.length} existing)`
        );
        return merged;
      });

      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: response.total || regList.length,
      }));

      console.log(`✅ [MyRegistrations] ===== STATE UPDATED =====`);
      console.log(
        `✅ [MyRegistrations] Registrations in state: ${regList.length}`
      );
      console.log(
        `✅ [MyRegistrations] Total in pagination: ${response.total || 0}`
      );
    } catch (error) {
      console.error("❌ [MyRegistrations] ===== ERROR FETCHING ===== ");
      console.error("❌ [MyRegistrations] Error:", error);
      console.error("❌ [MyRegistrations] Error message:", error.message);
      console.error(
        "❌ [MyRegistrations] Error response:",
        error.response?.data
      );
      console.error(
        "❌ [MyRegistrations] Error status:",
        error.response?.status
      );
      console.error("❌ [MyRegistrations] Error config:", error.config);

      if (error.response?.status === 403) {
        message.warning({
          content:
            "Không có quyền truy cập lịch sử đăng ký. Vui lòng đăng nhập lại hoặc kiểm tra quyền truy cập.",
          duration: 5,
        });
      } else if (error.response?.status === 404) {
        message.warning({
          content:
            "Không tìm thấy thông tin công dân. Vui lòng kiểm tra lại tài khoản.",
          duration: 5,
        });
      } else {
        message.error({
          content: `Không thể tải lịch sử đăng ký: ${
            error.response?.data?.message || error.message
          }`,
          duration: 5,
        });
      }

      setRegistrations([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
      console.log(`✅ [MyRegistrations] ===== FETCH COMPLETED =====`);
    }
  }, []);

  useEffect(() => {
    console.log(
      "🔄 [MyRegistrations] useEffect triggered - fetching registrations"
    );
    fetchRegistrations(pagination.current, pagination.pageSize);
  }, [pagination.current, pagination.pageSize, fetchRegistrations, refreshKey]);

  // Force refresh khi component mount hoặc khi focus vào tab
  useEffect(() => {
    const handleFocus = () => {
      console.log("🔄 [MyRegistrations] Window focused - checking for updates");
      const registrationUpdated = sessionStorage.getItem(
        "registration_updated"
      );
      if (registrationUpdated) {
        console.log(
          "🔄 [MyRegistrations] Found registration update flag - refreshing after 1s"
        );
        // Delay 1s để đảm bảo server đã lưu xong
        setTimeout(() => {
          setRefreshKey((k) => k + 1);
          setPagination((prev) => ({ ...prev, current: 1 }));
        }, 1000);
      } else {
        // Nếu không có flag, vẫn refresh để đảm bảo dữ liệu mới nhất
        console.log(
          "🔄 [MyRegistrations] No update flag, but refreshing to ensure latest data"
        );
        setTimeout(() => {
          setRefreshKey((k) => k + 1);
        }, 500);
      }
    };

    // Refresh ngay khi mount với delay nhỏ
    const mountTimer = setTimeout(() => {
      handleFocus();
    }, 300);

    window.addEventListener("focus", handleFocus);
    return () => {
      clearTimeout(mountTimer);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Lắng nghe sự kiện refresh từ các trang khác
  useEffect(() => {
    const refreshList = () => {
      console.log("🔄 [MyRegistrations] Refreshing registrations list...");
      // Reset về trang 1 và fetch lại
      setPagination((prev) => {
        if (prev.current !== 1) {
          console.log("🔄 [MyRegistrations] Resetting to page 1");
          return { ...prev, current: 1 };
        }
        return prev;
      });
      // Tăng refreshKey để force refresh
      setRefreshKey((k) => {
        const newKey = k + 1;
        console.log(`🔄 [MyRegistrations] Refresh key updated to: ${newKey}`);
        return newKey;
      });
    };

    const handleStorageChange = (e) => {
      if (e.key === "registration_updated") {
        console.log(
          "🔄 [MyRegistrations] Registration updated (storage), refreshing..."
        );

        // Thử lấy registration data từ storage
        try {
          const registrationDataStr =
            sessionStorage.getItem("registration_data");
          if (registrationDataStr) {
            const registrationData = JSON.parse(registrationDataStr);
            console.log(
              "✅ [MyRegistrations] Adding registration from storage to state"
            );

            setRegistrations((prev) => {
              const exists = prev.some(
                (reg) => reg._id === registrationData._id
              );
              if (!exists) {
                return [
                  { key: registrationData._id, ...registrationData },
                  ...prev,
                ];
              }
              return prev;
            });
          }
        } catch (e) {
          console.error(
            "❌ [MyRegistrations] Error parsing registration data from storage:",
            e
          );
        }

        // Refresh ngay lập tức từ server
        refreshList();
      }
    };

    // Lắng nghe custom event (cho cùng tab)
    const handleCustomEvent = (e) => {
      console.log(
        "🔄 [MyRegistrations] Custom registration event received:",
        e.detail
      );

      // Nếu có registrationData, thêm vào state ngay lập tức (optimistic update)
      if (e.detail?.registrationData) {
        const newRegistration = e.detail.registrationData;
        console.log(
          "✅ [MyRegistrations] Adding new registration to state immediately:",
          newRegistration
        );

        setRegistrations((prev) => {
          // Kiểm tra xem đã có chưa để tránh duplicate
          const exists = prev.some((reg) => reg._id === newRegistration._id);
          if (exists) {
            console.log(
              "⚠️ [MyRegistrations] Registration already exists in state"
            );
            return prev;
          }

          // Thêm vào đầu danh sách (mới nhất)
          const updated = [
            { key: newRegistration._id, ...newRegistration },
            ...prev,
          ];
          console.log(
            `✅ [MyRegistrations] Added registration, total: ${updated.length}`
          );
          return updated;
        });

        // Cập nhật pagination
        setPagination((prev) => ({
          ...prev,
          total: prev.total + 1,
        }));
      }

      // Refresh ngay lập tức từ server (delay nhỏ để server kịp cập nhật)
      setTimeout(() => {
        console.log(
          "🔄 [MyRegistrations] Executing refresh after custom event"
        );
        refreshList();
        // Xóa flag sau khi refresh
        setTimeout(() => {
          sessionStorage.removeItem("registration_updated");
          sessionStorage.removeItem("registration_event_id");
          sessionStorage.removeItem("registration_data");
        }, 1000);
      }, 1000);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("registrationUpdated", handleCustomEvent);

    // Kiểm tra khi component mount
    const registrationUpdated = sessionStorage.getItem("registration_updated");
    const registrationDataStr = sessionStorage.getItem("registration_data");

    if (registrationUpdated && registrationDataStr) {
      console.log(
        "🔄 [MyRegistrations] Found registration update flag and data on mount"
      );

      try {
        const registrationData = JSON.parse(registrationDataStr);
        console.log(
          "✅ [MyRegistrations] Parsed registration data:",
          registrationData
        );

        // Thêm vào state ngay lập tức (optimistic update)
        setRegistrations((prev) => {
          const exists = prev.some((reg) => reg._id === registrationData._id);
          if (!exists) {
            console.log(
              "✅ [MyRegistrations] Adding registration from sessionStorage to state"
            );
            return [
              { key: registrationData._id, ...registrationData },
              ...prev,
            ];
          }
          return prev;
        });

        // Cập nhật pagination
        setPagination((prev) => ({
          ...prev,
          total: prev.total + 1,
        }));
      } catch (e) {
        console.error(
          "❌ [MyRegistrations] Error parsing registration data:",
          e
        );
      }

      // Refresh ngay lập tức từ server
      setTimeout(() => {
        console.log("🔄 [MyRegistrations] Executing refresh on mount");
        refreshList();
        // Xóa flag sau khi refresh
        sessionStorage.removeItem("registration_updated");
        sessionStorage.removeItem("registration_event_id");
        sessionStorage.removeItem("registration_data");
      }, 500);
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("registrationUpdated", handleCustomEvent);
    };
  }, []);

  const handleViewDetails = (registration) => {
    setViewingRegistration(registration);
    setIsModalVisible(true);
  };

  const handlePrint = (registration) => {
    // TODO: Implement print functionality
    message.info("Tính năng in giấy báo đang được phát triển");
  };

  const handleShowQR = (registration) => {
    setViewingRegistration(registration);
    setIsQRModalVisible(true);
  };

  const handleManualRefresh = () => {
    console.log("🔄 [MyRegistrations] Manual refresh triggered");
    message.info("Đang làm mới danh sách đăng ký...");
    setRefreshKey((k) => k + 1);
    setPagination((prev) => ({ ...prev, current: 1 }));
    // Xóa các flag để tránh refresh lại
    sessionStorage.removeItem("registration_updated");
    sessionStorage.removeItem("registration_event_id");
    sessionStorage.removeItem("registration_data");
  };

  const getStatusTag = (registration) => {
    if (registration.status === "DISTRIBUTED") {
      return <Tag color="green">Đã được phát quà</Tag>;
    } else if (registration.status === "REGISTERED") {
      return <Tag color="blue">Đã đăng ký</Tag>;
    } else if (registration.status === "CANCELLED") {
      return <Tag color="red">Đã hủy</Tag>;
    }
    return <Tag color="blue">Đã đăng ký</Tag>;
  };

  const columns = [
    {
      title: "Sự kiện",
      key: "event",
      width: 200,
      ellipsis: true,
      render: (_, record) => <Text strong>{record.event?.name || "N/A"}</Text>,
    },
    {
      title: "Thời gian nhận quà",
      key: "distributedAt",
      width: 150,
      render: (_, record) =>
        record.distributedAt
          ? dayjs(record.distributedAt).format("DD/MM/YYYY HH:mm")
          : "-",
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 120,
      render: (_, record) => getStatusTag(record),
    },
    {
      title: "Giá trị",
      key: "totalValue",
      width: 130,
      ellipsis: true,
      render: (_, record) => (
        <Text type="secondary">
          {record.totalValue
            ? `${record.totalValue.toLocaleString("vi-VN")} VNĐ`
            : "-"}
        </Text>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <Layout>
      <style>
        {`
          .ant-modal-body::-webkit-scrollbar {
            display: none;
          }
          .ant-modal-body {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      <div>
        {/* Header gradient */}
        <Card
          bordered={false}
          style={{
            marginBottom: 24,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
          }}
          bodyStyle={{ padding: "32px" }}
          className="hover-card"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
                <GiftOutlined style={{ fontSize: 32, color: "#fff" }} />
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
                  Danh Sách Quà
                </Title>
                <Text
                  style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}
                >
                  Quản lý và theo dõi các đăng ký nhận quà của bạn
                </Text>
              </div>
            </div>

            <div>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleManualRefresh}
                loading={loading}
                style={{
                  background: "#fff",
                  color: "#667eea",
                  fontWeight: 500,
                  height: 40,
                  borderRadius: 8,
                  transition: "all 0.3s ease",
                }}
                className="hover-back"
              >
                Làm mới
              </Button>
            </div>
          </div>

          {/* Hover effect */}
          <style>{`
            .hover-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 10px 25px rgba(102, 126, 234, 0.35);
            }
            .hover-back:hover {
              transform: translateY(-3px);
              box-shadow: 0 6px 16px rgba(0,0,0,0.15);
            }
          `}</style>
        </Card>

        {/* Table Card */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            transition: "all 0.3s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          className="hover-table-card"
        >
          {registrations.length === 0 && !loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Text
                type="secondary"
                style={{
                  fontSize: "16px",
                  display: "block",
                  marginBottom: "16px",
                }}
              >
                Bạn chưa có đăng ký nào.
              </Text>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                Hãy đăng ký sự kiện để xem lịch sử đăng ký tại đây.
              </Text>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={registrations}
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} đăng ký`,
                onChange: (page, pageSize) => {
                  setPagination((prev) => ({
                    ...prev,
                    current: page,
                    pageSize,
                  }));
                },
              }}
              rowClassName={() => "hoverable-row"}
            />
          )}
        </Card>

        {/* CSS hover effects */}
        <style>
          {`
            .hover-table-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            }

            .hoverable-row:hover {
              background-color: #fafafa !important;
              transition: background 0.2s ease;
            }

            .ant-btn {
              transition: all 0.2s ease;
            }
            .ant-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
          `}
        </style>
      </div>

      {/* View Details Modal */}
      <Modal
        title="Chi tiết đăng ký"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setViewingRegistration(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={600}
        centered
        bodyStyle={{ 
          maxHeight: "70vh", 
          overflow: "auto", 
          padding: "24px",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE and Edge
        }}
        style={{
          overflow: "hidden",
        }}
      >
        {viewingRegistration && (
          <Descriptions bordered column={1} labelStyle={{ textAlign: "center" }}>
            <Descriptions.Item label="Sự kiện">
              {viewingRegistration.event?.name || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian nhận quà">
              {viewingRegistration.distributedAt
                ? dayjs(viewingRegistration.distributedAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getStatusTag(viewingRegistration)}
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng">
              {viewingRegistration.quantity || 1}
            </Descriptions.Item>
            {viewingRegistration.totalValue && (
              <Descriptions.Item label="Giá trị">
                {viewingRegistration.totalValue.toLocaleString("vi-VN")} VNĐ
              </Descriptions.Item>
            )}
            {viewingRegistration.note && (
              <Descriptions.Item label="Ghi chú đăng ký">
                {viewingRegistration.note}
              </Descriptions.Item>
            )}
            {viewingRegistration.distributionNote && (
              <Descriptions.Item label="Ghi chú phân phát">
                {viewingRegistration.distributionNote}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal
        title="Mã QR nhận quà"
        open={isQRModalVisible}
        onCancel={() => {
          setIsQRModalVisible(false);
          setViewingRegistration(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsQRModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={400}
      >
        {viewingRegistration && (
          <Space
            direction="vertical"
            size="large"
            style={{ width: "100%", textAlign: "center" }}
          >
            <QRCode value={viewingRegistration._id} size={200} errorLevel="H" />
            <div>
              <Text strong>{viewingRegistration.event?.name}</Text>
              <br />
              <Text type="secondary">
                Mã đăng ký: {viewingRegistration._id.slice(-8).toUpperCase()}
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Quét mã QR này khi đến nhận quà
            </Text>
          </Space>
        )}
      </Modal>
    </Layout>
  );
};

export default MyRegistrations;