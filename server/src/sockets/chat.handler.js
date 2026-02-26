/**
 * Chat handler
 * Events: chat:message
 */
module.exports = (socket, io) => {
    socket.on('chat:message', (data) => {
        // data: { boardId, message }
        socket.to(data.boardId).emit('chat:message', {
            userId: socket.userId,
            userName: socket.userName,
            message: data.message,
            timestamp: new Date().toISOString(),
        });
    });
};
