const express = require('express');
const router = express.Router();
const MasterController = require('../../Controller/Master/MasterController');
const verifySession = require("../../middleware/sessionVerify");




 
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








//v3
router.get('/v3/employee-branches/:employeeId',verifySession, MasterController.getEmployeeBranchesByIdV3);

// Category routes
router.get('/v3/categories',verifySession, MasterController.getCategories);
router.get('/v3/categories/:id',verifySession, MasterController.getCategoryById);
router.post('/v3/categories',verifySession, MasterController.createCategory);
router.delete('/v3/categories/:id',verifySession, MasterController.deleteCategory);

// Subcategory routes
router.get('/v3/subcategories',verifySession, MasterController.getSubCategories);
router.get('/v3/subcategories/priority/:priority',verifySession, MasterController.getSubCategoriesByPriority);
router.post('/v3/subcategories',verifySession, MasterController.createSubCategory);
router.delete('/v3/subcategories/:id',verifySession, MasterController.deleteSubCategory);


//task list
router.get('/v3/tasklist',verifySession, MasterController.getTaskTypes);
router.get('/v3/enquirytype',verifySession, MasterController.getEnquiryTypes);



router.get('/v3/getProjectTypes',verifySession, MasterController.getProjectTypes);
router.get('/v3/leadSource',verifySession, MasterController.getCampaigns);
router.get('/v3/getCse',verifySession, MasterController.getManagers);





 
module.exports = router;