const express = require('express');
const router = express.Router();
const leadLogController = require('../Controller/TimeLine/TimeLineController');
const verifySession = require(".././middleware/sessionVerify");

// GET lead logs by lead detail ID
router.get('/lead-detail/:leadDetailId', leadLogController.getLeadLogsByLeadDetailId);


//v3

router.get('/v3/lead-detail/:leadDetailId',verifySession, leadLogController.getLeadLogsByLeadDetailId);



module.exports = router;