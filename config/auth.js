const bcrypt = require('bcryptjs');

// Passwords are hashed — never exposed to frontend
const COMPANIES = {
  x1: {
    id: 'x1',
    name: 'MIDDI X MUÑECO',
    username: 'Muñeco',
    passwordHash: '$2b$10$4iVsennpQYZef8pkJ3kIsuw0Jcqyi2YGDYff2etIXggttEWbQ2pbW',
    color: '#00c853',
    accent: '#1a237e'
  },
  x2: {
    id: 'x2',
    name: 'MIDDI X BELONA',
    username: 'belona',
    passwordHash: '$2b$10$4iVsennpQYZef8pkJ3kIsuw0Jcqyi2YGDYff2etIXggttEWbQ2pbW',
    color: '#00bcd4',
    accent: '#1a237e'
  },
  x3: {
    id: 'x3',
    name: 'MIDDI X BAMBONO',
    username: 'bambono',
    passwordHash: '$2b$10$4iVsennpQYZef8pkJ3kIsuw0Jcqyi2YGDYff2etIXggttEWbQ2pbW',
    color: '#ff6f00',
    accent: '#1a237e'
  }
};

function findCompanyByUsername(username) {
  if (!username || typeof username !== 'string') return null;
  const normalized = username.trim().toLowerCase();
  for (const [id, company] of Object.entries(COMPANIES)) {
    if (company.username.toLowerCase() === normalized) {
      return { empresa: id, company };
    }
  }
  return null;
}

async function verifyCredentials(username, password) {
  const match = findCompanyByUsername(username);
  if (!match) return null;
  const valid = await bcrypt.compare(password, match.company.passwordHash);
  return valid ? match : null;
}

module.exports = { COMPANIES, findCompanyByUsername, verifyCredentials };
