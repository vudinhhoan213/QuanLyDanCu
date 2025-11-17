import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Typography,
  message,
  Row,
  Col,
  Modal,
  Select,
  Statistic,
  Tabs,
} from "antd";
import {
  GiftOutlined,
  SearchOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import Layout from "../../components/Layout";
import { rewardService } from "../../services";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RewardDistributions = () => {
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [eligibleCitizens, setEligibleCitizens] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedEligibleKeys, setSelectedEligibleKeys] = useState([]);
  const [isDistributionModalVisible, setIsDistributionModalVisible] =
    useState(false);
  const [distributionNote, setDistributionNote] = useState("");
  const [viewingRegistration, setViewingRegistration] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("registrations");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [eligiblePagination, setEligiblePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchEvents();
    if (activeTab === "registrations") {
      fetchRegistrations();
    } else {
      fetchEligibleCitizens();
    }
  }, [pagination.current, pagination.pageSize, eligiblePagination.current, eligiblePagination.pageSize, activeTab]);

  useEffect(() => {
    if (activeTab === "registrations") {
      fetchRegistrations();
    } else if (eventFilter) {
      fetchEligibleCitizens();
    }
    // Reset selection khi chuyển tab hoặc thay đổi event
    setSelectedRowKeys([]);
    setSelectedEligibleKeys([]);
  }, [eventFilter, statusFilter, activeTab]);

  const fetchEvents = async () => {
    try {
      const response = await rewardService.events.getAll({ status: "OPEN" });
      setEvents(response.docs || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        sort: "-createdAt",
      };

      if (eventFilter) {
        params.event = eventFilter;
      }

      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const response = await rewardService.distributions.getAll(params);
      const regList = response.docs || [];

      setRegistrations(
        regList.map((reg) => ({
          key: reg._id,
          ...reg,
        }))
      );
      setPagination({
        ...pagination,
        total: response.total || 0,
      });
    } catch (error) {
      console.error("Error fetching registrations:", error);
      message.error("Không thể tải danh sách đăng ký");
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleCitizens = async (timestamp = null) => {
    if (!eventFilter) {
      setEligibleCitizens([]);
      setEligiblePagination({ ...eligiblePagination, total: 0 });
      return;
    }

    try {
      setLoading(true);
      const params = {
        page: eligiblePagination.current,
        limit: eligiblePagination.pageSize,
      };

      // Lấy danh sách công dân đủ điều kiện
      const response = await rewardService.events.getEligibleCitizens(eventFilter, params);
      let citizens = response.docs || [];

      // Lấy danh sách phân phối cho event này để kiểm tra trạng thái nhận quà
      try {
        const distributionsResponse = await rewardService.distributions.getAll({
          event: eventFilter,
          limit: 1000, // Lấy nhiều để cover hết eligible citizens
        });
        const distributions = distributionsResponse.docs || [];

        // Map distributions by citizen ID
        const distributionMap = {};
        distributions.forEach(dist => {
          if (dist.citizen && dist.citizen._id) {
            distributionMap[dist.citizen._id] = dist;
          }
        });

        // Thêm thông tin trạng thái nhận quà cho mỗi citizen
        citizens = citizens.map(citizen => {
          const distribution = distributionMap[citizen._id];
          return {
            ...citizen,
            hasReceivedReward: distribution?.status === 'DISTRIBUTED',
            distributionId: distribution?._id,
            distributedAt: distribution?.distributedAt,
            distributionNote: distribution?.note,
          };
        });

      } catch (error) {
        console.error('Error fetching distributions:', error);
        // Nếu không lấy được distributions, set default status
        citizens = citizens.map(citizen => ({
          ...citizen,
          hasReceivedReward: false,
          distributionId: null,
          distributedAt: null,
          distributionNote: null,
        }));
      }

      setEligibleCitizens(citizens);
      setEligiblePagination({
        ...eligiblePagination,
        total: response.total || response.docs?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching eligible citizens:", error);
      message.error("Không thể tải danh sách công dân đủ điều kiện");
    } finally {
      setLoading(false);
    }
  };

  const handleDistribute = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một người nhận quà");
      return;
    }

    // Kiểm tra xem có đăng ký nào đã được phân phát chưa
    const selectedRegistrations = registrations.filter((reg) =>
      selectedRowKeys.includes(reg._id)
    );
    const alreadyDistributed = selectedRegistrations.filter(
      (reg) => reg.status === "DISTRIBUTED"
    );

    if (alreadyDistributed.length > 0) {
      message.warning(
        `Có ${alreadyDistributed.length} người đã được phân phát quà rồi. Vui lòng bỏ chọn các người này.`
      );
      return;
    }

    setIsDistributionModalVisible(true);
  };

  const handleConfirmDistribute = async () => {
    if (activeTab === "registrations") {
      await handleDistribute();
    } else if (activeTab === "eligible") {
      await handleDistributeEligible();
    }
  };

  const handleDistributeEligible = async () => {
    if (selectedEligibleKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một công dân đủ điều kiện");
      return;
    }

    try {
      setDistributing(true);

      // Tạo distribution records tuần tự để đảm bảo không có lỗi
      console.log('Creating distributions for:', selectedEligibleKeys);
      const createPromises = selectedEligibleKeys.map(async (citizenId) => {
        try {
          // Tìm household của citizen từ eligibleCitizens
          const citizen = eligibleCitizens.find(c => c._id === citizenId);
          if (!citizen || !citizen.household) {
            throw new Error(`Không tìm thấy thông tin hộ gia đình cho công dân ${citizenId}`);
          }

          const result = await rewardService.distributions.create({
            citizen: citizenId,
            household: citizen.household._id || citizen.household,
            event: eventFilter,
            status: 'DISTRIBUTED',
            note: distributionNote || 'Phân phát trực tiếp từ danh sách đủ điều kiện',
            distributedAt: new Date(),
            quantity: 1,
            unitValue: 0,
          });
          console.log('Created distribution for citizen:', citizenId, result);
          return result;
        } catch (error) {
          console.error('Error creating distribution for citizen:', citizenId, error);
          throw error;
        }
      });

      await Promise.all(createPromises);
      console.log('All distributions created successfully');

      message.success(
        `✅ Đã phân phát quà cho ${selectedEligibleKeys.length} công dân đủ điều kiện thành công!`
      );

      // Đợi một chút để đảm bảo data được sync
      console.log('Waiting for data sync...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Data sync complete, refreshing...');

      // Refresh danh sách trước
      console.log('Refreshing eligible citizens data...');
      await fetchEligibleCitizens(Date.now());
      console.log('Data refreshed successfully');

      // Reset state sau khi refresh thành công
      setSelectedEligibleKeys([]);
      setDistributionNote("");
      setIsDistributionModalVisible(false);
    } catch (error) {
      console.error("Error distributing gifts to eligible citizens:", error);
      message.error(
        error.response?.data?.message ||
          "Không thể phân phát quà. Vui lòng thử lại!"
      );
    } finally {
      setDistributing(false);
    }
  };

  const handleViewDetails = (registration) => {
    setViewingRegistration(registration);
    setIsDetailModalVisible(true);
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      !searchText ||
      reg.citizen?.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      reg.household?.code?.toLowerCase().includes(searchText.toLowerCase()) ||
      reg.citizen?.nationalId?.includes(searchText) ||
      reg.event?.name?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  // Statistics - chỉ tính trên filteredRegistrations để hiển thị đúng
  const stats = {
    total: filteredRegistrations.length,
    pending: filteredRegistrations.filter((r) => r.status === "REGISTERED")
      .length,
    distributed: filteredRegistrations.filter((r) => r.status === "DISTRIBUTED")
      .length,
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.status === "DISTRIBUTED",
    }),
  };

  const eligibleRowSelection = {
    selectedRowKeys: selectedEligibleKeys,
    onChange: (selectedKeys) => {
      setSelectedEligibleKeys(selectedKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.hasReceivedReward, // Disable nếu đã nhận quà
    }),
  };

  const getStatusTag = (status) => {
    if (status === "DISTRIBUTED") {
      return <Tag color="green">Đã nhận quà</Tag>;
    } else {
      return <Tag color="orange">Chưa nhận quà</Tag>;
    }
  };

  const eligibleColumns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      fixed: "left",
      render: (_, __, index) => {
        return (eligiblePagination.current - 1) * eligiblePagination.pageSize + index + 1;
      },
    },
    {
      title: "Họ tên",
      key: "fullName",
      width: 140,
      ellipsis: true,
      render: (_, record) => <Text strong>{record.fullName || "N/A"}</Text>,
    },
    {
      title: "CMND/CCCD",
      key: "nationalId",
      width: 120,
      ellipsis: true,
      render: (_, record) => record.nationalId || "N/A",
    },
    {
      title: "Quà tặng",
      key: "gift",
      width: 180,
      ellipsis: true,
      render: (_, record) => {
        // Xác định quà tặng dựa trên thông tin từ event
        const event = events.find(e => e._id === eventFilter);
        if (!event) return "N/A";

        // Ưu tiên sử dụng rewardDescription nếu có
        if (event.rewardDescription) {
          return event.rewardDescription;
        }

        // Fallback: Xác định dựa trên loại sự kiện và tên
        switch (event.type) {
          case "SCHOOL_YEAR":
            return "Sách vở học tập";
          case "ANNUAL":
            if (event.name.toLowerCase().includes("trung thu")) {
              return "Hộp quà trung thu";
            } else if (event.name.toLowerCase().includes("tết")) {
              return "Tiền lì xì";
            } else if (event.name.toLowerCase().includes("noel")) {
              return "Quà Noel cho trẻ em";
            } else if (event.name.toLowerCase().includes("thiếu nhi")) {
              return "Quà thiếu nhi";
            }
            return "Quà tặng hàng năm";
          case "SPECIAL":
          case "SPECIAL_OCCASION":
            return "Quà đặc biệt";
          default:
            return "Quà tặng";
        }
      },
    },
    {
      title: "Ngày nhận quà",
      key: "distributedAt",
      width: 150,
      render: (_, record) => {
        if (record.hasReceivedReward && record.distributedAt) {
          return dayjs(record.distributedAt).format("DD/MM/YYYY HH:mm");
        }
        return record.hasReceivedReward ? "Đã nhận" : "Chưa nhận";
      },
    },
    {
      title: "Hộ khẩu",
      key: "household",
      width: 100,
      ellipsis: true,
      render: (_, record) => record.household?.address || "N/A",
    },
    {
      title: "Trạng thái nhận quà",
      key: "rewardStatus",
      width: 150,
      render: (_, record) => {
        const hasReceived = record.hasReceivedReward;
        return (
          <Tag color={hasReceived ? "green" : "orange"}>
            {hasReceived ? "Đã nhận quà" : "Chưa nhận quà"}
          </Tag>
        );
      },
    },
  ];

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      fixed: "left",
      render: (_, __, index) => {
        return (pagination.current - 1) * pagination.pageSize + index + 1;
      },
    },
    {
      title: "Sự kiện",
      key: "event",
      width: 150,
      ellipsis: true,
      render: (_, record) => <Text strong>{record.event?.name || "N/A"}</Text>,
    },
    {
      title: "Họ tên",
      key: "fullName",
      width: 140,
      ellipsis: true,
      render: (_, record) => (
        <Text strong>{record.citizen?.fullName || "N/A"}</Text>
      ),
    },
    {
      title: "CMND/CCCD",
      key: "nationalId",
      width: 120,
      ellipsis: true,
      render: (_, record) => record.citizen?.nationalId || "N/A",
    },
    {
      title: "Hộ khẩu",
      key: "household",
      width: 100,
      ellipsis: true,
      render: (_, record) => record.household?.code || "N/A",
    },
    {
      title: "Thời gian nhận",
      key: "distributedAt",
      width: 150,
      render: (_, record) =>
        record.distributedAt
          ? dayjs(record.distributedAt).format("DD/MM/YYYY HH:mm")
          : record.createdAt
          ? dayjs(record.createdAt).format("DD/MM/YYYY HH:mm")
          : "-",
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 80,
      render: (_, record) => record.quantity || 1,
    },
    {
      title: "Giá trị",
      key: "totalValue",
      width: 130,
      ellipsis: true,
      render: (_, record) =>
        record.totalValue
          ? `${record.totalValue.toLocaleString("vi-VN")} VNĐ`
          : "N/A",
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 120,
      render: (_, record) => getStatusTag(record.status),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Xem
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Title level={2} style={{ margin: 0 }}>
            <GiftOutlined /> Phân phối quà
          </Title>

          {/* Statistics */}
          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Tổng số người (đang xem)"
                  value={stats.total}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Chưa nhận quà"
                  value={stats.pending}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Đã nhận quà"
                  value={stats.distributed}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters and Actions */}
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<GiftOutlined />}
                  onClick={handleDistribute}
                  disabled={selectedRowKeys.length === 0 || distributing}
                  loading={distributing}
                >
                  Phân phát quà ({selectedRowKeys.length})
                </Button>
              </Space>
            </Col>
          </Row>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            items={[
              {
                key: "registrations",
                label: "Danh sách tổng hợp nhận quà",
                children: (
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    {/* Statistics for registrations */}
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title="Tổng đăng ký"
                            value={stats.total}
                            valueStyle={{ color: "#1890ff" }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title="Chưa nhận quà"
                            value={stats.pending}
                            valueStyle={{ color: "#faad14" }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title="Đã nhận quà"
                            value={stats.distributed}
                            valueStyle={{ color: "#52c41a" }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* Filters and Actions for registrations */}
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space>
                          <Button
                            type="primary"
                            icon={<GiftOutlined />}
                            onClick={handleDistribute}
                            disabled={selectedRowKeys.length === 0 || distributing}
                            loading={distributing}
                          >
                            Phân phát quà ({selectedRowKeys.length})
                          </Button>
                        </Space>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Input
                          placeholder="Tìm kiếm theo tên/CMND/hộ khẩu/sự kiện..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          allowClear
                        />
                      </Col>
                      <Col span={6}>
                        <Select
                          style={{ width: "100%" }}
                          placeholder="Chọn sự kiện"
                          value={eventFilter}
                          onChange={setEventFilter}
                          allowClear
                        >
                          {events.map((event) => (
                            <Option key={event._id} value={event._id}>
                              {event.name}
                            </Option>
                          ))}
                        </Select>
                      </Col>
                      <Col span={6}>
                        <Select
                          style={{ width: "100%" }}
                          value={statusFilter}
                          onChange={setStatusFilter}
                        >
                          <Option value="ALL">Tất cả trạng thái</Option>
                          <Option value="REGISTERED">Chưa nhận quà</Option>
                          <Option value="DISTRIBUTED">Đã nhận quà</Option>
                        </Select>
                      </Col>
                    </Row>

                    <Table
                      rowSelection={rowSelection}
                      columns={columns}
                      dataSource={filteredRegistrations}
                      loading={loading}
                      rowKey="_id"
                      pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} người`,
                        onChange: (page, pageSize) => {
                          setPagination({ ...pagination, current: page, pageSize });
                        },
                      }}
                      scroll={{ x: 1150 }}
                    />
                  </Space>
                ),
              },
              {
                key: "eligible",
                label: "Công dân đủ điều kiện & Trạng thái nhận quà",
                children: (
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    {/* Statistics for eligible citizens */}
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title="Tổng đủ điều kiện"
                            value={eligiblePagination.total}
                            valueStyle={{ color: "#1890ff" }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title="Đã nhận quà"
                            value={eligibleCitizens.filter(c => c.hasReceivedReward).length}
                            valueStyle={{ color: "#52c41a" }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title="Đã chọn để phát quà"
                            value={selectedEligibleKeys.length}
                            valueStyle={{ color: "#722ed1" }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* Filter for eligible citizens */}
                    <Row gutter={16}>
                      <Col span={8}>
                        <Select
                          style={{ width: "100%" }}
                          placeholder="Chọn sự kiện"
                          value={eventFilter}
                          onChange={setEventFilter}
                          allowClear
                        >
                          {events.map((event) => (
                            <Option key={event._id} value={event._id}>
                              {event.name}
                            </Option>
                          ))}
                        </Select>
                      </Col>
                    </Row>

                    {/* Actions for eligible citizens */}
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space>
                          <Button
                            type="primary"
                            icon={<GiftOutlined />}
                            onClick={() => setIsDistributionModalVisible(true)}
                            disabled={selectedEligibleKeys.length === 0 || distributing}
                            loading={distributing}
                          >
                            Phân phát quà ({selectedEligibleKeys.length})
                          </Button>
                        </Space>
                      </Col>
                    </Row>

                    <Table
                      rowSelection={eligibleRowSelection}
                      columns={eligibleColumns}
                      dataSource={eligibleCitizens}
                      loading={loading}
                      rowKey="_id"
                      pagination={{
                        ...eligiblePagination,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} công dân`,
                        onChange: (page, pageSize) => {
                          setEligiblePagination({ ...eligiblePagination, current: page, pageSize });
                        },
                      }}
                      scroll={{ x: 1000 }}
                    />
                  </Space>
                ),
              },
            ]}
          />
        </Space>
      </Card>

      {/* Distribution Modal */}
      <Modal
        title="Phân phát quà"
        open={isDistributionModalVisible}
        onOk={handleConfirmDistribute}
        onCancel={() => {
          setIsDistributionModalVisible(false);
          setDistributionNote("");
        }}
        confirmLoading={distributing}
        okText="Xác nhận phân phát"
        cancelText="Hủy"
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>
              Bạn đang phân phát quà cho {
                activeTab === "registrations"
                  ? `${selectedRowKeys.length} người`
                  : `${selectedEligibleKeys.length} công dân đủ điều kiện`
              }.
            </Text>
          </div>
          <div>
            <Text type="secondary">Ghi chú (tùy chọn):</Text>
            <TextArea
              rows={4}
              placeholder="Nhập ghi chú về việc phân phát quà..."
              value={distributionNote}
              onChange={(e) => setDistributionNote(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title="Chi tiết người nhận quà"
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setViewingRegistration(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={600}
      >
        {viewingRegistration && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div>
              <Text strong>Sự kiện: </Text>
              <Text>{viewingRegistration.event?.name || "N/A"}</Text>
            </div>
            <div>
              <Text strong>Họ tên: </Text>
              <Text>{viewingRegistration.citizen?.fullName || "N/A"}</Text>
            </div>
            <div>
              <Text strong>CMND/CCCD: </Text>
              <Text>{viewingRegistration.citizen?.nationalId || "N/A"}</Text>
            </div>
            <div>
              <Text strong>Hộ khẩu: </Text>
              <Text>{viewingRegistration.household?.code || "N/A"}</Text>
            </div>
            <div>
              <Text strong>Thời gian nhận: </Text>
              <Text>
                {viewingRegistration.distributedAt
                  ? dayjs(viewingRegistration.distributedAt).format(
                      "DD/MM/YYYY HH:mm:ss"
                    )
                  : viewingRegistration.createdAt
                  ? dayjs(viewingRegistration.createdAt).format(
                      "DD/MM/YYYY HH:mm:ss"
                    )
                  : "-"}
              </Text>
            </div>
            <div>
              <Text strong>Trạng thái: </Text>
              {getStatusTag(viewingRegistration.status)}
            </div>
            {viewingRegistration.distributedAt && (
              <div>
                <Text strong>Thời gian phát quà: </Text>
                <Text>
                  {dayjs(viewingRegistration.distributedAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )}
                </Text>
              </div>
            )}
            <div>
              <Text strong>Số lượng: </Text>
              <Text>{viewingRegistration.quantity || 1}</Text>
            </div>
            {viewingRegistration.totalValue && (
              <div>
                <Text strong>Giá trị: </Text>
                <Text>
                  {viewingRegistration.totalValue.toLocaleString("vi-VN")} VNĐ
                </Text>
              </div>
            )}
            {viewingRegistration.note && (
              <div>
                <Text strong>Ghi chú đăng ký: </Text>
                <Text>{viewingRegistration.note}</Text>
              </div>
            )}
            {viewingRegistration.distributionNote && (
              <div>
                <Text strong>Ghi chú phân phát: </Text>
                <Text>{viewingRegistration.distributionNote}</Text>
              </div>
            )}
          </Space>
        )}
      </Modal>
    </Layout>
  );
};

export default RewardDistributions;