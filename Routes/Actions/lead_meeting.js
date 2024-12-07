// const express = require('express');
// const router = express.Router();
// const lead_Meeting = require('../../Controller/Actions/lead_meeting');
// const Lead_Update = require('../../Controller/Actions/lead_update')

// router.post('/create/meeting', lead_Meeting.createMeeting);

// router.post('/update/lead' ,Lead_Update.createLeadUpdate )
 


// module.exports = router;



const express = require('express');
const router = express.Router();
const lead_Meeting = require('../../Controller/Actions/lead_meeting');
const Lead_Update = require('../../Controller/Actions/lead_update');
const auth = require('../../middleware/check-auth');
const multer = require('multer');


// const upload = multer({ dest: 'uploads/' });
// const upload = multer({ storage: multer.memoryStorage() });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadMiddleware = upload.fields([
  { name: 'images', maxCount: 10 },
  // Add any other fields you need here
]);



router.post('/create/meeting', uploadMiddleware, lead_Meeting.createMeeting);
router.post('/update/lead',auth, Lead_Update.createLeadUpdate);
router.get('/leads/:leadId/meetings',auth, lead_Meeting.getMeetingsByLeadId);

module.exports = router;




