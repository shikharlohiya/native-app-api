const express = require('express');
const router = express.Router();
const NotificationController = require('../../Controller/Notification/Notification');

// Get all zonal managers with their region information
router.get('/notifications', NotificationController.getEmployeeNotifications);
router.put('/notifications', NotificationController.updateSingleNotification);
 
 
module.exports = router;