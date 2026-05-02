const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getWorkers, getWorker, createWorker, updateWorker, deleteWorker } = require('../controllers/workerController');
const { exportExcel, exportPDF } = require('../controllers/exportController');

router.use(requireAuth);

router.get('/', getWorkers);
router.get('/:id', getWorker);
router.post('/', createWorker);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);

// Export routes
router.get('/export/excel/:id', exportExcel);
router.get('/export/pdf/:id', exportPDF);

module.exports = router;
