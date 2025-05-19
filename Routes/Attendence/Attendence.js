
const express = require('express');
const router = express.Router();
const { executeCronJob } = require('../../Controller/Attendence/AttendenceController');
 const verifySession = require("../../middleware/sessionVerify");



const bdmActionController = require('../../Controller/Attendence/AttendenceController');

router.post('/v3/batch-lead-actions', verifySession , bdmActionController.handleBatchLeadActions);

router.post('/todo-list/update', bdmActionController.executeCronJob);

router.post('/todo-list/whole-update', bdmActionController.updateAllCompletionStatuses);


router.get('/bdm-report', bdmActionController.getAllBdmStats);

router.post('/v3/bdm/checkin', bdmActionController.handleBdmCheckIn);
router.post('/bdm/checkout', bdmActionController.handleBdmCheckOut);

router.post('/bdm/daily-distance', bdmActionController.getBdmDailyDistance);
router.post('/bdm/attendence/out',bdmActionController.handleAttendanceOut);


//will do later
// router.post('/bdm/travel-report', bdmActionController.generateTravelReport);

router.post('/v3/bdm/other-tasks',verifySession, bdmActionController.handleOtherTasks);

router.get('/bdm/all-attendence', bdmActionController.getEmployeeAttendance);


router.get('/bdm/travel-report', bdmActionController.getAllBdmTravelReport);



//for view in the page for single bdm
router.get('/bdm/travel-detail', bdmActionController.getBdmTravelDetails);

router.get('/v2/bdm/travel-detail', bdmActionController.getBdmTravelDetailsWithDateRange);


router.get('/bdm/view', bdmActionController.getSimpleTravelReport);



router.get('/hr/attendence', bdmActionController.getBdmAttendanceReport);



router.post('/bdm/create-leave', bdmActionController.createLeave);
router.get('/bdm/get-leave', bdmActionController.getEmployeeLeaves);
router.get('/bdm/get-all-employee-leave', bdmActionController.getEmployeesOnLeave);



router.post('/send-attendance',   bdmActionController.sendAttendanceRecords);

// Route to manually trigger the daily sync (useful for testing)


router.post('/sync-daily',  bdmActionController.syncDailyAttendance);




//v3
router.get('/v3/bdm/travel-detail',verifySession, bdmActionController.getBdmTravelDetailsWithDateRange);
router.post('/v3/bdm/create-leave', verifySession, bdmActionController.createLeave);
router.get('/v3/bdm/get-leave',verifySession, bdmActionController.getEmployeeLeaves);
router.get('/v3/bdm/delete-leave/:leaveId',verifySession, bdmActionController.deleteLeave);
router.get('/bdm/get-all-employee-leave',verifySession, bdmActionController.getEmployeesOnLeave);
router.get('/v3/bdm/view',verifySession, bdmActionController.getSimpleTravelReport);

router.post('/v3/bdm/checkin', verifySession, bdmActionController.handleBdmCheckIn);

router.post('/v3/bdm/checkout',verifySession, bdmActionController.handleBdmCheckOut);
router.post('/v3/bdm/attendence/out',verifySession,bdmActionController.handleAttendanceOut);






module.exports = router;