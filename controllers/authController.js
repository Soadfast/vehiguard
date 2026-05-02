const { COMPANIES, verifyCredentials } = require('../config/auth');
const LoginLog = require('../models/LoginLog');
const { recordFailedAttempt, clearAttempts } = require('../middleware/rateLimiter');

// Sanitize: strip HTML/script tags from string input
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '').trim().slice(0, 200);
}

function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim();
}

const login = async (req, res) => {
  const ip = getIp(req);
  const username = sanitize(req.body.username || '');
  const password = typeof req.body.password === 'string' ? req.body.password.slice(0, 200) : '';

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
  }

  const result = await verifyCredentials(username, password);

  if (!result) {
    recordFailedAttempt(ip);
    await LoginLog.create({
      empresa: 'unknown',
      username,
      ip,
      userAgent: req.headers['user-agent'] || '',
      success: false,
      reason: 'Credenciales incorrectas'
    }).catch(() => {});
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  const { empresa, company } = result;

  // Clear rate limit on success
  clearAttempts(ip);

  // Regenerate session to prevent fixation
  req.session.regenerate(async (err) => {
    if (err) return res.status(500).json({ error: 'Error interno.' });

    req.session.empresa = empresa;
    req.session.username = company.username;
    req.session.companyName = company.name;
    req.session.loginAt = Date.now();

    await LoginLog.create({
      empresa,
      username: company.username,
      ip,
      userAgent: req.headers['user-agent'] || '',
      success: true,
      sessionId: req.session.id
    }).catch(() => {});

    return res.json({
      success: true,
      empresa,
      companyName: company.name,
      redirect: '/dashboard'
    });
  });
};

const logout = async (req, res) => {
  const { empresa, username, empresa: emp } = req.session || {};
  await LoginLog.create({
    empresa: empresa || 'unknown',
    username: username || 'unknown',
    ip: getIp(req),
    userAgent: req.headers['user-agent'] || '',
    success: true,
    reason: 'logout'
  }).catch(() => {});

  req.session.destroy(() => {
    res.json({ success: true, redirect: '/login' });
  });
};

const getSession = (req, res) => {
  if (req.session && req.session.empresa) {
    const company = COMPANIES[req.session.empresa];
    return res.json({
      loggedIn: true,
      empresa: req.session.empresa,
      companyName: company ? company.name : req.session.companyName,
      username: req.session.username,
      color: company ? company.color : '#2563eb'
    });
  }
  res.json({ loggedIn: false });
};

module.exports = { login, logout, getSession };
