const Board = require('../models/Board');

/**
 * Drawing sync handler
 * Events: draw:start, draw:move, draw:end, draw:clear
 */
module.exports = (socket, io) => {
    // User starts a drawing stroke
    socket.on('draw:start', (data) => {
        // data: { boardId, pageId, stroke: { points, color, width, tool } }
        socket.to(data.boardId).emit('draw:start', {
            userId: socket.userId,
            userName: socket.userName,
            ...data,
        });
    });

    // User continues a stroke (sends intermediate points)
    socket.on('draw:move', (data) => {
        socket.to(data.boardId).emit('draw:move', {
            userId: socket.userId,
            ...data,
        });
    });

    // User finishes a stroke
    socket.on('draw:end', (data) => {
        socket.to(data.boardId).emit('draw:end', {
            userId: socket.userId,
            ...data,
        });
    });

    // User clears a page's drawing layer (PROTECTED ROUTE)
    socket.on('draw:clear', async (data) => {
        try {
            // Verify ownership: only the board creator (host) can clear the page
            const board = await Board.findById(data.boardId);
            if (!board || board.createdBy.toString() !== socket.userId) {
                console.warn(`[Security] Unauthorized draw:clear attempt by ${socket.userName}`);
                return;
            }

            socket.to(data.boardId).emit('draw:clear', {
                userId: socket.userId,
                pageId: data.pageId,
            });
        } catch (err) {
            console.error('Error in draw:clear ownership check:', err);
        }
    });
};
