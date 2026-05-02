const { COMPANIES } = require('../config/auth');

// GET company info (safe — no passwords)
const getCompany = (req, res) => {
  const company = COMPANIES[req.empresa];
  if (!company) return res.status(404).json({ error: 'Empresa no encontrada.' });
  res.json({
    success: true,
    data: {
      id: company.id,
      name: company.name,
      color: company.color,
      username: company.username
    }
  });
};

// PUT update company name (in-memory only — persisted in config on disk for production)
const updateCompany = (req, res) => {
  const company = COMPANIES[req.empresa];
  if (!company) return res.status(404).json({ error: 'Empresa no encontrada.' });

  const { name } = req.body;
  if (name && typeof name === 'string') {
    const clean = name.replace(/<[^>]*>/g, '').trim().slice(0, 100);
    if (clean.length < 2) return res.status(400).json({ error: 'Nombre demasiado corto.' });
    company.name = clean;
    // Update session
    if (req.session) req.session.companyName = clean;
  }

  res.json({
    success: true,
    data: { id: company.id, name: company.name, color: company.color, username: company.username }
  });
};

module.exports = { getCompany, updateCompany };
