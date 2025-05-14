const express = require('express');
const router = express.Router();
const MasterController = require('../../Controller/Master/MasterController');

 
// const auth = require('../../middleware/check-auth');
 
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


// Upload branch data from Excel file
router.post('/upload-branch-data', upload.single('file'),  MasterController.uploadBranchData);





// Get all zonal managers with their region information
router.get('/get-all-region', MasterController.getAllRegions);
router.get('/get-all-zonal-manager', MasterController.getZonalManagers);
router.post('/zonal-manager', MasterController.addZonalManager);
router.post('/zonal-managers/status', MasterController.updateZonalManagerStatus);
router.get('/campaigns', MasterController.getAllCampaigns);

// Get branches for an employee by ID
router.get('/employee-branches/:employeeId', MasterController.getEmployeeBranchesById);




 
module.exports = router;