
const express = require('express');
const router = express.Router();

const ReportController = require('../../Controller/auditController/auditReportController');
router.get('/agent-detail-report',  ReportController.AgentDetailReport);
router.get('/export-agent-detail-report', ReportController.exportAgentDetailReport);

router.get('/incoming/audit/call-analytics', ReportController.getAuditCallAnalytics);
router.get('/incoming/audit/call-analytics/download', ReportController.getAgentReportFiltersExport);


router.get('/v2/incoming/audit/count', ReportController.getDashboardCallCounts);
router.get('/v2/incoming/audit/detail', ReportController.getDetailedCallAnalytics);


router.get('/v3/outgoing/audit/detail',ReportController.getCallAnalysis);
router.get('/v3/outgoing/stats',ReportController.getEmployeeCallStats);

router.get('/v3/working-hours-report',ReportController.getWorkingHoursReport);

router.get('/v3/incoming',ReportController.getIncomingCallStats);
router.get('/v3/incoming/detail',ReportController.getAgentCallDetails);



//update missed call api 

router.put('/v3/update-outgoing-status/:id', ReportController.updateOutgoingDoneStatus);

module.exports = router;




