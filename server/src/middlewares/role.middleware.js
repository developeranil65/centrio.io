const Workspace = require('../models/Workspace');

/**
 * Middleware factory that checks if the authenticated user has one of
 * the required roles in the workspace identified by req.params.id or req.params.wsId.
 *
 * Usage: requireRole('host', 'editor')
 */
const requireRole = (...roles) => {
    return async (req, res, next) => {
        try {
            const workspaceId = req.params.wsId || req.params.id;

            if (!workspaceId) {
                return res.status(400).json({ message: 'Workspace ID is required' });
            }

            const workspace = await Workspace.findById(workspaceId);

            if (!workspace) {
                return res.status(404).json({ message: 'Workspace not found' });
            }

            const member = workspace.members.find(
                (m) => m.user.toString() === req.user._id.toString()
            );

            if (!member) {
                return res
                    .status(403)
                    .json({ message: 'You are not a member of this workspace' });
            }

            if (roles.length > 0 && !roles.includes(member.role)) {
                return res.status(403).json({
                    message: `Role '${member.role}' is not authorized. Required: ${roles.join(', ')}`,
                });
            }

            req.workspace = workspace;
            req.memberRole = member.role;
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Role check failed', error: error.message });
        }
    };
};

module.exports = { requireRole };
