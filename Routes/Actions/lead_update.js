const express = require('express');
const router = express.Router();
const auth = require('../../middleware/check-auth');
 
const Lead_Update = require('../../Controller/Actions/lead_update')



router.post('/update/remark' , auth ,Lead_Update.createLeadUpdate )
router.get('/on-call/list/:leadId' ,auth, Lead_Update.getCallOnDiscussionByLeadId)
router.get('/remark/list/:leadId' ,auth, Lead_Update.getLeadUpdatesByLeadId )
 


module.exports = router;