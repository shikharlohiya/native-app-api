const express = require('express');
const router = express.Router();
const authController = require('../Controller/Auth/LoginController');

router.post('/v3/login', authController.login);
router.post('/users/fcm-token', authController.updateFcmToken);

module.exports = router;