// controllers/bdmActionController.js
const { QueryTypes, Op, Sequelize } = require("sequelize");
const sequelize = require("../../models/index");
const BdmLeadAction = require("../../models/BdmLeadAction");
const Lead_Detail = require("../../models/lead_detail");
const Attendance = require("../../models/Attendence");
const cron = require('node-cron');
const OnCallDiscussionByBdm = require('../../models/OnCallDiscussionByBdm');
const Employee = require('../../models/employee');
const Estimation = require('../../models/estimation');  
const Meeting = require('../../models/lead_meeting');  
const SiteVisit = require('../../models/site_visit');  
const BdmTravelDetail = require("../../models/BdmTravelDetail");
const { default: axios } = require("axios");
const ExcelJS = require('exceljs');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const Leave = require("../../models/Leave");



 


 
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

//other task add api
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


//Attendence Out 
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



 


//distance calucation  Google API


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


//report Download Api will use after some time 

// exports.generateTravelReport = async (req, res) => {
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

//     // Get all travel details for the BDM on the specified date
//     const travelDetails = await BdmTravelDetail.findAll({
//       where: {
//         bdm_id: bdmId,
//         checkin_time: {
//           [Sequelize.Op.gte]: targetDate,
//           [Sequelize.Op.lt]: nextDate
//         }
//       },
//       order: [['checkin_time', 'ASC']],
//       // include: [
//       //   {
//       //     model: Employee,
//       //     attributes: ['EmployeeName']
//       //   }
//       // ]
//     });

//     if (travelDetails.length === 0) {
//       return res.status(404).json({
//         message: "No travel records found for the specified date"
//       });
//     }

//     // Create a new workbook and worksheet
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Travel Report');

//     // Set up columns
//     worksheet.columns = [
//       { header: 'Employee ID', key: 'employeeId', width: 12 },
//       { header: 'Employee Name', key: 'employeeName', width: 20 },
//       { header: 'Action', key: 'action', width: 15 },
//       { header: 'Check-in Time', key: 'checkinTime', width: 20 },
//       { header: 'Latitude', key: 'latitude', width: 15 },
//       { header: 'Longitude', key: 'longitude', width: 15 },
//       { header: 'Address', key: 'address', width: 40 },
//       { header: 'Distance from Last Point (KM)', key: 'distance', width: 25 }
//     ];

//     let lastLatitude = null;
//     let lastLongitude = null;
//     let totalDistance = 0;
    
    
//     // Process each travel detail
//     for (let i = 0; i < travelDetails.length; i++) {
//       const detail = travelDetails[i];
      
//       // Get address for current location
//       const address = await getAddressFromCoordinates(
//         detail.checkin_latitude,
//         detail.checkin_longitude
//       );

//       let distance = 0;
//       if (i > 0 && detail.action !== 'Attendance In') {
//         // Calculate distance from last point
//         distance = calculateHaversineDistance(
//           parseFloat(lastLatitude),
//           parseFloat(lastLongitude),
//           parseFloat(detail.checkin_latitude),
//           parseFloat(detail.checkin_longitude)
//         );
//         distance = +(distance / 1000).toFixed(2); // Convert to KM
//         totalDistance += distance;
//       }

//       // Add row to worksheet
//       worksheet.addRow({
//         employeeId: detail.bdm_id,
//         employeeName: detail.Employee?.EmployeeName || 'N/A',
//         action: detail.action,
//         checkinTime: moment(detail.checkin_time).format('DD-MM-YYYY HH:mm:ss'),
//         latitude: detail.checkin_latitude,
//         longitude: detail.checkin_longitude,
//         address: address.address,
//         distance: detail.action === 'Attendance In' ? 0 : distance
//       });

//       // Update last coordinates
//       lastLatitude = detail.checkin_latitude;
//       lastLongitude = detail.checkin_longitude;

//       // Add delay to respect Nominatim's usage policy
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }

//     // Add total distance row
//     worksheet.addRow({
//       employeeId: '',
//       employeeName: '',
//       action: 'Total Distance',
//       checkinTime: '',
//       latitude: '',
//       longitude: '',
//       address: '',
//       distance: +totalDistance.toFixed(2)
//     });

//     // Style the header row
//     worksheet.getRow(1).font = { bold: true };
//     worksheet.getRow(1).fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'FFE0E0E0' }
//     };

//     // Create uploads directory if it doesn't exist
//     const uploadDir = path.join(__dirname, '../uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir);
//     }

//     // Generate unique filename
//     const fileName = `travel_report_${bdmId}_${moment(targetDate).format('YYYY-MM-DD')}_${Date.now()}.xlsx`;
//     const filePath = path.join(uploadDir, fileName);

//     // Write file
//     await workbook.xlsx.writeFile(filePath);

//     // Send file path in response
//     res.json({
//       message: "Report generated successfully",
//       fileName: fileName,
//       filePath: `/uploads/${fileName}`
//     });

//   } catch (error) {
//     console.error("Error generating travel report:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };



// Helper functions (reuse the existing ones)
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




 
 
// All Employee Attendence Data 

exports.getEmployeeAttendance = async (req, res) => {
 try {
   const { startDate, endDate } = req.query;
   
   const start = startDate ? moment(startDate).startOf('day') : moment().startOf('day');
   const end = endDate ? moment(endDate).endOf('day') : moment().endOf('day');

   const attendanceRecords = await Attendance.findAll({
     where: {
       AttendanceDate: {
         [Sequelize.Op.between]: [start.toDate(), end.toDate()]
       }
     },
     include: [{
       model: Employee,
       as: 'Employee',
       attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone', 'EmployeeMailId'],
       required: true
     }],
     order: [
       ['AttendanceDate', 'DESC'],
       ['EmployeeId', 'ASC']
     ]
   });

   if (attendanceRecords.length === 0) {
     return res.status(200).json({
       message: "No attendance records found for the specified date range",
       summary: {
         totalEmployees: 0,
         totalAttendanceRecords: 0,
         dateRange: {
           from: start.format('DD-MM-YYYY'),
           to: end.format('DD-MM-YYYY')
         }
       },
       data: []
     });
   }

   // Format the response data
   const formattedRecords = attendanceRecords.map(record => {
     let workingHours = 0;
     let workingMinutes = 0;

     // Calculate working hours if both in and out times exist
     if (record.AttendanceInTime && record.AttendanceOutTime) {
       const inTime = moment(record.AttendanceInTime);
       const outTime = moment(record.AttendanceOutTime);
       const duration = moment.duration(outTime.diff(inTime));

       workingHours = Math.floor(duration.asHours());
       workingMinutes = Math.floor(duration.asMinutes() % 60);
     }

     return {
       employeeId: record.EmployeeId,
       employeeName: record.Employee?.EmployeeName || '',
       employeePhone: record.Employee?.EmployeePhone || '',
       employeeEmail: record.Employee?.EmployeeMailId || '',
       attendanceDate: moment(record.AttendanceDate).format('DD-MM-YYYY'),
       inDetails: {
         time: record.AttendanceInTime ? 
           moment(record.AttendanceInTime).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss') : '',
         location: {
           latitude: record.Latitude,
           longitude: record.Longitude
         }
       },
       outDetails: {
         time: record.AttendanceOutTime ? 
           moment(record.AttendanceOutTime).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss') : '',
         location: record.AttendanceOutLatitude ? {
           latitude: record.AttendanceOutLatitude,
           longitude: record.AttendanceOutLongitude
         } : null
       },
       workingDuration: record.AttendanceInTime && record.AttendanceOutTime ? 
         `${workingHours} hours ${workingMinutes} minutes` : '',
       status: record.AttendanceOut === 'OUT' ? 'Checked Out' : 'Checked In'
     };
   });

   // Group records by employee
   const groupedRecords = formattedRecords.reduce((acc, record) => {
     if (!acc[record.employeeId]) {
       acc[record.employeeId] = {
         employeeDetails: {
           employeeId: record.employeeId,
           employeeName: record.employeeName,
           employeePhone: record.employeePhone,
           employeeEmail: record.employeeEmail
         },
         attendanceRecords: []
       };
     }

     acc[record.employeeId].attendanceRecords.push({
       date: record.attendanceDate,
       inDetails: record.inDetails,
       outDetails: record.outDetails,
       workingDuration: record.workingDuration,
       status: record.status
     });

     return acc;
   }, {});

   const summary = {
     totalEmployees: Object.keys(groupedRecords).length,
     totalAttendanceRecords: attendanceRecords.length,
     dateRange: {
       from: start.format('DD-MM-YYYY'),
       to: end.format('DD-MM-YYYY')
     }
   };

   res.status(200).json({
     message: "Attendance records retrieved successfully",
     summary,
     data: Object.values(groupedRecords)
   });

 } catch (error) {
   console.error("Error fetching attendance records:", error);
   res.status(500).json({
     message: "Internal server error",
     error: error.message
   });
 }
};

 


//indivuals detail report for download 

//changd on 06 feb



// exports.getTravelReport = async (req, res) => {
//   try {
//     const { bdmId, date } = req.query;

//     if (!bdmId) {
//       return res.status(400).json({ message: "BDM ID is required" });
//     }

//     const targetDate = date ? new Date(date) : new Date();
//     targetDate.setHours(0, 0, 0, 0);
//     const nextDate = new Date(targetDate);
//     nextDate.setDate(nextDate.getDate() + 1);

//     const travelDetails = await BdmTravelDetail.findAll({
//       where: {
//         bdm_id: bdmId,
//         checkin_time: {
//           [Sequelize.Op.between]: [targetDate, nextDate]
//         }
//       },
//       include: [{
//         model: Employee,
//         as: 'Employee',
//         attributes: ['EmployeeId', 'EmployeeName']
//       }],
//       order: [['checkin_time', 'ASC']]
//     });

//     if (travelDetails.length === 0) {
//       return res.status(404).json({ message: "No travel records found for the specified date" });
//     }

//     // Create Excel workbook
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Travel Report');

//     // Set up columns
//     worksheet.columns = [
//       { header: 'Employee ID', key: 'employeeId', width: 12 },
//       { header: 'Employee Name', key: 'employeeName', width: 20 },
//       { header: 'Action', key: 'action', width: 15 },
//       { header: 'Check-in Time', key: 'checkinTime', width: 20 },
//       { header: 'Check-out Time', key: 'checkoutTime', width: 20 },
//       { header: 'Check-in Latitude', key: 'checkinLatitude', width: 15 },
//       { header: 'Check-in Longitude', key: 'checkinLongitude', width: 15 },
//       { header: 'Check-in Address', key: 'checkinAddress', width: 40 },
//       { header: 'Check-out Latitude', key: 'checkoutLatitude', width: 15 },
//       { header: 'Check-out Longitude', key: 'checkoutLongitude', width: 15 },
//       { header: 'Check-out Address', key: 'checkoutAddress', width: 40 },
//       { header: 'Distance from Last Point (KM)', key: 'distance', width: 25 },
//       { header: 'Checkin-Checkout Distance (KM)', key: 'checkinCheckoutDistance', width: 25 },
//       { header: 'Checkin-Checkout Duration (Minutes)', key: 'duration', width: 25 }
//     ];

//     let lastLatitude = null;
//     let lastLongitude = null;
//     let totalDistance = 0;

//     // Process and add rows
//     for (let i = 0; i < travelDetails.length; i++) {
//       const detail = travelDetails[i];
      
//       const [checkinAddress, checkoutAddress] = await Promise.all([
//         getAddressFromCoordinates(detail.checkin_latitude, detail.checkin_longitude),
//         detail.checkout_latitude ? getAddressFromCoordinates(detail.checkout_latitude, detail.checkout_longitude) : null
//       ]);

//       let distance = 0;
//       if (i > 0 && detail.action !== 'Attendance In') {
//         distance = calculateHaversineDistance(
//           parseFloat(lastLatitude),
//           parseFloat(lastLongitude),
//           parseFloat(detail.checkin_latitude),
//           parseFloat(detail.checkin_longitude)
//         );
//         distance = +(distance / 1000).toFixed(2);
//         totalDistance += distance;
//       }

//       let checkinCheckoutDistance = 'N/A';
//       if (detail.checkout_latitude && detail.checkout_longitude) {
//         if (detail.checkin_latitude === detail.checkout_latitude && 
//             detail.checkin_longitude === detail.checkout_longitude) {
//           checkinCheckoutDistance = 0;
//         } else {
//           const distance = calculateHaversineDistance(
//             parseFloat(detail.checkin_latitude),
//             parseFloat(detail.checkin_longitude),
//             parseFloat(detail.checkout_latitude),
//             parseFloat(detail.checkout_longitude)
//           );
//           checkinCheckoutDistance = +(distance / 1000).toFixed(2);
//         }
//       }

//       let duration = 0;
//       if (detail.checkout_time) {
//         duration = Math.round((new Date(detail.checkout_time) - new Date(detail.checkin_time)) / (1000 * 60));
//       }

//       worksheet.addRow({
//         employeeId: detail.bdm_id,
//         employeeName: detail.Employee?.EmployeeName || 'N/A',
//         action: detail.action,
//         checkinTime: moment(detail.checkin_time).format('DD-MM-YYYY HH:mm:ss'),
//         checkoutTime: detail.checkout_time ? moment(detail.checkout_time).format('DD-MM-YYYY HH:mm:ss') : 'N/A',
//         checkinLatitude: detail.checkin_latitude,
//         checkinLongitude: detail.checkin_longitude,
//         checkinAddress: checkinAddress.address,
//         checkoutLatitude: detail.checkout_latitude || 'N/A',
//         checkoutLongitude: detail.checkout_longitude || 'N/A',
//         checkoutAddress: checkoutAddress ? checkoutAddress.address : 'N/A',
//         distance: detail.action === 'Attendance In' ? 0 : distance,
//         checkinCheckoutDistance: checkinCheckoutDistance,
//         duration: duration || 'N/A'
//       });

//       lastLatitude = detail.checkin_latitude;
//       lastLongitude = detail.checkin_longitude;

//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }

//     // Add total distance row
//     worksheet.addRow({
//       employeeId: '',
//       employeeName: '',
//       action: 'Total Distance',
//       checkinTime: '',
//       checkoutTime: '',
//       checkinLatitude: '',
//       checkinLongitude: '',
//       checkinAddress: '',
//       checkoutLatitude: '',
//       checkoutLongitude: '',
//       checkoutAddress: '',
//       distance: +totalDistance.toFixed(2),
//       checkinCheckoutDistance: '',
//       duration: ''
//     });

//     // Style header row
//     worksheet.getRow(1).font = { bold: true };
//     worksheet.getRow(1).fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'FFE0E0E0' }
//     };

//     // Set response headers for file download
//     res.setHeader(
//       'Content-Type',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     );
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename=travel_report_${bdmId}_${moment(targetDate).format('YYYY-MM-DD')}.xlsx`
//     );

//     // Write to response
//     await workbook.xlsx.write(res);

//   } catch (error) {
//     console.error("Error generating travel report:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };




exports.getTravelReport = async (req, res) => {
  
  
  try {
    const { bdmId, date } = req.query;

    if (!bdmId) {
      return res.status(400).json({ message: "BDM ID is required" });
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const travelDetails = await BdmTravelDetail.findAll({
      where: {
        bdm_id: bdmId,
        checkin_time: {
          [Sequelize.Op.between]: [targetDate, nextDate]
        }
      },
     
      include: [
        {
          model: Employee,
          as: 'Employee',
          where: { EmployeeId: bdmId },
          attributes: ['EmployeeId', 'EmployeeName']
        },

        {
          model: Lead_Detail,
          as: 'LeadDetail',
          required: false,
          attributes: [
            'CustomerName',
            'MobileNo',
            'category',
            'bdm_remark'
          ]
        }
      ],
      order: [['checkin_time', 'ASC']]
    });

    if (travelDetails.length === 0) {
      return res.status(404).json({ message: "No travel records found for the specified date" });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Travel Report');

    // Set up columns
    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 12 },
      { header: 'Employee Name', key: 'employeeName', width: 20 },
      { header: 'Action', key: 'action', width: 15 },
      { header: 'Check-in Time', key: 'checkinTime', width: 20 },
      { header: 'Check-out Time', key: 'checkoutTime', width: 20 },
      { header: 'Check-in Latitude', key: 'checkinLatitude', width: 15 },
      { header: 'Check-in Longitude', key: 'checkinLongitude', width: 15 },
      { header: 'Check-in Address', key: 'checkinAddress', width: 40 },
      { header: 'Check-out Latitude', key: 'checkoutLatitude', width: 15 },
      { header: 'Check-out Longitude', key: 'checkoutLongitude', width: 15 },
      { header: 'Check-out Address', key: 'checkoutAddress', width: 40 },
      { header: 'Distance from Last Point (KM)', key: 'distance', width: 25 },
      { header: 'Checkin-Checkout Distance (KM)', key: 'checkinCheckoutDistance', width: 25 },
      { header: 'Checkin-Checkout Duration (Minutes)', key: 'duration', width: 25 },
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Customer Mobile', key: 'customerMobile', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'BDM Remarks', key: 'bdmRemarks', width: 40 }
    ];

    let lastLatitude = null;
    let lastLongitude = null;
    let totalDistance = 0;

    // Process and add rows
    for (let i = 0; i < travelDetails.length; i++) {
      const detail = travelDetails[i];
      console.log(detail , "---------------------");
      
      
      const [checkinAddress, checkoutAddress] = await Promise.all([
        getAddressFromCoordinates(detail.checkin_latitude, detail.checkin_longitude),
        detail.checkout_latitude ? getAddressFromCoordinates(detail.checkout_latitude, detail.checkout_longitude) : null
      ]);

      let distance = 0;
      if (i > 0 && detail.action !== 'Attendance In') {
        distance = calculateHaversineDistance(
          parseFloat(lastLatitude),
          parseFloat(lastLongitude),
          parseFloat(detail.checkin_latitude),
          parseFloat(detail.checkin_longitude)
        );
        distance = +(distance / 1000).toFixed(2);
        totalDistance += distance;
      }

      let checkinCheckoutDistance = '';
      if (detail.checkout_latitude && detail.checkout_longitude) {
        if (detail.checkin_latitude === detail.checkout_latitude && 
            detail.checkin_longitude === detail.checkout_longitude) {
          checkinCheckoutDistance = 0;
        } else {
          const distance = calculateHaversineDistance(
            parseFloat(detail.checkin_latitude),
            parseFloat(detail.checkin_longitude),
            parseFloat(detail.checkout_latitude),
            parseFloat(detail.checkout_longitude)
          );
          checkinCheckoutDistance = +(distance / 1000).toFixed(2);
        }
      }

      let duration = 0;
      if (detail.checkout_time) {
        duration = Math.round((new Date(detail.checkout_time) - new Date(detail.checkin_time)) / (1000 * 60));
      }
  
      worksheet.addRow({
        employeeId: detail.bdm_id,
        employeeName: detail.Employee?.EmployeeName || '',
        action: detail.action,
        checkinTime: moment(detail.checkin_time).format('DD-MM-YYYY HH:mm:ss'),
        checkoutTime: detail.checkout_time ? moment(detail.checkout_time).format('DD-MM-YYYY HH:mm:ss') : '',
        checkinLatitude: detail.checkin_latitude,
        checkinLongitude: detail.checkin_longitude,
        checkinAddress: checkinAddress.address,
        checkoutLatitude: detail.checkout_latitude || '',
        checkoutLongitude: detail.checkout_longitude || '',
        checkoutAddress: checkoutAddress ? checkoutAddress.address : '',
        distance: detail.action === 'Attendance In' ? 0 : distance,
        checkinCheckoutDistance: checkinCheckoutDistance,
        duration: duration || '',
        customerName: detail.LeadDetail?.CustomerName || '',
        customerMobile: detail.LeadDetail?.MobileNo || '',
        category: detail.LeadDetail?.category || '',
        bdmRemarks: detail.LeadDetail?.bdm_remark || ''
      });

      lastLatitude = detail.checkin_latitude;
      lastLongitude = detail.checkin_longitude;

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Add total distance row
    worksheet.addRow({
      employeeId: '',
      employeeName: '',
      action: 'Total Distance',
      checkinTime: '',
      checkoutTime: '',
      checkinLatitude: '',
      checkinLongitude: '',
      checkinAddress: '',
      checkoutLatitude: '',
      checkoutLongitude: '',
      checkoutAddress: '',
      distance: +totalDistance.toFixed(2),
      checkinCheckoutDistance: '',
      duration: '',
      customerName: '',
      customerMobile: '',
      category: '',
      bdmRemarks: ''
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=travel_report_${bdmId}_${moment(targetDate).format('YYYY-MM-DD')}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);

  } catch (error) {
    console.error("Error generating travel report:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
 
 
 

//indivuals detail report 




// exports.getBdmTravelDetails = async (req, res) => {
//   try {
//     const { bdmId, date } = req.query;

//     if (!bdmId) {
//       return res.status(400).json({ message: "BDM ID is required" });
//     }

//     // Verify if BDM exists
//     const bdm = await Employee.findOne({
//       where: { 
//         EmployeeId: bdmId 
//       }
//     });

//     if (!bdm) {
//       return res.status(404).json({ message: "BDM not found" });
//     }

//     const targetDate = date ? new Date(date) : new Date();
//     targetDate.setHours(0, 0, 0, 0);
//     const nextDate = new Date(targetDate);
//     nextDate.setDate(nextDate.getDate() + 1);

//     // Get BDM's travel details
//     const travelDetails = await BdmTravelDetail.findAll({
//       where: {
//         bdm_id: bdmId,  // Filter by BDM ID
//         checkin_time: {
//           [Sequelize.Op.between]: [targetDate, nextDate]
//         }
//       },
//       include: [
//         {
//           model: Employee,
//           as: 'Employee',
//           where: { EmployeeId: bdmId }, // Additional filter at Employee level
//           attributes: ['EmployeeId', 'EmployeeName']
//         },
//         {
//           model: Lead_Detail,
//           as: 'LeadDetail',
//           required: false, // Left join as not all travel details might have leads
//           where: { BDMId: bdmId }, // Filter leads by BDM
//           attributes: [
//             'id',
//             'CustomerName',
//             'MobileNo',
//             'region_name',
//             'location',
//             'category',
//             'bdm_remark',
//             'close_month',
//             'site_location_address'
//           ]
//         }
//       ],
//       order: [['checkin_time', 'ASC']]
//     });

//     if (travelDetails.length === 0) {
//       return res.status(200).json({
//         message: `No travel records found for BDM ID ${bdmId} on ${moment(targetDate).format('DD-MM-YYYY')}`,
//         bdmInfo: {
//           bdmId: bdm.EmployeeId,
//           bdmName: bdm.EmployeeName
//         },
//         summary: {
//           date: moment(targetDate).format('DD-MM-YYYY'),
//           totalLocations: 0,
//           totalDistance: 0
//         },
//         data: []
//       });
//     }

//     let lastLatitude = null;
//     let lastLongitude = null;
//     let totalDistance = 0;

//     const formattedDetails = await Promise.all(travelDetails.map(async (detail, index) => {
//       const [checkinAddress, checkoutAddress] = await Promise.all([
//         getAddressFromCoordinates(detail.checkin_latitude, detail.checkin_longitude),
//         detail.checkout_latitude ? getAddressFromCoordinates(detail.checkout_latitude, detail.checkout_longitude) : null
//       ]);

//       // Calculate distance from last point
//       let distanceFromLast = 0;
//       if (index > 0 && detail.action !== 'Attendance In') {
//         distanceFromLast = calculateHaversineDistance(
//           parseFloat(lastLatitude),
//           parseFloat(lastLongitude),
//           parseFloat(detail.checkin_latitude),
//           parseFloat(detail.checkin_longitude)
//         );
//         distanceFromLast = +(distanceFromLast / 1000).toFixed(2);
//         totalDistance += distanceFromLast;
//       }

//       // Calculate checkin-checkout distance
//       let checkinCheckoutDistance = 'N/A';
//       if (detail.checkout_latitude && detail.checkout_longitude) {
//         if (detail.checkin_latitude === detail.checkout_latitude && 
//             detail.checkin_longitude === detail.checkout_longitude) {
//           checkinCheckoutDistance = 0;
//         } else {
//           const distance = calculateHaversineDistance(
//             parseFloat(detail.checkin_latitude),
//             parseFloat(detail.checkin_longitude),
//             parseFloat(detail.checkout_latitude),
//             parseFloat(detail.checkout_longitude)
//           );
//           checkinCheckoutDistance = +(distance / 1000).toFixed(2);
//         }
//       }

//       // Calculate duration
//       let duration = null;
//       if (detail.checkout_time) {
//         duration = Math.round((new Date(detail.checkout_time) - new Date(detail.checkin_time)) / (1000 * 60));
//       }

//       lastLatitude = detail.checkin_latitude;
//       lastLongitude = detail.checkin_longitude;

//       return {
//         id: detail.id,
//         employeeInfo: {
//           employeeId: detail.bdm_id,
//           employeeName: detail.Employee?.EmployeeName
//         },
//         leadInfo: detail.LeadDetail ? {
//           leadId: detail.LeadDetail.id,
//           customerName: detail.LeadDetail.CustomerName,
//           mobileNo: detail.LeadDetail.MobileNo,
//           region: detail.LeadDetail.region_name,
//           location: detail.LeadDetail.location,
//           siteLocation: detail.LeadDetail.site_location_address,
//           category: detail.LeadDetail.category,
//           bdmRemark: detail.LeadDetail.bdm_remark,
//           closeMonth: detail.LeadDetail.close_month
//         } : null,
//         travelInfo: {
//           action: detail.action,
//           checkin: {
//             time: moment(detail.checkin_time).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
//             location: {
//               latitude: detail.checkin_latitude,
//               longitude: detail.checkin_longitude,
//               address: checkinAddress.address
//             }
//           },
//           checkout: detail.checkout_time ? {
//             time: moment(detail.checkout_time).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
//             location: {
//               latitude: detail.checkout_latitude,
//               longitude: detail.checkout_longitude,
//               address: checkoutAddress?.address || 'N/A'
//             }
//           } : null,
//           distances: {
//             fromLastPoint: distanceFromLast,
//             checkinToCheckout: checkinCheckoutDistance
//           },
//           duration: duration ? {
//             minutes: duration,
//             formatted: `${Math.floor(duration / 60)} hours ${duration % 60} minutes`
//           } : null
//         }
//       };
//     }));

//     res.status(200).json({
//       message: "Travel details retrieved successfully",
//       bdmInfo: {
//         bdmId: bdm.EmployeeId,
//         bdmName: bdm.EmployeeName
//       },
//       summary: {
//         date: moment(targetDate).format('DD-MM-YYYY'),
//         totalLocations: travelDetails.length,
//         totalDistance: +totalDistance.toFixed(2)
//       },
//       data: formattedDetails
//     });

//   } catch (error) {
//     console.error("Error fetching travel details:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };




// exports.getBdmTravelDetails = async (req, res) => {
//   try {
//     const { bdmId, date } = req.query;

//     if (!bdmId) {
//       return res.status(400).json({ message: "BDM ID is required" });
//     }

  

//     // Verify if BDM exists
//     const bdm = await Employee.findOne({
//       where: { 
//         EmployeeId: bdmId
//       }
//     });

//     if (!bdm) {
//       return res.status(404).json({ message: "BDM not found" });
//     }

//     const targetDate = date ? new Date(date) : new Date();
//     targetDate.setHours(0, 0, 0, 0);
//     const nextDate = new Date(targetDate);
//     nextDate.setDate(nextDate.getDate() + 1);

//     // Get BDM's travel details
//     const travelDetails = await BdmTravelDetail.findAll({
//       where: {
//         bdm_id: bdmId,
//         checkin_time: {
//           [Sequelize.Op.between]: [targetDate, nextDate]
//         }
//       },
//       include: [
//         {
//           model: Employee,
//           as: 'Employee',
//           where: { EmployeeId: bdmId },
//           attributes: ['EmployeeId', 'EmployeeName']
//         },
//         {
//           model: Lead_Detail,
//           as: 'LeadDetail',
//           required: false,
//           where: { BDMId: bdmId },
//           attributes: [
//             'id',
//             'CustomerName',
//             'MobileNo',
//             'region_name',
//             'location',
//             'category',
//             'bdm_remark',
//             'close_month',
//             'site_location_address'
//           ]
//         }
//       ],
//       order: [['checkin_time', 'ASC']]
//     });

//     if (travelDetails.length === 0) {
//       return res.status(200).json({
//         message: `No travel records found for BDM ID ${bdmId} on ${moment(targetDate).format('DD-MM-YYYY')}`,
//         bdmInfo: {
//           bdmId: bdm.EmployeeId,
//           bdmName: bdm.EmployeeName
//         },
//         summary: {
//           date: moment(targetDate).format('DD-MM-YYYY'),
//           totalLocations: 0,
//           totalDistance: 0
//         },
//         data: []
//       });
//     }

//     let lastLatitude = null;
//     let lastLongitude = null;
//     let totalDistance = 0;

//     const formattedDetails = await Promise.all(travelDetails.map(async (detail, index) => {
//       // Add delay to respect Nominatim's usage policy
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       const [checkinAddress, checkoutAddress] = await Promise.all([
//         getAddressFromCoordinates(detail.checkin_latitude, detail.checkin_longitude),
//         detail.checkout_latitude ? getAddressFromCoordinates(detail.checkout_latitude, detail.checkout_longitude) : null
//       ]);

//       // Calculate distance from last point
//       let distanceFromLast = 0;
//       if (index > 0 && detail.action !== 'Attendance In') {
//         distanceFromLast = calculateHaversineDistance(
//           parseFloat(lastLatitude),
//           parseFloat(lastLongitude),
//           parseFloat(detail.checkin_latitude),
//           parseFloat(detail.checkin_longitude)
//         );
//         distanceFromLast = +(distanceFromLast / 1000).toFixed(2); // Convert to km
//         totalDistance += distanceFromLast;
//       }

//       // Calculate checkin-checkout distance
//       let checkinCheckoutDistance = 'N/A';
//       if (detail.checkout_latitude && detail.checkout_longitude) {
//         if (detail.checkin_latitude === detail.checkout_latitude && 
//             detail.checkin_longitude === detail.checkout_longitude) {
//           checkinCheckoutDistance = 0;
//         } else {
//           const distance = calculateHaversineDistance(
//             parseFloat(detail.checkin_latitude),
//             parseFloat(detail.checkin_longitude),
//             parseFloat(detail.checkout_latitude),
//             parseFloat(detail.checkout_longitude)
//           );
//           checkinCheckoutDistance = +(distance / 1000).toFixed(2);
//         }
//       }

//       // Calculate duration
//       let duration = null;
//       if (detail.checkout_time) {
//         duration = Math.round((new Date(detail.checkout_time) - new Date(detail.checkin_time)) / (1000 * 60));
//       }

//       // Update last coordinates for next iteration
//       lastLatitude = detail.checkin_latitude;
//       lastLongitude = detail.checkin_longitude;

//       return {
//         id: detail.id,
//         employeeInfo: {
//           employeeId: detail.bdm_id,
//           employeeName: detail.Employee?.EmployeeName
//         },
//         leadInfo: detail.LeadDetail ? {
//           leadId: detail.LeadDetail.id,
//           customerName: detail.LeadDetail.CustomerName,
//           mobileNo: detail.LeadDetail.MobileNo,
//           region: detail.LeadDetail.region_name,
//           location: detail.LeadDetail.location,
//           siteLocation: detail.LeadDetail.site_location_address,
//           category: detail.LeadDetail.category,
//           bdmRemark: detail.LeadDetail.bdm_remark,
//           closeMonth: detail.LeadDetail.close_month
//         } : null,
//         travelInfo: {
//           action: detail.action,
//           checkin: {
//             time: moment(detail.checkin_time).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
//             location: {
//               latitude: detail.checkin_latitude,
//               longitude: detail.checkin_longitude,
//               address: checkinAddress.address
//             }
//           },
//           checkout: detail.checkout_time ? {
//             time: moment(detail.checkout_time).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
//             location: {
//               latitude: detail.checkout_latitude,
//               longitude: detail.checkout_longitude,
//               address: checkoutAddress?.address || 'N/A'
//             }
//           } : null,
//           distances: {
//             fromLastPoint: detail.action === 'Attendance In' ? 0 : distanceFromLast,
//             checkinToCheckout: checkinCheckoutDistance
//           },
//           duration: duration ? {
//             minutes: duration,
//             formatted: `${Math.floor(duration / 60)} hours ${duration % 60} minutes`
//           } : null
//         }
//       };
//     }));

//     // Ensure total distance is properly rounded
//     totalDistance = +totalDistance.toFixed(2);

//     res.status(200).json({
//       message: "Travel details retrieved successfully",
//       bdmInfo: {
//         bdmId: bdm.EmployeeId,
//         bdmName: bdm.EmployeeName
//       },
//       summary: {
//         date: moment(targetDate).format('DD-MM-YYYY'),
//         totalLocations: travelDetails.length,
//         totalDistance: totalDistance
//       },
//       data: formattedDetails
//     });

//   } catch (error) {
//     console.error("Error fetching travel details:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };













// const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// exports.getBdmTravelDetails = async (req, res) => {
//   try {
//     const { bdmId, date } = req.query;

//     if (!bdmId) {
//       return res.status(400).json({ message: "BDM ID is required" });
//     }

//     // Verify if BDM exists
//     const bdm = await Employee.findOne({
//       where: { 
//         EmployeeId: bdmId 
//       }
//     });

//     if (!bdm) {
//       return res.status(404).json({ message: "BDM not found" });
//     }

//     const targetDate = date ? new Date(date) : new Date();
//     targetDate.setHours(0, 0, 0, 0);
//     const nextDate = new Date(targetDate);
//     nextDate.setDate(nextDate.getDate() + 1);

//     // Get BDM's travel details
//     const travelDetails = await BdmTravelDetail.findAll({
//       where: {
//         bdm_id: bdmId,
//         checkin_time: {
//           [Sequelize.Op.between]: [targetDate, nextDate]
//         }
//       },
//       include: [
//         {
//           model: Employee,
//           as: 'Employee',
//           where: { EmployeeId: bdmId },
//           attributes: ['EmployeeId', 'EmployeeName']
//         },
//         {
//           model: Lead_Detail,
//           as: 'LeadDetail',
//           required: false,
//           where: { BDMId: bdmId },
//           attributes: [
//             'id',
//             'CustomerName',
//             'MobileNo',
//             'region_name',
//             'location',
//             'category',
//             'bdm_remark',
//             'close_month',
//             'site_location_address'
//           ]
//         }
//       ],
//       order: [['checkin_time', 'ASC']]
//     });

//     if (travelDetails.length === 0) {
//       return res.status(200).json({
//         message: `No travel records found for BDM ID ${bdmId} on ${moment(targetDate).format('DD-MM-YYYY')}`,
//         bdmInfo: {
//           bdmId: bdm.EmployeeId,
//           bdmName: bdm.EmployeeName
//         },
//         summary: {
//           date: moment(targetDate).format('DD-MM-YYYY'),
//           totalLocations: 0,
//           totalDistance: 0
//         },
//         data: []
//       });
//     }

//     // Initialize tracking variables
//     let totalDistance = 0;
//     let lastNonAttendancePoint = null;
//     let lastValidLocation = null;

//     const formattedDetails = await Promise.all(travelDetails.map(async (detail, index) => {
//       // Add delay for Nominatim API
//       await sleep(1000);

//       const [checkinAddress, checkoutAddress] = await Promise.all([
//         getAddressFromCoordinates(detail.checkin_latitude, detail.checkin_longitude),
//         detail.checkout_latitude ? getAddressFromCoordinates(detail.checkout_latitude, detail.checkout_longitude) : null
//       ]);

//       // Calculate distance from last valid point
//       let distanceFromLast = 0;
//       const isAttendanceAction = detail.action.toLowerCase().includes('attendance');

//       if (!isAttendanceAction) {
//         if (lastValidLocation) {
//           // Calculate distance from last valid location
//           distanceFromLast = calculateHaversineDistance(
//             parseFloat(lastValidLocation.latitude),
//             parseFloat(lastValidLocation.longitude),
//             parseFloat(detail.checkin_latitude),
//             parseFloat(detail.checkin_longitude)
//           );
//           distanceFromLast = +(distanceFromLast / 1000).toFixed(2); // Convert to km
//           if (distanceFromLast > 0) {
//             totalDistance += distanceFromLast;
//           }
//         }
        
//         // Update last valid location
//         lastValidLocation = {
//           latitude: detail.checkin_latitude,
//           longitude: detail.checkin_longitude
//         };
//         lastNonAttendancePoint = detail;
//       }

//       // Calculate checkin-checkout distance
//       let checkinCheckoutDistance = 'N/A';
//       if (detail.checkout_latitude && detail.checkout_longitude) {
//         if (detail.checkin_latitude === detail.checkout_latitude && 
//             detail.checkin_longitude === detail.checkout_longitude) {
//           checkinCheckoutDistance = 0;
//         } else {
//           const distance = calculateHaversineDistance(
//             parseFloat(detail.checkin_latitude),
//             parseFloat(detail.checkin_longitude),
//             parseFloat(detail.checkout_latitude),
//             parseFloat(detail.checkout_longitude)
//           );
//           checkinCheckoutDistance = +(distance / 1000).toFixed(2);
//         }
//       }

//       // Calculate duration
//       let duration = null;
//       if (detail.checkout_time) {
//         duration = Math.round((new Date(detail.checkout_time) - new Date(detail.checkin_time)) / (1000 * 60));
//       }

//       return {
//         id: detail.id,
//         employeeInfo: {
//           employeeId: detail.bdm_id,
//           employeeName: detail.Employee?.EmployeeName
//         },
//         leadInfo: detail.LeadDetail ? {
//           leadId: detail.LeadDetail.id,
//           customerName: detail.LeadDetail.CustomerName,
//           mobileNo: detail.LeadDetail.MobileNo,
//           region: detail.LeadDetail.region_name,
//           location: detail.LeadDetail.location,
//           siteLocation: detail.LeadDetail.site_location_address,
//           category: detail.LeadDetail.category,
//           bdmRemark: detail.LeadDetail.bdm_remark,
//           closeMonth: detail.LeadDetail.close_month
//         } : null,
//         travelInfo: {
//           action: detail.action,
//           checkin: {
//             time: moment(detail.checkin_time).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
//             location: {
//               latitude: detail.checkin_latitude,
//               longitude: detail.checkin_longitude,
//               address: checkinAddress.address,
//               city: checkinAddress.city
//             }
//           },
//           checkout: detail.checkout_time ? {
//             time: moment(detail.checkout_time).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
//             location: {
//               latitude: detail.checkout_latitude,
//               longitude: detail.checkout_longitude,
//               address: checkoutAddress?.address || 'N/A',
//               city: checkoutAddress?.city || 'N/A'
//             }
//           } : null,
//           distances: {
//             fromLastPoint: isAttendanceAction ? 0 : distanceFromLast,
//             checkinToCheckout: checkinCheckoutDistance
//           },
//           duration: duration ? {
//             minutes: duration,
//             formatted: `${Math.floor(duration / 60)} hours ${duration % 60} minutes`
//           } : null
//         }
//       };
//     }));

//     // Calculate final distance for the last non-attendance point if it has checkout
//     if (lastNonAttendancePoint && 
//         lastNonAttendancePoint.checkout_latitude && 
//         lastNonAttendancePoint.checkout_longitude &&
//         (lastNonAttendancePoint.checkin_latitude !== lastNonAttendancePoint.checkout_latitude ||
//          lastNonAttendancePoint.checkin_longitude !== lastNonAttendancePoint.checkout_longitude)) {
      
//       const finalDistance = calculateHaversineDistance(
//         parseFloat(lastNonAttendancePoint.checkin_latitude),
//         parseFloat(lastNonAttendancePoint.checkin_longitude),
//         parseFloat(lastNonAttendancePoint.checkout_latitude),
//         parseFloat(lastNonAttendancePoint.checkout_longitude)
//       );
//       const finalDistanceKm = +(finalDistance / 1000).toFixed(2);
//       if (finalDistanceKm > 0) {
//         totalDistance += finalDistanceKm;
//       }
//     }

//     // Ensure total distance is properly rounded
//     totalDistance = +totalDistance.toFixed(2);

//     res.status(200).json({
//       message: "Travel details retrieved successfully",
//       bdmInfo: {
//         bdmId: bdm.EmployeeId,
//         bdmName: bdm.EmployeeName
//       },
//       summary: {
//         date: moment(targetDate).format('DD-MM-YYYY'),
//         totalLocations: travelDetails.length,
//         totalDistance: totalDistance
//       },
//       data: formattedDetails
//     });

//   } catch (error) {
//     console.error("Error fetching travel details:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };

 


exports.getBdmTravelDetails = async (req, res) => {
  try {
    const { bdmId, date } = req.query;

    if (!bdmId) {
      return res.status(400).json({ message: "BDM ID is required" });
    }

    // Verify if BDM exists
    const bdm = await Employee.findOne({
      where: { 
        EmployeeId: bdmId 
      }
    });

    if (!bdm) {
      return res.status(404).json({ message: "BDM not found" });
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Get BDM's travel details
    const travelDetails = await BdmTravelDetail.findAll({
      where: {
        bdm_id: bdmId,
        checkin_time: {
          [Sequelize.Op.between]: [targetDate, nextDate]
        }
      },
      include: [
        {
          model: Employee,
          as: 'Employee',
          where: { EmployeeId: bdmId },
          attributes: ['EmployeeId', 'EmployeeName']
        },
        {
          model: Lead_Detail,
          as: 'LeadDetail',
          required: false,
          where: { BDMId: bdmId },
          attributes: [
            'id',
            'CustomerName',
            'MobileNo',
            'region_name',
            'location',
            'category',
            'bdm_remark',
            'close_month',
            'site_location_address'
          ]
        }
      ],
      order: [['checkin_time', 'ASC']]
    });

    if (travelDetails.length === 0) {
      return res.status(200).json({
        message: `No travel records found for BDM ID ${bdmId} on ${moment(targetDate).format('DD-MM-YYYY')}`,
        bdmInfo: {
          bdmId: bdm.EmployeeId,
          bdmName: bdm.EmployeeName
        },
        summary: {
          date: moment(targetDate).format('DD-MM-YYYY'),
          totalLocations: 0,
          totalDistance: 0
        },
        data: []
      });
    }

    // Find Attendance In point to start distance calculation
    let attendanceInIndex = travelDetails.findIndex(detail => 
      detail.action.toLowerCase().includes('attendance in')
    );
    
    // If no Attendance In found, start from first point
    if (attendanceInIndex === -1) attendanceInIndex = 0;

    let lastValidPoint = travelDetails[attendanceInIndex];
    let totalDistance = 0;

    const formattedDetails = travelDetails.map((detail, index) => {
      let distanceFromLast = 0;
      
      // Calculate distance if this isn't the first point and not an Attendance Out
      if (index > attendanceInIndex && !detail.action.toLowerCase().includes('attendance out')) {
        distanceFromLast = calculateHaversineDistance(
          parseFloat(lastValidPoint.checkin_latitude),
          parseFloat(lastValidPoint.checkin_longitude),
          parseFloat(detail.checkin_latitude),
          parseFloat(detail.checkin_longitude)
        );
        distanceFromLast = +(distanceFromLast / 1000).toFixed(2); // Convert to km
        
        if (distanceFromLast > 0) {
          totalDistance += distanceFromLast;
        }
      }

      // Update last valid point if this isn't an Attendance Out
      if (!detail.action.toLowerCase().includes('attendance out')) {
        lastValidPoint = detail;
      }

      // Calculate checkin-checkout distance
      let checkinCheckoutDistance = 'N/A';
      if (detail.checkout_latitude && detail.checkout_longitude) {
        if (detail.checkin_latitude === detail.checkout_latitude && 
            detail.checkin_longitude === detail.checkout_longitude) {
          checkinCheckoutDistance = 0;
        } else {
          const distance = calculateHaversineDistance(
            parseFloat(detail.checkin_latitude),
            parseFloat(detail.checkin_longitude),
            parseFloat(detail.checkout_latitude),
            parseFloat(detail.checkout_longitude)
          );
          checkinCheckoutDistance = +(distance / 1000).toFixed(2);
        }
      }

      // Calculate duration
      let duration = null;
      if (detail.checkout_time) {
        duration = Math.round((new Date(detail.checkout_time) - new Date(detail.checkin_time)) / (1000 * 60));
      }

      return {
        id: detail.id,
        employeeInfo: {
          employeeId: detail.bdm_id,
          employeeName: detail.Employee?.EmployeeName
        },
        leadInfo: detail.LeadDetail ? {
          leadId: detail.LeadDetail.id,
          customerName: detail.LeadDetail.CustomerName,
          mobileNo: detail.LeadDetail.MobileNo,
          region: detail.LeadDetail.region_name,
          location: detail.LeadDetail.location,
          siteLocation: detail.LeadDetail.site_location_address,
          category: detail.LeadDetail.category,
          bdmRemark: detail.LeadDetail.bdm_remark,
          closeMonth: detail.LeadDetail.close_month
        } : null,
        travelInfo: {
          action: detail.action,
          checkin: {
            time: moment(detail.checkin_time).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
            location: {
              latitude: detail.checkin_latitude,
              longitude: detail.checkin_longitude,
              address: null,
              city: null
            }
          },
          checkout: detail.checkout_time ? {
            time: moment(detail.checkout_time).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
            location: {
              latitude: detail.checkout_latitude,
              longitude: detail.checkout_longitude,
              address: null,
              city: null
            }
          } : null,
          distances: {
            fromLastPoint: distanceFromLast,
            checkinToCheckout: checkinCheckoutDistance
          },
          duration: duration ? {
            minutes: duration,
            formatted: `${Math.floor(duration / 60)} hours ${duration % 60} minutes`
          } : null
        }
      };
    });

    // Ensure total distance is properly rounded
    totalDistance = +totalDistance.toFixed(2);

    res.status(200).json({
      message: "Travel details retrieved successfully",
      bdmInfo: {
        bdmId: bdm.EmployeeId,
        bdmName: bdm.EmployeeName
      },
      summary: {
        date: moment(targetDate).format('DD-MM-YYYY'),
        totalLocations: travelDetails.length,
        totalDistance: totalDistance
      },
      data: formattedDetails
    });

  } catch (error) {
    console.error("Error fetching travel details:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

//leave apply

// Create a new leave request
exports.createLeave = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      employeeId,
      leaveType,
      startDate,
      endDate,
      remarks
    } = req.body;
    
    // Validate required fields
    if (!employeeId || !leaveType || !startDate || !endDate) {
      return res.status(400).json({
        message: "Missing required fields. employeeId, leaveType, startDate, and endDate are required"
      });
    }
    
    // Validate leave type
    const validLeaveTypes = ['PAID_LEAVE', 'REGIONAL_HOLIDAY', 'SICK_LEAVE', 'UNPAID_LEAVE'];
    if (!validLeaveTypes.includes(leaveType)) {
      return res.status(400).json({
        message: "Invalid leave type. Must be one of: PAID_LEAVE, REGIONAL_HOLIDAY, SICK_LEAVE, UNPAID_LEAVE"
      });
    }
    
    // Convert dates to Date objects
    let parsedStartDate = new Date(startDate);
    let parsedEndDate = new Date(endDate);
    
    // Validate date range
    if (parsedEndDate < parsedStartDate) {
      return res.status(400).json({
        message: "End date cannot be earlier than start date"
      });
    }
    
    // Check if employee exists
    const employee = await Employee.findOne({
      where: {
        EmployeeId: employeeId
      }
    });
    
    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }
    
    // Find overlapping leaves
    const overlappingLeaves = await Leave.findAll({
      where: {
        EmployeeId: employeeId,
        [Sequelize.Op.or]: [
          {
            StartDate: {
              [Sequelize.Op.between]: [parsedStartDate, parsedEndDate]
            }
          },
          {
            EndDate: {
              [Sequelize.Op.between]: [parsedStartDate, parsedEndDate]
            }
          },
          {
            [Sequelize.Op.and]: [
              { StartDate: { [Sequelize.Op.lte]: parsedStartDate } },
              { EndDate: { [Sequelize.Op.gte]: parsedEndDate } }
            ]
          }
        ]
      },
      order: [['EndDate', 'DESC']]
    });
    
    // If we have overlaps, adjust the dates
    if (overlappingLeaves.length > 0) {
      // Find the latest end date among all overlapping leaves
      const latestEndDate = new Date(Math.max(
        ...overlappingLeaves.map(leave => new Date(leave.EndDate).getTime())
      ));
      
      // Add one day to get the next available date
      const nextAvailableDate = new Date(latestEndDate);
      nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);
      
      // If next available date is after or equal to the requested end date, 
      // then the leave is completely covered already
      if (nextAvailableDate >= parsedEndDate) {
        return res.status(409).json({
          message: "Your leave request period is already covered by existing approved leave",
          existingLeaves: overlappingLeaves
        });
      }
      
      // Check if we need to adjust the start date
      if (nextAvailableDate > parsedStartDate) {
        parsedStartDate = nextAvailableDate;
      }
    }
    
    // Create leave record with potentially adjusted dates
    const leave = await Leave.create({
      EmployeeId: employeeId,
      LeaveType: leaveType,
      StartDate: parsedStartDate,
      EndDate: parsedEndDate,
      Remarks: remarks || null
    }, { transaction });
    
    await transaction.commit();
    
    // Check if dates were adjusted
    const datesAdjusted = parsedStartDate.toISOString() !== new Date(startDate).toISOString();
    
    res.status(201).json({
      message: datesAdjusted 
        ? "Leave request created with adjusted start date to avoid overlap with existing leave" 
        : "Leave request created successfully",
      datesAdjusted,
      originalStartDate: new Date(startDate),
      adjustedStartDate: datesAdjusted ? parsedStartDate : null,
      leave
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating leave request:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update leave details
exports.updateLeave = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { leaveId } = req.params;
    const {
      leaveType,
      startDate,
      endDate,
      remarks
    } = req.body;
    
    if (!leaveId) {
      return res.status(400).json({
        message: "Leave ID is required"
      });
    }
    
    const leave = await Leave.findByPk(leaveId);
    
    if (!leave) {
      return res.status(404).json({
        message: "Leave not found"
      });
    }
    
    // Prepare update object
    const updateData = {};
    
    if (leaveType) {
      const validLeaveTypes = ['PAID_LEAVE', 'REGIONAL_HOLIDAY', 'SICK_LEAVE', 'UNPAID_LEAVE'];
      if (!validLeaveTypes.includes(leaveType)) {
        return res.status(400).json({
          message: "Invalid leave type. Must be one of: PAID_LEAVE, REGIONAL_HOLIDAY, SICK_LEAVE, UNPAID_LEAVE"
        });
      }
      updateData.LeaveType = leaveType;
    }
    
    let parsedStartDate = leave.StartDate;
    let parsedEndDate = leave.EndDate;
    let originalStartDate = null;
    let datesAdjusted = false;
    
    if (startDate) {
      originalStartDate = new Date(startDate);
      parsedStartDate = new Date(startDate);
      updateData.StartDate = parsedStartDate;
    }
    
    if (endDate) {
      parsedEndDate = new Date(endDate);
      updateData.EndDate = parsedEndDate;
    }
    
    // Validate date range
    if (parsedEndDate < parsedStartDate) {
      return res.status(400).json({
        message: "End date cannot be earlier than start date"
      });
    }
    
    if (remarks !== undefined) {
      updateData.Remarks = remarks;
    }
    
    // Check for overlapping leave if dates are changed
    if (startDate || endDate) {
      // Find overlapping leaves
      const overlappingLeaves = await Leave.findAll({
        where: {
          EmployeeId: leave.EmployeeId,
          id: { [Sequelize.Op.ne]: leaveId }, // Exclude current leave
          [Sequelize.Op.or]: [
            {
              StartDate: {
                [Sequelize.Op.between]: [parsedStartDate, parsedEndDate]
              }
            },
            {
              EndDate: {
                [Sequelize.Op.between]: [parsedStartDate, parsedEndDate]
              }
            },
            {
              [Sequelize.Op.and]: [
                { StartDate: { [Sequelize.Op.lte]: parsedStartDate } },
                { EndDate: { [Sequelize.Op.gte]: parsedEndDate } }
              ]
            }
          ]
        },
        order: [['EndDate', 'DESC']]
      });
    
      // If we have overlaps, adjust the dates
      if (overlappingLeaves.length > 0) {
        // Find the latest end date among all overlapping leaves
        const latestEndDate = new Date(Math.max(
          ...overlappingLeaves.map(leave => new Date(leave.EndDate).getTime())
        ));
        
        // Add one day to get the next available date
        const nextAvailableDate = new Date(latestEndDate);
        nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);
        
        // If next available date is after or equal to the requested end date, 
        // then the leave is completely covered already
        if (nextAvailableDate >= parsedEndDate) {
          return res.status(409).json({
            message: "Your leave request period is already covered by existing approved leave",
            existingLeaves: overlappingLeaves
          });
        }
        
        // Check if we need to adjust the start date
        if (nextAvailableDate > parsedStartDate) {
          parsedStartDate = nextAvailableDate;
          updateData.StartDate = parsedStartDate;
          datesAdjusted = true;
        }
      }
    }
    
    // Update leave record
    await leave.update(updateData, { transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      message: datesAdjusted 
        ? "Leave updated with adjusted start date to avoid overlap with existing leave" 
        : "Leave updated successfully",
      datesAdjusted,
      originalStartDate: originalStartDate,
      adjustedStartDate: datesAdjusted ? parsedStartDate : null,
      leave
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating leave:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all leaves for an employee
exports.getEmployeeLeaves = async (req, res) => {
  try {
    const { employeeId } =  req.query; 
    
    if (!employeeId) {
      return res.status(400).json({
        message: "Employee ID is required"
      });
    }
    
    const leaves = await Leave.findAll({
      where: {
        EmployeeId: employeeId
      },
      order: [['StartDate', 'DESC']]
    });
    
    res.status(200).json({
      message: "Employee leaves retrieved successfully",
      count: leaves.length,
      leaves
    });
    
  } catch (error) {
    console.error("Error retrieving employee leaves:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get leave details by ID
exports.getLeaveById = async (req, res) => {
  try {
    const { leaveId } = req.params;
    
    if (!leaveId) {
      return res.status(400).json({
        message: "Leave ID is required"
      });
    }
    
    const leave = await Leave.findByPk(leaveId);
    
    if (!leave) {
      return res.status(404).json({
        message: "Leave not found"
      });
    }
    
    res.status(200).json({
      message: "Leave retrieved successfully",
      leave
    });
    
  } catch (error) {
    console.error("Error retrieving leave:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Delete leave
exports.deleteLeave = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { leaveId } = req.params;
    
    if (!leaveId) {
      return res.status(400).json({
        message: "Leave ID is required"
      });
    }
    
    const leave = await Leave.findByPk(leaveId);
    
    if (!leave) {
      return res.status(404).json({
        message: "Leave not found"
      });
    }
    
    await leave.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      message: "Leave deleted successfully"
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting leave:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get monthly leave report for an employee
exports.getMonthlyLeaveReport = async (req, res) => {
  try {
    const { employeeId, year, month } = req.params;
    
    if (!employeeId || !year || !month) {
      return res.status(400).json({
        message: "Employee ID, year, and month are required"
      });
    }
    
    // Parse year and month as integers
    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);
    
    if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({
        message: "Invalid year or month format"
      });
    }
    
    // Calculate start and end dates for the month
    const startDate = new Date(parsedYear, parsedMonth - 1, 1);
    const endDate = new Date(parsedYear, parsedMonth, 0);
    
    const leaves = await Leave.findAll({
      where: {
        EmployeeId: employeeId,
        [Sequelize.Op.or]: [
          {
            StartDate: {
              [Sequelize.Op.between]: [startDate, endDate]
            }
          },
          {
            EndDate: {
              [Sequelize.Op.between]: [startDate, endDate]
            }
          },
          {
            [Sequelize.Op.and]: [
              { StartDate: { [Sequelize.Op.lte]: startDate } },
              { EndDate: { [Sequelize.Op.gte]: endDate } }
            ]
          }
        ]
      }
    });
    
    // Create a calendar for the month
    const daysInMonth = endDate.getDate();
    const calendar = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(parsedYear, parsedMonth - 1, day);
      
      // Check if this date falls within any leave period
      const leaveForDate = leaves.find(leave => {
        const leaveStart = new Date(leave.StartDate);
        const leaveEnd = new Date(leave.EndDate);
        return date >= leaveStart && date <= leaveEnd;
      });
      
      calendar.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.getDay(),
        isLeave: !!leaveForDate,
        leaveDetails: leaveForDate ? {
          id: leaveForDate.id,
          type: leaveForDate.LeaveType,
          remarks: leaveForDate.Remarks
        } : null
      });
    }
    
    // Calculate summary statistics
    const leaveTypeCounts = {};
    calendar.forEach(day => {
      if (day.isLeave && day.leaveDetails) {
        const leaveType = day.leaveDetails.type;
        leaveTypeCounts[leaveType] = (leaveTypeCounts[leaveType] || 0) + 1;
      }
    });
    
    const totalLeaveDays = calendar.filter(day => day.isLeave).length;
    
    res.status(200).json({
      message: "Monthly leave report retrieved successfully",
      year: parsedYear,
      month: parsedMonth,
      employeeId,
      totalLeaveDays,
      leaveBreakdown: leaveTypeCounts,
      calendar
    });
    
  } catch (error) {
    console.error("Error retrieving monthly leave report:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get combined monthly attendance and leave report
exports.getMonthlyCombinedReport = async (req, res) => {
  try {
    const { employeeId, year, month } = req.params;
    
    if (!employeeId || !year || !month) {
      return res.status(400).json({
        message: "Employee ID, year, and month are required"
      });
    }
    
    // Parse year and month as integers
    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);
    
    if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({
        message: "Invalid year or month format"
      });
    }
    
    // Calculate start and end dates for the month
    const startDate = new Date(parsedYear, parsedMonth - 1, 1);
    const endDate = new Date(parsedYear, parsedMonth, 0);
    
    // Fetch all attendance records for the month
    const attendanceRecords = await Attendance.findAll({
      where: {
        EmployeeId: employeeId,
        AttendanceDate: {
          [Sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['AttendanceDate', 'ASC']]
    });
    
    // Fetch all leave records for the month
    const leaves = await Leave.findAll({
      where: {
        EmployeeId: employeeId,
        [Sequelize.Op.or]: [
          {
            StartDate: {
              [Sequelize.Op.between]: [startDate, endDate]
            }
          },
          {
            EndDate: {
              [Sequelize.Op.between]: [startDate, endDate]
            }
          },
          {
            [Sequelize.Op.and]: [
              { StartDate: { [Sequelize.Op.lte]: startDate } },
              { EndDate: { [Sequelize.Op.gte]: endDate } }
            ]
          }
        ]
      }
    });
    
    // Create a calendar for the month
    const daysInMonth = endDate.getDate();
    const calendar = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(parsedYear, parsedMonth - 1, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Check if this date falls within any leave period
      const leaveForDate = leaves.find(leave => {
        const leaveStart = new Date(leave.StartDate);
        const leaveEnd = new Date(leave.EndDate);
        return date >= leaveStart && date <= leaveEnd;
      });
      
      // Check if employee was present on this day
      const dayAttendance = attendanceRecords.filter(record => 
        new Date(record.AttendanceDate).toISOString().split('T')[0] === dateString
      );
      
      // Determine day status
      let status = 'ABSENT';
      if (leaveForDate) {
        status = 'LEAVE';
      } else if (dayAttendance.length > 0) {
        status = 'PRESENT';
      }
      
      calendar.push({
        date: dateString,
        dayOfWeek: date.getDay(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        status,
        attendance: dayAttendance.length > 0 ? {
          id: dayAttendance[0].id,
          checkInTime: dayAttendance[0].AttendanceInTime,
          checkOutTime: dayAttendance[0].AttendanceOutTime
        } : null,
        leave: leaveForDate ? {
          id: leaveForDate.id,
          type: leaveForDate.LeaveType,
          remarks: leaveForDate.Remarks
        } : null
      });
    }
    
    // Calculate summary statistics
    const presentDays = calendar.filter(day => day.status === 'PRESENT').length;
    const absentDays = calendar.filter(day => day.status === 'ABSENT' && !day.isWeekend).length;
    const leaveDays = calendar.filter(day => day.status === 'LEAVE').length;
    const weekendDays = calendar.filter(day => day.isWeekend).length;
    
    // Break down leave types
    const leaveTypeCounts = {};
    calendar.forEach(day => {
      if (day.status === 'LEAVE' && day.leave) {
        const leaveType = day.leave.type;
        leaveTypeCounts[leaveType] = (leaveTypeCounts[leaveType] || 0) + 1;
      }
    });
    
    res.status(200).json({
      message: "Monthly combined report retrieved successfully",
      year: parsedYear,
      month: parsedMonth,
      employeeId,
      summary: {
        workingDays: daysInMonth - weekendDays,
        presentDays,
        absentDays,
        leaveDays,
        weekendDays,
        leaveBreakdown: leaveTypeCounts
      },
      calendar
    });
    
  } catch (error) {
    console.error("Error retrieving monthly combined report:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


// Get all employees on leave within a date range
 // Get all employees on leave within a date range
exports.getEmployeesOnLeave = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate required fields
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Both startDate and endDate are required"
      });
    }
    
    // Convert dates to Date objects
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    
    // Validate date range
    if (parsedEndDate < parsedStartDate) {
      return res.status(400).json({
        message: "End date cannot be earlier than start date"
      });
    }
    
    // Find all leaves that overlap with the given date range
    const leaves = await Leave.findAll({
      where: {
        [Sequelize.Op.or]: [
          {
            StartDate: {
              [Sequelize.Op.between]: [parsedStartDate, parsedEndDate]
            }
          },
          {
            EndDate: {
              [Sequelize.Op.between]: [parsedStartDate, parsedEndDate]
            }
          },
          {
            [Sequelize.Op.and]: [
              { StartDate: { [Sequelize.Op.lte]: parsedStartDate } },
              { EndDate: { [Sequelize.Op.gte]: parsedEndDate } }
            ]
          }
        ]
      },
      include: [
        {
          model: Employee,
          as: 'Employee',
          attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone', 'EmployeeMailId', 'EmployeeRegion']
        }
      ],
      order: [['StartDate', 'ASC']]
    });
    
    // Group leaves by date for easier viewing
    const leavesByDate = {};
    
    // Generate all dates in the range
    const currentDate = new Date(parsedStartDate);
    while (currentDate <= parsedEndDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      leavesByDate[dateString] = [];
      
      // Find leaves that include this date
      leaves.forEach(leave => {
        const leaveStart = new Date(leave.StartDate);
        const leaveEnd = new Date(leave.EndDate);
        
        if (currentDate >= leaveStart && currentDate <= leaveEnd) {
          leavesByDate[dateString].push({
            leaveId: leave.id,
            employeeId: leave.EmployeeId,
            employeeName: leave.Employee ? leave.Employee.EmployeeName : 'Unknown',
            employeeRegion: leave.Employee ? leave.Employee.EmployeeRegion : 'Unknown',
            leaveType: leave.LeaveType,
            fullLeaveRange: `${new Date(leave.StartDate).toISOString().split('T')[0]} to ${new Date(leave.EndDate).toISOString().split('T')[0]}`,
            remarks: leave.Remarks
          });
        }
      });
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Create summary statistics
    const totalLeaves = leaves.length;
    const uniqueEmployees = new Set(leaves.map(leave => leave.EmployeeId)).size;
    
    // Count leaves by type
    const leavesByType = {};
    leaves.forEach(leave => {
      if (!leavesByType[leave.LeaveType]) {
        leavesByType[leave.LeaveType] = 0;
      }
      leavesByType[leave.LeaveType]++;
    });
    
    // Count leaves by region
    const leavesByRegion = {};
    leaves.forEach(leave => {
      const region = leave.Employee?.EmployeeRegion || 'Unknown';
      if (!leavesByRegion[region]) {
        leavesByRegion[region] = 0;
      }
      leavesByRegion[region]++;
    });
    
    res.status(200).json({
      message: "Employees on leave retrieved successfully",
      dateRange: {
        start: parsedStartDate.toISOString().split('T')[0],
        end: parsedEndDate.toISOString().split('T')[0]
      },
      summary: {
        totalLeaveRequests: totalLeaves,
        uniqueEmployeesOnLeave: uniqueEmployees,
        leavesByType,
        leavesByRegion
      },
      leavesByDate,
      allLeaves: leaves.map(leave => ({
        leaveId: leave.id,
        employeeId: leave.EmployeeId,
        employeeName: leave.Employee ? leave.Employee.EmployeeName : 'Unknown',
        employeePhone: leave.Employee ? leave.Employee.EmployeePhone : 'Unknown',
        employeeRegion: leave.Employee ? leave.Employee.EmployeeRegion : 'Unknown',
        leaveType: leave.LeaveType,
        startDate: new Date(leave.StartDate).toISOString().split('T')[0],
        endDate: new Date(leave.EndDate).toISOString().split('T')[0],
        remarks: leave.Remarks
      }))
    });
    
  } catch (error) {
    console.error("Error retrieving employees on leave:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};





