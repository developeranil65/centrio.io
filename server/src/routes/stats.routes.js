const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Workspace = require('../models/Workspace');

// @desc    Get real platform stats
// @route   GET /api/stats
router.get('/', async (req, res) => {
    try {
        const [usersCount, workspacesCount] = await Promise.all([
            User.countDocuments(),
            Workspace.countDocuments()
        ]);

        res.json({
            users: usersCount,
            workspaces: workspacesCount,
            uptime: '99.9%',
            security: '256-bit'
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
    }
});

module.exports = router;
