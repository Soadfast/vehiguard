const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getCompany, updateCompany } = require('../controllers/companyController');

router.use(requireAuth);
router.get('/', getCompany);
router.put('/', updateCompany);

module.exports = router;
