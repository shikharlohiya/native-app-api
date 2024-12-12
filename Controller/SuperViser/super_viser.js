const Lead_Detail = require("../../models/lead_detail");
const Employee = require("../../models/employee");
const LeadUpdate = require("../../models/lead_update");
const Campaign = require("../../models/campaign");
const site_visit = require("../../models/site_visit");
const lead_Meeting = require("../../models/lead_meeting");
const estimation = require("../../models/estimation");
const { Op } = require("sequelize");
const sequelize = require("../../models/index");
const LeadLog = require("../../models/leads_logs");
const callOnDiscussion = require("../../models/OnCallDiscussionByBdm");
const multer = require("multer");
const XLSX = require("xlsx");
const OnCallDiscussionByBdm = require("../../models/OnCallDiscussionByBdm");
const { Sequelize, QueryTypes } = require("sequelize");
const BdmLeadAction = require('../../models/BdmLeadAction');
const EmployeeRole = require('../../models/employeRole');
const Parivartan_BDM = require('../../models/Parivartan_BDM');
const ParivatanRegion = require('../../models/Parivartan_Region')

exports.getLeadsWithSiteVisitsForSupervisor = async (req, res) => {
  try {
    const { page = 1, limit = 10, date, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (date) {
      whereClause.createdAt = {
        [Op.gte]: new Date(date),
        [Op.lt]: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
      };
    } else if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.gte]: new Date(startDate),
        [Op.lt]: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const { count, rows: leads } = await Lead_Detail.findAndCountAll({
      include: [
        { model: Employee, as: "Agent" },
        { model: Employee, as: "BDM" },
        { model: Employee, as: "Superviser" },
        {
          model: Campaign,
          as: "Campaign",
          attributes: ["CampaignId", "CampaignName"],
        },
        {
          model: site_visit,
          as: "site_visits",
          where: whereClause,
        },
      ],
      offset,
      limit: parseInt(limit),
    });

    const leadsWithSiteVisits = leads.map((lead) => ({
      ...lead.toJSON(),
      site_visit_count: lead.site_visits.length,
      site_visits: lead.site_visits.map((visit) => ({
        ...visit.toJSON(),
        lead_id: lead.id,
      })),
    }));

    const totalSiteVisits = await site_visit.count({ where: whereClause });

    res.status(200).json({
      leads: leadsWithSiteVisits,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
      },
      total_site_visits: totalSiteVisits,
    });
  } catch (error) {
    console.error(
      "Error retrieving leads with site visits for supervisor:",
      error
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getLeadUpdatesByBDMForSupervisor = async (req, res) => {
  try {
    const { page = 1, limit = 10, date, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      BDMId: { [Op.ne]: null },
    };

    if (date) {
      whereClause.createdAt = {
        [Op.gte]: new Date(date),
        [Op.lt]: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
      };
    } else if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.gte]: new Date(startDate),
        [Op.lt]: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const leads = await Lead_Detail.findAndCountAll({
      include: [
        { model: Employee, as: "Agent" },
        { model: Employee, as: "BDM" },
        { model: Employee, as: "Superviser" },
        {
          model: OnCallDiscussionByBdm,
          as: "Updatess",
          where: whereClause,
          required: true,
          include: [{ model: Employee, as: "BDM" }],
        },
      ],
      offset,
      limit: parseInt(limit),
    });

    const formattedLeads = leads.rows.map((lead) => ({
      ...lead.toJSON(),
     
    }));

    const bdmLeadUpdateCounts = await OnCallDiscussionByBdm.findAll({
      attributes: [
        "BDMId",
        [sequelize.fn("COUNT", sequelize.col("BDMId")), "leadUpdateCount"],
      ],
      where: whereClause,
      group: ["BDMId"],
      include: [{ model: Employee, as: "BDM", attributes: ["EmployeeName"] }],
    });

    const callOnCount = await OnCallDiscussionByBdm.count({ where: whereClause });

    res.status(200).json({
      leads: formattedLeads,
      callOnDiscussionCount:callOnCount,
      pagination: {
        total: leads.count,
        page: parseInt(page),
        limit: parseInt(limit),
      },
      bdmLeadUpdateCounts,
    });
  } catch (error) {
    console.error(
      "Error retrieving lead updates by BDM for supervisor:",
      error
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getLeadMeetingsForSupervisor = async (req, res) => {
  try {
    const { page = 1, limit = 10, date, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (date) {
      whereClause.createdAt = {
        [Op.gte]: new Date(date),
        [Op.lt]: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
      };
    } else if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.gte]: new Date(startDate),
        [Op.lt]: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const { count, rows: leads } = await Lead_Detail.findAndCountAll({
      include: [
        { model: Employee, as: "Agent" },
        { model: Employee, as: "BDM" },
        { model: Employee, as: "Superviser" },
        {
          model: Campaign,
          as: "Campaign",
          attributes: ["CampaignId", "CampaignName"],
        },
        {
          model: lead_Meeting,
          as: "lead_meetings",
          where: whereClause,
        },
      ],
      offset,
      limit: parseInt(limit),
    });

    const leadsWithMeetings = leads.map((lead) => ({
      ...lead.toJSON(),
      meeting_count: lead.lead_meetings.length,
      meetings: lead.lead_meetings.map((meeting) => ({
        ...meeting.toJSON(),
        lead_id: lead.id,
      })),
    }));

    const totalMeetings = await lead_Meeting.count({ where: whereClause });

    res.status(200).json({
      leads: leadsWithMeetings,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
      },
      total_meetings: totalMeetings,
    });
  } catch (error) {
    console.error(
      "Error retrieving leads with meetings for supervisor:",
      error
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

//07-08-2024
exports.getLeadEstimationsForSupervisor = async (req, res) => {
  try {
    const { page = 1, limit = 10, date, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (date) {
      whereClause.createdAt = {
        [Op.gte]: new Date(date),
        [Op.lt]: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
      };
    } else if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.gte]: new Date(startDate),
        [Op.lt]: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const { count, rows: leads } = await Lead_Detail.findAndCountAll({
      include: [
        { model: Employee, as: "Agent" },
        { model: Employee, as: "BDM" },
        { model: Employee, as: "Superviser" },
        {
          model: Campaign,
          as: "Campaign",
          attributes: ["CampaignId", "CampaignName"],
        },
        {
          model: estimation,
          as: "estimations",
          where: whereClause,
        },
      ],
      offset,
      limit: parseInt(limit),
    });

    const leadsWithEstimations = leads.map((lead) => ({
      ...lead.toJSON(),
      estimation_count: lead.estimations.length,
      estimations: lead.estimations.map((estimation) => ({
        ...estimation.toJSON(),
        lead_id: lead.id,
      })),
    }));

    const totalEstimations = await estimation.count({ where: whereClause });

    res.status(200).json({
      leads: leadsWithEstimations,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
      },
      total_estimations: totalEstimations,
    });
  } catch (error) {
    console.error(
      "Error retrieving leads with estimations for supervisor:",
      error
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

function formatDateForMySQL(excelDate) {
  if (
    !excelDate ||
    (typeof excelDate === "string" && excelDate.trim() === "")
  ) {
    return null; // Return null for empty cells
  }
  if (typeof excelDate === "string" && excelDate.includes("-")) {
    const [day, month, year] = excelDate.split("-");
    return `${year}-${month}-${day}`; // Convert to 'YYYY-MM-DD'
  }
  // Additional code to handle numeric Excel dates if needed
  return null;
}

exports.uploadLeads = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const file = req.file;
    const workbook = XLSX.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const existingPhoneNumbers = new Set();
    const duplicatePhoneNumbers = new Set();
    const successfulUploads = [];

    for (const row of data) {
      const mobileNo = row.MobileNo;

      // Check if the mobile number already exists in the database
      const existingLead = await Lead_Detail.findOne({
        where: { MobileNo: mobileNo },
        transaction: t,
      });

      if (existingLead || existingPhoneNumbers.has(mobileNo)) {
        duplicatePhoneNumbers.add(mobileNo);
      } else {
        existingPhoneNumbers.add(mobileNo);
        successfulUploads.push({
          InquiryType: row.InquiryType,
          Project: row.Project,
          CustomerName: row.CustomerName,
          MobileNo: mobileNo,
          AlternateMobileNo: row.AlternateMobileNo,
          WhatsappNo: row.WhatsappNo,
          CustomerMailId: row.CustomerMailId,
          pincode: row.pincode,
          state_name: row.state_name,
          region_name: row.region_name,
          location: row.location,
          site_location_address: row.site_location_address,
          call_status: row.call_status,
          call_type: row.call_type,
          category: row.category,
          sub_category: row.sub_category,
          agent_remark: row.agent_remark,
          bdm_remark: row.bdm_remark,
          follow_up_date: formatDateForMySQL(row.follow_up_date),
          lead_transfer_date: formatDateForMySQL(row.lead_transfer_date),
          source_of_lead_generated: row.source_of_lead_generated,
          close_month: row.close_month,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          AgentId: row.AgentId,
          BDMId: row.BDMId,
          SuperviserID: row.SuperviserID,
        });
      }
    }

    // Bulk create only the non-duplicate leads
    if (successfulUploads.length > 0) {
      const createdLeads = await Lead_Detail.bulkCreate(successfulUploads, {
        transaction: t,
      });

      // Create log entries for each successfully created lead
      const logEntries = createdLeads.map((lead) => ({
        LeadDetailId: lead.id,
        action_type: "Lead Created by bulk upload",
        category: lead.category,
        sub_category: lead.sub_category,
        remarks: `Lead created via bulk upload`,
        performed_by: lead.SuperviserID,
        follow_up_date: lead.follow_up_date,
      }));

      await LeadLog.bulkCreate(logEntries, { transaction: t });
    }

    await t.commit();

    let message = "";
    if (successfulUploads.length > 0) {
      message = `${successfulUploads.length} lead(s) uploaded successfully. `;
    }
    if (duplicatePhoneNumbers.size > 0) {
      message += `The following phone number(s) already exist: ${Array.from(
        duplicatePhoneNumbers
      ).join(", ")}`;
    }

    // If no leads were uploaded and there were duplicates, adjust the message
    if (successfulUploads.length === 0 && duplicatePhoneNumbers.size > 0) {
      message = `No new leads uploaded. ${message}`;
    }

    res
      .status(200)
      .json({
        message,
        uploadedCount: successfulUploads.length,
        duplicateCount: duplicatePhoneNumbers.size,
      });
  } catch (error) {
    await t.rollback();
    console.error("Error uploading leads:", error);

    if (error.name === "SequelizeDatabaseError") {
      // Handle database-related errors
      if (error.parent && error.parent.code === "ER_DATA_TOO_LONG") {
        res
          .status(400)
          .json({
            message: "Data exceeds the maximum length allowed for a field",
          });
      } else if (
        error.parent &&
        error.parent.code === "ER_NO_DEFAULT_FOR_FIELD"
      ) {
        res.status(400).json({ message: "Missing required field value" });
      } else {
        res.status(500).json({ message: "Database error occurred" });
      }
    } else if (error.name === "SequelizeValidationError") {
      // Handle validation errors
      const errors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      res.status(400).json({ message: "Validation failed", errors });
    } else if (error instanceof multer.MulterError) {
      // Handle multer-related errors
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ message: "File size exceeds the limit" });
      } else {
        res.status(400).json({ message: "File upload error occurred" });
      }
    } else {
      // Handle other errors
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

//27-09-2024---for debugging to upload
// function formatDateForMySQL(excelDate) {
//   if (!excelDate || (typeof excelDate === 'string' && excelDate.trim() === '')) {
//     return null; // Return null for empty cells
//   }
//   if (typeof excelDate === 'string' && excelDate.includes('-')) {
//     const [day, month, year] = excelDate.split('-');
//     return `${year}-${month}-${day}`; // Convert to 'YYYY-MM-DD'
//   }
//   // Additional code to handle numeric Excel dates if needed
//   return null;
// }

// exports.uploadLeads = async (req, res) => {
//   const t = await sequelize.transaction();

//   try {
//     const file = req.file;
//     const workbook = XLSX.readFile(file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });

//     const successfulUploads = [];
//     const invalidMobileNoRows = [];

//     for (let i = 0; i < data.length; i++) {
//       const row = data[i];
//       const mobileNo = row.MobileNo;

//       // Check if MobileNo is invalid
//       if (mobileNo === undefined || mobileNo === null || mobileNo === '' || !/^\d{10}$/.test(mobileNo)) {
//         invalidMobileNoRows.push({
//           rowIndex: i + 2,  // Adding 2 because Excel rows start at 1 and there's usually a header row
//           error: 'Invalid MobileNo',
//           rowData: row
//         });
//         continue;  // Skip this row and move to the next
//       }

//       try {
//         // Validate AgentId if present
//         if (row.AgentId) {
//           const agent = await Employee.findByPk(row.AgentId, { transaction: t });
//           if (!agent) {
//             invalidMobileNoRows.push({
//               rowIndex: i + 2,
//               error: `Invalid AgentId: ${row.AgentId}`,
//               rowData: row
//             });
//             continue; // Skip this row and move to the next
//           }
//         }

//         successfulUploads.push({
//           InquiryType: row.InquiryType,
//           Project: row.Project,
//           CustomerName: row.CustomerName,
//           MobileNo: mobileNo,
//           AlternateMobileNo: row.AlternateMobileNo,
//           WhatsappNo: row.WhatsappNo,
//           CustomerMailId: row.CustomerMailId,
//           pincode: row.pincode,
//           state_name: row.state_name,
//           region_name: row.region_name,
//           location: row.location,
//           site_location_address: row.site_location_address,
//           call_status: row.call_status,
//           call_type: row.call_type,
//           category: row.category,
//           sub_category: row.sub_category,
//           agent_remark: row.agent_remark,
//           bdm_remark: row.bdm_remark,
//           follow_up_date: formatDateForMySQL(row.follow_up_date),
//           lead_transfer_date: formatDateForMySQL(row.lead_transfer_date),
//           source_of_lead_generated: row.source_of_lead_generated,
//           close_month: row.close_month,
//           createdAt: row.createdAt,
//           updatedAt: row.updatedAt,
//           AgentId: row.AgentId,
//           BDMId: row.BDMId,
//           SuperviserID: row.SuperviserID,
//         });
//       } catch (error) {
//         invalidMobileNoRows.push({
//           rowIndex: i + 2,
//           error: error.message,
//           rowData: row
//         });
//       }
//     }

//     // Bulk create only the valid leads
//     if (successfulUploads.length > 0) {
//       const createdLeads = await Lead_Detail.bulkCreate(successfulUploads, { transaction: t });

//       // Create log entries for each successfully created lead
//       const logEntries = createdLeads.map(lead => ({
//         LeadDetailId: lead.id,
//         action_type: 'Lead Created by bulk upload',
//         category: lead.category,
//         sub_category: lead.sub_category,
//         remarks: `Lead created via bulk upload`,
//         performed_by: lead.SuperviserID,
//         follow_up_date: lead.follow_up_date,
//       }));

//       await LeadLog.bulkCreate(logEntries, { transaction: t });
//     }

//     await t.commit();

//     let message = `${successfulUploads.length} lead(s) uploaded successfully. `;
//     if (invalidMobileNoRows.length > 0) {
//       message += `${invalidMobileNoRows.length} row(s) with invalid mobile numbers found.`;
//     }

//     res.status(200).json({
//       message,
//       uploadedCount: successfulUploads.length,
//       invalidMobileNoCount: invalidMobileNoRows.length,
//       invalidMobileNoRows: invalidMobileNoRows
//     });
//   } catch (error) {
//     await t.rollback();
//     console.error('Error uploading leads:', error);

//     if (error.name === 'SequelizeForeignKeyConstraintError') {
//       res.status(400).json({
//         message: 'Foreign key constraint error',
//         details: error.parent.sqlMessage,
//         constraint: error.constraint
//       });
//     } else if (error.name === 'SequelizeDatabaseError') {
//       if (error.parent && error.parent.code === 'ER_DATA_TOO_LONG') {
//         res.status(400).json({
//           message: 'Data exceeds the maximum length allowed for a field',
//           details: error.parent.sqlMessage
//         });
//       } else if (error.parent && error.parent.code === 'ER_NO_DEFAULT_FOR_FIELD') {
//         res.status(400).json({
//           message: 'Missing required field value',
//           details: error.parent.sqlMessage
//         });
//       } else {
//         res.status(500).json({
//           message: 'Database error occurred',
//           details: error.parent ? error.parent.sqlMessage : error.message
//         });
//       }
//     } else if (error.name === 'SequelizeValidationError') {
//       const errors = error.errors.map((err) => ({
//         field: err.path,
//         message: err.message,
//       }));
//       res.status(400).json({ message: 'Validation failed', errors });
//     } else if (error instanceof multer.MulterError) {
//       if (error.code === 'LIMIT_FILE_SIZE') {
//         res.status(400).json({ message: 'File size exceeds the limit' });
//       } else {
//         res.status(400).json({ message: 'File upload error occurred', details: error.message });
//       }
//     } else {
//       res.status(500).json({
//         message: 'Error uploading leads',
//         details: error.message,
//         stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//       });
//     }
//   }
// };


//corrent comment
// exports.getLeads = async (req, res) => {
//   try {
//     // Pagination parameters
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     // Filtering parameters
//     const filter = {};
//     if (req.query.InquiryType) filter.InquiryType = req.query.InquiryType;
//     if (req.query.Project) filter.Project = req.query.Project;
//     if (req.query.CustomerName)
//       filter.CustomerName = { [Op.like]: `%${req.query.CustomerName}%` };
//     if (req.query.MobileNo) filter.MobileNo = req.query.MobileNo;

//     // Sorting parameter
//     const order = req.query.sort
//       ? [[req.query.sort, "ASC"]]
//       : [["createdAt", "DESC"]];

//     const { count, rows } = await Lead_Detail.findAndCountAll({
//       where: filter,
//       limit,
//       offset,
//       order,
//       include: [
//         { model: Employee, as: "BDM" },
//         { model: Employee, as: "Agent" },

//         {
//           model: Campaign,
//           as: "Campaign",
//           attributes: ["CampaignId", "CampaignName"],
//         },
//       ],
//     });

//     const totalPages = Math.ceil(count / limit);

//     res.json({
//       leads: rows,
//       currentPage: page,
//       totalPages,
//       totalLeads: count,
//     });
//   } catch (error) {
//     console.error("Error fetching leads:", error);
//     res.status(500).json({ message: "An error occurred while fetching leads" });
//   }
// };


exports.getLeads = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filtering parameters
    let filter = {};
    const includeConditions = [];

    // Helper function to add a filter condition
    const addFilter = (field, value, operatorType = Op.like) => {
      if (value) {
        const words = value.split(' ');
        if (words.length > 1) {
          return {
            [field]: {
              [Op.and]: words.map(word => ({ [operatorType]: `%${word}%` }))
            }
          };
        } else {
          return { [field]: { [operatorType]: `%${value}%` } };
        }
      }
      return null;
    };

    // Common search
    if (req.query.search) {
      const searchConditions = [
        addFilter('InquiryType', req.query.search),
        addFilter('Project', req.query.search),
        addFilter('CustomerName', req.query.search),
        addFilter('MobileNo', req.query.search),
        addFilter('region_name', req.query.search),
        addFilter('category', req.query.search),
        addFilter('close_month', req.query.search),
        { '$Campaign.CampaignName$': { [Op.like]: `%${req.query.search}%` } },
        { '$BDM.EmployeeName$': { [Op.like]: `%${req.query.search}%` } },
        { '$Agent.EmployeeName$': { [Op.like]: `%${req.query.search}%` } },
      ].filter(condition => condition !== null);

      filter = { [Op.or]: searchConditions };
    } else {
      // Apply individual filters if no common search
      filter = {
        ...addFilter('InquiryType', req.query.InquiryType),
        ...addFilter('Project', req.query.Project),
        ...addFilter('CustomerName', req.query.CustomerName),
        ...addFilter('MobileNo', req.query.MobileNo),
        ...addFilter('region_name', req.query.region),
        ...addFilter('category', req.query.category),
        ...addFilter('close_month', req.query.closuremonth),
      };

      // Campaign name filter
      if (req.query.campaignName) {
        includeConditions.push({
          model: Campaign,
          as: "Campaign",
          where: {
            CampaignName: { [Op.like]: `%${req.query.campaignName}%` }
          }
        });
      }

      // BDM name filter
      if (req.query.bdmName) {
        includeConditions.push({
          model: Employee,
          as: "BDM",
          where: {
            EmployeeName: { [Op.like]: `%${req.query.bdmName}%` }
          }
        });
      }

      // Agent name filter
      if (req.query.agentName) {
        includeConditions.push({
          model: Employee,
          as: "Agent",
          where: {
            EmployeeName: { [Op.like]: `%${req.query.agentName}%` }
          }
        });
      }
    }

    // Always include these models
    includeConditions.push(
      { model: Campaign, as: "Campaign" },
      { model: Employee, as: "BDM" },
      { model: Employee, as: "Agent" }
    );

    // Sorting parameter
    const order = req.query.sort
      ? [[req.query.sort, "ASC"]]
      : [["createdAt", "DESC"]];

    const { count, rows } = await Lead_Detail.findAndCountAll({
      where: filter,
      limit,
      offset,
      order,
      include: includeConditions,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      leads: rows,
      currentPage: page,
      totalPages,
      totalLeads: count,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ message: "An error occurred while fetching leads" });
  }
};



//excel export

exports.exportLeadsToExcel = async (req, res) => {
  try {
    // Fetch all leads without filtering
    const leads = await Lead_Detail.findAll({
      include: [
        { model: Employee, as: "BDM" },
        { model: Employee, as: "Agent" },
        { model: Employee, as: "Superviser" },
        {
          model: Campaign,
          as: "Campaign",
          attributes: ["CampaignId", "CampaignName"],
        },
      ],
    });

    if (leads.length === 0) {
      return res.status(404).json({ message: 'No leads found in the database' });
    }

    // Prepare data for Excel
    const excelData = leads.map(lead => {
      // Determine the lead creator name
      let leadCreator = '';
      if (lead.lead_created_by === 1 && lead.Agent) {
        leadCreator = lead.Agent.EmployeeName;
      } else if (lead.lead_created_by === 2 && lead.BDM) {
        leadCreator = lead.BDM.EmployeeName;
      }

      return {
        
        Project: lead.Project,
        CustomerName: lead.CustomerName,
        MobileNo: lead.MobileNo,
        Region: lead.region_name,
        Location: lead.location,
        Category: lead.category,
       'Sub Category': lead.sub_category,
       'CSE Remark': lead.agent_remark,
       'BDM Remark': lead.bdm_remark,
       'Next Follow Up Date': lead.follow_up_date,
       'Closure Month': lead.close_month,
       'Source Of Lead': lead.Campaign ? lead.Campaign.CampaignName : '',
       'CSE Name': lead.Agent ? lead.Agent.EmployeeName : '',
       'BDM Name': lead.BDM ? lead.BDM.EmployeeName : '',
       'Coordinator Name': lead.Superviser ? lead.Superviser.EmployeeName : '',
       'Last Action': lead.last_action,
        InquiryType: lead.InquiryType,
        AlternateMobileNo: lead.AlternateMobileNo,
        WhatsappNo: lead.WhatsappNo,
        CustomerMailId: lead.CustomerMailId,
        State: lead.state_name,
        Pincode: lead.pincode,
        'Site Location Address': lead.site_location_address,
        'Lead Transfer Date': lead.lead_transfer_date,
        'Call Status': lead.call_status,
        'Call Type': lead.call_type,
        'Lead Created By': leadCreator,
        // 'Lead Created By': lead.lead_created_by === 1 ? 'Agent' : (lead.lead_created_by === 2 ? 'BDM' : ''),
      };
    });

    // Create a new workbook and add a worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=All_Leads_Export.xlsx');

    // Send the Excel file
    res.send(excelBuffer);

  } catch (error) {
    console.error('Error exporting leads:', error);
    
    if (res.headersSent) {
      console.error('Headers already sent, unable to send error response');
      return;
    }

    if (error.name === 'SequelizeConnectionError') {
      return res.status(503).json({ message: 'Database connection error. Please try again later.' });
    } else {
      return res.status(500).json({ message: 'An unexpected error occurred while exporting leads.' });
    }
  }
};





//filter list-

exports.getDistinctValues = async (req, res) => {
  try {
    const field = req.params.field;
    let values;
    console.log(field, '-------------');
    

    switch (field) {
      case 'InquiryType':
      case 'Project':
      case 'region_name':
      case 'category':
        values = await Lead_Detail.findAll({
          attributes: [[Sequelize.fn('DISTINCT', Sequelize.col(field)), field]],
          where: {
            [field]: {
              [Op.ne]: null,
              [Op.ne]: ''
            }
          },
          order: [[field, 'ASC']]
        });
        break;

      case 'campaignName':
        values = await Campaign.findAll({
          attributes: ['CampaignId', 'CampaignName'],
          order: [['CampaignName', 'ASC']]
        });
        break;

      case 'bdmName':
      case 'agentName':
        const role = field === 'bdmName' ? 'BDM' : 'Agent';
        values = await Employee.findAll({
          attributes: ['EmployeeId', 'EmployeeName'],
          where: {
            '$role.RoleName$': role
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
        return res.status(400).json({ message: 'Invalid field specified' });
    }

    res.json(values);
  } catch (error) {
    console.error(`Error fetching ${field} values:`, error);
    res.status(500).json({ message: `An error occurred while fetching ${field} values` });
  }
};


 







//region wise // bdm wise
exports.getLeadAnalytics = async (req, res) => {
  try {
    const { filter } = req.query;
    let result;

    if (filter === "region") {
      result = await Lead_Detail.findAll({
        attributes: [
          "region_name",
          [
            sequelize.fn(
              "COUNT",
              sequelize.literal('CASE WHEN category = "hot" THEN 1 END')
            ),
            "hot_count",
          ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.literal('CASE WHEN category = "warm" THEN 1 END')
            ),
            "warm_count",
          ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.literal('CASE WHEN category = "cold" THEN 1 END')
            ),
            "cold_count",
          ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.literal('CASE WHEN category = "pending" THEN 1 END')
            ),
            "pending_count",
          ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.literal('CASE WHEN category = "closed" THEN 1 END')
            ),
            "closed_count",
          ],
        ],
        group: ["region_name"],
        where: {
          region_name: {
            [Op.not]: null,
          },
        },
      });
    } else if (filter === "bdm") {
      result = await Lead_Detail.findAll({
        attributes: [
          [sequelize.col("BDM.EmployeeName"), "bdm_name"],
          [
            sequelize.fn(
              "COUNT",
              sequelize.literal('CASE WHEN category = "hot" THEN 1 END')
            ),
            "hot_count",
          ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.literal('CASE WHEN category = "warm" THEN 1 END')
            ),
            "warm_count",
          ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.literal('CASE WHEN category = "cold" THEN 1 END')
            ),
            "cold_count",
          ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.literal('CASE WHEN category = "pending" THEN 1 END')
            ),
            "pending_count",
          ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.literal('CASE WHEN category = "closed" THEN 1 END')
            ),
            "closed_count",
          ],
        ],
        include: [
          {
            model: Employee,
            as: "BDM",
            attributes: [],
          },
        ],
        group: ["BDM.EmployeeId"],
        where: {
          BDMId: {
            [Op.not]: null,
          },
        },
      });
    } else {
      return res
        .status(400)
        .json({ message: 'Invalid filter parameter. Use "region" or "bdm".' });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching lead analytics:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching lead analytics" });
  }
};

exports.getRegionMeetingCount = async (req, res) => {
  try {
    const { filter } = req.query;
    let result;

    if (filter === "region") {
      result = await Lead_Detail.findAll({
        attributes: [
          "region_name",
          [
            sequelize.fn("COUNT", sequelize.col("lead_meetings.id")),
            "meeting_count",
          ],
        ],
        include: [
          {
            model: lead_Meeting,
            as: "lead_meetings",
            attributes: [],
            required: false,
          },
        ],
        where: {
          region_name: {
            [Op.not]: null,
          },
        },
        group: ["region_name"],
        order: [[sequelize.literal("meeting_count"), "DESC"]],
        raw: true,
      });
    } else if (filter === "bdm") {
      result = await Lead_Detail.findAll({
        attributes: [
          [sequelize.col("BDM.EmployeeName"), "bdm_name"],
          [
            sequelize.fn("COUNT", sequelize.col("lead_meetings.id")),
            "meeting_count",
          ],
        ],
        include: [
          {
            model: Employee,
            as: "BDM",
            attributes: [],
          },
          {
            model: lead_Meeting,
            as: "lead_meetings",
            attributes: [],
            required: false,
          },
        ],
        where: {
          BDMId: {
            [Op.not]: null,
          },
        },
        group: ["BDM.EmployeeId", "BDM.EmployeeName"],
        order: [[sequelize.literal("meeting_count"), "DESC"]],
        raw: true,
      });
    } else {
      return res
        .status(400)
        .json({ message: 'Invalid filter parameter. Use "region" or "bdm".' });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching lead meeting count analytics:", error);
    res
      .status(500)
      .json({
        message:
          "An error occurred while fetching lead meeting count analytics",
        error: error.message,
      });
  }
};


//v1

// exports.getBDMFollowUpTasks = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, bdmId } = req.query;
//     const offset = (page - 1) * limit;

//     // Get today's date
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const whereClause = {
//       follow_up_date: {
//         [Op.gte]: today,
//         [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
//       },
//       [Op.or]: [{ lead_created_by: { [Op.ne]: 2 } }, { lead_created_by: null }],
//     };


//     if (bdmId) {
//       whereClause.BDMId = bdmId;
//     }

//     const leads = await Lead_Detail.findAndCountAll({
//       where: whereClause,
//       include: [
//         // { model: Employee, as: 'Agent', attributes: ['id', 'EmployeeName'] },
//         // { model: Employee, as: 'BDM', attributes: ['id', 'EmployeeName'] },
//         // { model: Employee, as: 'Superviser', attributes: ['id', 'EmployeeName'] },
//         // { model: Campaign, as: 'Campaign', attributes: ['id', 'name'] },
//         // {model: Lead_Detail}
//       ],
//       order: [["follow_up_date", "ASC"]],
//       offset,
//       limit: parseInt(limit),
//     });

//     const formattedLeads = leads.rows.map((lead) => ({
//       id: lead.id,
//       CustomerName: lead.CustomerName,
//       MobileNo: lead.MobileNo,
//       location: lead.location,
//       category: lead.category,
//       sub_category: lead.sub_category,
//       agent_remark: lead.agent_remark,
//       bdm_remark: lead.bdm_remark,
//       follow_up_date: lead.follow_up_date,
//     }));

//     res.status(200).json({
//       Ho_task: formattedLeads,
//     });
//   } catch (error) {
//     console.error("Error retrieving BDM follow-up tasks:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


//v2

exports.getBDMFollowUpTasks = async (req, res) => {
  try {
      const { page = 1, limit = 10, bdmId } = req.query;
      const offset = (page - 1) * limit;

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // First get BDM's assigned regions with projects
      const bdmAssignments = await Parivartan_BDM.findAll({
          where: {
              EmployeeId: bdmId,
              is_active: 'Active',
              Deleted: 'N'
          },
          attributes: ['RegionId', 'Project']
      });

      console.log(bdmAssignments, "----------------");
      

      if (!bdmAssignments || bdmAssignments.length === 0) {
          return res.status(404).json({
              success: false,
              message: "No active assignments found for this BDM"
          });
      }

      // Create an array of region-project combinations
      const assignments = bdmAssignments.map(assignment => ({
          RegionId: assignment.RegionId,
          Project: assignment.Project
      }));

      // Build where clause with region and project conditions
      // const whereClause = {
      //     follow_up_date: {
      //         [Op.gte]: today,
      //         [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      //     },
      //     [Op.or]: assignments.map(assignment => ({
      //         [Op.and]: {
      //             RegionId: assignment.RegionId,
      //             Project: assignment.Project
      //         }
      //     })),
      //     [Op.or]: [
      //         { lead_created_by: 1 },  // Created by agent
      //         { lead_created_by: null }  // Uploaded by HO supervisor
      //     ],
      //     // BDMId: bdmId
      // };

      const whereClause = {
        [Op.and]: [
            {
                follow_up_date: {
                    [Op.gte]: today,
                    [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                }
            },
            {
                [Op.or]: assignments.map(assignment => ({
                    [Op.and]: {
                        RegionId: assignment.RegionId,
                        Project: assignment.Project
                    }
                }))
            },
            {
                [Op.or]: [
                    { lead_created_by: 1 },
                    { lead_created_by: null }
                ]
            },
            { BDMId: bdmId }
        ]
    };

      const leads = await Lead_Detail.findAndCountAll({
          where: whereClause,
          // include: [{
          //     model: ParivatanRegion,
          //     as: 'Region',
          //     attributes: ['RegionName']
          // }],
          order: [["follow_up_date", "ASC"]],
          offset,
          limit: parseInt(limit)
      });

      const formattedLeads = leads.rows.map((lead) => ({
          id: lead.id,
          CustomerName: lead.CustomerName,
          MobileNo: lead.MobileNo,
          location: lead.location,
          category: lead.category,
          sub_category: lead.sub_category,
          agent_remark: lead.agent_remark,
          bdm_remark: lead.bdm_remark,
          follow_up_date: lead.follow_up_date,
          region_name: lead.Region?.RegionName,
          Project: lead.Project,
          lead_source: lead.lead_created_by === 1 ? 'Agent Created' : 'HO Uploaded'
           
          
      }));

      res.status(200).json({
          success: true,
          totalCount: leads.count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(leads.count / parseInt(limit)),
          Ho_task: formattedLeads,
          assignments: assignments.map(a => ({
              regionId: a.RegionId,
              project: a.Project,
              regionName: leads.rows.find(l => l.RegionId === a.RegionId)?.Region?.RegionName
          }))
      });

  } catch (error) {
      console.error("Error retrieving BDM follow-up tasks:", error);
      res.status(500).json({
          success: false,
          message: "Error fetching follow-up tasks",
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
  }
};







//v1
// exports.getBDMSelfTasks = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, bdmId } = req.query;
//     const offset = (page - 1) * limit;

//     console.log("Query parameters:", { page, limit, bdmId });

//     // Get today's date
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);
    
//     console.log("Date range:", {
//       today: today.toISOString(),
//       tomorrow: tomorrow.toISOString(),
//     });

//     const whereClause = {
//       lead_created_by: 2, // Self tasks created by BDM
//       follow_up_date: {
//         [Op.gte]: today,
//         [Op.lt]: tomorrow,
//       },
//     };

//     if (bdmId) {
//       whereClause.BDMId = bdmId;
//     }

//     console.log("Where clause:", JSON.stringify(whereClause, null, 2));

//     // Log the SQL query
//     const queryOptions = {
//       where: whereClause,
//       order: [["follow_up_date", "ASC"]],
//       offset,
//       limit: parseInt(limit),
//       logging: console.log, // This will log the SQL query
//     };

//     const selfTasks = await Lead_Detail.findAndCountAll(queryOptions);

//     console.log("Raw results:", JSON.stringify(selfTasks, null, 2));

//     const formattedLeads = selfTasks.rows.map((lead) => ({
//       id: lead.id,
//       InquiryType: lead.InquiryType,
//       Project: lead.Project,
//       CustomerName: lead.CustomerName,
//       MobileNo: lead.MobileNo,
//       location: lead.location,
//       category: lead.category,
//       sub_category: lead.sub_category,
//       agent_remark: lead.agent_remark,
//       bdm_remark: lead.bdm_remark,
//       follow_up_date: lead.follow_up_date,
//     }));

//     console.log("Formatted leads:", JSON.stringify(formattedLeads, null, 2));

//     // res.status(200).json({
//     //   self_task: {
//     //     leads: formattedLeads,

//     //   },
//     // });

//     res.status(200).json({
//       self_task: formattedLeads,
//     });
//   } catch (error) {
//     console.error("Error retrieving BDM self tasks:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };




// v2

exports.getBDMSelfTasks = async (req, res) => {
  try {
      const { page = 1, limit = 10, bdmId } = req.query;
      const offset = (page - 1) * limit;

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // First get BDM's assigned regions with projects
      const bdmAssignments = await Parivartan_BDM.findAll({
          where: {
              EmployeeId: bdmId,
              is_active: 'Active', 
              Deleted: 'N'
          },
          attributes: ['RegionId', 'Project']
      });

      if (!bdmAssignments || bdmAssignments.length === 0) {
          return res.status(404).json({
              success: false,
              message: "No active assignments found for this BDM"
          });
      }

      // Create array of region-project combinations
      const assignments = bdmAssignments.map(assignment => ({
          RegionId: assignment.RegionId,
          Project: assignment.Project
      }));

      // const whereClause = {
      //     follow_up_date: {
      //         [Op.gte]: today,
      //         [Op.lt]: tomorrow
      //     },
      //     [Op.or]: [
      //         { lead_created_by: 2 }, // Created by BDM
      //         { lead_created_by: 3 }  // Created by Zonal Manager
      //     ],
      //     // BDMId: bdmId,
      //     [Op.or]: assignments.map(assignment => ({
      //         [Op.and]: {
      //             RegionId: assignment.RegionId,
      //             Project: assignment.Project
      //         }
      //     }))
      // };

      const whereClause = {
        follow_up_date: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
        },
        [Op.and]: [
            {
                [Op.or]: [
                    { lead_created_by: 2 },  // Created by BDM
                    { lead_created_by: 3 }   // Created by Zonal Manager
                ]
            },
            {
                [Op.or]: assignments.map(assignment => ({
                    [Op.and]: {
                        RegionId: assignment.RegionId,
                        Project: assignment.Project
                    }
                }))
            }
        ]
    };
    //   const whereClause = {
    //     follow_up_date: {
    //         [Op.gte]: today,
    //         [Op.lt]: tomorrow
    //     },
    //     BDMId: bdmId,  // Add this back
    //     [Op.and]: [
    //         {
    //             [Op.or]: [
    //                 { lead_created_by: 2 }, // Created by BDM
    //                 { lead_created_by: 3 }  // Created by Zonal Manager
    //             ]
    //         },
    //         {
    //             [Op.or]: assignments.map(assignment => ({
    //                 [Op.and]: {
    //                     RegionId: assignment.RegionId,
    //                     Project: assignment.Project
    //                 }
    //             }))
    //         }
    //     ]
    // };

      const selfTasks = await Lead_Detail.findAndCountAll({
          where: whereClause,
          include: [{
              model: ParivatanRegion,
              as: 'Region',
              attributes: ['RegionName']
          }],
          order: [["follow_up_date", "ASC"]],
          offset,
          limit: parseInt(limit)
      });

      const formattedLeads = selfTasks.rows.map((lead) => ({
          id: lead.id,
          InquiryType: lead.InquiryType,
          Project: lead.Project,
          CustomerName: lead.CustomerName,
          MobileNo: lead.MobileNo,
          location: lead.location,
          category: lead.category,
          sub_category: lead.sub_category,
          agent_remark: lead.agent_remark,
          bdm_remark: lead.bdm_remark,
          follow_up_date: lead.follow_up_date,
          region_name: lead.Region?.RegionName,
          creator_type: lead.lead_created_by === 2 ? 'BDM' : 'Zonal Manager'
      }));

      res.status(200).json({
          success: true,
          totalCount: selfTasks.count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(selfTasks.count / parseInt(limit)),
          self_task: formattedLeads,
          assignments: assignments.map(a => ({
              regionId: a.RegionId,
              project: a.Project,
              regionName: selfTasks.rows.find(l => l.RegionId === a.RegionId)?.Region?.RegionName
          }))
      });

  } catch (error) {
      console.error("Error retrieving BDM self tasks:", error);
      res.status(500).json({
          success: false,
          message: "Error fetching self tasks",
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
  }
};


exports.getBdmDailyTasks = async (req, res) => {
  try {
    const { bdmId } = req.params;

    if (!bdmId) {
      return res.status(400).json({ message: 'BDM ID is required' });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await BdmLeadAction.findAll({
      where: {
        BDMId: bdmId,
        action_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      },
      include: [
        {
          model: Lead_Detail,
          as: 'Lead',
          attributes: ['CustomerName', 'MobileNo', 'location', 'category', 'sub_category', 'agent_remark', 'bdm_remark']
        }
      ],
      order: [['action_date', 'ASC']]
    });

    const formattedTasks = {
      HO_task: [],
      self_task: [],
      other_task: []
    };

    tasks.forEach(task => {
      const formattedTask = {
        id: task.id,
        action_type: task.action_type,
        specific_action: task.specific_action,
        new_follow_up_date: task.new_follow_up_date,
        remarks: task.remarks,
        action_date: task.action_date,
        completion_status: task.completion_status,
        lead: task.Lead ? {
          CustomerName: task.Lead.CustomerName,
          MobileNo: task.Lead.MobileNo,
          location: task.Lead.location,
          category: task.Lead.category,
          sub_category: task.Lead.sub_category,
          agent_remark: task.Lead.agent_remark,
          bdm_remark: task.Lead.bdm_remark
        } : null
      };

      if (task.task_type === 'HO_task') {
        formattedTasks.HO_task.push(formattedTask);
      } else if (task.task_type === 'self_task') {
        formattedTasks.self_task.push(formattedTask);
      } else if (task.task_type === 'other_task') {
        formattedTasks.other_task.push({
          id: task.id,
          task_name: task.task_name,
          remarks: task.remarks,
          action_date: task.action_date
        });
      }
    });

    res.status(200).json({
      message: 'BDM daily tasks retrieved successfully',
      tasks: formattedTasks
    });
  } catch (error) {
    console.error('Error retrieving BDM daily tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
