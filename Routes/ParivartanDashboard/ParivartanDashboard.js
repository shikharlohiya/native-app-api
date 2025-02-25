const express = require('express');
const router = express.Router();
const ParivartanDashboardController = require('../../Controller/ParivartanDashboard/ParivartanDashboard');

router.get('/bdm/performance-summary', ParivartanDashboardController.getBdmPerformanceSummary);
router.get('/bdm/action-details', ParivartanDashboardController.getBdmActionDetails);
router.get('/bdm/team-summary', ParivartanDashboardController.getTeamPerformanceSummary);


module.exports = router;