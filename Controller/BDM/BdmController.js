const Lead_Detail = require("../../models/lead_detail");
const Employee = require("../../models/employee");
const Estimation = require("../../models/estimation");
const Campaign = require("../../models/campaign");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { uploadFile } = require("../../Library/awsS3");
const LeadDetail = require("../../models/lead_detail");
const LeadLog = require("../../models/leads_logs");
const sequelize = require("../../models/index");
const { Op ,QueryTypes,Sequelize } = require('sequelize');
const ParivatanBDM = require('../../models/Parivartan_BDM');
const ParivatanRegion = require('../../models/Parivartan_Region');

const moment = require("moment");
const ExcelJS = require('exceljs');
const Employee_Role = require("../../models/employeRole");
const Parivartan_BDM = require("../../models/Parivartan_BDM");
const Parivartan_Region = require("../../models/Parivartan_Region");
const BdmLeadAction = require("../../models/BdmLeadAction");
const BdmTravelDetailForm = require("../../models/BdmTravelDetailForm");

 
 
 
 


exports.getLeadsByBDMId = async (req, res) => {
  try {
    const { bdmId } = req.params;

    // Fetch all leads
    const leads = await Lead_Detail.findAll({
      where: { BDMId: bdmId },
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
    });

    // Calculate counts for all categories
    const totalCount = leads.length;
    const categoryCounts = leads.reduce((acc, lead) => {
      const category = lead.category || "uncategorized";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Prepare response object
    const response = {
      leads,
      counts: {
        total: totalCount,
        ...categoryCounts,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error retrieving leads:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateBDMRemarks = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { bdm_remark } = req.body;

    const lead = await Lead_Detail.findOne({ where: { id: leadId } });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    lead.bdm_remark = bdm_remark;
    await lead.save();

    res.status(200).json({ message: "BDM remarks updated successfully", lead });
  } catch (error) {
    console.error("Error updating BDM remarks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllEstimations = async (req, res) => {
  try {
    const estimations = await Estimation.findAll({
      include: [
        {
          model: Lead_Detail,
          attributes: ["id", "CustomerName", "MobileNo", "Project", "BDMId","state_name", "region_name","pincode"],
          include: [
            {
              model: Employee,
              as: "BDM",
              attributes: ["EmployeeId", "EmployeeName"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedEstimations = estimations.map((estimation) => {
      const estJson = estimation.toJSON();
      return {
        ...estJson,
        BdmName: estJson.LeadDetail?.BDM?.EmployeeName || null,
        BdmId: estJson.LeadDetail?.BDMId || estJson.Bdm_id || null,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedEstimations.length,
      data: formattedEstimations,
    });
  } catch (error) {
    console.error("Error fetching estimations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.updateEstimationStatus = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      estimation_id,
      status,
      employeeId,
      estimation_amount,
      estimationNumber,
      firm_farmer_name,
      LeadDetailId,
      category,
      sub_category,
      follow_up_date,
      remark,
      Approval_from,
    } = req.body;

    // Validate the status
    const validStatuses = [
      "Generated",
      "Need for Approval",
      "Converted",
      "Rejected",
    ];
    if (!validStatuses.includes(status)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be one of: Need for Approval, Generated, Estimation Shared, Converted",
      });
    }

    // Check if the employee exists
    const employee = await Employee.findByPk(employeeId, { transaction: t });
    if (!employee) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const estimation = await Estimation.findByPk(id, { transaction: t });

    if (!estimation) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Estimation not found",
      });
    }

    let imageUrls = [];
    if (req.files && req.files.images) {
      const files = req.files.images;
      for (const file of files) {
        const documentResponse = await uploadFile(file, "estimation");
        const imageUrl = `https://ib-paultry-image.s3.ap-south-2.amazonaws.com/${documentResponse.Key}`;
        imageUrls.push(imageUrl);
      }
    }

    // Prepare the update object for Estimation
    const updateData = {
      status,
      firm_farmer_name,
      lastUpdatedBy: employeeId,
      estimation_amount: estimation_amount || estimation.estimation_amount,
      estimationNumber: estimationNumber || estimation.estimationNumber,
      ho_document: imageUrls,
      Ho_executive_id: employeeId,
      Approval_from,
    };

    // Add Estimation_generated_date only if the status is 'Generated'
    if (status === "Generated") {
      updateData.Estimation_generated_date = new Date();
    }

    // Update the estimation
    await estimation.update(updateData, { transaction: t });

    // Update LeadDetail
    const leadDetail = await LeadDetail.findByPk(LeadDetailId, {
      transaction: t,
    });
    if (leadDetail) {
      await leadDetail.update(
        {
          follow_up_date,
          category,
          sub_category,
          bdm_remark: remark,
          last_action: `Estimation ${status}`,
        },
        { transaction: t }
      );
    } else {
      console.warn(`LeadDetail with id ${LeadDetailId} not found.`);
    }

    // Create a log entry
    await LeadLog.create(
      {
        action_type: `Estimation ${status}`,
        category,
        sub_category,
        remarks: remark,
        performed_by: employeeId,
        LeadDetailId,
        follow_up_date,
        status: status,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(200).json({
      success: true,
      message: "Estimation updated successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error updating estimation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.updateEstimationDownloadStatus = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { estimation_id, download_done, employeeId } = req.body;

    if (!download_done) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "download_done parameter is required and must be true",
      });
    }

    const estimation = await Estimation.findByPk(estimation_id, {
      transaction: t,
    });

    if (!estimation) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Estimation not found",
      });
    }

    if (estimation.status !== "Generated") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message:
          'Estimation status must be "Generated" to update to "Estimation Shared"',
      });
    }

    // Update the estimation
    await estimation.update(
      {
        status: "Estimation Shared",
        lastUpdatedBy: employeeId,
      },
      { transaction: t }
    );

    // Update LeadDetail
    const leadDetail = await LeadDetail.findByPk(estimation.LeadDetailId, {
      transaction: t,
    });
    if (leadDetail) {
      await leadDetail.update(
        {
          last_action: "Estimation Shared",
        },
        { transaction: t }
      );
    } else {
      console.warn(`LeadDetail with id ${estimation.LeadDetailId} not found.`);
    }

    // Create a log entry
    await LeadLog.create(
      {
        action_type: "Estimation Shared",
        // category: leadDetail ? leadDetail.category : null,
        // sub_category: leadDetail ? leadDetail.sub_category : null,
        // remarks: 'Estimation downloaded and shared',
        performed_by: employeeId,
        // LeadDetailId: estimation.LeadDetailId,
        // follow_up_date: leadDetail ? leadDetail.follow_up_date : null,
        // status: 'Estimation Shared'
      },
      { transaction: t }
    );

    await t.commit();

    res.status(200).json({
      success: true,
      message: 'Estimation status updated to "Estimation Shared" successfully',
    });
  } catch (error) {
    await t.rollback();
    console.error("Error updating estimation download status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};





// exports.getEmployeeLeads = async (req, res) => {
//   try {
//       const {
//           page = 1,
//           pageSize = 10,
//           sortBy = 'createdAt',
//           sortOrder = 'DESC'
//       } = req.query;

//       const { employeeId } = req.params;

//       // Updated where clause to include both conditions
//       const employeeAssignments = await ParivatanBDM.findAll({
//           where: {
//               EmployeeId: employeeId,
//               Deleted: 'N',
//               [Op.or]: [
//                   { is_active: 'Active' },
//                   {
//                       [Op.and]: [
//                           { is_zonal_manager: 'Yes' },
//                           { is_active: ['Active', 'Inactive'] }
//                       ]
//                   }
//               ]
//           }
//       });

//       if (!employeeAssignments || employeeAssignments.length === 0) {
//           return res.status(404).json({
//               success: false,
//               message: 'No assignments found for this employee'
//           });
//       }

//       // Rest of the code remains same
//       const regionIds = employeeAssignments.map(ea => ea.RegionId);


//       const { count, rows: leads } = await LeadDetail.findAndCountAll({
//           where: {
//               RegionId: {
//                   [Op.in]: regionIds
//               },
//               Project: {
//                   [Op.in]: employeeAssignments.map(ea => ea.Project).filter(p => p)
//               }
//           },
//           include: [{
//               model: ParivatanRegion,
//               as: 'Region',  // Make sure this matches the alias in your association
//               attributes: ['RegionName'],
//               where: {
//                   Deleted: 'N'
//               }
//           }],
//           order: [[sortBy, sortOrder]],
//           limit: parseInt(pageSize),
//           offset: (parseInt(page) - 1) * parseInt(pageSize)
//       });
//    console.log(employeeAssignments);

//       res.json({
//           success: true,
//           totalCount: count,
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(count / parseInt(pageSize)),
//           pageSize: parseInt(pageSize),
//           leads: leads,
//           employeeInfo: {
//               employeeId,
//               assignments: employeeAssignments.map(ea => ({
//                   regionId: ea.RegionId,
//                   project: ea.Project,
//                   is_active: ea.is_active,
//                   is_zonal_manager: ea.is_zonal_manager
//               }))
//           }
//       });

//   } catch (error) {
//       console.error('Error fetching employee leads:', error);
//       res.status(500).json({
//           success: false,
//           message: 'Error fetching employee leads',
//           error: error.message
//       });
//   }
// };


// exports.getEmployeeLeads = async (req, res) => {
//   try {
//       const {
//           page = 1,
//           pageSize = 10,
//           sortBy = 'createdAt',
//           sortOrder = 'DESC',
//           category,
//           location,
//           call_status,
//           call_type,
//           fromDate,
//           toDate,
//           search    // New general search parameter
//       } = req.query;

//       const { employeeId } = req.params;

//       // Employee assignments query remains same
//       const employeeAssignments = await ParivatanBDM.findAll({
//           where: {
//               EmployeeId: employeeId,
//               Deleted: 'N',
//               [Op.or]: [
//                   { is_active: 'Active' },
//                   {
//                       [Op.and]: [
//                           { is_zonal_manager: 'Yes' },
//                           { is_active: ['Active', 'Inactive'] }
//                       ]
//                   }
//               ]
//           }
//       });

//       if (!employeeAssignments || employeeAssignments.length === 0) {
//           return res.status(404).json({
//               success: false,
//               message: 'No assignments found for this employee'
//           });
//       }

//       const regionIds = employeeAssignments.map(ea => ea.RegionId);

//       // Build where clause based on filters
//       let whereClause = {
//           RegionId: {
//               [Op.in]: regionIds
//           },
//           Project: {
//               [Op.in]: employeeAssignments.map(ea => ea.Project).filter(p => p)
//           }
//       };

//       // Add search condition if search parameter exists
//       if (search) {
//           whereClause[Op.or] = [
//               { CustomerName: { [Op.like]: `%${search}%` } },
//               { MobileNo: { [Op.like]: `%${search}%` } },
//               { WhatsappNo: { [Op.like]: `%${search}%` } },
//               { CustomerMailId: { [Op.like]: `%${search}%` } },
//               { location: { [Op.like]: `%${search}%` } },
//               { pincode: { [Op.like]: `%${search}%` } }
//           ];
//       }

//       // Add other filters
//       if (category) whereClause.category = category;
//       if (location) whereClause.location = { [Op.like]: `%${location}%` };
//       if (call_status) whereClause.call_status = call_status;
//       if (call_type) whereClause.call_type = call_type;
//       if (fromDate && toDate) {
//           whereClause.createdAt = {
//               [Op.between]: [new Date(fromDate), new Date(toDate)]
//           };
//       }

//       // Get category counts with search condition
//       const categoryCounts = await LeadDetail.findAll({
//           where: whereClause,
//           attributes: [
//               'category',
//               [sequelize.fn('COUNT', sequelize.col('id')), 'count']
//           ],
//           group: ['category']
//       });

//       // Get leads with pagination and search
//       const { count, rows: leads } = await LeadDetail.findAndCountAll({
//           where: whereClause,
//           include: [{
//               model: ParivatanRegion,
//               as: 'Region',
//               attributes: ['RegionName'],
//               where: {
//                   Deleted: 'N'
//               }
//           }],
//           order: [[sortBy, sortOrder]],
//           limit: parseInt(pageSize),
//           offset: (parseInt(page) - 1) * parseInt(pageSize)
//       });

//       // Format category counts
//       const categoryStats = {
//           cold: 0,
//           warm: 0,
//           hot: 0,
//           closed: 0,
//           pending: 0
//       };

//       categoryCounts.forEach(cat => {
//           if (cat.category && cat.dataValues.count) {
//               categoryStats[cat.category.toLowerCase()] = parseInt(cat.dataValues.count);
//           }
//       });

//       res.json({
//           success: true,
//           totalCount: count,
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(count / parseInt(pageSize)),
//           pageSize: parseInt(pageSize),
//           categoryStats,
//           leads,
//           employeeInfo: {
//               employeeId,
//               assignments: employeeAssignments.map(ea => ({
//                   regionId: ea.RegionId,
//                   project: ea.Project,
//                   is_active: ea.is_active,
//                   is_zonal_manager: ea.is_zonal_manager
//               }))
//           }
//       });

//   } catch (error) {
//       console.error('Error fetching employee leads:', error);
//       res.status(500).json({
//           success: false,
//           message: 'Error fetching employee leads',
//           error: error.message
//       });
//   }
// };






//changes on 9 january

// exports.getEmployeeLeads = async (req, res) => {
//   try {
//       const {
//           page = 1,
//           pageSize = 10,
//           sortBy = 'createdAt',
//           sortOrder = 'DESC',
//           search,
//           category,
//           location,
//           call_status,
//           call_type,
//           fromDate,
//           toDate
//       } = req.query;

//       const { employeeId } = req.params;

//       const employeeAssignments = await ParivatanBDM.findAll({
//           where: {
//               EmployeeId: employeeId,
//               Deleted: 'N',
//               [Op.or]: [
//                   { is_active: 'Active' },
//                   {
//                       [Op.and]: [
//                           { is_zonal_manager: 'Yes' },
//                           { is_active: ['Active', 'Inactive'] }
//                       ]
//                   }
//               ]
//           }
//       });

//       if (!employeeAssignments || employeeAssignments.length === 0) {
//           return res.status(404).json({
//               success: false,
//               message: 'No assignments found for this employee'
//           });
//       }

//       const regionIds = employeeAssignments.map(ea => ea.RegionId);

//       let whereClause = {
//           RegionId: {
//               [Op.in]: regionIds
//           },
//           Project: {
//               [Op.in]: employeeAssignments.map(ea => ea.Project).filter(p => p)
//           }
//       };

//       if (search) {
//           whereClause[Op.or] = [
//               { CustomerName: { [Op.like]: `%${search}%` } },
//               { MobileNo: { [Op.like]: `%${search}%` } },
//               { WhatsappNo: { [Op.like]: `%${search}%` } },
//               { CustomerMailId: { [Op.like]: `%${search}%` } },
//               { location: { [Op.like]: `%${search}%` } },
//               { pincode: { [Op.like]: `%${search}%` } }
//           ];
//       }

//       if (category) whereClause.category = category;
//       if (location) whereClause.location = { [Op.like]: `%${location}%` };
//       if (call_status) whereClause.call_status = call_status;
//       if (call_type) whereClause.call_type = call_type;
//       if (fromDate && toDate) {
//           whereClause.createdAt = {
//               [Op.between]: [new Date(fromDate), new Date(toDate)]
//           };
//       }

//       const categoryCounts = await LeadDetail.findAll({
//           where: whereClause,
//           attributes: [
//               'category',
//               [sequelize.fn('COUNT', sequelize.col('id')), 'count']
//           ],
//           group: ['category']
//       });

//       const { count, rows: leads } = await LeadDetail.findAndCountAll({
//           where: whereClause,
//           include: [
//               {
//                   model: ParivatanRegion,
//                   as: 'Region',
//                   attributes: ['RegionName'],
//                   where: {
//                       Deleted: 'N'
//                   }
//               },
//               {
//                   model: Employee,
//                   as: 'BDM',
//                   attributes: ['EmployeeName']
//               },
//               {
//                   model: Employee,
//                   as: 'Agent',
//                   attributes: ['EmployeeName']
//               },
//               {
//                   model: Campaign,
//                   as: 'Campaign',
//                   attributes: ['CampaignName']
//               }
//           ],
//           order: [[sortBy, sortOrder]],
//           limit: parseInt(pageSize),
//           offset: (parseInt(page) - 1) * parseInt(pageSize)
//       });

//       const categoryStats = {
//           cold: 0,
//           warm: 0,
//           hot: 0,
//           closed: 0,
//           pending: 0
//       };

//       categoryCounts.forEach(cat => {
//           if (cat.category && cat.dataValues.count) {
//               categoryStats[cat.category.toLowerCase()] = parseInt(cat.dataValues.count);
//           }
//       });

//       const transformedLeads = leads.map(lead => {
//           const leadData = lead.toJSON();
//           return {
//               ...leadData,
//               source_of_lead_generated_name: lead.Campaign ? lead.Campaign.CampaignName : null,
//               BDMName: lead.BDM ? lead.BDM.EmployeeName : null,
//               AgentName: lead.Agent ? lead.Agent.EmployeeName : null,
//               lead_owner: lead.lead_created_by === 1
//                   ? (lead.Agent ? lead.Agent.EmployeeName : 'CSE')
//                   : (lead.BDM ? lead.BDM.EmployeeName : 'BDM')
//           };
//       });

//       res.json({
//           success: true,
//           totalCount: count,
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(count / parseInt(pageSize)),
//           pageSize: parseInt(pageSize),
//           categoryStats,
//           leads: transformedLeads,
//           employeeInfo: {
//               employeeId,
//               assignments: employeeAssignments.map(ea => ({
//                   regionId: ea.RegionId,
//                   project: ea.Project,
//                   is_active: ea.is_active,
//                   is_zonal_manager: ea.is_zonal_manager
//               }))
//           }
//       });

//   } catch (error) {
//       console.error('Error fetching employee leads:', error);
//       res.status(500).json({
//           success: false,
//           message: 'Error fetching employee leads',
//           error: error.message
//       });
//   }
// };







// exports.getEmployeeLeads = async (req, res) => {
//   try {
//     const {


//       sortBy = 'createdAt',
//       sortOrder = 'DESC',
//       search,
//       InquiryType,
//       Project,
//       region,
//       category,
//       subcategory,
//       campaignName,
//       BdmID,
//       agentName,
//       location,
//       call_status,
//       call_type,
//       fromDate,
//       toDate
//     } = req.query;


//     const page = parseInt(req.query.page) || 1;
//     const pageSize = parseInt(req.query.limit) || 10;
//     // const offset = (page - 1) * limit;

//     const { employeeId } = req.params;

//     // Get employee assignments
//     const employeeAssignments = await ParivatanBDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         Deleted: 'N',
//         [Op.or]: [
//           { is_active: 'Active' },
//           {
//             [Op.and]: [
//               { is_zonal_manager: 'Yes' },
//               { is_active: ['Active', 'Inactive'] }
//             ]
//           }
//         ]
//       }
//     });

//     if (!employeeAssignments || employeeAssignments.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'No assignments found for this employee'
//       });
//     }

//     const regionIds = employeeAssignments.map(ea => ea.RegionId);

//     // Build the where clause
//     let whereClause = {
//       RegionId: {
//         [Op.in]: regionIds
//       },
//       Project: {
//         [Op.in]: employeeAssignments.map(ea => ea.Project).filter(p => p)
//       }
//     };

//     // Add common search
//     if (search) {
//       whereClause[Op.or] = [
//         { CustomerName: { [Op.like]: `%${search}%` } },
//         { MobileNo: { [Op.like]: `%${search}%` } },
//         { WhatsappNo: { [Op.like]: `%${search}%` } },
//         { CustomerMailId: { [Op.like]: `%${search}%` } },
//         { location: { [Op.like]: `%${search}%` } },
//         { pincode: { [Op.like]: `%${search}%` } },
//         { InquiryType: { [Op.like]: `%${search}%` } },
//         { category: { [Op.like]: `%${search}%` } },
//         // { '$Campaign.CampaignName$': { [Op.like]: `%${search}%` } },
//         // { '$BDM.EmployeeName$': { [Op.like]: `%${search}%` } },
//         // { '$Agent.EmployeeName$': { [Op.like]: `%${search}%` } }
//       ];
//     }

//     // Add individual filters
//     if (InquiryType) {
//       whereClause.InquiryType = { [Op.in]: InquiryType.split(',').map(v => v.trim()) };
//     }
//     if (Project) {
//       whereClause.Project = { [Op.in]: Project.split(',').map(v => v.trim()) };
//     }
//     if (region) {
//       whereClause.region_name = { [Op.in]: region.split(',').map(v => v.trim()) };
//     }
//     if (category) {
//       whereClause.category = { [Op.in]: category.split(',').map(v => v.trim()) };
//     }
//     if (subcategory) {
//       whereClause.sub_category = { [Op.in]: subcategory.split(',').map(v => v.trim()) };
//     }
//     if (location) whereClause.location = { [Op.like]: `%${location}%` };
//     if (call_status) whereClause.call_status = call_status;
//     if (call_type) whereClause.call_type = call_type;
//     if (fromDate && toDate) {
//       whereClause.createdAt = {
//         [Op.between]: [new Date(fromDate), new Date(toDate)]
//       };
//     }

//     // Build include conditions
//     const includeConditions = [
//       {
//         model: ParivatanRegion,
//         as: 'Region',
//         attributes: ['RegionName'],
//         where: {
//           Deleted: 'N'
//         }
//       },
//       {
//         model: Employee,
//         as: 'BDM',
//         attributes: ['EmployeeName']
//       },
//       {
//         model: Employee,
//         as: 'Agent',
//         attributes: ['EmployeeName']
//       },
//       {
//         model: Campaign,
//         as: 'Campaign',
//         attributes: ['CampaignName']
//       }
//     ];

//     // Add campaign filter
//     if (campaignName) {
//       includeConditions.find(inc => inc.as === 'Campaign').where = {
//         CampaignName: {
//           [Op.in]: campaignName.split(',').map(v => v.trim())
//         }
//       };
//     }

//     // Add BDM filter
//     if (BdmID) {
//       includeConditions.find(inc => inc.as === 'BDM').where = {
//         EmployeeId: {
//           [Op.in]: BdmID.split(',').map(v => v.trim())
//         }
//       };
//     }

//     // Add Agent filter
//     if (agentName) {
//       includeConditions.find(inc => inc.as === 'Agent').where = {
//         EmployeeId: {
//           [Op.in]: agentName.split(',').map(v => v.trim())
//         }
//       };
//     }

//     // Get category counts
//     const categoryCounts = await LeadDetail.findAll({
//       where: whereClause,
//       attributes: [
//         'category',
//         [sequelize.fn('COUNT', sequelize.col('id')), 'count']
//       ],
//       group: ['category']
//     });

//     // Get filtered leads
//     const { count, rows: leads } = await LeadDetail.findAndCountAll({
//       where: whereClause,
//       include: includeConditions,
//       order: [[sortBy, sortOrder]],
//       limit: parseInt(pageSize),
//       offset: (parseInt(page) - 1) * parseInt(pageSize),
//       distinct: true
//     });

//     // Process category stats
//     const categoryStats = {
//       cold: 0,
//       warm: 0,
//       hot: 0,
//       closed: 0,
//       pending: 0
//     };

//     categoryCounts.forEach(cat => {
//       if (cat.category && cat.dataValues.count) {
//         categoryStats[cat.category.toLowerCase()] = parseInt(cat.dataValues.count);
//       }
//     });

//     // Transform leads data
//     const transformedLeads = leads.map(lead => {
//       const leadData = lead.toJSON();
//       return {
//         ...leadData,
//         source_of_lead_generated_name: lead.Campaign ? lead.Campaign.CampaignName : null,
//         BDMName: lead.BDM ? lead.BDM.EmployeeName : null,
//         AgentName: lead.Agent ? lead.Agent.EmployeeName : null,
//         lead_owner: lead.lead_created_by === 1
//           ? (lead.Agent ? lead.Agent.EmployeeName : 'CSE')
//           : (lead.BDM ? lead.BDM.EmployeeName : 'BDM')
//       };
//     });

//     res.json({
//       success: true,
//       totalCount: count,
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(count / parseInt(pageSize)),
//       pageSize: parseInt(pageSize),
//       categoryStats,
//       leads: transformedLeads,
//       employeeInfo: {
//         employeeId,
//         assignments: employeeAssignments.map(ea => ({
//           regionId: ea.RegionId,
//           project: ea.Project,
//           is_active: ea.is_active,
//           is_zonal_manager: ea.is_zonal_manager
//         }))
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching employee leads:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching employee leads',
//       error: error.message
//     });
//   }
// };




// jan 10






exports.getEmployeeLeads = async (req, res) => {
  try {
    const {
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      InquiryType,
      Project,
      region,
      category,
      subcategory,
      campaignName,
      BdmID,
      agentName,
      location,
      call_status,
      call_type,
      fromDate,
      toDate
    } = req.query;

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 10;

    const { employeeId } = req.params;

    // Get employee assignments
    const employeeAssignments = await ParivatanBDM.findAll({
      where: {
        EmployeeId: employeeId,
        Deleted: 'N',
        [Op.or]: [
          { is_active: 'Active' },
          {
            [Op.and]: [
              { is_zonal_manager: 'Yes' },
              { is_active: ['Active', 'Inactive'] }
            ]
          }
        ]
      }
    });

    if (!employeeAssignments || employeeAssignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No assignments found for this employee'
      });
    }

    const regionIds = employeeAssignments.map(ea => ea.RegionId);
    console.log(regionIds , '-----------');
    

    // Build the base where clause for region and project
    const baseWhereClause = {
      RegionId: {
        [Op.in]: regionIds
      },
      // Project: {
      //   [Op.in]: employeeAssignments.map(ea => ea.Project).filter(p => p)
      // }
    };

    // Get category counts using Promise.all (unaffected by filters)
    const categoryCounts = await Promise.all([
      LeadDetail.count({
        where: {
          ...baseWhereClause,
          category: 'hot'
        }
      }),
      LeadDetail.count({
        where: {
          ...baseWhereClause,
          category: 'warm'
        }
      }),
      LeadDetail.count({
        where: {
          ...baseWhereClause,
          category: 'cold'
        }
      }),
      LeadDetail.count({
        where: {
          ...baseWhereClause,
          category: 'pending'
        }
      }),
      LeadDetail.count({
        where: {
          ...baseWhereClause,
          category: 'closed'
        }
      })
    ]);

    // Build the where clause for filtered results
    let whereClause = { ...baseWhereClause };

    // Add common search
    if (search) {
      whereClause[Op.or] = [
        { CustomerName: { [Op.like]: `%${search}%` } },
        { MobileNo: { [Op.like]: `%${search}%` } },
        { WhatsappNo: { [Op.like]: `%${search}%` } },
        { CustomerMailId: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
        { pincode: { [Op.like]: `%${search}%` } },
        { InquiryType: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    // Add individual filters
    if (InquiryType) {
      whereClause.InquiryType = { [Op.in]: InquiryType.split(',').map(v => v.trim()) };
    }
    if (Project) {
      whereClause.Project = { [Op.in]: Project.split(',').map(v => v.trim()) };
    }
    if (region) {
      whereClause.region_name = { [Op.in]: region.split(',').map(v => v.trim()) };
    }
    if (category) {
      whereClause.category = { [Op.in]: category.split(',').map(v => v.trim()) };
    }
    if (subcategory) {
      whereClause.sub_category = { [Op.in]: subcategory.split(',').map(v => v.trim()) };
    }
    if (location) whereClause.location = { [Op.like]: `%${location}%` };
    if (call_status) whereClause.call_status = call_status;
    if (call_type) whereClause.call_type = call_type;
    if (fromDate && toDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(fromDate), new Date(toDate)]
      };
    }

    // Build include conditions
    const includeConditions = [
      {
        model: ParivatanRegion,
        as: 'Region',
        attributes: ['RegionName'],
        where: {
          Deleted: 'N'
        }
      },
      {
        model: Employee,
        as: 'BDM',
        attributes: ['EmployeeName']
      },
      {
        model: Employee,
        as: 'Agent',
        attributes: ['EmployeeName']
      },
      {
        model: Campaign,
        as: 'Campaign',
        attributes: ['CampaignName']
      }
    ];

    // Add campaign filter
    if (campaignName) {
      includeConditions.find(inc => inc.as === 'Campaign').where = {
        CampaignName: {
          [Op.in]: campaignName.split(',').map(v => v.trim())
        }
      };
    }

    // Add BDM filter
    if (BdmID) {
      includeConditions.find(inc => inc.as === 'BDM').where = {
        EmployeeId: {
          [Op.in]: BdmID.split(',').map(v => v.trim())
        }
      };
    }

    // Add Agent filter
    if (agentName) {
      includeConditions.find(inc => inc.as === 'Agent').where = {
        EmployeeId: {
          [Op.in]: agentName.split(',').map(v => v.trim())
        }
      };
    }

    // Get filtered leads
    const { count, rows: leads } = await LeadDetail.findAndCountAll({
      where: whereClause,
      include: includeConditions,
      order: [[sortBy, sortOrder]],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      distinct: true
    });

    // Process category stats (unaffected by filters)
    const categoryStats = {
      hot: categoryCounts[0],
      warm: categoryCounts[1],
      cold: categoryCounts[2],
      pending: categoryCounts[3],
      closed: categoryCounts[4],
      total: categoryCounts.reduce((a, b) => a + b, 0)
    };

    // Transform leads data
    const transformedLeads = leads.map(lead => {
      const leadData = lead.toJSON();
      return {
        ...leadData,
        source_of_lead_generated_name: lead.Campaign ? lead.Campaign.CampaignName : null,
        BDMName: lead.BDM ? lead.BDM.EmployeeName : null,
        AgentName: lead.Agent ? lead.Agent.EmployeeName : null,
        lead_owner: lead.lead_created_by === 1
          ? (lead.Agent ? lead.Agent.EmployeeName : 'CSE')
          : (lead.BDM ? lead.BDM.EmployeeName : 'BDM')
      };
    });

    res.json({
      success: true,
      totalCount: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / parseInt(pageSize)),
      pageSize: parseInt(pageSize),
      categoryStats,
      leads: transformedLeads,
      employeeInfo: {
        employeeId,
        assignments: employeeAssignments.map(ea => ({
          regionId: ea.RegionId,
          project: ea.Project,
          is_active: ea.is_active,
          is_zonal_manager: ea.is_zonal_manager
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching employee leads:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee leads',
      error: error.message
    });
  }
};











// exports.getEmployeeLeads = async (req, res) => {
//   try {
//     const {
//       sortBy = 'createdAt',
//       sortOrder = 'DESC',
//       search,
//       InquiryType,
//       Project,
//       region,
//       category,
//       subcategory,
//       campaignName,
//       BdmID,
//       agentName,
//       location,
//       call_status,
//       call_type,
//       fromDate,
//       toDate
//     } = req.query;

//     const page = parseInt(req.query.page) || 1;
//     const pageSize = parseInt(req.query.limit) || 10;

//     const { employeeId } = req.params;

//     // Get employee assignments
//     const employeeAssignments = await ParivatanBDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         Deleted: 'N',
//         [Op.or]: [
//           { is_active: 'Active' },
//           {
//             [Op.and]: [
//               { is_zonal_manager: 'Yes' },
//               { is_active: ['Active', 'Inactive'] }
//             ]
//           }
//         ]
//       }
//     });

//     if (!employeeAssignments || employeeAssignments.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'No assignments found for this employee'
//       });
//     }

//     const regionIds = employeeAssignments.map(ea => ea.RegionId);
//     const bdmProjects = employeeAssignments.map(ea => ea.Project).filter(p => p);

//     // Build the base where clause for region and project
//     const baseWhereClause = {
//       RegionId: {
//         [Op.in]: regionIds
//       },
//       Project: {
//         [Op.in]: bdmProjects
//       }
//     };

//     // Get category counts using Promise.all (unaffected by filters)
//     const categoryCounts = await Promise.all([
//       LeadDetail.count({
//         where: {
//           ...baseWhereClause,
//           category: 'hot'
//         }
//       }),
//       LeadDetail.count({
//         where: {
//           ...baseWhereClause,
//           category: 'warm'
//         }
//       }),
//       LeadDetail.count({
//         where: {
//           ...baseWhereClause,
//           category: 'cold'
//         }
//       }),
//       LeadDetail.count({
//         where: {
//           ...baseWhereClause,
//           category: 'pending'
//         }
//       }),
//       LeadDetail.count({
//         where: {
//           ...baseWhereClause,
//           category: 'closed'
//         }
//       })
//     ]);

//     // Build the where clause for filtered results
//     let whereClause = { ...baseWhereClause };

//     // Add common search
//     if (search) {
//       whereClause[Op.or] = [
//         { CustomerName: { [Op.like]: `%${search}%` } },
//         { MobileNo: { [Op.like]: `%${search}%` } },
//         { WhatsappNo: { [Op.like]: `%${search}%` } },
//         { CustomerMailId: { [Op.like]: `%${search}%` } },
//         { location: { [Op.like]: `%${search}%` } },
//         { pincode: { [Op.like]: `%${search}%` } },
//         { InquiryType: { [Op.like]: `%${search}%` } },
//         { category: { [Op.like]: `%${search}%` } }
//       ];
//     }

//     // Add individual filters
//     if (InquiryType) {
//       whereClause.InquiryType = { [Op.in]: InquiryType.split(',').map(v => v.trim()) };
//     }
//     if (Project) {
//       whereClause.Project = { [Op.in]: Project.split(',').map(v => v.trim()) };
//     }
//     if (region) {
//       whereClause.region_name = { [Op.in]: region.split(',').map(v => v.trim()) };
//     }
//     if (category) {
//       whereClause.category = { [Op.in]: category.split(',').map(v => v.trim()) };
//     }
//     if (subcategory) {
//       whereClause.sub_category = { [Op.in]: subcategory.split(',').map(v => v.trim()) };
//     }
//     if (location) whereClause.location = { [Op.like]: `%${location}%` };
//     if (call_status) whereClause.call_status = call_status;
//     if (call_type) whereClause.call_type = call_type;
//     if (fromDate && toDate) {
//       whereClause.createdAt = {
//         [Op.between]: [new Date(fromDate), new Date(toDate)]
//       };
//     }
//     if (BdmID) {
//       whereClause.BdmID = {
//         [Op.in]: BdmID.split(',').map(v => v.trim())
//       };
//     }
//     if (req.query.updatedDate) {
//       const date = new Date(req.query.updatedDate);
//       const nextDay = new Date(date);
//       nextDay.setDate(date.getDate() + 1);

//       whereClause.updatedAt = {
//         [Op.gte]: date,
//         [Op.lt]: nextDay
//       };
//     }
//     if (req.query.followUpDate) {
//       const date = new Date(req.query.followUpDate);
//       const nextDay = new Date(date);
//       nextDay.setDate(date.getDate() + 1);

//       whereClause.follow_up_date = {
//         [Op.gte]: date,
//         [Op.lt]: nextDay
//       };
//     }


//     // Build include conditions
//     const includeConditions = [
//       {
//         model: ParivatanRegion,
//         as: 'Region',
//         attributes: ['RegionName'],
//         where: {
//           Deleted: 'N'
//         }
//       },
//       {
//         model: Employee,
//         as: 'BDM',
//         attributes: ['EmployeeName']
//       },
//       {
//         model: Employee,
//         as: 'Agent',
//         attributes: ['EmployeeName']
//       },
//       {
//         model: Campaign,
//         as: 'Campaign',
//         attributes: ['CampaignName']
//       }
//     ];

//     // Add campaign filter
//     if (campaignName) {
//       includeConditions.find(inc => inc.as === 'Campaign').where = {
//         CampaignName: {
//           [Op.in]: campaignName.split(',').map(v => v.trim())
//         }
//       };
//     }

//     // Add Agent filter
//     if (agentName) {
//       includeConditions.find(inc => inc.as === 'Agent').where = {
//         EmployeeId: {
//           [Op.in]: agentName.split(',').map(v => v.trim())
//         }
//       };
//     }

//     // Get filtered leads
//     const { count, rows: leads } = await LeadDetail.findAndCountAll({
//       where: whereClause,
//       include: includeConditions,
//       order: [[sortBy, sortOrder]],
//       limit: parseInt(pageSize),
//       offset: (parseInt(page) - 1) * parseInt(pageSize),
//       distinct: true
//     });

//     // Process category stats (unaffected by filters)
//     const categoryStats = {
//       hot: categoryCounts[0],
//       warm: categoryCounts[1],
//       cold: categoryCounts[2],
//       pending: categoryCounts[3],
//       closed: categoryCounts[4],
//       total: categoryCounts.reduce((a, b) => a + b, 0)
//     };

//     // Transform leads data
//     const transformedLeads = leads.map(lead => {
//       const leadData = lead.toJSON();
//       return {
//         ...leadData,
//         source_of_lead_generated_name: lead.Campaign ? lead.Campaign.CampaignName : null,
//         BDMName: lead.BDM ? lead.BDM.EmployeeName : null,
//         AgentName: lead.Agent ? lead.Agent.EmployeeName : null,
//         lead_owner: lead.lead_created_by === 1
//           ? (lead.Agent ? lead.Agent.EmployeeName : 'CSE')
//           : (lead.BDM ? lead.BDM.EmployeeName : 'BDM')
//       };
//     });

//     res.json({
//       success: true,
//       totalCount: count,
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(count / parseInt(pageSize)),
//       pageSize: parseInt(pageSize),
//       categoryStats,
//       leads: transformedLeads,
//       employeeInfo: {
//         employeeId,
//         assignments: employeeAssignments.map(ea => ({
//           regionId: ea.RegionId,
//           project: ea.Project,
//           is_active: ea.is_active,
//           is_zonal_manager: ea.is_zonal_manager
//         }))
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching employee leads:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching employee leads',
//       error: error.message
//     });
//   }
// };



// exports.getEmployeeLeads = async (req, res) => {
//   try {
//     const {
//       sortBy = 'createdAt',
//       sortOrder = 'DESC',
//       search,
//       InquiryType,
//       Project,
//       region,
//       category,
//       subcategory,
//       campaignName,
//       BdmID,
//       agentName,
//       location,
//       call_status,
//       call_type,
//       fromDate,
//       toDate,
//       page = 1,
//       limit = 10
//     } = req.query;

//     const { employeeId } = req.params;

//     // Get employee assignments
//     const employeeAssignments = await ParivatanBDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         Deleted: 'N',
//         [Op.or]: [
//           { is_active: 'Active' },
//           {
//             [Op.and]: [
//               { is_zonal_manager: 'Yes' },
//               { is_active: ['Active', 'Inactive'] }
//             ]
//           }
//         ]
//       }
//     });

//     // Build base where clause
//     let baseWhereClause = {};
    
//     // Check if employee is zonal manager
//     const isZonalManager = employeeAssignments.some(ea => ea.is_zonal_manager === 'Yes');
    
//     if (isZonalManager) {
//       const managedRegions = employeeAssignments.map(ea => ea.RegionId);
//       const bdmsInRegions = await ParivatanBDM.findAll({
//         attributes: ['EmployeeId'],
//         where: {
//           RegionId: { [Op.in]: managedRegions },
//           Deleted: 'N'
//         }
//       });
//       const bdmIds = [...bdmsInRegions.map(bdm => bdm.EmployeeId), employeeId];
//       baseWhereClause.BDMId = { [Op.in]: bdmIds };
//     } else {
//       baseWhereClause.BDMId = employeeId;
//     }

//     // Add filters to where clause
//     let whereClause = { ...baseWhereClause };

//     if (search) {
//       whereClause[Op.or] = [
//         { CustomerName: { [Op.like]: `%${search}%` } },
//         { MobileNo: { [Op.like]: `%${search}%` } },
//         { location: { [Op.like]: `%${search}%` } }
//       ];
//     }

//     if (InquiryType) whereClause.InquiryType = InquiryType;
//     if (Project) whereClause.Project = Project;
//     if (region) whereClause.RegionId = region;
//     if (category) whereClause.category = category;
//     if (subcategory) whereClause.sub_category = subcategory;
//     if (campaignName) whereClause.source_of_lead_generated = campaignName;
//     if (location) whereClause.location = { [Op.like]: `%${location}%` };
//     if (call_status) whereClause.call_status = call_status;
//     if (call_type) whereClause.call_type = call_type;

//     if (fromDate && toDate) {
//       whereClause.createdAt = {
//         [Op.between]: [
//           moment(fromDate).startOf('day'),
//           moment(toDate).endOf('day')
//         ]
//       };
//     }

//     // Define include conditions
//     const includeConditions = [
//       {
//         model: Employee,
//         as: 'Agent',
//         attributes: ['EmployeeId', 'EmployeeName']
//       },
//       {
//         model: Employee,
//         as: 'BDM',
//         attributes: ['EmployeeId', 'EmployeeName']
//       },
//       {
//         model: Employee,
//         as: 'Superviser',
//         attributes: ['EmployeeId', 'EmployeeName']
//       },
//       {
//         model: Campaign,
//         as: 'Campaign',
//         attributes: ['CampaignId', 'CampaignName']
//       }
//     ];

//     // Get filtered leads with count
//     const { count, rows: leads } = await LeadDetail.findAndCountAll({
//       where: whereClause,
//       include: includeConditions,
//       order: [[sortBy, sortOrder]],
//       limit: parseInt(limit),
//       offset: (parseInt(page) - 1) * parseInt(limit),
//       distinct: true
//     });

//     // Calculate category stats based on the same whereClause
//     const categoryStats = await LeadDetail.findAll({
//       where: whereClause,
//       attributes: [
//         'category',
//         [sequelize.fn('COUNT', sequelize.col('*')), 'count']
//       ],
//       group: ['category'],
//       raw: true
//     });

//     // Transform category stats
//     const formattedCategoryStats = {
//       hot: 0,
//       warm: 0,
//       cold: 0,
//       pending: 0,
//       closed: 0,
//       total: 0
//     };

//     categoryStats.forEach(stat => {
//       if (stat.category) {
//         formattedCategoryStats[stat.category.toLowerCase()] = parseInt(stat.count);
//         formattedCategoryStats.total += parseInt(stat.count);
//       }
//     });

//     // Transform leads data
//     const transformedLeads = leads.map(lead => {
//       const leadData = lead.toJSON();
//       return {
//         ...leadData,
//         source_of_lead_generated_name: lead.Campaign ? lead.Campaign.CampaignName : null,
//         BDMName: lead.BDM ? lead.BDM.EmployeeName : null,
//         AgentName: lead.Agent ? lead.Agent.EmployeeName : null,
//         lead_owner: lead.lead_created_by === 1
//           ? (lead.Agent ? lead.Agent.EmployeeName : 'CSE')
//           : (lead.BDM ? lead.BDM.EmployeeName : 'BDM')
//       };
//     });

//     res.json({
//       success: true,
//       totalCount: count,
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(count / parseInt(limit)),
//       pageSize: parseInt(limit),
//       categoryStats: formattedCategoryStats,
//       leads: transformedLeads,
//       employeeInfo: {
//         employeeId,
//         assignments: employeeAssignments.map(ea => ({
//           regionId: ea.RegionId,
//           project: ea.Project,
//           is_active: ea.is_active,
//           is_zonal_manager: ea.is_zonal_manager
//         }))
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching employee leads:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching employee leads',
//       error: error.message
//     });
//   }
// };


// exports.getEmployeeLeads = async (req, res) => {
//   try {
//     const {
//       sortBy = 'createdAt',
//       sortOrder = 'DESC',
//       search,
//       InquiryType,
//       Project,
//       region,
//       category,
//       subcategory,
//       campaignName,
//       BdmID,
//       agentName,
//       location,
//       call_status,
//       call_type,
//       fromDate,
//       toDate,
//       page = 1,
//       limit = 10
//     } = req.query;

//     const { employeeId } = req.params;

//     // Define include conditions first
//     const includeConditions = [
//       {
//         model: Employee,
//         as: 'Agent',
//         attributes: ['EmployeeId', 'EmployeeName']
//       },
//       {
//         model: Employee,
//         as: 'BDM',
//         attributes: ['EmployeeId', 'EmployeeName']
//       },
//       {
//         model: Employee,
//         as: 'Superviser',
//         attributes: ['EmployeeId', 'EmployeeName']
//       },
//       {
//         model: Campaign,
//         as: 'Campaign',
//         attributes: ['CampaignId', 'CampaignName']
//       }
//     ];

//     // Get employee assignments
//     const employeeAssignments = await ParivatanBDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         Deleted: 'N',
//         [Op.or]: [
//           { is_active: 'Active' },
//           {
//             [Op.and]: [
//               { is_zonal_manager: 'Yes' },
//               { is_active: ['Active', 'Inactive'] }
//             ]
//           }
//         ]
//       }
//     });

//     // Build base where clause
//     let baseWhereClause = {};
    
//     // Check if employee is zonal manager
//     const isZonalManager = employeeAssignments.some(ea => ea.is_zonal_manager === 'Yes');
    
//     if (isZonalManager) {
//       const managedRegions = employeeAssignments.map(ea => ea.RegionId);
//       const bdmsInRegions = await ParivatanBDM.findAll({
//         attributes: ['EmployeeId'],
//         where: {
//           RegionId: { [Op.in]: managedRegions },
//           Deleted: 'N'
//         }
//       });
//       const bdmIds = [...bdmsInRegions.map(bdm => bdm.EmployeeId), employeeId];
//       baseWhereClause.BDMId = { [Op.in]: bdmIds };
//     } else {
//       baseWhereClause.BDMId = employeeId;
//     }

//     // Get total leads count without any filters
//     const totalLeadsCount = await LeadDetail.count({
//       where: baseWhereClause,
//       distinct: true,
//       include: includeConditions
//     });

//     // Add filters to where clause
//     let whereClause = { ...baseWhereClause };

//     if (search) {
//       whereClause[Op.or] = [
//         { CustomerName: { [Op.like]: `%${search}%` } },
//         { MobileNo: { [Op.like]: `%${search}%` } },
//         { location: { [Op.like]: `%${search}%` } }
//       ];
//     }

//     if (InquiryType) whereClause.InquiryType = InquiryType;
//     if (Project) whereClause.Project = Project;
//     if (region) whereClause.RegionId = region;
//     if (category) whereClause.category = category;
//     if (subcategory) whereClause.sub_category = subcategory;
//     if (campaignName) whereClause.source_of_lead_generated = campaignName;
//     if (location) whereClause.location = { [Op.like]: `%${location}%` };
//     if (call_status) whereClause.call_status = call_status;
//     if (call_type) whereClause.call_type = call_type;
    

//     if (fromDate && toDate) {
//       whereClause.createdAt = {
//         [Op.between]: [
//           moment(fromDate).startOf('day'),
//           moment(toDate).endOf('day')
//         ]
//       };
//     }

//     // Get filtered leads
//     const { count: filteredCount, rows: leads } = await LeadDetail.findAndCountAll({
//       where: whereClause,
//       include: includeConditions,
//       order: [[sortBy, sortOrder]],
//       limit: parseInt(limit),
//       offset: (parseInt(page) - 1) * parseInt(limit),
//       distinct: true
//     });

//     // Calculate category stats based on the filtered whereClause
//     const categoryStats = await LeadDetail.findAll({
//       where: whereClause,
//       attributes: [
//         'category',
//         [sequelize.fn('COUNT', sequelize.col('*')), 'count']
//       ],
//       group: ['category'],
//       raw: true
//     });

//     // Transform category stats
//     const formattedCategoryStats = {
//       hot: 0,
//       warm: 0,
//       cold: 0,
//       pending: 0,
//       closed: 0,
//       total: totalLeadsCount  // Using the total unfiltered count
//     };

//     categoryStats.forEach(stat => {
//       if (stat.category) {
//         formattedCategoryStats[stat.category.toLowerCase()] = parseInt(stat.count);
//       }
//     });

//     // Transform leads data
//     const transformedLeads = leads.map(lead => {
//       const leadData = lead.toJSON();
//       return {
//         ...leadData,
//         source_of_lead_generated_name: lead.Campaign ? lead.Campaign.CampaignName : null,
//         BDMName: lead.BDM ? lead.BDM.EmployeeName : null,
//         AgentName: lead.Agent ? lead.Agent.EmployeeName : null,
//         lead_owner: lead.lead_created_by === 1
//           ? (lead.Agent ? lead.Agent.EmployeeName : 'CSE')
//           : (lead.BDM ? lead.BDM.EmployeeName : 'BDM')
//       };
//     });

//     res.json({
//       success: true,
//       totalCount: totalLeadsCount,  // Total unfiltered count
//       filteredCount: filteredCount, // Count after applying filters
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(filteredCount / parseInt(limit)),
//       pageSize: parseInt(limit),
//       categoryStats: formattedCategoryStats,
//       leads: transformedLeads,
//       employeeInfo: {
//         employeeId,
//         assignments: employeeAssignments.map(ea => ({
//           regionId: ea.RegionId,
//           project: ea.Project,
//           is_active: ea.is_active,
//           is_zonal_manager: ea.is_zonal_manager
//         }))
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching employee leads:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching employee leads',
//       error: error.message
//     });
//   }
// };



// exports.getEmployeeLeads = async (req, res) => {
//   try {
//     const {
//       sortBy = 'createdAt',
//       sortOrder = 'DESC',
//       search,
//       InquiryType,
//       Project,
//       region,
//       category,
//       subcategory,
//       campaignName,
//       BdmID,
//       agentName,
//       location,
//       call_status,
//       call_type,
//       fromDate,
//       toDate,
//       page = 1,
//       limit = 10
//     } = req.query;

//     const { employeeId } = req.params;

//     // Define include conditions first
//     const includeConditions = [
//       {
//         model: Employee,
//         as: 'Agent',
//         attributes: ['EmployeeId', 'EmployeeName']
//       },
//       {
//         model: Employee,
//         as: 'BDM',
//         attributes: ['EmployeeId', 'EmployeeName']
//       },
//       {
//         model: Employee,
//         as: 'Superviser',
//         attributes: ['EmployeeId', 'EmployeeName']
//       },
//       {
//         model: Campaign,
//         as: 'Campaign',
//         attributes: ['CampaignId', 'CampaignName']
//       }
//     ];

//     // Get employee assignments
//     const employeeAssignments = await ParivatanBDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         Deleted: 'N',
//         [Op.or]: [
//           { is_active: 'Active' },
//           {
//             [Op.and]: [
//               { is_zonal_manager: 'Yes' },
//               { is_active: ['Active', 'Inactive'] }
//             ]
//           }
//         ]
//       }
//     });

//     // Build base where clause
//     let baseWhereClause = {};
    
//     // Check if employee is zonal manager
//     const isZonalManager = employeeAssignments.some(ea => ea.is_zonal_manager === 'Yes');
    
//     if (isZonalManager) {
//       const managedRegions = employeeAssignments.map(ea => ea.RegionId);
//       const bdmsInRegions = await ParivatanBDM.findAll({
//         attributes: ['EmployeeId'],
//         where: {
//           RegionId: { [Op.in]: managedRegions },
//           Deleted: 'N'
//         }
//       });
//       const bdmIds = [...bdmsInRegions.map(bdm => bdm.EmployeeId), employeeId];
//       baseWhereClause.BDMId = { [Op.in]: bdmIds };
//     } else {
//       baseWhereClause.BDMId = employeeId;
//     }

//     // Add filters to where clause
//     let whereClause = { ...baseWhereClause };

//     if (search) {
//       whereClause[Op.or] = [
//         { CustomerName: { [Op.like]: `%${search}%` } },
//         { MobileNo: { [Op.like]: `%${search}%` } },
//         { location: { [Op.like]: `%${search}%` } }
//       ];
//     }

//     // Handle multiple agent IDs
//     if (agentName) {
//       const agentIds = agentName.split(',').map(id => id.trim());
//       whereClause.AgentId = { [Op.in]: agentIds };
//     }

//     // Handle region filter
//     if (region) {
//       whereClause.RegionId = region;
//     }

//     if (InquiryType) whereClause.InquiryType = InquiryType;
//     if (Project) whereClause.Project = Project;
//     if (category) whereClause.category = category;
//     if (subcategory) whereClause.sub_category = subcategory;
//     if (campaignName) whereClause.source_of_lead_generated = campaignName;
//     if (location) whereClause.location = { [Op.like]: `%${location}%` };
//     if (call_status) whereClause.call_status = call_status;
//     if (call_type) whereClause.call_type = call_type;

//     if (fromDate && toDate) {
//       whereClause.createdAt = {
//         [Op.between]: [
//           moment(fromDate).startOf('day'),
//           moment(toDate).endOf('day')
//         ]
//       };
//     }

//     // Get total leads count without filters (except base filters)
//     const totalLeadsCount = await LeadDetail.count({
//       where: baseWhereClause,
//       distinct: true,
//       include: includeConditions
//     });

//     // Get filtered leads
//     const { count: filteredCount, rows: leads } = await LeadDetail.findAndCountAll({
//       where: whereClause,
//       include: includeConditions,
//       order: [[sortBy, sortOrder]],
//       limit: parseInt(limit),
//       offset: (parseInt(page) - 1) * parseInt(limit),
//       distinct: true
//     });

//     // Calculate category stats based on the filtered whereClause
//     const categoryStats = await LeadDetail.findAll({
//       where: whereClause,
//       attributes: [
//         'category',
//         [sequelize.fn('COUNT', sequelize.col('id')), 'count']
//       ],
//       group: ['category'],
//       raw: true
//     });

//     // Transform category stats with proper initialization
//     const formattedCategoryStats = {
//       hot: 0,
//       warm: 0,
//       cold: 0,
//       pending: 0,
//       closed: 0,
//       total: filteredCount  // Using filtered count instead of total count
//     };

//     categoryStats.forEach(stat => {
//       if (stat.category && stat.category.toLowerCase() in formattedCategoryStats) {
//         formattedCategoryStats[stat.category.toLowerCase()] = parseInt(stat.count);
//       }
//     });

//     // Transform leads data
//     const transformedLeads = leads.map(lead => {
//       const leadData = lead.toJSON();
//       return {
//         ...leadData,
//         source_of_lead_generated_name: lead.Campaign ? lead.Campaign.CampaignName : null,
//         BDMName: lead.BDM ? lead.BDM.EmployeeName : null,
//         AgentName: lead.Agent ? lead.Agent.EmployeeName : null,
//         lead_owner: lead.lead_created_by === 1
//           ? (lead.Agent ? lead.Agent.EmployeeName : 'CSE')
//           : (lead.BDM ? lead.BDM.EmployeeName : 'BDM')
//       };
//     });

//     res.json({
//       success: true,
//       totalCount: totalLeadsCount,  // Total unfiltered count
//       filteredCount: filteredCount, // Count after applying filters
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(filteredCount / parseInt(limit)),
//       pageSize: parseInt(limit),
//       categoryStats: formattedCategoryStats,
//       leads: transformedLeads,
//       appliedFilters: { // Add this to help with debugging
//         region,
//         agentName,
//         whereClause
//       },
//       employeeInfo: {
//         employeeId,
//         assignments: employeeAssignments.map(ea => ({
//           regionId: ea.RegionId,
//           project: ea.Project,
//           is_active: ea.is_active,
//           is_zonal_manager: ea.is_zonal_manager
//         }))
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching employee leads:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching employee leads',
//       error: error.message
//     });
//   }
// };









// exports.getBdmDistinctValues = async (req, res) => {
//   const field = req.params.field;
//   const bdmId = req.params.bdmId;

//   try {
//     let values;

//     // Base where clause for BDM's leads
//     const baseWhereClause = {
//       BDMId: bdmId
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
//         // Get campaigns that BDM has worked with
//         values = await Campaign.findAll({
//           attributes: ['CampaignId', 'CampaignName'],
//           where: {
//             CampaignId: {
//               [Op.in]: Sequelize.literal(`(
//                 SELECT DISTINCT source_of_lead_generated
//                 FROM lead_detail
//                 WHERE BDMId = '${bdmId}'
//               )`)
//             }
//           },
//           order: [['CampaignName', 'ASC']]
//         });
//         break;

//       case 'bdmName':
//         // Return only this BDM's details
//         values = await Employee.findAll({
//           attributes: ['EmployeeId', 'EmployeeName'],
//           where: {
//             EmployeeId: bdmId,
//             '$role.RoleId$': 2 // 2 is the RoleId for BDM
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
//         // Get agents that have worked with this BDM
//         values = await Employee.findAll({
//           attributes: ['EmployeeId', 'EmployeeName'],
//           where: {
//             '$role.RoleId$': 1, // 1 is the RoleId for Agent
//             EmployeeId: {
//               [Op.in]: Sequelize.literal(`(
//                 SELECT DISTINCT AgentId
//                 FROM lead_detail
//                 WHERE BDMId = '${bdmId}'
//                 AND AgentId IS NOT NULL
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

//       default:
//         return res.status(400).json({
//           message: `Invalid field specified: ${field}. Valid fields are: InquiryType, Project, region_name, category, sub_category, campaignName, bdmName, agentName`
//         });
//     }

//     // Format the response based on the field type
//     let formattedValues;
//     switch (field) {
//       case 'campaignName':
//         formattedValues = values.map(campaign => ({
//           value: campaign.CampaignId,
//           CampaignName: campaign.CampaignName
//         }));
//         break;

//       case 'bdmName':
//         formattedValues = values
//           .map(employee => ({
//             value: employee.EmployeeId,
//             EmployeeName: employee.EmployeeName,
//             EmployeeId: employee.EmployeeId
//           }))
//           .filter(item => item.value && item.EmployeeName);
//         break;

//       case 'agentName':
//         formattedValues = values
//           .map(employee => ({
//             value: employee.EmployeeId,
//             AgentName: employee.EmployeeName,
//             EmployeeId: employee.EmployeeId
//           }))
//           .filter(item => item.value && item.AgentName);
//         break;

//       case 'InquiryType':
//         formattedValues = values
//           .map(item => ({
//             value: item[field],
//             InquiryType: item[field]
//           }))
//           .filter(item => item.value && item.InquiryType);
//         break;

//       case 'Project':
//         formattedValues = values
//           .map(item => ({
//             value: item[field],
//             Project: item[field]
//           }))
//           .filter(item => item.value && item.Project);
//         break;

//       case 'region_name':
//         formattedValues = values
//           .map(item => ({
//             value: item[field],
//             region_name: item[field]
//           }))
//           .filter(item => item.value && item.region_name);
//         break;

//       case 'category':
//         formattedValues = values
//           .map(item => ({
//             value: item[field],
//             category: item[field]
//           }))
//           .filter(item => item.value && item.category);
//         break;

//       case 'sub_category':
//         formattedValues = values
//           .map(item => ({
//             value: item[field],
//             sub_category: item[field]
//           }))
//           .filter(item => item.value && item.sub_category);
//         break;
//     }

//     res.json(formattedValues);
//   } catch (error) {
//     console.error(`Error fetching distinct values for field '${field}' and BDM '${bdmId}':`, error);
//     res.status(500).json({
//       message: `An error occurred while fetching ${field} values for BDM ${bdmId}`,
//       error: error.message
//     });
//   }
// };









// exports.getBdmDistinctValues = async (req, res) => {
//   const field = req.params.field;
//   const bdmId = req.params.bdmId;

//   try {
//     let values;
//     let isZonalManager = false;
//     let managedRegionIds = [];

//     // Check if the user is a zonal manager
//     const zonalManagerRegions = await Parivartan_BDM.findAll({
//       where: {
//         EmployeeId: bdmId,
//         is_zonal_manager: 'Yes',
//         Deleted: 'N'
//       },
//       include: [
//         {
//           model: Parivartan_Region,
//           attributes: ['RegionId', 'RegionName']
//         }
//       ],
//       attributes: ['RegionId', 'Project']
//     });

//     // If user is a zonal manager, collect all regions they manage
//     if (zonalManagerRegions && zonalManagerRegions.length > 0) {
//       isZonalManager = true;
//       managedRegionIds = zonalManagerRegions.map(region => region.RegionId);
//     }

//     // Base where clause for BDM's leads
//     const baseWhereClause = {
//       BDMId: bdmId
//     };

//     switch (field) {
//       case 'InquiryType':
//       case 'Project':
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

//       case 'region_name':
//         if (isZonalManager) {
//           // For zonal managers, get all regions they manage
//           const regionValues = await Parivartan_Region.findAll({
//             attributes: ['RegionId', 'RegionName'],
//             where: {
//               RegionId: {
//                 [Op.in]: managedRegionIds
//               }
//             },
//             order: [['RegionName', 'ASC']]
//           });

//           // Transform to match the expected format
//           values = regionValues.map(region => ({
//             region_name: region.RegionName
//           }));
//         } else {
//           // Regular BDM - only show regions where they have leads
//           values = await Lead_Detail.findAll({
//             attributes: [[Sequelize.fn('DISTINCT', Sequelize.col(field)), field]],
//             where: {
//               ...baseWhereClause,
//               [field]: {
//                 [Op.ne]: null,
//                 [Op.ne]: ''
//               }
//             },
//             order: [[field, 'ASC']]
//           });
//         }
//         break;

//       case 'campaignName':
//         // Get campaigns that BDM has worked with
//         let campaignQuery = {
//           attributes: ['CampaignId', 'CampaignName'],
//           order: [['CampaignName', 'ASC']]
//         };

//         if (isZonalManager) {
//           // For zonal managers, get all campaigns in their managed regions
//           const bdmsInManagedRegions = await Parivartan_BDM.findAll({
//             attributes: ['EmployeeId'],
//             where: {
//               RegionId: {
//                 [Op.in]: managedRegionIds
//               },
//               Deleted: 'N'
//             }
//           });

//           const bdmIds = bdmsInManagedRegions.map(bdm => bdm.EmployeeId);

//           // Add the zonal manager's ID
//           bdmIds.push(bdmId);

//           campaignQuery.where = {
//             CampaignId: {
//               [Op.in]: Sequelize.literal(`(
//                 SELECT DISTINCT source_of_lead_generated
//                 FROM lead_detail
//                 WHERE BDMId IN (${bdmIds.join(',')})
//               )`)
//             }
//           };
//         } else {
//           // Regular BDM - only show campaigns where they have leads
//           campaignQuery.where = {
//             CampaignId: {
//               [Op.in]: Sequelize.literal(`(
//                 SELECT DISTINCT source_of_lead_generated
//                 FROM lead_detail
//                 WHERE BDMId = '${bdmId}'
//               )`)
//             }
//           };
//         }

//         values = await Campaign.findAll(campaignQuery);
//         break;

//       case 'bdmName':
//         // Return only this BDM's details
//         values = await Employee.findAll({
//           attributes: ['EmployeeId', 'EmployeeName'],
//           where: {
//             EmployeeId: bdmId,
//             '$role.RoleId$': 2 // 2 is the RoleId for BDM
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
//         let agentQuery = {
//           attributes: ['EmployeeId', 'EmployeeName'],
//           where: {
//             '$role.RoleId$': 1, // 1 is the RoleId for Agent
//           },
//           include: [{
//             model: Employee_Role,
//             as: 'role',
//             attributes: []
//           }],
//           order: [['EmployeeName', 'ASC']]
//         };

//         if (isZonalManager) {
//           // For zonal managers, get all agents in their managed regions
//           const bdmsInManagedRegions = await Parivartan_BDM.findAll({
//             attributes: ['EmployeeId'],
//             where: {
//               RegionId: {
//                 [Op.in]: managedRegionIds
//               },
//               Deleted: 'N'
//             }
//           });

//           const bdmIds = bdmsInManagedRegions.map(bdm => bdm.EmployeeId);

//           // Add the zonal manager's ID
//           bdmIds.push(bdmId);

//           agentQuery.where.EmployeeId = {
//             [Op.in]: Sequelize.literal(`(
//               SELECT DISTINCT AgentId
//               FROM lead_detail
//               WHERE BDMId IN (${bdmIds.join(',')})
//               AND AgentId IS NOT NULL
//             )`)
//           };
//         } else {
//           // Regular BDM - only show agents where they have leads
//           agentQuery.where.EmployeeId = {
//             [Op.in]: Sequelize.literal(`(
//               SELECT DISTINCT AgentId
//               FROM lead_detail
//               WHERE BDMId = '${bdmId}'
//               AND AgentId IS NOT NULL
//             )`)
//           };
//         }

//         values = await Employee.findAll(agentQuery);
//         break;

//       default:
//         return res.status(400).json({
//           message: `Invalid field specified: ${field}. Valid fields are: InquiryType, Project, region_name, category, sub_category, campaignName, bdmName, agentName`
//         });
//     }

//     // Format the response based on the field type
//     let formattedValues;
//     switch (field) {
//       case 'campaignName':
//         formattedValues = values.map(campaign => ({
//           value: campaign.CampaignId,
//           CampaignName: campaign.CampaignName
//         }));
//         break;

//       case 'bdmName':
//         formattedValues = values
//           .map(employee => ({
//             value: employee.EmployeeId,
//             EmployeeName: employee.EmployeeName,
//             EmployeeId: employee.EmployeeId
//           }))
//           .filter(item => item.value && item.EmployeeName);
//         break;

//       case 'agentName':
//         formattedValues = values
//           .map(employee => ({
//             value: employee.EmployeeId,
//             AgentName: employee.EmployeeName,
//             EmployeeId: employee.EmployeeId
//           }))
//           .filter(item => item.value && item.AgentName);
//         break;

//       case 'InquiryType':
//         if (isZonalManager) {
//           // For zonal managers, get all InquiryTypes from their managed regions
//           const bdmsInManagedRegions = await Parivartan_BDM.findAll({
//             attributes: ['EmployeeId'],
//             where: {
//               RegionId: {
//                 [Op.in]: managedRegionIds
//               },
//               Deleted: 'N'
//             }
//           });

//           const bdmIds = bdmsInManagedRegions.map(bdm => bdm.EmployeeId);

//           // Add the zonal manager's ID
//           bdmIds.push(bdmId);

//           const additionalValues = await Lead_Detail.findAll({
//             attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('InquiryType')), 'InquiryType']],
//             where: {
//               BDMId: {
//                 [Op.in]: bdmIds
//               },
//               InquiryType: {
//                 [Op.ne]: null,
//                 [Op.ne]: ''
//               }
//             }
//           });

//           // Merge with existing values
//           const uniqueValues = new Set([...values, ...additionalValues].map(item => item.InquiryType));
//           formattedValues = Array.from(uniqueValues)
//             .filter(Boolean)
//             .map(item => ({
//               value: item,
//               InquiryType: item
//             }));
//         } else {
//           formattedValues = values
//             .map(item => ({
//               value: item[field],
//               InquiryType: item[field]
//             }))
//             .filter(item => item.value && item.InquiryType);
//         }
//         break;

//       case 'Project':
//         if (isZonalManager) {
//           // For zonal managers, include projects from their managed regions
//           const projects = zonalManagerRegions.map(region => region.Project).filter(Boolean);

//           // Get additional projects from leads in managed regions
//           const bdmsInManagedRegions = await Parivartan_BDM.findAll({
//             attributes: ['EmployeeId'],
//             where: {
//               RegionId: {
//                 [Op.in]: managedRegionIds
//               },
//               Deleted: 'N'
//             }
//           });

//           const bdmIds = bdmsInManagedRegions.map(bdm => bdm.EmployeeId);

//           const additionalProjects = await Lead_Detail.findAll({
//             attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('Project')), 'Project']],
//             where: {
//               BDMId: {
//                 [Op.in]: bdmIds
//               },
//               Project: {
//                 [Op.ne]: null,
//                 [Op.ne]: ''
//               }
//             }
//           });

//           // Combine projects
//           const allProjects = [...projects, ...additionalProjects.map(item => item.Project)];
//           const uniqueProjects = [...new Set(allProjects)].filter(Boolean);

//           formattedValues = uniqueProjects.map(project => ({
//             value: project,
//             Project: project
//           }));
//         } else {
//           formattedValues = values
//             .map(item => ({
//               value: item[field],
//               Project: item[field]
//             }))
//             .filter(item => item.value && item.Project);
//         }
//         break;

//       case 'region_name':
//         if (isZonalManager) {
//           formattedValues = values
//             .map(item => ({
//               value: item.region_name,
//               region_name: item.region_name,
//               RegionId: item.RegionId  // Include RegionId with correct capitalization
//             }))
//             .filter(item => item.value && item.region_name);
//             console.log(formattedValues);
            
//         } else {
//           formattedValues = values
//             .map(item => ({
//               value: item[field],
//               region_name: item[field]
//             }))
//             .filter(item => item.value && item.region_name);
//         }
//         break;

//       case 'category':
//         if (isZonalManager) {
//           // For zonal managers, get all categories from their managed regions
//           const bdmsInManagedRegions = await Parivartan_BDM.findAll({
//             attributes: ['EmployeeId'],
//             where: {
//               RegionId: {
//                 [Op.in]: managedRegionIds
//               },
//               Deleted: 'N'
//             }
//           });

//           const bdmIds = bdmsInManagedRegions.map(bdm => bdm.EmployeeId);

//           // Add the zonal manager's ID
//           bdmIds.push(bdmId);

//           const additionalValues = await Lead_Detail.findAll({
//             attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('category')), 'category']],
//             where: {
//               BDMId: {
//                 [Op.in]: bdmIds
//               },
//               category: {
//                 [Op.ne]: null,
//                 [Op.ne]: ''
//               }
//             }
//           });

//           // Merge with existing values
//           const uniqueValues = new Set([...values, ...additionalValues].map(item =>
//             item.category || item[field]
//           ));

//           formattedValues = Array.from(uniqueValues)
//             .filter(Boolean)
//             .map(item => ({
//               value: item,
//               category: item
//             }));
//         } else {
//           formattedValues = values
//             .map(item => ({
//               value: item[field],
//               category: item[field]
//             }))
//             .filter(item => item.value && item.category);
//         }
//         break;

//       case 'sub_category':
//         if (isZonalManager) {
//           // For zonal managers, get all sub_categories from their managed regions
//           const bdmsInManagedRegions = await Parivartan_BDM.findAll({
//             attributes: ['EmployeeId'],
//             where: {
//               RegionId: {
//                 [Op.in]: managedRegionIds
//               },
//               Deleted: 'N'
//             }
//           });

//           const bdmIds = bdmsInManagedRegions.map(bdm => bdm.EmployeeId);

//           // Add the zonal manager's ID
//           bdmIds.push(bdmId);

//           const additionalValues = await Lead_Detail.findAll({
//             attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('sub_category')), 'sub_category']],
//             where: {
//               BDMId: {
//                 [Op.in]: bdmIds
//               },
//               sub_category: {
//                 [Op.ne]: null,
//                 [Op.ne]: ''
//               }
//             }
//           });

//           // Merge with existing values
//           const uniqueValues = new Set([...values, ...additionalValues].map(item =>
//             item.sub_category || item[field]
//           ));

//           formattedValues = Array.from(uniqueValues)
//             .filter(Boolean)
//             .map(item => ({
//               value: item,
//               sub_category: item
//             }));
//         } else {
//           formattedValues = values
//             .map(item => ({
//               value: item[field],
//               sub_category: item[field]
//             }))
//             .filter(item => item.value && item.sub_category);
//         }
//         break;
//     }

//     res.json(formattedValues);
//   } catch (error) {
//     console.error(`Error fetching distinct values for field '${field}' and BDM '${bdmId}':`, error);
//     res.status(500).json({
//       message: `An error occurred while fetching ${field} values for BDM ${bdmId}`,
//       error: error.message
//     });
//   }
// };

exports.getBdmDistinctValues = async (req, res) => {
  const field = req.params.field;
  const bdmId = req.params.bdmId;

  try {
    let values;
    let isZonalManager = false;
    let managedRegionIds = [];

    // Check if the user is a zonal manager
    const zonalManagerRegions = await Parivartan_BDM.findAll({
      where: {
        EmployeeId: bdmId,
        is_zonal_manager: 'Yes',
        Deleted: 'N'
      },
      include: [
        {
          model: Parivartan_Region,
          attributes: ['RegionId', 'RegionName']
        }
      ],
      attributes: ['RegionId', 'Project']
    });

    // If user is a zonal manager, collect all regions they manage
    if (zonalManagerRegions && zonalManagerRegions.length > 0) {
      isZonalManager = true;
      managedRegionIds = zonalManagerRegions.map(region => region.RegionId);
    }

    // Base where clause for BDM's leads
    const baseWhereClause = {
      BDMId: bdmId
    };

    switch (field) {
      case 'InquiryType':
      case 'Project':
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

      case 'region_name':
        if (isZonalManager) {
          // For zonal managers, get all regions they manage
          const regionValues = await Parivartan_Region.findAll({
            attributes: ['RegionId', 'RegionName'],
            where: {
              RegionId: {
                [Op.in]: managedRegionIds
              }
            },
            order: [['RegionName', 'ASC']]
          });

          // Transform to match the expected format
          values = regionValues.map(region => ({
            region_name: region.RegionName,
            RegionId: region.RegionId  // Store RegionId properly
          }));
        } else {
          // Regular BDM - get regions where they have leads, then lookup the RegionIds
          const leadRegions = await Lead_Detail.findAll({
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
          
          // Extract region names from leads
          const regionNames = leadRegions.map(item => item[field]).filter(Boolean);
          
          // Get the RegionIds for these region names
          const regionDetails = await Parivartan_Region.findAll({
            attributes: ['RegionId', 'RegionName'],
            where: {
              RegionName: {
                [Op.in]: regionNames
              },
              Deleted: 'N'
            }
          });
          
          // Use the regionDetails instead
          values = regionDetails.map(region => ({
            region_name: region.RegionName,
            RegionId: region.RegionId
          }));
        }
        break;

      case 'campaignName':
        // Get campaigns that BDM has worked with
        let campaignQuery = {
          attributes: ['CampaignId', 'CampaignName'],
          order: [['CampaignName', 'ASC']]
        };

        if (isZonalManager) {
          // For zonal managers, get all campaigns in their managed regions
          const bdmsInManagedRegions = await Parivartan_BDM.findAll({
            attributes: ['EmployeeId'],
            where: {
              RegionId: {
                [Op.in]: managedRegionIds
              },
              Deleted: 'N'
            }
          });

          const bdmIds = bdmsInManagedRegions.map(bdm => bdm.EmployeeId);

          // Add the zonal manager's ID
          bdmIds.push(bdmId);

          campaignQuery.where = {
            CampaignId: {
              [Op.in]: Sequelize.literal(`(
                SELECT DISTINCT source_of_lead_generated
                FROM lead_detail
                WHERE BDMId IN (${bdmIds.join(',')})
              )`)
            }
          };
        } else {
          // Regular BDM - only show campaigns where they have leads
          campaignQuery.where = {
            CampaignId: {
              [Op.in]: Sequelize.literal(`(
                SELECT DISTINCT source_of_lead_generated
                FROM lead_detail
                WHERE BDMId = '${bdmId}'
              )`)
            }
          };
        }

        values = await Campaign.findAll(campaignQuery);
        break;

      case 'bdmName':
        // Return only this BDM's details
        values = await Employee.findAll({
          attributes: ['EmployeeId', 'EmployeeName'],
          where: {
            EmployeeId: bdmId,
            '$role.RoleId$': 2 // 2 is the RoleId for BDM
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
        let agentQuery = {
          attributes: ['EmployeeId', 'EmployeeName'],
          where: {
            '$role.RoleId$': 1, // 1 is the RoleId for Agent
          },
          include: [{
            model: Employee_Role,
            as: 'role',
            attributes: []
          }],
          order: [['EmployeeName', 'ASC']]
        };

        if (isZonalManager) {
          // For zonal managers, get all agents in their managed regions
          const bdmsInManagedRegions = await Parivartan_BDM.findAll({
            attributes: ['EmployeeId'],
            where: {
              RegionId: {
                [Op.in]: managedRegionIds
              },
              Deleted: 'N'
            }
          });

          const bdmIds = bdmsInManagedRegions.map(bdm => bdm.EmployeeId);

          // Add the zonal manager's ID
          bdmIds.push(bdmId);

          agentQuery.where.EmployeeId = {
            [Op.in]: Sequelize.literal(`(
              SELECT DISTINCT AgentId
              FROM lead_detail
              WHERE BDMId IN (${bdmIds.join(',')})
              AND AgentId IS NOT NULL
            )`)
          };
        } else {
          // Regular BDM - only show agents where they have leads
          agentQuery.where.EmployeeId = {
            [Op.in]: Sequelize.literal(`(
              SELECT DISTINCT AgentId
              FROM lead_detail
              WHERE BDMId = '${bdmId}'
              AND AgentId IS NOT NULL
            )`)
          };
        }

        values = await Employee.findAll(agentQuery);
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
            AgentName: employee.EmployeeName,
            EmployeeId: employee.EmployeeId
          }))
          .filter(item => item.value && item.AgentName);
        break;

      case 'region_name':
        formattedValues = values
          .map(item => ({
            value: item.region_name,
            region_name: item.region_name,
            RegionId: item.RegionId  // Include RegionId with correct capitalization
          }))
          .filter(item => item.value && item.region_name);
        break;

      case 'InquiryType':
        if (isZonalManager) {
          // For zonal managers, get all InquiryTypes from their managed regions
          const bdmsInManagedRegions = await Parivartan_BDM.findAll({
            attributes: ['EmployeeId'],
            where: {
              RegionId: {
                [Op.in]: managedRegionIds
              },
              Deleted: 'N'
            }
          });

          const bdmIds = bdmsInManagedRegions.map(bdm => bdm.EmployeeId);

          // Add the zonal manager's ID
          bdmIds.push(bdmId);

          const additionalValues = await Lead_Detail.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('InquiryType')), 'InquiryType']],
            where: {
              BDMId: {
                [Op.in]: bdmIds
              },
              InquiryType: {
                [Op.ne]: null,
                [Op.ne]: ''
              }
            }
          });

          // Merge with existing values
          const uniqueValues = new Set([...values, ...additionalValues].map(item => item.InquiryType));
          formattedValues = Array.from(uniqueValues)
            .filter(Boolean)
            .map(item => ({
              value: item,
              InquiryType: item
            }));
        } else {
          formattedValues = values
            .map(item => ({
              value: item[field],
              InquiryType: item[field]
            }))
            .filter(item => item.value && item.InquiryType);
        }
        break;

      case 'Project':
        if (isZonalManager) {
          // For zonal managers, include projects from their managed regions
          const projects = zonalManagerRegions.map(region => region.Project).filter(Boolean);

          // Get additional projects from leads in managed regions
          const bdmsInManagedRegions = await Parivartan_BDM.findAll({
            attributes: ['EmployeeId'],
            where: {
              RegionId: {
                [Op.in]: managedRegionIds
              },
              Deleted: 'N'
            }
          });

          const bdmIds = bdmsInManagedRegions.map(bdm => bdm.EmployeeId);

          const additionalProjects = await Lead_Detail.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('Project')), 'Project']],
            where: {
              BDMId: {
                [Op.in]: bdmIds
              },
              Project: {
                [Op.ne]: null,
                [Op.ne]: ''
              }
            }
          });

          // Combine projects
          const allProjects = [...projects, ...additionalProjects.map(item => item.Project)];
          const uniqueProjects = [...new Set(allProjects)].filter(Boolean);

          formattedValues = uniqueProjects.map(project => ({
            value: project,
            Project: project
          }));
        } else {
          formattedValues = values
            .map(item => ({
              value: item[field],
              Project: item[field]
            }))
            .filter(item => item.value && item.Project);
        }
        break;

      case 'category':
        if (isZonalManager) {
          // For zonal managers, get all categories from their managed regions
          const bdmsInManagedRegions = await Parivartan_BDM.findAll({
            attributes: ['EmployeeId'],
            where: {
              RegionId: {
                [Op.in]: managedRegionIds
              },
              Deleted: 'N'
            }
          });

          const bdmIds = bdmsInManagedRegions.map(bdm => bdm.EmployeeId);

          // Add the zonal manager's ID
          bdmIds.push(bdmId);

          const additionalValues = await Lead_Detail.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('category')), 'category']],
            where: {
              BDMId: {
                [Op.in]: bdmIds
              },
              category: {
                [Op.ne]: null,
                [Op.ne]: ''
              }
            }
          });

          // Merge with existing values
          const uniqueValues = new Set([...values, ...additionalValues].map(item =>
            item.category || item[field]
          ));

          formattedValues = Array.from(uniqueValues)
            .filter(Boolean)
            .map(item => ({
              value: item,
              category: item
            }));
        } else {
          formattedValues = values
            .map(item => ({
              value: item[field],
              category: item[field]
            }))
            .filter(item => item.value && item.category);
        }
        break;

      case 'sub_category':
        if (isZonalManager) {
          // For zonal managers, get all sub_categories from their managed regions
          const bdmsInManagedRegions = await Parivartan_BDM.findAll({
            attributes: ['EmployeeId'],
            where: {
              RegionId: {
                [Op.in]: managedRegionIds
              },
              Deleted: 'N'
            }
          });

          const bdmIds = bdmsInManagedRegions.map(bdm => bdm.EmployeeId);

          // Add the zonal manager's ID
          bdmIds.push(bdmId);

          const additionalValues = await Lead_Detail.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('sub_category')), 'sub_category']],
            where: {
              BDMId: {
                [Op.in]: bdmIds
              },
              sub_category: {
                [Op.ne]: null,
                [Op.ne]: ''
              }
            }
          });

          // Merge with existing values
          const uniqueValues = new Set([...values, ...additionalValues].map(item =>
            item.sub_category || item[field]
          ));

          formattedValues = Array.from(uniqueValues)
            .filter(Boolean)
            .map(item => ({
              value: item,
              sub_category: item
            }));
        } else {
          formattedValues = values
            .map(item => ({
              value: item[field],
              sub_category: item[field]
            }))
            .filter(item => item.value && item.sub_category);
        }
        break;
    }

    res.json(formattedValues);
  } catch (error) {
    console.error(`Error fetching distinct values for field '${field}' and BDM '${bdmId}':`, error);
    res.status(500).json({
      message: `An error occurred while fetching ${field} values for BDM ${bdmId}`,
      error: error.message
    });
  }
};




exports.getEmployeeRegion = async (req, res) => {
  try {
    const { employeeId } = req.query;

    // Find all BDM entries for this employeeId
    const employeeRegions = await Parivartan_BDM.findAll({
      where: {
        EmployeeId: employeeId,
        // Keep both active and inactive regions
      },
      include: [
        {
          model: Parivartan_Region,
          attributes: ['RegionId', 'RegionName']
        }
      ]
    });

    if (!employeeRegions || employeeRegions.length === 0) {
      return res.status(404).json({
        status: "404",
        message: "Employee not found or has no regions assigned"
      });
    }

    // Map the employee regions to a more friendly format
    const regions = employeeRegions.map(employee => ({
      id: employee.id,
      EmployeeId: employee.EmployeeId,
      EmployeeName: employee.EmployeeName,
      RegionId: employee.RegionId,
      RegionName: employee.parivartan_region ? employee.parivartan_region.RegionName : null,
      ProjectName: employee.parivartan_region ? employee.parivartan_region.ProjectName : null,
      is_active: employee.is_active,
      is_zonal_manager: employee.is_zonal_manager,
      is_bdm: employee.is_bdm,
      Project: employee.Project
    }));

    // Return all regions assigned to the employee
    return res.status(200).json({
      status: "200",
      message: "Employee regions fetched successfully",
      employeeId: employeeId,
      totalRegions: regions.length,
      data: regions
    });

  } catch (error) {
    console.error("Error fetching employee regions:", error);
    return res.status(500).json({
      status: "500",
      message: "An error occurred while fetching employee regions"
    });
  }
};





//



exports.getEmployeeRegionsWithLeads = async (req, res) => {
  try {
    const { employeeId } = req.query;

    // Find all BDM entries for this employeeId
    const employeeRegions = await Parivartan_BDM.findAll({
      where: {
        EmployeeId: employeeId,
      },
      include: [
        {
          model: Parivartan_Region,
          attributes: ['RegionId', 'RegionName', ]
        }
      ]
    });

    if (!employeeRegions || employeeRegions.length === 0) {
      return res.status(404).json({
        status: "404",
        message: "Employee not found or has no regions assigned"
      });
    }

    // Create an array to store all regions with their leads
    const regionsWithLeads = [];

    // For each region, fetch its leads
    for (const employee of employeeRegions) {
      const regionId = employee.RegionId;

      // Fetch all leads for this region
      const leads = await Lead_Detail.findAll({
        where: {
          RegionId: regionId
        },
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
          },
          {
            model: Employee,
            as: 'Superviser',
            attributes: ['EmployeeId', 'EmployeeName']
          },
          {
            model: Campaign,
            as: 'Campaign',
            attributes: ['CampaignId', 'CampaignName']
          },
          {
            model: Parivartan_Region,
            as: 'Region',
            attributes: ['RegionId', 'RegionName', ]
          },
          // {
          //   model: OnCallDiscussionByBdm,
          //   as: 'Updatess',
          //   attributes: ['id', 'LeadDetailId', 'call_status', 'leads_status', 'created_at', 'updated_at', 'remarks'],
          //   order: [['created_at', 'DESC']]
          // }
        ],
        order: [['createdAt', 'DESC']] // Most recent leads first
      });

      // Map the leads to a more friendly format
      const mappedLeads = leads.map(lead => ({
        id: lead.id,
        InquiryType: lead.InquiryType,
        Project: lead.Project,
        CustomerName: lead.CustomerName,
        MobileNo: lead.MobileNo,
        AlternateMobileNo: lead.AlternateMobileNo,
        WhatsappNo: lead.WhatsappNo,
        CustomerMailId: lead.CustomerMailId,
        location: lead.location,
        state_name: lead.state_name,
        region_name: lead.region_name,
        pincode: lead.pincode,
        site_location_address: lead.site_location_address,
        call_status: lead.call_status,
        call_type: lead.call_type,
        category: lead.category,
        sub_category: lead.sub_category,
        agent_remark: lead.agent_remark,
        bdm_remark: lead.bdm_remark,
        follow_up_date: lead.follow_up_date,
        lead_transfer_date: lead.lead_transfer_date,
        agent: lead.Agent ? {
          EmployeeId: lead.Agent.EmployeeId,
          EmployeeName: lead.Agent.EmployeeName
        } : null,
        bdm: lead.BDM ? {
          EmployeeId: lead.BDM.EmployeeId,
          EmployeeName: lead.BDM.EmployeeName
        } : null,
        superviser: lead.Superviser ? {
          EmployeeId: lead.Superviser.EmployeeId,
          EmployeeName: lead.Superviser.EmployeeName
        } : null,
        campaign: lead.Campaign ? {
          CampaignId: lead.Campaign.CampaignId,
          CampaignName: lead.Campaign.CampaignName
        } : null,
        updates: lead.Updatess ? lead.Updatess.map(update => ({
          id: update.id,
          LeadDetailId: update.LeadDetailId,
          call_status: update.call_status,
          leads_status: update.leads_status,
          remarks: update.remarks,
          created_at: update.created_at,
          updated_at: update.updated_at
        })) : []
      }));

      // Add this region with its leads to the result array
      regionsWithLeads.push({
        id: employee.id,
        EmployeeId: employee.EmployeeId,
        EmployeeName: employee.EmployeeName,
        RegionId: employee.RegionId,
        RegionName: employee.parivartan_region ? employee.parivartan_region.RegionName : null,
        ProjectName: employee.parivartan_region ? employee.parivartan_region.ProjectName : null,
        is_active: employee.is_active,
        is_zonal_manager: employee.is_zonal_manager,
        is_bdm: employee.is_bdm,
        Project: employee.Project,
        totalLeads: leads.length,
        leads: mappedLeads
      });
    }

    // Return all regions with their leads
    return res.status(200).json({
      status: "200",
      message: "Employee regions with leads fetched successfully",
      employeeId: employeeId,
      totalRegions: regionsWithLeads.length,
      data: regionsWithLeads

    });

  } catch (error) {
    console.error("Error fetching employee regions with leads:", error);
    return res.status(500).json({
      status: "500",
      message: "An error occurred while fetching employee regions with leads"
    });
  }
};







// exports.getZonalManagerRegions = async (req, res) => {
//   try {
//     const { employeeId } = req.query;

//     // Find all regions where this employee is a zonal manager
//     const zonalManagerRegions = await Parivartan_BDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         is_zonal_manager: 'Yes',  // Only get regions where employee is a zonal manager
//         Deleted: 'N',             // Not deleted
//         is_active: 'Active'       // Active status
//       },
//       include: [
//         {
//           model: Parivartan_Region,
//           attributes: ['RegionId', 'RegionName',]
//         }
//       ]
//     });

//     if (!zonalManagerRegions || zonalManagerRegions.length === 0) {
//       return res.status(404).json({
//         status: "404",
//         message: "No regions found where this employee is a zonal manager"
//       });
//     }

//     // Map the regions to a simplified format with only RegionId and RegionName
//     const regions = zonalManagerRegions.map(region => ({
//       RegionId: region.RegionId,

//       RegionName: region.parivartan_region ? region.parivartan_region.RegionName : null
//     }));

//     // Return only the region information
//     return res.status(200).json({
//       status: "200",
//       message: "Zonal manager regions fetched successfully",
//       employeeId: employeeId,
//       totalRegions: regions.length,
//       data: regions
//     });

//   } catch (error) {
//     console.error("Error fetching zonal manager regions:", error);
//     return res.status(500).json({
//       status: "500",
//       message: "An error occurred while fetching zonal manager regions"
//     });
//   }
// };




// exports.getZonalManagerRegions = async (req, res) => {
//   try {
//     const { employeeId } = req.query;

//     // Find all regions where this employee is a zonal manager
//     // Get all details directly from Parivartan_BDM without including Parivartan_Region
//     const zonalManagerRegions = await Parivartan_BDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         is_zonal_manager: 'Yes',  // Only get regions where employee is a zonal manager
//         Deleted: 'N',             // Not deleted
//         is_active: 'Active'       // Active status
//       },
//       attributes: ['RegionId', 'EmployeeId', 'EmployeeName', 'Project']
//     });

//     if (!zonalManagerRegions || zonalManagerRegions.length === 0) {
//       return res.status(404).json({
//         status: "404",
//         message: "No regions found where this employee is a zonal manager"
//       });
//     }

//     // Map the regions to the required format
//     const regions = zonalManagerRegions.map(region => ({
//       RegionId: region.RegionId,
//       EmployeeId: region.EmployeeId,
//       EmployeeName: region.EmployeeName,
//       is_zonal_manager: region.is_zonal_manager,
//       is_bdm: region.is_bdm,
//       Project: region.Project
//     }));

//     // Return the region information
//     return res.status(200).json({
//       status: "200",
//       message: "Zonal manager regions fetched successfully",
//       employeeId: employeeId,
//       totalRegions: regions.length,

//       data: regions
//     });

//   } catch (error) {
//     console.error("Error fetching zonal manager regions:", error);
//     return res.status(500).json({
//       status: "500",
//       message: "An error occurred while fetching zonal manager regions"
//     });
//   }
// };



///


// exports.getZonalManagerRegions = async (req, res) => {
//   try {
//     const { employeeId } = req.query;

//     // Find all regions where this employee is a zonal manager
//     const zonalManagerRegions = await Parivartan_BDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         is_zonal_manager: 'Yes',  // Only get regions where employee is a zonal manager
//         Deleted: 'N',             // Not deleted
//         is_active: 'Active'       // Active status
//       },
//       attributes: ['RegionId', 'EmployeeId', 'EmployeeName', 'Project']
//     });

//     if (!zonalManagerRegions || zonalManagerRegions.length === 0) {
//       return res.status(404).json({
//         status: "404",
//         message: "No regions found where this employee is a zonal manager"
//       });
//     }

//     // Extract the employee details only once
//     const employeeInfo = {
//       EmployeeId: zonalManagerRegions[0].EmployeeId,
//       EmployeeName: zonalManagerRegions[0].EmployeeName
//     };

//     // Map the regions to only include RegionId and Project
//     const regions = zonalManagerRegions.map(region => ({
//       RegionId: region.RegionId,
//       Project: region.Project
//     }));

//     // Return employee info once and all regions
//     return res.status(200).json({
//       status: "200",
//       message: "Zonal manager regions fetched successfully",
//       employeeInfo: employeeInfo,
//       totalRegions: regions.length,
//       regions: regions
//     });

//   } catch (error) {
//     console.error("Error fetching zonal manager regions:", error);
//     return res.status(500).json({
//       status: "500",
//       message: "An error occurred while fetching zonal manager regions"
//     });
//   }
// };







// exports.getZonalManagerRegions = async (req, res) => {
//   try {
//     const { employeeId } = req.query;

//     // Find all regions where this employee is a zonal manager
//     const zonalManagerRegions = await Parivartan_BDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         is_zonal_manager: 'Yes',  // Only get regions where employee is a zonal manager
//         Deleted: 'N',             // Not deleted
//         is_active: 'Active'       // Active status
//       },
//       attributes: ['RegionId', 'EmployeeId', 'EmployeeName', 'Project']
//     });

//     if (!zonalManagerRegions || zonalManagerRegions.length === 0) {
//       return res.status(404).json({
//         status: "404",
//         message: "No regions found where this employee is a zonal manager"
//       });
//     }

//     // Extract the employee details only once
//     const employeeInfo = {
//       EmployeeId: zonalManagerRegions[0].EmployeeId,
//       EmployeeName: zonalManagerRegions[0].EmployeeName
//     };

//     // Create an array to store region data with associated BDMs
//     const regionsWithBdms = [];

//     // For each region, find other BDMs associated with it
//     for (const region of zonalManagerRegions) {
//       // Find BDMs for this region with the same Project value
//       const bdmsForRegion = await Parivartan_BDM.findAll({
//         where: {
//           RegionId: region.RegionId,
//           Project: region.Project,  // Match the Project value
//           EmployeeId: {
//             [Op.ne]: employeeId // Not equal to the zonal manager
//           },
//           Deleted: 'N',
//           is_active: 'Active'
//         },
//         attributes: ['EmployeeId', 'EmployeeName', 'is_bdm']
//       });

//       // Add region with its BDMs to result array
//       regionsWithBdms.push({
//         RegionId: region.RegionId,
//         Project: region.Project,

//         bdms: bdmsForRegion.map(bdm => ({
//           EmployeeId: bdm.EmployeeId,
//           EmployeeName: bdm.EmployeeName,
//           is_bdm: bdm.is_bdm
//         }))
//       });
//     }

//     // Return employee info once and all regions with their BDMs
//     return res.status(200).json({
//       status: "200",
//       message: "Zonal manager regions with matching BDMs fetched successfully",
//       employeeInfo: employeeInfo,
//       totalRegions: regionsWithBdms.length,
//       regions: regionsWithBdms
//     });

//   } catch (error) {
//     console.error("Error fetching zonal manager regions with BDMs:", error);
//     return res.status(500).json({
//       status: "500",
//       message: "An error occurred while fetching zonal manager regions with BDMs"
//     });
//   }
// };




// exports.getZonalManagerRegions = async (req, res) => {
//   try {
//     const { employeeId } = req.query;

//     // Find all regions where this employee is a zonal manager
//     const zonalManagerRegions = await Parivartan_BDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         is_zonal_manager: 'Yes',  // Only get regions where employee is a zonal manager
//         Deleted: 'N',             // Not deleted
//         is_active: 'Active'       // Active status
//       },
//       include: [
//         {
//           model: Parivartan_Region,
//           attributes: ['RegionId', 'RegionName']
//         }
//       ],
//       attributes: ['RegionId', 'EmployeeId', 'EmployeeName', 'Project']
//     });

//     if (!zonalManagerRegions || zonalManagerRegions.length === 0) {
//       return res.status(404).json({
//         status: "404",
//         message: "No regions found where this employee is a zonal manager"
//       });
//     }

//     // Extract the employee details only once
//     const employeeInfo = {
//       EmployeeId: zonalManagerRegions[0].EmployeeId,
//       EmployeeName: zonalManagerRegions[0].EmployeeName
//     };

//     // Create an array to store region data with associated BDMs
//     const regionsWithBdms = [];

//     // For each region, find other BDMs associated with it
//     for (const region of zonalManagerRegions) {
//       // Find BDMs for this region with the same Project value
//       const bdmsForRegion = await Parivartan_BDM.findAll({
//         where: {
//           RegionId: region.RegionId,
//           Project: region.Project,  // Match the Project value
//           EmployeeId: {
//             [Op.ne]: employeeId // Not equal to the zonal manager
//           },
//           Deleted: 'N',
//           is_active: 'Active'
//         },
//         attributes: ['EmployeeId', 'EmployeeName', 'is_bdm']
//       });

//       // Add region with its BDMs to result array
//       regionsWithBdms.push({
//         RegionId: region.RegionId,
//         RegionName: region.parivartan_region ? region.parivartan_region.RegionName : null,
//         Project: region.Project,
//         bdms: bdmsForRegion.map(bdm => ({
//           EmployeeId: bdm.EmployeeId,
//           EmployeeName: bdm.EmployeeName,
//           is_bdm: bdm.is_bdm
//         }))
//       });
//     }

//     // Return employee info once and all regions with their BDMs
//     return res.status(200).json({
//       status: "200",
//       message: "Zonal manager regions with matching BDMs fetched successfully",
//       employeeInfo: employeeInfo,
//       totalRegions: regionsWithBdms.length,
//       regions: regionsWithBdms
//     });

//   } catch (error) {
//     console.error("Error fetching zonal manager regions with BDMs:", error);
//     return res.status(500).json({
//       status: "500",
//       message: "An error occurred while fetching zonal manager regions with BDMs"
//     });
//   }
// };



// exports.getZonalManagerRegions = async (req, res) => {
//   try {
//     const { employeeId, startDate, endDate } = req.query;

//     // Set up date range filter - default to today if not provided
//     let dateStart, dateEnd;

//     if (startDate && endDate) {
//       // If both dates are provided, use them
//       dateStart = new Date(startDate);
//       dateStart.setHours(0, 0, 0, 0);

//       dateEnd = new Date(endDate);
//       dateEnd.setHours(23, 59, 59, 999);
//     } else {
//       // Default to today
//       dateStart = new Date();
//       dateStart.setHours(0, 0, 0, 0);

//       dateEnd = new Date();
//       dateEnd.setHours(23, 59, 59, 999);
//     }

//     // Find all regions where this employee is a zonal manager
//     const zonalManagerRegions = await Parivartan_BDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         is_zonal_manager: 'Yes',  // Only get regions where employee is a zonal manager
//         Deleted: 'N',             // Not deleted
//         is_active: 'Active'       // Active status
//       },
//       include: [
//         {
//           model: Parivartan_Region,
//           attributes: ['RegionId', 'RegionName']
//         }
//       ],
//       attributes: ['RegionId', 'EmployeeId', 'EmployeeName', 'Project']
//     });

//     if (!zonalManagerRegions || zonalManagerRegions.length === 0) {
//       return res.status(404).json({
//         status: "404",
//         message: "No regions found where this employee is a zonal manager"
//       });
//     }

//     // Extract the employee details only once
//     const employeeInfo = {
//       EmployeeId: zonalManagerRegions[0].EmployeeId,
//       EmployeeName: zonalManagerRegions[0].EmployeeName
//     };

//     // Create an array to store region data with associated BDMs
//     const regionsWithBdms = [];

//     // For each region, find other BDMs associated with it
//     for (const region of zonalManagerRegions) {
//       // Find BDMs for this region with the same Project value
//       const bdmsForRegion = await Parivartan_BDM.findAll({
//         where: {
//           RegionId: region.RegionId,
//           Project: region.Project,  // Match the Project value
//           EmployeeId: {
//             [Op.ne]: employeeId // Not equal to the zonal manager
//           },
//           Deleted: 'N',
//           is_active: 'Active'
//         },
//         attributes: ['EmployeeId', 'EmployeeName', 'is_bdm']
//       });

//       // Create an array to store BDMs with their actions
//       const bdmsWithActions = [];

//       // For each BDM, fetch actions within the date range
//       for (const bdm of bdmsForRegion) {
//         // Get actions for this BDM within the date range
//         const dateRangeActions = await BdmLeadAction.findAll({
//           where: {
//             BDMId: bdm.EmployeeId,
//             action_date: {
//               [Op.gte]: dateStart,
//               [Op.lte]: dateEnd
//             }
//           },
//           attributes: [
//             'id', 'LeadId', 'task_type', 'action_type',
//             'specific_action', 'new_follow_up_date',
//             'remarks', 'action_date', 'task_name',
//             'completion_status'
//           ],
//           order: [['action_date', 'DESC']] // Most recent first
//         });

//         // Add BDM with their actions to the array
//         bdmsWithActions.push({
//           EmployeeId: bdm.EmployeeId,
//           EmployeeName: bdm.EmployeeName,
//           is_bdm: bdm.is_bdm,
//           actions: dateRangeActions.map(action => ({
//             id: action.id,
//             LeadId: action.LeadId,
//             task_type: action.task_type,
//             action_type: action.action_type,
//             specific_action: action.specific_action,
//             new_follow_up_date: action.new_follow_up_date,
//             remarks: action.remarks,
//             action_date: action.action_date,
//             task_name: action.task_name,
//             completion_status: action.completion_status
//           })),
//           actionCount: dateRangeActions.length
//         });
//       }

//       // Add region with its BDMs to result array
//       regionsWithBdms.push({
//         RegionId: region.RegionId,
//         RegionName: region.parivartan_region ? region.parivartan_region.RegionName : null,
//         Project: region.Project,
//         bdms: bdmsWithActions
//       });
//     }

//     // Return employee info once and all regions with their BDMs
//     return res.status(200).json({
//       status: "200",
//       message: "Zonal manager regions with BDMs and actions fetched successfully",
//       dateRange: {
//         startDate: dateStart,
//         endDate: dateEnd
//       },
//       employeeInfo: employeeInfo,
//       totalRegions: regionsWithBdms.length,
//       regions: regionsWithBdms
//     });

//   } catch (error) {
//     console.error("Error fetching zonal manager regions with BDMs:", error);
//     return res.status(500).json({
//       status: "500",
//       message: "An error occurred while fetching zonal manager regions with BDMs and actions"
//     });
//   }
// };





// exports.getZonalManagerRegions = async (req, res) => {
//   try {
//     const { employeeId, startDate, endDate } = req.query;

//     // Set up date range filter - default to today if not provided
//     let dateStart, dateEnd;

//     if (startDate && endDate) {
//       // If both dates are provided, use them
//       dateStart = new Date(startDate);
//       dateStart.setHours(0, 0, 0, 0);

//       dateEnd = new Date(endDate);
//       dateEnd.setHours(23, 59, 59, 999);
//     } else {
//       // Default to today
//       dateStart = new Date();
//       dateStart.setHours(0, 0, 0, 0);

//       dateEnd = new Date();
//       dateEnd.setHours(23, 59, 59, 999);
//     }

//     // Find all regions where this employee is a zonal manager
//     const zonalManagerRegions = await Parivartan_BDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         is_zonal_manager: 'Yes',  // Only get regions where employee is a zonal manager
//         Deleted: 'N',             // Not deleted
//         is_active: 'Active'       // Active status
//       },
//       include: [
//         {
//           model: Parivartan_Region,
//           attributes: ['RegionId', 'RegionName']
//         }
//       ],
//       attributes: ['RegionId', 'EmployeeId', 'EmployeeName', 'Project']
//     });

//     if (!zonalManagerRegions || zonalManagerRegions.length === 0) {
//       return res.status(404).json({
//         status: "404",
//         message: "No regions found where this employee is a zonal manager"
//       });
//     }

//     // Extract the employee details only once
//     const employeeInfo = {
//       EmployeeId: zonalManagerRegions[0].EmployeeId,
//       EmployeeName: zonalManagerRegions[0].EmployeeName
//     };

//     // Create an array to store region data with associated BDMs
//     const regionsWithBdms = [];

//     // For each region, find other BDMs associated with it
//     for (const region of zonalManagerRegions) {
//       // Find BDMs for this region with the same Project value
//       const bdmsForRegion = await Parivartan_BDM.findAll({
//         where: {
//           RegionId: region.RegionId,
//           Project: region.Project,  // Match the Project value
//           EmployeeId: {
//             [Op.ne]: employeeId // Not equal to the zonal manager
//           },
//           Deleted: 'N',
//           is_active: 'Active'
//         },
//         attributes: ['EmployeeId', 'EmployeeName', 'is_bdm']
//       });

//       // Create an array to store BDMs with their actions
//       const bdmsWithActions = [];

//       // For each BDM, fetch actions within the date range
//       for (const bdm of bdmsForRegion) {
//         // Get actions for this BDM within the date range
//         const dateRangeActions = await BdmLeadAction.findAll({
//           where: {
//             BDMId: bdm.EmployeeId,
//             action_date: {
//               [Op.gte]: dateStart,
//               [Op.lte]: dateEnd
//             }
//           },
//           attributes: [
//             'id', 'LeadId', 'task_type', 'action_type',
//             'specific_action', 'new_follow_up_date',
//             'remarks', 'action_date', 'task_name',
//             'completion_status'
//           ],
//           order: [['action_date', 'DESC']] // Most recent first
//         });

//         // Add BDM with their actions to the array
//         bdmsWithActions.push({
//           EmployeeId: bdm.EmployeeId,
//           EmployeeName: bdm.EmployeeName,
//           is_bdm: bdm.is_bdm,
//           actions: dateRangeActions.map(action => ({
//             id: action.id,
//             LeadId: action.LeadId,
//             task_type: action.task_type,
//             action_type: action.action_type,
//             specific_action: action.specific_action,
//             new_follow_up_date: action.new_follow_up_date,
//             remarks: action.remarks,
//             action_date: action.action_date,
//             task_name: action.task_name,
//             completion_status: action.completion_status
//           })),
//           actionCount: dateRangeActions.length
//         });
//       }

//       // Get actions for the zonal manager for this region
//       let zonalManagerActions = [];
//       if (bdmsForRegion.length === 0) {
//         // If there are no BDMs for this region, fetch the zonal manager's actions
//         zonalManagerActions = await BdmLeadAction.findAll({
//           where: {
//             BDMId: employeeId, // The zonal manager's ID
//             action_date: {
//               [Op.gte]: dateStart,
//               [Op.lte]: dateEnd
//             }
//           },
//           attributes: [
//             'id', 'LeadId', 'task_type', 'action_type',
//             'specific_action', 'new_follow_up_date',
//             'remarks', 'action_date', 'task_name',
//             'completion_status'
//           ],
//           order: [['action_date', 'DESC']] // Most recent first
//         });

//         if (zonalManagerActions.length > 0) {
//           // If the zonal manager has actions, add them to the array
//           bdmsWithActions.push({
//             EmployeeId: employeeId,
//             EmployeeName: employeeInfo.EmployeeName,
//             is_zonal_manager: 'Yes',
//             is_bdm: 'Yes', // Assuming the zonal manager can also act as a BDM
//             actions: zonalManagerActions.map(action => ({
//               id: action.id,
//               LeadId: action.LeadId,
//               task_type: action.task_type,
//               action_type: action.action_type,
//               specific_action: action.specific_action,
//               new_follow_up_date: action.new_follow_up_date,
//               remarks: action.remarks,
//               action_date: action.action_date,
//               task_name: action.task_name,
//               completion_status: action.completion_status
//             })),
//             actionCount: zonalManagerActions.length
//           });
//         }
//       }

//       // Add region with its BDMs to result array
//       regionsWithBdms.push({
//         RegionId: region.RegionId,
//         RegionName: region.parivartan_region ? region.parivartan_region.RegionName : null,
//         Project: region.Project,
//         bdms: bdmsWithActions
//       });
//     }

//     // Return employee info once and all regions with their BDMs
//     return res.status(200).json({
//       status: "200",
//       message: "Zonal manager regions with BDMs and actions fetched successfully",
//       dateRange: {
//         startDate: dateStart,
//         endDate: dateEnd
//       },
//       employeeInfo: employeeInfo,
//       totalRegions: regionsWithBdms.length,
//       regions: regionsWithBdms
//     });

//   } catch (error) {
//     console.error("Error fetching zonal manager regions with BDMs:", error);
//     return res.status(500).json({
//       status: "500",
//       message: "An error occurred while fetching zonal manager regions with BDMs and actions"
//     });
//   }
// };



//changes on 5may

  // exports.getZonalManagerRegions = async (req, res) => {
  //   try {
  //     const { employeeId, startDate, endDate } = req.query;

  //     // Set up date range filter - default to today if not provided
  //     let dateStart, dateEnd;

  //     if (startDate && endDate) {
  //       // If both dates are provided, use them
  //       dateStart = new Date(startDate);
  //       dateStart.setHours(0, 0, 0, 0);

  //       dateEnd = new Date(endDate);
  //       dateEnd.setHours(23, 59, 59, 999);
  //     } else {
  //       // Default to today
  //       dateStart = new Date();
  //       dateStart.setHours(0, 0, 0, 0);

  //       dateEnd = new Date();
  //       dateEnd.setHours(23, 59, 59, 999);
  //     }

  //     // Find all regions where this employee is a zonal manager
  //     const zonalManagerRegions = await Parivartan_BDM.findAll({
  //       where: {
  //         EmployeeId: employeeId,
  //         is_zonal_manager: 'Yes',  // Only get regions where employee is a zonal manager
  //         Deleted: 'N',             // Not deleted
  //         // is_active: 'Active'       // Active status
  //       },
  //       include: [
  //         {
  //           model: Parivartan_Region,
  //           attributes: ['RegionId', 'RegionName']
  //         }
  //       ],
  //       attributes: ['RegionId', 'EmployeeId', 'EmployeeName', 'Project']
  //     });

  //     if (!zonalManagerRegions || zonalManagerRegions.length === 0) {
  //       return res.status(404).json({
  //         status: "404",
  //         message: "No regions found where this employee is a zonal manager"
  //       });
  //     }

  //     // Extract the employee details only once
  //     const employeeInfo = {
  //       EmployeeId: zonalManagerRegions[0].EmployeeId,
  //       EmployeeName: zonalManagerRegions[0].EmployeeName
  //     };

  //     // Create an array to store region data with associated BDMs
  //     const regionsWithBdms = [];

  //     // For each region, find other BDMs associated with it
  //     for (const region of zonalManagerRegions) {
  //       // Find BDMs for this region with the same Project value
  //       const bdmsForRegion = await Parivartan_BDM.findAll({
  //         where: {
  //           RegionId: region.RegionId,
  //           Project: region.Project,  // Match the Project value
  //           EmployeeId: {
  //             [Op.ne]: employeeId // Not equal to the zonal manager
  //           },
  //           Deleted: 'N',
  //           // is_active: 'Active'
  //         },
  //         attributes: ['EmployeeId', 'EmployeeName', 'is_bdm']
  //       });

  //       // Create an array to store BDMs with their actions
  //       const bdmsWithActions = [];

  //       // For each BDM, fetch actions within the date range
  //       for (const bdm of bdmsForRegion) {
  //         // Get actions for this BDM within the date range
  //         const dateRangeActions = await BdmLeadAction.findAll({
  //           where: {
  //             BDMId: bdm.EmployeeId,
  //             action_date: {
  //               [Op.gte]: dateStart,
  //               [Op.lte]: dateEnd
  //             }
  //           },
  //           attributes: [
  //             'id', 'LeadId', 'task_type', 'action_type',
  //             'specific_action', 'new_follow_up_date',
  //             'remarks', 'action_date', 'task_name',
  //             'completion_status'
  //           ],
  //           order: [['action_date', 'DESC']] // Most recent first
  //         });

  //         // Add BDM with their actions to the array
  //         bdmsWithActions.push({
  //           EmployeeId: bdm.EmployeeId,
  //           EmployeeName: bdm.EmployeeName,
  //           is_bdm: 'Yes',
  //           actions: dateRangeActions.map(action => ({
  //             id: action.id,
  //             LeadId: action.LeadId,
  //             task_type: action.task_type,
  //             action_type: action.action_type,
  //             specific_action: action.specific_action,
  //             new_follow_up_date: action.new_follow_up_date,
  //             remarks: action.remarks,
  //             action_date: action.action_date,
  //             task_name: action.task_name,
  //             completion_status: action.completion_status
  //           })),
  //           actionCount: dateRangeActions.length
  //         });
  //       }

  //       // Get actions for the zonal manager for this region
  //       let zonalManagerActions = [];
  //       if (bdmsForRegion.length === 0) {
  //         // If there are no BDMs for this region, fetch the zonal manager's actions
  //         zonalManagerActions = await BdmLeadAction.findAll({
  //           where: {
  //             BDMId: employeeId, // The zonal manager's ID
  //             action_date: {
  //               [Op.gte]: dateStart,
  //               [Op.lte]: dateEnd
  //             }
  //           },
  //           attributes: [
  //             'id', 'LeadId', 'task_type', 'action_type',
  //             'specific_action', 'new_follow_up_date',
  //             'remarks', 'action_date', 'task_name',
  //             'completion_status'
  //           ],
  //           order: [['action_date', 'DESC']] // Most recent first
  //         });

  //         if (zonalManagerActions.length > 0) {
  //           // If the zonal manager has actions, add them to the array
  //           bdmsWithActions.push({
  //             EmployeeId: employeeId,
  //             EmployeeName: employeeInfo.EmployeeName,
  //             is_zonal_manager: 'Yes',
  //             actions: zonalManagerActions.map(action => ({
  //               id: action.id,
  //               LeadId: action.LeadId,
  //               task_type: action.task_type,
  //               action_type: action.action_type,
  //               specific_action: action.specific_action,
  //               new_follow_up_date: action.new_follow_up_date,
  //               remarks: action.remarks,
  //               action_date: action.action_date,
  //               task_name: action.task_name,
  //               completion_status: action.completion_status
  //             })),
  //             actionCount: zonalManagerActions.length
  //           });
  //         }
  //       }

  //       // Add region with its BDMs to result array
  //       regionsWithBdms.push({
  //         RegionId: region.RegionId,
  //         RegionName: region.parivartan_region ? region.parivartan_region.RegionName : null,
  //         Project: region.Project,
  //         bdms: bdmsWithActions
  //       });
  //     }

  //     // Return employee info once and all regions with their BDMs
  //     return res.status(200).json({
  //       status: "200",
  //       message: "Zonal manager regions with BDMs and actions fetched successfully",
  //       dateRange: {
  //         startDate: dateStart,
  //         endDate: dateEnd
  //       },
  //       employeeInfo: employeeInfo,
  //       totalRegions: regionsWithBdms.length,
  //       regions: regionsWithBdms
  //     });

  //   } catch (error) {
  //     console.error("Error fetching zonal manager regions with BDMs:", error);
  //     return res.status(500).json({
  //       status: "500",
  //       message: "An error occurred while fetching zonal manager regions with BDMs and actions"
  //     });
  //   }
  // };



  exports.getZonalManagerRegions = async (req, res) => {
    try {
      const { employeeId, startDate, endDate } = req.query;
  
      // Set up date range filter - default to today if not provided
      let dateStart, dateEnd;
  
      if (startDate && endDate) {
        // If both dates are provided, use them
        dateStart = new Date(startDate);
        dateStart.setHours(0, 0, 0, 0);
  
        dateEnd = new Date(endDate);
        dateEnd.setHours(23, 59, 59, 999);
      } else {
        // Default to today
        dateStart = new Date();
        dateStart.setHours(0, 0, 0, 0);
  
        dateEnd = new Date();
        dateEnd.setHours(23, 59, 59, 999);
      }
  
      // Find all regions where this employee is a zonal manager
      const zonalManagerRegions = await Parivartan_BDM.findAll({
        where: {
          EmployeeId: employeeId,
          is_zonal_manager: 'Yes',  // Only get regions where employee is a zonal manager
          Deleted: 'N',             // Not deleted
          // is_active: 'Active'       // Active status
        },
        include: [
          {
            model: Parivartan_Region,
            attributes: ['RegionId', 'RegionName']
          }
        ],
        attributes: ['RegionId', 'EmployeeId', 'EmployeeName', 'Project']
      });
  
      if (!zonalManagerRegions || zonalManagerRegions.length === 0) {
        return res.status(404).json({
          status: "404",
          message: "No regions found where this employee is a zonal manager"
        });
      }
  
      // Extract the employee details only once
      const employeeInfo = {
        EmployeeId: zonalManagerRegions[0].EmployeeId,
        EmployeeName: zonalManagerRegions[0].EmployeeName
      };
  
      // Create an array to store region data with associated BDMs
      const regionsWithBdms = [];
  
      // For each region, find other BDMs associated with it
      for (const region of zonalManagerRegions) {
        // Find BDMs for this region with the same Project value
        const bdmsForRegion = await Parivartan_BDM.findAll({
          where: {
            RegionId: region.RegionId,
            Project: region.Project,  // Match the Project value
            EmployeeId: {
              [Op.ne]: employeeId // Not equal to the zonal manager
            },
            Deleted: 'N',
            // is_active: 'Active'
          },
          attributes: ['EmployeeId', 'EmployeeName', 'is_bdm']
        });
  
        // Create an array to store BDMs with their actions
        const bdmsWithActions = [];
  
        // For each BDM, fetch actions within the date range
        for (const bdm of bdmsForRegion) {
          // Get actions for this BDM within the date range
          const dateRangeActions = await BdmLeadAction.findAll({
            where: {
              BDMId: bdm.EmployeeId,
              action_date: {
                [Op.gte]: dateStart,
                [Op.lte]: dateEnd
              }
            },
            include: [
              {
                model: Lead_Detail,
                as: 'Lead',
                attributes: ['id', 'CustomerName', 'MobileNo', 'CustomerMailId', 'location', 'category', 'sub_category', 'bdm_remark'],
                required: false
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
              'completion_status', 'branchOffice', 'regionalOffice',
              'lead_detail_form_id'
            ],
            order: [['action_date', 'DESC']] // Most recent first
          });
  
          // Fetch all travel forms for this BDM (for lookup if needed)
          const travelForms = await BdmTravelDetailForm.findAll({
            where: {
              BDMId: bdm.EmployeeId,
              createdAt: {
                [Op.gte]: dateStart,
                [Op.lte]: dateEnd
              }
            }
          });
  
          // Create a map for efficient lookup
          const travelFormsMap = new Map();
          travelForms.forEach(form => {
            travelFormsMap.set(form.id.toString(), form);
          });
  
          // Process the actions to include travel form and meeting details
          const processedActions = await Promise.all(dateRangeActions.map(async action => {
            const actionObj = action.toJSON();
            
            // Format meeting data if this is a meeting
            if (actionObj.specific_action && actionObj.specific_action.toLowerCase().includes('meeting')) {
              // Meeting data is already included via the Lead association
            }
            
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
              } else if (actionObj.lead_detail_form_id && travelFormsMap.has(actionObj.lead_detail_form_id.toString())) {
                const travelForm = travelFormsMap.get(actionObj.lead_detail_form_id.toString());
                actionObj.travel_form_details = {
                  id: travelForm.id,
                  taskType: travelForm.taskType,
                  branchName: travelForm.branchName,
                  regionalOfficeName: travelForm.regionalOfficeName,
                  purposeForVisit: travelForm.purposeForVisit,
                  concernPersonName: travelForm.concernPersonName,
                  adminTaskSelect: travelForm.adminTaskSelect,
                  remarks: travelForm.remarks,
                  hoSelection: travelForm.hoSelection,
                  modeOfTravel: travelForm.modeOfTravel,
                  travelFrom: travelForm.travelFrom,
                  travelTo: travelForm.travelTo,
                  reasonForTravel: travelForm.reasonForTravel,
                  mandatoryVisitImage: travelForm.mandatoryVisitImage,
                  optionalVisitImage: travelForm.optionalVisitImage
                };
              }
            }
            
            // Remove the TravelDetails object to clean up response
            delete actionObj.TravelDetails;
            
            return actionObj;
          }));
  
          // Calculate summary information
          const activitySummary = {
            totalActivities: processedActions.length,
            meetings: processedActions.filter(action => 
              action.specific_action && action.specific_action.toLowerCase().includes('meeting')
            ).length,
            roVisits: processedActions.filter(action => action.specific_action === 'RO Visit').length,
            hoVisits: processedActions.filter(action => action.specific_action === 'HO Visit').length,
            boVisits: processedActions.filter(action => action.specific_action === 'BO Visit').length,
            travels: processedActions.filter(action => action.specific_action === 'Travel').length,
            siteVisits: processedActions.filter(action => action.specific_action === 'Site Visit').length,
            other: processedActions.filter(action => 
              !['Meeting', 'RO Visit', 'HO Visit', 'BO Visit', 'Travel', 'Site Visit'].includes(action.specific_action)
            ).length
          };
  
          // Add BDM with their actions to the array
          bdmsWithActions.push({
            EmployeeId: bdm.EmployeeId,
            EmployeeName: bdm.EmployeeName,
            is_bdm: 'Yes',
            actions: processedActions,
            actionCount: processedActions.length,
            activitySummary: activitySummary
          });
        }
  
        // Get actions for the zonal manager for this region
        let zonalManagerActions = [];
        if (bdmsForRegion.length === 0 || true) { // Always include zonal manager's actions
          // Fetch the zonal manager's actions
          const zmActions = await BdmLeadAction.findAll({
            where: {
              BDMId: employeeId, // The zonal manager's ID
              action_date: {
                [Op.gte]: dateStart,
                [Op.lte]: dateEnd
              }
            },
            include: [
              {
                model: Lead_Detail,
                as: 'Lead',
                attributes: ['id', 'CustomerName', 'MobileNo', 'CustomerMailId', 'location', 'category', 'sub_category', 'bdm_remark'],
                required: false
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
              'completion_status', 'branchOffice', 'regionalOffice',
              'lead_detail_form_id'
            ],
            order: [['action_date', 'DESC']] // Most recent first
          });
  
          // Fetch all travel forms for the zonal manager
          const zmTravelForms = await BdmTravelDetailForm.findAll({
            where: {
              BDMId: employeeId,
              createdAt: {
                [Op.gte]: dateStart,
                [Op.lte]: dateEnd
              }
            }
          });
  
          // Create a map for efficient lookup
          const zmTravelFormsMap = new Map();
          zmTravelForms.forEach(form => {
            zmTravelFormsMap.set(form.id.toString(), form);
          });
  
          // Process the zonal manager's actions
          zonalManagerActions = await Promise.all(zmActions.map(async action => {
            const actionObj = action.toJSON();
            
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
              } else if (actionObj.lead_detail_form_id && zmTravelFormsMap.has(actionObj.lead_detail_form_id.toString())) {
                const travelForm = zmTravelFormsMap.get(actionObj.lead_detail_form_id.toString());
                actionObj.travel_form_details = {
                  id: travelForm.id,
                  taskType: travelForm.taskType,
                  branchName: travelForm.branchName,
                  regionalOfficeName: travelForm.regionalOfficeName,
                  purposeForVisit: travelForm.purposeForVisit,
                  concernPersonName: travelForm.concernPersonName,
                  adminTaskSelect: travelForm.adminTaskSelect,
                  remarks: travelForm.remarks,
                  hoSelection: travelForm.hoSelection,
                  modeOfTravel: travelForm.modeOfTravel,
                  travelFrom: travelForm.travelFrom,
                  travelTo: travelForm.travelTo,
                  reasonForTravel: travelForm.reasonForTravel,
                  mandatoryVisitImage: travelForm.mandatoryVisitImage,
                  optionalVisitImage: travelForm.optionalVisitImage
                };
              }
            }
            
            // Remove the TravelDetails object to clean up response
            delete actionObj.TravelDetails;
            
            return actionObj;
          }));
  
          if (zonalManagerActions.length > 0) {
            // Calculate summary information for zonal manager
            const zmActivitySummary = {
              totalActivities: zonalManagerActions.length,
              meetings: zonalManagerActions.filter(action => 
                action.specific_action && action.specific_action.toLowerCase().includes('meeting')
              ).length,
              roVisits: zonalManagerActions.filter(action => action.specific_action === 'RO Visit').length,
              hoVisits: zonalManagerActions.filter(action => action.specific_action === 'HO Visit').length,
              boVisits: zonalManagerActions.filter(action => action.specific_action === 'BO Visit').length,
              travels: zonalManagerActions.filter(action => action.specific_action === 'Travel').length,
              siteVisits: zonalManagerActions.filter(action => action.specific_action === 'Site Visit').length,
              other: zonalManagerActions.filter(action => 
                !['Meeting', 'RO Visit', 'HO Visit', 'BO Visit', 'Travel', 'Site Visit'].includes(action.specific_action)
              ).length
            };
  
            // If the zonal manager has actions, add them to the array
            bdmsWithActions.push({
              EmployeeId: employeeId,
              EmployeeName: employeeInfo.EmployeeName,
              is_zonal_manager: 'Yes',
              actions: zonalManagerActions,
              actionCount: zonalManagerActions.length,
              activitySummary: zmActivitySummary
            });
          }
        }
  
        // Calculate region-level summary
        const allActionsInRegion = bdmsWithActions.flatMap(bdm => bdm.actions);
        const regionSummary = {
          totalBdms: bdmsWithActions.length,
          totalActivities: allActionsInRegion.length,
          meetings: allActionsInRegion.filter(action => 
            action.specific_action && action.specific_action.toLowerCase().includes('meeting')
          ).length,
          roVisits: allActionsInRegion.filter(action => action.specific_action === 'RO Visit').length,
          hoVisits: allActionsInRegion.filter(action => action.specific_action === 'HO Visit').length,
          boVisits: allActionsInRegion.filter(action => action.specific_action === 'BO Visit').length,
          travels: allActionsInRegion.filter(action => action.specific_action === 'Travel').length,
          siteVisits: allActionsInRegion.filter(action => action.specific_action === 'Site Visit').length,
          other: allActionsInRegion.filter(action => 
            !['Meeting', 'RO Visit', 'HO Visit', 'BO Visit', 'Travel', 'Site Visit'].includes(action.specific_action)
          ).length
        };
  
        // Add region with its BDMs to result array
        regionsWithBdms.push({
          RegionId: region.RegionId,
          RegionName: region.parivartan_region ? region.parivartan_region.RegionName : null,
          Project: region.Project,
          summary: regionSummary,
          bdms: bdmsWithActions
        });
      }
  
      // Calculate overall summary across all regions
      const allBdms = regionsWithBdms.flatMap(region => region.bdms);
      const allActions = allBdms.flatMap(bdm => bdm.actions);
      
      const overallSummary = {
        totalRegions: regionsWithBdms.length,
        totalBdms: allBdms.length,
        totalActivities: allActions.length,
        meetings: allActions.filter(action => 
          action.specific_action && action.specific_action.toLowerCase().includes('meeting')
        ).length,
        roVisits: allActions.filter(action => action.specific_action === 'RO Visit').length,
        hoVisits: allActions.filter(action => action.specific_action === 'HO Visit').length,
        boVisits: allActions.filter(action => action.specific_action === 'BO Visit').length,
        travels: allActions.filter(action => action.specific_action === 'Travel').length,
        siteVisits: allActions.filter(action => action.specific_action === 'Site Visit').length,
        other: allActions.filter(action => 
          !['Meeting', 'RO Visit', 'HO Visit', 'BO Visit', 'Travel', 'Site Visit'].includes(action.specific_action)
        ).length
      };
  
      // Return employee info, summary, and all regions with their BDMs
      return res.status(200).json({
        status: "200",
        message: "Zonal manager regions with BDMs and actions fetched successfully",
        dateRange: {
          startDate: dateStart.toISOString(),
          endDate: dateEnd.toISOString()
        },
        employeeInfo: employeeInfo,
        overallSummary: overallSummary,
        regions: regionsWithBdms
      });
  
    } catch (error) {
      console.error("Error fetching zonal manager regions with BDMs:", error);
      return res.status(500).json({
        status: "500",
        message: "An error occurred while fetching zonal manager regions with BDMs and actions",
        error: error.message
      });
    }
  };



  //getleadbybdm
  //v3
  exports.getLeadDetailsForBDM = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      bdmId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      project,
      inquiryType,
      customerName,
      mobileNo,
      state,
      region,
      callStatus,
      callType,
      category,
      followUpDateFrom,
      subcategory,
      RegionId,
      categoryId,
      subcategoryId,
      sourceofleadGenerated,
      lastActionDate,
      lastActionType,
      AgentId,
      branchId,
      followUpDate,
      createdDateFrom,
      createdDateTo,
      followUpDateTo
    } = req.query;

    // Find BDM info to get region ID
    const bdmInfo = await Parivartan_BDM.findOne({
      where: {
        EmployeeId: bdmId,
        is_active: 'Active',
        is_bdm: 'Yes',
        Deleted: 'N'
      },
      transaction
    });

    if (!bdmInfo) {
      await transaction.commit();
      return res.status(404).json({
        success: false,
        message: "BDM not found or is not active"
      });
    }

    // Build filter conditions
    const filterConditions = {
      RegionId: bdmInfo.RegionId
    };

    // Add optional filters if provided
    if (project) filterConditions.Project = project;
    if (inquiryType) filterConditions.InquiryType = inquiryType;
    if (customerName) filterConditions.CustomerName = { [Op.like]: `%${customerName}%` };
    if (mobileNo) filterConditions.MobileNo = { [Op.like]: `%${mobileNo}%` };
    if (state) filterConditions.state_name = { [Op.like]: `%${state}%` };
    if (region) filterConditions.region_name = { [Op.like]: `%${region}%` };
    if (callStatus) filterConditions.call_status = callStatus;
    if (callType) filterConditions.call_type = callType;
    if (category) filterConditions.category = category;
    if (subcategory) filterConditions.sub_category = subcategory;
    if (RegionId) filterConditions.RegionId = RegionId;
    // if (categoryId) filterConditions.categoryId = categoryId;
    if(AgentId) filterConditions.AgentId = AgentId;
    
    if (branchId) filterConditions.branchId = branchId;

     if (sourceofleadGenerated) filterConditions.source_of_lead_generated = sourceofleadGenerated;
     if (lastActionDate) filterConditions.updatedAt = subcategoryId;
      // if (lastActionType) filterConditions.last_action = lastActionType;
      // if (followUpDate) filterConditions.follow_up_date = followUpDate;
    
   
      if (lastActionDate) {
      // Assuming lastActionDate is stored in updatedAt
      const actionDate = new Date(lastActionDate);
      filterConditions.updatedAt = {
        [Op.gte]: new Date(actionDate.setHours(0, 0, 0, 0)),
        [Op.lt]: new Date(actionDate.setHours(23, 59, 59, 999))
      };
    }
    
    // Fix for followUpDate filter
    if (followUpDate) {
      const parsedDate = new Date(followUpDate);
      filterConditions.follow_up_date = {
        [Op.gte]: new Date(parsedDate.setHours(0, 0, 0, 0)),
        [Op.lt]: new Date(parsedDate.setHours(23, 59, 59, 999))
      };
    }

    
    // Date range filters
    // if (followUpDateFrom && followUpDateTo) {
    //   filterConditions.follow_up_date = {
    //     [Op.between]: [new Date(followUpDateFrom), new Date(followUpDateTo)]
    //   };
    // } else if (followUpDateFrom) {
    //   filterConditions.follow_up_date = { [Op.gte]: new Date(followUpDateFrom) };
    // } else if (followUpDateTo) {
    //   filterConditions.follow_up_date = { [Op.lte]: new Date(followUpDateTo) };
    // }
    
    // if (createdDateFrom && createdDateTo) {
    //   filterConditions.createdAt = {
    //     [Op.between]: [new Date(createdDateFrom), new Date(createdDateTo)]
    //   };
    // } else if (createdDateFrom) {
    //   filterConditions.createdAt = { [Op.gte]: new Date(createdDateFrom) };
    // } else if (createdDateTo) {
    //   filterConditions.createdAt = { [Op.lte]: new Date(createdDateTo) };
    // }

    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Query with pagination, filtering, and includes
    const { count, rows } = await Lead_Detail.findAndCountAll({
      where: filterConditions,
     
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
      transaction
    });

    await transaction.commit();

    // Prepare pagination metadata
    const totalItems = count;
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = parseInt(page);
    const hasNext = currentPage < totalPages;
    const hasPrevious = currentPage > 1;

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems,
        totalPages,
        currentPage,
        itemsPerPage: parseInt(limit),
        hasNext,
        hasPrevious
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error fetching lead details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};



//lead count

 
const Category = require('../../models/Category');
 

// API to get category-wise lead counts for BDM's active region
exports.getBDMCategoryCounts = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { bdmId } = req.params;
    
    // Find BDM info to get region ID
    const bdmInfo = await Parivartan_BDM.findOne({
      where: {
        EmployeeId: bdmId,
        is_active: 'Active',
        is_bdm: 'Yes',
        Deleted: 'N'
      },
      transaction
    });
    
    if (!bdmInfo) {
      await transaction.commit();
      return res.status(404).json({
        success: false,
        message: "BDM not found or is not active"
      });
    }
    
    // Get all categories from the category table
    const categories = await Category.findAll({
      where: {
        Deleted: 'N'
      },
      attributes: ['CategoryId', 'CategoryName', 'Color'],
      transaction
    });
    
    // Define color mapping for specific categories
    const colorMapping = {
      'Total': { bg_color: '#000080', text_color: '#FFFFFF' },
      'Hot': { bg_color: '#FF0000', text_color: '#FFFFFF' },
      'Warm': { bg_color: '#FFA500', text_color: '#FFFFFF' },
      'Cold': { bg_color: '#0096FF', text_color: '#FFFFFF' },
      'Pending': { bg_color: '#DE3163', text_color: '#FFFFFF' },
      'Closed': { bg_color: '#0BDA51', text_color: '#FFFFFF' }
    };
    
    // Get lead counts for each category in the region
    const categoryCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await LeadDetail.count({
          where: {
            RegionId: bdmInfo.RegionId,
            categoryId: category.CategoryId
          },
          transaction
        });
        
        // Get color mapping or use the category's color from database
        const defaultColor = { 
          bg_color: category.Color, 
          text_color: '#FFFFFF' 
        };
        const colors = colorMapping[category.CategoryName] || defaultColor;
        
        return {
          category_id: category.CategoryId,
          category_name: category.CategoryName,
          count: count,
          bg_color: colors.bg_color,
          text_color: colors.text_color
        };
      })
    );
    
    // Get total lead count for the region
    const totalCount = await LeadDetail.count({
      where: {
        RegionId: bdmInfo.RegionId
      },
      transaction
    });
    
    // Prepare result with total included
    const result = [
      {
        category_id: 0,
        category_name: 'Total',
        count: totalCount,
        bg_color: colorMapping.Total.bg_color,
        text_color: colorMapping.Total.text_color
      },
      ...categoryCounts
    ];
    
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    await transaction.rollback();
    
    console.error('Error in getBDMCategoryCounts:', error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching category counts",
      error: error.message
    });
  }
};