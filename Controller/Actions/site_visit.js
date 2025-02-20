const express = require("express");
const router = express.Router();
const site_visit = require("../../models/site_visit");
const Lead_Detail = require("../../models/lead_detail");
const multer = require("multer");
const path = require("path");
const { uploadFile } = require("../../Library/awsS3");
const LeadLog = require("../../models/leads_logs");
const sequelize = require("../../models/index");
const BdmLeadAction = require("../../models/BdmLeadAction");
const BdmTravelDetail = require("../../models/BdmTravelDetail");

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

// exports.createSiteMeeting = async (req, res) => {
//   const t = await sequelize.transaction();

//   try {
//     const {
//       LeadDetailId,
//       BDMId,
//       BirdsCapacity,
//       LandDimension,
//       ShedSize,
//       IsLandDirectionEastWest,
//       DirectionDeviationDegree,
//       ElectricityPower,
//       Water,
//       ApproachRoad,
//       EstimationRequirement,
//       category,
//       sub_category,
//       follow_up_date,
//       closure_month,
//       ModelType,
//       ActionType,
//       remark,
//       bdmLeadActionId
//     } = req.body;

//     // Parse the IDs to integers
//     const leadDetailId = parseInt(LeadDetailId, 10);
//     const bdmId = parseInt(BDMId, 10);

//     // Check if the IDs are valid numbers
//     if (isNaN(leadDetailId) || isNaN(bdmId)) {
//       await t.rollback();
//       return res.status(400).json({ error: "Invalid LeadDetailId or BDMId" });
//     }

//     // Find the lead detail
//     const leadDetailInstance = await Lead_Detail.findByPk(leadDetailId, {
//       transaction: t,
//     });
//     if (!leadDetailInstance) {
//       await t.rollback();
//       return res.status(404).json({ error: "Lead detail not found" });
//     }

    
//     if (bdmLeadActionId) { 
//       const bdmLeadAction = await BdmLeadAction.findByPk(bdmLeadActionId, {
//         transaction: t,
//       });

//       if (!bdmLeadAction) {
//         await t.rollback();
//         return res.status(400).json({ error: "BdmLeadAction ID not found" });
//       }

//       await bdmLeadAction.update(
//         {
//           completion_status: "completed"
//         },
//         { transaction: t }
//       );
//     }

//     let imageUrls = [];
//     if (req.files && req.files.images) {
//       const files = req.files.images;
//       for (const file of files) {
//         const documentResponse = await uploadFile(file, "site_visit_images");
//         const imageUrl = `https://ib-paultry-image.s3.ap-south-2.amazonaws.com/${documentResponse.Key}`;
//         imageUrls.push(imageUrl);
//       }
//     }

//     // Create a new site visit
//     const siteVisit = await site_visit.create(
//       {
//         LeadDetailId: leadDetailId,
//         BirdsCapacity,
//         LandDimension,
//         ShedSize,
//         IsLandDirectionEastWest,
//         DirectionDeviationDegree,
//         ElectricityPower,
//         Water,
//         ApproachRoad,
//         category,
//         sub_category,
//         follow_up_date,
//         closure_month,
//         ModelType,
//         BDMId: bdmId,
//         EstimationRequirement,
//         Image: imageUrls,
//         ActionType,
//         remark,
//       },
//       { transaction: t }
//     );

//     // Update the Lead Detail
//     await leadDetailInstance.update(
//       {
//         follow_up_date,
//         category,
//         sub_category,
//         bdm_remark: remark,
//         close_month: closure_month,
//         last_action: "Site Visit Completed",
//       },
//       { transaction: t }
//     );

//     // Create a log entry
//     await LeadLog.create(
//       {
//         action_type: "Site Visit Completed",
//         category,
//         sub_category,
//         remarks: remark,
//         performed_by: bdmId,
//         LeadDetailId: leadDetailId,
//         follow_up_date,
//       },
//       { transaction: t }
//     );

//     await t.commit();

//     res
//       .status(201)
//       .json({ message: "Site visit created successfully", siteVisit });
//   } catch (error) {
//     await t.rollback();
//     console.error("Error creating site visit:", error);
//     res
//       .status(500)
//       .json({ error: "Internal server error", details: error.message });
//   }
// };


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
      bdmLeadActionId,
      // New checkout fields
      travelDetailId,
      latitude,
      longitude
    } = req.body;

    // Validate checkout fields if provided
    if (travelDetailId) {
      if (!latitude || !longitude) {
        await t.rollback();
        return res.status(400).json({
          message: "When providing travelDetailId, latitude and longitude are required"
        });
      }

      // Find and validate travel detail
      const travelDetail = await BdmTravelDetail.findByPk(travelDetailId, {
        transaction: t
      });

      if (!travelDetail) {
        await t.rollback();
        return res.status(404).json({
          message: "Travel detail record not found"
        });
      }

      if (travelDetail.checkout_time) {
        await t.rollback();
        return res.status(400).json({
          message: "Check-out already recorded for this travel detail"
        });
      }

      // Update travel detail with checkout information
      try {
        await travelDetail.update({
          checkout_latitude: latitude,
          checkout_longitude: longitude, 
          checkout_time: new Date()
        }, { transaction: t });
      } catch (updateError) {
        await t.rollback();
        console.error("Error updating travel detail:", updateError);
        return res.status(500).json({
          message: "Error updating travel detail",
          error: updateError.message
        });
      }
    }

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

    // Handle BdmLeadAction if provided
    if (bdmLeadActionId) {
      const bdmLeadAction = await BdmLeadAction.findByPk(bdmLeadActionId, {
        transaction: t,
      });

      if (!bdmLeadAction) {
        await t.rollback();
        return res.status(400).json({ error: "BdmLeadAction ID not found" });
      }

      try {
        await bdmLeadAction.update(
          {
            completion_status: "completed"
          },
          { transaction: t }
        );
      } catch (updateError) {
        await t.rollback();
        console.error("Error updating BdmLeadAction:", updateError);
        return res.status(500).json({
          message: "Error updating BdmLeadAction",
          error: updateError.message
        });
      }
    }

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.images) {
      try {
        const files = req.files.images;
        for (const file of files) {
          const documentResponse = await uploadFile(file, "site_visit_images");
          const imageUrl = `https://ib-paultry-image.s3.ap-south-2.amazonaws.com/${documentResponse.Key}`;
          imageUrls.push(imageUrl);
        }
      } catch (uploadError) {
        await t.rollback();
        console.error("Error uploading images:", uploadError);
        return res.status(500).json({
          message: "Error uploading images",
          error: uploadError.message
        });
      }
    }

    // Create site visit
    let siteVisit;
    try {
      siteVisit = await site_visit.create(
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
    } catch (createError) {
      await t.rollback();
      console.error("Error creating site visit:", createError);
      return res.status(500).json({
        message: "Error creating site visit",
        error: createError.message
      });
    }

    // Update lead detail
    try {
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
    } catch (updateError) {
      await t.rollback();
      console.error("Error updating lead detail:", updateError);
      return res.status(500).json({
        message: "Error updating lead detail",
        error: updateError.message
      });
    }

    // Create log entry
    try {
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
    } catch (logError) {
      await t.rollback();
      console.error("Error creating log entry:", logError);
      return res.status(500).json({
        message: "Error creating log entry",
        error: logError.message
      });
    }

    // If everything succeeded, commit the transaction
    await t.commit();

    res.status(201).json({
      message: "Site visit created successfully",
      siteVisit,
      checkout: travelDetailId ? {
        message: "Check-out recorded successfully"
      } : null
    });

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
