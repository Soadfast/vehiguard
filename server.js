require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');
const { loginRateLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'middi_secret_k9x2p_2024!',
  resave: false,
  saveUninitialized: false,
  name: 'middi.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Apply rate limiter only to login endpoint
app.use('/api/auth/login', loginRateLimiter);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/security', require('./routes/security'));
app.use('/api/company', require('./routes/company'));
app.use('/api/qr', require('./routes/qr'));

// Page routes
app.get('/', (req, res) => {
  if (req.session?.empresa) return res.redirect('/dashboard');
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  if (req.session?.empresa) return res.redirect('/dashboard');
  res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

// Legacy company login URLs → redirect to unified login
app.get('/login/:company', (req, res) => res.redirect('/login'));

app.get('/dashboard', (req, res) => {
  if (!req.session?.empresa) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'pages', 'dashboard.html'));
});

app.get('/worker/:id', (req, res) => {
  if (!req.session?.empresa) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'pages', 'worker-detail.html'));
});

app.get('/seguridad', (req, res) => {
  if (!req.session?.empresa) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'pages', 'security.html'));
});

app.get('/empresa', (req, res) => {
  if (!req.session?.empresa) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'pages', 'company-config.html'));
});

// Public QR verification page
app.get('/qr/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'qr-verify.html'));
});

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║     MIDDI - Sistema Documental       ║
  ║     Puerto: ${PORT}                     ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;
