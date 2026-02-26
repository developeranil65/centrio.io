/**
 * Diagram sync handler (architecture + ER diagram shapes & connectors)
 * Events: shape:add, shape:move, shape:update, shape:delete, connector:add, connector:delete
 */
module.exports = (socket, io) => {
    socket.on('shape:add', (data) => {
        // data: { boardId, pageId, shape: { id, type, x, y, width, height, label, properties } }
        socket.to(data.boardId).emit('shape:add', {
            userId: socket.userId,
            ...data,
        });
    });

    socket.on('shape:move', (data) => {
        // data: { boardId, pageId, shapeId, x, y }
        socket.to(data.boardId).emit('shape:move', {
            userId: socket.userId,
            ...data,
        });
    });

    socket.on('shape:update', (data) => {
        // data: { boardId, pageId, shapeId, updates: { label?, properties?, width?, height? } }
        socket.to(data.boardId).emit('shape:update', {
            userId: socket.userId,
            ...data,
        });
    });

    socket.on('shape:delete', (data) => {
        // data: { boardId, pageId, shapeId }
        socket.to(data.boardId).emit('shape:delete', {
            userId: socket.userId,
            ...data,
        });
    });

    socket.on('connector:add', (data) => {
        // data: { boardId, pageId, connector: { id, fromShapeId, toShapeId, label, style } }
        socket.to(data.boardId).emit('connector:add', {
            userId: socket.userId,
            ...data,
        });
    });

    socket.on('connector:delete', (data) => {
        // data: { boardId, pageId, connectorId }
        socket.to(data.boardId).emit('connector:delete', {
            userId: socket.userId,
            ...data,
        });
    });
};
