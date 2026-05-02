const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getWorkerQR, verifyQR } = require('../controllers/qrController');

// Public QR verify — no auth
router.get('/verify/:token', verifyQR);

// Authenticated: get QR for a worker
router.get('/worker/:id', requireAuth, getWorkerQR);

module.exports = router;
