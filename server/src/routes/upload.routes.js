const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { upload, uploadFile, getUploads } = require('../controllers/upload.controller');

// Allow public uploads (so guests can share files in board chat)
router.post('/', upload.single('file'), uploadFile);

// Protect the GET route for fetching workspace uploads
router.get('/:workspaceId', protect, getUploads);

module.exports = router;
