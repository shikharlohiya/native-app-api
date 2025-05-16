const express = require('express');
const router = express.Router();
const ParivartanDashboardController = require('../../Controller/ParivartanDashboard/ParivartanDashboard');

const verifySession = require("../../middleware/sessionVerify");


router.get('/bdm/performance-summary', ParivartanDashboardController.getBdmPerformanceSummary);
router.get('/bdm/action-details', ParivartanDashboardController.getBdmActionDetails);
router.get('/bdm/team-summary', ParivartanDashboardController.getTeamPerformanceSummary);


//v3


router.get('/v3/bdm/performance-summary',verifySession, ParivartanDashboardController.getBdmPerformanceSummary);
// router.get('/bdm/action-details',verifySession, ParivartanDashboardController.getBdmActionDetails);
// router.get('/bdm/team-summary',verifySession, ParivartanDashboardController.getTeamPerformanceSummary);


module.exports = router;