const express = require("express");
const router = express.Router();
const Estimation = require("../../models/estimation");
const Lead_Detail = require("../../models/lead_detail");
const Employee = require("../../models/employee");
const LeadLog = require("../../models/leads_logs");
const sequelize = require("../../models/index");
const archiver = require("archiver");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const stream = require("stream");

exports.createEstimation = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      LeadDetailId,
      BDMId,
      EstimationRequirement,
      CivilConstructedStarted,
      ShedLength,
      EquipementPlacementLength,
      ShedWidth,
      CShape,
      ModalType,
      SideWallColumnToColumnGap,
      NumberOfSheds,
      CurtainRequirment,
      DiselBrooderRequirment,
      PowerSupply,
      WaterSupply,
      Remarks,
      category,
      status,
      sub_category,
      follow_up_date,
      closure_month,
      estimation_amount,
      estimationNumber,
      firm_farmer_name,
      last_estimation_number,
    } = req.body;

    // Parse the IDs to integers
    const leadDetailId = parseInt(LeadDetailId, 10);
    const bdmId = parseInt(BDMId, 10);

    // Check if the IDs are valid numbers
    if (isNaN(leadDetailId) || isNaN(bdmId)) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid LeadDetailId or BDMId" });
    }

    // Check if the lead detail exists
    const leadDetail = await Lead_Detail.findByPk(leadDetailId, {
      transaction: t,
    });
    if (!leadDetail) {
      await t.rollback();
      return res.status(404).json({ error: "Lead detail not found" });
    }

    const bdm = await Employee.findByPk(bdmId, { transaction: t });
    if (!bdm) {
      await t.rollback();
      return res.status(404).json({ error: "BDM not found" });
    }

    // Create a new estimation
    const estimation = await Estimation.create(
      {
        LeadDetailId: leadDetailId,
        EstimationRequirement,
        CivilConstructedStarted,
        ShedLength,
        EquipementPlacementLength,
        ShedWidth,
        CShape,
        ModalType,
        SideWallColumnToColumnGap,
        NumberOfSheds,
        CurtainRequirment,
        DiselBrooderRequirment,
        PowerSupply,
        WaterSupply,
        Remarks,
        category,
        sub_category,
        follow_up_date,
        closure_month,
        Bdm_id: bdmId,
        Estimation_request_date: new Date(),
        estimation_amount,
        estimationNumber,
        firm_farmer_name,
        last_estimation_number,
        status,
      },
      { transaction: t }
    );

    // Update the Lead_Detail
    await leadDetail.update(
      {
        follow_up_date,
        category,
        sub_category,
        close_month: closure_month,
        last_action: "Estimation Request",
      },
      { transaction: t }
    );

    // Create a log entry
    await LeadLog.create(
      {
        action_type: "Estimation Requested",
        category,
        sub_category,
        remarks: Remarks,
        performed_by: bdmId,
        LeadDetailId: leadDetailId,
        follow_up_date,
        estimations_status: status,
      },
      { transaction: t }
    );

    // If we reach here, no errors were thrown, so we commit the transaction
    await t.commit();

    res.status(201).json({
      message:
        "Estimation created successfully, lead detail updated, and action logged",
      estimation,
      updatedLeadDetail: leadDetail,
    });
  } catch (error) {
    // If we catch any error, we rollback the transaction
    await t.rollback();
    console.error("Error creating estimation:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

exports.updateEstimationDownloadStatus = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { estimation_id, download_done, employeeId } = req.body;

    if (!estimation_id) {
      await t.rollback();
      return res.status(400).json({ error: "estimation_id is required" });
    }

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
        Is_downloadable: 1,
        lastUpdatedBy: employeeId,
      },
      { transaction: t }
    );

    // Update LeadDetail
    const leadDetail = await Lead_Detail.findByPk(estimation.LeadDetailId, {
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
        performed_by: employeeId,
        LeadDetailId: estimation.LeadDetailId,
        follow_up_date: leadDetail ? leadDetail.follow_up_date : null,
        estimations_status: "Estimation Shared",
      },
      { transaction: t }
    );

    await t.commit();

    // Create a zip file
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level
    });

    // Set the content type and attachment header
    res.attachment(`estimation_${estimation_id}_documents.zip`);
    archive.pipe(res);

    // Add files to the zip
    if (estimation.ho_document && Array.isArray(estimation.ho_document)) {
      for (let i = 0; i < estimation.ho_document.length; i++) {
        const url = estimation.ho_document[i];
        if (typeof url === "string" && url.startsWith("http")) {
          try {
            const response = await axios.get(url, {
              responseType: "arraybuffer",
            });
            const fileName = `document_${i + 1}${url.substring(
              url.lastIndexOf(".")
            )}`;
            archive.append(response.data, { name: fileName });
          } catch (error) {
            console.error(`Error downloading file from ${url}:`, error);
            // Continue with the next file if one fails
          }
        }
      }
    }

    // Finalize the archive and send the response
    archive.finalize();
  } catch (error) {
    await t.rollback();
    console.error("Error updating estimation download status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getEstimationsByLeadDetailId = async (req, res) => {
  try {
    const { leadDetailId } = req.params;

    // Parse the leadDetailId to an integer
    const parsedLeadDetailId = parseInt(leadDetailId, 10);

    // Check if the ID is a valid number
    if (isNaN(parsedLeadDetailId)) {
      return res.status(400).json({ error: "Invalid LeadDetailId" });
    }

    // Check if the lead detail exists
    const leadDetail = await Lead_Detail.findByPk(parsedLeadDetailId);
    if (!leadDetail) {
      return res.status(404).json({ error: "Lead detail not found" });
    }

    // Fetch estimations for the given LeadDetailId
    const estimations = await Estimation.findAll({
      where: {
        LeadDetailId: parsedLeadDetailId,
        status: "Generated", // Only fetch estimations with 'Generated' status
      },
      order: [["createdAt", "DESC"]], // Order by creation date, most recent first
    });

    res.status(200).json({
      success: true,
      message: "Estimations fetched successfully",
      data: estimations,
    });
  } catch (error) {
    console.error("Error fetching estimations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getEstimationsSharedByLeadDetailId = async (req, res) => {
  try {
    const { leadDetailId } = req.params;

    // Parse the leadDetailId to an integer
    const parsedLeadDetailId = parseInt(leadDetailId, 10);

    // Check if the ID is a valid number
    if (isNaN(parsedLeadDetailId)) {
      return res.status(400).json({ error: "Invalid LeadDetailId" });
    }

    // Check if the lead detail exists
    const leadDetail = await Lead_Detail.findByPk(parsedLeadDetailId);
    if (!leadDetail) {
      return res.status(404).json({ error: "Lead detail not found" });
    }

    // Fetch estimations for the given LeadDetailId
    const estimations = await Estimation.findAll({
      where: {
        LeadDetailId: parsedLeadDetailId,
        status: "Estimation Shared", // Only fetch estimations with 'Generated' status
      },
      order: [["createdAt", "DESC"]], // Order by creation date, most recent first
    });

    res.status(200).json({
      success: true,
      message: "Estimations fetched successfully",
      data: estimations,
    });
  } catch (error) {
    console.error("Error fetching estimations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getEstimationsConvert = async (req, res) => {
  try {
    const { leadDetailId } = req.params;

    // Parse the leadDetailId to an integer
    const parsedLeadDetailId = parseInt(leadDetailId, 10);

    // Check if the ID is a valid number
    if (isNaN(parsedLeadDetailId)) {
      return res.status(400).json({ error: "Invalid LeadDetailId" });
    }

    // Check if the lead detail exists
    const leadDetail = await Lead_Detail.findByPk(parsedLeadDetailId);
    if (!leadDetail) {
      return res.status(404).json({ error: "Lead detail not found" });
    }

    // Fetch estimations for the given LeadDetailId
    const estimations = await Estimation.findAll({
      where: {
        LeadDetailId: parsedLeadDetailId,
        status: "Converted", // Only fetch estimations with 'Generated' status
      },
      order: [["createdAt", "DESC"]], // Order by creation date, most recent first
    });

    res.status(200).json({
      success: true,
      message: "Estimations fetched successfully",
      data: estimations,
    });
  } catch (error) {
    console.error("Error fetching estimations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getEstimationByLeadId = async (req, res) => {
  try {
    const { leadId } = req.params;

    const estimations = await Estimation.findAll({
      where: {
        LeadDetailId: leadId,
      },
    });

    if (estimations.length === 0) {
      return res
        .status(200)
        .json({ message: "No estimations available for the given lead ID" });
    }

    res.status(200).json(estimations);
  } catch (error) {
    console.error("Error retrieving estimations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.downloadEstimationZip = async (req, res) => {
  try {
    const { estimation_id } = req.params;

    if (!estimation_id) {
      return res.status(400).json({ error: "estimation_id is required" });
    }

    const estimation = await Estimation.findByPk(estimation_id);

    if (!estimation) {
      return res.status(404).json({
        success: false,
        message: "Estimation not found",
      });
    }

    // Create a zip file
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Set the content type and attachment header
    res.attachment(`estimation_${estimation_id}_documents.zip`);
    archive.pipe(res);

    // Add files to the zip
    if (estimation.ho_document && Array.isArray(estimation.ho_document)) {
      for (let i = 0; i < estimation.ho_document.length; i++) {
        const url = estimation.ho_document[i];
        if (typeof url === "string" && url.startsWith("http")) {
          try {
            console.log(`Downloading file from ${url}`);
            const response = await axios.get(url, {
              responseType: 'arraybuffer'
            });
            
            // Extract filename from URL or use a default name
            const fileName = url.split('/').pop() || `document_${i + 1}.pdf`;
            
            console.log(`Adding ${fileName} to zip`);
            archive.append(response.data, { name: fileName });
          } catch (error) {
            console.error(`Error downloading file from ${url}:`, error);
            // Continue with the next file if one fails
          }
        }
      }
    }

    // Finalize the archive and send the response
    archive.finalize();

  } catch (error) {
    console.error("Error downloading estimation zip:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};