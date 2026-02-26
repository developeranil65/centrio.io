const Board = require('../models/Board');
const Page = require('../models/Page');
const Workspace = require('../models/Workspace');

// @desc    Create a board in a workspace
// @route   POST /api/workspaces/:wsId/boards
const createBoard = async (req, res) => {
    try {
        const { title, mode } = req.body;

        // Verify workspace exists and user is a member
        const workspace = await Workspace.findById(req.params.wsId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const isMember = workspace.members.some(
            (m) => m.user.toString() === req.user._id.toString()
        );
        if (!isMember) {
            return res.status(403).json({ message: 'Not a member of this workspace' });
        }

        const board = await Board.create({
            title: title || 'Untitled Board',
            workspace: req.params.wsId,
            createdBy: req.user._id,
            mode: mode || 'whiteboard',
        });

        // Create a default first page
        await Page.create({
            board: board._id,
            order: 0,
            title: 'Page 1',
        });

        res.status(201).json(board);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create board', error: error.message });
    }
};

// @desc    Get all boards in a workspace
// @route   GET /api/workspaces/:wsId/boards
const getBoards = async (req, res) => {
    try {
        const boards = await Board.find({ workspace: req.params.wsId })
            .populate('createdBy', 'name email avatar')
            .sort({ createdAt: -1 });

        res.json(boards);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch boards', error: error.message });
    }
};

// @desc    Get single board
// @route   GET /api/boards/:id
const getBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate('createdBy', 'name email avatar')
            .populate('workspace', 'name');

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        res.json(board);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch board', error: error.message });
    }
};

// @desc    Update board
// @route   PUT /api/boards/:id
const updateBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        const { title, mode } = req.body;
        if (title) board.title = title;
        if (mode) board.mode = mode;

        await board.save();
        res.json(board);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update board', error: error.message });
    }
};

// @desc    Delete board and its pages
// @route   DELETE /api/boards/:id
const deleteBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Delete all pages belonging to this board
        await Page.deleteMany({ board: board._id });
        await Board.findByIdAndDelete(req.params.id);

        res.json({ message: 'Board and its pages deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete board', error: error.message });
    }
};

module.exports = {
    createBoard,
    getBoards,
    getBoard,
    updateBoard,
    deleteBoard,
};
