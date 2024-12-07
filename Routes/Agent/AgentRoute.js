const express = require('express');
const router = express.Router();
const auth = require('../../middleware/check-auth');
const AgentController = require('../../Controller/Agent/AgentController');


router.post('/create/leads', AgentController.createLead);
router.post('/agent/follow-up',AgentController.createFollowUpByAgent);
router.get('/lead/:mobileNo', AgentController.getLeadByMobileNo);
router.put('/leads/:leadId/assign-bdm',auth, AgentController.assignLeadToBDM);
router.get('/leads/agent/:agentId', AgentController.getLeadsByAgentId);
router.get('/leads/agent/:agentId/pending-cold',  AgentController.getColdLeadsByAgentId);
 

module.exports = router;


