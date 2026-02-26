const Page = require('../models/Page');
const Board = require('../models/Board');

// @desc    Export a single page as JSON (PNG rendering happens client-side)
// @route   GET /api/export/page/:id/png
const exportPageAsPng = async (req, res) => {
    try {
        const page = await Page.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }

        // Return full page data — the client renders it to canvas and exports as PNG
        res.json({
            message: 'Page data for PNG export',
            page: {
                _id: page._id,
                title: page.title,
                elements: page.elements,
                drawings: page.drawings,
                background: page.background,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Export failed', error: error.message });
    }
};

// @desc    Export a full board as JSON (PDF rendering happens client-side)
// @route   GET /api/export/board/:id/pdf
const exportBoardAsPdf = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        const pages = await Page.find({ board: board._id }).sort({ order: 1 });

        res.json({
            message: 'Board data for PDF export',
            board: {
                _id: board._id,
                title: board.title,
                mode: board.mode,
            },
            pages: pages.map((p) => ({
                _id: p._id,
                title: p.title,
                order: p.order,
                elements: p.elements,
                drawings: p.drawings,
                background: p.background,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: 'Export failed', error: error.message });
    }
};

module.exports = {
    exportPageAsPng,
    exportBoardAsPdf,
};
