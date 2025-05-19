const express = require('express');
const router = express.Router();
const auth = require('../../middleware/check-auth');
const onCallDiscussion = require('../../Controller/Actions/on_call_discussion');
const verifySession = require("../../middleware/sessionVerify");

router.post('/BDM/on-call-discussion',onCallDiscussion.createOnCallDiscussionByBdm);


router.post('/v3/BDM/on-call-discussion',verifySession,onCallDiscussion.createOnCallDiscussionByBdm);


module.exports = router;