/**
 * BDM Meeting Report Controller
 * 
 * This controller provides detailed reporting APIs for BDM meetings and visits
 * with various filtering options and aggregation capabilities.
 */

const { Sequelize, Op } = require('sequelize');
const BdmLeadAction = require('../../models/BdmLeadAction');
const Employee = require('../../models/employee');
const GroupMeeting = require('../../models/GroupMeeting');
const lead_Meeting = require('../../models/lead_meeting');
const site_visit = require('../../models/site_visit');
const Lead_Detail = require('../../models/lead_detail');
const moment = require('moment');

/**
 * Get detailed BDM meeting report
 * 
 * This API returns a detailed report of BDM meetings and visits with various
 * filtering options and aggregation capabilities.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with detailed BDM meeting report
 */
exports.getBdmMeetingReport = async (req, res) => {
  try {
    // Extract query parameters
    const { 
      bdmId, 
      startDate, 
      endDate,
      groupBy = 'day', // 'day', 'week', 'month'
      includeDetails = 'false'
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
      [Op.between]: [parsedStartDate.toDate(), parsedEndDate.toDate()]
    };

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

    // Determine the group by clause based on the groupBy parameter
    let groupByClause;
    let dateFormat;
    
    switch (groupBy) {
      case 'week':
        groupByClause = Sequelize.fn('YEARWEEK', Sequelize.col('action_date'), 1);
        dateFormat = 'YYYY-[W]WW';
        break;
      case 'month':
        groupByClause = Sequelize.fn('DATE_FORMAT', Sequelize.col('action_date'), '%Y-%m');
        dateFormat = 'YYYY-MM';
        break;
      case 'day':
      default:
        groupByClause = Sequelize.fn('DATE', Sequelize.col('action_date'));
        dateFormat = 'YYYY-MM-DD';
        break;
    }

    // Get unique meetings count from bdm_lead_actions table
    const meetingStats = await BdmLeadAction.findAll({
      attributes: [
        [groupByClause, 'date_group'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('LeadId'))), 'unique_meetings']
      ],
      where: {
        BDMId: bdmId,
        specific_action: 'Meeting',
        action_date: dateFilter
      },
      group: ['date_group'],
      raw: true
    });

    // Get field visits from site_visit table
    const fieldVisitStats = await site_visit.findAll({
      attributes: [
        [Sequelize.fn(groupBy === 'day' ? 'DATE' : 'DATE_FORMAT', 
                     Sequelize.col('createdAt'), 
                     groupBy === 'week' ? '%Y-%u' : (groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d')), 'date_group'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        BDMId: bdmId,
        createdAt: dateFilter
      },
      group: ['date_group'],
      raw: true
    });

    // Get group meetings from group_meetings table
    const groupMeetingStats = await GroupMeeting.findAll({
      attributes: [
        [Sequelize.fn(groupBy === 'day' ? 'DATE' : 'DATE_FORMAT', 
                     Sequelize.col('createdAt'), 
                     groupBy === 'week' ? '%Y-%u' : (groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d')), 'date_group'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('group_id'))), 'count']
      ],
      where: {
        bdm_id: bdmId,
        createdAt: dateFilter
      },
      group: ['date_group'],
      raw: true
    });

    // Get visit statistics (RO, HO, BO) from bdm_lead_actions table
    const visitTypes = ['RO Visit', 'HO Visit', 'BO Visit'];
    
    // Get counts by visit type
    const visitTypeStats = await BdmLeadAction.findAll({
      attributes: [
        'specific_action',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        BDMId: bdmId,
        specific_action: {
          [Op.in]: visitTypes
        },
        action_date: dateFilter
      },
      group: ['specific_action'],
      raw: true
    });

    // Get counts by visit type and date group
    const visitDateStats = await BdmLeadAction.findAll({
      attributes: [
        'specific_action',
        [groupByClause, 'date_group'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        BDMId: bdmId,
        specific_action: {
          [Op.in]: visitTypes
        },
        action_date: dateFilter
      },
      group: ['specific_action', 'date_group'],
      raw: true
    });

    // Get detailed meeting information if requested
    let meetingDetails = null;
    if (includeDetails === 'true') {
      meetingDetails = await BdmLeadAction.findAll({
        attributes: [
          'id',
          'LeadId',
          'specific_action',
          'action_date',
          'remarks',
          'task_name',
          'completion_status'
        ],
        where: {
          BDMId: bdmId,
          action_date: dateFilter
        },
        include: [
          {
            model: Lead_Detail,
            as: 'Lead',
            attributes: ['CustomerName', 'MobileNo', 'location']
          }
        ],
        order: [['action_date', 'DESC']],
        raw: true,
        nest: true
      });
    }

    // Calculate totals
    const totalMeetings = meetingStats.reduce((sum, stat) => sum + parseInt(stat.unique_meetings), 0);
    const totalFieldVisits = fieldVisitStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
    const totalGroupMeetings = groupMeetingStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);

    // Format visit stats by type
    const formattedVisitStats = {};
    visitTypes.forEach(type => {
      formattedVisitStats[type.replace(' ', '_').toLowerCase()] = 0;
    });

    visitTypeStats.forEach(stat => {
      const key = stat.specific_action.replace(' ', '_').toLowerCase();
      formattedVisitStats[key] = parseInt(stat.count);
    });

    // Format visit stats by date
    const visitsByDate = {};
    visitDateStats.forEach(stat => {
      const dateKey = stat.date_group;
      const visitType = stat.specific_action.replace(' ', '_').toLowerCase();
      
      if (!visitsByDate[dateKey]) {
        visitsByDate[dateKey] = {};
        visitTypes.forEach(type => {
          visitsByDate[dateKey][type.replace(' ', '_').toLowerCase()] = 0;
        });
      }
      
      visitsByDate[dateKey][visitType] = parseInt(stat.count);
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
          end_date: parsedEndDate.format('YYYY-MM-DD'),
          group_by: groupBy
        },
        summary: {
          total_unique_meetings: totalMeetings,
          total_field_visits: totalFieldVisits,
          total_group_meetings: totalGroupMeetings,
          ...formattedVisitStats
        },
        by_date: {
          meetings: meetingStats.map(stat => ({
            date_group: stat.date_group,
            unique_meetings: parseInt(stat.unique_meetings)
          })),
          field_visits: fieldVisitStats.map(stat => ({
            date_group: stat.date_group,
            count: parseInt(stat.count)
          })),
          group_meetings: groupMeetingStats.map(stat => ({
            date_group: stat.date_group,
            count: parseInt(stat.count)
          })),
          visits: visitsByDate
        }
      }
    };

    // Add details if requested
    if (meetingDetails) {
      response.data.details = meetingDetails;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in getBdmMeetingReport:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
