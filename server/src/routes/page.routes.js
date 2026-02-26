const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
    createPage,
    getPages,
    getPage,
    updatePage,
    deletePage,
} = require('../controllers/page.controller');

// Public: guests need to read pages and save drawings
router.get('/boards/:boardId/pages', getPages);
router.get('/pages/:id', getPage);
router.put('/pages/:id', updatePage);

// Protected: only auth users can create/delete pages
router.post('/boards/:boardId/pages', protect, createPage);
router.delete('/pages/:id', protect, deletePage);

module.exports = router;
