const express = require('express');
const router = express.Router();
const estimationController = require('../../Controller/Actions/estimations');
const auth = require('../../middleware/check-auth');



router.get('/by-lead-detail/:leadDetailId', estimationController.getEstimationsByLeadDetailId);
router.get('/shared/by-lead-detail/:leadDetailId', estimationController.getEstimationsSharedByLeadDetailId);
router.get('/convert/:leadDetailId', estimationController.getEstimationsConvert);
router.post('/estimation/download-complete', estimationController.updateEstimationDownloadStatus);
router.post('/create/estimations',auth, estimationController.createEstimation);
router.get('/leads/:leadId/estimation', auth,estimationController.getEstimationByLeadId);
router.get('/download-estimation/:estimation_id', estimationController.downloadEstimationZip);

module.exports = router;