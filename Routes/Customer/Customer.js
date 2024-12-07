const express = require('express');
const router = express.Router();
const customerLeadController = require('../../Controller/Customer/Customer');


router.post('/customer-lead', customerLeadController.createCustomerLead);
router.post('/vistaar-lead',customerLeadController.createVistaarBroilerDistribution);
router.post('/chicks-inquiry',customerLeadController.createChicksInquiry);
router.get('/customers', customerLeadController.getCustomers);
router.get('/customers/export', customerLeadController.exportCustomers);
router.get('/inquiries/employee/:employeeId', customerLeadController.getEmployeeLeads);


module.exports = router;