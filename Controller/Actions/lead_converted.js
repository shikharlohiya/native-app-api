
const { uploadFile } = require('../../Library/awsS3');
const Lead_Document = require('../../models/Lead_converted');
const archiver = require('archiver');
const axios = require('axios');
const Estimation = require('../../models/estimation');
const LeadDetail = require('../../models/lead_detail');
const LeadLog = require('../../models/leads_logs');
const sequelize = require('../../models/index');
const { Op } = require('sequelize');

exports.createLeadDocument = async function(req, res) {
  const t = await sequelize.transaction();

  try {
    const { LeadDetailId, status, payment_amount, remark, employeeId, estimationId } = req.body;
    console.log(LeadDetailId, '-----------');

    if (!LeadDetailId) {
      await t.rollback();
      return res.status(400).json({ error: 'LeadDetailId is required.' });
    }

    // Check if a document with this LeadDetailId already exists
    const existingDocument = await Lead_Document.findOne({ 
      where: { LeadDetailId: LeadDetailId },
      transaction: t
    });
    console.log('Existing document:', existingDocument);

    if (existingDocument) {
      console.log('Existing document found with LeadDetailId:', existingDocument.LeadDetailId);
      await t.rollback();
      return res.status(400).json({ error: 'This lead has already been converted.' });
    }

    // Find the specific estimation to be converted
    const estimation = await Estimation.findOne({
      where: { 
        id: estimationId,
        LeadDetailId: LeadDetailId
      },
      transaction: t
    });

    if (!estimation) {
      await t.rollback();
      return res.status(404).json({ error: 'Associated estimation not found.' });
    }

    // Check if the status is 'Converted'
    if (status !== 'Converted') {
      await t.rollback();
      return res.status(400).json({ error: 'Documents can only be created when status is Converted.' });
    }

    const documentUrls = {};

    // Upload each document to S3 and store the URLs
    const documentFields = [
      'payment_slip',
      'customer_creation_form',
      'pan_card',
      'aadhar_card',
      'land_certificate',
      'gst_certificate',
      'bank_account_details',
      'bank_cheques',
      'legal_agreement_copy',
      'affidavit_property',
      'consent_letter_dispatch',
      'consent_letter_third_party_payment',
      'estimation',
      'final_quotation',
      'annexure',
      'udyam_registration_certificate',
      'gram_panchayat_noc',
    ];

    for (const fieldName of documentFields) {
      if (req.files && req.files[fieldName]) {
        const files = req.files[fieldName];
        const urls = [];

        for (const file of files) {
          const documentResponse = await uploadFile(file, 'lead_documents');
          const documentUrl = `https://ib-paultry-image.s3.ap-south-2.amazonaws.com/${documentResponse.Key}`;
          urls.push(documentUrl);
        }

        documentUrls[fieldName] = urls;
      }
    }

    // Create a new Lead_Document document
    const leadDocument = await Lead_Document.create({
      LeadDetailId: LeadDetailId,
      payment_amount: payment_amount,
      remark: remark,
      ...documentUrls,
    }, { transaction: t });

    // Update the specific estimation status
    await estimation.update({ status: 'Converted' }, { transaction: t });

    // Update the lead_detail status
    await LeadDetail.update(
      { 
        last_action: 'Lead Converted'
      },
      { 
        where: { id: LeadDetailId },
        transaction: t
      }
    );

    // Create a new entry in lead_logs
    await LeadLog.create({
      LeadDetailId: LeadDetailId,
      action_type: 'Lead Converted',
      remarks: remark,
      performed_by: employeeId,
      // Add any other relevant fields for lead_logs
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      message: 'Lead documents created successfully, specific estimation updated to Converted, and lead detail status updated',
      leadDocument: leadDocument,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating lead documents:', error);
    res.status(500).json({ error: 'An error occurred while creating the lead documents.' });
  }
};

exports.getLeadDocumentData = async function(req, res) {
  try {
    const { LeadDetailId, zip } = req.query;

    if (!LeadDetailId) {
      return res.status(400).json({ error: 'LeadDetailId is required' });
    }

    const leadDocument = await Lead_Document.findOne({ where: { LeadDetailId } });

    if (!leadDocument) {
      return res.status(404).json({ error: 'Lead document not found' });
    }

    if (zip === 'true') {
      // Create a zip file
      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level
      });

      // Set the content type and attachment header
      res.attachment('lead_documents.zip');
      archive.pipe(res);

      // Add files to the zip
      for (const [fieldName, urls] of Object.entries(leadDocument.dataValues)) {
        if (Array.isArray(urls)) {
          for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            if (typeof url === 'string' && url.startsWith('http')) {
              const response = await axios.get(url, { responseType: 'arraybuffer' });
              archive.append(response.data, { name: `${fieldName}_${i + 1}.jpg` });
            }
          }
        }
      }

      // Finalize the archive and send the response
      archive.finalize();
    } else {
      // Just return the lead document data
      res.json(leadDocument);
    }
  } catch (error) {
    console.error('Error retrieving lead document data:', error);
    res.status(500).json({ error: 'An error occurred while retrieving the lead document data.' });
  }
};











