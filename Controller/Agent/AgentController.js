const Lead_Detail = require("../../models/lead_detail");
const Employee = require("../../models/employee");
const Campaign = require("../../models/campaign");
const LeadLog = require("../../models/leads_logs");
const { Op,QueryTypes  } = require("sequelize");
const moment = require("moment");
const FollowUPByAgent = require("../../models/FollowUpByAgent");
const sequelize = require("../../models/index");

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




//get lead data by mobile number

// exports.getLeadByMobileNo = async (req, res) => {
//   try {
//     const { mobileNo } = req.params;

//     const lead = await Lead_Detail.findOne({
//       where: {
//         [Op.or]: [
//           { MobileNo: mobileNo },
//           { AlternateMobileNo: mobileNo },
//           { WhatsappNo: mobileNo },
//         ],
//       },
//     });

//     if (!lead) {
//       return res
//         .status(200)
//         .json({ message: "Lead not found for the given mobile number" });
//     }

//     res.status(200).json({ lead });
//   } catch (error) {
//     console.error("Error fetching lead:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

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
exports.getLeadsByAgentId = async (req, res) => {
  try {
    const { agentId } = req.params;

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
    console.log(assignedCampaignIds, '-----------1212');
    

    const leads = await Lead_Detail.findAll({
      where: {
        AgentId: agentId,
        source_of_lead_generated: {
          [Op.in]: assignedCampaignIds,
        },
      },
      include: [
        { model: Employee, as: "Agent" },
        { model: Employee, as: "BDM" },
        { model: Employee, as: "Superviser" },
        {
          model: Campaign,
          as: "Campaign",
          attributes: ["CampaignId", "CampaignName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ leads });
  } catch (error) {
    console.error("Error retrieving leads:", error);
    res.status(500).json({ message: "Internal server error" });
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
        const startDate = req.query.startDate || moment().subtract(7, 'days').format('YYYY-MM-DD');
        const endDate = req.query.endDate || moment().format('YYYY-MM-DD');
        const agentName = req.query.agentName;
        
        if (!moment(startDate).isValid() || !moment(endDate).isValid()) {
            return res.status(400).json({
                success: false,
                message: "Invalid date range provided"
            });
        }

        // Main query with optional agent filter
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
            WHERE ic.ivr_number = '8517009997'
            AND ic.created_at BETWEEN :startDate AND :endDate
            ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
            ORDER BY ic.created_at DESC
        `;

        const replacements = { startDate, endDate };
        if (agentName) {
            replacements.agentName = agentName;
        }

        const callDetails = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        // Process the data
        const agentMap = new Map();
        let totalCalls = 0;
        let totalConnected = 0;
        let totalMissed = 0;
        let uniqueLeads = new Set();

        callDetails.forEach(call => {
            if (!call.agent_name) return;

            totalCalls++;
            if (call.lead_name) uniqueLeads.add(call.lead_name);
            if (call.call_status === 'Connected') totalConnected++;
            if (call.call_status === 'Missed') totalMissed++;

            if (!agentMap.has(call.agent_name)) {
                agentMap.set(call.agent_name, {
                    agent_name: call.agent_name,
                    agent_number: call.agent_number,
                    total_calls: 0,
                    missed_calls: 0,
                    connected_calls: 0,
                    total_duration_minutes: 0,
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

            if (call.call_status === 'Connected') {
                agentData.connected_calls++;
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

        const agentStats = Array.from(agentMap.values()).map(agent => ({
            agent_name: agent.agent_name,
            agent_number: agent.agent_number,
            total_calls: agent.total_calls,
            connected_calls: agent.connected_calls,
            missed_calls: agent.missed_calls,
            total_duration_minutes: agent.total_duration_minutes.toFixed(2),
            avg_call_duration_minutes: agent.connected_calls > 0 ? 
                (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
            connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
            missed_rate: ((agent.missed_calls / agent.total_calls) * 100).toFixed(2) + '%',
            connected_calls_detail: agent.connected_details,
            missed_calls_detail: agent.missed_details
        }));

        agentStats.sort((a, b) => b.total_calls - a.total_calls);

        const response = {
            success: true,
            data: {
                summary: {
                    period: {
                        start_date: startDate,
                        end_date: endDate
                    },
                    metrics: {
                        total_calls: totalCalls,
                        unique_leads: uniqueLeads.size,
                        connected_calls: totalConnected,
                        missed_calls: totalMissed,
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
exports.getOutboundCallAnalytics = async (req, res) => {
    try {
        const startDate = req.query.startDate;
        const endDate = req.query.endDate || startDate;
        const agentName = req.query.agentName;
        const ivrNumber = req.query.ivrNumber;

        if (!startDate || !moment(startDate).isValid() || !moment(endDate).isValid()) {
            return res.status(400).json({
                success: false,
                message: "Valid start date required"
            });
        }

        if (!ivrNumber || !['8517009997', '8517009998'].includes(ivrNumber)) {
            return res.status(400).json({
                success: false,
                message: "Valid IVR number required (8517009997 or 8517009998)"
            });
        }

        // Modify date range to include full days
        const startDateTime = moment(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const endDateTime = moment(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

        // Modified query to focus on Call End events
        const callDetails = await sequelize.query(`
            SELECT 
                cl.*,
                emp.EmployeeName as agent_name,
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
                    WHEN cl.eventType = 'Call End' AND cl.bDialStatus = 'Connected' THEN 'Connected'
                    WHEN cl.eventType = 'Call End' THEN 'Not Connected'
                    ELSE NULL
                END as call_status,
                CASE 
                    WHEN cl.bPartyConnectedTime IS NOT NULL AND cl.bPartyEndTime IS NOT NULL 
                    THEN TIMESTAMPDIFF(SECOND, cl.bPartyConnectedTime, cl.bPartyEndTime)
                    ELSE 0
                END as call_duration_seconds
            FROM call_logs cl
            LEFT JOIN employee_table emp ON cl.aPartyNo = emp.EmployeePhone
            LEFT JOIN audit_lead_table alt ON cl.bPartyNo = alt.Mobile
            WHERE cl.dni = :ivrNumber
            AND cl.eventType = 'Call End'
            AND cl.callStartTime BETWEEN :startDateTime AND :endDateTime
            ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
            ORDER BY cl.callStartTime DESC
        `, {
            replacements: { 
                startDateTime, 
                endDateTime, 
                ivrNumber, 
                ...(agentName && { agentName }) 
            },
            type: QueryTypes.SELECT
        });

        // Process the data
        const agentMap = new Map();
        let totalCalls = 0;
        let totalConnected = 0;
        let totalNotConnected = 0;
        let uniqueLeads = new Set();

        callDetails.forEach(call => {
            if (!call.agent_name) return;

            totalCalls++;
            if (call.Lot_Number) uniqueLeads.add(call.Lot_Number);
            if (call.call_status === 'Connected') totalConnected++;
            if (call.call_status === 'Not Connected') totalNotConnected++;

            if (!agentMap.has(call.agent_name)) {
                agentMap.set(call.agent_name, {
                    agent_name: call.agent_name,
                    agent_number: call.aPartyNo,
                    total_calls: 0,
                    connected_calls: 0,
                    not_connected_calls: 0,
                    total_duration_minutes: 0,
                    connected_details: [],
                    not_connected_details: []
                });
            }

            const agentData = agentMap.get(call.agent_name);
            agentData.total_calls++;

            const callDetail = {
                call_id: call.callId,
                date: moment(call.callStartTime).format('YYYY-MM-DD'),
                time: moment(call.callStartTime).format('HH:mm:ss'),
                customer_number: call.bPartyNo,
                duration_minutes: (call.call_duration_seconds / 60).toFixed(2),
                dial_status: call.bDialStatus,
                release_reason: call.bPartyReleaseReason || 'N/A'
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

            if (call.call_status === 'Connected') {
                agentData.connected_calls++;
                agentData.total_duration_minutes += call.call_duration_seconds / 60;
                callDetail.connected_at = moment(call.bPartyConnectedTime).format('YYYY-MM-DD HH:mm:ss');
                callDetail.ended_at = moment(call.bPartyEndTime).format('YYYY-MM-DD HH:mm:ss');
                agentData.connected_details.push({
                    ...callDetail,
                    customer_details: customerDetail
                });
            } else {
                agentData.not_connected_calls++;
                agentData.not_connected_details.push({
                    ...callDetail,
                    customer_details: customerDetail
                });
            }
        });

        const agentStats = Array.from(agentMap.values()).map(agent => ({
            agent_name: agent.agent_name,
            agent_number: agent.agent_number,
            total_calls: agent.total_calls,
            connected_calls: agent.connected_calls,
            not_connected_calls: agent.not_connected_calls,
            total_duration_minutes: agent.total_duration_minutes.toFixed(2),
            avg_call_duration_minutes: agent.connected_calls > 0 ? 
                (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
            connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
            connected_details: agent.connected_details,
            not_connected_details: agent.not_connected_details
        }));

        agentStats.sort((a, b) => b.total_calls - a.total_calls);

        const response = {
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
                        unique_leads: uniqueLeads.size,
                        connected_calls: totalConnected,
                        not_connected_calls: totalNotConnected,
                        connection_rate: totalCalls ? 
                            ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
                    }
                },
                agents: agentStats
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error in getOutboundCallAnalytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

