const rewardEventService = require("../services/rewardEventService");
const auditLogService = require("../services/auditLogService");
const { User, Notification } = require("../models");

module.exports = {
  async create(req, res, next) {
    try {
      const doc = await rewardEventService.create(req.body);
      await auditLogService.create({
        action: "REWARD_EVENT_CREATE",
        entityType: "RewardEvent",
        entityId: doc._id,
        performedBy: req.user?._id,
      });

      // Tạo notification cho tất cả citizen và leader khi có sự kiện mới
      try {
        const citizens = await User.find({ role: "CONG_DAN", isActive: true });
        const leaders = await User.find({ role: "TO_TRUONG", isActive: true });
        
        // Thông báo cho tất cả citizen
        if (citizens.length > 0) {
          const citizenNotifications = citizens.map((citizen) => ({
            toUser: citizen._id,
            fromUser: req.user._id,
            title: "Sự kiện Phát quà Mới",
            message: `Sự kiện "${doc.name}" đã được tạo. Hãy đăng ký ngay để nhận quà!`,
            type: "REWARD_EVENT",
            entityType: "RewardEvent",
            entityId: doc._id,
            priority: "HIGH",
          }));

          await Notification.insertMany(citizenNotifications);
          console.log(
            `📬 Created ${citizenNotifications.length} notifications for citizens (new event: ${doc.name})`
          );
        }

        // Thông báo cho tất cả leader
        if (leaders.length > 0) {
          const leaderNotifications = leaders.map((leader) => ({
            toUser: leader._id,
            fromUser: req.user._id,
            title: "Sự kiện Phát quà Mới được tạo",
            message: `${req.user.fullName || req.user.username} đã tạo sự kiện "${doc.name}". Đã gửi thông báo cho ${citizens.length} công dân.`,
            type: "REWARD_EVENT",
            entityType: "RewardEvent",
            entityId: doc._id,
            priority: "NORMAL",
          }));

          await Notification.insertMany(leaderNotifications);
          console.log(
            `📬 Created ${leaderNotifications.length} notifications for leaders (new event: ${doc.name})`
          );
        }
      } catch (notifError) {
        console.error("❌ Error creating notifications:", notifError);
        // Không throw error, event đã tạo thành công
      }

      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  },
  async getAll(req, res, next) {
    try {
      const { page, limit, sort, ...filter } = req.query;
      const data = await rewardEventService.getAll(filter, {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        sort,
      });

      // Thêm thông tin số lượng đăng ký và số người nhận quà cho tất cả events
      const { RewardDistribution } = require("../models");
      const eventsWithCounts = await Promise.all(
        data.docs.map(async (event) => {
          try {
            const registeredCount = await RewardDistribution.countDocuments({
              event: event._id,
            });
            const distributedCount = await RewardDistribution.countDocuments({
              event: event._id,
              status: "DISTRIBUTED",
            });

            return {
              ...event.toObject(),
              registeredCount: registeredCount || 0,
              distributedCount: distributedCount || 0,
            };
          } catch (error) {
            return {
              ...event.toObject(),
              registeredCount: 0,
              distributedCount: 0,
            };
          }
        })
      );
      data.docs = eventsWithCounts;

      res.json(data);
    } catch (err) {
      next(err);
    }
  },
  async getById(req, res, next) {
    try {
      const doc = await rewardEventService.getById(req.params.id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  },
  async update(req, res, next) {
    try {
      const oldEvent = await rewardEventService.getById(req.params.id);
      const doc = await rewardEventService.update(req.params.id, req.body);
      if (!doc) return res.status(404).json({ message: "Not found" });
      
      await auditLogService.create({
        action: "REWARD_EVENT_UPDATE",
        entityType: "RewardEvent",
        entityId: doc._id,
        performedBy: req.user?._id,
      });

      // Nếu đóng sự kiện, gửi thông báo cho citizen đã đăng ký
      if (req.body.status === "CLOSED" && oldEvent.status !== "CLOSED") {
        try {
          const { RewardDistribution } = require("../models");
          const registrations = await RewardDistribution.find({
            event: doc._id,
          }).populate("household");

          if (registrations.length > 0) {
            // Lấy danh sách citizen từ các household đã đăng ký
            const { Citizen } = require("../models");
            const householdIds = registrations.map((r) => r.household?._id).filter(Boolean);
            const citizens = await Citizen.find({
              household: { $in: householdIds },
              isHead: true,
            }).populate("user");

            const userIds = citizens
              .map((c) => c.user?._id)
              .filter(Boolean);

            if (userIds.length > 0) {
              const notifications = userIds.map((userId) => ({
                toUser: userId,
                fromUser: req.user._id,
                title: "Sự kiện đã đóng đăng ký",
                message: `Sự kiện "${doc.name}" đã đóng đăng ký. Vui lòng đến nhận quà theo lịch hẹn.`,
                type: "REWARD_EVENT",
                entityType: "RewardEvent",
                entityId: doc._id,
                priority: "NORMAL",
              }));

              await Notification.insertMany(notifications);
              console.log(
                `📬 Created ${notifications.length} notifications for registered citizens (event closed: ${doc.name})`
              );
            }
          }

          // Thông báo cho leader
          await Notification.create({
            toUser: req.user._id,
            fromUser: req.user._id,
            title: "Đóng sự kiện thành công",
            message: `Bạn đã đóng sự kiện "${doc.name}". Đã gửi thông báo cho ${registrations.length} hộ đã đăng ký.`,
            type: "REWARD_EVENT",
            entityType: "RewardEvent",
            entityId: doc._id,
            priority: "NORMAL",
          });
        } catch (notifError) {
          console.error("❌ Error creating notifications:", notifError);
        }
      }

      res.json(doc);
    } catch (err) {
      next(err);
    }
  },
  async delete(req, res, next) {
    try {
      const event = await rewardEventService.getById(req.params.id);
      if (!event) return res.status(404).json({ message: "Not found" });

      // Kiểm tra có đăng ký không
      const { RewardDistribution } = require("../models");
      const registrations = await RewardDistribution.find({
        event: req.params.id,
      });

      const doc = await rewardEventService.delete(req.params.id);
      
      await auditLogService.create({
        action: "REWARD_EVENT_DELETE",
        entityType: "RewardEvent",
        entityId: req.params.id,
        performedBy: req.user?._id,
      });

      // Nếu có đăng ký, gửi thông báo cho citizen đã đăng ký
      if (registrations.length > 0) {
        try {
          const { Citizen } = require("../models");
          const householdIds = registrations.map((r) => r.household).filter(Boolean);
          const citizens = await Citizen.find({
            household: { $in: householdIds },
            isHead: true,
          }).populate("user");

          const userIds = citizens
            .map((c) => c.user?._id)
            .filter(Boolean);

          if (userIds.length > 0) {
            const notifications = userIds.map((userId) => ({
              toUser: userId,
              fromUser: req.user._id,
              title: "Sự kiện đã bị hủy",
              message: `Sự kiện "${event.name}" đã bị hủy. Vui lòng liên hệ tổ trưởng nếu có thắc mắc.`,
              type: "REWARD_EVENT",
              entityType: "RewardEvent",
              entityId: req.params.id,
              priority: "HIGH",
            }));

            await Notification.insertMany(notifications);
            console.log(
              `📬 Created ${notifications.length} notifications for registered citizens (event deleted: ${event.name})`
            );
          }
        } catch (notifError) {
          console.error("❌ Error creating notifications:", notifError);
        }
      }

      // Thông báo cho leader
      await Notification.create({
        toUser: req.user._id,
        fromUser: req.user._id,
        title: "Xóa sự kiện thành công",
        message: `Bạn đã xóa sự kiện "${event.name}". ${registrations.length > 0 ? `Đã gửi thông báo cho ${registrations.length} hộ đã đăng ký.` : "Sự kiện chưa có đăng ký."}`,
        type: "REWARD_EVENT",
        entityType: "RewardEvent",
        entityId: req.params.id,
        priority: "NORMAL",
      });

      res.json({ message: "Deleted" });
    } catch (err) {
      next(err);
    }
  },

  // Lấy thống kê cho event (eligible, registered, distributed)
  async getSummary(req, res, next) {
    try {
      const { id } = req.params;
      const summary = await rewardEventService.getEventSummary(id);
      if (!summary) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(summary);
    } catch (err) {
      next(err);
    }
  },

  // Lấy danh sách công dân đủ điều kiện
  async getEligibleCitizens(req, res, next) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      const citizens = await rewardEventService.getEligibleCitizens(id, {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
      });
      res.json({ docs: citizens });
    } catch (err) {
      next(err);
    }
  },
};
