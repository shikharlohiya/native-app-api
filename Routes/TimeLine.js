const express = require('express');
const router = express.Router();
const leadLogController = require('../Controller/TimeLine/TimeLineController');

// GET lead logs by lead detail ID
router.get('/lead-detail/:leadDetailId', leadLogController.getLeadLogsByLeadDetailId);

module.exports = router;