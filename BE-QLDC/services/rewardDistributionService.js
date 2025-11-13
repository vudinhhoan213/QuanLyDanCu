const { RewardDistribution, StudentAchievement, Citizen, RewardEvent } = require("../models");

// Helper function để tính tuổi từ ngày sinh
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

module.exports = {
  async create(data) {
    return RewardDistribution.create(data);
  },
  async bulkCreate(items = []) {
    if (!Array.isArray(items) || items.length === 0) return [];
    return RewardDistribution.insertMany(
      items.map((i) => ({
        ...i,
        totalValue: (i.quantity || 0) * (i.unitValue || 0),
      }))
    );
  },
  async getAll(filter = {}, options = {}) {
    const { limit = 50, page = 1, sort = "-createdAt" } = options;
    const docs = await RewardDistribution.find(filter)
      .populate("event household citizen distributedBy")
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await RewardDistribution.countDocuments(filter);
    return { docs, total, page, limit };
  },
  async getById(id) {
    return RewardDistribution.findById(id).populate("event household citizen distributedBy");
  },
  async distribute(registrationIds, distributedBy, distributionNote) {
    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      throw new Error("Registration IDs are required");
    }
    
    const updateData = {
      status: "DISTRIBUTED",
      distributedAt: new Date(),
      distributedBy: distributedBy,
      distributionNote: distributionNote || undefined,
    };

    const result = await RewardDistribution.updateMany(
      { _id: { $in: registrationIds }, status: { $ne: "DISTRIBUTED" } },
      { $set: updateData }
    );

    return result;
  },
  async update(id, data) {
    return RewardDistribution.findByIdAndUpdate(id, data, { new: true });
  },
  async delete(id) {
    return RewardDistribution.findByIdAndDelete(id);
  },
  async summarizeByEvent(eventId) {
    const agg = await RewardDistribution.aggregate([
      {
        $match: {
          event: require("mongoose").Types.ObjectId.createFromHexString(
            String(eventId)
          ),
        },
      },
      {
        $group: {
          _id: "$event",
          totalHouseholds: { $addToSet: "$household" },
          totalQuantity: { $sum: "$quantity" },
          totalValue: { $sum: "$totalValue" },
        },
      },
      {
        $project: {
          _id: 0,
          totalHouseholds: { $size: "$totalHouseholds" },
          totalQuantity: 1,
          totalValue: 1,
        },
      },
    ]);
    return agg[0] || { totalHouseholds: 0, totalQuantity: 0, totalValue: 0 };
  },
  
  /**
   * Tạo reward distributions từ danh sách thành tích học tập (khen thưởng cuối năm)
   * @param {String} eventId - ID của sự kiện khen thưởng
   * @param {String} schoolYear - Năm học (ví dụ: "2023-2024")
   * @param {Object} rewardRules - Quy tắc khen thưởng: { GIOI: { quantity: 5, unitValue: 10000 }, TIEN_TIEN: { quantity: 3, unitValue: 5000 } }
   * @param {Boolean} overwriteExisting - Có ghi đè các distribution đã tồn tại không
   */
  async generateFromAchievements(eventId, schoolYear, rewardRules = {}, overwriteExisting = false) {
    // Kiểm tra event tồn tại
    const event = await RewardEvent.findById(eventId);
    if (!event) {
      throw new Error("Sự kiện khen thưởng không tồn tại");
    }

    // Lấy tất cả thành tích học tập theo năm học
    const achievements = await StudentAchievement.find({ schoolYear })
      .populate({
        path: "citizen",
        populate: { path: "household" }
      });

    if (achievements.length === 0) {
      return { created: 0, skipped: 0, message: "Không có thành tích học tập nào cho năm học này" };
    }

    // Quy tắc khen thưởng mặc định nếu không được cung cấp
    const defaultRules = {
      GIOI: { quantity: 5, unitValue: 10000 }, // Học sinh giỏi: 5 cuốn sách, mỗi cuốn 10k
      TIEN_TIEN: { quantity: 3, unitValue: 5000 }, // Học sinh tiên tiến: 3 cuốn sách, mỗi cuốn 5k
      KHAC: { quantity: 1, unitValue: 3000 }, // Khác: 1 cuốn sách, mỗi cuốn 3k
    };
    const rules = { ...defaultRules, ...rewardRules };

    const distributionsToCreate = [];
    let skipped = 0;

    for (const achievement of achievements) {
      if (!achievement.citizen || !achievement.citizen.household) {
        skipped++;
        continue;
      }

      // Kiểm tra đã có distribution cho event và citizen này chưa
      if (!overwriteExisting) {
        const existing = await RewardDistribution.findOne({
          event: eventId,
          citizen: achievement.citizen._id,
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      // Lấy quy tắc khen thưởng theo loại thành tích
      const rule = rules[achievement.achievement] || rules.KHAC;
      
      // Nếu achievement đã có notebooksRewarded, ưu tiên dùng giá trị đó
      const quantity = achievement.notebooksRewarded > 0 
        ? achievement.notebooksRewarded 
        : rule.quantity;

      distributionsToCreate.push({
        event: eventId,
        household: achievement.citizen.household._id || achievement.citizen.household,
        citizen: achievement.citizen._id,
        quantity: quantity,
        unitValue: rule.unitValue,
        totalValue: quantity * rule.unitValue,
        note: `Khen thưởng cuối năm - ${achievement.achievement} - Năm học ${schoolYear}${achievement.schoolName ? ` - ${achievement.schoolName}` : ''}`,
        status: "REGISTERED",
      });
    }

    if (distributionsToCreate.length === 0) {
      return { created: 0, skipped, message: "Không có distribution nào được tạo" };
    }

    // Xóa các distribution cũ nếu overwriteExisting = true
    if (overwriteExisting) {
      await RewardDistribution.deleteMany({
        event: eventId,
        citizen: { $in: distributionsToCreate.map(d => d.citizen) },
      });
    }

    // Tạo bulk distributions
    const created = await this.bulkCreate(distributionsToCreate);

    return {
      created: created.length,
      skipped,
      distributions: created,
      message: `Đã tạo ${created.length} khen thưởng từ thành tích học tập`,
    };
  },

  /**
   * Tạo reward distributions từ danh sách công dân trong độ tuổi 0-18 (khen thưởng dịp đặc biệt)
   * @param {String} eventId - ID của sự kiện khen thưởng
   * @param {Number} minAge - Tuổi tối thiểu (mặc định: 0)
   * @param {Number} maxAge - Tuổi tối đa (mặc định: 18)
   * @param {Object} rewardConfig - Cấu hình quà: { quantity: 1, unitValue: 50000 }
   * @param {Boolean} overwriteExisting - Có ghi đè các distribution đã tồn tại không
   */
  async generateFromAgeRange(eventId, minAge = 0, maxAge = 18, rewardConfig = {}, overwriteExisting = false) {
    // Kiểm tra event tồn tại
    const event = await RewardEvent.findById(eventId);
    if (!event) {
      throw new Error("Sự kiện khen thưởng không tồn tại");
    }

    // Lấy tất cả công dân
    const allCitizens = await Citizen.find({
      status: "ALIVE", // Chỉ lấy công dân còn sống
      household: { $exists: true, $ne: null }, // Phải có hộ khẩu
    }).populate("household");

    // Lọc công dân theo độ tuổi
    const eligibleCitizens = allCitizens.filter(citizen => {
      const age = calculateAge(citizen.dateOfBirth);
      return age !== null && age >= minAge && age <= maxAge;
    });

    if (eligibleCitizens.length === 0) {
      return { created: 0, skipped: 0, message: `Không có công dân nào trong độ tuổi ${minAge}-${maxAge}` };
    }

    // Cấu hình quà mặc định
    const defaultConfig = {
      quantity: 1,
      unitValue: 50000, // 50k mỗi phần quà
    };
    const config = { ...defaultConfig, ...rewardConfig };

    const distributionsToCreate = [];
    let skipped = 0;

    for (const citizen of eligibleCitizens) {
      if (!citizen.household) {
        skipped++;
        continue;
      }

      // Kiểm tra đã có distribution cho event và citizen này chưa
      if (!overwriteExisting) {
        const existing = await RewardDistribution.findOne({
          event: eventId,
          citizen: citizen._id,
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      const age = calculateAge(citizen.dateOfBirth);
      distributionsToCreate.push({
        event: eventId,
        household: citizen.household._id || citizen.household,
        citizen: citizen._id,
        quantity: config.quantity,
        unitValue: config.unitValue,
        totalValue: config.quantity * config.unitValue,
        note: `Khen thưởng dịp đặc biệt - Độ tuổi: ${age} tuổi`,
        status: "REGISTERED",
      });
    }

    if (distributionsToCreate.length === 0) {
      return { created: 0, skipped, message: "Không có distribution nào được tạo" };
    }

    // Xóa các distribution cũ nếu overwriteExisting = true
    if (overwriteExisting) {
      await RewardDistribution.deleteMany({
        event: eventId,
        citizen: { $in: distributionsToCreate.map(d => d.citizen) },
      });
    }

    // Tạo bulk distributions
    const created = await this.bulkCreate(distributionsToCreate);

    return {
      created: created.length,
      skipped,
      distributions: created,
      message: `Đã tạo ${created.length} khen thưởng cho công dân độ tuổi ${minAge}-${maxAge}`,
    };
  },
};
