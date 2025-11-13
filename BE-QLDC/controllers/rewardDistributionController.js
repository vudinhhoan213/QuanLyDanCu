const rewardDistributionService = require("../services/rewardDistributionService");
const auditLogService = require("../services/auditLogService");
const { RewardEvent, RewardDistribution, Citizen, Household } = require("../models");

module.exports = {
  async create(req, res, next) {
    try {
      const doc = await rewardDistributionService.create(req.body);
      await auditLogService.create({
        action: "REWARD_DISTRIBUTION_CREATE",
        entityType: "RewardDistribution",
        entityId: doc._id,
        performedBy: req.user?._id,
      });
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  },
  async bulkCreate(req, res, next) {
    try {
      const docs = await rewardDistributionService.bulkCreate(
        req.body?.items || []
      );
      await auditLogService.create({
        action: "REWARD_DISTRIBUTION_BULK_CREATE",
        entityType: "RewardDistribution",
        performedBy: req.user?._id,
      });
      res.status(201).json({ inserted: docs.length, docs });
    } catch (err) {
      next(err);
    }
  },
  async getAll(req, res, next) {
    try {
      const { page, limit, sort, ...filter } = req.query;
      const data = await rewardDistributionService.getAll(filter, {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        sort,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
  async getById(req, res, next) {
    try {
      const doc = await rewardDistributionService.getById(req.params.id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  },
  async update(req, res, next) {
    try {
      const doc = await rewardDistributionService.update(
        req.params.id,
        req.body
      );
      if (!doc) return res.status(404).json({ message: "Not found" });
      await auditLogService.create({
        action: "REWARD_DISTRIBUTION_UPDATE",
        entityType: "RewardDistribution",
        entityId: doc._id,
        performedBy: req.user?._id,
      });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  },
  async delete(req, res, next) {
    try {
      const doc = await rewardDistributionService.delete(req.params.id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      await auditLogService.create({
        action: "REWARD_DISTRIBUTION_DELETE",
        entityType: "RewardDistribution",
        entityId: req.params.id,
        performedBy: req.user?._id,
      });
      res.json({ message: "Deleted" });
    } catch (err) {
      next(err);
    }
  },
  async summarizeByEvent(req, res, next) {
    try {
      const summary = await rewardDistributionService.summarizeByEvent(
        req.params.eventId
      );
      res.json(summary);
    } catch (err) {
      next(err);
    }
  },
  async register(req, res, next) {
    try {
      const { eventId, quantity = 1, note } = req.body;
      const userId = req.user._id;

      console.log(`📤 Citizen ${userId} registering for event ${eventId}`);

      // Tìm citizen từ user
      const citizen = await Citizen.findOne({ user: userId });
      if (!citizen) {
        console.error(`❌ Citizen not found for user ${userId}`);
        return res.status(404).json({ message: "Không tìm thấy thông tin công dân" });
      }

      // Kiểm tra citizen có household không
      if (!citizen.household) {
        return res.status(400).json({ message: "Bạn chưa được thêm vào hộ khẩu" });
      }

      const household = await Household.findById(citizen.household);
      if (!household) {
        return res.status(404).json({ message: "Không tìm thấy hộ khẩu" });
      }

      // Kiểm tra sự kiện
      const event = await RewardEvent.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Không tìm thấy sự kiện" });
      }

      // Kiểm tra sự kiện có đang mở không
      if (event.status !== "OPEN") {
        return res.status(400).json({ message: "Sự kiện không còn nhận đăng ký" });
      }

      // Kiểm tra thời gian đăng ký
      const now = new Date();
      if (event.startDate && now < new Date(event.startDate)) {
        return res.status(400).json({ message: "Sự kiện chưa mở đăng ký" });
      }
      if (event.endDate && now > new Date(event.endDate)) {
        return res.status(400).json({ message: "Sự kiện đã hết hạn đăng ký" });
      }

      // Kiểm tra đã đăng ký chưa
      const existingRegistration = await RewardDistribution.findOne({
        event: eventId,
        household: household._id,
      });
      if (existingRegistration) {
        return res.status(409).json({ message: "Bạn đã đăng ký sự kiện này rồi" });
      }

      // Tạo đăng ký
      const registrationData = {
        event: eventId,
        household: household._id,
        citizen: citizen._id,
        quantity: quantity,
        unitValue: event.budget || 0,
        note: note,
      };

      const doc = await rewardDistributionService.create(registrationData);
      console.log(`✅ [register] Registration created: ${doc._id}`);
      console.log(`✅ [register] Registration data:`, {
        id: doc._id,
        event: doc.event,
        citizen: doc.citizen,
        household: doc.household,
        quantity: doc.quantity,
        createdAt: doc.createdAt,
      });
      
      // Populate event để trả về đầy đủ thông tin
      const populatedDoc = await RewardDistribution.findById(doc._id)
        .populate("event")
        .populate({
          path: "citizen",
          populate: {
            path: "user",
            select: "_id fullName username"
          }
        })
        .populate("household");
      
      console.log(`✅ [register] Populated registration:`, {
        id: populatedDoc._id,
        eventId: populatedDoc.event?._id,
        eventName: populatedDoc.event?.name,
        citizenId: populatedDoc.citizen?._id,
        householdId: populatedDoc.household?._id,
      });
      
      await auditLogService.create({
        action: "REWARD_EVENT_REGISTER",
        entityType: "RewardDistribution",
        entityId: doc._id,
        performedBy: userId,
      });

      // Tạo notification cho citizen và leader khi có đăng ký mới
      try {
        const { Notification, User } = require("../models");
        
        // Thông báo cho citizen đã đăng ký thành công
        if (citizen.user) {
          await Notification.create({
            toUser: citizen.user,
            fromUser: userId,
            title: "Đăng ký sự kiện thành công",
            message: `Bạn đã đăng ký sự kiện "${populatedDoc.event?.name || event.name}" thành công. Vui lòng chờ thông báo phát quà.`,
            type: "REWARD_EVENT",
            entityType: "RewardDistribution",
            entityId: populatedDoc._id,
            priority: "NORMAL",
          });
          console.log(
            `📬 Created notification for citizen (registered for event: ${populatedDoc.event?.name || event.name})`
          );
        }

        // Thông báo cho tất cả leader khi có citizen đăng ký
        const leaders = await User.find({ role: "TO_TRUONG", isActive: true });
        const registeredCount = await RewardDistribution.countDocuments({
          event: eventId,
        });
        
        if (leaders.length > 0) {
          const leaderNotifications = leaders.map((leader) => ({
            toUser: leader._id,
            fromUser: userId,
            title: "Có công dân đăng ký sự kiện",
            message: `${citizen.fullName || "Công dân"} đã đăng ký sự kiện "${populatedDoc.event?.name || event.name}". Hiện có ${registeredCount} đăng ký.`,
            type: "REWARD_EVENT",
            entityType: "RewardDistribution",
            entityId: populatedDoc._id,
            priority: "NORMAL",
          }));

          await Notification.insertMany(leaderNotifications);
          console.log(
            `📬 Created ${leaderNotifications.length} notifications for leaders (citizen registered for event: ${populatedDoc.event?.name || event.name})`
          );
        }
      } catch (notifError) {
        console.error("❌ Error creating notifications:", notifError);
        // Không throw error, registration đã thành công
      }

      // Trả về populated document để frontend có đầy đủ thông tin
      res.status(201).json(populatedDoc);
    } catch (err) {
      next(err);
    }
  },
  async getMyRegistrations(req, res, next) {
    try {
      const userId = req.user._id;
      
      console.log(`📋 [getMyRegistrations] User ${userId} requesting registrations`);
      
      // Tìm citizen từ user
      const citizen = await Citizen.findOne({ user: userId });
      if (!citizen) {
        console.error(`❌ [getMyRegistrations] Citizen not found for user ${userId}`);
        return res.status(404).json({ message: "Không tìm thấy thông tin công dân" });
      }

      console.log(`✅ [getMyRegistrations] Found citizen ${citizen._id}, household: ${citizen.household}`);

      // Lấy tất cả đăng ký của citizen hoặc household
      const { page, limit, sort, event } = req.query;
      const filter = {
        $or: [
          { citizen: citizen._id },
          { household: citizen.household }
        ]
      };

      // Nếu có filter theo event, thêm vào filter
      if (event) {
        filter.event = event;
      }

      console.log(`📋 [getMyRegistrations] Filter:`, JSON.stringify(filter));
      console.log(`📋 [getMyRegistrations] Options: page=${page}, limit=${limit}, sort=${sort}`);

      const data = await rewardDistributionService.getAll(filter, {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        sort: sort || "-createdAt",
      });

      console.log(`✅ [getMyRegistrations] Found ${data.docs?.length || 0} registrations, total: ${data.total || 0}`);
      
      if (data.docs && data.docs.length > 0) {
        console.log(`📋 [getMyRegistrations] Sample registration:`, {
          id: data.docs[0]._id,
          eventId: data.docs[0].event?._id || data.docs[0].event,
          eventName: data.docs[0].event?.name,
          citizenId: data.docs[0].citizen,
          householdId: data.docs[0].household,
        });
      }

      res.json(data);
    } catch (err) {
      console.error("❌ [getMyRegistrations] Error:", err);
      next(err);
    }
  },
  async distribute(req, res, next) {
    try {
      const { registrationIds, distributionNote } = req.body;
      const userId = req.user._id;

      if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
        return res.status(400).json({ message: "Danh sách đăng ký không hợp lệ" });
      }

      console.log(`📦 [distribute] Leader ${userId} distributing gifts to ${registrationIds.length} registrations`);

      // Kiểm tra tất cả registrations có tồn tại không
      const registrations = await RewardDistribution.find({
        _id: { $in: registrationIds },
      });

      if (registrations.length !== registrationIds.length) {
        return res.status(404).json({ message: "Một số đăng ký không tồn tại" });
      }

      // Phân phát quà
      const result = await rewardDistributionService.distribute(
        registrationIds,
        userId,
        distributionNote
      );

      console.log(`✅ [distribute] Distributed ${result.modifiedCount} registrations`);

      // Tạo audit log
      await auditLogService.create({
        action: "REWARD_DISTRIBUTION_DISTRIBUTE",
        entityType: "RewardDistribution",
        performedBy: userId,
        metadata: {
          registrationIds,
          count: result.modifiedCount,
          distributionNote,
        },
      });

      // Tạo notifications cho các citizen đã được phát quà và leader
      try {
        const { Notification, User } = require("../models");
        const distributedRegistrations = await RewardDistribution.find({
          _id: { $in: registrationIds },
          status: "DISTRIBUTED",
        })
          .populate({
            path: "citizen",
            populate: {
              path: "user",
              select: "_id fullName username"
            }
          })
          .populate("event");

        let distributedCount = 0;
        for (const reg of distributedRegistrations) {
          const citizenUserId = reg.citizen?.user?._id || reg.citizen?.user;
          if (citizenUserId) {
            distributedCount++;
            await Notification.create({
              toUser: citizenUserId,
              fromUser: userId,
              title: "Đã phát quà",
              message: `Bạn đã nhận quà từ sự kiện "${reg.event?.name || "N/A"}". Vui lòng kiểm tra lại.`,
              type: "REWARD_EVENT",
              entityType: "RewardDistribution",
              entityId: reg._id,
              priority: "HIGH",
            });
          }
        }

        // Thông báo cho tất cả leader
        if (distributedCount > 0) {
          const leaders = await User.find({ role: "TO_TRUONG", isActive: true });
          if (leaders.length > 0) {
            const eventName = distributedRegistrations[0]?.event?.name || "N/A";
            const leaderNotifications = leaders.map((leader) => ({
              toUser: leader._id,
              fromUser: userId,
              title: "Đã phát quà cho công dân",
              message: `Đã phát quà cho ${distributedCount} công dân từ sự kiện "${eventName}".`,
              type: "REWARD_EVENT",
              entityType: "RewardEvent",
              entityId: distributedRegistrations[0]?.event?._id,
              priority: "NORMAL",
            }));

            await Notification.insertMany(leaderNotifications);
            console.log(
              `📬 Created ${leaderNotifications.length} notifications for leaders (distributed gifts to ${distributedCount} citizens)`
            );
          }
        }

        console.log(
          `📬 Created ${distributedCount} notifications for citizens (distributed gifts)`
        );
      } catch (notifError) {
        console.error("❌ Error creating notifications:", notifError);
        // Không throw error, distribution đã thành công
      }

      // Lấy lại các registrations đã được cập nhật để trả về
      const updatedRegistrations = await RewardDistribution.find({
        _id: { $in: registrationIds },
      })
        .populate("event household citizen distributedBy");

      res.json({
        message: `Đã phân phát quà cho ${result.modifiedCount} đăng ký`,
        modifiedCount: result.modifiedCount,
        registrations: updatedRegistrations,
      });
    } catch (err) {
      console.error("❌ [distribute] Error:", err);
      next(err);
    }
  },
  
  /**
   * Tạo reward distributions từ thành tích học tập (khen thưởng cuối năm)
   * POST /reward-distributions/generate-from-achievements
   */
  async generateFromAchievements(req, res, next) {
    try {
      const { eventId, schoolYear, rewardRules, overwriteExisting } = req.body;

      if (!eventId || !schoolYear) {
        return res.status(400).json({ 
          message: "Thiếu thông tin: eventId và schoolYear là bắt buộc" 
        });
      }

      const result = await rewardDistributionService.generateFromAchievements(
        eventId,
        schoolYear,
        rewardRules || {},
        overwriteExisting || false
      );

      await auditLogService.create({
        action: "REWARD_DISTRIBUTION_GENERATE_FROM_ACHIEVEMENTS",
        entityType: "RewardDistribution",
        performedBy: req.user?._id,
        metadata: {
          eventId,
          schoolYear,
          created: result.created,
          skipped: result.skipped,
        },
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Tạo reward distributions từ công dân trong độ tuổi 0-18 (khen thưởng dịp đặc biệt)
   * POST /reward-distributions/generate-from-age-range
   */
  async generateFromAgeRange(req, res, next) {
    try {
      const { eventId, minAge = 0, maxAge = 18, rewardConfig, overwriteExisting } = req.body;

      if (!eventId) {
        return res.status(400).json({ 
          message: "Thiếu thông tin: eventId là bắt buộc" 
        });
      }

      if (minAge < 0 || maxAge < 0 || minAge > maxAge) {
        return res.status(400).json({ 
          message: "Độ tuổi không hợp lệ: minAge và maxAge phải >= 0 và minAge <= maxAge" 
        });
      }

      const result = await rewardDistributionService.generateFromAgeRange(
        eventId,
        minAge,
        maxAge,
        rewardConfig || {},
        overwriteExisting || false
      );

      await auditLogService.create({
        action: "REWARD_DISTRIBUTION_GENERATE_FROM_AGE_RANGE",
        entityType: "RewardDistribution",
        performedBy: req.user?._id,
        metadata: {
          eventId,
          minAge,
          maxAge,
          created: result.created,
          skipped: result.skipped,
        },
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
