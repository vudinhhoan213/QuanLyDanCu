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
    maxAge: 120,
  });
  const [useMockData, setUseMockData] = useState(false);
  const [viewingCitizen, setViewingCitizen] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [householdStats, setHouseholdStats] = useState([]);
  const [isHouseholdStatsVisible, setIsHouseholdStatsVisible] = useState(false);
  const [loadingHouseholdStats, setLoadingHouseholdStats] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEligibleCitizens();
    }
  }, [
    id,
    useMockData,
    event?.targetAge?.min,
    event?.targetAge?.max,
    event?.targetGender,
    event?.date,
  ]);

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

  // Tạo dữ liệu mẫu để test
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
      "Nguyễn Văn Hùng",
      "Nguyễn Thị Lan",
      "Lê Văn Minh",
      "Vũ Thị Nga",
      "Phan Văn Oanh",
      "Trương Thị Phượng",
      "Đinh Văn Quang",
      "Lương Thị Quyền",
      "Nguyễn Thị Mai",
      "Trần Văn Nam",
      "Lê Thị Hồng",
      "Phạm Văn Cường",
    ];

    const eventName = event?.name?.toLowerCase() || "";
    const currentYear = new Date().getFullYear();

    // Xác định sự
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
      const isReceived = i < 12; // 12 người nhận, 8 người chưa nhận

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

      // Sử dụng dữ liệu mẫu nếu bật chế độ mock
      if (useMockData) {
        const mockCitizens = generateMockData();
        const filtered =
          statusFilter === "ALL"
            ? mockCitizens
            : statusFilter === "DISTRIBUTED"
            ? mockCitizens.filter((c) => c.status === "DISTRIBUTED")
            : mockCitizens.filter((c) => c.status !== "DISTRIBUTED");

        setEligibleCitizens(filtered);
        setPagination((prev) => ({
          ...prev,
          total: filtered.length,
        }));

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


      const matchesTarget = (citizen) => {
        // Gender constraint
        if (event?.targetGender && citizen.gender) {
          if (citizen.gender !== event.targetGender) return false;
        }

        // Age constraint
        if (event?.targetAge) {
          if (!citizen.dateOfBirth) return false;
          const refDate = event?.date ? dayjs(event.date) : dayjs();
          const age = refDate.diff(dayjs(citizen.dateOfBirth), "year", true);
          const min =
            typeof event.targetAge.min === "number" ? event.targetAge.min : 0;
          const max =
            typeof event.targetAge.max === "number" &&
            event.targetAge.max !== null
              ? event.targetAge.max
              : 200;
          if (age < min || age > max) return false;
        }

        return true;
      };

      // Lay danh sach du dieu kien tu nhan khau va ghep trang thai phat qua
      let summary = null;
      let allDistributions = [];
      let achievements = [];
      let achievementCitizenIds = new Set();
      let distributionsWithCitizen = [];
      let extraFromAchievements = [];

      try {
        summary = await rewardService.events.getSummary(id);
      } catch (summaryError) {
        console.error("Error fetching event summary:", summaryError);
      }

      try {
        const distRes = await rewardService.distributions.getAll({
          event: id,
          limit: 1000,
        });
        allDistributions = distRes.docs || [];
      } catch (distError) {
        console.error("Error fetching distributions:", distError);
      }

      try {
        const achievementsRes = await rewardService.achievements.getAll({
          limit: 1000,
        });
        achievements = achievementsRes.docs || [];
        achievementCitizenIds = new Set(
          achievements
            .map((a) => a.citizen?._id || a.citizen)
            .filter(Boolean)
            .map((id) => id.toString())
        );
      } catch (achError) {
        console.error("Error fetching achievements:", achError);
      }

      if (allDistributions.length > 0) {
        distributionsWithCitizen = allDistributions.map((dist) => {
          const citizen = dist.citizen || {};
          return {
            key: citizen._id || dist._id,
            _id: citizen._id,
            fullName: citizen.fullName || "N/A",
            nationalId: citizen.nationalId || "N/A",
            dateOfBirth: citizen.dateOfBirth,
            gender: citizen.gender,
            household: dist.household || citizen.household,
            distributionId: dist._id,
            status: dist.status || "REGISTERED",
            distributedAt: dist.distributedAt,
            distributionNote: dist.note || dist.distributionNote,
            quantity: dist.quantity || 1,
            totalValue: dist.totalValue || 0,
            unitValue: dist.unitValue || 0,
          };
        });

        const existingIds = new Set(
          distributionsWithCitizen
            .map((c) => c._id)
            .filter(Boolean)
            .map((id) => id.toString())
        );
        extraFromAchievements = achievements
          .filter((a) => a.citizen)
          .filter(
            (a) =>
              !existingIds.has((a.citizen._id || a.citizen).toString())
          )
          .map((a) => {
            const citizen = a.citizen;
            return {
              key: citizen._id || a._id,
              _id: citizen._id,
              fullName: citizen.fullName || "N/A",
              nationalId: citizen.nationalId || "N/A",
              dateOfBirth: citizen.dateOfBirth,
              gender: citizen.gender,
              household: citizen.household,
              distributionId: null,
              status: "NOT_RECEIVED",
              distributedAt: null,
              distributionNote: null,
              quantity: 1,
              totalValue: event?.budget || 0,
              unitValue: event?.budget || 0,
            };
          });
      }

      const distributionMap = {};
      allDistributions.forEach((dist) => {
        const citizenId = dist.citizen?._id || dist.citizen;
        if (citizenId) {
          distributionMap[citizenId.toString()] = dist;
        }
      });

      const citizenLimit = Math.max(summary?.eligibleCount || 0, 1000);
      const response = await rewardService.events.getEligibleCitizens(id, {
        page: 1,
        limit: citizenLimit,
      });

      const citizensWithStatus = (response.docs || []).map((citizen) => {
        const distribution = distributionMap[citizen._id?.toString()];
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

      const achievementExtras = achievements
        .filter((a) => a.citizen)
        .filter(
          (a) =>
            !citizensWithStatus.find(
              (c) =>
                c._id?.toString() === (a.citizen._id || a.citizen).toString()
            )
        )
        .map((a) => {
          const citizen = a.citizen;
          return {
            key: citizen._id || a._id,
            ...citizen,
            distributionId: null,
            status: "NOT_RECEIVED",
            distributedAt: null,
            distributionNote: null,
            quantity: 1,
            totalValue: event?.budget || 0,
            unitValue: event?.budget || 0,
          };
        });

      // Hợp nhất danh sách: eligible + thành tích + phân phối (ưu tiên bản ghi có distribution)
      const mergedMap = new Map();
      const pushIfMissing = (item) => {
        if (!item?._id) return;
        const key = item._id.toString();
        if (!mergedMap.has(key)) {
          mergedMap.set(key, item);
        } else {
          // Ưu tiên bản ghi có distributionId
          const existing = mergedMap.get(key);
          if (!existing.distributionId && item.distributionId) {
            mergedMap.set(key, item);
          }
        }
      };

      distributionsWithCitizen.forEach(pushIfMissing);
      citizensWithStatus.forEach(pushIfMissing);
      achievementExtras.forEach(pushIfMissing);

      const mergedList = Array.from(mergedMap.values());
      const targetFiltered = mergedList.filter(
        (c) => matchesTarget(c) || achievementCitizenIds.has(c._id?.toString())
      );
      const totalEligible = targetFiltered.length;
      const receivedCount = targetFiltered.filter(
        (c) => c.status === "DISTRIBUTED"
      ).length;
      const notReceivedCount = totalEligible - receivedCount;

      setEligibleCitizens(targetFiltered);
      setStats({
        total: totalEligible,
        received: receivedCount,
        notReceived: notReceivedCount,
      });
      setPagination((prev) => {
        const totalPages = Math.max(
          1,
          Math.ceil((targetFiltered.length || 0) / (prev.pageSize || 1))
        );
        return {
          ...prev,
          total: targetFiltered.length,
          current:
            prev.current > totalPages && targetFiltered.length > 0
              ? 1
              : prev.current,
        };
      });
      setEligibleCitizens(citizensWithStatus);
      setStats({
        total: totalEligible || citizensWithStatus.length,
        received: receivedCount,
        notReceived: notReceivedCount,
      });
      setPagination((prev) => {
        const totalPages = Math.max(
          1,
          Math.ceil((citizensWithStatus.length || 0) / (prev.pageSize || 1))
        );
        return {
          ...prev,
          total: citizensWithStatus.length,
          current:
            prev.current > totalPages && citizensWithStatus.length > 0
              ? 1
              : prev.current,
        };
      });
    } catch (error) {
      console.error("Error fetching eligible citizens:", error);
      message.error("Không thể tải danh sách công dân đủ điều kiện");
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

      // Fetch tất cả distribution hiện có cho sự kiện
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
          // Kiểm tra xem distribution này có tồn tại và chưa DISTRIBUTED không
          const existingDist = allDistributions.find(
            (d) => d._id?.toString() === citizen.distributionId?.toString()
          );
          if (existingDist && existingDist.status !== "DISTRIBUTED") {
            citizensToUpdate.push(citizen.distributionId);
          }
          // Nếu đã DISTRIBUTED rồi, bỏ qua
        } else {
          // Kiểm tra xem có distribution cho citizen và event này chưa (tránh duplicate)
          const existingDist = allDistributions.find(
            (d) =>
              (d.citizen?._id || d.citizen)?.toString() ===
                citizenId.toString() &&
              (d.event?._id || d.event)?.toString() === id.toString()
          );

          if (existingDist) {
            // Nếu đã có nhưng chưa được DISTRIBUTED, thêm vào danh sách update
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
            note: `phân phối quà sự kiện "${event?.name || ""}"`,
            // distributedAt và distributedBy sẽ được set trong service
          });
        }
      });

      // Cập nhật những distribution có
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
              reason: `Công dân ${citizen.name} chưa có hộ khẩu. Yêu cầu nhập hộ khẩu khi phân phối quà.`,
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
              ? `Tạo yêu cầu nhập hộ khẩu cho công dân "${namesList}". Yêu cầu đã được gửi đến công dân.`
              : `Tạo ${citizensWithoutHousehold.length} yêu cầu nhập hộ khẩu cho công dân: ${namesList}. Yêu cầu đã được gửi đến công dân.`;

          message.warning(successMessage, 10); // Hiển thị trong 10 giây
        } catch (requestError) {
          console.error("Error creating edit requests:", requestError);
          const namesList = citizensWithoutHousehold
            .map((c) => c.name)
            .join(", ");
          const errorMessage =
            citizensWithoutHousehold.length === 1
              ? `Công dân "${namesList}" chưa có hộ khẩu. Không thể tạo yêu cầu nhập hộ khẩu. Vui lòng thử lại.`
              : `${citizensWithoutHousehold.length} công dân chưa có hộ khẩu: ${namesList}. Không thể tạo yêu cầu nhập hộ khẩu. Vui lòng thử lại.`;
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
                  title: "Thành viên trong hộ khẩu đã nhận quà",
                  message: `${citizenNames} trong hộ khẩu ${
                    household?.code || ""
                  } đã nhận quà tại sự kiện "${event?.name || ""}".`,
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
              // Không throw error, để tiếp tục gửi thông báo cho các hộ khác
            }
          });

          await Promise.all(notificationPromises);
        } catch (notifError) {
          console.error(
            "Error sending notifications to household heads:",
            notifError
          );
          // Không throw error, để tiếp tục gửi thông báo cho các hộ khác
        }

        message.success(
          `Đã phân phối ${totalProcessed} người đã nhận quà thành công!`
        );
        setSelectedRowKeys([]);
        fetchEligibleCitizens();
      } else if (citizensWithoutHousehold.length === 0) {
        message.warning("Không có công dân nào nhận quà");
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
        "Không thể phân phối quà. Vui lòng thử lại!";
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

      // Cß║¡p nhß║¡t status tß╗½ DISTRIBUTED vß╗ü REGISTERED
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

      if (event?.type === "SCHOOL_YEAR") {
        // Generate tß╗½ achievements
        if (!generateConfig.schoolYear) {
          message.warning("Vui lòng nhập năm học để tạo danh sách");
          return;
        }
        result = await rewardService.distributions.generateFromAchievements(
          id,
          generateConfig.schoolYear,
          false
        );
      } else {
        // Generate from age range (1/6, Trung thu)
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

      message.success(
        `Đã tạo ${result.created || 0} bản ghi phân phối quà mới!`
      );
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

  const paginatedCitizens = filteredCitizens.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  useEffect(() => {
    const maxPage = Math.max(
      1,
      Math.ceil((filteredCitizens.length || 0) / (pagination.pageSize || 1))
    );
    if (pagination.current > maxPage) {
      setPagination((prev) => ({ ...prev, current: maxPage }));
    }
  }, [filteredCitizens.length, pagination.pageSize]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.status === "DISTRIBUTED", // Kh├┤ng cho chß╗ìn nhß╗»ng ng╞░ß╗¥i ─æ├ú nhß║¡n
    }),
  };

  const tablePagination = {
    ...pagination,
    total: filteredCitizens.length,
    showSizeChanger: true,
    showTotal: (total) => `Tổng ${total} công dân đủ điều kiện`,
    onChange: (page, pageSize) => {
      setPagination((prev) => ({ ...prev, current: page, pageSize }));
    },
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
              description="Bạn có chắc chắn muốn hoàn tác trạng thái nhận quà cho người này?"
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
          <p>Nhập năm học để tạo danh sách thành tích học tập:</p>
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
          <p>Nhập tuổi để tạo danh sách thành tích:</p>
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
                  Xuuất danh sách
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
                  Thống kê theo hộ gia đình
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
            {/* Thß╗æng k├¬ */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Tổng số người đăng ký"
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
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setPagination((prev) => ({ ...prev, current: 1 }));
                  }}
                  allowClear
                />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="Lọc theo trạng thái"
                  style={{ width: "100%" }}
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setPagination((prev) => ({ ...prev, current: 1 }));
                  }}
                >
                  <Option value="ALL">Tất cả</Option>
                  <Option value="NOT_RECEIVED">Chưa nhận quà</Option>
                  <Option value="DISTRIBUTED">Đã nhận quà</Option>
                </Select>
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={paginatedCitizens}
              loading={loading}
              pagination={tablePagination}
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

      {/* Modal tạo danh sách phân phối quà */}
      <Modal
        title="Tạo danh sách phân phối quà"
        open={isGenerateModalVisible}
        onOk={handleGenerateDistributions}
        onCancel={() => setIsGenerateModalVisible(false)}
        confirmLoading={generating}
        okText="Tạo danh sách"
        cancelText="Hß╗ºy"
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
            ─É├│ng
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
              Nhận quà
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
            <Descriptions.Item label="Số lượng quà">
              {viewingCitizen.quantity || 1}
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị quà">
              {viewingCitizen.totalValue
                ? `${viewingCitizen.totalValue.toLocaleString("vi-VN")} VN─É`
                : event?.budget
                ? `${event.budget.toLocaleString("vi-VN")} VN─É`
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
            ─É├│ng
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
                      {value
                        ? `${value.toLocaleString("vi-VN")} VN─É`
                        : "0 VN─É"}
                    </Text>
                    {unitValue > 0 && (
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        ({Math.round(unitValue).toLocaleString("vi-VN")}{" "}
                        VN─É/phần quà)
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
            showTotal: (total) => `Tß╗òng ${total} hß╗Ö gia ─æ├¼nh`,
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
                          {totalValue.toLocaleString("vi-VN")} VN─É
                        </Text>
                        {avgUnitValue > 0 && (
                          <Text type="secondary" style={{ fontSize: "11px" }}>
                            ({Math.round(avgUnitValue).toLocaleString("vi-VN")}{" "}
                            VN─É/phần quà)
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
