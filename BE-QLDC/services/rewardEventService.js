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
    // Hardcoded logic dựa trên tên event (có thể cải thiện sau)
    const eventName = event.name.toLowerCase();

    if (eventName.includes("trung thu") || eventName.includes("thiếu nhi")) {
      // Trẻ em 0-14 tuổi cho Trung Thu và Quốc tế Thiếu nhi
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 14);
      return await Citizen.countDocuments({
        status: "ALIVE",
        dateOfBirth: { $gte: cutoffDate },
      });
    } else if (eventName.includes("tết nguyên đán") || eventName.includes("đoan ngọ")) {
      // Tất cả công dân
      return await Citizen.countDocuments({
        status: "ALIVE",
        residenceStatus: "THUONG_TRU",
      });
    } else {
      // Mặc định: tất cả công dân
      return await Citizen.countDocuments({
        status: "ALIVE",
        residenceStatus: "THUONG_TRU",
      });
    }
  },

  // Helper: Lấy eligible citizens cho ANNUAL events
  async getAnnualEligibleCitizens(event, options = {}) {
    const { limit = 50, page = 1 } = options;
    const eventName = event.name.toLowerCase();

    let query = { status: "ALIVE" };

    if (eventName.includes("trung thu") || eventName.includes("thiếu nhi")) {
      // Trẻ em 0-14 tuổi
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 14);
      query.dateOfBirth = { $gte: cutoffDate };
    } else if (eventName.includes("tết nguyên đán") || eventName.includes("đoan ngọ")) {
      // Tất cả công dân thường trú
      query.residenceStatus = "THUONG_TRU";
    } else {
      // Mặc định: tất cả công dân thường trú
      query.residenceStatus = "THUONG_TRU";
    }

    return await Citizen.find(query)
      .populate("household", "address")
      .sort("-createdAt")
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
