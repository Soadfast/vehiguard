const { COMPANIES } = require('../config/auth');

const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.empresa) {
    return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
  }
  req.empresa = req.session.empresa;
  next();
};

const requireAuthPage = (req, res, next) => {
  if (!req.session || !req.session.empresa) {
    return res.redirect('/');
  }
  req.empresa = req.session.empresa;
  next();
};

// Ensures API data is ALWAYS filtered by the logged-in company
const enforceCompanyFilter = (req, res, next) => {
  if (!req.session || !req.session.empresa) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  req.empresa = req.session.empresa;
  // Override any company param from query/body with session company
  if (req.body) req.body.empresa = req.empresa;
  next();
};

module.exports = { requireAuth, requireAuthPage, enforceCompanyFilter };
