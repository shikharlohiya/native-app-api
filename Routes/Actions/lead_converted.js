const express = require('express');
const multer = require('multer');
const  createLeadDocument  = require('../../Controller/Actions/lead_converted');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadMiddleware = upload.fields([
    { name: 'payment_slip', maxCount: 10 },
  { name: 'customer_creation_form', maxCount: 10 },
  { name: 'pan_card', maxCount: 10 },
  { name: 'aadhar_card', maxCount: 10 },
  { name: 'land_certificate', maxCount: 10 },
  { name: 'gst_certificate', maxCount: 10 },
  { name: 'bank_account_details', maxCount: 10 },
  { name: 'bank_cheques', maxCount: 10 },
  { name: 'legal_agreement_copy', maxCount: 10 },
  { name: 'affidavit_property', maxCount: 10 },
  { name: 'consent_letter_dispatch', maxCount: 10 },
  { name: 'consent_letter_third_party_payment', maxCount: 10 },
  { name: 'estimation', maxCount: 10 },
  { name: 'final_quotation', maxCount: 10 },
  { name: 'annexure', maxCount: 10 },
  { name: 'udyam_registration_certificate', maxCount: 10 },
  { name: 'gram_panchayat_noc', maxCount: 10 },
]);

router.post('/lead-documents', uploadMiddleware, createLeadDocument.createLeadDocument);
router.get('/lead-documents', createLeadDocument.getLeadDocumentData);

module.exports = router;