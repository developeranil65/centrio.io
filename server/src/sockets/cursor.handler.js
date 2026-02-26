/**
 * Cursor presence handler
 * Events: cursor:move
 * Broadcasts each user's cursor position + name to others in the room
 */
module.exports = (socket, io) => {
    socket.on('cursor:move', (data) => {
        // data: { boardId, x, y, pageId }
        socket.to(data.boardId).emit('cursor:move', {
            userId: socket.userId,
            userName: socket.userName,
            x: data.x,
            y: data.y,
            pageId: data.pageId,
        });
    });
};
