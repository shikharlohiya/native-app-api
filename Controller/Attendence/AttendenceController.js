// controllers/bdmActionController.js
const { QueryTypes, Op, Sequelize } = require("sequelize");
const sequelize = require("../../models/index");
const BdmLeadAction = require("../../models/BdmLeadAction");
const Lead_Detail = require("../../models/lead_detail");
const Attendance = require("../../models/Attendence");
const cron = require('node-cron');
const OnCallDiscussionByBdm = require('../../models/OnCallDiscussionByBdm');
// const { Employee, BdmLeadAction, Lead_Detail, sequelize } = require('../models');
// const { QueryTypes } = require('sequelize');
const Employee = require('../../models/employee');
const Estimation = require('../../models/estimation'); // Import the Estimation model
const Meeting = require('../../models/lead_meeting'); // Import the Meeting model
const SiteVisit = require('../../models/site_visit'); // Import the SiteVisit model
const BdmTravelDetail = require("../../models/BdmTravelDetail");
const { default: axios } = require("axios");




// exports.executeCronJob = async () => {
//   const transaction = await sequelize.transaction();

//   try {
//     // Get today's date
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Find all bdm_lead_actions with action_type 'confirm' and action_date today
//     const bdmLeadActions = await BdmLeadAction.findAll({
//       where: {
//         action_type: 'confirm',
//         action_date: {
//           [Op.gte]: today,
//           [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
//         },
//       },
//       transaction,
//     });

//     // Process each bdm_lead_action
//     for (const bdmLeadAction of bdmLeadActions) {
//       if (bdmLeadAction.specific_action === 'On Call Discussion') {
//         // Check if an entry exists in on_call_disscusion_by_bdm table
//         const onCallDiscussion = await OnCallDiscussionByBdm.findOne({
//           where: {
//             BDMId: bdmLeadAction.BDMId,
//             LeadDetailId: bdmLeadAction.LeadId,
//           },
//           transaction,
//         });

//         if (onCallDiscussion) {
//           // Update completion_status to 'completed'
//           await bdmLeadAction.update(
//             { completion_status: 'completed' },
//             { transaction }
//           );
//         } else {
//           // Update completion_status to 'not_completed'
//           await bdmLeadAction.update(
//             { completion_status: 'not_completed' },
//             { transaction }
//           );
//         }
//       }
//     }

//     await transaction.commit();
//     console.log('Cron job executed successfully');
//   } catch (error) {
//     await transaction.rollback();
//     console.error('Error executing cron job:', error);
//   }
// };

// // Schedule the cron job to run every day at 10 PM
// cron.schedule('0 22 * * *', exports.executeCronJob);



//
exports.executeCronJob = async () => {
  const transaction = await sequelize.transaction();

  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all bdm_lead_actions with action_type 'confirm' and action_date today
    const bdmLeadActions = await BdmLeadAction.findAll({
      where: {
        action_type: 'confirm',
        action_date: {
          [Op.gte]: today,
          [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      transaction,
    });

    // Process each bdm_lead_action
    for (const bdmLeadAction of bdmLeadActions) {
      const { specific_action, BDMId, LeadId } = bdmLeadAction;

      if (specific_action === 'On Call Discussion') {
        // Check if an entry exists in on_call_disscusion_by_bdm table
        const onCallDiscussion = await OnCallDiscussionByBdm.findOne({
          where: { BDMId, LeadDetailId: LeadId },
          transaction,
        });

        // Update completion_status based on the existence of the entry
        const completionStatus = onCallDiscussion ? 'completed' : 'not_completed';
        await bdmLeadAction.update({ completion_status: completionStatus }, { transaction });

      } else if (specific_action === 'Estimation Request') {
        // Check if an entry exists in the estimation table
        const estimation = await Estimation.findOne({
          where: { Bdm_id: BDMId, LeadDetailId: LeadId },
          transaction,
        });

        // Update completion_status based on the existence of the entry
        const completionStatus = estimation ? 'completed' : 'not_completed';
        await bdmLeadAction.update({ completion_status: completionStatus }, { transaction });

      } else if (
        specific_action === 'Meeting'
       
      ) {
        // Check if an entry exists in the meeting table
        const meeting = await Meeting.findOne({
          where: { BDMId, LeadDetailId: LeadId },
          transaction,
        });

        // Update completion_status based on the existence of the entry
        const completionStatus = meeting ? 'completed' : 'not_completed';
        await bdmLeadAction.update({ completion_status: completionStatus }, { transaction });

      } else if (specific_action === 'Site Visit') {
        // Check if an entry exists in the site visit table
        const siteVisit = await SiteVisit.findOne({
          where: { BDMId, LeadDetailId: LeadId },
          transaction,
        });

        // Update completion_status based on the existence of the entry
        const completionStatus = siteVisit ? 'completed' : 'not_completed';
        await bdmLeadAction.update({ completion_status: completionStatus }, { transaction });
      }
    }

    await transaction.commit();
    console.log('Cron job executed successfully');
  } catch (error) {
    await transaction.rollback();
    console.error('Error executing cron job:', error);
  }
};

// Schedule the cron job to run every day at 10 PM
cron.schedule('57 23 * * *', exports.executeCronJob);
 

exports.updateAllCompletionStatuses = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Find all bdm_lead_actions with action_type 'confirm'
    const bdmLeadActions = await BdmLeadAction.findAll({
      where: {
        action_type: 'confirm',
      },
      transaction,
    });

    // Process each bdm_lead_action
    for (const bdmLeadAction of bdmLeadActions) {
      const { specific_action, BDMId, LeadId } = bdmLeadAction;

      if (specific_action === 'On Call Discussion') {
        // Check if an entry exists in on_call_disscusion_by_bdm table
        const onCallDiscussion = await OnCallDiscussionByBdm.findOne({
          where: { BDMId, LeadDetailId: LeadId },
          transaction,
        });

        // Update completion_status based on the existence of the entry
        const completionStatus = onCallDiscussion ? 'completed' : 'not_completed';
        await bdmLeadAction.update({ completion_status: completionStatus }, { transaction });

      } else if (specific_action === 'Estimation Request') {
        // Check if an entry exists in the estimation table
        const estimation = await Estimation.findOne({
          where: { Bdm_id: BDMId, LeadDetailId: LeadId },
          transaction,
        });

        // Update completion_status based on the existence of the entry
        const completionStatus = estimation ? 'completed' : 'not_completed';
        await bdmLeadAction.update({ completion_status: completionStatus }, { transaction });

      } else if (
        specific_action === 'Conversion Follow up & Meeting' ||
        specific_action === 'Individual Meeting' ||
        specific_action === 'Group Meeting'
      ) {
        // Check if an entry exists in the meeting table
        const meeting = await Meeting.findOne({
          where: { BDMId, LeadDetailId: LeadId },
          transaction,
        });

        // Update completion_status based on the existence of the entry
        const completionStatus = meeting ? 'completed' : 'not_completed';
        await bdmLeadAction.update({ completion_status: completionStatus }, { transaction });

      } else if (specific_action === 'Site Visit') {
        // Check if an entry exists in the site visit table
        const siteVisit = await SiteVisit.findOne({
          where: { BDMId, LeadDetailId: LeadId },
          transaction,
        });

        // Update completion_status based on the existence of the entry
        const completionStatus = siteVisit ? 'completed' : 'not_completed';
        await bdmLeadAction.update({ completion_status: completionStatus }, { transaction });
      }
    }

    await transaction.commit();
    res.status(200).json({ message: 'All completion statuses updated successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating completion statuses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



exports.handleBatchLeadActions = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      bdmId,
      HO_task,
      self_task,
      other_task,
      attendanceType,
      latitude,
      longitude,
    } = req.body;

    if (!bdmId || !attendanceType || !latitude || !longitude) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const processActions = async (tasks, taskType) => {
      return Promise.all(
        tasks.map(async (task) => {
          if (taskType === "other_task") {
            // Handle other_task
            return BdmLeadAction.create(
              {
                BDMId: bdmId,
                task_type: "other_task",
                task_name: task.task_name,
                remarks: task.remarks,
              },
              { transaction }
            );
          } else {
            // Handle HO_task and self_task
            const {
              id,
              action_type,
              specific_action,
              new_follow_up_date,
              remarks,
            } = task;

            const bdmAction = await BdmLeadAction.create(
              {
                LeadId: id,
                BDMId: bdmId,
                task_type: taskType,
                action_type,
                specific_action:
                  action_type === "confirm" ? specific_action : null,
                new_follow_up_date:
                  action_type === "postpone" ? new_follow_up_date : null,
                remarks,
              },
              { transaction }
            );

            // Update Lead_Detail

            // const lead = await Lead_Detail.findByPk(id, { transaction });
            // if (!lead) {
            //   throw new Error(`Lead with id ${id} not found`);
            // }

            // if (action_type === "confirm") {
            //   lead.last_action = specific_action;
            // } else if (action_type === "postpone") {
            //   lead.follow_up_date = new Date(new_follow_up_date);
            //   lead.bdm_remark = remarks || lead.bdm_remark;
            // }

            // await lead.save({ transaction });

            // return bdmAction;
          }
        })
      );
    };

    const processedHOTasks = HO_task
      ? await processActions(HO_task, "HO_task")
      : [];
    const processedSelfTasks = self_task
      ? await processActions(self_task, "self_task")
      : [];
    const processedOtherTasks = other_task
      ? await processActions(other_task, "other_task")
      : [];
      const currentDateTime = new Date();
    // Create an Attendance record with location
    const attendance = await Attendance.create(
      {
        EmployeeId: bdmId,
        AttendanceType: attendanceType,
        Latitude: latitude,
        Longitude: longitude,
        AttendanceInTime: currentDateTime,
        AttendanceDate: currentDateTime
      },
      { transaction }
    );
    
    await BdmTravelDetail.create(
      {
        bdm_id: bdmId,
        attendance_id: attendance.id,
        action: "Attendance In",
        checkin_latitude: latitude,
        checkin_longitude: longitude,
        checkin_time: new Date(),
      },
      { transaction }
    );



    await transaction.commit();

    res.status(200).json({
      message:
        "Batch lead actions processed and attendance marked successfully",
      HO_task: processedHOTasks,
      self_task: processedSelfTasks,
      other_task: processedOtherTasks,
      attendance,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error processing batch lead actions and attendance:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};






// for checkout api
exports.handleBdmCheckout = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { bdmId, completedTasks, attendanceType, latitude, longitude } =
      req.body;

    if (
      !bdmId ||
      !completedTasks ||
      !Array.isArray(completedTasks) ||
      !attendanceType ||
      !latitude ||
      !longitude
    ) {
      return res.status(400).json({ message: "Invalid input data" });
    }
x``
    // Update completion status for completed tasks
    await Promise.all(
      completedTasks.map(async (taskId) => {
        await BdmLeadAction.update(
          { completion_status: "completed" },
          {
            where: {
              id: taskId,
              BDMId: bdmId,
              task_type: "HO_task",
              action_type: "confirm",
              completion_status: null,
            },
            transaction,
          }
        );
      })
    );

    // Fetch all confirmed HO_tasks for the BDM from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const confirmedTasks = await BdmLeadAction.findAll({
      where: {
        BDMId: bdmId,
        task_type: "HO_task",
        action_type: "confirm",
        action_date: {
          [Op.gte]: today,
        },
      },
      transaction,
    });

    // Mark remaining tasks as not completed
    await Promise.all(
      confirmedTasks.map(async (task) => {
        if (!completedTasks.includes(task.id)) {
          await task.update(
            { completion_status: "not_completed" },
            { transaction }
          );
        }
      })
    );

    // Create an Attendance record for checkout with location
    const attendance = await Attendance.create(
      {
        EmployeeId: bdmId,
        AttendanceType: attendanceType,
        Latitude: latitude,
        Longitude: longitude,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      message: "Checkout processed successfully",
      completedTasks: completedTasks.length,
      notCompletedTasks: confirmedTasks.length - completedTasks.length,
      attendance,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error processing BDM checkout:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};



//checkd lead id and bdm id 
//check action_type is confirm and date is of today
//if specific action is
// On Call Discussion

//go to call on discussion table and if there is a entry of bdm with lead id then update table bdm_lead_action column completion_status marks as completed if entry not found then mark as not completed but this will updaily daily 10PM only if bdm confirm the task today  




 // Estimation
 // Meeting
 // Site Visit

//go to Estimation table and if there is a entry of bdm with lead id then update table bdm_lead_action column completion_status marks as completed if entry not found then mark as not completed 


 //new actions
 //On Call Discussion
 //Site Visit
 // Meeting
 //Estimation


 // Estimation Request
 //Conversion Follow up & Meeting
 //Individual Meeting
 //Group Meeting
 //Site Visit


 // Schedule the cron job to run every day at 10 PM
// cron.schedule('0 22 * * *', async () => {
//   try {
//     // Get today's date
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Find all bdm_lead_actions with action_type 'confirm' and action_date today
//     const bdmLeadActions = await BdmLeadAction.findAll({
//       where: {
//         action_type: 'confirm',
//         action_date: {
//           [sequelize.Op.gte]: today,
//           [sequelize.Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
//         },
//       },
//     });

//     // Process each bdm_lead_action
//     for (const bdmLeadAction of bdmLeadActions) {
//       if (bdmLeadAction.specific_action === 'On Call Discussion') {
//         // Check if an entry exists in on_call_disscusion_by_bdm table
//         const onCallDiscussion = await OnCallDiscussionByBdm.findOne({
//           where: {
//             BDMId: bdmLeadAction.BDMId,
//             LeadDetailId: bdmLeadAction.LeadId,
//           },
//         });

//         if (onCallDiscussion) {
//           // Update completion_status to 'completed'
//           await bdmLeadAction.update({ completion_status: 'completed' });
//         } else {
//           // Update completion_status to 'not_completed'
//           await bdmLeadAction.update({ completion_status: 'not_completed' });
//         }
//       }
//     }

//     console.log('Cron job executed successfully');
//   } catch (error) {
//     console.error('Error executing cron job:', error);
//   }
// });






// exports.getAllBdmStats = async (req, res) => {
//   const transaction = await sequelize.transaction();

//   try {
//       // Get all BDMs (employees with RoleID = 2)
//       const bdms = await Employee.findAll({
//           where: {
//               EmployeeRoleID: 2
//           },
//           attributes: ['EmployeeId', 'EmployeeName'],
//           transaction
//       });

//       const bdmStats = await Promise.all(bdms.map(async (bdm) => {
//           // Get action type counts
//           const actionCounts = await BdmLeadAction.findAll({
//               where: { BDMId: bdm.EmployeeId },
//               attributes: [
//                   [sequelize.fn('COUNT', sequelize.literal('CASE WHEN action_type = "confirm" THEN 1 END')), 'confirm_count'],
//                   [sequelize.fn('COUNT', sequelize.literal('CASE WHEN action_type = "postpone" THEN 1 END')), 'postpone_count'],
//                   [sequelize.fn('COUNT', sequelize.literal('CASE WHEN completion_status = "completed" THEN 1 END')), 'completed_count'],
//                   [sequelize.fn('COUNT', sequelize.literal('CASE WHEN completion_status = "not_completed" THEN 1 END')), 'not_completed_count']
//               ],
//               transaction,
//               raw: true
//           });

//           // Get detailed lead actions
//           const leadActions = await BdmLeadAction.findAll({
//               where: { BDMId: bdm.EmployeeId },
//               include: [{
//                   model: Lead_Detail,
//                   as: 'Lead',
//                   attributes: ['CustomerName', 'MobileNo'],
//               }],
//               attributes: [
//                   'id',
//                   'task_type',
//                   'action_type',
//                   'specific_action',
//                   'remarks',
//                   'action_date',
//                   'task_name',
//                   'completion_status',
//                   'createdAt',
//                   'updatedAt'
//               ],
//               order: [['createdAt', 'DESC']],
//               transaction
//           });

//           return {
//               bdm_id: bdm.EmployeeId,
//               bdm_name: bdm.EmployeeName,
//               statistics: {
//                   confirm_count: actionCounts[0].confirm_count,
//                   postpone_count: actionCounts[0].postpone_count,
//                   completed_count: actionCounts[0].completed_count,
//                   not_completed_count: actionCounts[0].not_completed_count,
//               },
//               lead_actions: leadActions.map(action => ({
//                   id: action.id,
//                   customer_name: action.Lead?.CustomerName,
//                   mobile_no: action.Lead?.MobileNo,
//                   task_type: action.task_type,
//                   action_type: action.action_type,
//                   specific_action: action.specific_action,
//                   remarks: action.remarks,
//                   action_date: action.action_date,
//                   task_name: action.task_name,
//                   completion_status: action.completion_status,
//                   created_at: action.createdAt,
//                   updated_at: action.updatedAt
//               }))
//           };
//       }));

//       await transaction.commit();

//       res.json({
//           success: true,
//           data: bdmStats
//       });

//   } catch (error) {
//       await transaction.rollback();
//       console.error('Error fetching BDM statistics:', error);
//       res.status(500).json({
//           success: false,
//           error: error.message
//       });
//   }
// };






// exports.getAllBdmStats = async (req, res) => {
//   const transaction = await sequelize.transaction();

//   try {
//       const { startDate, endDate } = req.query;
//       let dateFilter = {};

//       // If date range is provided, create date filter
//       if (startDate && endDate) {
//           const start = new Date(startDate);
//           const end = new Date(endDate);
          
//           if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//               await transaction.rollback();
//               return res.status(400).json({
//                   success: false,
//                   error: 'Invalid date format'
//               });
//           }

//           start.setHours(0, 0, 0, 0);
//           end.setHours(23, 59, 59, 999);

//           dateFilter = {
//               action_date: {
//                   [Op.between]: [start, end]
//               }
//           };
//       }

//       // Get all BDMs
//       const bdms = await Employee.findAll({
//           where: {
//               EmployeeRoleID: 2
//           },
//           attributes: ['EmployeeId', 'EmployeeName'],
//           transaction
//       });

//       const bdmStats = await Promise.all(bdms.map(async (bdm) => {
//           // Get all lead actions for this BDM
//           const leadActions = await BdmLeadAction.findAll({
//               where: {
//                   BDMId: bdm.EmployeeId,
//                   ...dateFilter
//               },
//               include: [{
//                   model: Lead_Detail,
//                   as: 'Lead',
//                   attributes: [
//                       'CustomerName',
//                       'MobileNo',
//                       'CustomerMailId',
//                       'location',
//                       'Project'
//                   ],
//               }],
//               attributes: [
//                   'id',
//                   'task_type',
//                   'action_type',
//                   'specific_action',
//                   'remarks',
//                   'action_date',
//                   'task_name',
//                   'completion_status',
//                   'new_follow_up_date',
//                   'createdAt',
//                   'updatedAt'
//               ],
//               order: [['action_date', 'DESC']],
//               transaction
//           });

//           // Helper function to format action details
//           const formatActionDetail = (action) => ({
//               id: action.id,
//               customer_name: action.Lead?.CustomerName,
//               mobile_no: action.Lead?.MobileNo,
//               email: action.Lead?.CustomerMailId,
//               location: action.Lead?.location,
//               project: action.Lead?.Project,
//               task_type: action.task_type,
//               action_type: action.action_type,
//               specific_action: action.specific_action,
//               remarks: action.remarks,
//               action_date: action.action_date,
//               task_name: action.task_name,
//               completion_status: action.completion_status,
//               new_follow_up_date: action.new_follow_up_date,
//               created_at: action.createdAt,
//               updated_at: action.updatedAt
//           });

//           // Categorize actions
//           const confirmedActions = leadActions.filter(action => action.action_type === 'confirm');
//           const postponedActions = leadActions.filter(action => action.action_type === 'postpone');
//           const completedActions = leadActions.filter(action => action.completion_status === 'completed');
//           const notCompletedActions = leadActions.filter(action => action.completion_status === 'not_completed');

//           // Categorize by task type
//           const hoTaskActions = leadActions.filter(action => action.task_type === 'HO_task');
//           const selfTaskActions = leadActions.filter(action => action.task_type === 'self_task');
//           const otherTaskActions = leadActions.filter(action => action.task_type === 'other_task');

//           // Get today's actions
//           const today = new Date();
//           today.setHours(0, 0, 0, 0);
//           const tomorrow = new Date(today);
//           tomorrow.setDate(tomorrow.getDate() + 1);

//           const todayActions = leadActions.filter(action => {
//               const actionDate = new Date(action.action_date);
//               return actionDate >= today && actionDate < tomorrow;
//           });

//           return {
//               bdm_id: bdm.EmployeeId,
//               bdm_name: bdm.EmployeeName,
//               date_range: startDate && endDate ? {
//                   start_date: startDate,
//                   end_date: endDate
//               } : null,
//               statistics: {
//                   confirmed: {
//                       count: confirmedActions.length,
//                       details: confirmedActions.map(formatActionDetail)
//                   },
//                   postponed: {
//                       count: postponedActions.length,
//                       details: postponedActions.map(formatActionDetail)
//                   },
//                   completed: {
//                       count: completedActions.length,
//                       details: completedActions.map(formatActionDetail)
//                   },
//                   not_completed: {
//                       count: notCompletedActions.length,
//                       details: notCompletedActions.map(formatActionDetail)
//                   },
//                   task_types: {
//                       HO_task: {
//                           count: hoTaskActions.length,
//                           details: hoTaskActions.map(formatActionDetail)
//                       },
//                       self_task: {
//                           count: selfTaskActions.length,
//                           details: selfTaskActions.map(formatActionDetail)
//                       },
//                       other_task: {
//                           count: otherTaskActions.length,
//                           details: otherTaskActions.map(formatActionDetail)
//                       }
//                   },
//                   // today: {
//                   //     count: todayActions.length,
//                   //     details: todayActions.map(formatActionDetail)
//                   // },
//                   // total_actions: {
//                   //     count: leadActions.length,
//                   //     details: leadActions.map(formatActionDetail)
//                   // }
//               }
//           };
//       }));

//       await transaction.commit();

//       res.json({
//           success: true,
//           message: 'BDM statistics retrieved successfully',
//           data: bdmStats
//       });

//   } catch (error) {
//       await transaction.rollback();
//       console.error('Error fetching BDM statistics:', error);
//       res.status(500).json({
//           success: false,
//           error: error.message
//       });
//   }
// };


exports.getAllBdmStats = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
      const { startDate, endDate, bdmIds } = req.query;
      let dateFilter = {};
      let bdmFilter = {};

      // Handle date range filter
      if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              await transaction.rollback();
              return res.status(400).json({
                  success: false,
                  error: 'Invalid date format'
              });
          }

          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);

          dateFilter = {
              action_date: {
                  [Op.between]: [start, end]
              }
          };
      }

      // Handle BDM IDs filter
      if (bdmIds) {
          // Convert string of comma-separated IDs to array of numbers
          const bdmIdArray = bdmIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
          
          if (bdmIdArray.length === 0) {
              await transaction.rollback();
              return res.status(400).json({
                  success: false,
                  error: 'Invalid BDM IDs format'
              });
          }

          bdmFilter = {
              EmployeeId: {
                  [Op.in]: bdmIdArray
              }
          };
      }

      // Get BDMs based on filter
      const bdms = await Employee.findAll({
          where: {
              EmployeeRoleID: 2,
              ...bdmFilter
          },
          attributes: ['EmployeeId', 'EmployeeName'],
          transaction
      });

      if (bdms.length === 0) {
          await transaction.commit();
          return res.json({
              success: true,
              message: 'No BDMs found for the given criteria',
              data: []
          });
      }

      const bdmStats = await Promise.all(bdms.map(async (bdm) => {
          // Get all lead actions for this BDM
          const leadActions = await BdmLeadAction.findAll({
              where: {
                  BDMId: bdm.EmployeeId,
                  ...dateFilter
              },
              include: [{
                  model: Lead_Detail,
                  as: 'Lead',
                  attributes: [
                      'CustomerName',
                      'MobileNo',
                      'CustomerMailId',
                      'location',
                      'Project'
                  ],
              }],
              attributes: [
                  'id',
                  'task_type',
                  'action_type',
                  'specific_action',
                  'remarks',
                  'action_date',
                  'task_name',
                  'completion_status',
                  'new_follow_up_date',
                  'createdAt',
                  'updatedAt'
              ],
              order: [['action_date', 'DESC']],
              transaction
          });

          // Helper function to format action details
          const formatActionDetail = (action) => ({
              id: action.id,
              customer_name: action.Lead?.CustomerName,
              mobile_no: action.Lead?.MobileNo,
              email: action.Lead?.CustomerMailId,
              location: action.Lead?.location,
              project: action.Lead?.Project,
              task_type: action.task_type,
              action_type: action.action_type,
              specific_action: action.specific_action,
              remarks: action.remarks,
              action_date: action.action_date,
              task_name: action.task_name,
              completion_status: action.completion_status,
              new_follow_up_date: action.new_follow_up_date,
              created_at: action.createdAt,
              updated_at: action.updatedAt
          });

          // Categorize actions
          const confirmedActions = leadActions.filter(action => action.action_type === 'confirm');
          const postponedActions = leadActions.filter(action => action.action_type === 'postpone');
          const completedActions = leadActions.filter(action => action.completion_status === 'completed');
          const notCompletedActions = leadActions.filter(action => action.completion_status === 'not_completed');

          // Categorize by task type
          const hoTaskActions = leadActions.filter(action => action.task_type === 'HO_task');
          const selfTaskActions = leadActions.filter(action => action.task_type === 'self_task');
          const otherTaskActions = leadActions.filter(action => action.task_type === 'other_task');

          // Get today's actions
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const todayActions = leadActions.filter(action => {
              const actionDate = new Date(action.action_date);
              return actionDate >= today && actionDate < tomorrow;
          });

          return {
              bdm_id: bdm.EmployeeId,
              bdm_name: bdm.EmployeeName,
              date_range: startDate && endDate ? {
                  start_date: startDate,
                  end_date: endDate
              } : null,
              statistics: {
                  confirmed: {
                      count: confirmedActions.length,
                      details: confirmedActions.map(formatActionDetail)
                  },
                  postponed: {
                      count: postponedActions.length,
                      details: postponedActions.map(formatActionDetail)
                  },
                  completed: {
                      count: completedActions.length,
                      details: completedActions.map(formatActionDetail)
                  },
                  not_completed: {
                      count: notCompletedActions.length,
                      details: notCompletedActions.map(formatActionDetail)
                  },
                  task_types: {
                      HO_task: {
                          count: hoTaskActions.length,
                          details: hoTaskActions.map(formatActionDetail)
                      },
                      self_task: {
                          count: selfTaskActions.length,
                          details: selfTaskActions.map(formatActionDetail)
                      },
                      other_task: {
                          count: otherTaskActions.length,
                          details: otherTaskActions.map(formatActionDetail)
                      }
                  },
                  // today: {
                  //     count: todayActions.length,
                  //     details: todayActions.map(formatActionDetail)
                  // },
                  // total_actions: {
                  //     count: leadActions.length,
                  //     details: leadActions.map(formatActionDetail)
                  // }
              }
          };
      }));

      await transaction.commit();

      res.json({
          success: true,
          message: 'BDM statistics retrieved successfully',
          data: bdmStats
      });

  } catch (error) {
      await transaction.rollback();
      console.error('Error fetching BDM statistics:', error);
      res.status(500).json({
          success: false,
          error: error.message
      });
  }
};



//checkin task



// exports.handleBdmCheckIn = async (req, res) => {
//   const transaction = await sequelize.transaction();
  
//   try {
//     const {
//       bdmId,
//       leadDetailId,  // Optional
//       attendanceId,
//       action,
//       latitude,
//       longitude
//     } = req.body;

//     // Validate required fields
//     if (!bdmId || !attendanceId || !action || !latitude || !longitude) {
//       return res.status(400).json({
//         message: "Missing required fields. bdmId, attendanceId, action, latitude, and longitude are required"
//       });
//     }

//     // Create BDM Travel Detail record
//     const travelDetail = await BdmTravelDetail.create({
//       bdm_id: bdmId,
//       leaddetail_id: leadDetailId || null,
//       attendance_id: attendanceId,
//       action: action,
//       checkin_latitude: latitude,
//       checkin_longitude: longitude,
//       checkin_time: new Date(),
//     }, { transaction });

//     await transaction.commit();

//     res.status(200).json({
//       message: "Check-in recorded successfully",
//       travelDetail
//     });

//   } catch (error) {
//     await transaction.rollback();
//     console.error("Error recording check-in:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };



//changes on 28 jan 

// exports.handleBdmCheckIn = async (req, res) => {
//   const transaction = await sequelize.transaction();
  
//   try {
//     const {
//       bdmId,
//       leadDetailId,  // Optional
//       attendanceId,
//       action,
//       latitude,
//       longitude
//     } = req.body;

//     // Validate required fields
//     if (!bdmId || !attendanceId || !action || !latitude || !longitude) {
//       return res.status(400).json({
//         message: "Missing required fields. bdmId, attendanceId, action, latitude, and longitude are required"
//       });
//     }

//     // Get today's start date
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Validate attendance record
//     const attendance = await Attendance.findOne({
//       where: {
//         id: attendanceId,
//         EmployeeId: bdmId,
//         AttendanceDate: {
//           [Sequelize.Op.gte]: today
//         },
//         AttendanceType: 'IN'
//       }
//     });

//     if (!attendance) {
//       return res.status(400).json({
//         message: "Invalid attendance ID. Please ensure the attendance record exists, belongs to you, and was created today"
//       });
//     }

//     // Create BDM Travel Detail record
//     const travelDetail = await BdmTravelDetail.create({
//       bdm_id: bdmId,
//       leaddetail_id: leadDetailId || null,
//       attendance_id: attendanceId,
//       action: action,
//       checkin_latitude: latitude,
//       checkin_longitude: longitude,
//       checkin_time: new Date(),
//       extrafield1: 'default',
//       extrafield2: 'default',
//       extrafield3: 'default'
//     }, { transaction });

//     await transaction.commit();

//     res.status(200).json({
//       message: "Check-in recorded successfully",
//       travelDetail
//     });

//   } catch (error) {
//     await transaction.rollback();
//     console.error("Error recording check-in:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };




exports.handleBdmCheckIn = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      bdmId,
      leadDetailId,  // Optional
      attendanceId,
      action,
      latitude,
      longitude,
      bdmLeadActionId  // Add this new parameter
    } = req.body;

    // Validate required fields
    if (!bdmId || !attendanceId || !action || !latitude || !longitude) {
      return res.status(400).json({
        message: "Missing required fields. bdmId, attendanceId, action, latitude, and longitude are required"
      });
    }

    // Get today's start date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate attendance record
    const attendance = await Attendance.findOne({
      where: {
        id: attendanceId,
        EmployeeId: bdmId,
        AttendanceDate: {
          [Sequelize.Op.gte]: today
        },
        AttendanceType: 'IN'
      }
    });

    if (!attendance) {
      return res.status(400).json({
        message: "Invalid attendance ID. Please ensure the attendance record exists, belongs to you, and was created today"
      });
    }

    // If bdmLeadActionId is provided, validate it
    if (bdmLeadActionId) {
      const leadAction = await BdmLeadAction.findOne({
        where: {
          id: bdmLeadActionId,
          BDMId: bdmId,
          action_date: {
            [Sequelize.Op.gte]: today
          }
        }
      });

      if (!leadAction) {
        return res.status(400).json({
          message: "Invalid BDM Lead Action ID"
        });
      }
    }

    // Create BDM Travel Detail record
    const travelDetail = await BdmTravelDetail.create({
      bdm_id: bdmId,
      leaddetail_id: leadDetailId || null,
      attendance_id: attendanceId,
      bdm_lead_action_id: bdmLeadActionId || null,  // Save the BdmLeadAction id
      action: action,
      checkin_latitude: latitude,
      checkin_longitude: longitude,
      checkin_time: new Date(),
      extrafield1: 'default',
      extrafield2: 'default',
      extrafield3: 'default'
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: "Check-in recorded successfully",
      travelDetail
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error recording check-in:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};





// checkout task 
exports.handleBdmCheckOut = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      travelDetailId,
      latitude,
      longitude
    } = req.body;

    // Validate required fields
    if (!travelDetailId || !latitude || !longitude) {
      return res.status(400).json({
        message: "Missing required fields. travelDetailId, latitude, and longitude are required"
      });
    }

    // Find the existing travel detail record
    const travelDetail = await BdmTravelDetail.findByPk(travelDetailId);

    if (!travelDetail) {
      return res.status(404).json({
        message: "Travel detail record not found"
      });
    }

    if (travelDetail.checkout_time) {
      return res.status(400).json({
        message: "Check-out already recorded for this travel detail"
      });
    }
    const checkoutTime = new Date();


    // Update travel detail with checkout information
    await travelDetail.update({
      checkout_latitude: latitude,
      checkout_longitude: longitude,
      checkout_time: checkoutTime
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: "Check-out recorded successfully",
      travelDetail: {
        ...travelDetail.toJSON(),
     
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error recording check-out:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
 


//distance calucation




// exports.getBdmDailyDistance = async (req, res) => {
//   try {
//     const { bdmId, date } = req.body;

//     if (!bdmId) {
//       return res.status(400).json({
//         message: "BDM ID is required"
//       });
//     }

//     // If date is not provided, use today's date
//     const targetDate = date ? new Date(date) : new Date();
//     targetDate.setHours(0, 0, 0, 0);

//     const nextDate = new Date(targetDate);
//     nextDate.setDate(nextDate.getDate() + 1);

//     // Get all check-ins for the BDM on the specified date
//     const travelDetails = await BdmTravelDetail.findAll({
//       where: {
//         bdm_id: bdmId,
//         checkin_time: {
//           [Sequelize.Op.gte]: targetDate,
//           [Sequelize.Op.lt]: nextDate
//         }
//       },
//       order: [['checkin_time', 'ASC']]
//     });

//     if (travelDetails.length === 0) {
//       return res.status(200).json({
//         message: "No travel records found for the specified date",
//         totalDistanceKm: 0,
//         locations: [],
//         date: targetDate
//       });
//     }

//     // Calculate distances between consecutive points
//     const locations = [];
//     let totalDistanceMeters = 0;

//     for (let i = 0; i < travelDetails.length - 1; i++) {
//       const point1 = travelDetails[i];
//       const point2 = travelDetails[i + 1];

//       try {
//         // Call OSRM API to get route distance
//         const routeUrl = `http://router.project-osrm.org/route/v1/driving/${point1.checkin_longitude},${point1.checkin_latitude};${point2.checkin_longitude},${point2.checkin_latitude}?overview=false`;
//         const routeResponse = await axios.get(routeUrl);

//         if (routeResponse.data.routes && routeResponse.data.routes[0]) {
//           const distance = routeResponse.data.routes[0].distance; // distance in meters
//           totalDistanceMeters += distance;

//           locations.push({
//             from: {
//               latitude: point1.checkin_latitude,
//               longitude: point1.checkin_longitude,
//               time: point1.checkin_time,
//               action: point1.action
//             },
//             to: {
//               latitude: point2.checkin_latitude,
//               longitude: point2.checkin_longitude,
//               time: point2.checkin_time,
//               action: point2.action
//             },
//             segmentDistanceKm: +(distance / 1000).toFixed(2)
//           });
//         }
//       } catch (routeError) {
//         console.error('Error calculating route:', routeError);
//         // Fallback to direct distance calculation using Haversine formula
//         const distance = calculateHaversineDistance(
//           parseFloat(point1.checkin_latitude),
//           parseFloat(point1.checkin_longitude),
//           parseFloat(point2.checkin_latitude),
//           parseFloat(point2.checkin_longitude)
//         );
//         totalDistanceMeters += distance;

//         locations.push({
//           from: {
//             latitude: point1.checkin_latitude,
//             longitude: point1.checkin_longitude,
//             time: point1.checkin_time,
//             action: point1.action
//           },
//           to: {
//             latitude: point2.checkin_latitude,
//             longitude: point2.checkin_longitude,
//             time: point2.checkin_time,
//             action: point2.action
//           },
//           segmentDistanceKm: +(distance / 1000).toFixed(2),
//           isDirectDistance: true // Flag to indicate this is a direct distance, not route distance
//         });
//       }
//     }

//     res.status(200).json({
//       message: "Distance calculated successfully",
//       totalDistanceKm: +(totalDistanceMeters / 1000).toFixed(2),
//       locations,
//       date: targetDate,
//       numberOfLocations: travelDetails.length
//     });

//   } catch (error) {
//     console.error("Error calculating distance:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };

// // Haversine formula for calculating direct distance between two points
// const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
//   const R = 6371e3; // Earth's radius in meters
//   const φ1 = (lat1 * Math.PI) / 180;
//   const φ2 = (lat2 * Math.PI) / 180;
//   const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//   const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//   const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
//           Math.cos(φ1) * Math.cos(φ2) *
//           Math.sin(Δλ/2) * Math.sin(Δλ/2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

//   return R * c; // Distance in meters
// };
 

 
exports.getBdmDailyDistance = async (req, res) => {
  // Helper function to get address from coordinates
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'User-Agent': 'BDM-Travel-App'
          }
        }
      );
      return {
        address: response.data.display_name,
        city: response.data.address.city || 
              response.data.address.town || 
              response.data.address.village || 
              response.data.address.county || 
              'Unknown'
      };
    } catch (error) {
      console.error('Error fetching address:', error);
      return {
        address: 'Address not found',
        city: 'Unknown'
      };
    }
  };

  try {
    const { bdmId, date } = req.body;

    if (!bdmId) {
      return res.status(400).json({
        message: "BDM ID is required"
      });
    }

    // If date is not provided, use today's date
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Get all check-ins for the BDM on the specified date
    const travelDetails = await BdmTravelDetail.findAll({
      where: {
        bdm_id: bdmId,
        checkin_time: {
          [Sequelize.Op.gte]: targetDate,
          [Sequelize.Op.lt]: nextDate
        }
      },
      order: [['checkin_time', 'ASC']]
    });

    if (travelDetails.length === 0) {
      return res.status(200).json({
        message: "No travel records found for the specified date",
        totalDistanceKm: 0,
        locations: [],
        date: targetDate
      });
    }

    // Calculate distances between consecutive points
    const locations = [];
    let totalDistanceMeters = 0;

    for (let i = 0; i < travelDetails.length - 1; i++) {
      const point1 = travelDetails[i];
      const point2 = travelDetails[i + 1];

      // Get addresses for both points
      const [fromAddress, toAddress] = await Promise.all([
        getAddressFromCoordinates(point1.checkin_latitude, point1.checkin_longitude),
        getAddressFromCoordinates(point2.checkin_latitude, point2.checkin_longitude)
      ]);

      try {
        // Call OSRM API to get route distance
        const routeUrl = `http://router.project-osrm.org/route/v1/driving/${point1.checkin_longitude},${point1.checkin_latitude};${point2.checkin_longitude},${point2.checkin_latitude}?overview=false`;
        const routeResponse = await axios.get(routeUrl);

        if (routeResponse.data.routes && routeResponse.data.routes[0]) {
          const distance = routeResponse.data.routes[0].distance; // distance in meters
          totalDistanceMeters += distance;

          locations.push({
            from: {
              latitude: point1.checkin_latitude,
              longitude: point1.checkin_longitude,
              time: point1.checkin_time,
              action: point1.action,
              address: fromAddress.address,
              city: fromAddress.city
            },
            to: {
              latitude: point2.checkin_latitude,
              longitude: point2.checkin_longitude,
              time: point2.checkin_time,
              action: point2.action,
              address: toAddress.address,
              city: toAddress.city
            },
            segmentDistanceKm: +(distance / 1000).toFixed(2)
          });
        }
      } catch (routeError) {
        console.error('Error calculating route:', routeError);
        // Fallback to direct distance calculation using Haversine formula
        const distance = calculateHaversineDistance(
          parseFloat(point1.checkin_latitude),
          parseFloat(point1.checkin_longitude),
          parseFloat(point2.checkin_latitude),
          parseFloat(point2.checkin_longitude)
        );
        totalDistanceMeters += distance;

        locations.push({
          from: {
            latitude: point1.checkin_latitude,
            longitude: point1.checkin_longitude,
            time: point1.checkin_time,
            action: point1.action,
            address: fromAddress.address,
            city: fromAddress.city
          },
          to: {
            latitude: point2.checkin_latitude,
            longitude: point2.checkin_longitude,
            time: point2.checkin_time,
            action: point2.action,
            address: toAddress.address,
            city: toAddress.city
          },
          segmentDistanceKm: +(distance / 1000).toFixed(2),
          isDirectDistance: true // Flag to indicate this is a direct distance, not route distance
        });
      }

      // Add delay to respect Nominatim's usage policy
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // If there are travel details, include the last point's address
    if (travelDetails.length > 0) {
      const lastPoint = travelDetails[travelDetails.length - 1];
      const lastAddress = await getAddressFromCoordinates(
        lastPoint.checkin_latitude,
        lastPoint.checkin_longitude
      );

      // Add last location to show final destination
      locations.push({
        final_location: {
          latitude: lastPoint.checkin_latitude,
          longitude: lastPoint.checkin_longitude,
          time: lastPoint.checkin_time,
          action: lastPoint.action,
          address: lastAddress.address,
          city: lastAddress.city
        }
      });
    }

    res.status(200).json({
      message: "Distance calculated successfully",
      totalDistanceKm: +(totalDistanceMeters / 1000).toFixed(2),
      locations,
      date: targetDate,
      numberOfLocations: travelDetails.length
    });

  } catch (error) {
    console.error("Error calculating distance:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Haversine formula for calculating direct distance between two points
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};





// exports.getBdmDailyDistance = async (req, res) => {
//   try {
//     const { bdmId, date } = req.body;

//     if (!bdmId) {
//       return res.status(400).json({
//         message: "BDM ID is required"
//       });
//     }

//     // If date is not provided, use today's date
//     const targetDate = date ? new Date(date) : new Date();
//     targetDate.setHours(0, 0, 0, 0);

//     const nextDate = new Date(targetDate);
//     nextDate.setDate(nextDate.getDate() + 1);

//     // Get all check-ins for the BDM on the specified date
//     const travelDetails = await BdmTravelDetail.findAll({
//       where: {
//         bdm_id: bdmId,
//         checkin_time: {
//           [Sequelize.Op.gte]: targetDate,
//           [Sequelize.Op.lt]: nextDate
//         }
//       },
//       order: [['checkin_time', 'ASC']]
//     });

//     if (travelDetails.length === 0) {
//       return res.status(200).json({
//         message: "No travel records found for the specified date",
//         totalDistanceKm: 0,
//         locations: [],
//         date: targetDate
//       });
//     }

//     // Calculate distances between consecutive points
//     const locations = [];
//     let totalDistanceKm = 0;

//     for (let i = 0; i < travelDetails.length - 1; i++) {
//       const point1 = travelDetails[i];
//       const point2 = travelDetails[i + 1];

//       const distance = calculateHaversineDistance(
//         parseFloat(point1.checkin_latitude),
//         parseFloat(point1.checkin_longitude),
//         parseFloat(point2.checkin_latitude),
//         parseFloat(point2.checkin_longitude)
//       );

//       totalDistanceKm += distance;

//       locations.push({
//         from: {
//           latitude: point1.checkin_latitude,
//           longitude: point1.checkin_longitude,
//           time: point1.checkin_time,
//           action: point1.action
//         },
//         to: {
//           latitude: point2.checkin_latitude,
//           longitude: point2.checkin_longitude,
//           time: point2.checkin_time,
//           action: point2.action
//         },
//         segmentDistanceKm: +distance.toFixed(2)
//       });
//     }

//     res.status(200).json({
//       message: "Distance calculated successfully",
//       totalDistanceKm: +totalDistanceKm.toFixed(2),
//       locations,
//       date: targetDate,
//       numberOfLocations: travelDetails.length
//     });

//   } catch (error) {
//     console.error("Error calculating distance:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };

// // Haversine formula for calculating direct distance between two points
// const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
//   // Convert latitude and longitude from degrees to radians
//   const R = 6371; // Earth's radius in kilometers
//   const φ1 = toRadians(lat1);
//   const φ2 = toRadians(lat2);
//   const Δφ = toRadians(lat2 - lat1);
//   const Δλ = toRadians(lon2 - lon1);

//   const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
//           Math.cos(φ1) * Math.cos(φ2) *
//           Math.sin(Δλ/2) * Math.sin(Δλ/2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

//   return R * c; // Returns distance in kilometers
// };

// // Helper function to convert degrees to radians
// const toRadians = (degrees) => {
//   return degrees * (Math.PI / 180);
// };




//attendence out--->


exports.handleAttendanceOut = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      bdmId,
      attendanceId,
      latitude,
      longitude
    } = req.body;

    // Validate required fields
    if (!bdmId || !attendanceId || !latitude || !longitude) {
      return res.status(400).json({
        message: "Missing required fields. bdmId, attendanceId, latitude, and longitude are required"
      });
    }

    // Get today's start date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find and validate the attendance record
    const attendance = await Attendance.findOne({
      where: {
        id: attendanceId,
        EmployeeId: bdmId,
        AttendanceDate: {
          [Sequelize.Op.gte]: today
        },
        AttendanceType: 'IN',
        AttendanceOutTime: null // Make sure attendance out hasn't been marked already
      }
    });

    if (!attendance) {
      return res.status(400).json({
        message: "Invalid attendance ID or attendance out already marked"
      });
    }

    const currentDateTime = new Date();

    // Update attendance record
    await attendance.update({
      AttendanceOutTime: currentDateTime,
      AttendanceOutLatitude: latitude,
      AttendanceOutLongitude: longitude,
      AttendanceOut: 'OUT'
    }, { transaction });

    // Create new travel detail record for attendance out
    const travelDetail = await BdmTravelDetail.create({
      bdm_id: bdmId,
      attendance_id: attendanceId,
      action: "Attendance Out",
      checkin_latitude: latitude,
      checkin_longitude: longitude,
      checkin_time: currentDateTime,
   
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: "Attendance out marked successfully",
      attendance,
      travelDetail
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error marking attendance out:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};





//other task for bdm api 

exports.handleOtherTasks = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { bdmId, other_task } = req.body;

    if (!bdmId || !other_task || !Array.isArray(other_task)) {
      return res.status(400).json({ 
        message: "Invalid input data. bdmId and other_task array are required" 
      });
    }

    // Process other tasks
    const processedOtherTasks = await Promise.all(
      other_task.map(async (task) => {
        const {
          id,
          action_type,
          specific_action,
          new_follow_up_date,
          remarks,
          task_name,
        } = task;

        // Create BDM Lead Action record
        const bdmAction = await BdmLeadAction.create(
          {
            LeadId: id,
            BDMId: bdmId,
            task_type: "other_task",
            action_type,
            specific_action:  task_name,
            new_follow_up_date:  new_follow_up_date,
            remarks,
            task_name
          },
          { transaction }
        );

        // Optionally, you can add Lead_Detail update logic here if needed
        // Similar to your commented code in the original function

        return bdmAction;
      })
    );

    await transaction.commit();

    res.status(200).json({
      message: "Other tasks processed successfully",
      other_task: processedOtherTasks,
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error processing other tasks:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};



