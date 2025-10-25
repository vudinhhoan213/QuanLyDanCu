const { AuditLog } = require('../models');

module.exports = {
  async create(data) {
    return AuditLog.create(data);
  },
  async getAll(filter = {}, options = {}) {
    const { limit = 50, page = 1, sort = '-createdAt' } = options;
    const docs = await AuditLog.find(filter)
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await AuditLog.countDocuments(filter);
    return { docs, total, page, limit };
  },
  async getById(id) {
    return AuditLog.findById(id);
  },
  // No delete by design for audit logs.
};

