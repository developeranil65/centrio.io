const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
    createWorkspace,
    getWorkspaces,
    getWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addMember,
    removeMember,
} = require('../controllers/workspace.controller');

router.use(protect); // All workspace routes require auth

router.route('/').post(createWorkspace).get(getWorkspaces);

router
    .route('/:id')
    .get(getWorkspace)
    .put(updateWorkspace)
    .delete(deleteWorkspace);

router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
