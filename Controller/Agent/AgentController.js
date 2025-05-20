const Lead_Detail = require("../../models/lead_detail");
const Employee = require("../../models/employee");
const Campaign = require("../../models/campaign");
const LeadLog = require("../../models/leads_logs");
const AuditLeadTable = require("../../models/AuditLeadTable");
const LeadDetail  = require("../../models/lead_detail");
const CallLog = require("../../models/CallLog")
const { Op,QueryTypes,Sequelize  } = require("sequelize");
const moment = require("moment");
const FollowUPByAgent = require("../../models/FollowUpByAgent");
const sequelize = require("../../models/index");
const ExcelJS = require('exceljs');
const Employee_Role = require("../../models/employeRole");
const GroupMeeting = require('../../models/GroupMeeting');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const Parivartan_Branch = require('../../models/Parivartan_Branch');
const Parivartan_Region = require('../../models/Parivartan_Region');
const BdmLeadAction = require("../../models/BdmLeadAction");
const BdmTravelDetailForm = require("../../models/BdmTravelDetailForm");
const BdmTravelDetail = require("../../models/BdmTravelDetail");
 


const validateLeadData = (data = {}, call_status) => {
  if (!data) {
      return { general: "No data provided" };
  }

  const errors = {};

  try {
      // Required fields validation
      const requiredFields = {
          InquiryType: "InquiryType is required",
          call_status: "call_status is required",
          call_type: "call_type is required",
          MobileNo: "MobileNo is required",
          category: "category is required",
          sub_category: "sub_category is required",
          source_of_lead_generated: "source_of_lead_generated is required",
          lead_created_by: "lead_created_by is required",
          created_by: "created_by is required"
      };

      // Check required fields
      Object.entries(requiredFields).forEach(([field, message]) => {
          if (!data[field]) {
              errors[field] = message;
          }
      });

      // Additional validations for 'Connected' status only
      if (call_status === 'Connected') {
          const connectedRequiredFields = {
              CustomerName: "CustomerName is required for connected calls",
              state_name: "state_name is required for connected calls",
              region_name: "region_name is required for connected calls",
              pincode: "pincode is required for connected calls",
              RegionId: "RegionId is required for connected calls",
              Project: "Project is required for connected calls",
              lead_owner: "Lead Owner is required for connected calls",
              BDMId : "BDM ID is required for connected calls"
          };

          Object.entries(connectedRequiredFields).forEach(([field, message]) => {
              // if (!data[field]) {
              //     errors[field] = message;
              // }
              if (!data[field] || data[field].toString().trim() === '') {
                errors[field] = message;
                console.log(`Validation failed for ${field}:`, data[field]);
            }
          });
      }

      // Category specific validations
      if (['warm', 'hot', 'pending'].includes(data.category?.toLowerCase()) && !data.follow_up_date) {
          errors.follow_up_date = "follow_up_date is required for warm/hot/pending categories";
      }

      // Role specific validations
      if (data.lead_created_by === 1 && !data.AgentId) {
          errors.AgentId = "AgentId is required when lead is created by agent";
      }
      if ((data.lead_created_by === 2 || data.lead_created_by === 3) && !data.BDMId) {
          errors.BDMId = "BDMId is required when lead is created by BDM/Zonal Manager";
      }

      // Remark validations based on role
      if ((data.lead_created_by === 2 || data.lead_created_by === 3) && !data.bdm_remark) {
          errors.bdm_remark = "bdm_remark is required for BDM/Zonal Manager created leads";
      }
      if (data.lead_created_by === 1 && !data.agent_remark) {
          errors.agent_remark = "agent_remark is required for Agent created leads";
      }

  } catch (error) {
      console.error('Validation error:', error);
      errors.general = "Error during validation";
  }

  return errors;
};

exports.createLead = async (req, res) => {
  const t = await sequelize.transaction();

  try {
      const {
          InquiryType,
          call_status,
          call_type,
          site_location_address,
          Project,
          CustomerName,
          MobileNo,
          AlternateMobileNo,
          WhatsappNo,
          CustomerMailId,
          state_name,
          region_name,
          location,
          category,
          sub_category,
          agent_remark,
          bdm_remark,
          follow_up_date,
          lead_transfer_date,
          lead_owner,
          source_of_lead_generated,
          close_month,
          AgentId,
          BDMId,
          pincode,
          lead_created_by,
          RegionId,
          created_by,
          branchName,
          branchId,
          districtName,
          categoryId,
          subCategoryId
      } = req.body;

    


      const validationErrors = validateLeadData(req.body, call_status);

 
if (Object.keys(validationErrors).length > 0) {
  console.log("Validation errors:", validationErrors); // For debugging
  await t.rollback();
  return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationErrors
  });
}


      // Phone number validation
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(MobileNo)) {
          await t.rollback();
          return res.status(400).json({
              success: false,
              message: "Invalid phone number format"
          });
      }

    
const existingLead = await Lead_Detail.findOne({
  where: { MobileNo },
  include: [{
      model: Employee,
      as: 'Agent',
      attributes: ['EmployeeName']
  }, {
      model: Employee,
      as: 'BDM',
      attributes: ['EmployeeName']
  }],
  transaction: t
});

if (existingLead) {
  let creatorType = '';
  let creatorName = '';

  if (existingLead.lead_created_by === 1) {
      creatorType = 'Agent';
      creatorName = existingLead.Agent?.EmployeeName || 'Unknown Agent';
  } else if (existingLead.lead_created_by === 2) {
      creatorType = 'BDM';
      creatorName = existingLead.BDM?.EmployeeName || 'Unknown BDM';
  } else if (existingLead.lead_created_by === 3) {
      creatorType = 'Zonal Manager';
      creatorName = existingLead.BDM?.EmployeeName || 'Unknown Zonal Manager';
  }

  await t.rollback();
  return res.status(400).json({
      success: false,
      message: `A lead with this phone number already exists. Lead was created by ${creatorType} ${creatorName}`,
      duplicateNumber: MobileNo,
      existingLead: {
          createdBy: creatorType,
          creatorName: creatorName,
          createdAt: existingLead.createdAt
      }
  });
}



      if (existingLead) {
          await t.rollback();
          return res.status(400).json({
              success: false,
              message: "A lead with this phone number already exists",
              duplicateNumber: MobileNo
          });
      }

      

      // Email validation if provided
      if (CustomerMailId) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(CustomerMailId)) {
              await t.rollback();
              return res.status(400).json({
                  success: false,
                  message: "Invalid email format"
              });
          }
      }

      const leadData = {
          InquiryType,
          call_status,
          call_type,
          site_location_address,
          Project,
          CustomerName,
          MobileNo,
          AlternateMobileNo,
          WhatsappNo,
          CustomerMailId,
          state_name,
          region_name,
          location,
          category,
          sub_category,
          agent_remark: lead_created_by === 1 ? agent_remark : null,
          bdm_remark: (lead_created_by === 2 || lead_created_by === 3) ? bdm_remark : null,
          follow_up_date,
          lead_transfer_date,
          lead_owner,
          source_of_lead_generated,
          close_month,
          AgentId: lead_created_by === 1 ? AgentId : null,
          // BDMId: (lead_created_by === 2 || lead_created_by === 3) ? BDMId : null,
          BDMId,
          pincode,
          lead_created_by,
          last_action: lead_created_by === 1 ? "Lead Created by Agent" : 
                      lead_created_by === 2 ? "Lead Created by BDM" : "Lead Created by Zonal Manager",
          RegionId,
          created_by,
            branchName,
          branchId,
          districtName,
          categoryId,
          subCategoryId

      };

      const lead = await Lead_Detail.create(leadData, { transaction: t });


      // Create log entry
      await LeadLog.create({
          LeadDetailId: lead.id,
          action_type: leadData.last_action,
          category,
          sub_category,
          remarks: lead_created_by === 1 ? agent_remark : bdm_remark,
          performed_by: lead_created_by === 1 ? AgentId : BDMId,
          follow_up_date
      }, { transaction: t });



      if (BDMId) {
        try {
          // Get the BDM's details including FCM token
          const bdm = await Employee.findOne({
            where: { EmployeeId: BDMId },
            attributes: ['EmployeeId', 'EmployeeName', 'fcmToken'],
            transaction: t
          });
  
          // Check if BDM exists and has a token
          if (bdm && bdm.fcmToken) {
            // Prepare notification data
            const notificationData = {
                notification: {
                    title: 'New Lead Assigned',
                    body: `New lead from ${CustomerName || 'a customer'} has been assigned to you`
                },
                data: {
                    leadId: String(lead.id), // Convert to string
                    customerName: String(CustomerName || ''),
                    mobileNo: String(MobileNo || ''),
                    category: String(category || ''),
                    projectName: String(Project || ''),
                    source: String(source_of_lead_generated || ''),
                    createdAt: String(new Date().toISOString())
                },
                token: bdm.fcmToken
            };
        
            // Send notification
            try {
                const response = await admin.messaging().send(notificationData);
                console.log('Notification sent successfully to BDM:', BDMId, 'Response:', response);
            } catch (error) {
                // Handle errors as before
                if (error.code === 'messaging/invalid-registration-token' || 
                    error.code === 'messaging/registration-token-not-registered') {
                    await Employee.update({ fcmToken: null }, { where: { EmployeeId: BDMId } });
                    console.log('Invalid FCM token cleared for BDM:', BDMId);
                }
                console.error('Error sending notification to BDM:', BDMId, 'Error:', error);
            }
        }
          
          
        
          
          else {
            console.log('BDM has no FCM token registered:', BDMId);
          }
        } catch (notificationError) {
          // Log error but don't fail the transaction
          console.error('Failed to send notification:', notificationError);
        }
      }  

      await t.commit();

      res.status(201).json({
          success: true,
          message: `Lead created successfully by ${
              lead_created_by === 1 ? "CSE" : 
              lead_created_by === 2 ? "BDM" : "Zonal Manager"
          }`,
          lead
      });

  } catch (error) {
      await t.rollback();
      console.error("Error creating lead:", error);
      
      // Handle specific database errors
      if (error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({
              success: false,
              message: "Duplicate entry found",
              error: error.errors.map(e => e.message)
          });
      }

      if (error.name === 'SequelizeValidationError') {
          return res.status(400).json({
              success: false,
              message: "Validation error",
              error: error.errors.map(e => e.message)
          });
      }

      res.status(500).json({
          success: false,
          message: "Error creating lead",
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
  }
};



const isEmpty = (value) => {
    return value === null || value === undefined || value === '' || value === 'null';
};

const getValue = (field, data, originalData) => {
    const newValue = data[field];
    const originalValue = originalData[field];
    return isEmpty(newValue) ? originalValue : newValue;
};



const validateEditLeadData = (data = {}, originalData = {}) => {
  const errors = {};
  
  try {
      // Get current values
      const currentCategory = (getValue('category', data, originalData) || '').toLowerCase();
      const currentCallStatus = getValue('call_status', data, originalData);
      const currentBDMId = getValue('BDMId', data, originalData);

      // Basic field validations
      if (!isEmpty(data.MobileNo)) {
          const phoneRegex = /^\d{10}$/;
          if (!phoneRegex.test(data.MobileNo)) {
              errors.MobileNo = "Invalid phone number format. Must be 10 digits";
          }
      }

      if (!isEmpty(data.CustomerMailId)) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(data.CustomerMailId)) {
              errors.CustomerMailId = "Invalid email format";
          }
      }

      // BDM validation for hot/warm/connected cases
      if (isEmpty(currentBDMId)) {
          if (['hot', 'warm'].includes(currentCategory)) {
              errors.BDMId = "BDM must be assigned for hot/warm leads";
          } else if (currentCallStatus === 'Connected' && currentCategory !== 'pending') {
              errors.BDMId = "BDM must be assigned for connected calls except pending category";
          }
      }

      // Category specific validations for hot/warm
      if (['hot', 'warm'].includes(currentCategory)) {
          const requiredFields = {
              follow_up_date: "Follow up date is required for hot/warm leads",
              Project: "Project is required for hot/warm leads",
              state_name: "State name is required for hot/warm leads",
              region_name: "Region name is required for hot/warm leads",
              pincode: "Pincode is required for hot/warm leads",
              RegionId: "Region ID is required for hot/warm leads",
              CustomerName: "Customer name is required for hot/warm leads"
          };

          Object.entries(requiredFields).forEach(([field, message]) => {
              const value = getValue(field, data, originalData);
              if (isEmpty(value)) {
                  errors[field] = message;
              }
          });
      }

      if ('AgentId' in data) {
        if (originalData.AgentId && (data.AgentId === null || data.AgentId === undefined || data.AgentId === '')) {
            errors.AgentId = "AgentId cannot be removed or set to empty when it already exists";
        }
    }

      // Follow up date validation for pending category
      if (currentCategory === 'pending') {
          const followUpDate = getValue('follow_up_date', data, originalData);
          if (isEmpty(followUpDate)) {
              errors.follow_up_date = "Follow up date is required for pending category";
          }
      }

      // Connected call status validations
      if (currentCallStatus === 'Connected') {
          // Define required fields based on category
          const connectedRequiredFields = currentCategory === 'pending' ? {
              CustomerName: "Customer name is required for connected calls"
          } : {
              CustomerName: "Customer name is required for connected calls",
              state_name: "State name is required for connected calls",
              region_name: "Region name is required for connected calls",
              pincode: "Pincode is required for connected calls",
              RegionId: "Region ID is required for connected calls",
              Project: "Project is required for connected calls"
          };

          Object.entries(connectedRequiredFields).forEach(([field, message]) => {
              const value = getValue(field, data, originalData);
              if (isEmpty(value)) {
                  errors[field] = message;
              }
          });
      }

      // Role specific validations for remarks
      const agentRemark = getValue('agent_remark', data, originalData);
      const bdmRemark = getValue('bdm_remark', data, originalData);
      const leadCreatedBy = getValue('lead_created_by', data, originalData);

      if (leadCreatedBy === 1 && isEmpty(agentRemark)) {
          errors.agent_remark = "Agent remark cannot be empty for agent updates";
      }
      if ((leadCreatedBy === 2 || leadCreatedBy === 3) && isEmpty(bdmRemark)) {
          errors.bdm_remark = "BDM remark cannot be empty for BDM/Zonal Manager updates";
      }

  } catch (error) {
      console.error('Validation error:', error);
      errors.general = "Error during validation";
  }

  return errors;
};






const getChanges = (oldData, newData) => {
    const changes = [];
    const excludeFields = ['updatedAt', 'createdAt', 'id'];
    
    Object.keys(newData).forEach(field => {
        if (!excludeFields.includes(field) && newData[field] !== oldData[field]) {
            // Format date values for comparison
            const oldValue = oldData[field] instanceof Date ? 
                           oldData[field].toISOString() : 
                           oldData[field];
            const newValue = newData[field] instanceof Date ? 
                           new Date(newData[field]).toISOString() : 
                           newData[field];

            if (oldValue !== newValue) {
                changes.push({
                    field,
                    from: oldValue,
                    to: newValue
                });
            }
        }
    });
    
    return changes;
};




exports.updatePendingLead = async (req, res) => {
  const t = await sequelize.transaction();

  try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Check if updated_by exists and is valid
      if (!updateData.updated_by) {
          await t.rollback();
          return res.status(400).json({
              success: false,
              message: "updated_by field is required"
          });
      }

      // Convert updated_by to number if it's a string
      const performedBy = typeof updateData.updated_by === 'string' ? 
                  parseInt(updateData.updated_by, 10) : 
                      updateData.updated_by;

      // Remove updated_by from updateData
      delete updateData.updated_by;
      delete updateData.MobileNo; // Ensure MobileNo cannot be updated

      // Find existing lead
      const existingLead = await Lead_Detail.findOne({
          where: { id },
          include: [
              {
                  model: Employee,
                  as: 'Agent',
                  attributes: ['EmployeeId', 'EmployeeName']
              },
              {
                  model: Employee,
                  as: 'BDM',
                  attributes: ['EmployeeId', 'EmployeeName']
              }
          ],
          transaction: t
      });

      if (!existingLead) {
          await t.rollback();
          return res.status(404).json({
              success: false,
              message: "Lead not found"
          });
      }

      // Check if lead category is pending
      if (existingLead.category?.toLowerCase() !== 'pending') {
          await t.rollback();
          return res.status(403).json({
              success: false,
              message: "Only leads with 'pending' category can be edited",
              currentCategory: existingLead.category
          });
      }

      // Validate update data
      const validationErrors = validateEditLeadData(updateData, existingLead);
      if (Object.keys(validationErrors).length > 0) {
          await t.rollback();
          return res.status(400).json({
              success: false,
              message: "Validation failed",
              errors: validationErrors
          });
      }

      // Check for duplicate phone number
      if (updateData.MobileNo && updateData.MobileNo !== existingLead.MobileNo) {
          const duplicateLead = await Lead_Detail.findOne({
              where: { 
                  MobileNo: updateData.MobileNo,
                  id: { [Sequelize.Op.ne]: id }
              },
              include: [{
                  model: Employee,
                  as: 'Agent',
                  attributes: ['EmployeeName']
              }, {
                  model: Employee,
                  as: 'BDM',
                  attributes: ['EmployeeName']
              }],
              transaction: t
          });

          if (duplicateLead) {
              let creatorType = duplicateLead.lead_created_by === 1 ? 'Agent' : 
                              duplicateLead.lead_created_by === 2 ? 'BDM' : 'Zonal Manager';
              let creatorName = duplicateLead.lead_created_by === 1 ? 
                              duplicateLead.Agent?.EmployeeName : 
                              duplicateLead.BDM?.EmployeeName || 'Unknown';

              await t.rollback();
              return res.status(400).json({
                  success: false,
                  message: `A lead with this phone number already exists. Lead was created by ${creatorType} ${creatorName}`,
                  duplicateNumber: updateData.MobileNo
              });
          }
      }

      // Track changes
      const changes = getChanges(existingLead.toJSON(), updateData);
      if (changes.length === 0) {
          await t.rollback();
          return res.status(200).json({
              success: true,
              message: "No changes detected",
              lead: existingLead
          });
      }

      // Update lead
      const updatedLead = await existingLead.update(updateData, { transaction: t });

      // Create log entry
      const changeDetails = {
          timestamp: new Date().toISOString(),
          updater: {
              id: performedBy
          },
          changes: changes
      };

      await LeadLog.create({
          LeadDetailId: id,
          action_type: updateData.action_type, // Specific action type for pending lead updates
          category: updateData.category || existingLead.category,
          sub_category: updateData.sub_category || existingLead.sub_category,
          remarks: updateData.remarks ||  updateData.action_type,
          performed_by: performedBy,
          follow_up_date: updateData.follow_up_date || existingLead.follow_up_date,
          extra_fields3: JSON.stringify(changeDetails)
      }, { transaction: t });

      await t.commit();

      // Fetch updated lead with associations
      const finalLead = await Lead_Detail.findOne({
          where: { id },
          include: [
              {
                  model: Employee,
                  as: 'Agent',
                  attributes: ['EmployeeId', 'EmployeeName']
              },
              {
                  model: Employee,
                  as: 'BDM',
                  attributes: ['EmployeeId', 'EmployeeName']
              }
          ]
      });

      return res.status(200).json({
          success: true,
          message: "Pending lead updated successfully",
          lead: finalLead,
          changes: changes
      });

  } catch (error) {
      await t.rollback();
      console.error("Error updating pending lead:", error);

      if (error.name === 'SequelizeValidationError') {
          return res.status(400).json({
              success: false,
              message: "Validation error",
              errors: error.errors.map(e => e.message)
          });
      }

      return res.status(500).json({
          success: false,
          message: "Error updating pending lead",
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
  }
};







// Update Lead Controller
exports.updateLead = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Check if updated_by exists and is valid
        if (!updateData.updated_by) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "updated_by field is required"
            });
        }

        // Convert updated_by to number if it's a string
        const performedBy = typeof updateData.updated_by === 'string' ? 
                        parseInt(updateData.updated_by, 10) : 
                        updateData.updated_by;

        // Remove updated_by from updateData
        delete updateData.updated_by;

        // Find existing lead
        const existingLead = await Lead_Detail.findOne({
            where: { id },
            include: [
                {
                    model: Employee,
                    as: 'Agent',
                    attributes: ['EmployeeId', 'EmployeeName']
                },
                {
                    model: Employee,
                    as: 'BDM',
                    attributes: ['EmployeeId', 'EmployeeName']
                }
            ],
            transaction: t
        });

        if (!existingLead) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        // Validate update data
        const validationErrors = validateEditLeadData(updateData, existingLead);
        if (Object.keys(validationErrors).length > 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }

        // Check for duplicate phone number
        if (updateData.MobileNo && updateData.MobileNo !== existingLead.MobileNo) {
            const duplicateLead = await Lead_Detail.findOne({
                where: { 
                    MobileNo: updateData.MobileNo,
                    id: { [Sequelize.Op.ne]: id }
                },
                include: [{
                    model: Employee,
                    as: 'Agent',
                    attributes: ['EmployeeName']
                }, {
                    model: Employee,
                    as: 'BDM',
                    attributes: ['EmployeeName']
                }],
                transaction: t
            });

            if (duplicateLead) {
                let creatorType = duplicateLead.lead_created_by === 1 ? 'Agent' : 
                                duplicateLead.lead_created_by === 2 ? 'BDM' : 'Zonal Manager';
                let creatorName = duplicateLead.lead_created_by === 1 ? 
                                duplicateLead.Agent?.EmployeeName : 
                                duplicateLead.BDM?.EmployeeName || 'Unknown';

                await t.rollback();
                return res.status(400).json({
                    success: false,
                    message: `A lead with this phone number already exists. Lead was created by ${creatorType} ${creatorName}`,
                    duplicateNumber: updateData.MobileNo
                });
            }
        }

        // Track changes
        const changes = getChanges(existingLead.toJSON(), updateData);
        if (changes.length === 0) {
            await t.rollback();
            return res.status(200).json({
                success: true,
                message: "No changes detected",
                lead: existingLead
            });
        }

        // Update lead
        const updatedLead = await existingLead.update(updateData, { transaction: t });

        // Create log entry
        const changeDetails = {
            timestamp: new Date().toISOString(),
            updater: {
                id: performedBy
            },
            changes: changes
        };

        await LeadLog.create({
            LeadDetailId: id,
            action_type: updateData.action_type, // Fixed action type for all updates
            category: updateData.category || existingLead.category,
            sub_category: updateData.sub_category || existingLead.sub_category,
            remarks: updateData.remarks || updateData.action_type,
            performed_by: performedBy,
            follow_up_date: updateData.follow_up_date || existingLead.follow_up_date,
            extra_fields3: JSON.stringify(changeDetails)
        }, { transaction: t });

        await t.commit();

        // Fetch updated lead with associations
        const finalLead = await Lead_Detail.findOne({
            where: { id },
            include: [
                {
                    model: Employee,
                    as: 'Agent',
                    attributes: ['EmployeeId', 'EmployeeName']
                },
                {
                    model: Employee,
                    as: 'BDM',
                    attributes: ['EmployeeId', 'EmployeeName']
                }
            ]
        });

        return res.status(200).json({
            success: true,
            message: "Lead updated successfully",
            lead: finalLead,
            changes: changes
        });

    } catch (error) {
        await t.rollback();
        console.error("Error updating lead:", error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.errors.map(e => e.message)
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error updating lead",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};






// exports.getLeadByMobileNo = async (req, res) => {
//   try {
//       const { mobileNo } = req.params;

//       const lead = await Lead_Detail.findOne({
//           where: {
//               [Op.or]: [
//                   { MobileNo: mobileNo },
//                   { AlternateMobileNo: mobileNo },
//                   { WhatsappNo: mobileNo },
//               ],
//           },
//           include: [{
//               model: Employee,
//               as: 'Agent',
//               attributes: ['EmployeeName']
//           }, {
//               model: Employee,
//               as: 'BDM',
//               attributes: ['EmployeeName']
//           }]
//       });

//       if (!lead) {
//           return res.status(200).json({ 
//               success: false,
//               message: "Lead not found for the given mobile number" 
//           });
//       }

//       let responseMessage = "Lead already exists";

//       // If created_by is empty, show follow-up info
//       if (!lead.created_by) {
//           const followerName = lead.Agent?.EmployeeName || lead.BDM?.EmployeeName || 'Unknown';
//           const followerType = lead.Agent ? 'Agent' : lead.BDM ? 'BDM' : 'Unknown';
//           responseMessage = `Lead already exists, and is being followed up by ${followerName}`;
//       } else {
//           // If created_by exists, show creator info
//           let creatorType = '';
//           let creatorName = '';

//           if (lead.lead_created_by === 1) {
//               creatorType = 'Agent';
//               creatorName = lead.Agent?.EmployeeName || 'Unknown Agent';
//           } else if (lead.lead_created_by === 2) {
//               creatorType = 'BDM';
//               creatorName = lead.BDM?.EmployeeName || 'Unknown BDM';
//           } else if (lead.lead_created_by === 3) {
//               creatorType = 'Zonal Manager';
//               creatorName = lead.BDM?.EmployeeName || 'Unknown Zonal Manager';
//           }

//           responseMessage = `Lead already exists. Lead was created by ${creatorType} ${creatorName}`;
//       }

//       res.status(200).json({
//           success: true,
//           message: responseMessage,
//           lead: {
//               ...lead.toJSON(),
//               lastFollowUpDate: lead.follow_up_date,
//               lastFollowUpBy: lead.Agent?.EmployeeName || lead.BDM?.EmployeeName || 'Unknown'
//           }
//       });

//   } catch (error) {
//       console.error("Error fetching lead:", error);
//       res.status(500).json({
//           success: false,
//           message: "Error fetching lead details",
//           error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//       });
//   }
// };



exports.getLeadByMobileNo = async (req, res) => {
  try {
    const { mobileNo } = req.params;

    // Find lead by mobile number
    const lead = await Lead_Detail.findOne({
      where: {
        [Op.or]: [
          { MobileNo: mobileNo },
          { AlternateMobileNo: mobileNo },
          { WhatsappNo: mobileNo },
        ],
      },
      include: [
        {
          model: Employee,
          as: 'Agent',
          attributes: ['EmployeeName']
        }, 
        {
          model: Employee,
          as: 'BDM',
          attributes: ['EmployeeName']
        },
        {
          model: Parivartan_Region,
          as: 'Region',
          attributes: ['RegionId', 'RegionName']
        }
      ]
    });

    if (!lead) {
      return res.status(200).json({
        success: false,
        message: "Lead not found for the given mobile number"
      });
    }

    let responseMessage = "Lead already exists";

    // If created_by is empty, show follow-up info
    if (!lead.created_by) {
      const followerName = lead.Agent?.EmployeeName || lead.BDM?.EmployeeName || 'Unknown';
      const followerType = lead.Agent ? 'Agent' : lead.BDM ? 'BDM' : 'Unknown';
      responseMessage = `Lead already exists, and is being followed up by ${followerName}`;
    } else {
      // If created_by exists, show creator info
      let creatorType = '';
      let creatorName = '';

      if (lead.lead_created_by === 1) {
        creatorType = 'Agent';
        creatorName = lead.Agent?.EmployeeName || 'Unknown Agent';
      } else if (lead.lead_created_by === 2) {
        creatorType = 'BDM';
        creatorName = lead.BDM?.EmployeeName || 'Unknown BDM';
      } else if (lead.lead_created_by === 3) {
        creatorType = 'Zonal Manager';
        creatorName = lead.BDM?.EmployeeName || 'Unknown Zonal Manager';
      }

      responseMessage = `Lead already exists. Lead was created by ${creatorType} ${creatorName}`;
    }

    // Get branch and RO information based on RegionId from the lead
    let branchInfo = [];
    let uniqueROs = [];
    let branchesByRO = {};

    if (lead.RegionId) {
      branchInfo = await Parivartan_Branch.findAll({
        where: {
          RegionId: lead.RegionId,
          Deleted: 'N'
        },
        attributes: ['BranchCode', 'Branch', 'Zone', 'RO'],
        raw: true
      });

      // Process branches to group by RO and extract unique RO names
      branchInfo.forEach(branch => {
        if (branch.RO) {
          if (!branchesByRO[branch.RO]) {
            branchesByRO[branch.RO] = [];
          }
          branchesByRO[branch.RO].push(branch);
        }
      });

      uniqueROs = Object.keys(branchesByRO);
    }

    // Prepare response with lead, branch and RO information
    res.status(200).json({
      success: true,
      message: responseMessage,
      lead: {
        ...lead.toJSON(),
        lastFollowUpDate: lead.follow_up_date,
        lastFollowUpBy: lead.Agent?.EmployeeName || lead.BDM?.EmployeeName || 'Unknown',
        regionName: lead.Region?.RegionName || lead.region_name || 'Unknown Region',
        regionId: lead.RegionId
      },
      branchInfo: {
        totalBranches: branchInfo.length,
        regionalOffices: uniqueROs,
        branchesByRO: branchesByRO,
        allBranches: branchInfo
      }
    });

  } catch (error) {
    console.error("Error fetching lead:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching lead details",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};



//assign lead to bdm --for future
exports.assignLeadToBDM = async (req, res) => {
  try { 
    const { leadId } = req.params;
    const { BDMId } = req.body;

    const lead = await Lead_Detail.findByPk(leadId);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    lead.BDMId = BDMId;
    await lead.save();

    res
      .status(200)
      .json({ message: "Lead assigned to BDM successfully", lead });
  } catch (error) {
    console.error("Error assigning lead to BDM:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



exports.getLeadsByAgentId = async (req, res) => {
  try {
    const { agentId } = req.params;

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // First, find the employee and their assigned campaigns
    const employee = await Employee.findOne({
      where: { EmployeeId: agentId },
      include: [
        {
          model: Campaign,
          through: { attributes: [] },
          attributes: ["CampaignId"],
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const assignedCampaignIds = employee.Campaigns.map(
      (campaign) => campaign.CampaignId
    );

    // Get base stats (unaffected by filters)
    const stats = await getAgentCategoryCounts(agentId, assignedCampaignIds);

    // Build the where clause starting with required agent and campaign filters
    let whereClause = {
      AgentId: agentId,
      source_of_lead_generated: {
        [Op.in]: assignedCampaignIds,
      },
    };

    // Build include conditions
    const includeConditions = [
      { model: Employee, as: "Agent" },
      { model: Employee, as: "BDM" },
      { model: Employee, as: "Superviser" },
      {
        model: Campaign,
        as: "Campaign",
        attributes: ["CampaignId", "CampaignName"],
      },
    ];

    // First apply all filters
    if (req.query.InquiryType) {
      whereClause.InquiryType = {
        [Op.in]: req.query.InquiryType.split(',').map(v => v.trim())
      };
    }

    if (req.query.Project) {
      whereClause.Project = {
        [Op.in]: req.query.Project.split(',').map(v => v.trim())
      };
    }

    if (req.query.region) {
      whereClause.region_name = {
        [Op.in]: req.query.region.split(',').map(v => v.trim())
      };
    }

    if (req.query.category) {
      whereClause.category = {
        [Op.in]: req.query.category.split(',').map(v => v.trim())
      };
    }

    if (req.query.subcategory) {
      whereClause.sub_category = {
        [Op.in]: req.query.subcategory.split(',').map(v => v.trim())
      };
    }

    if (req.query.BdmID) {
      whereClause.BDMId = {
        [Op.in]: req.query.BdmID.split(',').map(v => v.trim())
      };
    }

    // Campaign name filter
    if (req.query.campaignName) {
      includeConditions.find(inc => inc.as === "Campaign").where = {
        CampaignName: {
          [Op.in]: req.query.campaignName.split(',').map(v => v.trim())
        }
      };
    }

    if (req.query.updatedDate) {
      const date = new Date(req.query.updatedDate);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      whereClause.updatedAt = {
        [Op.gte]: date,
        [Op.lt]: nextDay
      };
    }
    if (req.query.followUpDate) {
      const date = new Date(req.query.followUpDate);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      whereClause.follow_up_date = {
        [Op.gte]: date,
        [Op.lt]: nextDay
      };
    }


    // Then apply search if exists
    if (req.query.search) {
      const searchConditions = [
        { InquiryType: { [Op.like]: `%${req.query.search}%` } },
        { Project: { [Op.like]: `%${req.query.search}%` } },
        { CustomerName: { [Op.like]: `%${req.query.search}%` } },
        { MobileNo: { [Op.like]: `%${req.query.search}%` } },
        { region_name: { [Op.like]: `%${req.query.search}%` } },
        { category: { [Op.like]: `%${req.query.search}%` } },
        { close_month: { [Op.like]: `%${req.query.search}%` } },
        { '$Campaign.CampaignName$': { [Op.like]: `%${req.query.search}%` } },
        { '$BDM.EmployeeName$': { [Op.like]: `%${req.query.search}%` } },
      ];

      whereClause = {
        [Op.and]: [
          whereClause,  // Keep all existing filters
          { [Op.or]: searchConditions }  // Add search within filtered data
        ]
      };
    }

    // Sorting
    // const order = req.query.sort
    //   ? [[req.query.sort, "ASC"]]
    //   : [["createdAt", "DESC"]];

    const order = [["updatedAt", "DESC"]];
    // Get total count for pagination
    const totalCount = await Lead_Detail.count({
      where: whereClause,
      include: includeConditions,
      distinct: true
    });

    // Get the leads
    const leads = await Lead_Detail.findAll({
      where: whereClause,
      include: includeConditions,
      order,
      limit,
      offset,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      leads,
      currentPage: page,
      totalPages,
      totalLeads: totalCount,
      stats
    });

  } catch (error) {
    console.error("Error retrieving leads:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAgentCategoryCounts = async (agentId, assignedCampaignIds) => {
  const categories = ['hot', 'warm', 'cold', 'pending', 'closed'];
  const counts = await Promise.all(
    categories.map(category =>
      Lead_Detail.count({
        where: {
          AgentId: agentId,
          source_of_lead_generated: { [Op.in]: assignedCampaignIds },
          category
        }
      })
    )
  );

  return {
    hot: counts[0],
    warm: counts[1],
    cold: counts[2],
    pending: counts[3],
    closed: counts[4],
    total: counts.reduce((a, b) => a + b, 0)
  };
};


 


exports.exportLeadsByAgentId = async (req, res) => {
  try {
    const { agentId } = req.params;

    // First, find the employee and their assigned campaigns
    const employee = await Employee.findOne({
      where: { EmployeeId: agentId },
      include: [
        {
          model: Campaign,
          through: { attributes: [] },
          attributes: ["CampaignId"],
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const assignedCampaignIds = employee.Campaigns.map(
      (campaign) => campaign.CampaignId
    );

    // Build the where clause for filtered results
    let whereClause = {
      AgentId: agentId,
      source_of_lead_generated: {
        [Op.in]: assignedCampaignIds,
      },
    };

    // Common search functionality
    if (req.query.search) {
      const searchConditions = [
        { InquiryType: { [Op.like]: `%${req.query.search}%` } },
        { Project: { [Op.like]: `%${req.query.search}%` } },
        { CustomerName: { [Op.like]: `%${req.query.search}%` } },
        { MobileNo: { [Op.like]: `%${req.query.search}%` } },
        { region_name: { [Op.like]: `%${req.query.search}%` } },
        { category: { [Op.like]: `%${req.query.search}%` } },
        { close_month: { [Op.like]: `%${req.query.search}%` } },
        { '$Campaign.CampaignName$': { [Op.like]: `%${req.query.search}%` } },
        { '$BDM.EmployeeName$': { [Op.like]: `%${req.query.search}%` } },
      ];

      whereClause = {
        ...whereClause,
        [Op.and]: [
          whereClause,
          { [Op.or]: searchConditions }
        ]
      };
    } else {
      // Apply individual filters
      if (req.query.InquiryType) {
        whereClause.InquiryType = {
          [Op.in]: req.query.InquiryType.split(',').map(v => v.trim())
        };
      }

      if (req.query.Project) {
        whereClause.Project = {
          [Op.in]: req.query.Project.split(',').map(v => v.trim())
        };
      }

      if (req.query.region) {
        whereClause.region_name = {
          [Op.in]: req.query.region.split(',').map(v => v.trim())
        };
      }

      if (req.query.category) {
        whereClause.category = {
          [Op.in]: req.query.category.split(',').map(v => v.trim())
        };
      }

      if (req.query.subcategory) {
        whereClause.sub_category = {
          [Op.in]: req.query.subcategory.split(',').map(v => v.trim())
        };
      }
      if (req.query.updatedDate) {
        const date = new Date(req.query.updatedDate);
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);
        
        whereClause.updatedAt = {
          [Op.gte]: date,
          [Op.lt]: nextDay
        };
      }
      if (req.query.followUpDate) {
        const date = new Date(req.query.followUpDate);
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);
        
        whereClause.follow_up_date = {
          [Op.gte]: date,
          [Op.lt]: nextDay
        };
      }
  


    }

    // Build include conditions
    const includeConditions = [
      { model: Employee, as: "Agent" },
      { model: Employee, as: "BDM" },
      { model: Employee, as: "Superviser" },
      {
        model: Campaign,
        as: "Campaign",
        attributes: ["CampaignId", "CampaignName"],
      },
    ];

    // Campaign name filter
    if (req.query.campaignName) {
      includeConditions.find(inc => inc.as === "Campaign").where = {
        CampaignName: {
          [Op.in]: req.query.campaignName.split(',').map(v => v.trim())
        }
      };
    }

    // BDM filter
    if (req.query.BdmID) {
      whereClause.BDMId = {
        [Op.in]: req.query.BdmID.split(',').map(v => v.trim())
      };
    }

    // Get all filtered leads without pagination
    const leads = await Lead_Detail.findAll({
      where: whereClause,
      include: includeConditions,
      order: [["createdAt", "DESC"]],
    });

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');

    // Define columns
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Inquiry Type', key: 'inquiryType', width: 15 },
      { header: 'Project', key: 'project', width: 15 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Mobile No', key: 'mobileNo', width: 15 },
      { header: 'Alternate Mobile', key: 'alternateMobile', width: 15 },
      { header: 'WhatsApp No', key: 'whatsappNo', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Region', key: 'region', width: 15 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Site Location', key: 'siteLocation', width: 20 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Sub Category', key: 'subCategory', width: 15 },
      { header: 'Campaign', key: 'campaign', width: 20 },
      { header: 'BDM', key: 'bdm', width: 20 },
      { header: 'Agent', key: 'agent', width: 20 },
      { header: 'Supervisor', key: 'supervisor', width: 20 },
      { header: 'Agent Remark', key: 'agentRemark', width: 30 },
      { header: 'BDM Remark', key: 'bdmRemark', width: 30 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    // Add data to worksheet
    leads.forEach(lead => {
      worksheet.addRow({
        date: moment(lead.createdAt).format('YYYY-MM-DD'),
        inquiryType: lead.InquiryType,
        project: lead.Project,
        customerName: lead.CustomerName,
        mobileNo: lead.MobileNo,
        alternateMobile: lead.AlternateMobileNo,
        whatsappNo: lead.WhatsappNo,
        email: lead.CustomerMailId,
        region: lead.region_name,
        location: lead.location,
        siteLocation: lead.site_location_address,
        category: lead.category,
        subCategory: lead.sub_category,
        campaign: lead.Campaign?.CampaignName,
        bdm: lead.BDM?.EmployeeName,
        agent: lead.Agent?.EmployeeName,
        supervisor: lead.Superviser?.EmployeeName,
        agentRemark: lead.agent_remark,
        bdmRemark: lead.bdm_remark,
      });
    });

    // Auto-filter all columns
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length }
    };

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Leads_Export_${moment().format('YYYY-MM-DD')}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);

  } catch (error) {
    console.error("Error exporting leads:", error);
    res.status(500).json({ message: "An error occurred while exporting leads" });
  }
};


exports.getAgentDistinctValues = async (req, res) => {
  const field = req.params.field;
  const agentId = req.params.agentId;

  try {
    let values;

    // First get the agent's assigned campaigns
    const employee = await Employee.findOne({
      where: { EmployeeId: agentId },
      include: [
        {
          model: Campaign,
          through: { attributes: [] },
          attributes: ["CampaignId"],
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const assignedCampaignIds = employee.Campaigns.map(
      (campaign) => campaign.CampaignId
    );

    // Base where clause for agent's leads
    const baseWhereClause = {
      AgentId: agentId,
      source_of_lead_generated: {
        [Op.in]: assignedCampaignIds,
      }
    };

    switch (field) {
      case 'InquiryType':
      case 'Project':
      case 'region_name':
      case 'category':
      case 'sub_category':
        values = await Lead_Detail.findAll({
          attributes: [[Sequelize.fn('DISTINCT', Sequelize.col(field)), field]],
          where: {
            ...baseWhereClause,
            [field]: {
              [Op.ne]: null,
              [Op.ne]: ''
            }
          },
          order: [[field, 'ASC']]
        });
        break;

      case 'campaignName':
        // Only return campaigns that the agent has worked with
        values = await Campaign.findAll({
          attributes: ['CampaignId', 'CampaignName'],
          where: {
            CampaignId: {
              [Op.in]: assignedCampaignIds
            }
          },
          order: [['CampaignName', 'ASC']]
        });
        break;

      case 'bdmName':
        // Only return BDMs that have worked with this agent
        values = await Employee.findAll({
          attributes: ['EmployeeId', 'EmployeeName'],
          where: {
            '$role.RoleId$': 2, // 2 is the RoleId for Business Development Manager
            EmployeeId: {
              [Op.in]: Sequelize.literal(`(
                SELECT DISTINCT BDMId 
                FROM lead_detail 
                WHERE AgentId = '${agentId}'
                AND source_of_lead_generated IN (${assignedCampaignIds.length ? assignedCampaignIds.join(',') : 'NULL'})
                AND BDMId IS NOT NULL
              )`)
            }
          },
          include: [{
            model: Employee_Role,
            as: 'role',
            attributes: []
          }],
          order: [['EmployeeName', 'ASC']]
        });
        break;

      case 'agentName':
        // Return only this agent's details
        values = await Employee.findAll({
          attributes: ['EmployeeId', 'EmployeeName'],
          where: {
            EmployeeId: agentId,
            '$role.RoleId$': 1 // 1 is the RoleId for Agent
          },
          include: [{
            model: Employee_Role,
            as: 'role',
            attributes: []
          }],
          order: [['EmployeeName', 'ASC']]
        });
        break;

      default:
        return res.status(400).json({ 
          message: `Invalid field specified: ${field}. Valid fields are: InquiryType, Project, region_name, category, sub_category, campaignName, bdmName, agentName` 
        });
    }

    // Format the response based on the field type
    let formattedValues;
    switch (field) {
      case 'campaignName':
        formattedValues = values.map(campaign => ({
          value: campaign.CampaignId,
          CampaignName: campaign.CampaignName
        }));
        break;
      
      case 'bdmName':
        formattedValues = values
          .map(employee => ({
            value: employee.EmployeeId,
            EmployeeName: employee.EmployeeName,
            EmployeeId: employee.EmployeeId
          }))
          .filter(item => item.value && item.EmployeeName);
        break;
      
      case 'agentName':
        formattedValues = values
          .map(employee => ({
            value: employee.EmployeeId,
            AgentName: employee.EmployeeName
          }))
          .filter(item => item.value && item.AgentName);
        break;
      
      case 'InquiryType':
        formattedValues = values
          .map(item => ({
            value: item[field],
            InquiryType: item[field]
          }))
          .filter(item => item.value && item.InquiryType);
        break;
      
      case 'Project':
        formattedValues = values
          .map(item => ({
            value: item[field],
            Project: item[field]
          }))
          .filter(item => item.value && item.Project);
        break;
      
      case 'region_name':
        formattedValues = values
          .map(item => ({
            value: item[field],
            region_name: item[field]
          }))
          .filter(item => item.value && item.region_name);
        break;
      
      case 'category':
        formattedValues = values
          .map(item => ({
            value: item[field],
            category: item[field]
          }))
          .filter(item => item.value && item.category);
        break;
      
      case 'sub_category':
        formattedValues = values
          .map(item => ({
            value: item[field],
            sub_category: item[field]
          }))
          .filter(item => item.value && item.sub_category);
        break;
    }

    res.json(formattedValues);
  } catch (error) {
    console.error(`Error fetching distinct values for field '${field}' and agent '${agentId}':`, error);
    res.status(500).json({ 
      message: `An error occurred while fetching ${field} values for agent ${agentId}`,
      error: error.message 
    });
  }
};



//Get cold lead by agent Id
exports.getColdLeadsByAgentId = async (req, res) => {
  try {
    const { agentId } = req.params;

    const employee = await Employee.findOne({
      where: { EmployeeId: agentId },
    });

    if (!employee) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const leads = await Lead_Detail.findAll({
      where: {
        AgentId: agentId,
        category: {
          [Op.or]: ["cold", "pending", "closed"],
        },
      },
      include: [
        { model: Employee, as: "Agent" },
        { model: Employee, as: "BDM" },
        { model: Employee, as: "Superviser" },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ leads });
  } catch (error) {
    console.error("Error retrieving cold leads:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createFollowUpByAgent = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const {
      LeadDetailId,
      AgentId,
      follow_up_date,
      category,
      sub_category,
      remark,
      closure_month,
    } = req.body;

    // Parse the IDs to integers
    const leadDetailId = parseInt(LeadDetailId, 10);
    const agentId = parseInt(AgentId, 10);

    // Check if the IDs are valid numbers
    if (isNaN(leadDetailId) || isNaN(agentId)) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid LeadDetailId or AgentId" });
    }

    const leadDetail = await Lead_Detail.findByPk(leadDetailId, {
      transaction: t,
    });
    const agent = await Employee.findByPk(agentId, { transaction: t });

    if (!leadDetail) {
      await t.rollback();
      return res.status(400).json({ error: "Lead is not found" });
    }
    if (!agent) {
      await t.rollback();
      return res.status(400).json({ error: "Agent is not found" });
    }

    // Create the follow-up
    const followUp = await FollowUPByAgent.create(
      {
        follow_up_date,
        category,
        sub_category,
        remark,
        LeadDetailId: leadDetailId,
        AgentId: agentId,
        closure_month,
      },
      { transaction: t }
    );

    // Update the Lead_Detail
    await leadDetail.update(
      {
        follow_up_date,
        category,
        sub_category,
        agent_remark: remark,
        // AgentId: agentId,
        last_action: "Follow-up by Agent",

        close_month: closure_month,
      },
      { transaction: t }
    );

    // Create a log entry
    await LeadLog.create(
      {
        action_type: "Follow-up by Agent",
        category,
        sub_category,
        remarks: remark,
        performed_by: agentId,
        LeadDetailId: leadDetailId,
        follow_up_date,
      },
      { transaction: t }
    );

    // If we reach here, no errors were thrown, so we commit the transaction
    await t.commit();

    res.status(201).json({
      message: "Follow up data has been successfully saved",
      followUp,
      updatedLeadDetail: leadDetail,
    });
  } catch (error) {
    // If we catch any error, we rollback the transaction
    await t.rollback();
    console.error("Error in createFollowUpByAgent:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};


 

exports.getCallAnalytics = async (req, res) => {
  try {
      const startDate = req.query.startDate;
      const endDate = req.query.endDate || startDate;
      const agentName = req.query.agentName;

      if (!startDate || !moment(startDate).isValid()) {
          return res.status(400).json({
              success: false,
              message: "Valid start date required"
          });
      }

      let query = `
          SELECT 
              emp.EmployeeName as agent_name,
              ic.id,
              ic.call_id,
              ic.caller_number,
              ic.agent_number,
              ic.connected_at,
              ic.ended_at,
              ic.created_at,
              ld.CustomerName as lead_name,
              ld.location as lead_location,
              CASE 
                  WHEN ic.connected_at IS NULL THEN 'Missed'
                  WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL THEN 'Connected'
                  ELSE 'Unknown'
              END as call_status,
              CASE 
                  WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
                  THEN TIMESTAMPDIFF(SECOND, ic.connected_at, ic.ended_at)
                  ELSE 0
              END as call_duration_seconds
          FROM incoming_calls ic
          LEFT JOIN lead_detail ld ON ic.caller_number = ld.MobileNo
          LEFT JOIN employee_table emp ON ic.agent_number = emp.EmployeePhone
          WHERE ic.ivr_number = '7610255555'
          AND DATE(ic.created_at) BETWEEN :startDate AND :endDate
          ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
          ORDER BY ic.created_at DESC
      `;

      const replacements = { 
          startDate: moment(startDate).format('YYYY-MM-DD'),
          endDate: moment(endDate).format('YYYY-MM-DD'),
          ...(agentName && { agentName })
      };

      const callDetails = await sequelize.query(query, {
          replacements,
          type: QueryTypes.SELECT
      });

      const agentMap = new Map();
      let totalCalls = 0;
      let totalConnected = 0;
      let totalMissed = 0;
      let uniqueLeads = new Set();
      let totalTalkTimeSeconds = 0;

      callDetails.forEach(call => {
          if (!call.agent_name) return;

          totalCalls++;
          if (call.lead_name) uniqueLeads.add(call.lead_name);
          
          const isConnected = call.connected_at && call.ended_at;
          if (isConnected) {
              totalConnected++;
              totalTalkTimeSeconds += call.call_duration_seconds;
          } else {
              totalMissed++;
          }

          if (!agentMap.has(call.agent_name)) {
              agentMap.set(call.agent_name, {
                  agent_name: call.agent_name,
                  agent_number: call.agent_number,
                  total_calls: 0,
                  missed_calls: 0,
                  connected_calls: 0,
                  total_duration_minutes: 0,
                  total_duration_seconds: 0,
                  connected_details: [],
                  missed_details: []
              });
          }

          const agentData = agentMap.get(call.agent_name);
          agentData.total_calls++;

          const callDetail = {
              call_id: call.call_id,
              date: moment(call.created_at).format('YYYY-MM-DD'),
              time: moment(call.created_at).format('HH:mm:ss'),
              caller_number: call.caller_number,
              duration_minutes: (call.call_duration_seconds / 60).toFixed(2)
          };

          const customerDetail = call.lead_name ? {
              customer_name: call.lead_name,
              location: call.lead_location
          } : null;

          if (isConnected) {
              agentData.connected_calls++;
              agentData.total_duration_seconds += call.call_duration_seconds;
              agentData.total_duration_minutes += call.call_duration_seconds / 60;
              callDetail.connected_at = moment(call.connected_at).format('YYYY-MM-DD HH:mm:ss');
              callDetail.ended_at = moment(call.ended_at).format('YYYY-MM-DD HH:mm:ss');
              agentData.connected_details.push({
                  ...callDetail,
                  customer_details: customerDetail
              });
          } else {
              agentData.missed_calls++;
              agentData.missed_details.push({
                  ...callDetail,
                  customer_details: customerDetail
              });
          }
      });

      const formatDuration = (totalSeconds) => {
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          return {
              hours,
              minutes,
              seconds,
              formatted: `${hours}h ${minutes}m ${seconds}s`
          };
      };

      const agentStats = Array.from(agentMap.values()).map(agent => {
          const duration = formatDuration(agent.total_duration_seconds);
          return {
              agent_name: agent.agent_name,
              agent_number: agent.agent_number,
              total_calls: agent.total_calls,
              connected_calls: agent.connected_calls,
              missed_calls: agent.missed_calls,
              total_talk_time: duration.formatted,
              total_duration_minutes: agent.total_duration_minutes.toFixed(2),
              avg_call_duration_minutes: agent.connected_calls > 0 ? 
                  (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
              connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
              missed_rate: ((agent.missed_calls / agent.total_calls) * 100).toFixed(2) + '%',
              connected_calls_detail: agent.connected_details,
              missed_calls_detail: agent.missed_details
          };
      });

      agentStats.sort((a, b) => b.total_calls - a.total_calls);

      const totalDuration = formatDuration(totalTalkTimeSeconds);

      const response = {
          success: true,
          data: {
              summary: {
                  period: {
                      start_date: moment(startDate).format('YYYY-MM-DD'),
                      end_date: moment(endDate).format('YYYY-MM-DD')
                  },
                  metrics: {
                      total_calls: totalCalls,
                      unique_leads: uniqueLeads.size,
                      connected_calls: totalConnected,
                      missed_calls: totalMissed,
                      total_talk_time: totalDuration.formatted,
                      connection_rate: totalCalls ? 
                          ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
                  }
              },
              agents: agentStats
          }
      };

      res.status(200).json(response);

  } catch (error) {
      console.error('Error in getCallAnalytics:', error);
      res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};



exports.getAuditCallAnalytics = async (req, res) => {
    try {
        const startDate = req.query.startDate;
        const endDate = req.query.endDate || startDate;
        const agentName = req.query.agentName;

        if (!startDate || !moment(startDate).isValid()) {
            return res.status(400).json({
                success: false,
                message: "Valid start date required"
            });
        }

        let query = `
            SELECT 
                ic.call_id,
                ic.agent_number,
                ic.caller_number,
                emp.EmployeeName as agent_name,
                ic.ivr_number,
                DATE(ic.created_at) as call_date,
                ic.created_at,
                ic.connected_at,
                ic.ended_at,
                alt.Farmer_Name as lead_name,
                alt.Zone_Name,
                alt.Branch_Name,
                alt.Lot_Number,
                alt.Vendor,
                alt.Shed_Type,
                alt.Placed_Qty,
                alt.Hatch_Date,
                alt.Total_Mortality,
                alt.Total_Mortality_Percentage,
                alt.status as lead_status,
                CASE 
                    WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL THEN 'Connected'
                    ELSE 'Missed'
                END as call_status,
                CASE 
                    WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(SECOND, ic.connected_at, ic.ended_at)
                    ELSE 0
                END as call_duration_seconds
            FROM incoming_calls ic
            LEFT JOIN audit_lead_table alt ON ic.caller_number = alt.Mobile
            LEFT JOIN employee_table emp ON ic.agent_number = emp.EmployeePhone
            WHERE ic.ivr_number = '8517009998'
            AND DATE(ic.created_at) BETWEEN DATE(:startDate) AND DATE(:endDate)
            ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
            ORDER BY ic.created_at DESC
        `;

        const replacements = { 
            startDate: moment(startDate).startOf('day').format('YYYY-MM-DD'),
            endDate: moment(endDate).endOf('day').format('YYYY-MM-DD'),
            ...(agentName && { agentName })
        };

        const callDetails = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        const agentMap = new Map();
        let totalCalls = 0;
        let totalConnected = 0;
        let totalMissed = 0;
        let uniqueLeads = new Set();
        let processedCalls = new Map();
        let totalTalkTimeSeconds = 0;

        callDetails.forEach(call => {
            if (!call.agent_name) return;
            
            const uniqueKey = `${call.call_id}_${call.agent_number}`;
            
            if (!processedCalls.has(uniqueKey)) {
                processedCalls.set(uniqueKey, true);
                totalCalls++;

                if (call.Lot_Number) uniqueLeads.add(call.Lot_Number);
                
                const isConnected = call.connected_at && call.ended_at;
                if (isConnected) {
                    totalConnected++;
                    totalTalkTimeSeconds += call.call_duration_seconds;
                } else {
                    totalMissed++;
                }

                if (!agentMap.has(call.agent_name)) {
                    agentMap.set(call.agent_name, {
                        agent_name: call.agent_name,
                        agent_number: call.agent_number,
                        total_calls: 0,
                        missed_calls: 0,
                        connected_calls: 0,
                        total_duration_minutes: 0,
                        total_duration_seconds: 0,
                        connected_details: [],
                        missed_details: []
                    });
                }

                const agentData = agentMap.get(call.agent_name);
                agentData.total_calls++;

                const callDetail = {
                    call_id: call.call_id,
                    date: moment(call.created_at).format('YYYY-MM-DD'),
                    time: moment(call.created_at).format('HH:mm:ss'),
                    caller_number: call.caller_number,
                    duration_minutes: (call.call_duration_seconds / 60).toFixed(2)
                };

                const customerDetail = call.lead_name ? {
                    farmer_name: call.lead_name,
                    lot_number: call.Lot_Number,
                    zone: call.Zone_Name,
                    branch: call.Branch_Name,
                    vendor: call.Vendor,
                    shed_type: call.Shed_Type,
                    placed_qty: call.Placed_Qty,
                    hatch_date: call.Hatch_Date,
                    total_mortality: call.Total_Mortality,
                    mortality_percentage: call.Total_Mortality_Percentage,
                    status: call.lead_status
                } : null;

                if (isConnected) {
                    agentData.connected_calls++;
                    agentData.total_duration_seconds += call.call_duration_seconds;
                    agentData.total_duration_minutes += call.call_duration_seconds / 60;
                    callDetail.connected_at = moment(call.connected_at).format('YYYY-MM-DD HH:mm:ss');
                    callDetail.ended_at = moment(call.ended_at).format('YYYY-MM-DD HH:mm:ss');
                    agentData.connected_details.push({
                        ...callDetail,
                        customer_details: customerDetail
                    });
                } else {
                    agentData.missed_calls++;
                    agentData.missed_details.push({
                        ...callDetail,
                        customer_details: customerDetail
                    });
                }
            }
        });

        // Calculate hours, minutes and seconds format
        const formatDuration = (totalSeconds) => {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return {
                hours,
                minutes,
                seconds,
                formatted: `${hours}h ${minutes}m ${seconds}s`
            };
        };

        const agentStats = Array.from(agentMap.values()).map(agent => {
            const duration = formatDuration(agent.total_duration_seconds);
            return {
                agent_name: agent.agent_name,
                agent_number: agent.agent_number,
                total_calls: agent.total_calls,
                connected_calls: agent.connected_calls,
                missed_calls: agent.missed_calls,
                total_talk_time: duration.formatted,
                total_duration_minutes: agent.total_duration_minutes.toFixed(2),
                avg_call_duration_minutes: agent.connected_calls > 0 ? 
                    (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
                connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
                missed_rate: ((agent.missed_calls / agent.total_calls) * 100).toFixed(2) + '%',
                connected_calls_detail: agent.connected_details,
                missed_calls_detail: agent.missed_details
            };
        });

        agentStats.sort((a, b) => b.total_calls - a.total_calls);

        const totalDuration = formatDuration(totalTalkTimeSeconds);

        const response = {
            success: true,
            data: {
                summary: {
                    period: {
                        start_date: moment(startDate).format('YYYY-MM-DD'),
                        end_date: moment(endDate).format('YYYY-MM-DD')
                    },
                    metrics: {
                        total_calls: totalCalls,
                        unique_leads: uniqueLeads.size,
                        connected_calls: totalConnected,
                        missed_calls: totalMissed,
                        total_talk_time: totalDuration.formatted,
                        connection_rate: totalCalls ? 
                            ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
                    }
                },
                agents: agentStats
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error in getAuditCallAnalytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


const IVR_CONFIG = {
  '8517009997': {
      numbers: ['8517009997', '7610255555'],
      type: 'STANDARD'
  },
  '8517009998': {
      numbers: ['8517009998', '7610233333'],
      type: 'AUDIT'
  }
};

const getQueryOptions = (ivrType, startDateTime, endDateTime, ivrNumbers, agentName) => {
  const baseOptions = {
      where: {
          dni: { [Op.in]: ivrNumbers },
          eventType: 'Call End',
          callStartTime: {
              [Op.between]: [startDateTime, endDateTime]
          }
      },
      include: [{
          model: Employee,
          as: 'agent',
          required: false,
          where: agentName ? { EmployeeName: agentName } : {},
          attributes: ['EmployeeName', 'EmployeePhone']
      }],
      order: [['callStartTime', 'DESC']]
  };

  if (ivrType === 'STANDARD') {
      baseOptions.include.push({
          model: LeadDetail,
          as: 'leadDetail',
          required: false,
          attributes: [
              'CustomerName',
              'Project',
              'state_name',
              'region_name',
              'category',
              'sub_category'
          ]
      });
  } else {
      baseOptions.include.push({
          model: AuditLeadTable,
          as: 'auditLead',
          required: false,
          attributes: [
              'Farmer_Name',
              'Zone_Name',
              'Branch_Name',
              'Lot_Number',
              'Vendor',
              'Shed_Type',
              'Placed_Qty',
              'Hatch_Date',
              'Total_Mortality',
              'Total_Mortality_Percentage',
              'status'
          ]
      });
  }

  return baseOptions;
};

const processCallData = (calls, ivrType) => {
  const agentMap = new Map();
  let totalCalls = 0;
  let totalConnected = 0;
  let totalNotConnected = 0;
  let uniqueLeads = new Set();
  let processedCallIds = new Map();

  calls.forEach(call => {
      const agent = call.agent;
      if (!agent) return;

      const leadData = ivrType === 'STANDARD' ? call.leadDetail : call.auditLead;
      const uniqueKey = `${call.callId}_${leadData?.Lot_Number || 'no_lot'}`;
      
      if (!processedCallIds.has(uniqueKey)) {
          processedCallIds.set(uniqueKey, true);
          totalCalls++;

          if (leadData) {
              uniqueLeads.add(ivrType === 'STANDARD' ? leadData.id : leadData.Lot_Number);
          }

          const isConnected = call.bDialStatus === 'Connected' && leadData;
          if (isConnected) {
              totalConnected++;
          } else {
              totalNotConnected++;
          }

          if (!agentMap.has(agent.EmployeeName)) {
              agentMap.set(agent.EmployeeName, {
                  agent_name: agent.EmployeeName,
                  agent_number: agent.EmployeePhone,
                  total_calls: 0,
                  connected_calls: 0,
                  not_connected_calls: 0,
                  total_duration_minutes: 0,
                  connected_details: [],
                  not_connected_details: []
              });
          }

          const agentData = agentMap.get(agent.EmployeeName);
          agentData.total_calls++;

          const callDuration = call.bPartyConnectedTime && call.bPartyEndTime ?
              moment(call.bPartyEndTime).diff(moment(call.bPartyConnectedTime), 'seconds') : 0;

          const callDetail = {
              call_id: call.callId,
              date: moment(call.callStartTime).format('YYYY-MM-DD'),
              time: moment(call.callStartTime).format('HH:mm:ss'),
              customer_number: call.bPartyNo,
              duration_minutes: (callDuration / 60).toFixed(2),
              dial_status: call.bDialStatus,
              release_reason: call.bPartyReleaseReason || 'N/A',
              customer_details: leadData ? {
                  ...(ivrType === 'STANDARD' ? {
                      customer_name: leadData.CustomerName,
                      project: leadData.Project,
                      region: leadData.region_name,
                      category: leadData.category
                  } : {
                      farmer_name: leadData.Farmer_Name,
                      lot_number: leadData.Lot_Number,
                      zone: leadData.Zone_Name,
                      branch: leadData.Branch_Name,
                      status: leadData.status
                  })
              } : null
          };

          if (isConnected) {
              agentData.connected_calls++;
              agentData.total_duration_minutes += callDuration / 60;
              callDetail.connected_at = moment(call.bPartyConnectedTime).format('YYYY-MM-DD HH:mm:ss');
              callDetail.ended_at = moment(call.bPartyEndTime).format('YYYY-MM-DD HH:mm:ss');
              agentData.connected_details.push(callDetail);
          } else {
              agentData.not_connected_calls++;
              agentData.not_connected_details.push(callDetail);
          }
      }
  });

  return {
      agentMap,
      totalCalls,
      totalConnected,
      totalNotConnected,
      uniqueLeads: uniqueLeads.size
  };
};

exports.getOutboundCallAnalytics = async (req, res) => {
  try {
      const { startDate, endDate = startDate, agentName, ivrNumber } = req.query;

      if (!startDate || !moment(startDate).isValid() || !moment(endDate).isValid()) {
          return res.status(400).json({
              success: false,
              message: "Valid start date required"
          });
      }

      if (!ivrNumber || !IVR_CONFIG[ivrNumber]) {
          return res.status(400).json({
              success: false,
              message: "Valid IVR number required (8517009997 or 8517009998)"
          });
      }

      const startDateTime = moment(startDate).startOf('day').toDate();
      const endDateTime = moment(endDate).endOf('day').toDate();
      const ivrConfig = IVR_CONFIG[ivrNumber];

      const queryOptions = getQueryOptions(
          ivrConfig.type,
          startDateTime,
          endDateTime,
          ivrConfig.numbers,
          agentName
      );

      const calls = await CallLog.findAll(queryOptions);

      const {
          agentMap,
          totalCalls,
          totalConnected,
          totalNotConnected,
          uniqueLeads
      } = processCallData(calls, ivrConfig.type);

      const agentStats = Array.from(agentMap.values())
          .map(agent => ({
              ...agent,
              avg_call_duration_minutes: agent.connected_calls > 0 ? 
                  (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
              connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%'
          }))
          .sort((a, b) => b.total_calls - a.total_calls);

      res.status(200).json({
          success: true,
          data: {
              summary: {
                  period: {
                      start_date: startDate,
                      end_date: endDate
                  },
                  ivr_number: ivrNumber,
                  metrics: {
                      total_calls: totalCalls,
                      unique_leads: uniqueLeads,
                      connected_calls: totalConnected,
                      not_connected_calls: totalNotConnected,
                      connection_rate: totalCalls ? 
                          ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
                  }
              },
              agents: agentStats
          }
      });

  } catch (error) {
      console.error('Error in getOutboundCallAnalytics:', error);
      res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};


//group meeting

// Helper function to validate phone number
const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phoneNumber);
};

// Helper function to validate meeting data
const validateMeetingData = (data) => {
  const errors = {};

  if (!data.customer_name || data.customer_name.trim() === '') {
    errors.customer_name = 'Customer name is required';
  }

  if (!data.mobile) {
    errors.mobile = 'Mobile number is required';
  } else if (!validatePhoneNumber(data.mobile)) {
    errors.mobile = 'Invalid mobile number format';
  }

  if (!data.location || data.location.trim() === '') {
    errors.location = 'Location is required';
  }

  if (!data.pincode || data.pincode.trim() === '') {
    errors.pincode = 'Pincode is required';
  }

  if (!data.group_meeting_title || data.group_meeting_title.trim() === '') {
    errors.group_meeting_title = 'Group meeting title is required';
  }

  if (data.is_unique === undefined || data.is_unique === null) {
    errors.is_unique = 'Please specify if this is a unique entry';
  }

  if (!data.bdm_id) {
    errors.bdm_id = 'BDM ID is required';
  }

  return errors;
};

// exports.createGroupMeeting = async (req, res) => {
//   const t = await sequelize.transaction();

//   try {
//     const meetingData = req.body;
    
//     // Validate each entry in the array
//     if (!Array.isArray(meetingData)) {
//       await t.rollback();
//       return res.status(400).json({
//         success: false,
//         message: 'Input must be an array of meeting data'
//       });
//     }
    
//     const results = [];
//     const errors = [];
//     const group_id = `GM-${uuidv4().substring(0, 8)}`;
    
//     // Process each meeting entry
//     for (const entry of meetingData) {
//       // Validate entry data
//       const validationErrors = validateMeetingData(entry);
      
//       if (Object.keys(validationErrors).length > 0) {
//         errors.push({
//           entry: entry,
//           errors: validationErrors
//         });
//         continue;
//       }
      
//       // Check if mobile number already exists for unique entries
 
      
//       // Create the meeting entry
//       const meetingEntry = await GroupMeeting.create({
//         group_id: group_id,
//         meeting_location : entry.meeting_location,
//         nearest_branch : entry.nearestBranch,
//         customer_name: entry.customer_name || entry.name, // Support both field names
//         mobile: entry.mobile,
//         location: entry.location,
//         pincode: entry.pincode,
//         group_meeting_title: entry.group_meeting_title || "Group Meeting", // Default title if not provided
//         is_unique: entry.is_unique === "yes" || entry.is_unique === true,
//         action_type: "group_meeting",
//         bdm_id: entry.bdm_id || meetingData[0].bdm_id, // Use the first entry's bdm_id as fallback
//         created_at: new Date()
//       }, { transaction: t });
      
//       results.push(meetingEntry);
//     }
    
//     // Check if we have any successful entries
//     if (results.length === 0) {
//       await t.rollback();
//       return res.status(400).json({
//         success: false,
//         message: 'No valid meeting entries were provided',
//         errors: errors
//       });
//     }
    

//     await t.commit();
    
//     // Return the response with results and any errors
//     return res.status(201).json({
//       success: true,
//       message: `Group meeting created successfully with ${results.length} participants`,
//       group_id: group_id,
//       results: results,
//       errors: errors.length > 0 ? errors : undefined
//     });
    
//   } catch (error) {
//     await t.rollback();
//     console.error("Error creating group meeting:", error);
    
//     // Handle specific database errors
//     if (error.name === 'SequelizeUniqueConstraintError') {
//       return res.status(400).json({
//         success: false,
//         message: "Duplicate entry found",
//         error: error.errors.map(e => e.message)
//       });
//     }
    
//     if (error.name === 'SequelizeValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: "Validation error",
//         error: error.errors.map(e => e.message)
//       });
//     }
    
//     return res.status(500).json({
//       success: false,
//       message: "Error creating group meeting",
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };


exports.createGroupMeeting = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const meetingData = req.body;
    
    // Validate each entry in the array
    if (!Array.isArray(meetingData)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Input must be an array of meeting data'
      });
    }
    
    const results = [];
    const errors = [];
    const group_id = `GM-${uuidv4().substring(0, 8)}`;
    
    // Process each meeting entry
    for (const entry of meetingData) {
      // Validate entry data
      const validationErrors = validateMeetingData(entry);
      
      if (Object.keys(validationErrors).length > 0) {
        errors.push({
          entry: entry,
          errors: validationErrors
        });
        continue;
      }
      
      // Create the meeting entry
      const meetingEntry = await GroupMeeting.create({
        group_id: group_id,
        meeting_location: entry.meeting_location,
        nearest_branch: entry.nearestBranch,
        customer_name: entry.customer_name || entry.name, // Support both field names
        mobile: entry.mobile,
        location: entry.location,
        pincode: entry.pincode,
        group_meeting_title: entry.group_meeting_title || "Group Meeting", // Default title if not provided
        is_unique: entry.is_unique === "yes" || entry.is_unique === true,
        action_type: "group_meeting",
        bdm_id: entry.bdm_id || meetingData[0].bdm_id, // Use the first entry's bdm_id as fallback
        created_at: new Date()
      }, { transaction: t });
      
      // Handle bdmLeadActionId if provided in the entry
      if (entry.bdmLeadActionId) {
        try {
          const bdmLeadAction = await BdmLeadAction.findByPk(entry.bdmLeadActionId, {
            transaction: t,
          });
          
          if (bdmLeadAction) {
            await bdmLeadAction.update(
              {
                completion_status: "completed",
                group_meeting_id: meetingEntry.id // Link to the group meeting
              },
              { transaction: t }
            );
            
            // Create a log entry for BDM action completion
            await LeadLog.create(
              {
                action_type: "Group Meeting Completed",
                performed_by: entry.bdm_id || meetingData[0].bdm_id,
                LeadDetailId: bdmLeadAction.LeadDetailId,
                remarks: `Group Meeting at ${entry.meeting_location} completed`,
              },
              { transaction: t }
            );
          } else {
            errors.push({
              entry: entry,
              errors: { bdmLeadActionId: 'BDM Lead Action not found' }
            });
          }
        } catch (actionError) {
          errors.push({
            entry: entry,
            errors: { bdmLeadAction: actionError.message }
          });
        }
      }
      
      results.push(meetingEntry);
    }
    
    // Check if we have any successful entries
    if (results.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'No valid meeting entries were provided',
        errors: errors
      });
    }
    
    await t.commit();
    
    // Return the response with results and any errors
    return res.status(201).json({
      success: true,
      message: `Group meeting created successfully with ${results.length} participants`,
      group_id: group_id,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    await t.rollback();
    console.error("Error creating group meeting:", error);
    
    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: "Duplicate entry found",
        error: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.errors.map(e => e.message)
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Error creating group meeting",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};










// exports.getGroupMeetingsByBdmId = async (req, res) => {

//   try {
//     const { bdm_id } = req.params;
//     const { start_date, end_date } = req.query;
    
//     if (!bdm_id) {
//       return res.status(400).json({
//         success: false,
//         message: 'BDM ID is required'
//       });
//     }
    
//     // Build query conditions with BDM ID
//     const whereCondition = { bdm_id: bdm_id };
    
//     // Add date range filter if provided
//     if (start_date || end_date) {
//       whereCondition.created_at = {};
      
//       if (start_date) {
//         whereCondition.created_at[Op.gte] = new Date(start_date);
//       }
      
//       if (end_date) {
//         // Add 1 day to end_date to include the full day
//         const endDateObj = new Date(end_date);
//         endDateObj.setDate(endDateObj.getDate() + 1);
//         whereCondition.created_at[Op.lt] = endDateObj;
//       }
//     }
    
//     // Find all group meetings for this BDM with date filter
//     const groupMeetings = await GroupMeeting.findAll({
//       where: whereCondition,
//       order: [['created_at', 'DESC']]
//     });
    
//     // Group the meetings by group_id
//     const groupedMeetings = {};
    
//     groupMeetings.forEach(meeting => {
//       const groupId = meeting.group_id;
      
//       if (!groupedMeetings[groupId]) {
//         groupedMeetings[groupId] = {
//           group_id: groupId,
//           group_meeting_title: meeting.group_meeting_title,
//           created_at: meeting.created_at,
//           bdm_id: meeting.bdm_id,
//           participants: []
//         };
//       }
      
//       groupedMeetings[groupId].participants.push({
//         id: meeting.id,
//         customer_name: meeting.customer_name,
//         mobile: meeting.mobile,
//         location: meeting.location,
//         pincode: meeting.pincode,
//         is_unique: meeting.is_unique
//       });
//     });
    
//     // Convert to array format
//     const result = Object.values(groupedMeetings);
    
//     return res.status(200).json({
//       success: true,
//       message: 'Group meetings retrieved successfully',
//       count: result.length,
//       meetings: result
//     });
    
//   } catch (error) {
//     console.error("Error fetching group meetings:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching group meetings",
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };


exports.getGroupMeetingsByBdmId = async (req, res) => {
  try {
    const { bdm_id } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!bdm_id) {
      return res.status(400).json({
        success: false,
        message: 'BDM ID is required'
      });
    }
    
    // Build query conditions with BDM ID
    const whereCondition = { bdm_id: bdm_id };
    
    // Add date range filter if provided
    if (start_date || end_date) {
      whereCondition.created_at = {};
      
      if (start_date) {
        whereCondition.created_at[Op.gte] = new Date(start_date);
      }
      
      if (end_date) {
        // Add 1 day to end_date to include the full day
        const endDateObj = new Date(end_date);
        endDateObj.setDate(endDateObj.getDate() + 1);
        whereCondition.created_at[Op.lt] = endDateObj;
      }
    }
    
    // Find all group meetings for this BDM with date filter
    const groupMeetings = await GroupMeeting.findAll({
      where: whereCondition,
      order: [['created_at', 'DESC']]
    });
    
    // Group the meetings by group_id
    const groupedMeetings = {};
    
    groupMeetings.forEach(meeting => {
      const groupId = meeting.group_id;
      
      if (!groupedMeetings[groupId]) {
        groupedMeetings[groupId] = {
          group_id: groupId,
          group_meeting_title: meeting.group_meeting_title,
          created_at: meeting.created_at,
          bdm_id: meeting.bdm_id,
          participants: []
        };
      }
      
      groupedMeetings[groupId].participants.push({
        id: meeting.id,
        customer_name: meeting.customer_name,
        mobile: meeting.mobile,
        location: meeting.location,
        pincode: meeting.pincode,
        is_unique: meeting.is_unique
      });
    });
    
    // Convert to array format
    const result = Object.values(groupedMeetings);
    
    return res.status(200).json({
      success: true,
      message: 'Group meetings retrieved successfully',
      count: result.length,
      meetings: result
    });
    
  } catch (error) {
    console.error("Error fetching group meetings:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching group meetings",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};




///

// exports.getAgentBdmFollowups = async (req, res) => {
//   try {
//     const { agentId, startDate, endDate, taskType = 'HO_task' } = req.query;

//     if (!agentId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Agent ID is required'
//       });
//     }

//     // Handle date range parameters
//     let dateStart, dateEnd;
    
//     if (startDate && endDate) {
//       // If both dates are provided, use them
//       dateStart = new Date(startDate);
//       dateStart.setHours(0, 0, 0, 0);
      
//       dateEnd = new Date(endDate);
//       dateEnd.setHours(23, 59, 59, 999);
//     } else if (startDate) {
//       // If only start date is provided, set range to that single day
//       dateStart = new Date(startDate);
//       dateStart.setHours(0, 0, 0, 0);
      
//       dateEnd = new Date(startDate);
//       dateEnd.setHours(23, 59, 59, 999);
//     } else {
//       // Default to today if no dates provided
//       dateStart = new Date();
//       dateStart.setHours(0, 0, 0, 0);
      
//       dateEnd = new Date();
//       dateEnd.setHours(23, 59, 59, 999);
//     }

//     // Verify the agent exists
//     const agent = await Employee.findOne({
//       where: { EmployeeId: agentId },
//       attributes: ['EmployeeId', 'EmployeeName']
//     });

//     if (!agent) {
//       return res.status(404).json({
//         success: false,
//         message: 'Agent not found'
//       });
//     }

//     // First, find all leads assigned to this agent
//     const agentLeads = await Lead_Detail.findAll({
//       where: {
//         AgentId: agentId,
//         follow_up_date: {
//           [Op.between]: [dateStart, dateEnd]
//         }
//       },
//       attributes: [
//         'id', 'CustomerName', 'MobileNo', 'CustomerMailId',
//         'location', 'pincode', 'state_name', 'region_name',
//         'category', 'sub_category', 'agent_remark', 'bdm_remark',
//         'follow_up_date', 'BDMId', 'RegionId'
//       ],
//       include: [
//         {
//           model: Employee,
//           as: 'BDM',
//           attributes: ['EmployeeId', 'EmployeeName']
//         },
//         {
//           model: Parivartan_Region,
//           as: 'Region',
//           attributes: ['RegionId', 'RegionName']
//         }
//       ]
//     });

//     // Group leads by BDM
//     const leadsByBdm = {};
//     agentLeads.forEach(lead => {
//       const bdmId = lead.BDMId;
//       if (bdmId) {
//         if (!leadsByBdm[bdmId]) {
//           leadsByBdm[bdmId] = {
//             bdmId: bdmId,
//             bdmName: lead.BDM ? lead.BDM.EmployeeName : 'Unknown',
//             leads: []
//           };
//         }
//         leadsByBdm[bdmId].leads.push(lead);
//       }
//     });

//     // For each BDM, fetch their lead actions
//     const bdmsWithActions = [];
    
//     for (const bdmId in leadsByBdm) {
//       const bdmLeadIds = leadsByBdm[bdmId].leads.map(lead => lead.id);
      
//       // Get BDM's actions for these leads
//       const leadActions = await BdmLeadAction.findAll({
//         where: {
//           BDMId: bdmId,
//           LeadId: {
//             [Op.in]: bdmLeadIds
//           },
//           task_type: taskType // Filter by taskType (default 'HO_task')
//         },
//         include: [
//           {
//             model: Lead_Detail,
//             as: 'Lead',
//             attributes: [
//               'id', 'CustomerName', 'MobileNo', 'CustomerMailId',
//               'location', 'pincode', 'state_name', 'region_name',
//               'category', 'sub_category', 'agent_remark', 'bdm_remark',
//               'follow_up_date'
//             ]
//           },
//           {
//             model: BdmTravelDetailForm,
//             as: 'TravelDetails',
//             required: false
//           }
//         ],
//         attributes: [
//           'id', 'LeadId', 'task_type', 'action_type',
//           'specific_action', 'new_follow_up_date',
//           'remarks', 'action_date', 'task_name',
//           'completion_status', 'branchOffice',
//           'regionalOffice', 'lead_detail_form_id'
//         ],
//         order: [['action_date', 'DESC']]
//       });

//       // Get travel details for this BDM
//       const travelDetails = await BdmTravelDetail.findAll({
//         where: {
//           bdm_id: bdmId,
//           leaddetail_id: {
//             [Op.in]: bdmLeadIds
//           },
//           checkin_time: {
//             [Op.between]: [dateStart, dateEnd]
//           }
//         }
//       });

//       // Process the lead actions to include travel details
//       const processedLeadActions = leadActions.map(action => {
//         const actionObj = action.toJSON();
        
//         // Find matching travel detail if any
//         const travelDetail = travelDetails.find(td => td.bdm_lead_action_id === action.id);
        
//         // Add travel form details if this is a travel-related action
//         if (['Travel', 'RO Visit', 'HO Visit', 'BO Visit'].includes(actionObj.specific_action)) {
//           if (actionObj.TravelDetails) {
//             actionObj.travel_form_details = {
//               id: actionObj.TravelDetails.id,
//               taskType: actionObj.TravelDetails.taskType,
//               branchName: actionObj.TravelDetails.branchName,
//               regionalOfficeName: actionObj.TravelDetails.regionalOfficeName,
//               purposeForVisit: actionObj.TravelDetails.purposeForVisit,
//               concernPersonName: actionObj.TravelDetails.concernPersonName,
//               adminTaskSelect: actionObj.TravelDetails.adminTaskSelect,
//               remarks: actionObj.TravelDetails.remarks,
//               hoSelection: actionObj.TravelDetails.hoSelection,
//               modeOfTravel: actionObj.TravelDetails.modeOfTravel,
//               travelFrom: actionObj.TravelDetails.travelFrom,
//               travelTo: actionObj.TravelDetails.travelTo,
//               reasonForTravel: actionObj.TravelDetails.reasonForTravel,
//               mandatoryVisitImage: actionObj.TravelDetails.mandatoryVisitImage,
//               optionalVisitImage: actionObj.TravelDetails.optionalVisitImage
//             };
//           }
//         }
        
//         // Add travel details if available
//         if (travelDetail) {
//           actionObj.travel_details = {
//             travel_detailsId: travelDetail.id,
//             checkin_time: moment(travelDetail.checkin_time).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
//             checkout_time: travelDetail.checkout_time ?
//               moment(travelDetail.checkout_time).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss') : null,
//             checkin_location: {
//               latitude: travelDetail.checkin_latitude,
//               longitude: travelDetail.checkin_longitude
//             },
//             checkout_location: travelDetail.checkout_time ? {
//               latitude: travelDetail.checkout_latitude,
//               longitude: travelDetail.checkout_longitude
//             } : null
//           };
//         }
        
//         // Format dates using moment
//         if (actionObj.action_date) {
//           actionObj.action_date = moment(actionObj.action_date).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss');
//         }
        
//         if (actionObj.new_follow_up_date) {
//           actionObj.new_follow_up_date = moment(actionObj.new_follow_up_date).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss');
//         }
        
//         // Remove the TravelDetails object to clean up response
//         delete actionObj.TravelDetails;
        
//         return actionObj;
//       });

//       // Group lead actions by lead
//       const actionsGroupedByLead = {};
      
//       processedLeadActions.forEach(action => {
//         const leadId = action.LeadId;
//         if (!actionsGroupedByLead[leadId]) {
//           actionsGroupedByLead[leadId] = {
//             leadInfo: action.Lead,
//             actions: []
//           };
//         }
        
//         // Remove the Lead object to avoid duplication
//         delete action.Lead;
        
//         actionsGroupedByLead[leadId].actions.push(action);
//       });

//       // Format the leads with their actions
//       const formattedLeads = Object.values(actionsGroupedByLead);

//       // Calculate action statistics
//       const totalActions = processedLeadActions.length;
//       const confirmedActions = processedLeadActions.filter(a => a.action_type === 'confirm').length;
//       const postponedActions = processedLeadActions.filter(a => a.action_type === 'postpone').length;
//       const completedActions = processedLeadActions.filter(a => a.completion_status === 'completed').length;
//       const pendingActions = processedLeadActions.filter(a => a.completion_status === 'not_completed').length;

//       // Group actions by type
//       const meetingActions = processedLeadActions.filter(a => a.specific_action && a.specific_action.toLowerCase().includes('meeting')).length;
//       const roVisitActions = processedLeadActions.filter(a => a.specific_action === 'RO Visit').length;
//       const hoVisitActions = processedLeadActions.filter(a => a.specific_action === 'HO Visit').length;
//       const boVisitActions = processedLeadActions.filter(a => a.specific_action === 'BO Visit').length;
//       const travelActions = processedLeadActions.filter(a => a.specific_action === 'Travel').length;
//       const siteVisitActions = processedLeadActions.filter(a => a.specific_action === 'Site Visit').length;

//       // Add to the BDMs array
//       bdmsWithActions.push({
//         bdmId: bdmId,
//         bdmName: leadsByBdm[bdmId].bdmName,
//         stats: {
//           totalLeads: leadsByBdm[bdmId].leads.length,
//           totalActions: totalActions,
//           confirmedActions: confirmedActions,
//           postponedActions: postponedActions,
//           completedActions: completedActions,
//           pendingActions: pendingActions,
//           meetingActions: meetingActions,
//           roVisitActions: roVisitActions,
//           hoVisitActions: hoVisitActions,
//           boVisitActions: boVisitActions,
//           travelActions: travelActions,
//           siteVisitActions: siteVisitActions
//         },
//         leads: formattedLeads
//       });
//     }

//     // Calculate overall statistics
//     const totalLeads = agentLeads.length;
//     const totalBdms = bdmsWithActions.length;
//     const totalActions = bdmsWithActions.reduce((sum, bdm) => sum + bdm.stats.totalActions, 0);
//     const completedActions = bdmsWithActions.reduce((sum, bdm) => sum + bdm.stats.completedActions, 0);
//     const pendingActions = bdmsWithActions.reduce((sum, bdm) => sum + bdm.stats.pendingActions, 0);

//     // Return the response
//     res.status(200).json({
//       success: true,
//       message: "Agent BDM follow-ups retrieved successfully",
//       agentInfo: {
//         agentId: agent.EmployeeId,
//         agentName: agent.EmployeeName
//       },
//       dateRange: {
//         startDate: moment(dateStart).format('DD-MM-YYYY'),
//         endDate: moment(dateEnd).format('DD-MM-YYYY')
//       },
//       summary: {
//         totalLeads: totalLeads,
//         totalBdms: totalBdms,
//         totalActions: totalActions,
//         completedActions: completedActions,
//         pendingActions: pendingActions,
//         completionRate: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0
//       },
//       bdms: bdmsWithActions
//     });

//   } catch (error) {
//     console.error('Error retrieving agent BDM follow-ups:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

exports.getAgentBdmFollowups = async (req, res) => {
  try {
    const { agentId, startDate, endDate, taskType = 'HO_task' } = req.query;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID is required'
      });
    }

    // Handle date range parameters
    let dateStart, dateEnd;
    
    if (startDate && endDate) {
      // If both dates are provided, use them
      dateStart = new Date(startDate);
      dateStart.setHours(0, 0, 0, 0);
      
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    } else if (startDate) {
      // If only start date is provided, set range to that single day
      dateStart = new Date(startDate);
      dateStart.setHours(0, 0, 0, 0);
      
      dateEnd = new Date(startDate);
      dateEnd.setHours(23, 59, 59, 999);
    } else {
      // Default to today if no dates provided
      dateStart = new Date();
      dateStart.setHours(0, 0, 0, 0);
      
      dateEnd = new Date();
      dateEnd.setHours(23, 59, 59, 999);
    }

    // Verify the agent exists
    const agent = await Employee.findOne({
      where: { EmployeeId: agentId },
      attributes: ['EmployeeId', 'EmployeeName']
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // First, find all leads assigned to this agent
    const agentLeads = await Lead_Detail.findAll({
      where: {
        AgentId: agentId,
        follow_up_date: {
          [Op.between]: [dateStart, dateEnd]
        }
      },
      attributes: [
        'id', 'CustomerName', 'MobileNo', 'CustomerMailId',
        'location', 'pincode', 'state_name', 'region_name',
        'category', 'sub_category', 'agent_remark', 'bdm_remark',
        'follow_up_date', 'BDMId', 'RegionId'
      ],
      include: [
        {
          model: Employee,
          as: 'BDM',
          attributes: ['EmployeeId', 'EmployeeName']
        },
        {
          model: Parivartan_Region,
          as: 'Region',
          attributes: ['RegionId', 'RegionName']
        }
      ]
    });

    // Group leads by BDM
    const leadsByBdm = {};
    agentLeads.forEach(lead => {
      const bdmId = lead.BDMId;
      if (bdmId) {
        if (!leadsByBdm[bdmId]) {
          leadsByBdm[bdmId] = {
            bdmId: bdmId,
            bdmName: lead.BDM ? lead.BDM.EmployeeName : 'Unknown',
            leads: []
          };
        }
        leadsByBdm[bdmId].leads.push(lead);
      }
    });

    // For each BDM, fetch their lead actions
    const bdmsWithActions = [];
    
    for (const bdmId in leadsByBdm) {
      const bdmLeadIds = leadsByBdm[bdmId].leads.map(lead => lead.id);
      
      // Get BDM's actions for these leads
      const leadActions = await BdmLeadAction.findAll({
        where: {
          BDMId: bdmId,
          LeadId: {
            [Op.in]: bdmLeadIds
          },
          task_type: taskType // Filter by taskType (default 'HO_task')
        },
        include: [
          {
            model: Lead_Detail,
            as: 'Lead',
            attributes: [
              'id', 'CustomerName', 'MobileNo', 'CustomerMailId',
              'location', 'pincode', 'state_name', 'region_name',
              'category', 'sub_category', 'agent_remark', 'bdm_remark',
              'follow_up_date'
            ]
          },
          {
            model: BdmTravelDetailForm,
            as: 'TravelDetails',
            required: false
          }
        ],
        attributes: [
          'id', 'LeadId', 'task_type', 'action_type',
          'specific_action', 'new_follow_up_date',
          'remarks', 'action_date', 'task_name',
          'completion_status', 'branchOffice',
          'regionalOffice', 'lead_detail_form_id'
        ],
        order: [['action_date', 'DESC']]
      });

      // Get travel details for this BDM
      const travelDetails = await BdmTravelDetail.findAll({
        where: {
          bdm_id: bdmId,
          leaddetail_id: {
            [Op.in]: bdmLeadIds
          },
          checkin_time: {
            [Op.between]: [dateStart, dateEnd]
          }
        }
      });

      // Process the lead actions to include travel details
      const processedLeadActions = leadActions.map(action => {
        const actionObj = action.toJSON();
        
        // Find matching travel detail if any
        const travelDetail = travelDetails.find(td => td.bdm_lead_action_id === action.id);
        
        // Add travel form details if this is a travel-related action
        if (['Travel', 'RO Visit', 'HO Visit', 'BO Visit'].includes(actionObj.specific_action)) {
          if (actionObj.TravelDetails) {
            actionObj.travel_form_details = {
              id: actionObj.TravelDetails.id,
              taskType: actionObj.TravelDetails.taskType,
              branchName: actionObj.TravelDetails.branchName,
              regionalOfficeName: actionObj.TravelDetails.regionalOfficeName,
              purposeForVisit: actionObj.TravelDetails.purposeForVisit,
              concernPersonName: actionObj.TravelDetails.concernPersonName,
              adminTaskSelect: actionObj.TravelDetails.adminTaskSelect,
              remarks: actionObj.TravelDetails.remarks,
              hoSelection: actionObj.TravelDetails.hoSelection,
              modeOfTravel: actionObj.TravelDetails.modeOfTravel,
              travelFrom: actionObj.TravelDetails.travelFrom,
              travelTo: actionObj.TravelDetails.travelTo,
              reasonForTravel: actionObj.TravelDetails.reasonForTravel,
              mandatoryVisitImage: actionObj.TravelDetails.mandatoryVisitImage,
              optionalVisitImage: actionObj.TravelDetails.optionalVisitImage
            };
          }
        }
        
        // Add travel details if available
        if (travelDetail) {
          actionObj.travel_details = {
            travel_detailsId: travelDetail.id,
            checkin_time: moment(travelDetail.checkin_time).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
            checkout_time: travelDetail.checkout_time ?
              moment(travelDetail.checkout_time).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss') : null,
            checkin_location: {
              latitude: travelDetail.checkin_latitude,
              longitude: travelDetail.checkin_longitude
            },
            checkout_location: travelDetail.checkout_time ? {
              latitude: travelDetail.checkout_latitude,
              longitude: travelDetail.checkout_longitude
            } : null
          };
        }
        
        // Format dates using moment
        if (actionObj.action_date) {
          actionObj.action_date = moment(actionObj.action_date).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss');
        }
        
        if (actionObj.new_follow_up_date) {
          actionObj.new_follow_up_date = moment(actionObj.new_follow_up_date).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss');
        }
        
        // Remove the TravelDetails object to clean up response
        delete actionObj.TravelDetails;
        
        return actionObj;
      });

      // Group lead actions by lead ID
      const actionsGroupedByLead = {};
      
      processedLeadActions.forEach(action => {
        const leadId = action.LeadId;
        if (!actionsGroupedByLead[leadId]) {
          actionsGroupedByLead[leadId] = {
            leadInfo: action.Lead,
            actions: []
          };
        }
        
        // Remove the Lead object to avoid duplication
        delete action.Lead;
        
        actionsGroupedByLead[leadId].actions.push(action);
      });

      // Format the leads with their actions
      let formattedLeads = Object.values(actionsGroupedByLead);
      
      // Add leads that have no actions
      const leadsWithActions = new Set(formattedLeads.map(lead => lead.leadInfo.id));
      const leadsWithoutActions = leadsByBdm[bdmId].leads.filter(lead => !leadsWithActions.has(lead.id));
      
      // Format leads without actions
      const formattedLeadsWithoutActions = leadsWithoutActions.map(lead => {
        return {
          leadInfo: {
            id: lead.id,
            CustomerName: lead.CustomerName,
            MobileNo: lead.MobileNo,
            CustomerMailId: lead.CustomerMailId,
            location: lead.location,
            pincode: lead.pincode,
            state_name: lead.state_name,
            region_name: lead.region_name,
            category: lead.category,
            sub_category: lead.sub_category,
            agent_remark: lead.agent_remark,
            bdm_remark: lead.bdm_remark,
            follow_up_date: lead.follow_up_date
          },
          actions: [],
          action_status: "no_action_taken" // Flag to indicate no actions taken
        };
      });
      
      // Combine leads with and without actions
      formattedLeads = [...formattedLeads, ...formattedLeadsWithoutActions];

      // Calculate action statistics
      const totalActions = processedLeadActions.length;
      const confirmedActions = processedLeadActions.filter(a => a.action_type === 'confirm').length;
      const postponedActions = processedLeadActions.filter(a => a.action_type === 'postpone').length;
      const completedActions = processedLeadActions.filter(a => a.completion_status === 'completed').length;
      const pendingActions = processedLeadActions.filter(a => a.completion_status === 'not_completed').length;

      // Group actions by type
      const meetingActions = processedLeadActions.filter(a => a.specific_action && a.specific_action.toLowerCase().includes('meeting')).length;
      const roVisitActions = processedLeadActions.filter(a => a.specific_action === 'RO Visit').length;
      const hoVisitActions = processedLeadActions.filter(a => a.specific_action === 'HO Visit').length;
      const boVisitActions = processedLeadActions.filter(a => a.specific_action === 'BO Visit').length;
      const travelActions = processedLeadActions.filter(a => a.specific_action === 'Travel').length;
      const siteVisitActions = processedLeadActions.filter(a => a.specific_action === 'Site Visit').length;
      
      // Count leads without actions
      const noActionLeads = formattedLeadsWithoutActions.length;

      // Add to the BDMs array
      bdmsWithActions.push({
        bdmId: bdmId,
        bdmName: leadsByBdm[bdmId].bdmName,
        stats: {
          totalLeads: leadsByBdm[bdmId].leads.length,
          leadsWithActions: formattedLeads.length - noActionLeads,
          leadsWithoutActions: noActionLeads,
          totalActions: totalActions,
          confirmedActions: confirmedActions,
          postponedActions: postponedActions,
          completedActions: completedActions,
          pendingActions: pendingActions,
          meetingActions: meetingActions,
          roVisitActions: roVisitActions,
          hoVisitActions: hoVisitActions,
          boVisitActions: boVisitActions,
          travelActions: travelActions,
          siteVisitActions: siteVisitActions
        },
        leads: formattedLeads
      });
    }

    // Calculate overall statistics
    const totalLeads = agentLeads.length;
    const totalBdms = bdmsWithActions.length;
    const totalActions = bdmsWithActions.reduce((sum, bdm) => sum + bdm.stats.totalActions, 0);
    const completedActions = bdmsWithActions.reduce((sum, bdm) => sum + bdm.stats.completedActions, 0);
    const pendingActions = bdmsWithActions.reduce((sum, bdm) => sum + bdm.stats.pendingActions, 0);
    const leadsWithoutActions = bdmsWithActions.reduce((sum, bdm) => sum + bdm.stats.leadsWithoutActions, 0);

    // Return the response
    res.status(200).json({
      success: true,
      message: "Agent BDM follow-ups retrieved successfully",
      agentInfo: {
        agentId: agent.EmployeeId,
        agentName: agent.EmployeeName
      },
      dateRange: {
        startDate: moment(dateStart).format('DD-MM-YYYY'),
        endDate: moment(dateEnd).format('DD-MM-YYYY')
      },
      summary: {
        totalLeads: totalLeads,
        totalBdms: totalBdms,
        totalActions: totalActions,
        completedActions: completedActions,
        pendingActions: pendingActions,
        leadsWithoutActions: leadsWithoutActions,
        completionRate: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0
      },
      bdms: bdmsWithActions
    });

  } catch (error) {
    console.error('Error retrieving agent BDM follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};