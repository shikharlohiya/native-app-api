const express = require('express');
const router = express.Router();
const auth = require('../../middleware/check-auth');
const AgentController = require('../../Controller/Agent/AgentController');
const { sendTestNotification } = require('../../config/firebase');

const verifySession = require("../../middleware/sessionVerify");


router.get('/bdm-followups/details', AgentController.getAgentBdmFollowups);

// Test route for sending notifications
router.post('/test-notification', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'FCM token is required'
            });
        }

        const response = await sendTestNotification(token);

        res.json({
            success: true,
            message: 'Notification sent successfully',
            response
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: error.message
        });
    }
});


router.post('/create/leads', AgentController.createLead);
router.post('/agent/follow-up',AgentController.createFollowUpByAgent);
router.get('/lead/:mobileNo', AgentController.getLeadByMobileNo);
router.put('/leads/:leadId/assign-bdm',auth, AgentController.assignLeadToBDM);
router.get('/leads/agent/:agentId', AgentController.getLeadsByAgentId);
router.post('/group-meeting/create',  AgentController.createGroupMeeting);
// Get group meetings by BDM ID
router.get('/bdm/group-meeting/:bdm_id', AgentController.getGroupMeetingsByBdmId);


router.get('/leads/agent/:agentId/pending-cold',  AgentController.getColdLeadsByAgentId);
router.put('/leads/:id', AgentController.updateLead);
router.put('/leads/pending/:id', AgentController.updatePendingLead);



router.get('/distinct/:field/agent/:agentId', AgentController.getAgentDistinctValues);
router.get('/agent/:agentId/export',AgentController.exportLeadsByAgentId);

 


 
 

  

//incoming parivartan
router.get('/incoming/parivartan/call-analytics',AgentController.getCallAnalytics);

//incoming audit
// router.get('/incoming/audit/call-analytics', AgentController.getAuditCallAnalytics);


//outgoing parivartan/ audit


router.get('/outbound-call-analytics',AgentController.getOutboundCallAnalytics )




//v3
router.get('/v3/lead/:mobileNo',verifySession, AgentController.getLeadByMobileNo);




 
module.exports = router;


