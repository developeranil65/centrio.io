const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema(
    {
        board: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board',
            required: true,
        },
        order: {
            type: Number,
            default: 0,
        },
        title: {
            type: String,
            default: 'Untitled Page',
            trim: true,
            maxlength: 100,
        },
        elements: {
            type: mongoose.Schema.Types.Mixed,
            default: [],
        },
        drawings: {
            type: mongoose.Schema.Types.Mixed,
            default: [],
        },
        background: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Page', pageSchema);
