const jwt = require('jsonwebtoken');
const User = require('../models/User');
const drawingHandler = require('./drawing.handler');
const diagramHandler = require('./diagram.handler');
const cursorHandler = require('./cursor.handler');
const chatHandler = require('./chat.handler');
const pageHandler = require('./page.handler');

/**
 * Initialise Socket.io with JWT authentication (+ guest mode) and event handlers.
 */
const initSocket = (io) => {
    // ── userId → socketId map for WebRTC signalling ──
    const userSocketMap = new Map(); // userId -> socket.id

    // ── Authentication middleware ──
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            const guestName = socket.handshake.auth.guestName || socket.handshake.query.guestName;
            const guestEmail = socket.handshake.auth.guestEmail || socket.handshake.query.guestEmail;

            // Guest mode — anonymous users with a display name
            if (!token && guestName) {
                socket.userId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
                socket.userName = guestName;
                socket.userEmail = guestEmail || '';
                socket.isGuest = true;
                return next();
            }

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new Error('User not found'));
            }

            // Attach user info to socket instance
            socket.userId = user._id.toString();
            socket.userName = user.name;
            socket.isGuest = false;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    // ── Connection handler ──
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.userName} (${socket.id}) [${socket.isGuest ? 'guest' : 'auth'}]`);

        // Register in userId → socketId map
        userSocketMap.set(socket.userId, socket.id);

        // ── Room management ──
        socket.on('room:join', (data) => {
            const { boardId } = data;
            socket.join(boardId);
            socket.boardId = boardId; // track for disconnect cleanup
            console.log(`${socket.userName} joined room ${boardId}`);

            // Notify others in the room
            socket.to(boardId).emit('room:user-joined', {
                userId: socket.userId,
                userName: socket.userName,
                socketId: socket.id,
            });
        });

        socket.on('room:leave', (data) => {
            const { boardId } = data;
            socket.leave(boardId);

            socket.to(boardId).emit('room:user-left', {
                userId: socket.userId,
                userName: socket.userName,
            });
        });

        // ── Register event handlers ──
        drawingHandler(socket, io);
        diagramHandler(socket, io);
        cursorHandler(socket, io);
        chatHandler(socket, io);
        pageHandler(socket, io);

        // ── Video Call Signaling (fixed routing via userSocketMap) ──
        socket.on('call:join-room', (data) => {
            const { roomId } = data;
            socket.join(`video-${roomId}`);
            console.log(`[Call] ${socket.userName} joined video room video-${roomId}`);
        });

        socket.on('call:leave-room', (data) => {
            const { roomId } = data;
            socket.leave(`video-${roomId}`);
            console.log(`[Call] ${socket.userName} left video room video-${roomId}`);
        });

        socket.on('call:start', (data) => {
            const { roomId } = data;
            console.log(`[Call] ${socket.userName} started call in room ${roomId}`);
            socket.to(`video-${roomId}`).emit('call:user-joined', {
                userId: socket.userId,
                userName: socket.userName,
                socketId: socket.id,
            });
        });

        socket.on('call:offer', (data) => {
            const { to, signal, boardId, userName } = data;
            const targetSocketId = userSocketMap.get(to);
            console.log(`[Call] ${socket.userName} → offer → ${to} (socketId: ${targetSocketId || 'NOT FOUND'})`);
            if (targetSocketId) {
                io.to(targetSocketId).emit('call:offer', {
                    from: socket.userId,
                    signal,
                    userName: userName || socket.userName,
                });
            } else {
                console.warn(`[Call] Cannot route offer: no socket found for userId ${to}`);
            }
        });

        socket.on('call:answer', (data) => {
            const { to, signal } = data;
            const targetSocketId = userSocketMap.get(to);
            console.log(`[Call] ${socket.userName} → answer → ${to} (socketId: ${targetSocketId || 'NOT FOUND'})`);
            if (targetSocketId) {
                io.to(targetSocketId).emit('call:answer', {
                    from: socket.userId,
                    signal,
                });
            }
        });

        socket.on('call:ice-candidate', (data) => {
            const { to, candidate } = data;
            const targetSocketId = userSocketMap.get(to);
            if (targetSocketId) {
                io.to(targetSocketId).emit('call:ice-candidate', {
                    from: socket.userId,
                    candidate,
                });
            }
        });

        socket.on('call:end', (data) => {
            const { boardId } = data;
            socket.to(boardId).emit('call:end', {
                from: socket.userId,
            });
        });

        // ── Disconnect ──
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.userName} (${socket.id})`);

            // Clean up userId → socketId map
            userSocketMap.delete(socket.userId);

            // Broadcast to all rooms this socket was in
            const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
            rooms.forEach((boardId) => {
                io.to(boardId).emit('room:user-left', {
                    userId: socket.userId,
                    userName: socket.userName,
                });
                // Also end any call for this user
                io.to(boardId).emit('call:end', {
                    from: socket.userId,
                });
            });
        });
    });
};

module.exports = initSocket;
