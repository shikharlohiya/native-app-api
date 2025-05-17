const express = require('express');
const router = express.Router();
const customerLeadController = require('../../Controller/Customer/Customer');
const verifySession = require("../../middleware/sessionVerify");


router.post('/customer-lead', customerLeadController.createCustomerLead);
router.post('/vistaar-lead',customerLeadController.createVistaarBroilerDistribution);
router.post('/chicks-inquiry',customerLeadController.createChicksInquiry);
router.get('/customers', customerLeadController.getCustomers);
router.get('/customers/export', customerLeadController.exportCustomers);

router.get('/inquiries/employee/:employeeId', customerLeadController.getEmployeeLeads);


//v3
router.get('/v3/inquiries/employee/:employeeId',verifySession, customerLeadController.getEmployeeLeads);

module.exports = router;