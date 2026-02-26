const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ['host', 'editor', 'viewer'],
            default: 'editor',
        },
    },
    { _id: false }
);

const workspaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Workspace name is required'],
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            default: '',
            maxlength: 500,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [memberSchema],
    },
    { timestamps: true }
);

// Auto-add owner as host member on creation
workspaceSchema.pre('save', function (next) {
    if (this.isNew) {
        const alreadyMember = this.members.some(
            (m) => m.user.toString() === this.owner.toString()
        );
        if (!alreadyMember) {
            this.members.push({ user: this.owner, role: 'host' });
        }
    }
    next();
});

module.exports = mongoose.model('Workspace', workspaceSchema);
