const Workspace = require('../models/Workspace');

// @desc    Create a workspace
// @route   POST /api/workspaces
const createWorkspace = async (req, res) => {
    try {
        const { name, description } = req.body;

        const workspace = await Workspace.create({
            name,
            description,
            owner: req.user._id,
        });

        res.status(201).json(workspace);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create workspace', error: error.message });
    }
};

// @desc    Get all workspaces the user is a member of
// @route   GET /api/workspaces
const getWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({
            'members.user': req.user._id,
        }).populate('owner', 'name email avatar');

        res.json(workspaces);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch workspaces', error: error.message });
    }
};

// @desc    Get single workspace
// @route   GET /api/workspaces/:id
const getWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Check membership
        const isMember = workspace.members.some(
            (m) => m.user._id.toString() === req.user._id.toString()
        );
        if (!isMember) {
            return res.status(403).json({ message: 'Not a member of this workspace' });
        }

        res.json(workspace);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch workspace', error: error.message });
    }
};

// @desc    Update workspace
// @route   PUT /api/workspaces/:id
const updateWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Only owner/host can update
        if (workspace.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the owner can update this workspace' });
        }

        const { name, description } = req.body;
        if (name) workspace.name = name;
        if (description !== undefined) workspace.description = description;

        await workspace.save();
        res.json(workspace);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update workspace', error: error.message });
    }
};

// @desc    Delete workspace
// @route   DELETE /api/workspaces/:id
const deleteWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        if (workspace.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the owner can delete this workspace' });
        }

        await Workspace.findByIdAndDelete(req.params.id);
        res.json({ message: 'Workspace deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete workspace', error: error.message });
    }
};

// @desc    Add member to workspace (accept email or userId)
// @route   POST /api/workspaces/:id/members
const addMember = async (req, res) => {
    try {
        const { email, userId, role } = req.body;
        const workspace = await Workspace.findById(req.params.id);

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Only host can add members
        const requester = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );
        if (!requester || requester.role !== 'host') {
            return res.status(403).json({ message: 'Only the host can add members' });
        }

        // Look up the user — support both email and direct userId
        let targetUserId = userId;
        if (email && !userId) {
            const User = require('../models/User');
            const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
            if (!targetUser) {
                return res.status(404).json({ message: 'No user found with that email address' });
            }
            targetUserId = targetUser._id.toString();
        }

        if (!targetUserId) {
            return res.status(400).json({ message: 'Email or User ID is required' });
        }

        // Check if already a member
        const alreadyMember = workspace.members.some(
            (m) => m.user.toString() === targetUserId.toString()
        );
        if (alreadyMember) {
            return res.status(400).json({ message: 'User is already a member of this workspace' });
        }

        workspace.members.push({ user: targetUserId, role: role || 'editor' });
        await workspace.save();

        // Re-fetch with populated members to return full data
        const updated = await Workspace.findById(req.params.id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add member', error: error.message });
    }
};

// @desc    Remove member from workspace
// @route   DELETE /api/workspaces/:id/members/:userId
const removeMember = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Only host can remove members
        const requester = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );
        if (!requester || requester.role !== 'host') {
            return res.status(403).json({ message: 'Only the host can remove members' });
        }

        // Cannot remove the owner
        if (req.params.userId === workspace.owner.toString()) {
            return res.status(400).json({ message: 'Cannot remove the workspace owner' });
        }

        workspace.members = workspace.members.filter(
            (m) => m.user.toString() !== req.params.userId
        );
        await workspace.save();

        res.json(workspace);
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove member', error: error.message });
    }
};

module.exports = {
    createWorkspace,
    getWorkspaces,
    getWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addMember,
    removeMember,
};
