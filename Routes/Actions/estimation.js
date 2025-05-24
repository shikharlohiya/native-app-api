const express = require('express');
const router = express.Router();
const estimationController = require('../../Controller/Actions/estimations');
const auth = require('../../middleware/check-auth');
const verifySession = require("../../middleware/sessionVerify");



router.get('/by-lead-detail/:leadDetailId', estimationController.getEstimationsByLeadDetailId);
router.get('/shared/by-lead-detail/:leadDetailId', estimationController.getEstimationsSharedByLeadDetailId);
router.get('/convert/:leadDetailId', estimationController.getEstimationsConvert);
router.post('/estimation/download-complete', estimationController.updateEstimationDownloadStatus);
router.post('/create/estimations',auth, estimationController.createEstimation);
router.get('/leads/:leadId/estimation', auth,estimationController.getEstimationByLeadId);
router.get('/download-estimation/:estimation_id', estimationController.downloadEstimationZip);



///estimation v3
router.get('/v3/shared/by-lead-detail/:leadDetailId',verifySession, estimationController.getEstimationsSharedByLeadDetailId);
router.get('/v3/by-lead-detail/:leadDetailId',verifySession, estimationController.getEstimationsByLeadDetailId);
router.get('/v3/shared/by-lead-detail/:leadDetailId',verifySession, estimationController.getEstimationsSharedByLeadDetailId);
router.get('/v3/convert/:leadDetailId',verifySession, estimationController.getEstimationsConvert);
router.post('/v3/estimation/download-complete', estimationController.updateEstimationDownloadStatus);
router.post('/v3/create/estimations',verifySession, estimationController.createEstimation);
router.get('/v3/leads/:leadId/estimation', verifySession,estimationController.getEstimationByLeadId);
router.get('/v3/download-estimation/:estimation_id',verifySession, estimationController.downloadEstimationZip);






module.exports = router;