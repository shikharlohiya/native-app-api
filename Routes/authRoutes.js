const express = require('express');
const router = express.Router();
const authController = require('../Controller/Auth/LoginController');
const verifySession = require("../middleware/sessionVerify");

router.post('/v3/login', authController.login);
router.post('/v3/employee/fcm-token',verifySession, authController.updateFcmToken);

module.exports = router;