
const express = require('express');
const router = express.Router();
const { executeCronJob } = require('../../Controller/Attendence/AttendenceController');


const bdmActionController = require('../../Controller/Attendence/AttendenceController');

router.post('/batch-lead-actions',bdmActionController.handleBatchLeadActions);

router.post('/todo-list/update', bdmActionController.executeCronJob);
 

router.post('/todo-list/whole-update', bdmActionController.updateAllCompletionStatuses);


router.get('/bdm-report', bdmActionController.getAllBdmStats);

module.exports = router;