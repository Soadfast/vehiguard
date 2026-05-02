const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  empresa: { type: String, required: true },
  username: { type: String, required: true },
  ip: { type: String, default: 'unknown' },
  userAgent: { type: String, default: '' },
  success: { type: Boolean, required: true },
  reason: { type: String, default: '' }, // for failed logins
  sessionId: { type: String, default: '' }
}, { timestamps: true });

loginLogSchema.index({ empresa: 1, createdAt: -1 });
loginLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 }); // 90 days TTL

module.exports = mongoose.model('LoginLog', loginLogSchema);
