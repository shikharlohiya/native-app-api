const Lead_Detail = require("../../models/lead_detail");
const Employee = require("../../models/employee");
const OnCallDiscussionByBdm = require("../../models/OnCallDiscussionByBdm");
const LeadLog = require("../../models/leads_logs");
const sequelize = require("../../models/index");

exports.createOnCallDiscussionByBdm = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      LeadDetailId,
      BDMId,
      follow_up_date,
      category,
      sub_category,
      remark,
      closure_month,
      extra_field1,
      extra_field2,
      extra_field3,
    } = req.body;

    // Parse the IDs to integers
    const leadDetailId = parseInt(LeadDetailId, 10);
    const bdmId = parseInt(BDMId, 10);

    // Check if the IDs are valid numbers
    if (isNaN(leadDetailId) || isNaN(bdmId)) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid LeadDetailId or BDMId" });
    }

    const leadDetail = await Lead_Detail.findByPk(leadDetailId, {
      transaction: t,
    });
    const bdm = await Employee.findByPk(bdmId, { transaction: t });

    if (!leadDetail) {
      await t.rollback();
      return res.status(400).json({ error: "Lead is not found" });
    }
    if (!bdm) {
      await t.rollback();
      return res.status(400).json({ error: "BDM is not found" });
    }

    // Create the on-call discussion entry
    const onCallDiscussion = await OnCallDiscussionByBdm.create(
      {
        follow_up_date,
        category,
        sub_category,
        remark,
        closure_month,
        extra_field1,
        extra_field2,
        extra_field3,
        BDMId: bdmId,
        LeadDetailId: leadDetailId,
      },
      { transaction: t }
    );

    // Update the Lead_Detail
    await leadDetail.update(
      {
        follow_up_date,
        category,
        sub_category,
        bdm_remark: remark,
        close_month: closure_month,
        last_action: "On Call Discussion By BDM",
      },
      { transaction: t }
    );

    // Create a log entry
    await LeadLog.create(
      {
        action_type: "On Call Discussion By BDM",
        category,
        sub_category,
        remarks: remark,
        performed_by: bdmId,
        LeadDetailId: leadDetailId,
        follow_up_date,
      },
      { transaction: t }
    );

    // If we reach here, no errors were thrown, so we commit the transaction
    await t.commit();

    res.status(201).json({
      message:
        "On-call discussion data has been successfully saved, lead detail updated, and action logged",
      onCallDiscussion,
      updatedLeadDetail: leadDetail,
    });
  } catch (error) {
    // If we catch any error, we rollback the transaction
    await t.rollback();
    console.error("Error in createOnCallDiscussionByBdm:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
