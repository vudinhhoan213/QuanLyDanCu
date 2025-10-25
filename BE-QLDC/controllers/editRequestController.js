const editRequestService = require("../services/editRequestService");
const { Citizen, EditRequest } = require("../models");

module.exports = {
  // Get current citizen's requests
  async getMyRequests(req, res, next) {
    try {
      // Tìm citizen của user hiện tại
      const citizen = await Citizen.findOne({ user: req.user._id });

      if (!citizen) {
        return res.status(404).json({ message: "Citizen profile not found" });
      }

      // Lấy tất cả requests của citizen này
      const requests = await EditRequest.find({ requestedBy: req.user._id })
        .populate("requestedBy", "fullName username")
        .populate("reviewedBy", "fullName username")
        .sort({ createdAt: -1 });

      res.json({ docs: requests, total: requests.length });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      console.log("📝 Creating edit request...");
      console.log("User:", req.user);
      console.log("Body:", req.body);

      // Tìm citizen của user hiện tại
      const citizen = await Citizen.findOne({ user: req.user._id });

      if (!citizen) {
        console.log("❌ Citizen not found for user:", req.user._id);
        return res.status(404).json({
          message: "Citizen profile not found",
          detail: "Vui lòng liên hệ tổ trưởng để được thêm vào hộ khẩu.",
        });
      }

      console.log("👤 Found citizen:", citizen._id, citizen.fullName);

      // Chuẩn bị payload với citizen và reason
      const payload = {
        ...req.body,
        requestedBy: req.user._id,
        citizen: citizen._id,
        reason:
          req.body.description ||
          req.body.reason ||
          "Yêu cầu chỉnh sửa thông tin",
      };

      const doc = await editRequestService.create(payload);

      console.log("✅ Edit request created:", doc._id);

      // Tạo notification cho leaders
      try {
        const { User, Notification } = require("../models");
        const leaders = await User.find({ role: "TO_TRUONG" });

        if (leaders.length > 0) {
          const notifications = leaders.map((leader) => ({
            toUser: leader._id,
            fromUser: req.user._id,
            title: "Yêu Cầu Chỉnh Sửa Mới",
            message: `${
              req.user.fullName || req.user.username
            } đã gửi yêu cầu: ${payload.title || "Chỉnh sửa thông tin"}`,
            type: "EDIT_REQUEST",
            entityType: "EditRequest",
            entityId: doc._id,
            priority: "NORMAL",
          }));

          await Notification.insertMany(notifications);
          console.log(
            `📬 Created ${notifications.length} notifications for leaders`
          );
        } else {
          console.log("⚠️ No leaders found to notify");
        }
      } catch (notifError) {
        console.error("❌ Error creating notifications:", notifError);
        // Không throw error, request đã tạo thành công
      }

      res.status(201).json({
        success: true,
        message: "Yêu cầu đã được gửi thành công",
        data: doc,
      });
    } catch (err) {
      console.error("❌ Error creating edit request:", err);
      next(err);
    }
  },
  async getAll(req, res, next) {
    try {
      const { page, limit, sort, ...filter } = req.query;
      const data = await editRequestService.getAll(filter, {
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
      const doc = await editRequestService.getById(req.params.id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  },
  async update(req, res, next) {
    try {
      const doc = await editRequestService.update(req.params.id, req.body);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  },
  async delete(req, res, next) {
    try {
      const doc = await editRequestService.delete(req.params.id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
    } catch (err) {
      next(err);
    }
  },

  // Example with role check: only Tổ trưởng can approve
  async approve(req, res, next) {
    try {
      if (!req.user || req.user.role !== "TO_TRUONG") {
        return res
          .status(403)
          .json({ message: "Forbidden: requires TO_TRUONG role" });
      }
      const result = await editRequestService.approveEditRequest({
        id: req.params.id,
        reviewerUserId: req.user._id,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async reject(req, res, next) {
    try {
      if (!req.user || req.user.role !== "TO_TRUONG") {
        return res
          .status(403)
          .json({ message: "Forbidden: requires TO_TRUONG role" });
      }
      const { reason } = req.body;
      const result = await editRequestService.rejectEditRequest({
        id: req.params.id,
        reviewerUserId: req.user._id,
        rejectionReason: reason,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async getStats(req, res, next) {
    try {
      const stats = await editRequestService.getStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },
};
