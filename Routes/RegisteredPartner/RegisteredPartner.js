const express = require('express');
const router = express.Router();
const partnerController = require('../../Controller/RegisteredPartner/RegisteredPartner');

// Get partner by mobile number
router.get('/partners/mobile/:mobileNumber',partnerController.getPartnerByMobile);

// Create new travel registration
router.post('/travel-registrations', partnerController.createTravelRegistration);

// Create a new partner
// router.post('/partners', authenticateToken, partnerController.createPartner);

// // Bulk upload partners
router.post('/partners/bulk-upload',  partnerController.bulkUploadPartners);



router.get(
 '/admin/travel-registrations',
 
 partnerController.getAllTravelRegistrations
);

// Get registration statistics (admin only)
router.get(
 '/admin/registration-stats',
 
 partnerController.getRegistrationStats
);

// Get specific registration by ID (admin only)
router.get(
 '/admin/travel-registrations/:id',
 
 partnerController.getRegistrationById
);

// Update accommodation details (admin only)
router.put(
 '/admin/travel-registrations/:id/update-accommodation',
 
 partnerController.updateAccommodation
);

// Update registration status (admin only)
router.put(
 '/admin/travel-registrations/:id/update-status',
 
 partnerController.updateStatus
);

// // Update partner details
// router.put('/partners/mobile/:mobileNumber', authenticateToken, partnerController.updatePartner);

// // Get all partners
// router.get('/partners', authenticateToken, partnerController.getAllPartners);


router.get('/poultryconclave/download', partnerController.downloadRegistrationsExcel);

module.exports = router;