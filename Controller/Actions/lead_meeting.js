const Meeting = require("../../models/lead_meeting");
const LeadDetail = require("../../models/lead_detail");
const LeadLog = require("../../models/leads_logs");
const sequelize = require("../../models/index");
const Employee = require("../../models/employee");
const { uploadFile } = require("../../Library/awsS3");
const BdmLeadAction = require("../../models/BdmLeadAction");

exports.createMeeting = async (req, res) => {
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
      bdmLeadActionId
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
    const leadDetailInstance = await LeadDetail.findByPk(leadDetailId, {
      transaction: t,
    });
    if (!leadDetailInstance) {
      await t.rollback();
      return res.status(404).json({ error: "Lead detail not found" });
    }

    
    if (bdmLeadActionId) {
      const bdmLeadAction = await BdmLeadAction.findByPk(bdmLeadActionId, {
        transaction: t,
      });

      if (!bdmLeadAction) {
        await t.rollback();
        return res.status(400).json({ error: "BdmLeadAction ID not found" });
      }

      await bdmLeadAction.update(
        {
          completion_status: "completed"
        },
        { transaction: t }
      );
    }

    

    let imageUrls = [];
    if (req.files && req.files.images) {
      const files = req.files.images;
      for (const file of files) {
        const documentResponse = await uploadFile(file, "meeting_images");
        const imageUrl = `https://ib-paultry-image.s3.ap-south-2.amazonaws.com/${documentResponse.Key}`;
        imageUrls.push(imageUrl);
      }
    }

    // Create a new meeting
    const meeting = await Meeting.create(
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
        last_action: "Meeting By BDM",
      },
      { transaction: t }
    );

    // Create a log entry
    await LeadLog.create(
      {
        action_type: "Meeting Completed",
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

    res.status(201).json({ message: "Meeting created successfully", meeting });
  } catch (error) {
    await t.rollback();
    console.error("Error creating meeting:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

exports.getMeetingsByLeadId = async (req, res) => {
  try {
    const { leadId } = req.params;

    const meetings = await Meeting.findAll({
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
