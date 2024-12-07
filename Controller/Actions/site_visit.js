const express = require("express");
const router = express.Router();
const site_visit = require("../../models/site_visit");
const Lead_Detail = require("../../models/lead_detail");
const multer = require("multer");
const path = require("path");
const { uploadFile } = require("../../Library/awsS3");
const LeadLog = require("../../models/leads_logs");
const sequelize = require("../../models/index");

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Specify the folder where images will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique filename
  },
});
const upload = multer({ storage: storage });

exports.createSiteMeeting = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      LeadDetailId,
      BDMId,
      BirdsCapacity,
      LandDimension,
      ShedSize,
      IsLandDirectionEastWest,
      DirectionDeviationDegree,
      ElectricityPower,
      Water,
      ApproachRoad,
      EstimationRequirement,
      category,
      sub_category,
      follow_up_date,
      closure_month,
      ModelType,
      ActionType,
      remark,
    } = req.body;

    // Parse the IDs to integers
    const leadDetailId = parseInt(LeadDetailId, 10);
    const bdmId = parseInt(BDMId, 10);

    // Check if the IDs are valid numbers
    if (isNaN(leadDetailId) || isNaN(bdmId)) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid LeadDetailId or BDMId" });
    }

    // Find the lead detail
    const leadDetailInstance = await Lead_Detail.findByPk(leadDetailId, {
      transaction: t,
    });
    if (!leadDetailInstance) {
      await t.rollback();
      return res.status(404).json({ error: "Lead detail not found" });
    }

    let imageUrls = [];
    if (req.files && req.files.images) {
      const files = req.files.images;
      for (const file of files) {
        const documentResponse = await uploadFile(file, "site_visit_images");
        const imageUrl = `https://ib-paultry-image.s3.ap-south-2.amazonaws.com/${documentResponse.Key}`;
        imageUrls.push(imageUrl);
      }
    }

    // Create a new site visit
    const siteVisit = await site_visit.create(
      {
        LeadDetailId: leadDetailId,
        BirdsCapacity,
        LandDimension,
        ShedSize,
        IsLandDirectionEastWest,
        DirectionDeviationDegree,
        ElectricityPower,
        Water,
        ApproachRoad,
        category,
        sub_category,
        follow_up_date,
        closure_month,
        ModelType,
        BDMId: bdmId,
        EstimationRequirement,
        Image: imageUrls,
        ActionType,
        remark,
      },
      { transaction: t }
    );

    // Update the Lead Detail
    await leadDetailInstance.update(
      {
        follow_up_date,
        category,
        sub_category,
        bdm_remark: remark,
        close_month: closure_month,
        last_action: "Site Visit Completed",
      },
      { transaction: t }
    );

    // Create a log entry
    await LeadLog.create(
      {
        action_type: "Site Visit Completed",
        category,
        sub_category,
        remarks: remark,
        performed_by: bdmId,
        LeadDetailId: leadDetailId,
        follow_up_date,
      },
      { transaction: t }
    );

    await t.commit();

    res
      .status(201)
      .json({ message: "Site visit created successfully", siteVisit });
  } catch (error) {
    await t.rollback();
    console.error("Error creating site visit:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

exports.getSiteVisitByLeadId = async (req, res) => {
  try {
    const { leadId } = req.params;

    const meetings = await site_visit.findAll({
      where: {
        LeadDetailId: leadId,
      },
    });

    res.status(200).json(meetings);
  } catch (error) {
    console.error("Error retrieving meetings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
