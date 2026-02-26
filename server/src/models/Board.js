const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Board title is required'],
            trim: true,
            maxlength: 100,
        },
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        mode: {
            type: String,
            enum: ['whiteboard', 'architecture', 'er'],
            default: 'whiteboard',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);
