const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getLoginHistory, getLastLogin, closeSession } = require('../controllers/securityController');

router.use(requireAuth);
router.get('/history', getLoginHistory);
router.get('/last-login', getLastLogin);
router.post('/close-session', closeSession);

module.exports = router;
