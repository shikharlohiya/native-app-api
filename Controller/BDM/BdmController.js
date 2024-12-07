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
const { Op } = require('sequelize');
const ParivatanBDM = require('../../models/Parivartan_BDM');
const ParivatanRegion = require('../../models/Parivartan_Region');

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
          attributes: ["id", "CustomerName", "MobileNo", "Project", "BDMId"],
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

exports.getEmployeeLeads = async (req, res) => {
  try {
      const {
          page = 1,
          pageSize = 10,
          sortBy = 'createdAt',
          sortOrder = 'DESC',
          search,
          category,
          location,
          call_status,
          call_type,
          fromDate,
          toDate
      } = req.query;

      const { employeeId } = req.params;

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

      let whereClause = {
          RegionId: {
              [Op.in]: regionIds
          },
          Project: {
              [Op.in]: employeeAssignments.map(ea => ea.Project).filter(p => p)
          }
      };

      if (search) {
          whereClause[Op.or] = [
              { CustomerName: { [Op.like]: `%${search}%` } },
              { MobileNo: { [Op.like]: `%${search}%` } },
              { WhatsappNo: { [Op.like]: `%${search}%` } },
              { CustomerMailId: { [Op.like]: `%${search}%` } },
              { location: { [Op.like]: `%${search}%` } },
              { pincode: { [Op.like]: `%${search}%` } }
          ];
      }

      if (category) whereClause.category = category;
      if (location) whereClause.location = { [Op.like]: `%${location}%` };
      if (call_status) whereClause.call_status = call_status;
      if (call_type) whereClause.call_type = call_type;
      if (fromDate && toDate) {
          whereClause.createdAt = {
              [Op.between]: [new Date(fromDate), new Date(toDate)]
          };
      }

      const categoryCounts = await LeadDetail.findAll({
          where: whereClause,
          attributes: [
              'category',
              [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['category']
      });

      const { count, rows: leads } = await LeadDetail.findAndCountAll({
          where: whereClause,
          include: [
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
          ],
          order: [[sortBy, sortOrder]],
          limit: parseInt(pageSize),
          offset: (parseInt(page) - 1) * parseInt(pageSize)
      });

      const categoryStats = {
          cold: 0,
          warm: 0,
          hot: 0,
          closed: 0,
          pending: 0
      };

      categoryCounts.forEach(cat => {
          if (cat.category && cat.dataValues.count) {
              categoryStats[cat.category.toLowerCase()] = parseInt(cat.dataValues.count);
          }
      });

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