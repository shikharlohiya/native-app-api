
const LeadLog = require("../../models/leads_logs");
const Lead_Detail = require("../../models/lead_detail");
const Employee = require("../../models/employee");

exports.getLeadLogsByLeadDetailId = async (req, res) => {
  try {
    const { leadDetailId } = req.params;

    // Validate leadDetailId
    if (!leadDetailId || isNaN(parseInt(leadDetailId))) {
      return res.status(400).json({ error: "Invalid lead detail ID" });
    }

    // Check if the lead detail exists
    const leadDetail = await Lead_Detail.findByPk(leadDetailId);
    if (!leadDetail) {
      return res.status(404).json({ error: "Lead detail not found" });
    }

    // Fetch lead logs
    const leadLogs = await LeadLog.findAll({
      where: { LeadDetailId: leadDetailId },
      include: [
        {
          model: Employee,
          as: "PerformedBy",
          attributes: ["EmployeeId", "EmployeeName"], // Add or remove attributes as needed
        },
      ],
      order: [["createdAt", "DESC"]], // Most recent logs first
    });

    res.status(200).json({
      message: "Lead logs retrieved successfully",
      leadLogs,
    });
  } catch (error) {
    console.error("Error fetching lead logs:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
