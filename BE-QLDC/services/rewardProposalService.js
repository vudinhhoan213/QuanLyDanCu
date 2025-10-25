const { RewardProposal } = require('../models');
const auditLogService = require('./auditLogService');
const notificationService = require('./notificationService');

module.exports = {
  async create(data) {
    return RewardProposal.create(data);
  },
  async getAll(filter = {}, options = {}) {
    const { limit = 50, page = 1, sort = '-createdAt' } = options;
    const docs = await RewardProposal.find(filter)
      .populate('citizen proposedBy reviewedBy')
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await RewardProposal.countDocuments(filter);
    return { docs, total, page, limit };
  },
  async getById(id) {
    return RewardProposal.findById(id).populate('citizen proposedBy reviewedBy');
  },
  async update(id, data) {
    return RewardProposal.findByIdAndUpdate(id, data, { new: true });
  },
  async delete(id) {
    return RewardProposal.findByIdAndDelete(id);
  },

  async approveRewardProposal({ id, reviewerUserId }) {
    const doc = await RewardProposal.findById(id).populate('citizen proposedBy');
    if (!doc) throw new Error('RewardProposal not found');
    if (doc.status !== 'PENDING') throw new Error('RewardProposal is not pending');

    doc.status = 'APPROVED';
    doc.reviewedBy = reviewerUserId;
    doc.reviewedAt = new Date();
    doc.approvedAt = new Date();
    await doc.save();

    await auditLogService.create({
      action: 'REWARD_APPROVED',
      entityType: 'RewardProposal',
      entityId: doc._id,
      performedBy: reviewerUserId,
      reason: `Approve RewardProposal ${doc._id}`,
    });

    await notificationService.create({
      toUser: doc.proposedBy,
      fromUser: reviewerUserId,
      title: 'Đề xuất khen thưởng đã được duyệt',
      message: 'Đề xuất khen thưởng của bạn đã được duyệt.',
      type: 'REWARD',
      entityType: 'RewardProposal',
      entityId: doc._id,
      priority: 'NORMAL',
    });

    return { proposal: doc };
  },

  async rejectRewardProposal({ id, reviewerUserId, rejectionReason }) {
    const doc = await RewardProposal.findById(id).populate('citizen proposedBy');
    if (!doc) throw new Error('RewardProposal not found');
    if (doc.status !== 'PENDING') throw new Error('RewardProposal is not pending');

    doc.status = 'REJECTED';
    doc.reviewedBy = reviewerUserId;
    doc.reviewedAt = new Date();
    doc.rejectionReason = rejectionReason || 'Không có lý do';
    await doc.save();

    await auditLogService.create({
      action: 'REWARD_REJECTED',
      entityType: 'RewardProposal',
      entityId: doc._id,
      performedBy: reviewerUserId,
      reason: doc.rejectionReason,
    });

    await notificationService.create({
      toUser: doc.proposedBy,
      fromUser: reviewerUserId,
      title: 'Đề xuất khen thưởng bị từ chối',
      message: `Đề xuất khen thưởng bị từ chối. Lý do: ${doc.rejectionReason}`,
      type: 'REWARD',
      entityType: 'RewardProposal',
      entityId: doc._id,
      priority: 'NORMAL',
    });

    return { proposal: doc };
  },
  async getStats() {
    const total = await RewardProposal.countDocuments();
    const pending = await RewardProposal.countDocuments({ status: 'PENDING' });
    const approved = await RewardProposal.countDocuments({ status: 'APPROVED' });
    const rejected = await RewardProposal.countDocuments({ status: 'REJECTED' });
    return { total, pending, approved, rejected };
  },
};

