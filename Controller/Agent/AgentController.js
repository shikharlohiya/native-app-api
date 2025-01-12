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
const Employee_Role = require("../../models/employeRole")
 
 
// const moment = require('moment-timezone');
// exports.createLead = async (req, res) => {
//   const t = await sequelize.transaction();

//   try {
//     const {
//       InquiryType,//mandate
//       call_status,//mandate, ---> failed then project is optional-- 'Connected','Failed' 
//       call_type,//mandate
//       site_location_address,//opt
//       Project,//mandate 
//       CustomerName,//---> mandote for connected
//       MobileNo,//mandate
//       AlternateMobileNo,//opt
//       WhatsappNo,//opt
//       CustomerMailId,//opt
//       state_name,//mandate for connected
//       region_name,// mandote for connected
//       location,//option
//       category,//mandote
//       sub_category,//mandote
//       agent_remark,//mandatoe
//       bdm_remark,//mandatore while bdm filing or zonal manger
//       follow_up_date,//mandote--> accoding to cateogory warm / hot/pending
//       lead_transfer_date,//not mandote for faild and category--> pending and cold
//       lead_owner,//mandate for connected
//       source_of_lead_generated,//mandote
//       close_month,//opt
//       AgentId,//mandote
//       BDMId,// here when lead created by 2 or 3 then put bdm id here and zonal manager here
//       pincode,//mandate for connected
//       lead_created_by,//mandote--> i am getting 1 or 2 or 3..1 for agent and 2 for bdm and 3 for zonal manger
//       RegionId,//mandote for connected
//     } = req.body;

//     // Check for existing lead with the same MobileNo
//     const existingLead = await Lead_Detail.findOne({
//       where: {
//         MobileNo: MobileNo,
//       },
//       transaction: t,
//     });

//     if (existingLead) {
//       await t.rollback();
//       return res.status(400).json({
//         message: "A lead with this phone number already exists.",
//         duplicateNumber: MobileNo,
//       });
//     }

//     // Determine if the lead is created by an agent or a BDM
//     const isAgentCreated = !!AgentId;
//     const isBDMCreated = !!BDMId;

//     if (!isAgentCreated && !isBDMCreated) {
//       await t.rollback();
//       return res.status(400).json({
//         message: "Either AgentId or BDMId must be provided.",
//       });
//     }
      

//     const leadData = {
//       InquiryType,
//       call_status,
//       call_type,
//       site_location_address,
//       Project,
//       CustomerName,
//       MobileNo,
//       AlternateMobileNo,
//       WhatsappNo,
//       CustomerMailId,
//       state_name,
//       region_name,
//       location,
//       category,
//       sub_category,
//       agent_remark: isAgentCreated ? agent_remark : null,
//       bdm_remark: isBDMCreated ? bdm_remark : null,
//       follow_up_date,
//       lead_transfer_date,
//       lead_owner,
//       source_of_lead_generated,
//       close_month,
//       AgentId: isAgentCreated ? AgentId : null,
//       BDMId: isBDMCreated ? BDMId : null,
//       pincode,
//       lead_created_by,
//       last_action: isAgentCreated
//         ? "Lead Created by Agent"
//         : "Lead Created by BDM",
//         RegionId
//     };

//     const lead = await Lead_Detail.create(leadData, { transaction: t });

//     // Create a log entry for the new lead
//     await LeadLog.create(
//       {
//         LeadDetailId: lead.id,
//         action_type: isAgentCreated
//           ? "Lead Created by Agent"
//           : "Lead Created by BDM",
//         category: category,
//         sub_category: sub_category,
//         remarks: isAgentCreated ? agent_remark : bdm_remark,
//         performed_by: isAgentCreated ? AgentId : BDMId,
//         follow_up_date: follow_up_date,
//       },
//       { transaction: t }
//     );

//     // If we reach here, no errors were thrown, so we commit the transaction
//     await t.commit();

//     res.status(201).json({
//       message: isAgentCreated
//         ? "Lead created successfully by Agent"
//         : "Lead created successfully by BDM",
//       lead,
//     });
//   } catch (error) {
//     // If we catch any error, we rollback the transaction
//     await t.rollback();
//     console.error("Error creating lead:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


// const validateLeadData = (data, call_status) => {
//   const errors = [];

//   // Mandatory fields for all cases
//   if (!data.InquiryType) errors.push("InquiryType is required");
//   if (!data.call_status) errors.push("call_status is required");
//   if (!data.call_type) errors.push("call_type is required");
//   if (!data.MobileNo) errors.push("MobileNo is required");
//   if (!data.category) errors.push("category is required");
//   if (!data.sub_category) errors.push("sub_category is required");
//   if (!data.source_of_lead_generated) errors.push("source_of_lead_generated is required");
//   if (!data.lead_created_by) errors.push("lead_created_by is required");
//   if (!data.created_by) errors.push("created_by is required");

//   // Additional validations for 'Connected' status
//   if (call_status === 'Connected') {
//       if (!data.CustomerName) errors.push("CustomerName is required for connected calls");
//       if (!data.state_name) errors.push("state_name is required for connected calls");
//       if (!data.region_name) errors.push("region_name is required for connected calls");
//       if (!data.pincode) errors.push("pincode is required for connected calls");
//       if (!data.RegionId) errors.push("RegionId is required for connected calls");
//       if (!data.Project) errors.push("Project is required for connected calls");
//       if (!data.lead_owner) errors.push("Lead Owner is required for connected calls");
//   }

//   // Category specific validations
//   if (['warm', 'hot', 'pending'].includes(data.category?.toLowerCase()) && !data.follow_up_date) {
//       errors.push("follow_up_date is required for warm/hot/pending categories");
//   }

//   // Lead owner validations based on creator type
//   if (data.lead_created_by === 1 && !data.AgentId) {
//       errors.push("AgentId is required when lead is created by agent");
//   }
//   if ((data.lead_created_by === 2 || data.lead_created_by === 3) && !data.BDMId) {
//       errors.push("BDMId is required when lead is created by BDM/Zonal Manager");
//   }

//   // BDM/Zonal Manager specific validations
//   if ((data.lead_created_by === 2 || data.lead_created_by === 3) && !data.bdm_remark) {
//       errors.push("bdm_remark is required for BDM/Zonal Manager created leads");
//   }

//   // Agent specific validations
//   if (data.lead_created_by === 1 && !data.agent_remark) {
//       errors.push("agent_remark is required for Agent created leads");
//   }

//   return errors;
// };
// const validateLeadData = (data, call_status) => {
//   // const errors = {};

//   // // Mandatory fields for all cases
//   // if (!data.InquiryType) errors.InquiryType = "InquiryType is required";
//   // if (!data.call_status) errors.call_status = "call_status is required";
//   // if (!data.call_type) errors.call_type = "call_type is required";
//   // if (!data.MobileNo) errors.MobileNo = "MobileNo is required";
//   // if (!data.category) errors.category = "category is required";
//   // if (!data.sub_category) errors.sub_category = "sub_category is required";
//   // if (!data.source_of_lead_generated) errors.source_of_lead_generated = "source_of_lead_generated is required";
//   // if (!data.lead_created_by) errors.lead_created_by = "lead_created_by is required";
//   // if (!data.created_by) errors.created_by = "created_by is required";

//   // // Additional validations for 'Connected' status
//   // if (call_status === 'Connected') {
//   //     if (!data.CustomerName) errors.CustomerName = "CustomerName is required for connected calls";
//   //     if (!data.state_name) errors.state_name = "state_name is required for connected calls";
//   //     if (!data.region_name) errors.region_name = "region_name is required for connected calls";
//   //     if (!data.pincode) errors.pincode = "pincode is required for connected calls";
//   //     if (!data.RegionId) errors.RegionId = "RegionId is required for connected calls";
//   //     if (!data.Project) errors.Project = "Project is required for connected calls";
//   //     if (!data.lead_owner) errors.lead_owner = "Lead Owner is required for connected calls";
//   // }

//   const errors = {};

//   // Basic check for empty or null values
//   Object.keys(data).forEach(key => {
//       if (data[key] === '' || data[key] === null) {
//           errors[key] = `${key} cannot be empty`;
//       }
//   });

//   // Mandatory fields for all cases
//   if (!data.InquiryType?.trim()) errors.InquiryType = "InquiryType is required";
//   if (!data.call_status?.trim()) errors.call_status = "call_status is required";
//   if (!data.call_type?.trim()) errors.call_type = "call_type is required";
//   if (!data.MobileNo?.trim()) errors.MobileNo = "MobileNo is required";
//   if (!data.category?.trim()) errors.category = "category is required";
//   if (!data.sub_category?.trim()) errors.sub_category = "sub_category is required";
//   if (!data.source_of_lead_generated) errors.source_of_lead_generated = "source_of_lead_generated is required";
//   if (!data.lead_created_by) errors.lead_created_by = "lead_created_by is required";
//   if (!data.created_by) errors.created_by = "created_by is required";

//   // Additional validations for 'Connected' status
//   if (call_status === 'Connected') {
//       if (!data.CustomerName?.trim()) errors.CustomerName = "CustomerName is required for connected calls";
//       if (!data.state_name?.trim()) errors.state_name = "state_name is required for connected calls";
//       if (!data.region_name?.trim()) errors.region_name = "region_name is required for connected calls";
//       if (!data.pincode?.trim()) errors.pincode = "pincode is required for connected calls";
//       if (!data.RegionId?.trim()) errors.RegionId = "RegionId is required for connected calls";
//       if (!data.Project?.trim()) errors.Project = "Project is required for connected calls";
//       if (!data.lead_owner?.trim()) errors.lead_owner = "Lead Owner is required for connected calls";
//   }


//   // Category specific validations
//   if (['warm', 'hot', 'pending'].includes(data.category?.toLowerCase()) && !data.follow_up_date) {
//       errors.follow_up_date = "follow_up_date is required for warm/hot/pending categories";
//   }

//   // Lead owner validations based on creator type
//   if (data.lead_created_by === 1 && !data.AgentId) {
//       errors.AgentId = "AgentId is required when lead is created by agent";
//   }
//   if ((data.lead_created_by === 2 || data.lead_created_by === 3) && !data.BDMId) {
//       errors.BDMId = "BDMId is required when lead is created by BDM/Zonal Manager";
//   }

//   // BDM/Zonal Manager specific validations
//   if ((data.lead_created_by === 2 || data.lead_created_by === 3) && !data.bdm_remark) {
//       errors.bdm_remark = "bdm_remark is required for BDM/Zonal Manager created leads";
//   }

//   // Agent specific validations
//   if (data.lead_created_by === 1 && !data.agent_remark) {
//       errors.agent_remark = "agent_remark is required for Agent created leads";
//   }

//   return Object.keys(errors).length > 0 ? errors : null;
// };



//for only


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
          created_by
      } = req.body;

      // Validate all required fields
      // const validationErrors = validateLeadData(req.body, call_status);
      // if (validationErrors.length > 0) {
      //     await t.rollback();
      //     return res.status(400).json({
      //         success: false,
      //         message: "Validation failed",
      //         errors: validationErrors
      //     });
      // }


      const validationErrors = validateLeadData(req.body, call_status);
// if (validationErrors) {
//     await t.rollback();
//     return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: validationErrors  // This will now be an object with field keys
//     });
// }

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
          created_by
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


//update
// Validation function for edit lead



// const validateEditLeadData = (data = {}, originalData = {}) => {
//     const errors = {};
    
//     try {
//         // Phone number validation if being updated
//         if (data.MobileNo) {
//             const phoneRegex = /^\d{10}$/;
//             if (!phoneRegex.test(data.MobileNo)) {
//                 errors.MobileNo = "Invalid phone number format. Must be 10 digits";
//             }
//         }

//         // Email validation if being updated
//         if (data.CustomerMailId) {
//             const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//             if (!emailRegex.test(data.CustomerMailId)) {
//                 errors.CustomerMailId = "Invalid email format";
//             }
//         }

//         // Category specific validations
//         if (data.category && ['warm', 'hot', 'pending'].includes(data.category.toLowerCase())) {
//             if (!data.follow_up_date && !originalData.follow_up_date) {
//                 errors.follow_up_date = "Follow up date is required for warm/hot/pending categories";
//             }
//         }

//         // Connected call status validations
//         if (data.call_status === 'Connected') {
//             const requiredFields = {
//                 CustomerName: "Customer name is required for connected calls",
//                 state_name: "State name is required for connected calls",
//                 region_name: "Region name is required for connected calls",
//                 pincode: "Pincode is required for connected calls",
//                 RegionId: "Region ID is required for connected calls",
//                 Project: "Project is required for connected calls",
//                 BDMId: "BDM ID is required for connected calls"
//             };

//             Object.entries(requiredFields).forEach(([field, message]) => {
//                 if (!data[field] && !originalData[field]) {
//                     errors[field] = message;
//                 }
//             });
//         }

//         // Role specific validations for remarks
//         if (data.lead_created_by === 1 && data.agent_remark === '') {
//             errors.agent_remark = "Agent remark cannot be empty for agent updates";
//         }
//         if ((data.lead_created_by === 2 || data.lead_created_by === 3) && data.bdm_remark === '') {
//             errors.bdm_remark = "BDM remark cannot be empty for BDM/Zonal Manager updates";
//         }

//     } catch (error) {
//         console.error('Validation error:', error);
//         errors.general = "Error during validation";
//     }

//     return errors;
// };

// // Function to identify significant changes
// const getSignificantChanges = (oldData, newData) => {
//     const significantChanges = [];
//     const fieldsToTrack = [
//         'category',
//         'sub_category',
//         'follow_up_date',
//         'call_status',
//         'lead_owner',
//         'Project',
//         'CustomerName',
//         'state_name',
//         'region_name',
//         'RegionId'
//     ];

//     fieldsToTrack.forEach(field => {
//         if (newData[field] !== undefined && newData[field] !== oldData[field]) {
//             significantChanges.push(field);
//         }
//     });

//     return significantChanges;
// };

// // Function to generate action type based on changes
// const generateActionType = (changes, userData) => {
//     if (changes.includes('category') || changes.includes('sub_category')) {
//         return 'Category Update';
//     } else if (changes.includes('follow_up_date')) {
//         return 'Follow-up Update';
//     } else if (changes.includes('lead_owner')) {
//         return 'Lead Transfer';
//     } else if (changes.includes('call_status')) {
//         return 'Status Update';
//     } else {
//         return 'General Update';
//     }
// };

// exports.updateLead = async (req, res) => {
//     const t = await sequelize.transaction();

//     try {
//         const { id } = req.params;
//         const updateData = req.body;
//      const updatedBy = updateData.updated_by; // Get updated_by from request body

//         // Find existing lead
//         const existingLead = await Lead_Detail.findByPk(id, { transaction: t });
        
//         if (!existingLead) {
//             await t.rollback();
//             return res.status(404).json({
//                 success: false,
//                 message: "Lead not found"
//             });
//         }

//         // Validate update data
//         const validationErrors = validateEditLeadData(updateData, existingLead);
//         if (Object.keys(validationErrors).length > 0) {
//             await t.rollback();
//             return res.status(400).json({
//                 success: false,
//                 message: "Validation failed",
//                 errors: validationErrors
//             });
//         }

//         // Check for duplicate phone number if being updated
//         if (updateData.MobileNo && updateData.MobileNo !== existingLead.MobileNo) {
//             const duplicateLead = await Lead_Detail.findOne({
//                 where: { 
//                     MobileNo: updateData.MobileNo,
//                     id: { [Sequelize.Op.ne]: id }
//                 },
//                 include: [{
//                     model: Employee,
//                     as: 'Agent',
//                     attributes: ['EmployeeName']
//                 }, {
//                     model: Employee,
//                     as: 'BDM',
//                     attributes: ['EmployeeName']
//                 }],
//                 transaction: t
//             });

//             if (duplicateLead) {
//                 let creatorType = duplicateLead.lead_created_by === 1 ? 'Agent' : 
//                                 duplicateLead.lead_created_by === 2 ? 'BDM' : 'Zonal Manager';
//                 let creatorName = duplicateLead.lead_created_by === 1 ? 
//                                 duplicateLead.Agent?.EmployeeName : 
//                                 duplicateLead.BDM?.EmployeeName || 'Unknown';

//                 await t.rollback();
//                 return res.status(400).json({
//                     success: false,
//                     message: `A lead with this phone number already exists. Lead was created by ${creatorType} ${creatorName}`,
//                     duplicateNumber: updateData.MobileNo
//                 });
//             }
//         }

//         // Get significant changes
//         const significantChanges = getSignificantChanges(existingLead.toJSON(), updateData);
        
//         // If no changes, return early
//         if (significantChanges.length === 0 && !updateData.remarks) {
//             await t.rollback();
//             return res.status(200).json({
//                 success: true,
//                 message: "No significant changes detected",
//                 lead: existingLead
//             });
//         }

//         // Update lead
//         const updatedLead = await existingLead.update(updateData, { transaction: t });

//         // Create log entry for the update
//         const actionType = generateActionType(significantChanges, req.user);
        
//         await LeadLog.create({
//             LeadDetailId: id,
//             action_type: actionType,
//             category: updateData.category || existingLead.category,
//             sub_category: updateData.sub_category || existingLead.sub_category,
//             remarks: updateData.remarks || `Updated fields: ${significantChanges.join(', ')}`,
//             performed_by: updatedBy,
//             follow_up_date: updateData.follow_up_date || existingLead.follow_up_date
//         }, { transaction: t });

//         await t.commit();

//         return res.status(200).json({
//             success: true,
//             message: "Lead updated successfully",
//             lead: updatedLead,
//             changedFields: significantChanges
//         });

//     } catch (error) {
//         await t.rollback();
//         console.error("Error updating lead:", error);

//         if (error.name === 'SequelizeValidationError') {
//             return res.status(400).json({
//                 success: false,
//                 message: "Validation error",
//                 errors: error.errors.map(e => e.message)
//             });
//         }

//         return res.status(500).json({
//             success: false,
//             message: "Error updating lead",
//             error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//         });
//     }
// };



// message will be changed---->>>>>

// const validateEditLeadData = (data = {}, originalData = {}) => {
//     const errors = {};
    
//     try {
//         // Basic field validations
//         if (data.MobileNo) {
//             const phoneRegex = /^\d{10}$/;
//             if (!phoneRegex.test(data.MobileNo)) {
//                 errors.MobileNo = "Invalid phone number format. Must be 10 digits";
//             }
//         }

//         if (data.CustomerMailId) {
//             const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//             if (!emailRegex.test(data.CustomerMailId)) {
//                 errors.CustomerMailId = "Invalid email format";
//             }
//         }

//         // Category specific validations
//         if (data.category && ['warm', 'hot', 'pending'].includes(data.category.toLowerCase())) {
//             if (!data.follow_up_date && !originalData.follow_up_date) {
//                 errors.follow_up_date = "Follow up date is required for warm/hot/pending categories";
//             }
//         }

//         // Connected call status validations
//         if (data.call_status === 'Connected') {
//             const requiredFields = {
//                 CustomerName: "Customer name is required for connected calls",
//                 state_name: "State name is required for connected calls",
//                 region_name: "Region name is required for connected calls",
//                 pincode: "Pincode is required for connected calls",
//                 RegionId: "Region ID is required for connected calls",
//                 Project: "Project is required for connected calls",
//                 BDMId: "BDM ID is required for connected calls"
//             };

//             Object.entries(requiredFields).forEach(([field, message]) => {
//                 if (!data[field] && !originalData[field]) {
//                     errors[field] = message;
//                 }
//             });
//         }

//         // Role specific validations for remarks
//         if (data.lead_created_by === 1 && data.agent_remark === '') {
//             errors.agent_remark = "Agent remark cannot be empty for agent updates";
//         }
//         if ((data.lead_created_by === 2 || data.lead_created_by === 3) && data.bdm_remark === '') {
//             errors.bdm_remark = "BDM remark cannot be empty for BDM/Zonal Manager updates";
//         }

//     } catch (error) {
//         console.error('Validation error:', error);
//         errors.general = "Error during validation";
//     }

//     return errors;
// };

// // Update Lead Controller
// exports.updateLead = async (req, res) => {
//     const t = await sequelize.transaction();

//     try {
//         const { id } = req.params;
//         const updateData = { ...req.body };

//         // Check if updated_by exists and is valid
//         if (!updateData.updated_by) {
//             await t.rollback();
//             return res.status(400).json({
//                 success: false,
//                 message: "updated_by field is required"
//             });
//         }

//         // Convert updated_by to number if it's a string
//         const performedBy = typeof updateData.updated_by === 'string' ? 
//                         parseInt(updateData.updated_by, 10) : 
//                         updateData.updated_by;

//         // Remove updated_by from updateData
//         delete updateData.updated_by;

//         // Find existing lead
//         const existingLead = await Lead_Detail.findOne({
//             where: { id },
//             include: [
//                 {
//                     model: Employee,
//                     as: 'Agent',
//                     attributes: ['EmployeeId', 'EmployeeName']
//                 },
//                 {
//                     model: Employee,
//                     as: 'BDM',
//                     attributes: ['EmployeeId', 'EmployeeName']
//                 }
//             ],
//             transaction: t
//         });

//         if (!existingLead) {
//             await t.rollback();
//             return res.status(404).json({
//                 success: false,
//                 message: "Lead not found"
//             });
//         }

//         // Validate update data
//         const validationErrors = validateEditLeadData(updateData, existingLead);
//         if (Object.keys(validationErrors).length > 0) {
//             await t.rollback();
//             return res.status(400).json({
//                 success: false,
//                 message: "Validation failed",
//                 errors: validationErrors
//             });
//         }

//         // Check for duplicate phone number
//         if (updateData.MobileNo && updateData.MobileNo !== existingLead.MobileNo) {
//             const duplicateLead = await Lead_Detail.findOne({
//                 where: { 
//                     MobileNo: updateData.MobileNo,
//                     id: { [Sequelize.Op.ne]: id }
//                 },
//                 include: [{
//                     model: Employee,
//                     as: 'Agent',
//                     attributes: ['EmployeeName']
//                 }, {
//                     model: Employee,
//                     as: 'BDM',
//                     attributes: ['EmployeeName']
//                 }],
//                 transaction: t
//             });

//             if (duplicateLead) {
//                 let creatorType = duplicateLead.lead_created_by === 1 ? 'Agent' : 
//                                 duplicateLead.lead_created_by === 2 ? 'BDM' : 'Zonal Manager';
//                 let creatorName = duplicateLead.lead_created_by === 1 ? 
//                                 duplicateLead.Agent?.EmployeeName : 
//                                 duplicateLead.BDM?.EmployeeName || 'Unknown';

//                 await t.rollback();
//                 return res.status(400).json({
//                     success: false,
//                     message: `A lead with this phone number already exists. Lead was created by ${creatorType} ${creatorName}`,
//                     duplicateNumber: updateData.MobileNo
//                 });
//             }
//         }

//         // Track changes
//         const allChanges = getAllChanges(existingLead.toJSON(), updateData);
//         if (allChanges.length === 0) {
//             await t.rollback();
//             return res.status(200).json({
//                 success: true,
//                 message: "No changes detected",
//                 lead: existingLead
//             });
//         }

//         // Get significant changes
//         const significantChanges = getSignificantChanges(allChanges);
        
//         // Update lead
//         const updatedLead = await existingLead.update(updateData, { transaction: t });

//         // Create log entry
//         const actionType = generateActionType(significantChanges);
//         const changeDetails = {
//             timestamp: new Date().toISOString(),
//             updater: {
//                 id: performedBy
//             },
//             changes: allChanges
//         };

//         await LeadLog.create({
//             LeadDetailId: id,
//             action_type: actionType,
//             category: updateData.category || existingLead.category,
//             sub_category: updateData.sub_category || existingLead.sub_category,
//             remarks: updateData.remarks || `Updated ${allChanges.length} fields`,
//             performed_by: performedBy,
//             follow_up_date: updateData.follow_up_date || existingLead.follow_up_date,
//             extra_fields3: JSON.stringify(changeDetails)
//         }, { transaction: t });

//         await t.commit();

//         // Fetch updated lead with associations
//         const finalLead = await Lead_Detail.findOne({
//             where: { id },
//             include: [
//                 {
//                     model: Employee,
//                     as: 'Agent',
//                     attributes: ['EmployeeId', 'EmployeeName']
//                 },
//                 {
//                     model: Employee,
//                     as: 'BDM',
//                     attributes: ['EmployeeId', 'EmployeeName']
//                 }
//             ]
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Lead updated successfully",
//             lead: finalLead,
//             changes: allChanges
//         });

//     } catch (error) {
//         await t.rollback();
//         console.error("Error updating lead:", error);

//         if (error.name === 'SequelizeValidationError') {
//             return res.status(400).json({
//                 success: false,
//                 message: "Validation error",
//                 errors: error.errors.map(e => e.message)
//             });
//         }

//         return res.status(500).json({
//             success: false,
//             message: "Error updating lead",
//             error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//         });
//     }
// };

// // Helper functions
// function getAllChanges(oldData, newData) {
//     const changes = [];
//     const excludeFields = ['updatedAt', 'createdAt', 'id'];
    
//     Object.keys(newData).forEach(field => {
//         if (!excludeFields.includes(field) && newData[field] !== oldData[field]) {
//             changes.push({
//                 field,
//                 from: oldData[field],
//                 to: newData[field]
//             });
//         }
//     });
    
//     return changes;
// }

// function getSignificantChanges(allChanges) {
//     const significantFields = [
//         'category', 'sub_category', 'follow_up_date', 'call_status',
//         'lead_owner', 'Project', 'CustomerName', 'state_name',
//         'region_name', 'RegionId', 'MobileNo', 'CustomerMailId',
//         'pincode', 'location', 'agent_remark', 'bdm_remark',
//         'AlternateMobileNo', 'WhatsappNo', 'site_location_address',
//         'BDMId', 'source_of_lead_generated', 'lead_created_by'
//     ];

//     return allChanges.filter(change => significantFields.includes(change.field));
// }

// function generateActionType(changes) {
//     const changedFields = changes.map(c => c.field);
    
//     if (changedFields.includes('category') || changedFields.includes('sub_category')) {
//         return 'Category Update';
//     } else if (changedFields.includes('follow_up_date')) {
//         return 'Follow-up Update';
//     } else if (changedFields.includes('lead_owner')) {
//         return 'Lead Transfer';
//     } else if (changedFields.includes('call_status')) {
//         return 'Status Update';
//     } else if (changedFields.includes('CustomerName') || changedFields.includes('MobileNo')) {
//         return 'Customer Info Update';
//     }
//     return 'General Update';
// }



//changes on 9jan



// // Validation function
// const validateEditLeadData = (data = {}, originalData = {}) => {
//     const errors = {};
    
//     try {
//         // Basic field validations
//         if (data.MobileNo) {
//             const phoneRegex = /^\d{10}$/;
//             if (!phoneRegex.test(data.MobileNo)) {
//                 errors.MobileNo = "Invalid phone number format. Must be 10 digits";
//             }
//         }

//         if (data.CustomerMailId) {
//             const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//             if (!emailRegex.test(data.CustomerMailId)) {
//                 errors.CustomerMailId = "Invalid email format";
//             }
//         }

//         // Category specific validations
//         if (data.category && ['warm', 'hot', 'pending'].includes(data.category.toLowerCase())) {
//             if (!data.follow_up_date && !originalData.follow_up_date) {
//                 errors.follow_up_date = "Follow up date is required for warm/hot/pending categories";
//             }
            
            
//         }

        
 

//         // Connected call status validations
//         if (data.call_status === 'Connected') {
//             const requiredFields = {
//                 CustomerName: "Customer name is required for connected calls",
//                 state_name: "State name is required for connected calls",
//                 region_name: "Region name is required for connected calls",
//                 pincode: "Pincode is required for connected calls",
//                 RegionId: "Region ID is required for connected calls",
//                 Project: "Project is required for connected calls",
//                 // BDMId: "BDM ID is required for connected calls"
//             };

//                    if (data.category && ['hot', 'warm'].includes(data.category.toLowerCase())) {
//                 if (!data.BDMId && !originalData.BDMId) {
//                     errors.BDMId = "BDM ID is required for connected calls with hot/warm category";
//                 }
//             }

//             Object.entries(requiredFields).forEach(([field, message]) => {
//                 if (!data[field] && !originalData[field]) {
//                     errors[field] = message;
//                 }
//             });
//         }

//         // Role specific validations for remarks
//         if (data.lead_created_by === 1 && data.agent_remark === '') {
//             errors.agent_remark = "Agent remark cannot be empty for agent updates";
//         }
//         if ((data.lead_created_by === 2 || data.lead_created_by === 3) && data.bdm_remark === '') {
//             errors.bdm_remark = "BDM remark cannot be empty for BDM/Zonal Manager updates";
//         }

//     } catch (error) {
//         console.error('Validation error:', error);
//         errors.general = "Error during validation";
//     }

//     return errors;
// };



//connected -->
// Pending -->







const isEmpty = (value) => {
    return value === null || value === undefined || value === '' || value === 'null';
};

const getValue = (field, data, originalData) => {
    const newValue = data[field];
    const originalValue = originalData[field];
    return isEmpty(newValue) ? originalValue : newValue;
};





// const validateEditLeadData = (data = {}, originalData = {}) => {
//     const errors = {};
    
//     try {
//         // Get current values
//         const currentCategory = (getValue('category', data, originalData) || '').toLowerCase();
//         const currentCallStatus = getValue('call_status', data, originalData);
//         const currentBDMId = getValue('BDMId', data, originalData);

//         // Basic field validations
//         if (!isEmpty(data.MobileNo)) {
//             const phoneRegex = /^\d{10}$/;
//             if (!phoneRegex.test(data.MobileNo)) {
//                 errors.MobileNo = "Invalid phone number format. Must be 10 digits";
//             }
//         }

//         if (!isEmpty(data.CustomerMailId)) {
//             const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//             if (!emailRegex.test(data.CustomerMailId)) {
//                 errors.CustomerMailId = "Invalid email format";
//             }
//         }

//         // BDM validation for hot/warm/connected cases
//         if (isEmpty(currentBDMId)) {
//             if (['hot', 'warm'].includes(currentCategory)) {
//                 errors.BDMId = "BDM must be assigned for hot/warm leads";
//             } else if (currentCallStatus === 'Connected' && currentCategory !== 'pending') {
//                 errors.BDMId = "BDM must be assigned for connected calls except pending category";
//             }
//         }

//         // Category specific validations for hot/warm
//         if (['hot', 'warm'].includes(currentCategory)) {
//             const requiredFields = {
//                 follow_up_date: "Follow up date is required for hot/warm leads",
//                 Project: "Project is required for hot/warm leads",
//                 state_name: "State name is required for hot/warm leads",
//                 region_name: "Region name is required for hot/warm leads",
//                 pincode: "Pincode is required for hot/warm leads",
//                 RegionId: "Region ID is required for hot/warm leads",
//                 CustomerName: "Customer name is required for hot/warm leads"
//             };

//             Object.entries(requiredFields).forEach(([field, message]) => {
//                 const value = getValue(field, data, originalData);
//                 if (isEmpty(value)) {
//                     errors[field] = message;
//                 }
//             });
//         }

//         // Follow up date validation for pending category
//         if (currentCategory === 'pending') {
//             const followUpDate = getValue('follow_up_date', data, originalData);
//             if (isEmpty(followUpDate)) {
//                 errors.follow_up_date = "Follow up date is required for pending category";
//             }
//         }

//         // Connected call status validations
//         if (currentCallStatus === 'Connected') {
//             const connectedRequiredFields = {
//                 CustomerName: "Customer name is required for connected calls",
//                 state_name: "State name is required for connected calls",
//                 region_name: "Region name is required for connected calls",
//                 pincode: "Pincode is required for connected calls",
//                 RegionId: "Region ID is required for connected calls",
//                 Project: "Project is required for connected calls"
//             };

//             Object.entries(connectedRequiredFields).forEach(([field, message]) => {
//                 const value = getValue(field, data, originalData);
//                 if (isEmpty(value)) {
//                     errors[field] = message;
//                 }
//             });
//         }

//         // Role specific validations for remarks
//         const agentRemark = getValue('agent_remark', data, originalData);
//         const bdmRemark = getValue('bdm_remark', data, originalData);
//         const leadCreatedBy = getValue('lead_created_by', data, originalData);

//         if (leadCreatedBy === 1 && isEmpty(agentRemark)) {
//             errors.agent_remark = "Agent remark cannot be empty for agent updates";
//         }
//         if ((leadCreatedBy === 2 || leadCreatedBy === 3) && isEmpty(bdmRemark)) {
//             errors.bdm_remark = "BDM remark cannot be empty for BDM/Zonal Manager updates";
//         }

//     } catch (error) {
//         console.error('Validation error:', error);
//         errors.general = "Error during validation";
//     }

//     return errors;
// };






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




// Function to track changes
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




//for category is pending





exports.getLeadByMobileNo = async (req, res) => {
  try {
      const { mobileNo } = req.params;

      const lead = await Lead_Detail.findOne({
          where: {
              [Op.or]: [
                  { MobileNo: mobileNo },
                  { AlternateMobileNo: mobileNo },
                  { WhatsappNo: mobileNo },
              ],
          },
          include: [{
              model: Employee,
              as: 'Agent',
              attributes: ['EmployeeName']
          }, {
              model: Employee,
              as: 'BDM',
              attributes: ['EmployeeName']
          }]
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

      res.status(200).json({
          success: true,
          message: responseMessage,
          lead: {
              ...lead.toJSON(),
              lastFollowUpDate: lead.follow_up_date,
              lastFollowUpBy: lead.Agent?.EmployeeName || lead.BDM?.EmployeeName || 'Unknown'
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






//get lead by agentId

//v1 changes on 8 jan


// exports.getLeadsByAgentId = async (req, res) => {
//   try {
//     const { agentId } = req.params;

//     const employee = await Employee.findOne({
//       where: { EmployeeId: agentId },
//       include: [
//         {
//           model: Campaign,
//           through: { attributes: [] },
//           attributes: ["CampaignId"],
//         },
//       ],
//     });

//     if (!employee) {
//       return res.status(404).json({ message: "Agent not found" });
//     }

//     const assignedCampaignIds = employee.Campaigns.map(
//       (campaign) => campaign.CampaignId
//     );
//     console.log(assignedCampaignIds, '-----------1212');
    

//     const leads = await Lead_Detail.findAll({
//       where: {
//         AgentId: agentId,
//         source_of_lead_generated: {
//           [Op.in]: assignedCampaignIds,
//         },
//       },
//       include: [
//         { model: Employee, as: "Agent" },
//         { model: Employee, as: "BDM" },
//         { model: Employee, as: "Superviser" },
//         {
//           model: Campaign,
//           as: "Campaign",
//           attributes: ["CampaignId", "CampaignName"],
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//     });

//     res.status(200).json({ leads });
//   } catch (error) {
//     console.error("Error retrieving leads:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// v2


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
  
      // Get category counts (unaffected by filters)
      const categoryCounts = await Promise.all([
        Lead_Detail.count({
          where: {
            AgentId: agentId,
            source_of_lead_generated: { [Op.in]: assignedCampaignIds },
            category: 'hot'
          }
        }),
        Lead_Detail.count({
          where: {
            AgentId: agentId,
            source_of_lead_generated: { [Op.in]: assignedCampaignIds },
            category: 'warm'
          }
        }),
        Lead_Detail.count({
          where: {
            AgentId: agentId,
            source_of_lead_generated: { [Op.in]: assignedCampaignIds },
            category: 'cold'
          }
        }),
        Lead_Detail.count({
          where: {
            AgentId: agentId,
            source_of_lead_generated: { [Op.in]: assignedCampaignIds },
            category: 'pending'
          }
        }),
        Lead_Detail.count({
          where: {
            AgentId: agentId,
            source_of_lead_generated: { [Op.in]: assignedCampaignIds },
            category: 'closed'
          }
        })
      ]);
  
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
  
      // Sorting
      const order = req.query.sort
        ? [[req.query.sort, "ASC"]]
        : [["createdAt", "DESC"]];
  
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
  
      // Prepare category counts object
      const stats = {
        hot: categoryCounts[0],
        warm: categoryCounts[1],
        cold: categoryCounts[2],
        pending: categoryCounts[3],
        closed: categoryCounts[4],
        total: categoryCounts.reduce((a, b) => a + b, 0)
      };
  
      res.status(200).json({
        leads,
        currentPage: page,
        totalPages,
        totalLeads: totalCount,
        stats // Added category counts to response
      });
  
    } catch (error) {
      console.error("Error retrieving leads:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };


  //for to export the data


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




//changes on 08/01/25


// exports.getAgentDistinctValues = async (req, res) => {
//   const field = req.params.field;
//   const agentId = req.params.agentId;

//   try {
//     let values;

//     // First get the agent's assigned campaigns
//     const employee = await Employee.findOne({
//       where: { EmployeeId: agentId },
//       include: [
//         {
//           model: Campaign,
//           through: { attributes: [] },
//           attributes: ["CampaignId"],
//         },
//       ],
//     });

//     if (!employee) {
//       return res.status(404).json({ message: "Agent not found" });
//     }

//     const assignedCampaignIds = employee.Campaigns.map(
//       (campaign) => campaign.CampaignId
//     );

//     // Base where clause for agent's leads
//     const baseWhereClause = {
//       AgentId: agentId,
//       source_of_lead_generated: {
//         [Op.in]: assignedCampaignIds,
//       }
//     };

//     switch (field) {
//       case 'InquiryType':
//       case 'Project':
//       case 'region_name':
//       case 'category':
//       case 'sub_category':
//         values = await Lead_Detail.findAll({
//           attributes: [[Sequelize.fn('DISTINCT', Sequelize.col(field)), field]],
//           where: {
//             ...baseWhereClause,
//             [field]: {
//               [Op.ne]: null,
//               [Op.ne]: ''
//             }
//           },
//           order: [[field, 'ASC']]
//         });
//         break;

//       case 'campaignName':
//         // Only return campaigns that the agent has worked with
//         values = await Campaign.findAll({
//           attributes: ['CampaignId', 'CampaignName'],
//           where: {
//             CampaignId: {
//               [Op.in]: assignedCampaignIds
//             }
//           },
//           order: [['CampaignName', 'ASC']]
//         });
//         break;

//       case 'bdmName':
//         // Only return BDMs that have worked with this agent
//         values = await Employee.findAll({
//           attributes: ['EmployeeId', 'EmployeeName'],
//           where: {
//             '$role.RoleId$': 2, // 2 is the RoleId for Business Development Manager
//             EmployeeId: {
//               [Op.in]: Sequelize.literal(`(
//                 SELECT DISTINCT BDMId 
//                 FROM lead_detail 
//                 WHERE AgentId = '${agentId}'
//                 AND source_of_lead_generated IN (${assignedCampaignIds.length ? assignedCampaignIds.join(',') : 'NULL'})
//                 AND BDMId IS NOT NULL
//               )`)
//             }
//           },
//           include: [{
//             model: Employee_Role,
//             as: 'role',
//             attributes: []
//           }],
//           order: [['EmployeeName', 'ASC']]
//         });
//         break;

//       case 'agentName':
//         // Return only this agent's details
//         values = await Employee.findAll({
//           attributes: ['EmployeeId', 'EmployeeName'],
//           where: {
//             EmployeeId: agentId,
//             '$role.RoleId$': 1 // 1 is the RoleId for Agent
//           },
//           include: [{
//             model: Employee_Role,
//             as: 'role',
//             attributes: []
//           }],
//           order: [['EmployeeName', 'ASC']]
//         });
//         break;

//       default:
//         return res.status(400).json({ 
//           message: `Invalid field specified: ${field}. Valid fields are: InquiryType, Project, region_name, category, sub_category, campaignName, bdmName, agentName` 
//         });
//     }

//     // Format the response based on the field type
//     let formattedValues;
//     if (field === 'campaignName') {
//       formattedValues = values.map(campaign => ({
//         value: campaign.CampaignId,
//         campaign: campaign.CampaignName
//       }));
//     } else if (field === 'bdmName' || field === 'agentName') {
//       formattedValues = values.map(employee => ({
//         value: employee.EmployeeId,
//         label: employee.EmployeeName
//       })).filter(item => item.value && item.label); // Filter out any null values
//     } else {
//       formattedValues = values
//         .map(item => ({
//           value: item[field],
//           label: item[field]
//         }))
//         .filter(item => item.value && item.label); // Filter out any null values
//     }

//     res.json(formattedValues);
//   } catch (error) {
//     console.error(`Error fetching distinct values for field '${field}' and agent '${agentId}':`, error);
//     res.status(500).json({ 
//       message: `An error occurred while fetching ${field} values for agent ${agentId}`,
//       error: error.message 
//     });
//   }
// };





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


 

 


 
// exports.getCallAnalytics = async (req, res) => {
//     try {
//         const startDate = req.query.startDate || moment().subtract(7, 'days').format('YYYY-MM-DD');
//         const endDate = req.query.endDate || moment().format('YYYY-MM-DD');
//         const agentName = req.query.agentName;
        

        
//         if (!moment(startDate).isValid() || !moment(endDate).isValid()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid date range provided"
//             });
//         }

//         // Main query with optional agent filter
//         let query = `
//             SELECT 
//                 emp.EmployeeName as agent_name,
//                 ic.id,
//                 ic.call_id,
//                 ic.caller_number,
//                 ic.agent_number,
//                 ic.connected_at,
//                 ic.ended_at,
//                 ic.created_at,
//                 ld.CustomerName as lead_name,
//                 ld.location as lead_location,
//                 CASE 
//                     WHEN ic.connected_at IS NULL THEN 'Missed'
//                     WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL THEN 'Connected'
//                     ELSE 'Unknown'
//                 END as call_status,
//                 CASE 
//                     WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
//                     THEN TIMESTAMPDIFF(SECOND, ic.connected_at, ic.ended_at)
//                     ELSE 0
//                 END as call_duration_seconds
//             FROM incoming_calls ic
//             LEFT JOIN lead_detail ld ON ic.caller_number = ld.MobileNo
//             LEFT JOIN employee_table emp ON ic.agent_number = emp.EmployeePhone
//             WHERE ic.ivr_number = '7610255555'
//             AND ic.created_at BETWEEN :startDate AND :endDate
//             ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
//             ORDER BY ic.created_at DESC
//         `;

//         const replacements = { startDate, endDate };
//         if (agentName) {
//             replacements.agentName = agentName;
//         }

//         const callDetails = await sequelize.query(query, {
//             replacements,
//             type: QueryTypes.SELECT
//         });

//         // Process the data
//         const agentMap = new Map();
//         let totalCalls = 0;
//         let totalConnected = 0;
//         let totalMissed = 0;
//         let uniqueLeads = new Set();

//         callDetails.forEach(call => {
//             if (!call.agent_name) return;

//             totalCalls++;
//             if (call.lead_name) uniqueLeads.add(call.lead_name);
//             if (call.call_status === 'Connected') totalConnected++;
//             if (call.call_status === 'Missed') totalMissed++;

//             if (!agentMap.has(call.agent_name)) {
//                 agentMap.set(call.agent_name, {
//                     agent_name: call.agent_name,
//                     agent_number: call.agent_number,
//                     total_calls: 0,
//                     missed_calls: 0,
//                     connected_calls: 0,
//                     total_duration_minutes: 0,
//                     connected_details: [],
//                     missed_details: []
//                 });
//             }

//             const agentData = agentMap.get(call.agent_name);
//             agentData.total_calls++;

//             const callDetail = {
//                 call_id: call.call_id,
//                 date: moment(call.created_at).format('YYYY-MM-DD'),
//                 time: moment(call.created_at).format('HH:mm:ss'),
//                 caller_number: call.caller_number,
//                 duration_minutes: (call.call_duration_seconds / 60).toFixed(2)
//             };

//             const customerDetail = call.lead_name ? {
//                 customer_name: call.lead_name,
//                 location: call.lead_location
//             } : null;

//             if (call.call_status === 'Connected') {
//                 agentData.connected_calls++;
//                 agentData.total_duration_minutes += call.call_duration_seconds / 60;
//                 callDetail.connected_at = moment(call.connected_at).format('YYYY-MM-DD HH:mm:ss');
//                 callDetail.ended_at = moment(call.ended_at).format('YYYY-MM-DD HH:mm:ss');
//                 agentData.connected_details.push({
//                     ...callDetail,
//                     customer_details: customerDetail
//                 });
//             } else {
//                 agentData.missed_calls++;
//                 agentData.missed_details.push({
//                     ...callDetail,
//                     customer_details: customerDetail
//                 });
//             }
//         });

//         const agentStats = Array.from(agentMap.values()).map(agent => ({
//             agent_name: agent.agent_name,
//             agent_number: agent.agent_number,
//             total_calls: agent.total_calls,
//             connected_calls: agent.connected_calls,
//             missed_calls: agent.missed_calls,
//             total_duration_minutes: agent.total_duration_minutes.toFixed(2),
//             avg_call_duration_minutes: agent.connected_calls > 0 ? 
//                 (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
//             connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
//             missed_rate: ((agent.missed_calls / agent.total_calls) * 100).toFixed(2) + '%',
//             connected_calls_detail: agent.connected_details,
//             missed_calls_detail: agent.missed_details
//         }));

//         agentStats.sort((a, b) => b.total_calls - a.total_calls);

//         const response = {
//             success: true,
//             data: {
//                 summary: {
//                     period: {
//                         start_date: startDate,
//                         end_date: endDate
//                     },
//                     metrics: {
//                         total_calls: totalCalls,
//                         unique_leads: uniqueLeads.size,
//                         connected_calls: totalConnected,
//                         missed_calls: totalMissed,
//                         connection_rate: totalCalls ? 
//                             ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
//                     }
//                 },
//                 agents: agentStats
//             }
//         };

//         res.status(200).json(response);

//     } catch (error) {
//         console.error('Error in getCallAnalytics:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// };

 






//right code part 1


// exports.getAuditCallAnalytics = async (req, res) => {
//     try {
//         const startDate = req.query.startDate;
//         const endDate = req.query.endDate || startDate;
//         const agentName = req.query.agentName;

//         if (!startDate || !moment(startDate).isValid()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid start date required"
//             });
//         }

//         let query = `
//             SELECT DISTINCT
//                 ic.call_id,
//                 ic.agent_number,
//                 ic.caller_number,
//                 emp.EmployeeName as agent_name,
//                 ic.ivr_number,
//                 DATE(ic.created_at) as call_date,
//                 ic.created_at,
//                 ic.connected_at,
//                 ic.ended_at,
//                 alt.Farmer_Name as lead_name,
//                 alt.Zone_Name,
//                 alt.Branch_Name,
//                 alt.Lot_Number,
//                 alt.Vendor,
//                 alt.Shed_Type,
//                 alt.Placed_Qty,
//                 alt.Hatch_Date,
//                 alt.Total_Mortality,
//                 alt.Total_Mortality_Percentage,
//                 alt.status as lead_status,
//                 CASE 
//                     WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL THEN 'Connected'
//                     ELSE 'Missed'
//                 END as call_status,
//                 CASE 
//                     WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
//                     THEN TIMESTAMPDIFF(SECOND, ic.connected_at, ic.ended_at)
//                     ELSE 0
//                 END as call_duration_seconds
//             FROM incoming_calls ic
//             LEFT JOIN audit_lead_table alt ON ic.caller_number = alt.Mobile
//             LEFT JOIN employee_table emp ON ic.agent_number = emp.EmployeePhone
//             WHERE ic.ivr_number = '8517009998'
//             AND DATE(ic.created_at) = :startDate
//             ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
//             GROUP BY 
//                 ic.call_id, 
//                 ic.agent_number,
//                 ic.caller_number,
//                 emp.EmployeeName,
//                 ic.ivr_number,
//                 ic.created_at,
//                 ic.connected_at,
//                 ic.ended_at,
//                 alt.Farmer_Name,
//                 alt.Zone_Name,
//                 alt.Branch_Name,
//                 alt.Lot_Number,
//                 alt.Vendor,
//                 alt.Shed_Type,
//                 alt.Placed_Qty,
//                 alt.Hatch_Date,
//                 alt.Total_Mortality,
//                 alt.Total_Mortality_Percentage,
//                 alt.status
//             ORDER BY ic.created_at DESC
//         `;

//         const replacements = { 
//             startDate: moment(startDate).format('YYYY-MM-DD'),
//             ...(agentName && { agentName })
//         };

//         const callDetails = await sequelize.query(query, {
//             replacements,
//             type: QueryTypes.SELECT
//         });

//         const agentMap = new Map();
//         let totalCalls = 0;
//         let totalConnected = 0;
//         let totalMissed = 0;
//         let uniqueLeads = new Set();
//         let processedCallIds = new Set();

//         callDetails.forEach(call => {
//             if (!call.agent_name || processedCallIds.has(call.call_id)) return;
            
//             processedCallIds.add(call.call_id);
//             totalCalls++;
            
//             if (call.Lot_Number) uniqueLeads.add(call.Lot_Number);
            
//             const isConnected = call.connected_at && call.ended_at;
//             if (isConnected) {
//                 totalConnected++;
//             } else {
//                 totalMissed++;
//             }

//             if (!agentMap.has(call.agent_name)) {
//                 agentMap.set(call.agent_name, {
//                     agent_name: call.agent_name,
//                     agent_number: call.agent_number,
//                     total_calls: 0,
//                     missed_calls: 0,
//                     connected_calls: 0,
//                     total_duration_minutes: 0,
//                     connected_details: [],
//                     missed_details: []
//                 });
//             }

//             const agentData = agentMap.get(call.agent_name);
//             agentData.total_calls++;

//             const callDetail = {
//                 call_id: call.call_id,
//                 date: moment(call.created_at).format('YYYY-MM-DD'),
//                 time: moment(call.created_at).format('HH:mm:ss'),
//                 caller_number: call.caller_number,
//                 duration_minutes: (call.call_duration_seconds / 60).toFixed(2)
//             };

//             const customerDetail = call.lead_name ? {
//                 farmer_name: call.lead_name,
//                 lot_number: call.Lot_Number,
//                 zone: call.Zone_Name,
//                 branch: call.Branch_Name,
//                 vendor: call.Vendor,
//                 shed_type: call.Shed_Type,
//                 placed_qty: call.Placed_Qty,
//                 hatch_date: call.Hatch_Date,
//                 total_mortality: call.Total_Mortality,
//                 mortality_percentage: call.Total_Mortality_Percentage,
//                 status: call.lead_status
//             } : null;

//             if (isConnected) {
//                 agentData.connected_calls++;
//                 agentData.total_duration_minutes += call.call_duration_seconds / 60;
//                 callDetail.connected_at = moment(call.connected_at).format('YYYY-MM-DD HH:mm:ss');
//                 callDetail.ended_at = moment(call.ended_at).format('YYYY-MM-DD HH:mm:ss');
//                 agentData.connected_details.push({
//                     ...callDetail,
//                     customer_details: customerDetail
//                 });
//             } else {
//                 agentData.missed_calls++;
//                 agentData.missed_details.push({
//                     ...callDetail,
//                     customer_details: customerDetail
//                 });
//             }
//         });

//         const agentStats = Array.from(agentMap.values()).map(agent => ({
//             agent_name: agent.agent_name,
//             agent_number: agent.agent_number,
//             total_calls: agent.total_calls,
//             connected_calls: agent.connected_calls,
//             missed_calls: agent.missed_calls,
//             total_duration_minutes: agent.total_duration_minutes.toFixed(2),
//             avg_call_duration_minutes: agent.connected_calls > 0 ? 
//                 (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
//             connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
//             missed_rate: ((agent.missed_calls / agent.total_calls) * 100).toFixed(2) + '%',
//             connected_calls_detail: agent.connected_details,
//             missed_calls_detail: agent.missed_details
//         }));

//         agentStats.sort((a, b) => b.total_calls - a.total_calls);

//         const response = {
//             success: true,
//             data: {
//                 summary: {
//                     period: {
//                         start_date: startDate,
//                         end_date: endDate
//                     },
//                     metrics: {
//                         total_calls: totalCalls,
//                         unique_leads: uniqueLeads.size,
//                         connected_calls: totalConnected,
//                         missed_calls: totalMissed,
//                         connection_rate: totalCalls ? 
//                             ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
//                     }
//                 },
//                 agents: agentStats
//             }
//         };

//         res.status(200).json(response);

//     } catch (error) {
//         console.error('Error in getAuditCallAnalytics:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// };


 


//corect code----
// exports.getAuditCallAnalytics = async (req, res) => {
//     try {
//         const startDate = req.query.startDate;
//         const endDate = req.query.endDate || startDate;
//         const agentName = req.query.agentName;

//         if (!startDate || !moment(startDate).isValid()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid start date required"
//             });
//         }

//         // Main query with proper date range
//         let query = `
//             SELECT DISTINCT
//                 ic.call_id,
//                 ic.id,
//                 ic.agent_number,
//                 ic.caller_number,
//                 emp.EmployeeName as agent_name,
//                 ic.ivr_number,
//                 DATE(ic.created_at) as call_date,
//                 ic.created_at,
//                 ic.connected_at,
//                 ic.ended_at,
//                 alt.Farmer_Name as lead_name,
//                 alt.Zone_Name,
//                 alt.Branch_Name,
//                 alt.Lot_Number,
//                 alt.Vendor,
//                 alt.Shed_Type,
//                 alt.Placed_Qty,
//                 alt.Hatch_Date,
//                 alt.Total_Mortality,
//                 alt.Total_Mortality_Percentage,
//                 alt.status as lead_status,
//                 CASE 
//                     WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL THEN 'Connected'
//                     ELSE 'Missed'
//                 END as call_status,
//                 CASE 
//                     WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
//                     THEN TIMESTAMPDIFF(SECOND, ic.connected_at, ic.ended_at)
//                     ELSE 0
//                 END as call_duration_seconds
//             FROM incoming_calls ic
//             LEFT JOIN audit_lead_table alt ON ic.caller_number = alt.Mobile
//             LEFT JOIN employee_table emp ON ic.agent_number = emp.EmployeePhone
//             WHERE ic.ivr_number = '8517009998'
//             AND DATE(ic.created_at) BETWEEN DATE(:startDate) AND DATE(:endDate)
//             ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
//             ORDER BY ic.created_at DESC
//         `;

//         // Query replacements with proper date formatting
//         const replacements = { 
//             startDate: moment(startDate).startOf('day').format('YYYY-MM-DD'),
//             endDate: moment(endDate).endOf('day').format('YYYY-MM-DD'),
//             ...(agentName && { agentName })
//         };

//         // Execute query
//         const callDetails = await sequelize.query(query, {
//             replacements,
//             type: QueryTypes.SELECT
//         });

//         // Initialize counters and data structures
//         const agentMap = new Map();
//         let totalCalls = 0;
//         let totalConnected = 0;
//         let totalMissed = 0;
//         let uniqueLeads = new Set();
//         let processedCallIds = new Set();

//         // Process call details
//         callDetails.forEach(call => {
//             if (!call.agent_name || processedCallIds.has(call.call_id)) return;
            
//             processedCallIds.add(call.call_id);
//             totalCalls++;
            
//             if (call.Lot_Number) uniqueLeads.add(call.Lot_Number);
            
//             const isConnected = call.connected_at && call.ended_at;
//             if (isConnected) {
//                 totalConnected++;
//             } else {
//                 totalMissed++;
//             }

//             // Initialize agent data if not exists
//             if (!agentMap.has(call.agent_name)) {
//                 agentMap.set(call.agent_name, {
//                     agent_name: call.agent_name,
//                     agent_number: call.agent_number,
//                     total_calls: 0,
//                     missed_calls: 0,
//                     connected_calls: 0,
//                     total_duration_minutes: 0,
//                     connected_details: [],
//                     missed_details: []
//                 });
//             }

//             const agentData = agentMap.get(call.agent_name);
//             agentData.total_calls++;

//             // Prepare call detail
//             const callDetail = {
//                 call_id: call.call_id,
//                 date: moment(call.created_at).format('YYYY-MM-DD'),
//                 time: moment(call.created_at).format('HH:mm:ss'),
//                 caller_number: call.caller_number,
//                 duration_minutes: (call.call_duration_seconds / 60).toFixed(2)
//             };

//             // Prepare customer detail if exists
//             const customerDetail = call.lead_name ? {
//                 farmer_name: call.lead_name,
//                 lot_number: call.Lot_Number,
//                 zone: call.Zone_Name,
//                 branch: call.Branch_Name,
//                 vendor: call.Vendor,
//                 shed_type: call.Shed_Type,
//                 placed_qty: call.Placed_Qty,
//                 hatch_date: call.Hatch_Date,
//                 total_mortality: call.Total_Mortality,
//                 mortality_percentage: call.Total_Mortality_Percentage,
//                 status: call.lead_status
//             } : null;

//             // Process connected and missed calls
//             if (isConnected) {
//                 agentData.connected_calls++;
//                 agentData.total_duration_minutes += call.call_duration_seconds / 60;
//                 callDetail.connected_at = moment(call.connected_at).format('YYYY-MM-DD HH:mm:ss');
//                 callDetail.ended_at = moment(call.ended_at).format('YYYY-MM-DD HH:mm:ss');
//                 agentData.connected_details.push({
//                     ...callDetail,
//                     customer_details: customerDetail
//                 });
//             } else {
//                 agentData.missed_calls++;
//                 agentData.missed_details.push({
//                     ...callDetail,
//                     customer_details: customerDetail
//                 });
//             }
//         });

//         // Process agent statistics
//         const agentStats = Array.from(agentMap.values()).map(agent => ({
//             agent_name: agent.agent_name,
//             agent_number: agent.agent_number,
//             total_calls: agent.total_calls,
//             connected_calls: agent.connected_calls,
//             missed_calls: agent.missed_calls,
//             total_duration_minutes: agent.total_duration_minutes.toFixed(2),
//             avg_call_duration_minutes: agent.connected_calls > 0 ? 
//                 (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
//             connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
//             missed_rate: ((agent.missed_calls / agent.total_calls) * 100).toFixed(2) + '%',
//             connected_calls_detail: agent.connected_details,
//             missed_calls_detail: agent.missed_details
//         }));

//         // Sort agents by total calls
//         agentStats.sort((a, b) => b.total_calls - a.total_calls);

//         // Prepare final response
//         const response = {
//             success: true,
//             data: {
//                 summary: {
//                     period: {
//                         start_date: moment(startDate).format('YYYY-MM-DD'),
//                         end_date: moment(endDate).format('YYYY-MM-DD')
//                     },
//                     metrics: {
//                         total_calls: totalCalls,
//                         unique_leads: uniqueLeads.size,
//                         connected_calls: totalConnected,
//                         missed_calls: totalMissed,
//                         connection_rate: totalCalls ? 
//                             ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
//                     }
//                 },
//                 agents: agentStats
//             }
//         };

//         res.status(200).json(response);

//     } catch (error) {
//         console.error('Error in getAuditCallAnalytics:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// };




//18-12-2024

// exports.getAuditCallAnalytics = async (req, res) => {
//     try {
//         const startDate = req.query.startDate;
//         const endDate = req.query.endDate || startDate;
//         const agentName = req.query.agentName;

//         if (!startDate || !moment(startDate).isValid()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid start date required"
//             });
//         }

//         // Main query without GROUP BY to get all records
//         let query = `
//             SELECT 
//                 ic.call_id,
//                 ic.agent_number,
//                 ic.caller_number,
//                 emp.EmployeeName as agent_name,
//                 ic.ivr_number,
//                 DATE(ic.created_at) as call_date,
//                 ic.created_at,
//                 ic.connected_at,
//                 ic.ended_at,
//                 alt.Farmer_Name as lead_name,
//                 alt.Zone_Name,
//                 alt.Branch_Name,
//                 alt.Lot_Number,
//                 alt.Vendor,
//                 alt.Shed_Type,
//                 alt.Placed_Qty,
//                 alt.Hatch_Date,
//                 alt.Total_Mortality,
//                 alt.Total_Mortality_Percentage,
//                 alt.status as lead_status,
//                 CASE 
//                     WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL THEN 'Connected'
//                     ELSE 'Missed'
//                 END as call_status,
//                 CASE 
//                     WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
//                     THEN TIMESTAMPDIFF(SECOND, ic.connected_at, ic.ended_at)
//                     ELSE 0
//                 END as call_duration_seconds
//             FROM incoming_calls ic
//             LEFT JOIN audit_lead_table alt ON ic.caller_number = alt.Mobile
//             LEFT JOIN employee_table emp ON ic.agent_number = emp.EmployeePhone
//             WHERE ic.ivr_number = '8517009998'
//             AND DATE(ic.created_at) BETWEEN DATE(:startDate) AND DATE(:endDate)
//             ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
//             ORDER BY ic.created_at DESC
//         `;

//         const replacements = { 
//             startDate: moment(startDate).startOf('day').format('YYYY-MM-DD'),
//             endDate: moment(endDate).endOf('day').format('YYYY-MM-DD'),
//             ...(agentName && { agentName })
//         };

//         const callDetails = await sequelize.query(query, {
//             replacements,
//             type: QueryTypes.SELECT
//         });

//         // Initialize data structures
//         const agentMap = new Map();
//         let totalCalls = 0;
//         let totalConnected = 0;
//         let totalMissed = 0;
//         let uniqueLeads = new Set();
//         let processedCalls = new Map(); // Track unique call_id + agent_number combinations

//         // Process call details
//         callDetails.forEach(call => {
//             if (!call.agent_name) return;
            
//             // Create unique key for call_id + agent_number combination
//             const uniqueKey = `${call.call_id}_${call.agent_number}`;
            
//             // Count each unique agent interaction with a call
//             if (!processedCalls.has(uniqueKey)) {
//                 processedCalls.set(uniqueKey, true);
//                 totalCalls++;

//                 if (call.Lot_Number) uniqueLeads.add(call.Lot_Number);
                
//                 const isConnected = call.connected_at && call.ended_at;
//                 if (isConnected) {
//                     totalConnected++;
//                 } else {
//                     totalMissed++;
//                 }

//                 // Initialize agent data if not exists
//                 if (!agentMap.has(call.agent_name)) {
//                     agentMap.set(call.agent_name, {
//                         agent_name: call.agent_name,
//                         agent_number: call.agent_number,
//                         total_calls: 0,
//                         missed_calls: 0,
//                         connected_calls: 0,
//                         total_duration_minutes: 0,
//                         connected_details: [],
//                         missed_details: []
//                     });
//                 }

//                 const agentData = agentMap.get(call.agent_name);
//                 agentData.total_calls++;

//                 // Prepare call detail
//                 const callDetail = {
//                     call_id: call.call_id,
//                     date: moment(call.created_at).format('YYYY-MM-DD'),
//                     time: moment(call.created_at).format('HH:mm:ss'),
//                     caller_number: call.caller_number,
//                     duration_minutes: (call.call_duration_seconds / 60).toFixed(2)
//                 };

//                 // Prepare customer detail if exists
//                 const customerDetail = call.lead_name ? {
//                     farmer_name: call.lead_name,
//                     lot_number: call.Lot_Number,
//                     zone: call.Zone_Name,
//                     branch: call.Branch_Name,
//                     vendor: call.Vendor,
//                     shed_type: call.Shed_Type,
//                     placed_qty: call.Placed_Qty,
//                     hatch_date: call.Hatch_Date,
//                     total_mortality: call.Total_Mortality,
//                     mortality_percentage: call.Total_Mortality_Percentage,
//                     status: call.lead_status
//                 } : null;

//                 // Process connected and missed calls
//                 if (isConnected) {
//                     agentData.connected_calls++;
//                     agentData.total_duration_minutes += call.call_duration_seconds / 60;
//                     callDetail.connected_at = moment(call.connected_at).format('YYYY-MM-DD HH:mm:ss');
//                     callDetail.ended_at = moment(call.ended_at).format('YYYY-MM-DD HH:mm:ss');
//                     agentData.connected_details.push({
//                         ...callDetail,
//                         customer_details: customerDetail
//                     });
//                 } else {
//                     agentData.missed_calls++;
//                     agentData.missed_details.push({
//                         ...callDetail,
//                         customer_details: customerDetail
//                     });
//                 }
//             }
//         });

//         // Process agent statistics
//         const agentStats = Array.from(agentMap.values()).map(agent => ({
//             agent_name: agent.agent_name,
//             agent_number: agent.agent_number,
//             total_calls: agent.total_calls,
//             connected_calls: agent.connected_calls,
//             missed_calls: agent.missed_calls,
//             total_duration_minutes: agent.total_duration_minutes.toFixed(2),
//             avg_call_duration_minutes: agent.connected_calls > 0 ? 
//                 (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
//             connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
//             missed_rate: ((agent.missed_calls / agent.total_calls) * 100).toFixed(2) + '%',
//             connected_calls_detail: agent.connected_details,
//             missed_calls_detail: agent.missed_details
//         }));

//         // Sort agents by total calls
//         agentStats.sort((a, b) => b.total_calls - a.total_calls);

//         // Prepare final response
//         const response = {
//             success: true,
//             data: {
//                 summary: {
//                     period: {
//                         start_date: moment(startDate).format('YYYY-MM-DD'),
//                         end_date: moment(endDate).format('YYYY-MM-DD')
//                     },
//                     metrics: {
//                         total_calls: totalCalls,
//                         unique_leads: uniqueLeads.size,
//                         connected_calls: totalConnected,
//                         missed_calls: totalMissed,
//                         connection_rate: totalCalls ? 
//                             ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
//                     }
//                 },
//                 agents: agentStats
//             }
//         };

//         res.status(200).json(response);

//     } catch (error) {
//         console.error('Error in getAuditCallAnalytics:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// };





//
// exports.getAuditCallAnalytics = async (req, res) => {
//     try {
//         const startDate = req.query.startDate;
//         const endDate = req.query.endDate || startDate;
//         const agentName = req.query.agentName;

//         if (!startDate || !moment(startDate).isValid()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid start date required"
//             });
//         }

//         let query = `
//             SELECT 
//                 ic.call_id,
//                 ic.agent_number,
//                 ic.caller_number,
//                 emp.EmployeeName as agent_name,
//                 ic.ivr_number,
//                 DATE(ic.created_at) as call_date,
//                 ic.created_at,
//                 ic.connected_at,
//                 ic.ended_at,
//                 alt.Farmer_Name as lead_name,
//                 alt.Zone_Name,
//                 alt.Branch_Name,
//                 alt.Lot_Number,
//                 alt.Vendor,
//                 alt.Shed_Type,
//                 alt.Placed_Qty,
//                 alt.Hatch_Date,
//                 alt.Total_Mortality,
//                 alt.Total_Mortality_Percentage,
//                 alt.status as lead_status,
//                 CASE 
//                     WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL THEN 'Connected'
//                     ELSE 'Missed'
//                 END as call_status,
//                 CASE 
//                     WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
//                     THEN TIMESTAMPDIFF(SECOND, ic.connected_at, ic.ended_at)
//                     ELSE 0
//                 END as call_duration_seconds
//             FROM incoming_calls ic
//             LEFT JOIN audit_lead_table alt ON ic.caller_number = alt.Mobile
//             LEFT JOIN employee_table emp ON ic.agent_number = emp.EmployeePhone
//             WHERE ic.ivr_number = '8517009998'
//             AND DATE(ic.created_at) BETWEEN DATE(:startDate) AND DATE(:endDate)
//             ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
//             ORDER BY ic.created_at DESC
//         `;

//         const replacements = { 
//             startDate: moment(startDate).startOf('day').format('YYYY-MM-DD'),
//             endDate: moment(endDate).endOf('day').format('YYYY-MM-DD'),
//             ...(agentName && { agentName })
//         };

//         const callDetails = await sequelize.query(query, {
//             replacements,
//             type: QueryTypes.SELECT
//         });

//         const agentMap = new Map();
//         let totalCalls = 0;
//         let totalConnected = 0;
//         let totalMissed = 0;
//         let uniqueLeads = new Set();
//         let processedCalls = new Map();
//         let totalTalkTimeSeconds = 0;

//         callDetails.forEach(call => {
//             if (!call.agent_name) return;
            
//             const uniqueKey = `${call.call_id}_${call.agent_number}`;
            
//             if (!processedCalls.has(uniqueKey)) {
//                 processedCalls.set(uniqueKey, true);
//                 totalCalls++;

//                 if (call.Lot_Number) uniqueLeads.add(call.Lot_Number);
                
//                 const isConnected = call.connected_at && call.ended_at;
//                 if (isConnected) {
//                     totalConnected++;
//                     totalTalkTimeSeconds += call.call_duration_seconds;
//                 } else {
//                     totalMissed++;
//                 }

//                 if (!agentMap.has(call.agent_name)) {
//                     agentMap.set(call.agent_name, {
//                         agent_name: call.agent_name,
//                         agent_number: call.agent_number,
//                         total_calls: 0,
//                         missed_calls: 0,
//                         connected_calls: 0,
//                         total_duration_minutes: 0,
//                         total_duration_seconds: 0,
//                         connected_details: [],
//                         missed_details: []
//                     });
//                 }

//                 const agentData = agentMap.get(call.agent_name);
//                 agentData.total_calls++;

//                 const callDetail = {
//                     call_id: call.call_id,
//                     date: moment(call.created_at).format('YYYY-MM-DD'),
//                     time: moment(call.created_at).format('HH:mm:ss'),
//                     caller_number: call.caller_number,
//                     duration_minutes: (call.call_duration_seconds / 60).toFixed(2)
//                 };

//                 const customerDetail = call.lead_name ? {
//                     farmer_name: call.lead_name,
//                     lot_number: call.Lot_Number,
//                     zone: call.Zone_Name,
//                     branch: call.Branch_Name,
//                     vendor: call.Vendor,
//                     shed_type: call.Shed_Type,
//                     placed_qty: call.Placed_Qty,
//                     hatch_date: call.Hatch_Date,
//                     total_mortality: call.Total_Mortality,
//                     mortality_percentage: call.Total_Mortality_Percentage,
//                     status: call.lead_status
//                 } : null;

//                 if (isConnected) {
//                     agentData.connected_calls++;
//                     agentData.total_duration_seconds += call.call_duration_seconds;
//                     agentData.total_duration_minutes += call.call_duration_seconds / 60;
//                     callDetail.connected_at = moment(call.connected_at).format('YYYY-MM-DD HH:mm:ss');
//                     callDetail.ended_at = moment(call.ended_at).format('YYYY-MM-DD HH:mm:ss');
//                     agentData.connected_details.push({
//                         ...callDetail,
//                         customer_details: customerDetail
//                     });
//                 } else {
//                     agentData.missed_calls++;
//                     agentData.missed_details.push({
//                         ...callDetail,
//                         customer_details: customerDetail
//                     });
//                 }
//             }
//         });

//         // Calculate hours, minutes and seconds format
//         const formatDuration = (totalSeconds) => {
//             const hours = Math.floor(totalSeconds / 3600);
//             const minutes = Math.floor((totalSeconds % 3600) / 60);
//             const seconds = totalSeconds % 60;
//             return {
//                 hours,
//                 minutes,
//                 seconds,
//                 formatted: `${hours}h ${minutes}m ${seconds}s`
//             };
//         };

//         const agentStats = Array.from(agentMap.values()).map(agent => {
//             const duration = formatDuration(agent.total_duration_seconds);
//             return {
//                 agent_name: agent.agent_name,
//                 agent_number: agent.agent_number,
//                 total_calls: agent.total_calls,
//                 connected_calls: agent.connected_calls,
//                 missed_calls: agent.missed_calls,
//                 total_talk_time: duration.formatted,
//                 total_duration_minutes: agent.total_duration_minutes.toFixed(2),
//                 avg_call_duration_minutes: agent.connected_calls > 0 ? 
//                     (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
//                 connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
//                 missed_rate: ((agent.missed_calls / agent.total_calls) * 100).toFixed(2) + '%',
//                 connected_calls_detail: agent.connected_details,
//                 missed_calls_detail: agent.missed_details
//             };
//         });

//         agentStats.sort((a, b) => b.total_calls - a.total_calls);

//         const totalDuration = formatDuration(totalTalkTimeSeconds);

//         const response = {
//             success: true,
//             data: {
//                 summary: {
//                     period: {
//                         start_date: moment(startDate).format('YYYY-MM-DD'),
//                         end_date: moment(endDate).format('YYYY-MM-DD')
//                     },
//                     metrics: {
//                         total_calls: totalCalls,
//                         unique_leads: uniqueLeads.size,
//                         connected_calls: totalConnected,
//                         missed_calls: totalMissed,
//                         total_talk_time: totalDuration.formatted,
//                         connection_rate: totalCalls ? 
//                             ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
//                     }
//                 },
//                 agents: agentStats
//             }
//         };

//         res.status(200).json(response);

//     } catch (error) {
//         console.error('Error in getAuditCallAnalytics:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// };




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









 

 


//outgoing parivartan /

//v1 important api 
// exports.getOutboundCallAnalytics = async (req, res) => {
//     try {
//         const startDate = req.query.startDate;
//         const endDate = req.query.endDate || startDate;
//         const agentName = req.query.agentName;
//         const ivrNumber = req.query.ivrNumber;

//         if (!startDate || !moment(startDate).isValid() || !moment(endDate).isValid()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid start date required"
//             });
//         }

//         if (!ivrNumber || !['8517009997', '8517009998'].includes(ivrNumber)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid IVR number required (8517009997 or 8517009998)"
//             });
//         }

//         // Modify date range to include full days
//         const startDateTime = moment(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
//         const endDateTime = moment(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

//         // Modified query to focus on Call End events
//         const callDetails = await sequelize.query(`
//             SELECT 
//                 cl.*,
//                 emp.EmployeeName as agent_name,
//                 alt.Farmer_Name as lead_name,
//                 alt.Zone_Name,
//                 alt.Branch_Name,
//                 alt.Lot_Number,
//                 alt.Vendor,
//                 alt.Shed_Type,
//                 alt.Placed_Qty,
//                 alt.Hatch_Date,
//                 alt.Total_Mortality,
//                 alt.Total_Mortality_Percentage,
//                 alt.status as lead_status,
//                 CASE 
//                     WHEN cl.eventType = 'Call End' AND cl.bDialStatus = 'Connected' THEN 'Connected'
//                     WHEN cl.eventType = 'Call End' THEN 'Not Connected'
//                     ELSE NULL
//                 END as call_status,
//                 CASE 
//                     WHEN cl.bPartyConnectedTime IS NOT NULL AND cl.bPartyEndTime IS NOT NULL 
//                     THEN TIMESTAMPDIFF(SECOND, cl.bPartyConnectedTime, cl.bPartyEndTime)
//                     ELSE 0
//                 END as call_duration_seconds
//             FROM call_logs cl
//             LEFT JOIN employee_table emp ON cl.aPartyNo = emp.EmployeePhone
//             LEFT JOIN audit_lead_table alt ON cl.bPartyNo = alt.Mobile
//             WHERE cl.dni = :ivrNumber
//             AND cl.eventType = 'Call End'
//             AND cl.callStartTime BETWEEN :startDateTime AND :endDateTime
//             ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
//             ORDER BY cl.callStartTime DESC
//         `, {
//             replacements: { 
//                 startDateTime, 
//                 endDateTime, 
//                 ivrNumber, 
//                 ...(agentName && { agentName }) 
//             },
//             type: QueryTypes.SELECT
//         });

//         // Process the data
//         const agentMap = new Map();
//         let totalCalls = 0;
//         let totalConnected = 0;
//         let totalNotConnected = 0;
//         let uniqueLeads = new Set();

//         callDetails.forEach(call => {
//             if (!call.agent_name) return;

//             totalCalls++;
//             if (call.Lot_Number) uniqueLeads.add(call.Lot_Number);
//             if (call.call_status === 'Connected') totalConnected++;
//             if (call.call_status === 'Not Connected') totalNotConnected++;

//             if (!agentMap.has(call.agent_name)) {
//                 agentMap.set(call.agent_name, {
//                     agent_name: call.agent_name,
//                     agent_number: call.aPartyNo,
//                     total_calls: 0,
//                     connected_calls: 0,
//                     not_connected_calls: 0,
//                     total_duration_minutes: 0,
//                     connected_details: [],
//                     not_connected_details: []
//                 });
//             }

//             const agentData = agentMap.get(call.agent_name);
//             agentData.total_calls++;

//             const callDetail = {
//                 call_id: call.callId,
//                 date: moment(call.callStartTime).format('YYYY-MM-DD'),
//                 time: moment(call.callStartTime).format('HH:mm:ss'),
//                 customer_number: call.bPartyNo,
//                 duration_minutes: (call.call_duration_seconds / 60).toFixed(2),
//                 dial_status: call.bDialStatus,
//                 release_reason: call.bPartyReleaseReason || 'N/A'
//             };

//             const customerDetail = call.lead_name ? {
//                 farmer_name: call.lead_name,
//                 lot_number: call.Lot_Number,
//                 zone: call.Zone_Name,
//                 branch: call.Branch_Name,
//                 vendor: call.Vendor,
//                 shed_type: call.Shed_Type,
//                 placed_qty: call.Placed_Qty,
//                 hatch_date: call.Hatch_Date,
//                 total_mortality: call.Total_Mortality,
//                 mortality_percentage: call.Total_Mortality_Percentage,
//                 status: call.lead_status
//             } : null;

//             if (call.call_status === 'Connected') {
//                 agentData.connected_calls++;
//                 agentData.total_duration_minutes += call.call_duration_seconds / 60;
//                 callDetail.connected_at = moment(call.bPartyConnectedTime).format('YYYY-MM-DD HH:mm:ss');
//                 callDetail.ended_at = moment(call.bPartyEndTime).format('YYYY-MM-DD HH:mm:ss');
//                 agentData.connected_details.push({
//                     ...callDetail,
//                     customer_details: customerDetail
//                 });
//             } else {
//                 agentData.not_connected_calls++;
//                 agentData.not_connected_details.push({
//                     ...callDetail,
//                     customer_details: customerDetail
//                 });
//             }
//         });

//         const agentStats = Array.from(agentMap.values()).map(agent => ({
//             agent_name: agent.agent_name,
//             agent_number: agent.agent_number,
//             total_calls: agent.total_calls,
//             connected_calls: agent.connected_calls,
//             not_connected_calls: agent.not_connected_calls,
//             total_duration_minutes: agent.total_duration_minutes.toFixed(2),
//             avg_call_duration_minutes: agent.connected_calls > 0 ? 
//                 (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
//             connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
//             connected_details: agent.connected_details,
//             not_connected_details: agent.not_connected_details
//         }));

//         agentStats.sort((a, b) => b.total_calls - a.total_calls);

//         const response = {
//             success: true,
//             data: {
//                 summary: {
//                     period: {
//                         start_date: startDate,
//                         end_date: endDate
//                     },
//                     ivr_number: ivrNumber,
//                     metrics: {
//                         total_calls: totalCalls,
//                         unique_leads: uniqueLeads.size,
//                         connected_calls: totalConnected,
//                         not_connected_calls: totalNotConnected,
//                         connection_rate: totalCalls ? 
//                             ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
//                     }
//                 },
//                 agents: agentStats
//             }
//         };

//         res.status(200).json(response);

//     } catch (error) {
//         console.error('Error in getOutboundCallAnalytics:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// };



// / Add IVR pair mapping





// changes on 6 jan 

// const IVR_PAIRS = {
//     '8517009997': ['8517009997', '7610255555'],
//     '8517009998': ['8517009998', '7610233333']
// };

// exports.getOutboundCallAnalytics = async (req, res) => {
//     try {
//         const startDate = req.query.startDate;
//         const endDate = req.query.endDate || startDate;
//         const agentName = req.query.agentName;
//         const ivrNumber = req.query.ivrNumber;

//         if (!startDate || !moment(startDate).isValid() || !moment(endDate).isValid()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid start date required"
//             });
//         }

//         if (!ivrNumber || !Object.keys(IVR_PAIRS).includes(ivrNumber)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid IVR number required (8517009997 or 8517009998)"
//             });
//         }

//         const startDateTime = moment(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
//         const endDateTime = moment(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

//         const callDetails = await sequelize.query(`
//             SELECT 
//                 cl.*,
//                 emp.EmployeeName as agent_name,
//                 alt.Farmer_Name as lead_name,
//                 alt.Zone_Name,
//                 alt.Branch_Name,
//                 alt.Lot_Number,
//                 alt.Vendor,
//                 alt.Shed_Type,
//                 alt.Placed_Qty,
//                 alt.Hatch_Date,
//                 alt.Total_Mortality,
//                 alt.Total_Mortality_Percentage,
//                 alt.status as lead_status,
//                 CASE 
//                     WHEN cl.eventType = 'Call End' AND cl.bDialStatus = 'Connected' THEN 'Connected'
//                     WHEN cl.eventType = 'Call End' THEN 'Not Connected'
//                     ELSE NULL
//                 END as call_status,
//                 CASE 
//                     WHEN cl.bPartyConnectedTime IS NOT NULL AND cl.bPartyEndTime IS NOT NULL 
//                     THEN TIMESTAMPDIFF(SECOND, cl.bPartyConnectedTime, cl.bPartyEndTime)
//                     ELSE 0
//                 END as call_duration_seconds
//             FROM call_logs cl
//             LEFT JOIN employee_table emp ON cl.aPartyNo = emp.EmployeePhone
//             LEFT JOIN audit_lead_table alt ON cl.bPartyNo = alt.Mobile
//             WHERE cl.dni IN (:ivrNumbers)
//             AND cl.eventType = 'Call End'
//             AND cl.callStartTime BETWEEN :startDateTime AND :endDateTime
//             ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
//             ORDER BY cl.callStartTime DESC
//         `, {
//             replacements: { 
//                 startDateTime, 
//                 endDateTime, 
//                 ivrNumbers: IVR_PAIRS[ivrNumber],
//                 ...(agentName && { agentName }) 
//             },
//             type: QueryTypes.SELECT
//         });

//         // Process the data
//         const agentMap = new Map();
//         let totalCalls = 0;
//         let totalConnected = 0;
//         let totalNotConnected = 0;
//         let uniqueLeads = new Set();

//         callDetails.forEach(call => {
//             if (!call.agent_name) return;

//             totalCalls++;
//             if (call.Lot_Number) uniqueLeads.add(call.Lot_Number);
//             if (call.call_status === 'Connected') totalConnected++;
//             if (call.call_status === 'Not Connected') totalNotConnected++;

//             if (!agentMap.has(call.agent_name)) {
//                 agentMap.set(call.agent_name, {
//                     agent_name: call.agent_name,
//                     agent_number: call.aPartyNo,
//                     total_calls: 0,
//                     connected_calls: 0,
//                     not_connected_calls: 0,
//                     total_duration_minutes: 0,
//                     connected_details: [],
//                     not_connected_details: []
//                 });
//             }

//             const agentData = agentMap.get(call.agent_name);
//             agentData.total_calls++;

//             const callDetail = {
//                 call_id: call.callId,
//                 date: moment(call.callStartTime).format('YYYY-MM-DD'),
//                 time: moment(call.callStartTime).format('HH:mm:ss'),
//                 customer_number: call.bPartyNo,
//                 duration_minutes: (call.call_duration_seconds / 60).toFixed(2),
//                 dial_status: call.bDialStatus,
//                 release_reason: call.bPartyReleaseReason || 'N/A'
//             };

//             const customerDetail = call.lead_name ? {
//                 farmer_name: call.lead_name,
//                 lot_number: call.Lot_Number,
//                 zone: call.Zone_Name,
//                 branch: call.Branch_Name,
//                 vendor: call.Vendor,
//                 shed_type: call.Shed_Type,
//                 placed_qty: call.Placed_Qty,
//                 hatch_date: call.Hatch_Date,
//                 total_mortality: call.Total_Mortality,
//                 mortality_percentage: call.Total_Mortality_Percentage,
//                 status: call.lead_status
//             } : null;

//             if (call.call_status === 'Connected') {
//                 agentData.connected_calls++;
//                 agentData.total_duration_minutes += call.call_duration_seconds / 60;
//                 callDetail.connected_at = moment(call.bPartyConnectedTime).format('YYYY-MM-DD HH:mm:ss');
//                 callDetail.ended_at = moment(call.bPartyEndTime).format('YYYY-MM-DD HH:mm:ss');
//                 agentData.connected_details.push({
//                     ...callDetail,
//                     customer_details: customerDetail
//                 });
//             } else {
//                 agentData.not_connected_calls++;
//                 agentData.not_connected_details.push({
//                     ...callDetail,
//                     customer_details: customerDetail
//                 });
//             }
//         });

//         const agentStats = Array.from(agentMap.values()).map(agent => ({
//             agent_name: agent.agent_name,
//             agent_number: agent.agent_number,
//             total_calls: agent.total_calls,
//             connected_calls: agent.connected_calls,
//             not_connected_calls: agent.not_connected_calls,
//             total_duration_minutes: agent.total_duration_minutes.toFixed(2),
//             avg_call_duration_minutes: agent.connected_calls > 0 ? 
//                 (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
//             connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
//             connected_details: agent.connected_details,
//             not_connected_details: agent.not_connected_details
//         }));

//         agentStats.sort((a, b) => b.total_calls - a.total_calls);

//         const response = {
//             success: true,
//             data: {
//                 summary: {
//                     period: {
//                         start_date: startDate,
//                         end_date: endDate
//                     },
//                     ivr_number: ivrNumber,
//                     metrics: {
//                         total_calls: totalCalls,
//                         unique_leads: uniqueLeads.size,
//                         connected_calls: totalConnected,
//                         not_connected_calls: totalNotConnected,
//                         connection_rate: totalCalls ? 
//                             ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
//                     }
//                 },
//                 agents: agentStats
//             }
//         };

//         res.status(200).json(response);

//     } catch (error) {
//         console.error('Error in getOutboundCallAnalytics:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// };








//main outgoing commenting on 11 jan

// const IVR_PAIRS = {
//     '8517009997': ['8517009997', '7610255555'],
//     '8517009998': ['8517009998', '7610233333']
// };

// exports.getOutboundCallAnalytics = async (req, res) => {
//     try {
//         const startDate = req.query.startDate;
//         const endDate = req.query.endDate || startDate;
//         const agentName = req.query.agentName;
//         const ivrNumber = req.query.ivrNumber;

//         if (!startDate || !moment(startDate).isValid() || !moment(endDate).isValid()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid start date required"
//             });
//         }

//         if (!ivrNumber || !Object.keys(IVR_PAIRS).includes(ivrNumber)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid IVR number required (8517009997 or 8517009998)"
//             });
//         }

//         const startDateTime = moment(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
//         const endDateTime = moment(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

//         const callDetails = await sequelize.query(`
//             SELECT 
//                 cl.*,
//                 emp.EmployeeName as agent_name,
//                 alt.Farmer_Name as lead_name,
//                 alt.Zone_Name,
//                 alt.Branch_Name,
//                 alt.Lot_Number,
//                 alt.Vendor,
//                 alt.Shed_Type,
//                 alt.Placed_Qty,
//                 alt.Hatch_Date,
//                 alt.Total_Mortality,
//                 alt.Total_Mortality_Percentage,
//                 alt.status as lead_status,
//                 alr.REMARKS as audit_remarks,
//                 CASE 
//                     WHEN cl.eventType = 'Call End' 
//                     AND cl.bDialStatus = 'Connected' 
//                     AND alr.Lot_Number IS NOT NULL 
//                     THEN 'Connected'
//                     WHEN cl.eventType = 'Call End' THEN 'Not Connected'
//                     ELSE NULL
//                 END as call_status,
//                 CASE 
//                     WHEN cl.bPartyConnectedTime IS NOT NULL 
//                     AND cl.bPartyEndTime IS NOT NULL 
//                     AND alr.Lot_Number IS NOT NULL
//                     THEN TIMESTAMPDIFF(SECOND, cl.bPartyConnectedTime, cl.bPartyEndTime)
//                     ELSE 0
//                 END as call_duration_seconds
//             FROM call_logs cl
//             LEFT JOIN employee_table emp ON cl.aPartyNo = emp.EmployeePhone
//             LEFT JOIN audit_lead_table alt ON cl.bPartyNo = alt.Mobile
//             LEFT JOIN audit_lead_remarks alr ON alt.Lot_Number = alr.Lot_Number
//             WHERE cl.dni IN (:ivrNumber1, :ivrNumber2)
//             AND cl.eventType = 'Call End'
//             AND cl.callStartTime BETWEEN :startDateTime AND :endDateTime
//             ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
//             ORDER BY cl.callStartTime DESC
//         `, {
//             replacements: { 
//                 startDateTime, 
//                 endDateTime,
//                 ivrNumber1: IVR_PAIRS[ivrNumber][0],
//                 ivrNumber2: IVR_PAIRS[ivrNumber][1],
//                 ...(agentName && { agentName })
//             },
//             type: QueryTypes.SELECT
//         });

//         const agentMap = new Map();
//         let totalCalls = 0;
//         let totalConnected = 0;
//         let totalNotConnected = 0;
//         let uniqueLeads = new Set();
//         let processedCallIds = new Map(); // Track unique call_id + lot combinations

//         callDetails.forEach(call => {
//             if (!call.agent_name) return;

//             // Create unique key combining call_id and lot_number
//             const uniqueKey = `${call.callId}_${call.Lot_Number || 'no_lot'}`;
            
//             // Only process if this call+lot combination hasn't been processed
//             if (!processedCallIds.has(uniqueKey)) {
//                 processedCallIds.set(uniqueKey, true);
//                 totalCalls++;

//                 if (call.Lot_Number) {
//                     uniqueLeads.add(call.Lot_Number);
//                 }

//                 if (call.call_status === 'Connected') {
//                     totalConnected++;
//                 } else if (call.call_status === 'Not Connected') {
//                     totalNotConnected++;
//                 }

//                 if (!agentMap.has(call.agent_name)) {
//                     agentMap.set(call.agent_name, {
//                         agent_name: call.agent_name,
//                         agent_number: call.aPartyNo,
//                         total_calls: 0,
//                         connected_calls: 0,
//                         not_connected_calls: 0,
//                         total_duration_minutes: 0,
//                         connected_details: [],
//                         not_connected_details: []
//                     });
//                 }

//                 const agentData = agentMap.get(call.agent_name);
//                 agentData.total_calls++;

//                 const callDetail = {
//                     call_id: call.callId,
//                     date: moment(call.callStartTime).format('YYYY-MM-DD'),
//                     time: moment(call.callStartTime).format('HH:mm:ss'),
//                     customer_number: call.bPartyNo,
//                     duration_minutes: (call.call_duration_seconds / 60).toFixed(2),
//                     dial_status: call.bDialStatus,
//                     release_reason: call.bPartyReleaseReason || 'N/A',
//                     lot_number: call.Lot_Number || 'N/A'
//                 };

//                 const customerDetail = call.lead_name ? {
//                     farmer_name: call.lead_name,
//                     lot_number: call.Lot_Number,
//                     zone: call.Zone_Name,
//                     branch: call.Branch_Name,
//                     vendor: call.Vendor,
//                     shed_type: call.Shed_Type,
//                     placed_qty: call.Placed_Qty,
//                     hatch_date: call.Hatch_Date,
//                     total_mortality: call.Total_Mortality,
//                     mortality_percentage: call.Total_Mortality_Percentage,
//                     status: call.lead_status
//                 } : null;

//                 if (call.call_status === 'Connected') {
//                     agentData.connected_calls++;
//                     agentData.total_duration_minutes += call.call_duration_seconds / 60;
//                     callDetail.connected_at = moment(call.bPartyConnectedTime).format('YYYY-MM-DD HH:mm:ss');
//                     callDetail.ended_at = moment(call.bPartyEndTime).format('YYYY-MM-DD HH:mm:ss');
//                     agentData.connected_details.push({
//                         ...callDetail,
//                         customer_details: customerDetail
//                     });
//                 } else {
//                     agentData.not_connected_calls++;
//                     agentData.not_connected_details.push({
//                         ...callDetail,
//                         customer_details: customerDetail
//                     });
//                 }
//             }
//         });

//         const agentStats = Array.from(agentMap.values()).map(agent => ({
//             agent_name: agent.agent_name,
//             agent_number: agent.agent_number,
//             total_calls: agent.total_calls,
//             connected_calls: agent.connected_calls,
//             not_connected_calls: agent.not_connected_calls,
//             total_duration_minutes: agent.total_duration_minutes.toFixed(2),
//             avg_call_duration_minutes: agent.connected_calls > 0 ? 
//                 (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
//             connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
//             connected_details: agent.connected_details,
//             not_connected_details: agent.not_connected_details
//         }));

//         agentStats.sort((a, b) => b.total_calls - a.total_calls);

//         const response = {
//             success: true,
//             data: {
//                 summary: {
//                     period: {
//                         start_date: startDate,
//                         end_date: endDate
//                     },
//                     ivr_number: ivrNumber,
//                     metrics: {
//                         total_calls: totalCalls,
//                         unique_leads: uniqueLeads.size,
//                         connected_calls: totalConnected,
//                         not_connected_calls: totalNotConnected,
//                         connection_rate: totalCalls ? 
//                             ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
//                     }
//                 },
//                 agents: agentStats
//             }
//         };

//         res.status(200).json(response);

//     } catch (error) {
//         console.error('Error in getOutboundCallAnalytics:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// }; 





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