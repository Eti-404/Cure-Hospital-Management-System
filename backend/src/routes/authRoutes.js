const express = require('express');
const router = express.Router();
const { registerPatient, login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', registerPatient);
router.post('/login', login);
router.get('/me', verifyToken, getMe);

module.exports = router;
