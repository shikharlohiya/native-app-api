const express = require('express');
const router = express.Router();
const auth = require('../../middleware/check-auth');
const AgentController = require('../../Controller/Agent/AgentController');


router.post('/create/leads', AgentController.createLead);
router.post('/agent/follow-up',AgentController.createFollowUpByAgent);
router.get('/lead/:mobileNo', AgentController.getLeadByMobileNo);
router.put('/leads/:leadId/assign-bdm',auth, AgentController.assignLeadToBDM);
router.get('/leads/agent/:agentId', AgentController.getLeadsByAgentId);
 
//export lead detail

router.get('/distinct/:field/agent/:agentId', AgentController.getAgentDistinctValues);
router.get('/agent/:agentId/export',AgentController.exportLeadsByAgentId);
router.get('/leads/agent/:agentId/pending-cold',  AgentController.getColdLeadsByAgentId);
router.put('/leads/:id', AgentController.updateLead);
router.put('/leads/pending/:id', AgentController.updatePendingLead);


  

//incoming parivartan
router.get('/incoming/parivartan/call-analytics',AgentController.getCallAnalytics);

//incoming audit
// router.get('/incoming/audit/call-analytics', AgentController.getAuditCallAnalytics);


//outgoing parivartan/ audit


// router.get('/outbound-call-analytics',AgentController.getOutboundCallAnalytics )



 
module.exports = router;


