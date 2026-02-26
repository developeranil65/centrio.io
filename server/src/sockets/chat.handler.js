/**
 * Chat handler — workspace-scoped
 * Events: chat:message
 */
module.exports = (socket, io) => {
    socket.on('chat:message', (data) => {
        // data: { boardId, workspaceId, message }
        // Prefer workspace room so chat persists across board switches
        const targetRoom = data.workspaceId
            ? `ws-${data.workspaceId}`
            : (socket.workspaceId ? `ws-${socket.workspaceId}` : data.boardId);

        socket.to(targetRoom).emit('chat:message', {
            userId: socket.userId,
            userName: socket.userName,
            message: data.message,
            timestamp: new Date().toISOString(),
        });
    });
};
