const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
    createBoard,
    getBoards,
    getBoard,
    updateBoard,
    deleteBoard,
} = require('../controllers/board.controller');

// Public: allow guests to load a board by ID
router.get('/boards/:id', getBoard);

// Protected routes — require auth
router.post('/workspaces/:wsId/boards', protect, createBoard);
router.get('/workspaces/:wsId/boards', protect, getBoards);
router.route('/boards/:id').put(protect, updateBoard).delete(protect, deleteBoard);

module.exports = router;
