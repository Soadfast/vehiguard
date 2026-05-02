const LoginLog = require('../models/LoginLog');

// GET login history for current company
const getLoginHistory = async (req, res) => {
  try {
    const logs = await LoginLog.find({ empresa: req.empresa })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, data: logs });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener historial.' });
  }
};

// GET last successful login
const getLastLogin = async (req, res) => {
  try {
    const last = await LoginLog.findOne({
      empresa: req.empresa,
      success: true,
      reason: { $ne: 'logout' },
      sessionId: { $ne: req.session.id } // exclude current session
    }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: last });
  } catch (e) {
    res.status(500).json({ error: 'Error.' });
  }
};

// DELETE — close current session (logout via security panel)
const closeSession = (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, redirect: '/login' });
  });
};

module.exports = { getLoginHistory, getLastLogin, closeSession };
