
const express = require('express');
const router = express.Router();
const { executeCronJob } = require('../../Controller/Attendence/AttendenceController');


const bdmActionController = require('../../Controller/Attendence/AttendenceController');

router.post('/batch-lead-actions',bdmActionController.handleBatchLeadActions);

router.post('/todo-list/update', bdmActionController.executeCronJob);

router.post('/todo-list/whole-update', bdmActionController.updateAllCompletionStatuses);


router.get('/bdm-report', bdmActionController.getAllBdmStats);

router.post('/bdm/checkin', bdmActionController.handleBdmCheckIn);
router.post('/bdm/checkout', bdmActionController.handleBdmCheckOut);

router.post('/bdm/daily-distance', bdmActionController.getBdmDailyDistance);
router.post('/bdm/attendence/out',bdmActionController.handleAttendanceOut);


//will do later
// router.post('/bdm/travel-report', bdmActionController.generateTravelReport);

router.post('/bdm/other-tasks', bdmActionController.handleOtherTasks);

router.get('/bdm/all-attendence', bdmActionController.getEmployeeAttendance);


router.get('/bdm/travel-report', bdmActionController.getAllBdmTravelReport);



//for view in the page for single bdm
router.get('/bdm/travel-detail', bdmActionController.getBdmTravelDetails);


router.get('/bdm/view', bdmActionController.getSimpleTravelReport);



router.get('/hr/attendence', bdmActionController.getBdmAttendanceReport);



router.post('/bdm/create-leave', bdmActionController.createLeave);
router.get('/bdm/get-leave', bdmActionController.getEmployeeLeaves);
router.get('/bdm/get-all-employee-leave', bdmActionController.getEmployeesOnLeave);



// router.post('/send-attendance',   bdmActionController.sendAttendanceRecords);

// Route to manually trigger the daily sync (useful for testing)
// router.get('/sync-daily',  bdmActionController.syncDailyAttendance);


module.exports = router;