const Page = require('../models/Page');
const Board = require('../models/Board');

// @desc    Create a new page in a board
// @route   POST /api/boards/:boardId/pages
const createPage = async (req, res) => {
    try {
        const board = await Board.findById(req.params.boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Determine order (next number)
        const lastPage = await Page.findOne({ board: board._id }).sort({ order: -1 });
        const nextOrder = lastPage ? lastPage.order + 1 : 0;

        const page = await Page.create({
            board: board._id,
            order: nextOrder,
            title: req.body.title || `Page ${nextOrder + 1}`,
        });

        res.status(201).json(page);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create page', error: error.message });
    }
};

// @desc    Get all pages of a board
// @route   GET /api/boards/:boardId/pages
const getPages = async (req, res) => {
    try {
        const pages = await Page.find({ board: req.params.boardId }).sort({ order: 1 });
        res.json(pages);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch pages', error: error.message });
    }
};

// @desc    Get a single page with full data
// @route   GET /api/pages/:id
const getPage = async (req, res) => {
    try {
        const page = await Page.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }
        res.json(page);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch page', error: error.message });
    }
};

// @desc    Update page (autosave elements, drawings, background)
// @route   PUT /api/pages/:id
const updatePage = async (req, res) => {
    try {
        const page = await Page.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }

        const { title, elements, drawings, background, order } = req.body;
        if (title !== undefined) page.title = title;
        if (elements !== undefined) page.elements = elements;
        if (drawings !== undefined) page.drawings = drawings;
        if (background !== undefined) page.background = background;
        if (order !== undefined) page.order = order;

        await page.save();
        res.json(page);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update page', error: error.message });
    }
};

// @desc    Delete a page
// @route   DELETE /api/pages/:id
const deletePage = async (req, res) => {
    try {
        const page = await Page.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }

        const board = await Board.findById(page.board);
        if (!board || board.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized: Only the host can delete pages' });
        }

        await Page.findByIdAndDelete(req.params.id);
        res.json({ message: 'Page deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete page', error: error.message });
    }
};

module.exports = {
    createPage,
    getPages,
    getPage,
    updatePage,
    deletePage,
};
