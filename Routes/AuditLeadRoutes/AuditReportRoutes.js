
const express = require('express');
const router = express.Router();

const ReportController = require('../../Controller/auditController/auditReportController');
router.get('/agent-detail-report',  ReportController.AgentDetailReport);
router.get('/export-agent-detail-report', ReportController.exportAgentDetailReport);

router.get('/incoming/audit/call-analytics', ReportController.getAuditCallAnalytics);
router.get('/incoming/audit/call-analytics/download', ReportController.getAgentReportFiltersExport);


router.get('/v2/incoming/audit/count', ReportController.getDashboardCallCounts);
router.get('/v2/incoming/audit/detail', ReportController.getDetailedCallAnalytics);


module.exports = router;




