const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { exportPageAsPng, exportBoardAsPdf } = require('../controllers/export.controller');

router.use(protect);

router.get('/page/:id/png', exportPageAsPng);
router.get('/board/:id/pdf', exportBoardAsPdf);

module.exports = router;
