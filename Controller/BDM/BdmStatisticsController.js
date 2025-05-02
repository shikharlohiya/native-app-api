/**
 * BDM Statistics Controller
 *
 * This controller provides APIs to retrieve statistics about BDM activities
 * including meetings, field visits, and various types of visits (RO, HO, BO).
 */

const { Sequelize, Op } = require('sequelize');
const BdmLeadAction = require('../../models/BdmLeadAction');
const Employee = require('../../models/employee');
const GroupMeeting = require('../../models/GroupMeeting');
const site_visit = require('../../models/site_visit');
const Lead_Detail = require('../../models/lead_detail');
const moment = require('moment');




// const MONTHLY_BDM_TARGETS = {
//   GROUP_MEETINGS: 5,
//   UNIQUE_FIELD_VISITS: 20,
//   UNIQUE_MEETINGS: 20
// };

// exports.getAllBdmStatistics = async (req, res) => {
//   try {
//     // Extract query parameters
//     const { startDate, endDate } = req.query;

//     // Validate required parameters
//     if (!startDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Start date and end date are required'
//       });
//     }

//     // Parse dates
//     const parsedStartDate = moment(startDate).startOf('day');
//     const parsedEndDate = moment(endDate).endOf('day');

//     if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid date format. Please use YYYY-MM-DD format.'
//       });
//     }

//     // Get all active BDMs
//     const bdms = await Employee.findAll({
//       where: {
//         EmployeeRoleID: 2, // Role ID 2 represents BDMs
//         is_active: true
//       },
//       attributes: ['EmployeeId', 'EmployeeName']
//     });

//     if (bdms.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'No active BDMs found'
//       });
//     }

//     // Date filter for queries
//     const dateFilter = {
//       [Op.between]: [parsedStartDate.toDate(), parsedEndDate.toDate()]
//     };

//     // Get statistics for each BDM
//     const bdmStats = await Promise.all(bdms.map(async (bdm) => {
//       // Get meeting statistics
//       const meetingStats = await BdmLeadAction.findAll({
//         attributes: [
//           [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_meetings'],
//           [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('LeadId'))), 'unique_meetings']
//         ],
//         where: {
//           BDMId: bdm.EmployeeId,
//           specific_action: 'Meeting',
//           action_date: dateFilter
//         },
//         raw: true
//       });

//       // Get total meeting count
//       const totalMeetingCount = await BdmLeadAction.count({
//         where: {
//           BDMId: bdm.EmployeeId,
//           specific_action: 'Meeting',
//           action_date: dateFilter
//         }
//       });

//       // Get field visit statistics
//       const fieldVisitStats = await site_visit.findAll({
//         attributes: [
//           [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_field_visits']
//         ],
//         where: {
//           BDMId: bdm.EmployeeId,
//           createdAt: dateFilter
//         },
//         raw: true
//       });

//       // Get unique site visit count
//       const uniqueSiteVisitCount = await site_visit.count({
//         where: {
//           BDMId: bdm.EmployeeId,
//           createdAt: dateFilter
//         },
//         distinct: true,
//         col: 'LeadDetailId'
//       });

//       // Get group meeting statistics
//       const groupMeetingStats = await GroupMeeting.findAll({
//         attributes: [
//           // Count unique group_id for actual meeting count
//           [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('group_id'))), 'meeting_count'],
//           // Count total rows for total customers in meetings
//           [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_customers']
//         ],
//         where: {
//           bdm_id: bdm.EmployeeId,
//           createdAt: dateFilter
//         },
//         raw: true
//       });

//       // Get visit statistics (RO, HO, BO)
//       const visitTypes = ['RO Visit', 'HO Visit', 'BO Visit'];
//       const visitStats = {};

//       for (const visitType of visitTypes) {
//         visitStats[visitType.replace(' ', '_').toLowerCase()] = await BdmLeadAction.count({
//           where: {
//             BDMId: bdm.EmployeeId,
//             specific_action: visitType,
//             action_date: dateFilter
//           }
//         });
//       }

//       // Calculate target achievement percentages
//       const achievementPercentages = {
//         group_meetings: {
//           target: MONTHLY_BDM_TARGETS.GROUP_MEETINGS,
//           achievement: groupMeetingStats[0]?.meeting_count || 0,  // Using unique group_id count
//           percentage: Math.round(((groupMeetingStats[0]?.meeting_count || 0) / MONTHLY_BDM_TARGETS.GROUP_MEETINGS) * 100)
//         },
//         unique_field_visits: {
//           target: MONTHLY_BDM_TARGETS.UNIQUE_FIELD_VISITS,
//           achievement: uniqueSiteVisitCount,
//           percentage: Math.round((uniqueSiteVisitCount / MONTHLY_BDM_TARGETS.UNIQUE_FIELD_VISITS) * 100)
//         },
//         unique_meetings: {
//           target: MONTHLY_BDM_TARGETS.UNIQUE_MEETINGS,
//           achievement: meetingStats[0]?.unique_meetings || 0,
//           percentage: Math.round(((meetingStats[0]?.unique_meetings || 0) / MONTHLY_BDM_TARGETS.UNIQUE_MEETINGS) * 100)
//         }
//       };

//       // Return statistics for this BDM
//       return {
//         bdm: {
//           id: bdm.EmployeeId,
//           name: bdm.EmployeeName
//         },
//         statistics: {
//           total_meetings: totalMeetingCount,
//           total_unique_meetings: meetingStats[0]?.unique_meetings || 0,
//           total_field_visits: fieldVisitStats[0]?.total_field_visits || 0,
//           total_unique_field_visits: uniqueSiteVisitCount,
//           group_meetings: {
//             unique_meetings: groupMeetingStats[0]?.meeting_count || 0,  // Number of unique meetings by group_id
//             total_customers: groupMeetingStats[0]?.total_customers || 0  // Total customers across all meetings
//           },
//           ...visitStats
//         },
//         targets: achievementPercentages,
//         performance_summary: {
//           overall_target_achievement: Math.round(
//             (
//               achievementPercentages.group_meetings.percentage +
//               achievementPercentages.unique_field_visits.percentage +
//               achievementPercentages.unique_meetings.percentage
//             ) / 3
//           )
//         }
//       };
//     }));

//     // Calculate summary statistics across all BDMs
//     const summary = {
//       total_meetings: 0,
//       total_unique_meetings: 0,
//       total_field_visits: 0,
//       total_unique_field_visits: 0,
//       total_group_meetings: 0,
//       ro_visit: 0,
//       ho_visit: 0,
//       bo_visit: 0
//     };

//     bdmStats.forEach(bdm => {
//       summary.total_meetings += bdm.statistics.total_meetings;
//       summary.total_unique_meetings += bdm.statistics.total_unique_meetings;
//       summary.total_field_visits += bdm.statistics.total_field_visits;
//       summary.total_unique_field_visits += bdm.statistics.total_unique_field_visits;
//       summary.total_group_meetings += bdm.statistics.total_group_meetings;
//       summary.ro_visit += bdm.statistics.ro_visit;
//       summary.ho_visit += bdm.statistics.ho_visit;
//       summary.bo_visit += bdm.statistics.bo_visit;
//     });

//     // Prepare response
//     const response = {
//       success: true,
//       data: {
//         date_range: {
//           start_date: parsedStartDate.format('YYYY-MM-DD'),
//           end_date: parsedEndDate.format('YYYY-MM-DD')
//         },
//         bdm_count: bdms.length,
//         summary: summary,
//         bdms: bdmStats
//       }
//     };

//     return res.status(200).json(response);
//   } catch (error) {
//     console.error('Error in getAllBdmStatistics:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

const MONTHLY_BDM_TARGETS = {
  GROUP_MEETINGS: 5,
  UNIQUE_FIELD_VISITS: 20,
  UNIQUE_MEETINGS: 20
};

exports.getAllBdmStatistics = async (req, res) => {
  try {
    // Extract query parameters
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Parse dates
    const parsedStartDate = moment(startDate).startOf('day');
    const parsedEndDate = moment(endDate).endOf('day');

    if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      });
    }

    // Calculate the number of months in the date range for target scaling
    const monthsInRange = parsedEndDate.diff(parsedStartDate, 'months', true);
    // Ensure we have at least one month for calculation purposes
    const targetMultiplier = Math.max(monthsInRange, 1);

    // Calculate scaled targets based on date range
    const scaledTargets = {
      GROUP_MEETINGS: Math.round(MONTHLY_BDM_TARGETS.GROUP_MEETINGS * targetMultiplier),
      UNIQUE_FIELD_VISITS: Math.round(MONTHLY_BDM_TARGETS.UNIQUE_FIELD_VISITS * targetMultiplier),
      UNIQUE_MEETINGS: Math.round(MONTHLY_BDM_TARGETS.UNIQUE_MEETINGS * targetMultiplier)
    };

    // Get all active BDMs
    const bdms = await Employee.findAll({
      where: {
        EmployeeRoleID: 2, // Role ID 2 represents BDMs
        is_active: true
      },
      attributes: ['EmployeeId', 'EmployeeName']
    });

    if (bdms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active BDMs found'
      });
    }

    // Date filter for queries
    const dateFilter = {
      [Op.between]: [parsedStartDate.toDate(), parsedEndDate.toDate()]
    };

    // Get statistics for each BDM
    const bdmStats = await Promise.all(bdms.map(async (bdm) => {
      // Get meeting statistics
      const meetingStats = await BdmLeadAction.findAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_meetings'],
          [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('LeadId'))), 'unique_meetings']
        ],
        where: {
          BDMId: bdm.EmployeeId,
          specific_action: 'Meeting',
          action_date: dateFilter
        },
        raw: true
      });

      // Get total meeting count
      const totalMeetingCount = await BdmLeadAction.count({
        where: {
          BDMId: bdm.EmployeeId,
          specific_action: 'Meeting',
          action_date: dateFilter
        }
      });

      // Get field visit statistics
      const fieldVisitStats = await site_visit.findAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_field_visits']
        ],
        where: {
          BDMId: bdm.EmployeeId,
          createdAt: dateFilter
        },
        raw: true
      });

      // Get unique site visit count
      const uniqueSiteVisitCount = await site_visit.count({
        where: {
          BDMId: bdm.EmployeeId,
          createdAt: dateFilter
        },
        distinct: true,
        col: 'LeadDetailId'
      });

      // Get group meeting statistics
      const groupMeetingStats = await GroupMeeting.findAll({
        attributes: [
          // Count unique group_id for actual meeting count
          [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('group_id'))), 'meeting_count'],
          // Count total rows for total customers in meetings
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_customers']
        ],
        where: {
          bdm_id: bdm.EmployeeId,
          createdAt: dateFilter
        },
        raw: true
      });

      // Get visit statistics (RO, HO, BO)
      const visitTypes = ['RO Visit', 'HO Visit', 'BO Visit'];
      const visitStats = {};

      for (const visitType of visitTypes) {
        visitStats[visitType.replace(' ', '_').toLowerCase()] = await BdmLeadAction.count({
          where: {
            BDMId: bdm.EmployeeId,
            specific_action: visitType,
            action_date: dateFilter
          }
        });
      }

      // Calculate target achievement percentages using scaled targets
      const achievementPercentages = {
        group_meetings: {
          target: scaledTargets.GROUP_MEETINGS,
          achievement: groupMeetingStats[0]?.meeting_count || 0,  // Using unique group_id count
          percentage: Math.round(((groupMeetingStats[0]?.meeting_count || 0) / scaledTargets.GROUP_MEETINGS) * 100)
        },
        unique_field_visits: {
          target: scaledTargets.UNIQUE_FIELD_VISITS,
          achievement: uniqueSiteVisitCount,
          percentage: Math.round((uniqueSiteVisitCount / scaledTargets.UNIQUE_FIELD_VISITS) * 100)
        },
        unique_meetings: {
          target: scaledTargets.UNIQUE_MEETINGS,
          achievement: meetingStats[0]?.unique_meetings || 0,
          percentage: Math.round(((meetingStats[0]?.unique_meetings || 0) / scaledTargets.UNIQUE_MEETINGS) * 100)
        }
      };

      // Return statistics for this BDM
      return {
        bdm: {
          id: bdm.EmployeeId,
          name: bdm.EmployeeName
        },
        statistics: {
          total_meetings: totalMeetingCount,
          total_unique_meetings: meetingStats[0]?.unique_meetings || 0,
          total_field_visits: fieldVisitStats[0]?.total_field_visits || 0,
          total_unique_field_visits: uniqueSiteVisitCount,
          group_meetings: {
            unique_meetings: groupMeetingStats[0]?.meeting_count || 0,  // Number of unique meetings by group_id
            total_customers: groupMeetingStats[0]?.total_customers || 0  // Total customers across all meetings
          },
          ...visitStats
        },
        targets: achievementPercentages,
        performance_summary: {
          overall_target_achievement: Math.round(
            (
              achievementPercentages.group_meetings.percentage +
              achievementPercentages.unique_field_visits.percentage +
              achievementPercentages.unique_meetings.percentage
            ) / 3
          )
        }
      };
    }));

    // Calculate summary statistics across all BDMs
    const summary = {
      total_meetings: 0,
      total_unique_meetings: 0,
      total_field_visits: 0,
      total_unique_field_visits: 0,
      total_group_meetings: 0,
      ro_visit: 0,
      ho_visit: 0,
      bo_visit: 0
    };

    // Track team achievements for target calculations
    const teamAchievements = {
      unique_meetings: 0,
      unique_field_visits: 0,
      group_meetings: 0
    };

    bdmStats.forEach(bdm => {
      summary.total_meetings += bdm.statistics.total_meetings;
      summary.total_unique_meetings += bdm.statistics.total_unique_meetings;
      summary.total_field_visits += bdm.statistics.total_field_visits;
      summary.total_unique_field_visits += bdm.statistics.total_unique_field_visits;
      summary.total_group_meetings += bdm.statistics.group_meetings.unique_meetings;
      summary.ro_visit += bdm.statistics.ro_visit;
      summary.ho_visit += bdm.statistics.ho_visit;
      summary.bo_visit += bdm.statistics.bo_visit;

      // Track team achievements for targets
      teamAchievements.unique_meetings += bdm.statistics.total_unique_meetings;
      teamAchievements.unique_field_visits += bdm.statistics.total_unique_field_visits;
      teamAchievements.group_meetings += bdm.statistics.group_meetings.unique_meetings;
    });

    // Calculate team targets
    const teamTargets = {
      unique_meetings: {
        target: scaledTargets.UNIQUE_MEETINGS * bdms.length,
        achievement: teamAchievements.unique_meetings,
        percentage: Math.round((teamAchievements.unique_meetings / (scaledTargets.UNIQUE_MEETINGS * bdms.length)) * 100)
      },
      unique_field_visits: {
        target: scaledTargets.UNIQUE_FIELD_VISITS * bdms.length,
        achievement: teamAchievements.unique_field_visits,
        percentage: Math.round((teamAchievements.unique_field_visits / (scaledTargets.UNIQUE_FIELD_VISITS * bdms.length)) * 100)
      },
      group_meetings: {
        target: scaledTargets.GROUP_MEETINGS * bdms.length,
        achievement: teamAchievements.group_meetings,
        percentage: Math.round((teamAchievements.group_meetings / (scaledTargets.GROUP_MEETINGS * bdms.length)) * 100)
      },
      overall_target_achievement: 0
    };

    // Calculate overall team target achievement
    teamTargets.overall_target_achievement = Math.round(
      (
        teamTargets.unique_meetings.percentage +
        teamTargets.unique_field_visits.percentage +
        teamTargets.group_meetings.percentage
      ) / 3
    );

    // Prepare response
    const response = {
      success: true,
      data: {
        date_range: {
          start_date: parsedStartDate.format('YYYY-MM-DD'),
          end_date: parsedEndDate.format('YYYY-MM-DD'),
          months_in_range: targetMultiplier.toFixed(1) // Added for transparency
        },
        bdm_count: bdms.length,
        summary: summary,
        team_targets: teamTargets, // Add team targets to the response
        bdms: bdmStats
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in getAllBdmStatistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};







/**
 * Get BDM meeting statistics
 *
 * This API returns statistics about BDM meetings, field visits, and various types of visits
 * based on the provided date range.
 *
 * @param {Object} req - Express request object with query parameters:
 *   - bdmId: ID of the BDM (required)
 *   - startDate: Start date in YYYY-MM-DD format (required)
 *   - endDate: End date in YYYY-MM-DD format (required)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with BDM statistics
 */
exports.getBdmStatistics = async (req, res) => {
  try {
    // Extract query parameters
    const {
      bdmId,
      startDate,
      endDate
    } = req.query;

    // Validate required parameters
    if (!bdmId) {
      return res.status(400).json({
        success: false,
        message: 'BDM ID is required'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Parse dates
    const parsedStartDate = moment(startDate).startOf('day');
    const parsedEndDate = moment(endDate).endOf('day');

    if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      });
    }

    // Set up date filter
    const dateFilter = {
      action_date: {
        [Op.between]: [parsedStartDate.toDate(), parsedEndDate.toDate()]
      }
    };

    // Date range is used directly in the response

    // Get BDM details
    const bdm = await Employee.findOne({
      where: { EmployeeId: bdmId },
      attributes: ['EmployeeId', 'EmployeeName']
    });

    if (!bdm) {
      return res.status(404).json({
        success: false,
        message: 'BDM not found'
      });
    }

    // Get unique meeting statistics from bdm_lead_actions table
    const meetingStats = await BdmLeadAction.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('action_date')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('LeadId'))), 'unique_meetings'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_meetings']
      ],
      where: {
        BDMId: bdmId,
        specific_action: 'Meeting',
        ...dateFilter
      },
      group: [Sequelize.fn('DATE', Sequelize.col('action_date'))],
      raw: true
    });

    // Get total meeting count
    const totalMeetingCount = await BdmLeadAction.count({
      where: {
        BDMId: bdmId,
        specific_action: 'Meeting',
        ...dateFilter
      }
    });

    // Get field visit statistics from site_visit table
    const fieldVisitStats = await site_visit.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('LeadDetailId'))), 'unique_visits']
      ],
      where: {
        BDMId: bdmId,
        createdAt: {
          [Op.between]: [parsedStartDate.toDate(), parsedEndDate.toDate()]
        }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
      raw: true
    });

    // Get unique site visit count
    const uniqueSiteVisitCount = await site_visit.count({
      distinct: true,
      col: 'LeadDetailId',
      where: {
        BDMId: bdmId,
        createdAt: {
          [Op.between]: [parsedStartDate.toDate(), parsedEndDate.toDate()]
        }
      }
    });

    // Get group meeting statistics from group_meetings table
    const groupMeetingStats = await GroupMeeting.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('group_id'))), 'count']
      ],
      where: {
        bdm_id: bdmId,
        createdAt: {
          [Op.between]: [parsedStartDate.toDate(), parsedEndDate.toDate()]
        }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
      raw: true
    });

    // Get visit statistics (RO, HO, BO) from bdm_lead_actions table
    const visitTypes = ['RO Visit', 'HO Visit', 'BO Visit'];
    const visitStats = await BdmLeadAction.findAll({
      attributes: [
        'specific_action',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        BDMId: bdmId,
        specific_action: {
          [Op.in]: visitTypes
        },
        ...dateFilter
      },
      group: ['specific_action'],
      raw: true
    });

    // Calculate totals from the stats arrays
    const totalUniqueMeetings = meetingStats.reduce((sum, stat) => sum + parseInt(stat.unique_meetings), 0);
    const totalFieldVisits = fieldVisitStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
    const totalGroupMeetings = groupMeetingStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);

    // Format visit stats
    const formattedVisitStats = {};
    visitTypes.forEach(type => {
      formattedVisitStats[type.replace(' ', '_').toLowerCase()] = 0;
    });

    visitStats.forEach(stat => {
      const key = stat.specific_action.replace(' ', '_').toLowerCase();
      formattedVisitStats[key] = parseInt(stat.count);
    });

    // Prepare response
    const response = {
      success: true,
      data: {
        bdm: {
          id: bdm.EmployeeId,
          name: bdm.EmployeeName
        },
        date_range: {
          start_date: parsedStartDate.format('YYYY-MM-DD'),
          end_date: parsedEndDate.format('YYYY-MM-DD')
        },
        summary: {
          total_meetings: totalMeetingCount,
          total_unique_meetings: totalUniqueMeetings,
          total_field_visits: totalFieldVisits,
          total_unique_field_visits: uniqueSiteVisitCount,
          total_group_meetings: totalGroupMeetings,
          ...formattedVisitStats
        },
        details: {
          meetings: meetingStats,
          field_visits: fieldVisitStats,
          group_meetings: groupMeetingStats,
          visits: visitStats
        }
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in getBdmStatistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get detailed BDM activity information
 *
 * This API returns detailed information about each meeting, field visit, and other activities
 * for a specific BDM based on the provided date range.
 *
 * @param {Object} req - Express request object with query parameters:
 *   - bdmId: ID of the BDM (required)
 *   - startDate: Start date in YYYY-MM-DD format (required)
 *   - endDate: End date in YYYY-MM-DD format (required)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with detailed BDM activity information
 * 
 * 
 * 
 * 
 * 
 */


// exports.getBdmDetailedActivities = async (req, res) => {
//   try {
//     // Extract query parameters
//     const {
//       bdmId,
//       startDate,
//       endDate
//     } = req.query;

//     // Validate required parameters
//     if (!bdmId) {
//       return res.status(400).json({
//         success: false,
//         message: 'BDM ID is required'
//       });
//     }

//     if (!startDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Start date and end date are required'
//       });
//     }

//     // Parse dates
//     const parsedStartDate = moment(startDate).startOf('day');
//     const parsedEndDate = moment(endDate).endOf('day');

//     if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid date format. Please use YYYY-MM-DD format.'
//       });
//     }

//     // Get BDM details
//     const bdm = await Employee.findOne({
//       where: { EmployeeId: bdmId },
//       attributes: ['EmployeeId', 'EmployeeName']
//     });

//     if (!bdm) {
//       return res.status(404).json({
//         success: false,
//         message: 'BDM not found'
//       });
//     }

//     // Date filter for queries
//     const dateFilter = {
//       [Op.between]: [parsedStartDate.toDate(), parsedEndDate.toDate()]
//     };

//     // Get detailed meeting information
//     const meetings = await BdmLeadAction.findAll({
//       where: {
//         BDMId: bdmId,
//         specific_action: 'Meeting',
//         action_date: dateFilter
//       },
//       include: [{
//         model: Lead_Detail,
//         as: 'Lead',
//         attributes: ['id', 'CustomerName', 'MobileNo', 'CustomerMailId', 'location', 'category', 'sub_category']
//       }],
//       attributes: [
//         'id',
//         'LeadId',
//         'specific_action',
//         'action_date',
//         'remarks',
//         'task_name',
//         'completion_status'
//       ],
//       order: [['action_date', 'DESC']]
//     });

//     // Get detailed field visit information
//     const fieldVisits = await site_visit.findAll({
//       where: {
//         BDMId: bdmId,
//         createdAt: dateFilter
//       },
//       include: [{
//         model: Lead_Detail,
//         attributes: ['id', 'CustomerName', 'MobileNo', 'CustomerMailId', 'location', 'category', 'sub_category']
//       }],
//       attributes: [
//         'id',
//         'LeadDetailId',
//         'BirdsCapacity',
//         'LandDimension',
//         'ShedSize',
//         'IsLandDirectionEastWest',
//         'DirectionDeviationDegree',
//         'ElectricityPower',
//         'Water',
//         'ApproachRoad',
//         'ModelType',
//         'EstimationRequirement',
//         'Image',
//         'category',
//         'sub_category',
//         'closure_month',
//         'follow_up_date',
//         'ActionType',
//         'remark',
//         'createdAt'
//       ],
//       order: [['createdAt', 'DESC']]
//     });

//     // Get detailed group meeting information
//     const groupMeetings = await GroupMeeting.findAll({
//       where: {
//         bdm_id: bdmId,
//         createdAt: dateFilter
//       },
//       attributes: [
//         'id',
//         'group_id',
//         'group_meeting_title',
//         'customer_name',
//         'mobile',
//         'location',
//         'pincode',
//         'is_unique',
//         'action_type',
//         'created_at'
//       ],
//       order: [['created_at', 'DESC']]
//     });

//     // Get detailed visit information (RO, HO, BO)
//     const visitTypes = ['RO Visit', 'HO Visit', 'BO Visit'];
//     const visits = await BdmLeadAction.findAll({
//       where: {
//         BDMId: bdmId,
//         specific_action: {
//           [Op.in]: visitTypes
//         },
//         action_date: dateFilter
//       },
//       include: [{
//         model: Lead_Detail,
//         as: 'Lead',
//         attributes: ['id', 'CustomerName', 'MobileNo', 'CustomerMailId', 'location', 'category', 'sub_category']
//       }],
//       attributes: [
//         'id',
//         'LeadId',
//         'specific_action',
//         'action_date',
//         'remarks',
//         'task_name',
//         'completion_status'
//       ],
//       order: [['action_date', 'DESC']]
//     });

//     // Group visits by type
//     const visitsByType = {};
//     visitTypes.forEach(type => {
//       visitsByType[type.replace(' ', '_').toLowerCase()] = visits.filter(visit => visit.specific_action === type);
//     });

//     // Calculate summary counts
//     const summary = {
//       total_meetings: meetings.length,
//       total_unique_meetings: new Set(meetings.map(m => m.LeadId)).size,
//       total_field_visits: fieldVisits.length,
//       total_unique_field_visits: new Set(fieldVisits.map(fv => fv.LeadDetailId)).size,
//       total_group_meetings: groupMeetings.length,
//       ro_visit: visitsByType.ro_visit.length,
//       ho_visit: visitsByType.ho_visit.length,
//       bo_visit: visitsByType.bo_visit.length
//     };

//     // Prepare response
//     const response = {
//       success: true,
//       data: {
//         bdm: {
//           id: bdm.EmployeeId,
//           name: bdm.EmployeeName
//         },
//         date_range: {
//           start_date: parsedStartDate.format('YYYY-MM-DD'),
//           end_date: parsedEndDate.format('YYYY-MM-DD')
//         },
//         summary: summary,
//         details: {
//           meetings: meetings,
//           field_visits: fieldVisits,
//           group_meetings: groupMeetings,
//           visits: visitsByType
//         }
//       }
//     };

//     return res.status(200).json(response);
//   } catch (error) {
//     console.error('Error in getBdmDetailedActivities:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };



// const Employee = require('../../models/employee');
const Parivartan_BDM = require('../../models/Parivartan_BDM');
const Parivartan_Region = require('../../models/Parivartan_Region')
const EmployeeRole = require('../../models/employeRole');
const BdmTravelDetailForm = require('../../models/BdmTravelDetailForm');





// exports.getBdmDetailedActivities = async (req, res) => {
//   try {
//     // Extract query parameters
//     const { bdmId, startDate, endDate } = req.query;

//     // Validate required parameters
//     if (!bdmId) {
//       return res.status(400).json({
//         success: false,
//         message: 'BDM ID is required'
//       });
//     }

//     if (!startDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Start date and end date are required'
//       });
//     }

//     // Parse dates
//     const parsedStartDate = moment(startDate).startOf('day');
//     const parsedEndDate = moment(endDate).endOf('day');

//     if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid date format. Please use YYYY-MM-DD format.'
//       });
//     }

//     // Get BDM details


//     const bdm = await Employee.findOne({
//       where: { EmployeeId: bdmId }, 
//       include: [{
//         model: EmployeeRole,
//         attributes: ['RoleName'],
//         as: 'role'
//       }],
//       attributes: ['EmployeeId', 'EmployeeName']
//     });

//     if (!bdm) {
//       return res.status(404).json({
//         success: false,
//         message: 'BDM not found'
//       });
//     }

//     // Get BDM region
//     const bdmRegion = await Parivartan_BDM.findOne({
//       where: {
//         EmployeeId: bdmId,
//         is_bdm: 'Yes',
//         is_active: 'Active',
//         Deleted: 'N'
//       },
//       include: [{
//         model: Parivartan_Region,
//         attributes: ['RegionName'],
//         where: { Deleted: 'N' }
//       }],
//       attributes: ['RegionId']
//     });




    

//     // Date filter for queries
//     const dateFilter = {
//       [Op.between]: [parsedStartDate.toDate(), parsedEndDate.toDate()]
//     };

//     // Get detailed meeting information
//     const meetings = await BdmLeadAction.findAll({
//       where: {
//         BDMId: bdmId,
//         specific_action: 'Meeting',
//         action_date: dateFilter
//       },
//       include: [{
//         model: Lead_Detail,
//         as: 'Lead',
//         attributes: ['id', 'CustomerName', 'MobileNo', 'CustomerMailId', 'location', 'category', 'sub_category']
//       }],
//       attributes: [
//         'id',
//         'LeadId',
//         'specific_action',
//         'action_date',
//         'remarks',
//         'task_name',
//         'completion_status'
//       ],
//       order: [['action_date', 'DESC']]
//     });

//     // Get detailed field visit information
//     const fieldVisits = await site_visit.findAll({
//       where: {
//         BDMId: bdmId,
//         createdAt: dateFilter
//       },
//       include: [{
//         model: Lead_Detail,
//         attributes: ['id', 'CustomerName', 'MobileNo', 'CustomerMailId', 'location', 'category', 'sub_category']
//       }],
//       attributes: [
//         'id',
//         'LeadDetailId',
//         'BirdsCapacity',
//         'LandDimension',
//         'ShedSize',
//         'IsLandDirectionEastWest',
//         'DirectionDeviationDegree',
//         'ElectricityPower',
//         'Water',
//         'ApproachRoad',
//         'ModelType',
//         'EstimationRequirement',
//         'Image',
//         'category',
//         'sub_category',
//         'closure_month',
//         'follow_up_date',
//         'ActionType',
//         'remark',
//         'createdAt'
//       ],
//       order: [['createdAt', 'DESC']]
//     });

//     // Get detailed group meeting information
//     const groupMeetings = await GroupMeeting.findAll({
//       where: {
//         bdm_id: bdmId,
//         createdAt: dateFilter
//       },
//       attributes: [
//         'id',
//         'group_id',
//         'group_meeting_title',
//         'customer_name',
//         'mobile',
//         'location',
//         'pincode',
//         'is_unique',
//         'action_type',
//         'created_at'
//       ],
//       order: [['created_at', 'DESC']]
//     });

//     // Get detailed visit information (RO, HO, BO)
//     const visitTypes = ['RO Visit', 'HO Visit', 'BO Visit'];
//     const visits = await BdmLeadAction.findAll({
//       where: {
//         BDMId: bdmId,
//         specific_action: {
//           [Op.in]: visitTypes
//         },
//         action_date: dateFilter
//       },
//       include: [{
//         model: Lead_Detail,
//         as: 'Lead',
//         attributes: ['id', 'CustomerName', 'MobileNo', 'CustomerMailId', 'location', 'category', 'sub_category']
//       }],
//       attributes: [
//         'id',
//         'LeadId',
//         'specific_action',
//         'action_date',
//         'remarks',
//         'task_name',
//         'completion_status'
//       ],
//       order: [['action_date', 'DESC']]
//     });

//     // Group visits by type
//     const visitsByType = {};
//     visitTypes.forEach(type => {
//       visitsByType[type.replace(' ', '_').toLowerCase()] = visits.filter(visit => visit.specific_action === type);
//     });

//     // Process group meetings to get unique counts and organize by groups
//     const uniqueGroupIds = new Set(groupMeetings.map(gm => gm.group_id));
//     const totalGroupMeetingsCustomers = groupMeetings.length;
//     const uniqueGroupMeetingsCount = uniqueGroupIds.size;
    
//     // Organize all group meetings by group_id
//     const organizedGroupMeetings = [];
    
//     uniqueGroupIds.forEach(groupId => {
//       const meetingsInGroup = groupMeetings.filter(gm => gm.group_id === groupId);
      
//       // Create a group meeting object with all customers
//       organizedGroupMeetings.push({
//         group_id: groupId,
//         group_meeting_title: meetingsInGroup[0].group_meeting_title,
//         created_at: meetingsInGroup[0].created_at,
//         location: meetingsInGroup[0].location,
//         pincode: meetingsInGroup[0].pincode,
//         customers: meetingsInGroup.map(meeting => ({
//           id: meeting.id,
//           customer_name: meeting.customer_name,
//           mobile: meeting.mobile,
//           location: meeting.location,
//           is_unique: meeting.is_unique
//         })),
//         customer_count: meetingsInGroup.length
//       });
//     });

//     // Calculate summary counts
//     const summary = {
//       total_meetings: meetings.length,
//       total_unique_meetings: new Set(meetings.map(m => m.LeadId)).size,
//       total_field_visits: fieldVisits.length,
//       total_unique_field_visits: new Set(fieldVisits.map(fv => fv.LeadDetailId)).size,
//       total_group_meetings_customers: totalGroupMeetingsCustomers,
//       total_unique_group_meetings: uniqueGroupMeetingsCount,
//       ro_visit: visitsByType.ro_visit.length,
//       ho_visit: visitsByType.ho_visit.length,
//       bo_visit: visitsByType.bo_visit.length
//     };

//     // Calculate target achievement percentages
//     const achievementPercentages = {
//       group_meetings: {
//         target: MONTHLY_BDM_TARGETS.GROUP_MEETINGS,
//         achievement: uniqueGroupMeetingsCount, // Changed to count unique group meetings
//         percentage: Math.round((uniqueGroupMeetingsCount / MONTHLY_BDM_TARGETS.GROUP_MEETINGS) * 100)
//       },
//       unique_field_visits: {
//         target: MONTHLY_BDM_TARGETS.UNIQUE_FIELD_VISITS,
//         achievement: summary.total_unique_field_visits,
//         percentage: Math.round((summary.total_unique_field_visits / MONTHLY_BDM_TARGETS.UNIQUE_FIELD_VISITS) * 100)
//       },
//       unique_meetings: {
//         target: MONTHLY_BDM_TARGETS.UNIQUE_MEETINGS,
//         achievement: summary.total_unique_meetings,
//         percentage: Math.round((summary.total_unique_meetings / MONTHLY_BDM_TARGETS.UNIQUE_MEETINGS) * 100)
//       }
//     };

//     // Calculate overall performance
//     const performanceSummary = {
//       overall_target_achievement: Math.round(
//         (
//           achievementPercentages.group_meetings.percentage +
//           achievementPercentages.unique_field_visits.percentage +
//           achievementPercentages.unique_meetings.percentage
//         ) / 3
//       )
//     };

//     // Prepare response
//     const response = {
//       success: true,
//       data: {
//         bdm: {
//           id: bdm.EmployeeId,
//           name: bdm.EmployeeName,
//           role: bdm.role?.RoleName,
//           region: bdmRegion?.Parivartan_Region?.RegionName,
//           regionId: bdmRegion?.RegionId
//         },
//         date_range: {
//           start_date: parsedStartDate.format('YYYY-MM-DD'),
//           end_date: parsedEndDate.format('YYYY-MM-DD')
//         },
//         summary: summary,
//         targets: achievementPercentages,
//         performance_summary: performanceSummary,
//         details: {
//           meetings: meetings,
//           field_visits: fieldVisits,
//           group_meetings: organizedGroupMeetings,
//           visits: visitsByType
//         }
//       }
//     };

//     return res.status(200).json(response);
//   } catch (error) {
//     console.error('Error in getBdmDetailedActivities:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };








exports.getBdmDetailedActivities = async (req, res) => {
  try {
    // Extract query parameters
    const { bdmId, startDate, endDate } = req.query;

    // Validate required parameters
    if (!bdmId) {
      return res.status(400).json({
        success: false,
        message: 'BDM ID is required'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Parse dates
    const parsedStartDate = moment(startDate).startOf('day');
    const parsedEndDate = moment(endDate).endOf('day');

    if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      });
    }

    // Get BDM details
    const bdm = await Employee.findOne({
      where: { EmployeeId: bdmId }, 
      include: [{
        model: EmployeeRole,
        attributes: ['RoleName'],
        as: 'role'
      }],
      attributes: ['EmployeeId', 'EmployeeName']
    });

    if (!bdm) {
      return res.status(404).json({
        success: false,
        message: 'BDM not found'
      });
    }

    // Get BDM region
    const bdmRegion = await Parivartan_BDM.findOne({
      where: {
        EmployeeId: bdmId,
        is_bdm: 'Yes',
        is_active: 'Active',
        Deleted: 'N'
      },
      include: [{
        model: Parivartan_Region,
        attributes: ['RegionName'],
        where: { Deleted: 'N' }
      }],
      attributes: ['RegionId']
    });

    // Date filter for queries
    const dateFilter = {
      [Op.between]: [parsedStartDate.toDate(), parsedEndDate.toDate()]
    };

    // Get detailed meeting information
    const meetings = await BdmLeadAction.findAll({
      where: {
        BDMId: bdmId,
        specific_action: 'Meeting',
        action_date: dateFilter
      },
      include: [{
        model: Lead_Detail,
        as: 'Lead',
        attributes: ['id', 'CustomerName', 'MobileNo', 'CustomerMailId', 'location', 'category', 'sub_category']
      }],
      attributes: [
        'id',
        'LeadId',
        'specific_action',
        'action_date',
        'remarks',
        'task_name',
        'completion_status'
      ],
      order: [['action_date', 'DESC']]
    });

    // Get detailed field visit information
    const fieldVisits = await site_visit.findAll({
      where: {
        BDMId: bdmId,
        createdAt: dateFilter
      },
      include: [{
        model: Lead_Detail,
        attributes: ['id', 'CustomerName', 'MobileNo', 'CustomerMailId', 'location', 'category', 'sub_category']
      }],
      attributes: [
        'id',
        'LeadDetailId',
        'BirdsCapacity',
        'LandDimension',
        'ShedSize',
        'IsLandDirectionEastWest',
        'DirectionDeviationDegree',
        'ElectricityPower',
        'Water',
        'ApproachRoad',
        'ModelType',
        'EstimationRequirement',
        'Image',
        'category',
        'sub_category',
        'closure_month',
        'follow_up_date',
        'ActionType',
        'remark',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get detailed group meeting information
    const groupMeetings = await GroupMeeting.findAll({
      where: {
        bdm_id: bdmId,
        createdAt: dateFilter
      },
      attributes: [
        'id',
        'group_id',
        'group_meeting_title',
        'customer_name',
        'mobile',
        'location',
        'pincode',
        'is_unique',
        'action_type',
        'created_at'
      ],
      order: [['created_at', 'DESC']]
    });

    // Get detailed visit information (RO, HO, BO)
    const visitTypes = ['RO Visit', 'HO Visit', 'BO Visit'];
    const visits = await BdmLeadAction.findAll({
      where: {
        BDMId: bdmId,
        specific_action: {
          [Op.in]: visitTypes
        },
        action_date: dateFilter
      },
      include: [
        {
          model: Lead_Detail,
          as: 'Lead',
          attributes: ['id', 'CustomerName', 'MobileNo', 'CustomerMailId', 'location', 'category', 'sub_category']
        },
        // Include the travel details
        {
          model: BdmTravelDetailForm,
          as: 'TravelDetails',
          required: false
        }
      ],
      attributes: [
        'id',
        'LeadId',
        'specific_action',
        'action_date',
        'remarks',
        'task_name',
        'completion_status',
        'lead_detail_form_id'
      ],
      order: [['action_date', 'DESC']]
    });

    // Get travel details for the date range
    const travelDetails = await BdmTravelDetailForm.findAll({
      where: {
        BDMId: bdmId,
        createdAt: dateFilter
      }
    });

    // Process the visits to include travel form details
    const processedVisits = visits.map(visit => {
      const visitObj = visit.toJSON();
      
      // Add travel form details if available through association
      if (visitObj.TravelDetails) {
        visitObj.travel_form_details = {
          id: visitObj.TravelDetails.id,
          taskType: visitObj.TravelDetails.taskType,
          branchName: visitObj.TravelDetails.branchName,
          regionalOfficeName: visitObj.TravelDetails.regionalOfficeName,
          purposeForVisit: visitObj.TravelDetails.purposeForVisit,
          concernPersonName: visitObj.TravelDetails.concernPersonName,
          adminTaskSelect: visitObj.TravelDetails.adminTaskSelect,
          remarks: visitObj.TravelDetails.remarks,
          hoSelection: visitObj.TravelDetails.hoSelection,
          modeOfTravel: visitObj.TravelDetails.modeOfTravel,
          travelFrom: visitObj.TravelDetails.travelFrom,
          travelTo: visitObj.TravelDetails.travelTo,
          reasonForTravel: visitObj.TravelDetails.reasonForTravel,
          mandatoryVisitImage: visitObj.TravelDetails.mandatoryVisitImage,
          optionalVisitImage: visitObj.TravelDetails.optionalVisitImage
        };
      } else if (visitObj.lead_detail_form_id) {
        // If the association didn't work but we have an ID, try to find it in our separate query
        const matchingTravelDetail = travelDetails.find(td => td.id === visitObj.lead_detail_form_id);
        if (matchingTravelDetail) {
          visitObj.travel_form_details = {
            id: matchingTravelDetail.id,
            taskType: matchingTravelDetail.taskType,
            branchName: matchingTravelDetail.branchName,
            regionalOfficeName: matchingTravelDetail.regionalOfficeName,
            purposeForVisit: matchingTravelDetail.purposeForVisit,
            concernPersonName: matchingTravelDetail.concernPersonName,
            adminTaskSelect: matchingTravelDetail.adminTaskSelect,
            remarks: matchingTravelDetail.remarks,
            hoSelection: matchingTravelDetail.hoSelection,
            modeOfTravel: matchingTravelDetail.modeOfTravel,
            travelFrom: matchingTravelDetail.travelFrom,
            travelTo: matchingTravelDetail.travelTo,
            reasonForTravel: matchingTravelDetail.reasonForTravel,
            mandatoryVisitImage: matchingTravelDetail.mandatoryVisitImage,
            optionalVisitImage: matchingTravelDetail.optionalVisitImage
          };
        }
      }
      
      // Remove the TravelDetails object to clean up response
      delete visitObj.TravelDetails;
      
      return visitObj;
    });

    // Group visits by type
    const visitsByType = {};
    visitTypes.forEach(type => {
      visitsByType[type.replace(' ', '_').toLowerCase()] = processedVisits.filter(visit => visit.specific_action === type);
    });

    // Add a separate travel category for direct travel records
    const travelRecords = await BdmLeadAction.findAll({
      where: {
        BDMId: bdmId,
        specific_action: 'Travel',
        action_date: dateFilter
      },
      include: [
        {
          model: Lead_Detail,
          as: 'Lead',
          attributes: ['id', 'CustomerName', 'MobileNo', 'CustomerMailId', 'location', 'category', 'sub_category']
        },
        {
          model: BdmTravelDetailForm,
          as: 'TravelDetails',
          required: false
        }
      ],
      attributes: [
        'id',
        'LeadId',
        'specific_action',
        'action_date',
        'remarks',
        'task_name',
        'completion_status',
        'lead_detail_form_id'
      ],
      order: [['action_date', 'DESC']]
    });

    // Process travel records similarly to visits
    const processedTravelRecords = travelRecords.map(travel => {
      const travelObj = travel.toJSON();
      
      if (travelObj.TravelDetails) {
        travelObj.travel_form_details = {
          id: travelObj.TravelDetails.id,
          taskType: travelObj.TravelDetails.taskType,
          branchName: travelObj.TravelDetails.branchName,
          regionalOfficeName: travelObj.TravelDetails.regionalOfficeName,
          purposeForVisit: travelObj.TravelDetails.purposeForVisit,
          concernPersonName: travelObj.TravelDetails.concernPersonName,
          adminTaskSelect: travelObj.TravelDetails.adminTaskSelect,
          remarks: travelObj.TravelDetails.remarks,
          hoSelection: travelObj.TravelDetails.hoSelection,
          modeOfTravel: travelObj.TravelDetails.modeOfTravel,
          travelFrom: travelObj.TravelDetails.travelFrom,
          travelTo: travelObj.TravelDetails.travelTo,
          reasonForTravel: travelObj.TravelDetails.reasonForTravel,
          mandatoryVisitImage: travelObj.TravelDetails.mandatoryVisitImage,
          optionalVisitImage: travelObj.TravelDetails.optionalVisitImage
        };
      } else if (travelObj.lead_detail_form_id) {
        const matchingTravelDetail = travelDetails.find(td => td.id === travelObj.lead_detail_form_id);
        if (matchingTravelDetail) {
          travelObj.travel_form_details = {
            id: matchingTravelDetail.id,
            taskType: matchingTravelDetail.taskType,
            branchName: matchingTravelDetail.branchName,
            regionalOfficeName: matchingTravelDetail.regionalOfficeName,
            purposeForVisit: matchingTravelDetail.purposeForVisit,
            concernPersonName: matchingTravelDetail.concernPersonName,
            adminTaskSelect: matchingTravelDetail.adminTaskSelect,
            remarks: matchingTravelDetail.remarks,
            hoSelection: matchingTravelDetail.hoSelection,
            modeOfTravel: matchingTravelDetail.modeOfTravel,
            travelFrom: matchingTravelDetail.travelFrom,
            travelTo: matchingTravelDetail.travelTo,
            reasonForTravel: matchingTravelDetail.reasonForTravel,
            mandatoryVisitImage: matchingTravelDetail.mandatoryVisitImage,
            optionalVisitImage: matchingTravelDetail.optionalVisitImage
          };
        }
      }
      
      delete travelObj.TravelDetails;
      
      return travelObj;
    });

    visitsByType.travel = processedTravelRecords;

    // Process group meetings to get unique counts and organize by groups
    const uniqueGroupIds = new Set(groupMeetings.map(gm => gm.group_id));
    const totalGroupMeetingsCustomers = groupMeetings.length;
    const uniqueGroupMeetingsCount = uniqueGroupIds.size;
    
    // Organize all group meetings by group_id
    const organizedGroupMeetings = [];
    
    uniqueGroupIds.forEach(groupId => {
      const meetingsInGroup = groupMeetings.filter(gm => gm.group_id === groupId);
      
      // Create a group meeting object with all customers
      organizedGroupMeetings.push({
        group_id: groupId,
        group_meeting_title: meetingsInGroup[0].group_meeting_title,
        created_at: meetingsInGroup[0].created_at,
        location: meetingsInGroup[0].location,
        pincode: meetingsInGroup[0].pincode,
        customers: meetingsInGroup.map(meeting => ({
          id: meeting.id,
          customer_name: meeting.customer_name,
          mobile: meeting.mobile,
          location: meeting.location,
          is_unique: meeting.is_unique
        })),
        customer_count: meetingsInGroup.length
      });
    });

    // Calculate summary counts
    const summary = {
      total_meetings: meetings.length,
      total_unique_meetings: new Set(meetings.map(m => m.LeadId)).size,
      total_field_visits: fieldVisits.length,
      total_unique_field_visits: new Set(fieldVisits.map(fv => fv.LeadDetailId)).size,
      total_group_meetings_customers: totalGroupMeetingsCustomers,
      total_unique_group_meetings: uniqueGroupMeetingsCount,
      ro_visit: visitsByType.ro_visit.length,
      ho_visit: visitsByType.ho_visit.length,
      bo_visit: visitsByType.bo_visit.length,
      travel: visitsByType.travel.length,
      total_travel_details: travelDetails.length  // New count for all travel detail forms
    };

    // Calculate target achievement percentages
    const achievementPercentages = {
      group_meetings: {
        target: MONTHLY_BDM_TARGETS.GROUP_MEETINGS,
        achievement: uniqueGroupMeetingsCount, // Changed to count unique group meetings
        percentage: Math.round((uniqueGroupMeetingsCount / MONTHLY_BDM_TARGETS.GROUP_MEETINGS) * 100)
      },
      unique_field_visits: {
        target: MONTHLY_BDM_TARGETS.UNIQUE_FIELD_VISITS,
        achievement: summary.total_unique_field_visits,
        percentage: Math.round((summary.total_unique_field_visits / MONTHLY_BDM_TARGETS.UNIQUE_FIELD_VISITS) * 100)
      },
      unique_meetings: {
        target: MONTHLY_BDM_TARGETS.UNIQUE_MEETINGS,
        achievement: summary.total_unique_meetings,
        percentage: Math.round((summary.total_unique_meetings / MONTHLY_BDM_TARGETS.UNIQUE_MEETINGS) * 100)
      }
    };

    // Calculate overall performance
    const performanceSummary = {
      overall_target_achievement: Math.round(
        (
          achievementPercentages.group_meetings.percentage +
          achievementPercentages.unique_field_visits.percentage +
          achievementPercentages.unique_meetings.percentage
        ) / 3
      )
    };

    // Prepare response
    const response = {
      success: true,
      data: {
        bdm: {
          id: bdm.EmployeeId,
          name: bdm.EmployeeName,
          role: bdm.role?.RoleName,
          region: bdmRegion?.Parivartan_Region?.RegionName,
          regionId: bdmRegion?.RegionId
        },
        date_range: {
          start_date: parsedStartDate.format('YYYY-MM-DD'),
          end_date: parsedEndDate.format('YYYY-MM-DD')
        },
        summary: summary,
        targets: achievementPercentages,
        performance_summary: performanceSummary,
        details: {
          meetings: meetings,
          field_visits: fieldVisits,
          group_meetings: organizedGroupMeetings,
          visits: visitsByType,
          // Include a section for all travel detail forms
          travel_detail_forms: travelDetails.map(detail => ({
            id: detail.id,
            taskType: detail.taskType,
            branchName: detail.branchName,
            regionalOfficeName: detail.regionalOfficeName,
            purposeForVisit: detail.purposeForVisit,
            concernPersonName: detail.concernPersonName,
            adminTaskSelect: detail.adminTaskSelect,
            remarks: detail.remarks,
            hoSelection: detail.hoSelection,
            modeOfTravel: detail.modeOfTravel,
            travelFrom: detail.travelFrom,
            travelTo: detail.travelTo,
            reasonForTravel: detail.reasonForTravel,
            mandatoryVisitImage: detail.mandatoryVisitImage,
            optionalVisitImage: detail.optionalVisitImage,
            createdAt: moment(detail.createdAt).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss')
          }))
        }
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in getBdmDetailedActivities:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};