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
  Select,
  Statistic,
  Modal,
  Popconfirm,
  Descriptions,
} from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  GiftOutlined,
  UserOutlined,
  ReloadOutlined,
  FileAddOutlined,
  ExperimentOutlined,
  HomeOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import {
  rewardService,
  editRequestService,
  notificationService,
  householdService,
} from "../../services";
import { exportRegistrationsToExcel } from "../../utils/exportExcel";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const RewardEventRegistrations = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [event, setEvent] = useState(null);
  const [eligibleCitizens, setEligibleCitizens] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    received: 0,
    notReceived: 0,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [generateConfig, setGenerateConfig] = useState({
    schoolYear: "",
    minAge: 0,
    maxAge: 18,
  });
  const [useMockData, setUseMockData] = useState(false); // Mode tạo dữ liệu ảo
  const [viewingCitizen, setViewingCitizen] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [householdStats, setHouseholdStats] = useState([]);
  const [isHouseholdStatsVisible, setIsHouseholdStatsVisible] = useState(false);
  const [loadingHouseholdStats, setLoadingHouseholdStats] = useState(false);

  useEffect(() => {
    fetchEvent();
    fetchEligibleCitizens();
  }, [id, pagination.current, pagination.pageSize, statusFilter]);

  const fetchEvent = async () => {
    try {
      const eventData = await rewardService.events.getById(id);
      setEvent(eventData);
    } catch (error) {
      console.error("Error fetching event:", error);
      message.error("Không thể tải thông tin sự kiện");
      navigate("/leader/reward-events");
    }
  };

  // Tạo dữ liệu ảo để test
  const generateMockData = () => {
    const mockCitizens = [];
    const names = [
      "Nguyễn Văn An",
      "Trần Thị Bình",
      "Lê Văn Cường",
      "Phạm Thị Dung",
      "Hoàng Văn Em",
      "Vũ Thị Phương",
      "Đặng Văn Giang",
      "Bùi Thị Hoa",
      "Đỗ Văn Hùng",
      "Ngô Thị Lan",
      "Lý Văn Minh",
      "Võ Thị Nga",
      "Phan Văn Oanh",
      "Trương Thị Phượng",
      "Đinh Văn Quang",
      "Lương Thị Quyên",
      "Nguyễn Thị Mai",
      "Trần Văn Nam",
      "Lê Thị Hương",
      "Phạm Văn Đức",
    ];

    const eventName = event?.name?.toLowerCase() || "";
    const currentYear = new Date().getFullYear();

    // Xác định độ tuổi dựa trên tên sự kiện
    let targetAge = null;
    let targetGender = null;

    if (eventName.includes("trung thu")) {
      targetAge = { min: 0, max: 18 };
    } else if (
      eventName.includes("thiếu nhi") ||
      eventName.includes("quốc tế thiếu nhi")
    ) {
      targetAge = { min: 0, max: 14 };
    } else if (eventName.includes("phụ nữ") || eventName.includes("20/10")) {
      targetGender = "FEMALE";
    }

    for (let i = 0; i < 20; i++) {
      const isReceived = i < 12; // 12 người đã nhận, 8 người chưa nhận

      // Tính năm sinh dựa trên targetAge
      let birthYear;
      if (targetAge) {
        const age =
          targetAge.min +
          Math.floor(Math.random() * (targetAge.max - targetAge.min + 1));
        birthYear = currentYear - age;
      } else {
        birthYear = 1970 + Math.floor(Math.random() * 50); // 1970-2020
      }

      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;

      // Xác định giới tính
      const gender = targetGender || (Math.random() > 0.5 ? "MALE" : "FEMALE");
      const fullName =
        gender === "FEMALE"
          ? names[i % names.length]
              .replace("Văn", "Thị")
              .replace("Văn", "Thị") + ` ${i + 1}`
          : names[i % names.length] + ` ${i + 1}`;

      mockCitizens.push({
        _id: `mock_${i}`,
        key: `mock_${i}`,
        fullName,
        nationalId: `2023${String(i).padStart(6, "0")}`,
        dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
        gender,
        household: {
          _id: `household_${i}`,
          code: `HK${String(i + 1).padStart(4, "0")}`,
        },
        status: isReceived ? "DISTRIBUTED" : "NOT_RECEIVED",
        distributedAt: isReceived
          ? new Date(2025, 10, 17, 19 + (i % 3), 20 + (i % 40))
          : null,
        quantity: 1,
        totalValue: event?.budget || 50000,
        distributionId: isReceived ? `dist_${i}` : null,
      });
    }

    return mockCitizens;
  };

  const fetchEligibleCitizens = async () => {
    try {
      setLoading(true);

      // Nếu dùng dữ liệu ảo
      if (useMockData) {
        const mockCitizens = generateMockData();
        const filtered =
          statusFilter === "ALL"
            ? mockCitizens
            : statusFilter === "DISTRIBUTED"
            ? mockCitizens.filter((c) => c.status === "DISTRIBUTED")
            : mockCitizens.filter((c) => c.status !== "DISTRIBUTED");

        const start = (pagination.current - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        const paginated = filtered.slice(start, end);

        setEligibleCitizens(paginated);
        setPagination({
          ...pagination,
          total: filtered.length,
        });

        const received = mockCitizens.filter(
          (c) => c.status === "DISTRIBUTED"
        ).length;
        setStats({
          total: mockCitizens.length,
          received,
          notReceived: mockCitizens.length - received,
        });
        setLoading(false);
        return;
      }

      // Kiểm tra xem event có distributions (danh sách phân phối) chưa
      // Nếu có thì lấy từ distributions, nếu chưa thì lấy từ eligible citizens
      let hasDistributions = false;
      let allDistributions = [];

      try {
        const checkDistributionsResponse =
          await rewardService.distributions.getAll({
            event: id,
            limit: 1, // Chỉ cần kiểm tra xem có hay không
          });
        hasDistributions = (checkDistributionsResponse.docs || []).length > 0;

        if (hasDistributions) {
          // Lấy tất cả distributions để tính thống kê
          const allDistributionsResponse =
            await rewardService.distributions.getAll({
              event: id,
              limit: 1000,
            });
          allDistributions = allDistributionsResponse.docs || [];
        }
      } catch (checkError) {
        console.error("Error checking distributions:", checkError);
        hasDistributions = false;
      }

      if (hasDistributions && allDistributions.length > 0) {
        // Có distributions → Lấy từ danh sách phân phối (khen thưởng)
        try {
          // Tính thống kê từ tất cả distributions
          const total = allDistributions.length;
          let received = 0;
          let notReceived = 0;

          allDistributions.forEach((dist) => {
            if (dist.status === "DISTRIBUTED") {
              received++;
            } else {
              notReceived++;
            }
          });

          setStats({
            total,
            received,
            notReceived,
          });

          // Lấy danh sách phân phối với pagination và filter
          const distributionsParams = {
            event: id,
            page: pagination.current,
            limit: pagination.pageSize,
          };

          // Thêm filter status nếu có
          if (statusFilter === "DISTRIBUTED") {
            distributionsParams.status = "DISTRIBUTED";
          }

          // Lấy danh sách phân phối (distributions) cho event này
          const distributionsResponse =
            await rewardService.distributions.getAll(distributionsParams);
          let distributions = distributionsResponse.docs || [];
          let totalDistributions = distributionsResponse.total || 0;

          // Nếu filter là NOT_RECEIVED, cần lấy tất cả rồi filter ở frontend
          // vì backend không hỗ trợ $ne operator qua query params
          if (statusFilter === "NOT_RECEIVED") {
            distributions = allDistributions.filter(
              (dist) => dist.status !== "DISTRIBUTED"
            );
            totalDistributions = distributions.length;

            // Paginate sau khi filter
            const start = (pagination.current - 1) * pagination.pageSize;
            const end = start + pagination.pageSize;
            distributions = distributions.slice(start, end);
          }

          // Chuyển đổi distributions thành format citizen với đầy đủ thông tin
          const citizens = distributions.map((dist) => {
            const citizen = dist.citizen || {};
            return {
              key: citizen._id || dist._id,
              _id: citizen._id,
              fullName: citizen.fullName || "N/A",
              nationalId: citizen.nationalId || "N/A",
              dateOfBirth: citizen.dateOfBirth,
              gender: citizen.gender,
              household: dist.household || citizen.household,
              // Thông tin từ distribution
              distributionId: dist._id,
              status: dist.status || "REGISTERED",
              distributedAt: dist.distributedAt,
              distributionNote: dist.note || dist.distributionNote,
              quantity: dist.quantity || 1,
              totalValue: dist.totalValue || 0,
              unitValue: dist.unitValue || 0,
            };
          });

          setEligibleCitizens(citizens);
          setPagination({
            ...pagination,
            total: totalDistributions,
          });
        } catch (distError) {
          console.error("Error fetching distributions:", distError);
          throw distError; // Re-throw để fallback về eligible citizens
        }
      } else {
        // Chưa có distributions → Lấy từ eligible citizens (công dân đủ điều kiện)
        const params = {
          page: pagination.current,
          limit: pagination.pageSize,
        };

        const response = await rewardService.events.getEligibleCitizens(
          id,
          params
        );
        let citizens = response.docs || [];

        // Lấy distributions để kiểm tra trạng thái nhận quà (nếu có)
        let distributionMap = {};
        try {
          const distributionsResponse =
            await rewardService.distributions.getAll({
              event: id,
              limit: 1000,
            });
          const distributions = distributionsResponse.docs || [];
          distributions.forEach((dist) => {
            if (dist.citizen) {
              const citizenId = dist.citizen._id || dist.citizen;
              distributionMap[citizenId] = dist;
            }
          });
        } catch (distError) {
          console.error(
            "Error fetching distributions for status check:",
            distError
          );
        }

        // Map citizens với thông tin từ distributions nếu có
        citizens = citizens.map((citizen) => {
          const distribution = distributionMap[citizen._id];
          return {
            key: citizen._id,
            ...citizen,
            distributionId: distribution?._id || null,
            status: distribution?.status || "NOT_RECEIVED",
            distributedAt: distribution?.distributedAt || null,
            distributionNote:
              distribution?.note || distribution?.distributionNote || null,
            quantity: distribution?.quantity || 1,
            totalValue: distribution?.totalValue || 0,
            unitValue: distribution?.unitValue || 0,
          };
        });

        // Lọc theo status nếu có filter
        if (statusFilter !== "ALL") {
          if (statusFilter === "DISTRIBUTED") {
            citizens = citizens.filter((c) => c.status === "DISTRIBUTED");
          } else if (statusFilter === "NOT_RECEIVED") {
            citizens = citizens.filter((c) => c.status !== "DISTRIBUTED");
          }
        }

        setEligibleCitizens(citizens);
        setPagination({
          ...pagination,
          total: response.total || 0,
        });

        // Tính thống kê từ tất cả eligible citizens
        const allParams = { limit: 1000 };
        const allResponse = await rewardService.events.getEligibleCitizens(
          id,
          allParams
        );
        const allCitizens = allResponse.docs || [];

        // Lấy tất cả distributions để tính thống kê chính xác
        let allDistributionsForStats = [];
        try {
          const allDistributionsResponse =
            await rewardService.distributions.getAll({
              event: id,
              limit: 1000,
            });
          allDistributionsForStats = allDistributionsResponse.docs || [];
        } catch (err) {
          console.error("Error fetching all distributions for stats:", err);
        }

        const allDistributionMap = {};
        allDistributionsForStats.forEach((dist) => {
          if (dist.citizen) {
            const citizenId = dist.citizen._id || dist.citizen;
            allDistributionMap[citizenId] = dist;
          }
        });

        const total = allResponse.total || allCitizens.length;
        let received = 0;
        let notReceived = 0;

        allCitizens.forEach((citizen) => {
          const dist = allDistributionMap[citizen._id];
          if (dist && dist.status === "DISTRIBUTED") {
            received++;
          } else {
            notReceived++;
          }
        });

        setStats({
          total,
          received,
          notReceived,
        });
      }
    } catch (error) {
      console.error("Error fetching eligible citizens:", error);
      message.error("Không thể tải danh sách nhận quà");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReceived = async (citizenIds) => {
    if (!citizenIds || citizenIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một công dân");
      return;
    }

    if (!id) {
      message.error("Không tìm thấy ID sự kiện");
      return;
    }

    try {
      setDistributing(true);

      // Fetch lại distributions để kiểm tra duplicate (đảm bảo dữ liệu mới nhất)
      const distributionsResponse = await rewardService.distributions.getAll({
        event: id,
        limit: 1000,
      });
      const allDistributions = distributionsResponse.docs || [];

      // Phân loại: những người đã có distribution và chưa có
      const citizensToUpdate = [];
      const citizensToCreate = [];
      const citizensWithoutHousehold = []; // Thu thập công dân chưa có hộ khẩu (với thông tin đầy đủ)

      citizenIds.forEach((citizenId) => {
        const citizen = eligibleCitizens.find((c) => c._id === citizenId);
        if (!citizen) {
          console.warn(`Citizen ${citizenId} not found in eligible list`);
          return;
        }

        if (citizen.distributionId) {
          // Kiểm tra lại xem distribution này có tồn tại và chưa DISTRIBUTED không
          const existingDist = allDistributions.find(
            (d) => d._id?.toString() === citizen.distributionId?.toString()
          );
          if (existingDist && existingDist.status !== "DISTRIBUTED") {
            citizensToUpdate.push(citizen.distributionId);
          }
          // Nếu đã DISTRIBUTED rồi, bỏ qua
        } else {
          // Kiểm tra xem đã có distribution cho citizen và event này chưa (tránh duplicate)
          const existingDist = allDistributions.find(
            (d) =>
              (d.citizen?._id || d.citizen)?.toString() ===
                citizenId.toString() &&
              (d.event?._id || d.event)?.toString() === id.toString()
          );

          if (existingDist) {
            // Nếu đã có nhưng chưa được đánh dấu là DISTRIBUTED, thêm vào danh sách update
            if (existingDist.status !== "DISTRIBUTED") {
              citizensToUpdate.push(existingDist._id);
            }
            // Nếu đã DISTRIBUTED rồi, bỏ qua
            return;
          }

          const householdId = citizen.household?._id || citizen.household;
          if (!householdId) {
            console.error(
              `Citizen ${citizen.fullName} (${citizenId}) chưa có hộ khẩu`
            );
            citizensWithoutHousehold.push({
              id: citizenId,
              name: citizen.fullName || `ID: ${citizenId}`,
            });
            return;
          }
          citizensToCreate.push({
            event: id,
            citizen: citizenId,
            household: householdId,
            status: "DISTRIBUTED",
            quantity: 1,
            unitValue: event?.budget || 0,
            totalValue: event?.budget || 0,
            note: `Phân phát quà từ danh sách đủ điều kiện`,
            // distributedAt sẽ được set tự động bởi service khi status là DISTRIBUTED
          });
        }
      });

      // Cập nhật những distribution đã có
      if (citizensToUpdate.length > 0) {
        try {
          await rewardService.distributions.distribute(citizensToUpdate, "");
        } catch (updateError) {
          console.error("Error updating distributions:", updateError);
          throw new Error(
            updateError.response?.data?.message ||
              `Không thể cập nhật ${citizensToUpdate.length} phân phối quà`
          );
        }
      }

      // Tạo những distribution mới
      if (citizensToCreate.length > 0) {
        try {
          await Promise.all(
            citizensToCreate.map((data) =>
              rewardService.distributions.create(data)
            )
          );
        } catch (createError) {
          console.error("Error creating distributions:", createError);
          throw new Error(
            createError.response?.data?.message ||
              `Không thể tạo ${citizensToCreate.length} phân phối quà`
          );
        }
      }

      // Tạo yêu cầu chỉnh sửa cho các công dân chưa có hộ khẩu
      if (citizensWithoutHousehold.length > 0) {
        try {
          const requestPromises = citizensWithoutHousehold.map((citizen) =>
            editRequestService.create({
              citizen: citizen.id,
              title: "Yêu cầu nhập hộ khẩu",
              description: `Công dân ${citizen.name} chưa có hộ khẩu. Vui lòng cập nhật thông tin hộ khẩu để có thể tham gia các sự kiện khen thưởng.`,
              reason: `Công dân ${citizen.name} chưa có hộ khẩu. Yêu cầu được tạo tự động khi phân phát quà.`,
              requestType: "THEM_NHAN_KHAU",
              proposedChanges: {
                details: `Yêu cầu nhập hộ khẩu cho công dân ${citizen.name}`,
                targetField: "household",
              },
            })
          );

          await Promise.all(requestPromises);

          const namesList = citizensWithoutHousehold
            .map((c) => c.name)
            .join(", ");
          const successMessage =
            citizensWithoutHousehold.length === 1
              ? `Đã tạo yêu cầu nhập hộ khẩu cho công dân "${namesList}". Yêu cầu đã được gửi đến công dân.`
              : `Đã tạo ${citizensWithoutHousehold.length} yêu cầu nhập hộ khẩu cho các công dân: ${namesList}. Yêu cầu đã được gửi đến các công dân.`;

          message.warning(successMessage, 10); // Hiển thị trong 10 giây
        } catch (requestError) {
          console.error("Error creating edit requests:", requestError);
          const namesList = citizensWithoutHousehold
            .map((c) => c.name)
            .join(", ");
          const errorMessage =
            citizensWithoutHousehold.length === 1
              ? `Công dân "${namesList}" chưa có hộ khẩu. Không thể tạo yêu cầu tự động. Vui lòng thử lại.`
              : `${citizensWithoutHousehold.length} công dân chưa có hộ khẩu: ${namesList}. Không thể tạo yêu cầu tự động. Vui lòng thử lại.`;
          message.error(errorMessage, 8);
        }
      }

      const totalProcessed = citizensToUpdate.length + citizensToCreate.length;
      if (totalProcessed > 0) {
        // Gửi thông báo cho chủ hộ của các công dân đã nhận quà
        try {
          const processedCitizens = eligibleCitizens.filter((c) =>
            citizenIds.includes(c._id)
          );

          // Lấy danh sách household IDs duy nhất
          const householdIds = [
            ...new Set(
              processedCitizens
                .map((c) => c.household?._id || c.household)
                .filter(Boolean)
            ),
          ];

          // Gửi thông báo cho từng chủ hộ
          const notificationPromises = householdIds.map(async (householdId) => {
            try {
              const household = await householdService.getById(householdId);
              const head = household?.head;

              if (head && head.user) {
                const headUserId = head.user._id || head.user;
                const citizenNames = processedCitizens
                  .filter(
                    (c) =>
                      (c.household?._id || c.household)?.toString() ===
                      householdId.toString()
                  )
                  .map((c) => c.fullName)
                  .join(", ");

                await notificationService.create({
                  toUser: headUserId,
                  title: "Thành viên trong hộ đã nhận quà",
                  message: `${citizenNames} trong hộ khẩu ${
                    household?.code || ""
                  } đã nhận quà từ sự kiện "${event?.name || ""}".`,
                  type: "REWARD",
                  entityType: "RewardDistribution",
                  entityId: id,
                  priority: "NORMAL",
                });
              }
            } catch (notifError) {
              console.error(
                `Error sending notification to household ${householdId}:`,
                notifError
              );
              // Không throw error, chỉ log để không ảnh hưởng đến quá trình đánh dấu
            }
          });

          await Promise.all(notificationPromises);
        } catch (notifError) {
          console.error(
            "Error sending notifications to household heads:",
            notifError
          );
          // Không throw error, chỉ log để không ảnh hưởng đến quá trình đánh dấu
        }

        message.success(`Đã đánh dấu ${totalProcessed} người đã nhận quà`);
        setSelectedRowKeys([]);
        fetchEligibleCitizens();
      } else if (citizensWithoutHousehold.length === 0) {
        message.warning("Không có công dân nào được xử lý");
      }
    } catch (error) {
      console.error("Error marking as received:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể đánh dấu đã nhận quà. Vui lòng thử lại!";
      message.error(errorMsg);
    } finally {
      setDistributing(false);
    }
  };

  const handleBulkMarkAsReceived = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một công dân");
      return;
    }
    handleMarkAsReceived(selectedRowKeys);
  };

  const handleSingleMarkAsReceived = async (citizenId) => {
    await handleMarkAsReceived([citizenId]);
  };

  const handleUndoReceived = async (distributionId) => {
    if (!distributionId) {
      message.warning("Không tìm thấy thông tin phân phối");
      return;
    }

    try {
      setDistributing(true);

      // Cập nhật status từ DISTRIBUTED về REGISTERED
      await rewardService.distributions.update(distributionId, {
        status: "REGISTERED",
        distributedAt: null,
        distributedBy: null,
        distributionNote: null,
      });

      message.success("Đã hoàn tác trạng thái nhận quà");
      fetchEligibleCitizens();
    } catch (error) {
      console.error("Error undoing received status:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể hoàn tác trạng thái. Vui lòng thử lại!";
      message.error(errorMsg);
    } finally {
      setDistributing(false);
    }
  };

  const handleGenerateDistributions = async () => {
    try {
      setGenerating(true);
      let result;

      if (event?.type === "SCHOOL_YEAR" || event?.type === "ANNUAL") {
        // Generate từ achievements
        if (!generateConfig.schoolYear) {
          message.warning("Vui lòng nhập năm học");
          return;
        }
        result = await rewardService.distributions.generateFromAchievements(
          id,
          generateConfig.schoolYear,
          false
        );
      } else {
        // Generate từ age range (1/6, Trung thu)
        result = await rewardService.distributions.generateFromAgeRange(
          id,
          generateConfig.minAge || 0,
          generateConfig.maxAge || 18,
          {
            quantity: 1,
            unitValue: event?.budget || 50000,
          },
          false
        );
      }

      message.success(`Đã tạo ${result.created || 0} bản ghi phân phối quà`);
      setIsGenerateModalVisible(false);
      setGenerateConfig({ schoolYear: "", minAge: 0, maxAge: 18 });
      fetchEligibleCitizens();
    } catch (error) {
      console.error("Error generating distributions:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể tạo danh sách phân phối";
      message.error(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    try {
      // Chuyển đổi eligible citizens thành format giống registrations để export
      const exportData = eligibleCitizens.map((citizen) => ({
        citizen: {
          fullName: citizen.fullName,
          nationalId: citizen.nationalId,
        },
        household: {
          code: citizen.household?.code || citizen.household,
        },
        status: citizen.status,
        distributedAt: citizen.distributedAt,
        quantity: citizen.quantity || 1,
        totalValue: citizen.totalValue || 0,
      }));

      if (exportData.length === 0) {
        message.warning("Không có dữ liệu để xuất");
        return;
      }

      const eventName = event?.name || "Su-kien";
      exportRegistrationsToExcel(exportData, eventName);
      message.success("Xuất danh sách thành công!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("Không thể xuất danh sách. Vui lòng thử lại!");
    }
  };

  const filteredCitizens = eligibleCitizens.filter((citizen) => {
    const matchesSearch =
      !searchText ||
      citizen.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      citizen.household?.code
        ?.toLowerCase()
        .includes(searchText.toLowerCase()) ||
      citizen.nationalId?.includes(searchText);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "DISTRIBUTED" && citizen.status === "DISTRIBUTED") ||
      (statusFilter === "NOT_RECEIVED" && citizen.status !== "DISTRIBUTED");

    return matchesSearch && matchesStatus;
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.status === "DISTRIBUTED", // Không cho chọn những người đã nhận
    }),
  };

  const handleViewDetail = (citizen) => {
    setViewingCitizen(citizen);
    setIsDetailModalVisible(true);
  };

  const fetchHouseholdStats = async () => {
    try {
      setLoadingHouseholdStats(true);
      const stats = await rewardService.events.getHouseholdStats(id);
      setHouseholdStats(stats || []);
      setIsHouseholdStatsVisible(true);
    } catch (error) {
      console.error("Error fetching household stats:", error);
      message.error("Không thể tải thống kê theo hộ gia đình");
    } finally {
      setLoadingHouseholdStats(false);
    }
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      fixed: "left",
      align: "center",
      render: (_, __, index) => {
        return (pagination.current - 1) * pagination.pageSize + index + 1;
      },
    },
    {
      title: "Họ tên",
      key: "fullName",
      width: 200,
      fixed: "left",
      ellipsis: true,
      render: (_, record) => (
        <Button
          type="link"
          style={{ padding: 0, height: "auto", fontWeight: 600 }}
          onClick={() => handleViewDetail(record)}
        >
          {record.fullName || "N/A"}
        </Button>
      ),
    },
    {
      title: "CMND/CCCD",
      key: "nationalId",
      width: 140,
      render: (_, record) => <Text>{record.nationalId || "N/A"}</Text>,
    },
    {
      title: "Hộ khẩu",
      key: "household",
      width: 120,
      render: (_, record) => (
        <Text>{record.household?.code || record.household || "N/A"}</Text>
      ),
    },
    {
      title: "Ngày sinh",
      key: "dateOfBirth",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Text>
          {record.dateOfBirth
            ? dayjs(record.dateOfBirth).format("DD/MM/YYYY")
            : "N/A"}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      align: "center",
      render: (_, record) => {
        if (record.status === "DISTRIBUTED") {
          return (
            <Space direction="vertical" size={4}>
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Đã nhận quà
              </Tag>
              {record.distributedAt && (
                <Text type="secondary" style={{ fontSize: "11px" }}>
                  {dayjs(record.distributedAt).format("DD/MM/YYYY HH:mm")}
                </Text>
              )}
            </Space>
          );
        }
        return <Tag color="orange">Chưa nhận quà</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      fixed: "right",
      align: "center",
      render: (_, record) => {
        if (record.status === "DISTRIBUTED") {
          return (
            <Popconfirm
              title="Hoàn tác trạng thái nhận quà?"
              description="Bạn có chắc muốn hoàn tác trạng thái đã nhận quà cho người này?"
              onConfirm={() => handleUndoReceived(record.distributionId)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button
                type="default"
                size="small"
                icon={<UndoOutlined />}
                loading={distributing}
                danger
              >
                Quay lại
              </Button>
            </Popconfirm>
          );
        }
        return (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleSingleMarkAsReceived(record._id)}
            loading={distributing}
            disabled={useMockData}
          >
            Nhận quà
          </Button>
        );
      },
    },
  ];

  const getGenerateModalContent = () => {
    if (event?.type === "SCHOOL_YEAR" || event?.type === "ANNUAL") {
      return (
        <div>
          <p>Nhập năm học để tạo danh sách từ thành tích học tập:</p>
          <Input
            placeholder="Ví dụ: 2023-2024"
            value={generateConfig.schoolYear}
            onChange={(e) =>
              setGenerateConfig({
                ...generateConfig,
                schoolYear: e.target.value,
              })
            }
            style={{ marginTop: 8 }}
          />
        </div>
      );
    } else {
      return (
        <div>
          <p>Nhập độ tuổi để tạo danh sách:</p>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={12}>
              <Input
                placeholder="Tuổi tối thiểu"
                type="number"
                value={generateConfig.minAge}
                onChange={(e) =>
                  setGenerateConfig({
                    ...generateConfig,
                    minAge: parseInt(e.target.value) || 0,
                  })
                }
              />
            </Col>
            <Col span={12}>
              <Input
                placeholder="Tuổi tối đa"
                type="number"
                value={generateConfig.maxAge}
                onChange={(e) =>
                  setGenerateConfig({
                    ...generateConfig,
                    maxAge: parseInt(e.target.value) || 18,
                  })
                }
              />
            </Col>
          </Row>
        </div>
      );
    }
  };

  return (
    <Layout>
      <div>
        {/* Header gradient */}
        <Card
          bordered={false}
          style={{
            marginBottom: 24,
            background:
              "linear-gradient(90deg,rgba(165, 202, 210, 1) 0%, rgba(9, 9, 121, 1) 35%, rgba(0, 212, 255, 1) 100%)",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
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
                  Danh sách Nhận quà
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
                  {event ? event.name : "Quản lý danh sách nhận quà"}
                </Text>
              </div>
            </div>

            <div>
              <Space>
                <Button
                  icon={<ExportOutlined />}
                  onClick={handleExport}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderColor: "rgba(255,255,255,0.5)",
                    color: "#fff",
                    fontWeight: 500,
                    height: 40,
                    borderRadius: 8,
                    transition: "all 0.3s ease",
                  }}
                  className="hover-back"
                >
                  Xuất danh sách
                </Button>
                <Button
                  icon={<HomeOutlined />}
                  onClick={fetchHouseholdStats}
                  loading={loadingHouseholdStats}
                  style={{
                    background: "#fff",
                    color: "#1890ff",
                    fontWeight: 500,
                    height: 40,
                    borderRadius: 8,
                    transition: "all 0.3s ease",
                  }}
                  className="hover-back"
                >
                  Thống kê theo hộ
                </Button>
              </Space>
            </div>
          </div>

          {/* Hover effect */}
          <style>{`
            .hover-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 10px 25px rgba(24, 144, 255, 0.35);
            }
            .hover-back:hover {
              transform: translateY(-3px);
              box-shadow: 0 6px 16px rgba(0,0,0,0.15);
            }
          `}</style>
        </Card>

        {/* Content Card */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            transition: "all 0.3s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          className="hover-table-card"
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Thống kê */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Tổng số đủ điều kiện"
                    value={stats.total}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Đã nhận quà"
                    value={stats.received}
                    valueStyle={{ color: "#3f8600" }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Chưa nhận quà"
                    value={stats.notReceived}
                    valueStyle={{ color: "#cf1322" }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Tỷ lệ nhận quà"
                    value={
                      stats.total > 0
                        ? ((stats.received / stats.total) * 100).toFixed(1)
                        : 0
                    }
                    suffix="%"
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Input
                  placeholder="Tìm kiếm theo tên/CMND/hộ khẩu..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="Lọc theo trạng thái"
                  style={{ width: "100%" }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                >
                  <Option value="ALL">Tất cả</Option>
                  <Option value="NOT_RECEIVED">Chưa nhận quà</Option>
                  <Option value="DISTRIBUTED">Đã nhận quà</Option>
                </Select>
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={filteredCitizens}
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} công dân đủ điều kiện`,
                onChange: (page, pageSize) => {
                  setPagination({ ...pagination, current: page, pageSize });
                },
              }}
              rowClassName={() => "hoverable-row"}
            />
          </Space>
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

      {/* Modal tạo danh sách phân phối */}
      <Modal
        title="Tạo danh sách phân phối quà"
        open={isGenerateModalVisible}
        onOk={handleGenerateDistributions}
        onCancel={() => setIsGenerateModalVisible(false)}
        confirmLoading={generating}
        okText="Tạo danh sách"
        cancelText="Hủy"
      >
        {getGenerateModalContent()}
      </Modal>

      {/* Modal chi tiết công dân */}
      <Modal
        title="Chi tiết công dân"
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setViewingCitizen(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsDetailModalVisible(false);
              setViewingCitizen(null);
            }}
          >
            Đóng
          </Button>,
          viewingCitizen?.status !== "DISTRIBUTED" && (
            <Button
              key="mark"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                if (viewingCitizen) {
                  handleSingleMarkAsReceived(viewingCitizen._id);
                  setIsDetailModalVisible(false);
                  setViewingCitizen(null);
                }
              }}
              loading={distributing}
              disabled={useMockData}
            >
              Đánh dấu đã nhận quà
            </Button>
          ),
        ].filter(Boolean)}
        width={600}
      >
        {viewingCitizen && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Họ và tên">
              <Text strong>{viewingCitizen.fullName || "N/A"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="CMND/CCCD">
              {viewingCitizen.nationalId || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày sinh">
              {viewingCitizen.dateOfBirth
                ? dayjs(viewingCitizen.dateOfBirth).format("DD/MM/YYYY")
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Giới tính">
              {viewingCitizen.gender === "MALE"
                ? "Nam"
                : viewingCitizen.gender === "FEMALE"
                ? "Nữ"
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Hộ khẩu">
              {viewingCitizen.household?.code ||
                viewingCitizen.household ||
                "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái nhận quà">
              {viewingCitizen.status === "DISTRIBUTED" ? (
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  Đã nhận quà
                </Tag>
              ) : (
                <Tag color="orange">Chưa nhận quà</Tag>
              )}
            </Descriptions.Item>
            {viewingCitizen.distributedAt && (
              <Descriptions.Item label="Thời gian nhận quà">
                {dayjs(viewingCitizen.distributedAt).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Số lượng">
              {viewingCitizen.quantity || 1}
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị quà">
              {viewingCitizen.totalValue
                ? `${viewingCitizen.totalValue.toLocaleString("vi-VN")} VNĐ`
                : event?.budget
                ? `${event.budget.toLocaleString("vi-VN")} VNĐ`
                : "N/A"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Modal thống kê theo hộ gia đình */}
      <Modal
        title="Thống kê theo Hộ gia đình"
        open={isHouseholdStatsVisible}
        onCancel={() => {
          setIsHouseholdStatsVisible(false);
          setHouseholdStats([]);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsHouseholdStatsVisible(false);
              setHouseholdStats([]);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={900}
      >
        <Table
          columns={[
            {
              title: "STT",
              key: "index",
              width: 60,
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã hộ khẩu",
              dataIndex: "householdCode",
              key: "householdCode",
              width: 120,
            },
            {
              title: "Địa chỉ",
              dataIndex: "householdAddress",
              key: "householdAddress",
              width: 200,
              ellipsis: true,
            },
            {
              title: "Số người nhận",
              dataIndex: "recipientCount",
              key: "recipientCount",
              width: 120,
              align: "center",
              render: (count) => <Text strong>{count || 0}</Text>,
            },
            {
              title: "Số phần quà",
              dataIndex: "totalQuantity",
              key: "totalQuantity",
              width: 120,
              align: "center",
              render: (qty) => <Text strong>{qty || 0}</Text>,
            },
            {
              title: "Tổng giá trị",
              dataIndex: "totalValue",
              key: "totalValue",
              width: 200,
              align: "right",
              render: (value, record) => {
                const unitValue =
                  record.totalQuantity > 0
                    ? (record.totalValue || 0) / record.totalQuantity
                    : 0;
                return (
                  <Space
                    direction="vertical"
                    size={2}
                    style={{ textAlign: "right" }}
                  >
                    <Text strong style={{ color: "#52c41a" }}>
                      {value ? `${value.toLocaleString("vi-VN")} VNĐ` : "0 VNĐ"}
                    </Text>
                    {unitValue > 0 && (
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        ({Math.round(unitValue).toLocaleString("vi-VN")}{" "}
                        VNĐ/phần quà)
                      </Text>
                    )}
                  </Space>
                );
              },
            },
          ]}
          dataSource={householdStats}
          loading={loadingHouseholdStats}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} hộ gia đình`,
          }}
          scroll={{ x: 700 }}
          summary={(pageData) => {
            const totalQuantity = householdStats.reduce(
              (sum, h) => sum + (h.totalQuantity || 0),
              0
            );
            const totalValue = householdStats.reduce(
              (sum, h) => sum + (h.totalValue || 0),
              0
            );
            const totalRecipients = householdStats.reduce(
              (sum, h) => sum + (h.recipientCount || 0),
              0
            );
            const avgUnitValue =
              totalQuantity > 0 ? totalValue / totalQuantity : 0;

            return (
              <Table.Summary>
                {householdStats.length > 0 && (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>Tổng cộng (tất cả)</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      <Text strong>{totalRecipients}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center">
                      <Text strong>{totalQuantity}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <Space
                        direction="vertical"
                        size={2}
                        style={{ textAlign: "right" }}
                      >
                        <Text strong style={{ color: "#52c41a" }}>
                          {totalValue.toLocaleString("vi-VN")} VNĐ
                        </Text>
                        {avgUnitValue > 0 && (
                          <Text type="secondary" style={{ fontSize: "11px" }}>
                            ({Math.round(avgUnitValue).toLocaleString("vi-VN")}{" "}
                            VNĐ/phần quà)
                          </Text>
                        )}
                      </Space>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              </Table.Summary>
            );
          }}
        />
      </Modal>
    </Layout>
  );
};

export default RewardEventRegistrations;
