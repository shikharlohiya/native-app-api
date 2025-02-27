const BdmLeadAction = require("../../models/BdmLeadAction");
const Employee = require("../../models/employee");
const EmployeeRole = require("../../models/employeRole");
const sequelize = require("../../models/index");
const { Op, Sequelize } = require("sequelize");



// exports.getBdmPerformanceSummary = async (req, res) => {
//  try {
//   const bdmId = req.params.bdmId ? parseInt(req.params.bdmId) : null;
  
//   // Get date parameters from query or use current month as default
//   const { startDate, endDate } = req.query;
  
//   // Get the current date
//   const today = new Date();
  
//   // Use provided dates if available, otherwise default to current month
//   const parsedStartDate = startDate 
//     ? new Date(startDate) 
//     : new Date(today.getFullYear(), today.getMonth(), 1);
  
//   const parsedEndDate = endDate 
//     ? new Date(endDate) 
//     : new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
  
//   // Define our query filters
//   const whereClause = {
//     action_type: 'confirm',
//     createdAt: {
//       [Op.between]: [parsedStartDate, parsedEndDate]
//     }
//   };
  
//   // If bdmId is provided, filter by BDM
//   if (bdmId) {
//     whereClause.BDMId = bdmId;
//   }
//     // Get all BDMs - employees with RoleId 2
//     const bdms = await Employee.findAll({
//       where: {
//         EmployeeRoleID: 2 // BDM role ID is 2 as specified
//       },
//       attributes: ['EmployeeId', 'EmployeeName'],
//       include: [
//         {
//           model: EmployeeRole,
//           as: 'role',
//           attributes: ['RoleName']
//         }
//       ]
//     });
    
//     // Format the response
//     const bdmData = [];
    
//     for (const bdm of bdms) {
//       // Get action counts for this BDM
//       const actionCounts = await BdmLeadAction.findAll({
//         attributes: [
//           'specific_action', 
//           [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
//           [
//             sequelize.fn(
//               'SUM', 
//               sequelize.literal(`CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END`)
//             ), 
//             'completed'
//           ]
//         ],
//         where: {
//           ...whereClause,
//           BDMId: bdm.EmployeeId // Using EmployeeId as per your model
//         },
//         group: ['specific_action']
//       });
      
//       // Transform the counts into our desired format
//       const actions = [];
      
//       // Define the standard action types we want to include
//       const standardActions = [
//         "Meeting", 
//         "Site Visit", 
//         "On Call Discussion", 
//         "RO Visit", 
//         "Estimation"
//       ];
      
//       // Initialize with zeros
//       standardActions.forEach(action => {
//         actions.push({
//           type: action,
//           done: 0,
//           target: 0
//         });
//       });
      
//       // Fill in actual data
//       actionCounts.forEach(count => {
//         const index = actions.findIndex(a => a.type === count.specific_action);
//         if (index >= 0) {
//           actions[index].done = parseInt(count.dataValues.completed) || 0;
//           actions[index].target = parseInt(count.dataValues.total) || 0;
//         } else {
//           // Handle any action types not in our standard list
//           actions.push({
//             type: count.specific_action,
//             done: parseInt(count.dataValues.completed) || 0,
//             target: parseInt(count.dataValues.total) || 0
//           });
//         }
//       });
      
//       // Get historical performance data for the last 4 months
//       const performance = [];
      
//       for (let i = 0; i < 4; i++) {
//         const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
//         const monthStartDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
//         const monthEndDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
        
//         const monthName = monthStartDate.toLocaleString('default', { month: 'short' });
        
//         const monthlyActions = await BdmLeadAction.findAll({
//           attributes: [
//             [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
//             [
//               sequelize.fn(
//                 'SUM', 
//                 sequelize.literal(`CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END`)
//               ), 
//               'completed'
//             ]
//           ],
//           where: {
//             BDMId: bdm.EmployeeId, // Using EmployeeId as per your model
//             action_type: 'confirm',
//             createdAt: {
//               [Op.between]: [monthStartDate, monthEndDate]
//             }
//           }
//         });
        
//         if (monthlyActions && monthlyActions[0]) {
//           const total = parseInt(monthlyActions[0].dataValues.total) || 0;
//           const completed = parseInt(monthlyActions[0].dataValues.completed) || 0;
//           const value = total > 0 ? Math.round((completed / total) * 100) : 0;
          
//           performance.push({
//             month: monthName,
//             value
//           });
//         } else {
//           performance.push({
//             month: monthName,
//             value: 0
//           });
//         }
//       }
      
//       // Add to our BDM data array
//       bdmData.push({
//         id: bdm.EmployeeId, // Using EmployeeId as per your model
//         name: bdm.EmployeeName, // Using EmployeeName instead of name
//         actions,
//         performance: performance.reverse()  // Reverse to get chronological order
//       });
//     }
    
//     // Return the formatted data
//     res.status(200).json({
//       success: true,
//       data: bdmData,
//       timestamp: new Date()
//     });
    
//   } catch (error) {
//     console.error("Error in getBdmPerformanceSummary:", error);
//     res.status(500).json({
//       success: false,
//       error: "Internal server error",
//       details: error.message
//     });
//   }
// };

exports.getBdmPerformanceSummary = async (req, res) => {
 try {
   // Get BDM ID from both route parameters and query parameters
   const bdmIdFromParams = req.params.bdmId ? parseInt(req.params.bdmId) : null;
   const bdmIdFromQuery = req.query.bdmId ? parseInt(req.query.bdmId) : null;
   
   // Use the parameter from either source
   const bdmId = bdmIdFromParams || bdmIdFromQuery;
   
   // Get date parameters from query or use current month as default
   const { startDate, endDate } = req.query;
   
   // Get the current date
   const today = new Date();
   
   // // Use provided dates if available, otherwise default to current month
   // const parsedStartDate = startDate 
   //   ? new Date(startDate) 
   //   : new Date(today.getFullYear(), today.getMonth(), 1);
   
   // const parsedEndDate = endDate 
   //   ? new Date(endDate) 
   //   : new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);



   // Use provided dates if available, otherwise default to current month
const parsedStartDate = startDate 
? new Date(startDate)
: new Date(today.getFullYear(), today.getMonth(), 1);

// For end date, if it's the same as start date, set time to end of day
const parsedEndDate = endDate 
? new Date(endDate)
: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

// If the dates are the same (comparing just the date part), set end time to 23:59:59
if (parsedStartDate.getFullYear() === parsedEndDate.getFullYear() &&
  parsedStartDate.getMonth() === parsedEndDate.getMonth() &&
  parsedStartDate.getDate() === parsedEndDate.getDate()) {
// Set to end of the day
parsedEndDate.setHours(23, 59, 59, 999);
}





   
   // Define our query filters for actions
   const whereClause = {
     action_type: 'confirm',
     createdAt: {
       [Op.between]: [parsedStartDate, parsedEndDate]
     }
   };
   
   // Initialize where clause for BDMs query
   let bdmsWhereClause = {
     EmployeeRoleID: 2  // BDM role ID
   };
   
   // If bdmId is provided, filter by that specific BDM
   if (bdmId) {
     bdmsWhereClause.EmployeeId = bdmId;
   }
   
   // Get BDMs with the applied filters
   const bdms = await Employee.findAll({
     where: bdmsWhereClause,
     attributes: ['EmployeeId', 'EmployeeName'],
     include: [
       {
         model: EmployeeRole,
         as: 'role',
         attributes: ['RoleName']
       }
     ]
   });
   
   // Format the response
   const bdmData = [];
   
   for (const bdm of bdms) {
     // Get action counts for this BDM
     const actionCounts = await BdmLeadAction.findAll({
       attributes: [
         'specific_action', 
         [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
         [
           sequelize.fn(
             'SUM', 
             sequelize.literal(`CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END`)
           ), 
           'completed'
         ]
       ],
       where: {
         ...whereClause,
         BDMId: bdm.EmployeeId // Using EmployeeId as per your model
       },
       group: ['specific_action']
     });
     
     // Transform the counts into our desired format
     const actions = [];
     
     // Define the standard action types we want to include
     const standardActions = [
       "Meeting", 
       "Site Visit", 
       "On Call Discussion", 
       "RO Visit", 
       "Estimation"
     ];
     
     // Initialize with zeros
     standardActions.forEach(action => {
       actions.push({
         type: action,
         done: 0,
         target: 0
       });
     });
     
     // Fill in actual data
     actionCounts.forEach(count => {
       const index = actions.findIndex(a => a.type === count.specific_action);
       if (index >= 0) {
         actions[index].done = parseInt(count.dataValues.completed) || 0;
         actions[index].target = parseInt(count.dataValues.total) || 0;
       } else {
         // Handle any action types not in our standard list
         actions.push({
           type: count.specific_action,
           done: parseInt(count.dataValues.completed) || 0,
           target: parseInt(count.dataValues.total) || 0
         });
       }
     });
     
     // Get historical performance data for the last 4 months
     const performance = [];
     
     for (let i = 0; i < 4; i++) {
       const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
       const monthStartDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
       const monthEndDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
       
       const monthName = monthStartDate.toLocaleString('default', { month: 'short' });
       
       const monthlyActions = await BdmLeadAction.findAll({
         attributes: [
           [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
           [
             sequelize.fn(
               'SUM', 
               sequelize.literal(`CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END`)
             ), 
             'completed'
           ]
         ],
         where: {
           BDMId: bdm.EmployeeId, // Using EmployeeId as per your model
           action_type: 'confirm',
           createdAt: {
             [Op.between]: [monthStartDate, monthEndDate]
           }
         }
       });
       
       if (monthlyActions && monthlyActions[0]) {
         const total = parseInt(monthlyActions[0].dataValues.total) || 0;
         const completed = parseInt(monthlyActions[0].dataValues.completed) || 0;
         const value = total > 0 ? Math.round((completed / total) * 100) : 0;
         
         performance.push({
           month: monthName,
           value
         });
       } else {
         performance.push({
           month: monthName,
           value: 0
         });
       }
     }
     
     // Add to our BDM data array
     bdmData.push({
       id: bdm.EmployeeId, // Using EmployeeId as per your model
       name: bdm.EmployeeName, // Using EmployeeName instead of name
       actions,
       performance: performance.reverse()  // Reverse to get chronological order
     });
   }
   
   // Return the formatted data
   res.status(200).json({
     success: true,
     data: bdmData,
     timestamp: new Date()
   });
   
 } catch (error) {
   console.error("Error in getBdmPerformanceSummary:", error);
   res.status(500).json({
     success: false,
     error: "Internal server error",
     details: error.message
   });
 }
};


exports.getBdmActionDetails = async (req, res) => {
  try {
    const { bdmId } = req.query;
    const { startDate, endDate, actionType } = req.query;
    
    if (!bdmId) {
      return res.status(400).json({
        success: false,
        error: "BDM ID is required"
      });
    }
    
    // Parse dates or use defaults
    const parsedStartDate = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const parsedEndDate = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
    
    // Build the where clause
    const whereClause = {
      BDMId: bdmId,
      createdAt: {
        [Op.between]: [parsedStartDate, parsedEndDate]
      }
    };
    
    // Add action type filter if provided
    if (actionType) {
      whereClause.specific_action = actionType;
    }
    
    // Get the action details
    const actions = await BdmLeadAction.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          attributes: ['EmployeeName'], // Using EmployeeName instead of name
          as: 'bdm'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: actions,
      count: actions.length,
      filters: {
        bdmId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        actionType
      }
    });
    
  } catch (error) {
    console.error("Error in getBdmActionDetails:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};

exports.getTeamPerformanceSummary = async (req, res) => {
  try {
    // Get date range (default to current month)
    const { startDate, endDate } = req.query;
    
     // Get date range (default to current month)
    
    
     // Get the current date
     const today = new Date();
     
     // Use provided dates if available, otherwise default to current month
     const parsedStartDate = startDate 
       ? new Date(startDate) 
       : new Date(today.getFullYear(), today.getMonth(), 1);
     
     const parsedEndDate = endDate 
       ? new Date(endDate) 
       : new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
     
     // If the dates are the same (comparing just the date part), set end time to 23:59:59
     if (parsedStartDate.getFullYear() === parsedEndDate.getFullYear() &&
         parsedStartDate.getMonth() === parsedEndDate.getMonth() &&
         parsedStartDate.getDate() === parsedEndDate.getDate()) {
       // Set to end of the day
       parsedEndDate.setHours(23, 59, 59, 999);
     }
    
    // Get aggregate data for all BDMs
    const teamSummary = await BdmLeadAction.findAll({
      attributes: [
        'BDMId',
        'specific_action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [
          sequelize.fn(
            'SUM', 
            sequelize.literal(`CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END`)
          ), 
          'completed'
        ]
      ],
      where: {
        action_type: 'confirm',
        createdAt: {
          [Op.between]: [parsedStartDate, parsedEndDate]
        }
      },
      include: [
        {
          model: Employee,
          attributes: ['EmployeeName'], // Using EmployeeName instead of name
          as: 'bdm',
          where: {
            EmployeeRoleID: 2 // Only include BDMs (role ID 2)
          }
        }
      ],
      group: ['BDMId', 'specific_action', 'bdm.EmployeeId'] // Adjusted to use EmployeeId
    });
    
    // Transform data for the response
    const bdmSummaries = {};
    
    teamSummary.forEach(record => {
      const bdmId = record.BDMId;
      const bdmName = record.bdm?.EmployeeName || `BDM ${bdmId}`; // Using EmployeeName
      const actionType = record.specific_action;
      const total = parseInt(record.dataValues.total) || 0;
      const completed = parseInt(record.dataValues.completed) || 0;
      
      if (!bdmSummaries[bdmId]) {
        bdmSummaries[bdmId] = {
          id: bdmId,
          name: bdmName,
          actions: {},
          totalActions: 0,
          completedActions: 0
        };
      }
      
      bdmSummaries[bdmId].actions[actionType] = {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
      
      bdmSummaries[bdmId].totalActions += total;
      bdmSummaries[bdmId].completedActions += completed;
    });
    
    // Calculate overall completion rates
    Object.keys(bdmSummaries).forEach(bdmId => {
      const bdm = bdmSummaries[bdmId];
      bdm.completionRate = bdm.totalActions > 0 
        ? Math.round((bdm.completedActions / bdm.totalActions) * 100)
        : 0;
    });
    
    // Convert to array and sort by completion rate
    const sortedBdmSummaries = Object.values(bdmSummaries)
      .sort((a, b) => b.completionRate - a.completionRate);
    
    // Calculate team totals
    const teamTotals = {
      totalActions: 0,
      completedActions: 0,
      completionRate: 0
    };
    
    sortedBdmSummaries.forEach(bdm => {
      teamTotals.totalActions += bdm.totalActions;
      teamTotals.completedActions += bdm.completedActions;
    });
    
    teamTotals.completionRate = teamTotals.totalActions > 0
      ? Math.round((teamTotals.completedActions / teamTotals.totalActions) * 100)
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        bdms: sortedBdmSummaries,
        teamTotals,
        dateRange: {
          start: parsedStartDate,
          end: parsedEndDate
        }
      }
    });
    
  } catch (error) {
    console.error("Error in getTeamPerformanceSummary:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};

// Create a new BDM Lead Action
exports.createBdmLeadAction = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const {
      LeadId,
      BDMId,
      task_type,
      action_type,
      specific_action,
      new_follow_up_date,
      remarks,
      task_name
    } = req.body;
    
    // Validation
    if (!LeadId || !BDMId || !task_type || !action_type || !specific_action) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }
    
    // Check if the BDMId is valid and belongs to a BDM
    const bdm = await Employee.findOne({
      where: {
        EmployeeId: BDMId,
        EmployeeRoleID: 2 // Only allow BDMs (role ID 2)
      }
    });
    
    if (!bdm) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Invalid BDM ID or employee is not a BDM"
      });
    }
    
    // Create the BDM lead action
    const bdmLeadAction = await BdmLeadAction.create({
      LeadId,
      BDMId,
      task_type,
      action_type,
      specific_action,
      new_follow_up_date,
      remarks,
      task_name: task_name || specific_action,
      completion_status: null // Initially not completed
    }, { transaction: t });
    
    await t.commit();
    
    res.status(201).json({
      success: true,
      message: "BDM lead action created successfully",
      data: bdmLeadAction
    });
    
  } catch (error) {
    await t.rollback();
    console.error("Error in createBdmLeadAction:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};

// Update an existing BDM Lead Action (mark as completed)
exports.updateBdmLeadAction = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { completion_status, remarks } = req.body;
    
    const bdmLeadAction = await BdmLeadAction.findByPk(id, { transaction: t });
    
    if (!bdmLeadAction) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: "BDM lead action not found"
      });
    }
    
    // Update the action
    await bdmLeadAction.update({
      completion_status,
      remarks: remarks || bdmLeadAction.remarks
    }, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      success: true,
      message: "BDM lead action updated successfully",
      data: bdmLeadAction
    });
    
  } catch (error) {
    await t.rollback();
    console.error("Error in updateBdmLeadAction:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};