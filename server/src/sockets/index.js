const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Board = require('../models/Board');
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
        socket.on('room:join', async (data) => {
            const { boardId, workspaceId } = data;
            socket.join(boardId);
            socket.boardId = boardId; // track for disconnect cleanup
            console.log(`${socket.userName} joined room ${boardId}`);

            // Also join workspace room for workspace-scoped chat & video
            if (workspaceId) {
                socket.join(`ws-${workspaceId}`);
                socket.workspaceId = workspaceId;
                console.log(`${socket.userName} joined workspace room ws-${workspaceId}`);
            } else {
                // Try to resolve workspace from board
                try {
                    const board = await Board.findById(boardId);
                    if (board?.workspace) {
                        socket.join(`ws-${board.workspace}`);
                        socket.workspaceId = board.workspace.toString();
                        console.log(`${socket.userName} joined workspace room ws-${board.workspace} (resolved from board)`);
                    }
                } catch (err) {
                    console.error('Error resolving workspace for board:', err);
                }
            }

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

        // ── Video Call Signaling (with workspace isolation) ──
        socket.on('call:join-room', async (data) => {
            const { roomId } = data;

            // ── Access control: verify user belongs to this workspace ──
            if (!socket.isGuest) {
                try {
                    const workspace = await Workspace.findById(roomId);
                    if (workspace) {
                        const isMember = workspace.members.some(
                            (m) => m.user.toString() === socket.userId
                        );
                        if (!isMember) {
                            console.warn(`[Security] ${socket.userName} denied video access to workspace ${roomId}`);
                            socket.emit('call:error', { message: 'Not a member of this workspace' });
                            return;
                        }
                    }
                } catch (err) {
                    console.error('Error checking video call access:', err);
                }
            } else {
                // Guests: only allow if they're already in a board room
                if (!socket.boardId) {
                    console.warn(`[Security] Guest ${socket.userName} denied video — not in any board room`);
                    socket.emit('call:error', { message: 'Join a board first' });
                    return;
                }
            }

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
            // 'to' is now the target socketId
            console.log(`[Call] ${socket.userName} → offer → socketId: ${to}`);
            io.to(to).emit('call:offer', {
                from: socket.id, // send my socketId as 'from'
                signal,
                userName: userName || socket.userName,
            });
        });

        socket.on('call:answer', (data) => {
            const { to, signal } = data;
            console.log(`[Call] ${socket.userName} → answer → socketId: ${to}`);
            io.to(to).emit('call:answer', {
                from: socket.id,
                signal,
            });
        });

        socket.on('call:ice-candidate', (data) => {
            const { to, candidate } = data;
            io.to(to).emit('call:ice-candidate', {
                from: socket.id,
                candidate,
            });
        });

        socket.on('call:end', (data) => {
            const { roomId } = data;
            socket.to(`video-${roomId}`).emit('call:end', {
                from: socket.id,
            });
        });

        // ── Disconnect ──
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.userName} (${socket.id})`);

            // Clean up userId → socketId map
            userSocketMap.delete(socket.userId);

            // Broadcast to all rooms this socket was in
            const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
            rooms.forEach((roomName) => {
                io.to(roomName).emit('room:user-left', {
                    userId: socket.userId,
                    userName: socket.userName,
                });
                // Also end any call for this socket
                io.to(roomName).emit('call:end', {
                    from: socket.id,
                });
                io.to(`video-${roomName}`).emit('call:end', {
                    from: socket.id,
                });
            });
        });
    });
};

module.exports = initSocket;
