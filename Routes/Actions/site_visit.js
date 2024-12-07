 


const express = require('express');
const router = express.Router();
const site_visit = require('../../Controller/Actions/site_visit');
const auth = require('../../middleware/check-auth');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const uploadMiddleware = upload.fields([
    { name: 'images', maxCount: 10 },
    // Add any other fields you need here
  ]);
  
  
  
 

router.post('/create/sitevisit', uploadMiddleware,site_visit.createSiteMeeting);
router.get('/leads/:leadId/site-visit', auth, site_visit.getSiteVisitByLeadId);

module.exports = router;




