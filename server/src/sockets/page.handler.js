/**
 * Page switching handler
 * Events: page:switch, page:create
 */
module.exports = (socket, io) => {
    socket.on('page:switch', (data) => {
        // data: { boardId, pageId }
        socket.to(data.boardId).emit('page:switch', {
            userId: socket.userId,
            userName: socket.userName,
            pageId: data.pageId,
        });
    });

    socket.on('page:create', (data) => {
        // data: { boardId, page: { _id, title, order } }
        socket.to(data.boardId).emit('page:create', {
            userId: socket.userId,
            userName: socket.userName,
            page: data.page,
        });
    });
};
