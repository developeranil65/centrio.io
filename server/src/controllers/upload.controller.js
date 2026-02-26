const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Upload = require('../models/Upload');

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});

// File filter — allow images and PDFs
const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images and PDFs are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// @desc    Upload a file
// @route   POST /api/upload
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileRecord = await Upload.create({
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: `/uploads/${req.file.filename}`,
            uploadedBy: req.user ? req.user._id : undefined,
            workspace: req.body.workspaceId,
        });

        res.status(201).json({
            ...fileRecord.toObject(),
            url: fileRecord.path
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
};

// @desc    Get uploads for a workspace
// @route   GET /api/uploads/:workspaceId
const getUploads = async (req, res) => {
    try {
        const uploads = await Upload.find({ workspace: req.params.workspaceId })
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(uploads);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch uploads', error: error.message });
    }
};

module.exports = {
    upload,
    uploadFile,
    getUploads,
};
