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

/**
 * Get statistics for all BDMs
 *
 * This API returns statistics about meetings, field visits, and various types of visits
 * for all BDMs based on the provided date range.
 *
 * @param {Object} req - Express request object with query parameters:
 *   - startDate: Start date in YYYY-MM-DD format (required)
 *   - endDate: End date in YYYY-MM-DD format (required)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with statistics for all BDMs
 */
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
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_field_visits'],
          [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('LeadDetailId'))), 'unique_field_visits']
        ],
        where: {
          BDMId: bdm.EmployeeId,
          createdAt: dateFilter
        },
        raw: true
      });

      // Get unique site visit count
      const uniqueSiteVisitCount = await site_visit.count({
        distinct: true,
        col: 'LeadDetailId',
        where: {
          BDMId: bdm.EmployeeId,
          createdAt: dateFilter
        }
      });

      // Get group meeting statistics
      const groupMeetingCount = await GroupMeeting.count({
        where: {
          bdm_id: bdm.EmployeeId,
          createdAt: dateFilter
        },
        distinct: true,
        col: 'group_id'
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
          total_group_meetings: groupMeetingCount,
          ...visitStats
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

    bdmStats.forEach(bdm => {
      summary.total_meetings += bdm.statistics.total_meetings;
      summary.total_unique_meetings += bdm.statistics.total_unique_meetings;
      summary.total_field_visits += bdm.statistics.total_field_visits;
      summary.total_unique_field_visits += bdm.statistics.total_unique_field_visits;
      summary.total_group_meetings += bdm.statistics.total_group_meetings;
      summary.ro_visit += bdm.statistics.ro_visit;
      summary.ho_visit += bdm.statistics.ho_visit;
      summary.bo_visit += bdm.statistics.bo_visit;
    });

    // Prepare response
    const response = {
      success: true,
      data: {
        date_range: {
          start_date: parsedStartDate.format('YYYY-MM-DD'),
          end_date: parsedEndDate.format('YYYY-MM-DD')
        },
        bdm_count: bdms.length,
        summary: summary,
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
 */
exports.getBdmDetailedActivities = async (req, res) => {
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

    // Group visits by type
    const visitsByType = {};
    visitTypes.forEach(type => {
      visitsByType[type.replace(' ', '_').toLowerCase()] = visits.filter(visit => visit.specific_action === type);
    });

    // Calculate summary counts
    const summary = {
      total_meetings: meetings.length,
      total_unique_meetings: new Set(meetings.map(m => m.LeadId)).size,
      total_field_visits: fieldVisits.length,
      total_unique_field_visits: new Set(fieldVisits.map(fv => fv.LeadDetailId)).size,
      total_group_meetings: groupMeetings.length,
      ro_visit: visitsByType.ro_visit.length,
      ho_visit: visitsByType.ho_visit.length,
      bo_visit: visitsByType.bo_visit.length
    };

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
        summary: summary,
        details: {
          meetings: meetings,
          field_visits: fieldVisits,
          group_meetings: groupMeetings,
          visits: visitsByType
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