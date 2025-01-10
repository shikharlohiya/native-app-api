
const LeadLog = require("../../models/leads_logs");
const Lead_Detail = require("../../models/lead_detail");
const Employee = require("../../models/employee");



//changes on 8 jan




// exports.getLeadLogsByLeadDetailId = async (req, res) => {
//   try {
//     const { leadDetailId } = req.params;

//     // Validate leadDetailId
//     if (!leadDetailId || isNaN(parseInt(leadDetailId))) {
//       return res.status(400).json({ error: "Invalid lead detail ID" });
//     }

//     // Check if the lead detail exists
//     const leadDetail = await Lead_Detail.findByPk(leadDetailId);
//     if (!leadDetail) {
//       return res.status(404).json({ error: "Lead detail not found" });
//     }

//     // Fetch lead logs
//     const leadLogs = await LeadLog.findAll({
//       where: { LeadDetailId: leadDetailId },
//       include: [
//         {
//           model: Employee,
//           as: "PerformedBy",
//           attributes: ["EmployeeId", "EmployeeName"], // Add or remove attributes as needed
//         },
//       ],
//       order: [["createdAt", "DESC"]], // Most recent logs first
//     });

//     res.status(200).json({
//       message: "Lead logs retrieved successfully",
//       leadLogs,
//     });
//   } catch (error) {
//     console.error("Error fetching lead logs:", error);
//     res
//       .status(500)
//       .json({ error: "Internal server error", details: error.message });
//   }
// };




// const formatFieldName = (field) => {
//   const fieldMappings = {
//     'category': 'Category',
//     'sub_category': 'Sub Category',
//     'agent_remark': 'Agent Remark',
//     'lead_owner': 'Lead Owner',
//     'remarks': 'Remarks',
//     'status': 'Status',
//     'follow_up_date': 'Follow Up Date',
//     'bdm_remark': 'BDM Remark'
//   };
//   return fieldMappings[field] || field;
// };

// // Helper function to generate a human-readable summary of changes
// const generateChangeSummary = (changes) => {
//   const summaries = changes.map(change => {
//     if (!change.previousValue && change.newValue) {
//       return `Added ${change.field}: ${change.newValue}`;
//     } else if (change.previousValue && !change.newValue) {
//       return `Removed ${change.field}`;
//     } else if (change.previousValue && change.newValue) {
//       return `Changed ${change.field} from "${change.previousValue}" to "${change.newValue}"`;
//     }
//     return null;
//   }).filter(Boolean);

//   return summaries.join('. ');
// };

// exports.getLeadLogsByLeadDetailId = async (req, res) => {
//   try {
//     const { leadDetailId } = req.params;

//     // Validate leadDetailId
//     if (!leadDetailId || isNaN(parseInt(leadDetailId))) {
//       return res.status(400).json({ 
//         success: false, 
//         error: "Invalid lead detail ID" 
//       });
//     }

//     // Check if the lead detail exists
//     const leadDetail = await Lead_Detail.findByPk(leadDetailId);
//     if (!leadDetail) {
//       return res.status(404).json({ 
//         success: false,
//         error: "Lead detail not found" 
//       });
//     }

//     // Fetch lead logs
//     const leadLogs = await LeadLog.findAll({
//       where: { LeadDetailId: leadDetailId },
//       include: [
//         {
//           model: Employee,
//           as: "PerformedBy",
//           attributes: ["EmployeeId", "EmployeeName"],
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//     });

//     // Format the lead logs
//     const formattedLogs = leadLogs.map(log => {
//       const logData = log.toJSON();
      
//       // Try to parse the extra_fields3 if it exists
//       if (logData.extra_fields3) {
//         try {
//           const parsedData = JSON.parse(logData.extra_fields3);
          
//           // Format the changes to be more readable
//           const formattedChanges = parsedData.changes.map(change => ({
//             field: formatFieldName(change.field),
//             previousValue: change.from || null,
//             newValue: change.to || null,
//             changed: change.from !== change.to
//           }));

//           // Create a formatted version of extra_fields3
//           const formattedExtraFields3 = {
//             timestamp: new Date(parsedData.timestamp).toISOString(),
//             updatedBy: {
//               employeeId: parsedData.updater?.id || logData.PerformedBy?.EmployeeId,
//               employeeName: logData.PerformedBy?.EmployeeName || 'Unknown'
//             },
//             changes: formattedChanges,
//             summary: generateChangeSummary(formattedChanges)
//           };

//           return {
//             id: logData.id,
//             leadDetailId: logData.LeadDetailId,
//             performedBy: logData.PerformedBy,
//             createdAt: logData.createdAt,
//             updatedAt: logData.updatedAt,
//             formattedChanges: formattedExtraFields3,
//             raw_extra_fields3: logData.extra_fields3 // Keep original data if needed
//           };
//         } catch (error) {
//           console.error('Error parsing extra_fields3:', error);
//           return {
//             ...logData,
//             formattedChanges: {
//               error: 'Could not parse change data',
//               raw_extra_fields3: logData.extra_fields3
//             }
//           };
//         }
//       }
//       return logData;
//     });

//     res.status(200).json({
//       success: true,
//       message: "Lead logs retrieved successfully",
//       data: {
//         leadDetailId,
//         totalLogs: formattedLogs.length,
//         leadLogs: formattedLogs
//       }
//     });

//   } catch (error) {
//     console.error("Error fetching lead logs:", error);
//     res.status(500).json({ 
//       success: false,
//       error: "Internal server error", 
//       message: error.message 
//     });
//   }
// }; 

// Helper function to format field names
const formatFieldName = (field) => {
  const fieldMappings = {
    'category': 'Category',
    'sub_category': 'Sub Category',
    'agent_remark': 'Agent Remark',
    'lead_owner': 'Lead Owner',
    'remarks': 'Remarks',
    'status': 'Status',
    'follow_up_date': 'Follow Up Date',
    'bdm_remark': 'BDM Remark'
  };
  return fieldMappings[field] || field;
};

// Helper function to generate a human-readable summary of changes
const generateChangeSummary = (changes) => {
  const summaries = changes.map(change => {
    if (!change.from && change.to) {
      return `Added ${formatFieldName(change.field)}: ${change.to}`;
    } else if (change.from && !change.to) {
      return `Removed ${formatFieldName(change.field)}`;
    } else if (change.from && change.to) {
      return `Changed ${formatFieldName(change.field)} from "${change.from}" to "${change.to}"`;
    }
    return null;
  }).filter(Boolean);

  return summaries.join('. ');
};

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
          attributes: ["EmployeeId", "EmployeeName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Format the lead logs
    const formattedLogs = leadLogs.map(log => {
      const logData = log.toJSON();
      
      // Try to parse the extra_fields3 if it exists
      if (logData.extra_fields3) {
        try {
          const parsedData = JSON.parse(logData.extra_fields3);
          
          // Add formatted fields to the parsed data
          parsedData.formattedChanges = parsedData.changes.map(change => ({
            field: formatFieldName(change.field),
            from: change.from,
            to: change.to
          }));
          
          parsedData.changeSummary = generateChangeSummary(parsedData.changes);
          
          // Update the extra_fields3 with formatted data
          logData.extra_fields3 = parsedData;
        } catch (error) {
          console.error('Error parsing extra_fields3:', error);
        }
      }
      return logData;
    });

    res.status(200).json({
      message: "Lead logs retrieved successfully",
      leadLogs: formattedLogs
    });

  } catch (error) {
    console.error("Error fetching lead logs:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error.message 
    });
  }
};