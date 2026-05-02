const express = require('express');
const router = express.Router();
const { login, logout, getSession } = require('../controllers/authController');

router.post('/login', login);
router.post('/logout', logout);
router.get('/session', getSession);

module.exports = router;
