const express = require('express');
const router = express.Router();
const authController = require('../Controller/Auth/LoginController');

router.post('/login', authController.login);

module.exports = router;