

const express = require('express');
const router = express.Router();
const confirmation = require('../../Controller/Actions/confirmation');
const auth = require('../../middleware/check-auth');

// router.post('/create/estimations', estimationController.createEstimation);


router.get('/leads/:leadId/latest', auth,confirmation.getLatestLeadData);

module.exports = router;