const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getDocuments, uploadDocument, deleteDocument, serveDocument } = require('../controllers/documentController');

router.use(requireAuth);

router.get('/worker/:workerId', getDocuments);
router.post('/upload', upload.single('archivo'), uploadDocument);
router.delete('/:id', deleteDocument);
router.get('/file/:id', serveDocument);

module.exports = router;
