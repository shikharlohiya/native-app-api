const express = require('express');
const 
router = express.Router();
const auth = require('../../middleware/check-auth');
const ShrimpFeedController = require('../../Controller/ShrimpFeed/shrimpFeedController');



// Create new shrimp feed remark
router.post('/shrimp-feed/remark', ShrimpFeedController.createShrimpFeedRemark);



//shrimp feed masters
router.get('/shrimp-feed-masters', ShrimpFeedController.getAllShrimpFeedMasters);

// Get master details with latest remarks
router.get('/shrimp-feed/details/:mobileNumber',  ShrimpFeedController.getShrimpFeedDetails);

// Get all remarks for a mobile number with pagination
router.get('/shrimp-feed/remarks/:mobileNumber',  ShrimpFeedController.getAllShrimpFeedRemarks);

// Upload Excel file
router.post('/shrimp-feed/upload', 
    
    ShrimpFeedController.upload,
    ShrimpFeedController.uploadShrimpFeedMaster
);

// Validate Excel file structure
router.post('/shrimp-feed/validate-excel',
    auth,
    ShrimpFeedController.upload,
    ShrimpFeedController.validateExcelFile
);

module.exports = router;