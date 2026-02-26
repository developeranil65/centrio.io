require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { Server } = require('socket.io');

const connectDB = require('./src/config/db');
const initSocket = require('./src/sockets');

// Route imports
const authRoutes = require('./src/routes/auth.routes');
const workspaceRoutes = require('./src/routes/workspace.routes');
const boardRoutes = require('./src/routes/board.routes');
const pageRoutes = require('./src/routes/page.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const exportRoutes = require('./src/routes/export.routes');
const statsRoutes = require('./src/routes/stats.routes');

// ── App setup ──
const app = express();
const server = http.createServer(app);

// ── Socket.io ──
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// ── Middleware ──
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const passport = require('passport');
require('./src/config/passport');
app.use(passport.initialize());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api', boardRoutes);
app.use('/api', pageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/stats', statsRoutes);

// ── Global error handler ──
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
    });
});

// ── Start server ──
const PORT = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB();
        initSocket(io);

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

start();
