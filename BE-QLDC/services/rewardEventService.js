const { RewardEvent, Citizen, StudentAchievement, RewardDistribution } = require("../models");

module.exports = {
  async create(data) {
    return RewardEvent.create(data);
  },
  async getAll(filter = {}, options = {}) {
    const { limit = 50, page = 1, sort = "-createdAt" } = options;
    const docs = await RewardEvent.find(filter)
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await RewardEvent.countDocuments(filter);
    return { docs, total, page, limit };
  },
  async getById(id) {
    return RewardEvent.findById(id);
  },
  async update(id, data) {
    return RewardEvent.findByIdAndUpdate(id, data, { new: true });
  },
  async delete(id) {
    return RewardEvent.findByIdAndDelete(id);
  },

  // Tính số lượng công dân đủ điều kiện cho một event
  async getEligibleCitizensCount(eventId) {
    const event = await RewardEvent.findById(eventId);
    if (!event) return 0;

    let eligibleCount = 0;

    switch (event.type) {
      case "ANNUAL":
        // Dựa trên targetAge từ annual occasions (hardcoded logic)
        eligibleCount = await this.getAnnualEligibleCount(event);
        break;
      case "SCHOOL_YEAR":
        // Học sinh có thành tích
        eligibleCount = await StudentAchievement.distinct("citizen").then(
          (citizens) => citizens.length
        );
        break;
      case "SPECIAL":
      case "SPECIAL_OCCASION":
        // Tất cả công dân đang sống và thường trú
        eligibleCount = await Citizen.countDocuments({
          status: "ALIVE",
          residenceStatus: "THUONG_TRU",
        });
        break;
      default:
        eligibleCount = 0;
    }

    return eligibleCount;
  },

  // Lấy danh sách công dân đủ điều kiện
  async getEligibleCitizens(eventId, options = {}) {
    const event = await RewardEvent.findById(eventId);
    if (!event) return [];

    const { limit = 50, page = 1 } = options;
    let citizens = [];

    switch (event.type) {
      case "ANNUAL":
        citizens = await this.getAnnualEligibleCitizens(event, options);
        break;
      case "SCHOOL_YEAR":
        const studentCitizens = await StudentAchievement.distinct("citizen");
        citizens = await Citizen.find({
          _id: { $in: studentCitizens },
          status: "ALIVE",
        })
          .populate("household", "address")
          .sort("-createdAt")
          .limit(limit)
          .skip((page - 1) * limit);
        break;
      case "SPECIAL":
      case "SPECIAL_OCCASION":
        citizens = await Citizen.find({
          status: "ALIVE",
          residenceStatus: "THUONG_TRU",
        })
          .populate("household", "address")
          .sort("-createdAt")
          .limit(limit)
          .skip((page - 1) * limit);
        break;
      default:
        citizens = [];
    }

    return citizens;
  },

  // Helper: Tính eligible count cho ANNUAL events
  async getAnnualEligibleCount(event) {
    const eventName = event.name.toLowerCase();
    let query = { status: "ALIVE" };

    // Sử dụng ngày sự kiện hoặc ngày hiện tại để tính tuổi chính xác
    const referenceDate = event.date ? new Date(event.date) : new Date();
    
    // Trẻ em 0-18 tuổi (Trung Thu)
    if (eventName.includes("trung thu")) {
      // Người có tuổi từ 0-18 tại thời điểm sự kiện
      // Sinh từ (referenceDate - 18 năm) đến referenceDate
      // Ví dụ: Nếu sự kiện 15/09/2024, thì:
      // - minDate = 15/09/2006 (người 18 tuổi)
      // - maxDate = 15/09/2024 (người 0 tuổi, mới sinh)
      const minDate = new Date(referenceDate);
      minDate.setFullYear(referenceDate.getFullYear() - 18);
      minDate.setHours(0, 0, 0, 0);
      const maxDate = new Date(referenceDate);
      maxDate.setHours(23, 59, 59, 999);
      query.dateOfBirth = { $gte: minDate, $lte: maxDate };
      query.residenceStatus = "THUONG_TRU"; // Phải có hộ khẩu
    }
    // Trẻ em 0-14 tuổi (Quốc tế Thiếu nhi)
    else if (eventName.includes("thiếu nhi") || eventName.includes("quốc tế thiếu nhi")) {
      const minDate = new Date(referenceDate);
      minDate.setFullYear(referenceDate.getFullYear() - 14);
      minDate.setHours(0, 0, 0, 0);
      const maxDate = new Date(referenceDate);
      maxDate.setHours(23, 59, 59, 999);
      query.dateOfBirth = { $gte: minDate, $lte: maxDate };
      query.residenceStatus = "THUONG_TRU"; // Phải có hộ khẩu
    }
    // Phụ nữ (Ngày Phụ nữ Việt Nam)
    else if (eventName.includes("phụ nữ") || eventName.includes("20/10")) {
      query.gender = "FEMALE";
      query.residenceStatus = "THUONG_TRU";
    }
    // Tất cả công dân thường trú (Tết, Quốc khánh, v.v.)
    else {
      query.residenceStatus = "THUONG_TRU";
    }

    return await Citizen.countDocuments(query);
  },

  // Helper: Lấy eligible citizens cho ANNUAL events
  async getAnnualEligibleCitizens(event, options = {}) {
    const { limit = 50, page = 1 } = options;
    const eventName = event.name.toLowerCase();
    let query = { status: "ALIVE" };

    // Sử dụng ngày sự kiện hoặc ngày hiện tại để tính tuổi chính xác
    const referenceDate = event.date ? new Date(event.date) : new Date();

    // Trẻ em 0-18 tuổi (Trung Thu)
    if (eventName.includes("trung thu")) {
      const minDate = new Date(referenceDate);
      minDate.setFullYear(referenceDate.getFullYear() - 18);
      minDate.setHours(0, 0, 0, 0);
      const maxDate = new Date(referenceDate);
      maxDate.setHours(23, 59, 59, 999);
      query.dateOfBirth = { $gte: minDate, $lte: maxDate };
      query.residenceStatus = "THUONG_TRU"; // Phải có hộ khẩu
    }
    // Trẻ em 0-14 tuổi (Quốc tế Thiếu nhi)
    else if (eventName.includes("thiếu nhi") || eventName.includes("quốc tế thiếu nhi")) {
      const minDate = new Date(referenceDate);
      minDate.setFullYear(referenceDate.getFullYear() - 14);
      minDate.setHours(0, 0, 0, 0);
      const maxDate = new Date(referenceDate);
      maxDate.setHours(23, 59, 59, 999);
      query.dateOfBirth = { $gte: minDate, $lte: maxDate };
      query.residenceStatus = "THUONG_TRU"; // Phải có hộ khẩu
    }
    // Phụ nữ (Ngày Phụ nữ Việt Nam)
    else if (eventName.includes("phụ nữ") || eventName.includes("20/10")) {
      query.gender = "FEMALE";
      query.residenceStatus = "THUONG_TRU";
    }
    // Tất cả công dân thường trú (Tết, Quốc khánh, v.v.)
    else {
      query.residenceStatus = "THUONG_TRU";
    }

    return await Citizen.find(query)
      .populate("household", "code address")
      .sort("household createdAt") // Sắp xếp theo hộ gia đình để dễ nhóm
      .limit(limit)
      .skip((page - 1) * limit);
  },

  // Lấy thống kê cho event (eligible, registered, distributed)
  async getEventSummary(eventId) {
    const event = await RewardEvent.findById(eventId);
    if (!event) return null;

    const eligibleCount = await this.getEligibleCitizensCount(eventId);
    const registeredCount = await RewardDistribution.countDocuments({
      event: eventId,
    });
    const distributedCount = await RewardDistribution.countDocuments({
      event: eventId,
      status: "DISTRIBUTED",
    });

    return {
      eligibleCount,
      registeredCount,
      distributedCount,
      ratio: eligibleCount > 0 ? (distributedCount / eligibleCount * 100).toFixed(1) : 0,
    };
  },
};
