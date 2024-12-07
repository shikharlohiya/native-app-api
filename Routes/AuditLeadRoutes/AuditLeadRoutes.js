const express = require('express');
const router = express.Router();
const auth = require('../../middleware/check-auth');
const AuditController = require('../../Controller/auditController/auditLeadController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
router.post('/upload-audit-leads', upload.single('file'), auth,  AuditController.uploadAuditLeads);
router.post('/upload-trader-leads', upload.single('file'),  AuditController.uploadAuditTraders);
router.get('/audit-leads',  AuditController.getAuditLeads);
router.get('/audit-trader',auth, AuditController.getAuditTraders);
router.post('/audit-remarks' ,  AuditController.createAuditLeadRemark)
router.get('/get-audit-remarks/:lotNumber' , auth, AuditController.getAuditLeadRemarksByLotNumber)
router.get('/supervisor-dashboard',auth, AuditController.getSupervisorDashboard);
router.put('/update-status', AuditController.updateAuditLeadStatus);
router.get('/all/leads',AuditController.getAllLeadsForSupervisor );
router.get('/download-audit-leads', AuditController.downloadAuditLeadsExcel);
router.get('/get-audit-detail/:lotNumber',AuditController.getAuditLeadDetailsByLotNumber);
router.post('/create-lead/new-farmer', AuditController.createAuditLead);
router.get('/audit-lead/mobile/:mobile', AuditController.getLotNumbersByMobile);




module.exports = router;
