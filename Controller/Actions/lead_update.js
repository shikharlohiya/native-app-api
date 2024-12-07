const Lead_Detail = require("../../models/lead_detail");
const Employee = require("../../models/employee");
const LeadUpdate = require("../../models/lead_update");
const FollowUPByAgent = require("../../models/FollowUpByAgent");
const callOnDiscussion = require("../../models/OnCallDiscussionByBdm");

exports.createLeadUpdate = async (req, res) => {
  try {
    const {
      leadDetailId,
      bdmId,
      follow_up_date,
      category,
      sub_category,
      remark,
      closure_month,
    } = req.body;

    const leadDetail = await Lead_Detail.findByPk(leadDetailId);

    const bdm = await Employee.findByPk(bdmId);

    if (!leadDetail || !bdm) {
      return res
        .status(404)
        .json({ error: "Lead detail or employee not found" });
    }

    const leadUpdate = await LeadUpdate.create({
      follow_up_date,
      category,
      sub_category,
      remark,
      LeadDetailId: leadDetail.id,

      BDMId: bdm ? bdm.EmployeeId : null,
      closure_month,
    });

    res
      .status(201)
      .json({ message: "Lead update created successfully", leadUpdate });
  } catch (error) {
    console.error("Error creating lead update:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getLeadUpdatesByLeadId = async (req, res) => {
  try {
    const { leadId } = req.params;

    // Find the lead detail
    const leadDetail = await Lead_Detail.findByPk(leadId);

    // Check if the lead detail exists
    if (!leadDetail) {
      return res.status(404).json({ error: "Lead detail not found" });
    }

    const leadUpdates = await FollowUPByAgent.findAll({
      where: {
        LeadDetailId: leadDetail.id,
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Employee,
          as: "AgentName",
          attributes: ["EmployeeId", "EmployeeName"],
        },
        // {
        //   model: Employee,
        //   as: 'BDM',
        //   attributes: ['EmployeeId', 'EmployeeName'],
        // },
      ],
    });
    res.status(200).json({ leadUpdates });
  } catch (error) {
    console.error("Error retrieving lead updates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCallOnDiscussionByLeadId = async (req, res) => {
  try {
    const { leadId } = req.params;

    // Find the lead detail
    const leadDetail = await Lead_Detail.findByPk(leadId);

    // Check if the lead detail exists
    if (!leadDetail) {
      return res.status(404).json({ error: "Lead detail not found" });
    }

    const leadUpdates = await callOnDiscussion.findAll({
      where: {
        LeadDetailId: leadDetail.id,
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Employee,
          as: "BDM",
          attributes: ["EmployeeId", "EmployeeName"],
        },
      ],
    });
    res.status(200).json({ leadUpdates });
  } catch (error) {
    console.error("Error retrieving lead updates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
