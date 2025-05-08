
// routes/bdmTravelRoutes.js
const express = require('express');
const router = express.Router();
const bdmTravelController = require('../../Controller/Travel/TravelController');
 
const multer = require('multer');

// Use memory storage for multer to work with AWS S3
const storage = multer.memoryStorage();


// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
// });
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});



// File upload middleware configuration
const uploadMiddleware = upload.fields([
  { name: 'mandatoryVisitImage', maxCount: 1 },
  { name: 'optionalVisitImage', maxCount: 1 }
]);

// Create a new BDM travel detail
// router.post('/travel',  uploadMiddleware, bdmTravelController.createBdmTravel);

router.post('/travel', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'File size too large. Maximum allowed size is 10MB.' 
        });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Server error during upload' });
    }
    bdmTravelController.createBdmTravel(req, res, next);
  });
});



module.exports = router;