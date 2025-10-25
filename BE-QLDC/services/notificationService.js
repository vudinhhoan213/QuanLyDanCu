const { Notification } = require('../models');

module.exports = {
  async create(data) {
    return Notification.create(data);
  },
  async getAll(filter = {}, options = {}) {
    const { limit = 50, page = 1, sort = '-createdAt' } = options;
    const docs = await Notification.find(filter)
      .populate('toUser fromUser')
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await Notification.countDocuments(filter);
    return { docs, total, page, limit };
  },
  async getById(id) {
    return Notification.findById(id).populate('toUser fromUser');
  },
  async update(id, data) {
    return Notification.findByIdAndUpdate(id, data, { new: true });
  },
  async delete(id) {
    return Notification.findByIdAndDelete(id);
  },
  async markAsRead(id, userId) {
    return Notification.findOneAndUpdate(
      { _id: id, toUser: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  },
};

