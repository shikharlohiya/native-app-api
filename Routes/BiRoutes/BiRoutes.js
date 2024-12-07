const express = require('express');
const router = express.Router();
 
const BiController = require('../../Controller/BiController/BiController');



const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
router.post('/upload-dayop-lead', upload.single('file'),  BiController.uploadAuditLeads);
router.post('/bi-day-op-remarks', BiController.addRemarks);
router.get('/bi-day-op-leads', BiController.getBiLeads);
router.get('/get-bi-remarks/:lotNumber' , BiController.getBiLeadRemarksByLotNumber);
router.get('/all/leads/dayop',BiController.getAllLeadsForDayOpSuperviser);



// router.post('/upload-brooding', upload.single('file'), BiController.uploadBiBrooding);


 

module.exports = router;
