const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
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

module.exports = router;
