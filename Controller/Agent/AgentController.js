const Lead_Detail = require("../../models/lead_detail");
const Employee = require("../../models/employee");
const Campaign = require("../../models/campaign");
const LeadLog = require("../../models/leads_logs");
const { Op } = require("sequelize");
const moment = require("moment");
const FollowUPByAgent = require("../../models/FollowUpByAgent");
const sequelize = require("../../models/index");

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
              lead_owner: "Lead Owner is required for connected calls"
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
          BDMId: (lead_created_by === 2 || lead_created_by === 3) ? BDMId : null,
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
