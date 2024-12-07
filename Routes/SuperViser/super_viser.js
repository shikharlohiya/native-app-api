const express = require('express');
const router = express.Router();
const AgentController = require('../../Controller/Agent/AgentController');
const SupervisorController = require('../../Controller/SuperViser/super_viser');
const auth = require('../../middleware/check-auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Updated route for retrieving all leads with site visits for supervisor

// router.get('/call-discussion-analytics', SupervisorController.getCallDiscussionAnalytics);
router.get('/lead-analytics', SupervisorController.getLeadAnalytics);
router.get('/supervisor/leads-with-site-visits',auth, SupervisorController.getLeadsWithSiteVisitsForSupervisor);
router.get('/region-meeting-count', SupervisorController.getRegionMeetingCount);
router.get('/call-on-discussion', SupervisorController.getLeadUpdatesByBDMForSupervisor);
router.get('/bdm/lead-meetings',auth, SupervisorController.getLeadMeetingsForSupervisor);
router.get('/bdm/estimation', SupervisorController.getLeadEstimationsForSupervisor);
router.post('/upload-leads', upload.single('file'), SupervisorController.uploadLeads);
router.get('/get/leads',  SupervisorController.getLeads);
router.get('/superviser/export',  SupervisorController.exportLeadsToExcel);
router.get('/filter/list/:field',SupervisorController.getDistinctValues);
router.get('/bdm-followup-tasks', SupervisorController.getBDMFollowUpTasks);
router.get('/bdm-self-tasks', SupervisorController.getBDMSelfTasks);
router.get('/bdm-daily-tasks/:bdmId', SupervisorController.getBdmDailyTasks);

module.exports = router;