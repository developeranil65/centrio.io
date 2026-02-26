const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const passport = require('passport');
const {
    register,
    login,
    getMe,
    registerValidation,
    loginValidation,
} = require('../controllers/auth.controller');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);

// ── Google OAuth Routes ──
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, generate JWT
        const token = req.user.generateToken();

        // Redirect to frontend with token in URL
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/?token=${token}`);
    }
);

module.exports = router;
