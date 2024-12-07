const express = require('express');
const router = express.Router();
const auth = require('../../middleware/check-auth');
const onCallDiscussion = require('../../Controller/Actions/on_call_discussion');

router.post('/BDM/on-call-discussion',onCallDiscussion.createOnCallDiscussionByBdm);

module.exports = router;