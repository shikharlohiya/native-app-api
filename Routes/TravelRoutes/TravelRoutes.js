
// routes/bdmTravelRoutes.js
const express = require('express');
const router = express.Router();
const bdmTravelController = require('../../Controller/Travel/TravelController');
 
const multer = require('multer');

// Use memory storage for multer to work with AWS S3
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// File upload middleware configuration
const uploadMiddleware = upload.fields([
  { name: 'mandatoryVisitImage', maxCount: 1 },
  { name: 'optionalVisitImage', maxCount: 1 }
]);

// Create a new BDM travel detail
router.post('/travel',  uploadMiddleware, bdmTravelController.createBdmTravel);

module.exports = router;