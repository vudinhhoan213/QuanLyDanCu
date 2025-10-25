const rewardProposalService = require("../services/rewardProposalService");

module.exports = {
  async create(req, res, next) {
    try {
      const payload = { ...req.body, proposedBy: req.user && req.user._id };
      const doc = await rewardProposalService.create(payload);
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  },
  async getAll(req, res, next) {
    try {
      const { page, limit, sort, ...filter } = req.query;
      const data = await rewardProposalService.getAll(filter, {
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
      const doc = await rewardProposalService.getById(req.params.id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  },
  async update(req, res, next) {
    try {
      const doc = await rewardProposalService.update(req.params.id, req.body);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  },
  async delete(req, res, next) {
    try {
      const doc = await rewardProposalService.delete(req.params.id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
    } catch (err) {
      next(err);
    }
  },

  async approve(req, res, next) {
    try {
      if (!req.user || req.user.role !== "TO_TRUONG") {
        return res
          .status(403)
          .json({ message: "Forbidden: requires TO_TRUONG role" });
      }
      const result = await rewardProposalService.approveRewardProposal({
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
      const result = await rewardProposalService.rejectRewardProposal({
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
      const stats = await rewardProposalService.getStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },

  async getMyProposals(req, res, next) {
    try {
      const userId = req.user._id;
      const data = await rewardProposalService.getMyProposals(userId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
};
