const express = require('express');
const { QueryTypes, Op,fn, literal, Sequelize,  } = require('sequelize');
const Employee = require('../../models/employee');
const AuditLeadRemark = require('../../models/AuditLeadRemark');
const AuditLeadTable = require('../../models/AuditLeadTable');
const AuditNewFarmer = require('../../models/AuditNewFarmer');
const IncomingCall = require("../../models/IncomingCall")
const Employee_Role = require('../../models/employeRole');
const sequelize = require("../../models/index");
const ejs = require('ejs');
const path = require('path');
const pdf = require('pdf-creator-node');
const fs = require('fs-extra');
const { Parser } = require('json2csv');
const CallLog = require('../../models/CallLog');
const moment = require("moment");
const PostCallData = require('../../models/PostCallData');


Employee.belongsTo(Employee_Role, {
    foreignKey: "EmployeeRoleID",
    as: "role",
  });
  
  Employee_Role.hasMany(Employee, {
    foreignKey: "EmployeeRoleID",
    as: "employees",
  });
  
 




  //counting with detail 
  exports.AgentDetailReport =  async (req, res) => {
    try {
      const { startDate, endDate, agentName } = req.query;
  
      // Base filters
      const remarkDateFilter = startDate && endDate 
        ? `DATE(alr.createdAt) BETWEEN '${startDate}' AND '${endDate}'`
        : '1=1';
      const followupDateFilter = startDate && endDate 
        ? `DATE(follow_up_date) BETWEEN '${startDate}' AND '${endDate}'`
        : '1=1';
      const followupDateFilterWithAlias = startDate && endDate 
        ? `DATE(alt.follow_up_date) BETWEEN '${startDate}' AND '${endDate}'`
        : '1=1';
  
      // Get remarks details with status
      const remarkDetailsQuery = `
        SELECT 
          alr.id,
          alr.Lot_Number,
          alr.REMARKS,
          alr.DATE,
          alr.closure_status,
          alr.AGE,
          alr.BWT,
          alr.M_QTY,
          alr.REASON,
          alt.Farmer_Name,
          alt.Zone_Name,
          alt.Branch_Name,
          e.EmployeeName as agent_name
        FROM audit_lead_remarks alr
        LEFT JOIN audit_lead_table alt ON alt.Lot_Number = alr.Lot_Number
        LEFT JOIN employee_table e ON e.EmployeeId = alr.AgentId
        WHERE ${remarkDateFilter}
        ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
        ORDER BY alr.DATE DESC;
      `;
  
      const remarkDetails = await sequelize.query(remarkDetailsQuery, {
        type: QueryTypes.SELECT
      });
  
      // Get follow-up details
      const followupDetailsQuery = `
        SELECT 
          alt.Lot_Number,
          alt.Farmer_Name,
          alt.Mobile,
          alt.Zone_Name,
          alt.Branch_Name,
          alt.follow_up_date,
          alt.completed_on,
          e.EmployeeName as agent_name,
          CASE 
            WHEN DATE(alt.follow_up_date) = DATE(alt.completed_on) THEN 'completed'
            ELSE 'pending'
          END as follow_up_status
        FROM audit_lead_table alt
        LEFT JOIN employee_table e ON e.EmployeeId = alt.AgentId
        WHERE ${followupDateFilter}
        AND alt.follow_up_date IS NOT NULL
        ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
        ORDER BY alt.follow_up_date DESC;
      `;
  
      const followupDetails = await sequelize.query(followupDetailsQuery, {
        type: QueryTypes.SELECT
      });
  
      // Get summary statistics (reusing your existing queries)
      const remarkStatusQuery = `
        SELECT 
          closure_status,
          COUNT(*) as count
        FROM audit_lead_remarks alr
        LEFT JOIN employee_table e ON e.EmployeeId = alr.AgentId
        WHERE ${remarkDateFilter}
        ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
        GROUP BY closure_status;
      `;
  
      const overallStatusCounts = await sequelize.query(remarkStatusQuery, {
        type: QueryTypes.SELECT
      });
  
      const followupQuery = `
        SELECT 
          COUNT(*) as total_followups,
          SUM(CASE WHEN DATE(follow_up_date) = DATE(completed_on) THEN 1 ELSE 0 END) as completed_followups
        FROM audit_lead_table
        WHERE follow_up_date IS NOT NULL
        AND ${followupDateFilter};
      `;
  
      const followUpStats = await sequelize.query(followupQuery, {
        type: QueryTypes.SELECT
      });
  
     

     
    const agentStatsQuery = `
  SELECT 
    e.EmployeeId,
    e.EmployeeName,
    e.EmployeeRegion,
    e.EmployeePhone,
    COUNT(DISTINCT alr.id) as total_remarks,
    COUNT(DISTINCT CASE WHEN alr.closure_status = 'open' THEN alr.id END) as open_remarks,
    COUNT(DISTINCT CASE WHEN alr.closure_status = 'closed' THEN alr.id END) as closed_remarks,
    COUNT(DISTINCT CASE WHEN alt.follow_up_date IS NOT NULL 
      AND ${followupDateFilterWithAlias} THEN alt.Lot_Number END) as total_followups,
    COUNT(DISTINCT CASE WHEN DATE(alt.follow_up_date) = DATE(alt.completed_on) 
      AND ${followupDateFilterWithAlias} THEN alt.Lot_Number END) as completed_followups
  FROM employee_table e
  LEFT JOIN audit_lead_remarks alr ON alr.AgentId = e.EmployeeId 
    AND ${remarkDateFilter}
  LEFT JOIN audit_lead_table alt ON alt.AgentId = e.EmployeeId 
  WHERE e.EmployeeRoleID = 100
  ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
  GROUP BY e.EmployeeId, e.EmployeeName, e.EmployeeRegion, e.EmployeePhone;
`;
  
      const agentStats = await sequelize.query(agentStatsQuery, {
        type: QueryTypes.SELECT
      });
  
      const totalRemarks = overallStatusCounts.reduce((sum, item) => sum + parseInt(item.count), 0);
  
      const response = {
        filters_applied: {
          date_range: startDate && endDate ? { startDate, endDate } : null,
          agent_name: agentName || null
        },
        summary: {
          total_remarks: totalRemarks,
          status_wise_count: overallStatusCounts.reduce((acc, curr) => {
            acc[curr.closure_status || 'undefined'] = parseInt(curr.count);
            return acc;
          }, {}), 
          followup_statistics: {
            total_followups: parseInt(followUpStats[0]?.total_followups) || 0,
            completed_followups: parseInt(followUpStats[0]?.completed_followups) || 0,
            pending_followups: (parseInt(followUpStats[0]?.total_followups) || 0) - 
                             (parseInt(followUpStats[0]?.completed_followups) || 0)
          }
        },
        agent_wise_summary: agentStats.map(agent => ({
          agent_details: {
            id: agent.EmployeeId,
            name: agent.EmployeeName,
            region: agent.EmployeeRegion,
            phone: agent.EmployeePhone
          },
          counts: {
            total_remarks: parseInt(agent.total_remarks) || 0,
            open_remarks: parseInt(agent.open_remarks) || 0,
            closed_remarks: parseInt(agent.closed_remarks) || 0,
            followups: {
              total: parseInt(agent.total_followups) || 0,
              completed: parseInt(agent.completed_followups) || 0,
              pending: (parseInt(agent.total_followups) || 0) - (parseInt(agent.completed_followups) || 0)
            }
          }
        })),
        details: {
          remarks: {
            open: remarkDetails.filter(r => r.closure_status === 'open'),
            closed: remarkDetails.filter(r => r.closure_status === 'closed'),
            undefined: remarkDetails.filter(r => !r.closure_status || r.closure_status === 'undefined')
          },
          followups: {
            completed: followupDetails.filter(f => f.follow_up_status === 'completed'),
            pending: followupDetails.filter(f => f.follow_up_status === 'pending')
          }
        }
      };
  
      res.json({
        success: true,
        data: response
      });
  
    } catch (error) {
      console.error('Error fetching remark statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        sql: error.sql,
        parameters: error.parameters
      });
    }
  };
  


//detail report report in pdf /cs
exports.exportAgentDetailReport = async (req, res) => {
    try {
        const { startDate, endDate, agentName, format = 'pdf' } = req.query;

        // Base filters
        const remarkDateFilter = startDate && endDate 
            ? `DATE(alr.createdAt) BETWEEN '${startDate}' AND '${endDate}'`
            : '1=1';
        const followupDateFilter = startDate && endDate 
            ? `DATE(follow_up_date) BETWEEN '${startDate}' AND '${endDate}'`
            : '1=1';
        const followupDateFilterWithAlias = startDate && endDate 
            ? `DATE(alt.follow_up_date) BETWEEN '${startDate}' AND '${endDate}'`
            : '1=1';

      // Get remarks details with status
      const remarkDetailsQuery = `
      SELECT 
          alr.id,
          alr.Lot_Number,
          alr.REMARKS,
          alr.DATE,
          alr.closure_status,
          alr.AGE,
          alr.BWT,
          alr.M_QTY,
          alr.REASON,
          alt.Farmer_Name,
          alt.Zone_Name,
          alt.Branch_Name,
          e.EmployeeName as agent_name
      FROM audit_lead_remarks alr
      LEFT JOIN audit_lead_table alt ON alt.Lot_Number = alr.Lot_Number
      LEFT JOIN employee_table e ON e.EmployeeId = alr.AgentId
      WHERE ${remarkDateFilter}
      ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
      ORDER BY alr.DATE DESC;
  `;

  const remarkDetails = await sequelize.query(remarkDetailsQuery, {
      type: QueryTypes.SELECT
  });

  // Get follow-up details
  const followupDetailsQuery = `
      SELECT 
          alt.Lot_Number,
          alt.Farmer_Name,
          alt.Zone_Name,
          alt.Branch_Name,
          alt.follow_up_date,
          alt.completed_on,
          e.EmployeeName as agent_name,
          CASE 
              WHEN DATE(alt.follow_up_date) = DATE(alt.completed_on) THEN 'completed'
              ELSE 'pending'
          END as follow_up_status
      FROM audit_lead_table alt
      LEFT JOIN employee_table e ON e.EmployeeId = alt.AgentId
      WHERE ${followupDateFilter}
      AND alt.follow_up_date IS NOT NULL
      ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
      ORDER BY alt.follow_up_date DESC;
  `;

  const followupDetails = await sequelize.query(followupDetailsQuery, {
      type: QueryTypes.SELECT
  });

  // Get summary statistics
  const remarkStatusQuery = `
      SELECT 
          closure_status,
          COUNT(*) as count
      FROM audit_lead_remarks alr
      LEFT JOIN employee_table e ON e.EmployeeId = alr.AgentId
      WHERE ${remarkDateFilter}
      ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
      GROUP BY closure_status;
  `;

  const overallStatusCounts = await sequelize.query(remarkStatusQuery, {
      type: QueryTypes.SELECT
  });

  const followupQuery = `
      SELECT 
          COUNT(*) as total_followups,
          SUM(CASE WHEN DATE(follow_up_date) = DATE(completed_on) THEN 1 ELSE 0 END) as completed_followups
      FROM audit_lead_table alt
      LEFT JOIN employee_table e ON e.EmployeeId = alt.AgentId
      WHERE follow_up_date IS NOT NULL
      AND ${followupDateFilter}
      ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''};
  `;

  const followUpStats = await sequelize.query(followupQuery, {
      type: QueryTypes.SELECT
  });

  // Get agent-wise stats
  const agentStatsQuery = `
      SELECT 
          e.EmployeeId,
          e.EmployeeName,
          e.EmployeeRegion,
          e.EmployeePhone,
          COUNT(DISTINCT alr.id) as total_remarks,
          SUM(CASE WHEN alr.closure_status = 'open' THEN 1 ELSE 0 END) as open_remarks,
          SUM(CASE WHEN alr.closure_status = 'closed' THEN 1 ELSE 0 END) as closed_remarks,
          COUNT(DISTINCT CASE WHEN alt.follow_up_date IS NOT NULL 
              AND ${followupDateFilterWithAlias} THEN alt.Lot_Number END) as total_followups,
          COUNT(DISTINCT CASE WHEN DATE(alt.follow_up_date) = DATE(alt.completed_on) 
              AND ${followupDateFilterWithAlias} THEN alt.Lot_Number END) as completed_followups
      FROM employee_table e
      LEFT JOIN audit_lead_remarks alr ON alr.AgentId = e.EmployeeId 
          AND ${remarkDateFilter}
      LEFT JOIN audit_lead_table alt ON alt.AgentId = e.EmployeeId 
      WHERE e.EmployeeRoleID = 100
      ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
      GROUP BY e.EmployeeId, e.EmployeeName, e.EmployeeRegion, e.EmployeePhone;
  `;

  const agentStats = await sequelize.query(agentStatsQuery, {
      type: QueryTypes.SELECT
  });

  const totalRemarks = overallStatusCounts.reduce((sum, item) => sum + parseInt(item.count), 0);

        const templateData = {
            filters: {
                startDate,
                endDate,
                agentName
            },
            summary: {
                total_remarks: totalRemarks,
                status_wise_count: overallStatusCounts.reduce((acc, curr) => {
                    acc[curr.closure_status || 'undefined'] = parseInt(curr.count);
                    return acc;
                }, {}),
                followup_statistics: {
                    total_followups: parseInt(followUpStats[0]?.total_followups) || 0,
                    completed_followups: parseInt(followUpStats[0]?.completed_followups) || 0,
                    pending_followups: (parseInt(followUpStats[0]?.total_followups) || 0) - 
                                     (parseInt(followUpStats[0]?.completed_followups) || 0)
                }
            },
            agent_wise_summary: agentStats.map(agent => ({
                agent_details: {
                    id: agent.EmployeeId,
                    name: agent.EmployeeName,
                    region: agent.EmployeeRegion,
                    phone: agent.EmployeePhone
                },
                counts: {
                    total_remarks: parseInt(agent.total_remarks) || 0,
                    open_remarks: parseInt(agent.open_remarks) || 0,
                    closed_remarks: parseInt(agent.closed_remarks) || 0,
                    followups: {
                        total: parseInt(agent.total_followups) || 0,
                        completed: parseInt(agent.completed_followups) || 0,
                        pending: (parseInt(agent.total_followups) || 0) - 
                                (parseInt(agent.completed_followups) || 0)
                    }
                }
            })),
            details: {
                remarks: {
                    open: remarkDetails.filter(r => r.closure_status === 'open'),
                    closed: remarkDetails.filter(r => r.closure_status === 'closed'),
                    undefined: remarkDetails.filter(r => !r.closure_status || r.closure_status === 'undefined')
                },
                followups: {
                    completed: followupDetails.filter(f => f.follow_up_status === 'completed'),
                    pending: followupDetails.filter(f => f.follow_up_status === 'pending')
                }
            }
        };

        // Handle different export formats
        switch (format.toLowerCase()) {
            case 'html':
                const templatePath = path.join(__dirname, '../../views/reports/agent-detail-report.ejs');
                console.log('Template path:', templatePath);
                const html = await ejs.renderFile(templatePath, templateData);
                return res.send(html);

            case 'pdf':
                const pdfTemplatePath = path.join(__dirname, '../../views/reports/agent-detail-report.ejs');
                console.log('PDF Template path:', pdfTemplatePath);
                const pdfHtml = await ejs.renderFile(pdfTemplatePath, templateData);

                const options = {
                    format: 'A4',
                    orientation: 'portrait',
                    border: '10mm',
                    header: {
                        height: '15mm',
                    },
                    footer: {
                        height: '15mm',
                    }
                };

                const document = {
                    html: pdfHtml,
                    data: {},
                    path: './tmp/agent-detail-report.pdf'
                };

                await fs.ensureDir('./tmp');
                await pdf.create(document, options);

                res.download('./tmp/agent-detail-report.pdf', 'agent-detail-report.pdf', (err) => {
                    if (err) {
                        console.error('Error downloading PDF:', err);
                        res.status(500).send('Error downloading PDF');
                    }
                    fs.removeSync('./tmp/agent-detail-report.pdf');
                });
                break;

            case 'csv':
                // Prepare data for CSV export
                const csvData = [];
                
                // Add agent summary data
                templateData.agent_wise_summary.forEach(agent => {
                    csvData.push({
                        section: 'Agent Summary',
                        agent_name: agent.agent_details.name,
                        region: agent.agent_details.region,
                        phone: agent.agent_details.phone,
                        total_remarks: agent.counts.total_remarks,
                        open_remarks: agent.counts.open_remarks,
                        closed_remarks: agent.counts.closed_remarks,
                        total_followups: agent.counts.followups.total,
                        completed_followups: agent.counts.followups.completed,
                        pending_followups: agent.counts.followups.pending
                    });
                });

                // Add remarks data
                [...templateData.details.remarks.open, 
                 ...templateData.details.remarks.closed, 
                 ...templateData.details.remarks.undefined].forEach(remark => {
                    csvData.push({
                        section: 'Remarks',
                        lot_number: remark.Lot_Number,
                        farmer_name: remark.Farmer_Name,
                        zone: remark.Zone_Name,
                        branch: remark.Branch_Name,
                        remarks: remark.REMARKS,
                        date: remark.DATE,
                        age: remark.AGE,
                        reason: remark.REASON,
                        status: remark.closure_status || 'undefined'
                    });
                });

                // Add followup data
                [...templateData.details.followups.completed,
                 ...templateData.details.followups.pending].forEach(followup => {
                    csvData.push({
                        section: 'Followups',
                        lot_number: followup.Lot_Number,
                        farmer_name: followup.Farmer_Name,
                        zone: followup.Zone_Name,
                        branch: followup.Branch_Name,
                        follow_up_date: followup.follow_up_date,
                        status: followup.follow_up_status,
                        completed_on: followup.completed_on || ''
                    });
                });

                // Convert to CSV
                const json2csvParser = new Parser();
                const csv = json2csvParser.parse(csvData);

                // Set headers for CSV download
                res.header('Content-Type', 'text/csv');
                res.attachment('agent-detail-report.csv');
                return res.send(csv);

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid export format. Supported formats: pdf, html, csv'
                });
        }

    } catch (error) {
        console.error('Error exporting agent detail report:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            sql: error.sql,
            parameters: error.parameters
        });
    }
};

//v1

exports.getAuditCallAnalytics = async (req, res) => {
    try {
        const startDate = req.query.startDate;
        const endDate = req.query.endDate || startDate;
        const agentName = req.query.agentName;

        if (!startDate || !moment(startDate).isValid()) {
            return res.status(400).json({
                success: false,
                message: "Valid start date required"
            });
        }

        let query = `
            SELECT 
                ic.call_id,
                ic.agent_number,
                ic.caller_number,
                emp.EmployeeName as agent_name,
                ic.ivr_number,
                DATE(ic.created_at) as call_date,
                ic.created_at,
                ic.connected_at,
                ic.ended_at,
                alt.Farmer_Name as lead_name,
                alt.Zone_Name,
                alt.Branch_Name,
                alt.Lot_Number,
                alt.Vendor,
                alt.Shed_Type,
                alt.Placed_Qty,
                alt.Hatch_Date,
                alt.Total_Mortality,
                alt.Total_Mortality_Percentage,
                alt.status as lead_status,
                CASE 
                    WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL THEN 'Connected'
                    ELSE 'Missed'
                END as call_status,
                CASE 
                    WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(SECOND, ic.connected_at, ic.ended_at)
                    ELSE 0
                END as call_duration_seconds
            FROM incoming_calls ic
            LEFT JOIN audit_lead_table alt ON ic.caller_number = alt.Mobile
            LEFT JOIN employee_table emp ON ic.agent_number = emp.EmployeePhone
           WHERE ic.ivr_number IN ('8517009998', '7610233333')
            AND DATE(ic.created_at) BETWEEN DATE(:startDate) AND DATE(:endDate)
            ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
            ORDER BY ic.created_at DESC
        `;

        const replacements = { 
            startDate: moment(startDate).startOf('day').format('YYYY-MM-DD'),
            endDate: moment(endDate).endOf('day').format('YYYY-MM-DD'),
            ...(agentName && { agentName })
        };

        const callDetails = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        const agentMap = new Map();
        let totalCalls = 0;
        let totalConnected = 0;
        let totalMissed = 0;
        let uniqueLeads = new Set();
        let processedCalls = new Map();
        let totalTalkTimeSeconds = 0;

        callDetails.forEach(call => {
            if (!call.agent_name) return;
            
            const uniqueKey = `${call.call_id}_${call.agent_number}`;
            
            if (!processedCalls.has(uniqueKey)) {
                processedCalls.set(uniqueKey, true);
                totalCalls++;

                if (call.Lot_Number) uniqueLeads.add(call.Lot_Number);
                
                const isConnected = call.connected_at && call.ended_at;
                if (isConnected) {
                    totalConnected++;
                    totalTalkTimeSeconds += call.call_duration_seconds;
                } else {
                    totalMissed++;
                }

                if (!agentMap.has(call.agent_name)) {
                    agentMap.set(call.agent_name, {
                        agent_name: call.agent_name,
                        agent_number: call.agent_number,
                        total_calls: 0,
                        missed_calls: 0,
                        connected_calls: 0,
                        total_duration_minutes: 0,
                        total_duration_seconds: 0,
                        connected_details: [],
                        missed_details: []
                    });
                }

                const agentData = agentMap.get(call.agent_name);
                agentData.total_calls++;

                const callDetail = {
                    call_id: call.call_id,
                    date: moment(call.created_at).format('YYYY-MM-DD'),
                    time: moment(call.created_at).format('HH:mm:ss'),
                    caller_number: call.caller_number,
                    duration_minutes: (call.call_duration_seconds / 60).toFixed(2)
                };

                const customerDetail = call.lead_name ? {
                    farmer_name: call.lead_name,
                    lot_number: call.Lot_Number,
                    zone: call.Zone_Name,
                    branch: call.Branch_Name,
                    vendor: call.Vendor,
                    shed_type: call.Shed_Type,
                    placed_qty: call.Placed_Qty,
                    hatch_date: call.Hatch_Date,
                    total_mortality: call.Total_Mortality,
                    mortality_percentage: call.Total_Mortality_Percentage,
                    status: call.lead_status
                } : null;

                if (isConnected) {
                    agentData.connected_calls++;
                    agentData.total_duration_seconds += call.call_duration_seconds;
                    agentData.total_duration_minutes += call.call_duration_seconds / 60;
                    callDetail.connected_at = moment(call.connected_at).format('YYYY-MM-DD HH:mm:ss');
                    callDetail.ended_at = moment(call.ended_at).format('YYYY-MM-DD HH:mm:ss');
                    agentData.connected_details.push({
                        ...callDetail,
                        customer_details: customerDetail
                    });
                } else {
                    agentData.missed_calls++;
                    agentData.missed_details.push({
                        ...callDetail,
                        customer_details: customerDetail
                    });
                }
            }
        });

        // Calculate hours, minutes and seconds format
        const formatDuration = (totalSeconds) => {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return {
                hours,
                minutes,
                seconds,
                formatted: `${hours}h ${minutes}m ${seconds}s`
            };
        };

        const agentStats = Array.from(agentMap.values()).map(agent => {
            const duration = formatDuration(agent.total_duration_seconds);
            return {
                agent_name: agent.agent_name,
                agent_number: agent.agent_number,
                total_calls: agent.total_calls,
                connected_calls: agent.connected_calls,
                missed_calls: agent.missed_calls,
                total_talk_time: duration.formatted,
                total_duration_minutes: agent.total_duration_minutes.toFixed(2),
                avg_call_duration_minutes: agent.connected_calls > 0 ? 
                    (agent.total_duration_minutes / agent.connected_calls).toFixed(2) : "0",
                connection_rate: ((agent.connected_calls / agent.total_calls) * 100).toFixed(2) + '%',
                missed_rate: ((agent.missed_calls / agent.total_calls) * 100).toFixed(2) + '%',
                connected_calls_detail: agent.connected_details,
                missed_calls_detail: agent.missed_details
            };
        });

        agentStats.sort((a, b) => b.total_calls - a.total_calls);

        const totalDuration = formatDuration(totalTalkTimeSeconds);

        const response = {
            success: true,
            data: {
                summary: {
                    period: {
                        start_date: moment(startDate).format('YYYY-MM-DD'),
                        end_date: moment(endDate).format('YYYY-MM-DD')
                    },
                    metrics: {
                        total_calls: totalCalls,
                        unique_leads: uniqueLeads.size,
                        connected_calls: totalConnected,
                        missed_calls: totalMissed,
                        total_talk_time: totalDuration.formatted,
                        connection_rate: totalCalls ? 
                            ((totalConnected / totalCalls) * 100).toFixed(2) + '%' : '0%'
                    }
                },
                agents: agentStats
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error in getAuditCallAnalytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};



exports.getAgentReportFiltersExport = async (req, res) => {
    try {
        const { startDate, endDate, agentName, format = 'pdf' } = req.query;

        // Main query for call details
        let query = `
            SELECT 
                ic.call_id,
                ic.agent_number,
                ic.caller_number,
                emp.EmployeeName as agent_name,
                ic.ivr_number,
                DATE(ic.created_at) as call_date,
                ic.created_at,
                ic.connected_at,
                ic.ended_at,
                alt.Farmer_Name as lead_name,
                alt.Zone_Name,
                alt.Branch_Name,
                alt.Lot_Number,
                alt.Vendor,
                alt.Shed_Type,
                alt.Placed_Qty,
                alt.Hatch_Date,
                alt.Total_Mortality,
                alt.Total_Mortality_Percentage,
                alt.status as lead_status,
                CASE 
                    WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL THEN 'Connected'
                    ELSE 'Missed'
                END as call_status,
                CASE 
                    WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(SECOND, ic.connected_at, ic.ended_at)
                    ELSE 0
                END as call_duration_seconds
            FROM incoming_calls ic
            LEFT JOIN audit_lead_table alt ON ic.caller_number = alt.Mobile
            LEFT JOIN employee_table emp ON ic.agent_number = emp.EmployeePhone
         WHERE ic.ivr_number IN ('8517009998', '7610233333')
            AND DATE(ic.created_at) BETWEEN DATE(:startDate) AND DATE(:endDate)
            ${agentName ? 'AND emp.EmployeeName = :agentName' : ''}
            ORDER BY ic.created_at DESC
        `;

        const replacements = {
            startDate: moment(startDate).startOf('day').format('YYYY-MM-DD'),
            endDate: moment(endDate).endOf('day').format('YYYY-MM-DD'),
            ...(agentName && { agentName })
        };

        const callDetails = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        // Process the data
        const agentMap = new Map();
        let totalCalls = 0;
        let totalConnected = 0;
        let totalMissed = 0;
        let uniqueLeads = new Set();
        let processedCalls = new Map();
        let totalTalkTimeSeconds = 0;

        callDetails.forEach(call => {
            if (!call.agent_name) return;
            
            const uniqueKey = `${call.call_id}_${call.agent_number}`;
            
            if (!processedCalls.has(uniqueKey)) {
                processedCalls.set(uniqueKey, true);
                totalCalls++;

                if (call.Lot_Number) uniqueLeads.add(call.Lot_Number);
                
                const isConnected = call.connected_at && call.ended_at;
                if (isConnected) {
                    totalConnected++;
                    totalTalkTimeSeconds += call.call_duration_seconds;
                } else {
                    totalMissed++;
                }

                // Process agent-wise statistics
                if (!agentMap.has(call.agent_name)) {
                    agentMap.set(call.agent_name, {
                        name: call.agent_name,
                        total_calls: 0,
                        connected_calls: 0,
                        missed_calls: 0,
                        total_talk_time: 0
                    });
                }
                
                const agentStats = agentMap.get(call.agent_name);
                agentStats.total_calls++;
                if (isConnected) {
                    agentStats.connected_calls++;
                    agentStats.total_talk_time += call.call_duration_seconds;
                } else {
                    agentStats.missed_calls++;
                }
            }
        });

        const templateData = {
            filters: {
                startDate,
                endDate,
                agentName
            },
            summary: {
                total_calls: totalCalls,
                connected_calls: totalConnected,
                missed_calls: totalMissed,
                unique_leads: uniqueLeads.size,
                total_talk_time_seconds: totalTalkTimeSeconds,
                average_talk_time_seconds: totalConnected ? Math.round(totalTalkTimeSeconds / totalConnected) : 0
            },
            agent_stats: Array.from(agentMap.values()),
            call_details: callDetails
        };

        // Handle different export formats
        switch (format.toLowerCase()) {
            case 'html':
                const templatePath = path.join(__dirname, '../../views/reports/audit-incoming-report.ejs');
                console.log('Template path:', templatePath);
                const html = await ejs.renderFile(templatePath, templateData);
                return res.send(html);

            case 'pdf':
                const pdfTemplatePath = path.join(__dirname, '../../views/reports/audit-incoming-report.ejs');
                console.log('PDF Template path:', pdfTemplatePath);
                const pdfHtml = await ejs.renderFile(pdfTemplatePath, templateData);

                const options = {
                    format: 'A4',
                    orientation: 'landscape',
                    border: '10mm',
                    header: {
                        height: '15mm',
                    },
                    footer: {
                        height: '15mm',
                    }
                };

                const document = {
                    html: pdfHtml,
                    data: {},
                    path: './tmp/audit-incoming-report.pdf'
                };

                await fs.ensureDir('./tmp');
                await pdf.create(document, options);

                res.download('./tmp/audit-incoming-report.pdf', 'audit-incoming-report.pdf', (err) => {
                    if (err) {
                        console.error('Error downloading PDF:', err);
                        res.status(500).send('Error downloading PDF');
                    }
                    fs.removeSync('./tmp/call-details-report.pdf');
                });
                break;

            case 'csv':
                const csvData = callDetails.map(call => ({
                    call_id: call.call_id,
                    agent_name: call.agent_name,
                    agent_number: call.agent_number,
                    caller_number: call.caller_number,
                    call_date: call.call_date,
                    created_at: call.created_at,
                    connected_at: call.connected_at,
                    ended_at: call.ended_at,
                    lead_name: call.lead_name,
                    zone: call.Zone_Name,
                    branch: call.Branch_Name,
                    lot_number: call.Lot_Number,
                    vendor: call.Vendor,
                    shed_type: call.Shed_Type,
                    placed_qty: call.Placed_Qty,
                    hatch_date: call.Hatch_Date,
                    total_mortality: call.Total_Mortality,
                    mortality_percentage: call.Total_Mortality_Percentage,
                    lead_status: call.lead_status,
                    call_status: call.call_status,
                    call_duration_seconds: call.call_duration_seconds
                }));

                const json2csvParser = new Parser();
                const csv = json2csvParser.parse(csvData);

                res.header('Content-Type', 'text/csv');
                res.attachment('call-details-report.csv');
                return res.send(csv);

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid export format. Supported formats: pdf, html, csv'
                });
        }

    } catch (error) {
        console.error('Error exporting call details:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            sql: error.sql,
            parameters: error.parameters
        });
    }
};



//11jan write for oprimization
 
const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
};

exports.getDashboardCallCounts = async (req, res) => {
    try {
        const { startDate, endDate = startDate, agentName } = req.query;

        if (!startDate || !moment(startDate).isValid()) {
            return res.status(400).json({
                success: false,
                message: "Valid start date required"
            });
        }

        // Base query conditions
        const dateCondition = `
            DATE(ic.created_at) BETWEEN :startDate AND :endDate 
            AND ic.ivr_number IN ('8517009998', '7610233333')
        `;

        const agentCondition = agentName ? 'AND emp.EmployeeName = :agentName' : '';

        // Single optimized query to get all metrics
        const query = `
            WITH CallMetrics AS (
                SELECT 
                    COUNT(DISTINCT ic.call_id) as total_calls,
                    COUNT(DISTINCT CASE WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
                        THEN ic.call_id END) as connected_calls,
                    COUNT(DISTINCT CASE WHEN ic.connected_at IS NULL OR ic.ended_at IS NULL 
                        THEN ic.call_id END) as missed_calls,
                    COALESCE(SUM(CASE 
                        WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
                        THEN TIMESTAMPDIFF(SECOND, ic.connected_at, ic.ended_at)
                        ELSE 0 
                    END), 0) as total_duration_seconds,
                    COUNT(DISTINCT alt.Lot_Number) as unique_leads
                FROM incoming_calls ic
                LEFT JOIN employee_table emp ON ic.agent_number = emp.EmployeePhone
                LEFT JOIN audit_lead_table alt ON ic.caller_number = alt.Mobile
                WHERE ${dateCondition}
                ${agentCondition}
            )
            SELECT 
                COALESCE(total_calls, 0) as total_calls,
                COALESCE(connected_calls, 0) as connected_calls,
                COALESCE(missed_calls, 0) as missed_calls,
                COALESCE(total_duration_seconds, 0) as total_duration_seconds,
                COALESCE(unique_leads, 0) as unique_leads,
                COALESCE(
                    CASE 
                        WHEN total_calls > 0 
                        THEN ROUND((connected_calls / total_calls) * 100, 2)
                        ELSE 0 
                    END,
                    0
                ) as connection_rate
            FROM CallMetrics
        `;

        const replacements = {
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD'),
            ...(agentName && { agentName })
        };

        const [metrics] = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        // Get agent-wise stats if no specific agent is selected
        let agentStats = [];
        if (!agentName) {
            const agentQuery = `
                SELECT 
                    emp.EmployeeName as agent_name,
                    emp.EmployeePhone as agent_number,
                    COUNT(DISTINCT ic.call_id) as total_calls,
                    COUNT(DISTINCT CASE WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
                        THEN ic.call_id END) as connected_calls,
                    COUNT(DISTINCT CASE WHEN ic.connected_at IS NULL OR ic.ended_at IS NULL 
                        THEN ic.call_id END) as missed_calls,
                    COALESCE(SUM(CASE 
                        WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL 
                        THEN TIMESTAMPDIFF(SECOND, ic.connected_at, ic.ended_at)
                        ELSE 0 
                    END), 0) as total_duration_seconds
                FROM incoming_calls ic
                JOIN employee_table emp ON ic.agent_number = emp.EmployeePhone
                WHERE ${dateCondition}
                GROUP BY emp.EmployeeName, emp.EmployeePhone
                HAVING total_calls > 0
                ORDER BY total_calls DESC
            `;

            agentStats = await sequelize.query(agentQuery, {
                replacements,
                type: QueryTypes.SELECT
            });

            // Calculate percentages and format durations for each agent
            agentStats = agentStats.map(agent => ({
                ...agent,
                total_talk_time: formatDuration(parseInt(agent.total_duration_seconds || 0)),
                total_calls: parseInt(agent.total_calls || 0),
                connected_calls: parseInt(agent.connected_calls || 0),
                missed_calls: parseInt(agent.missed_calls || 0),
                connection_rate: ((parseInt(agent.connected_calls || 0) / parseInt(agent.total_calls || 1)) * 100).toFixed(2) + '%',
                missed_rate: ((parseInt(agent.missed_calls || 0) / parseInt(agent.total_calls || 1)) * 100).toFixed(2) + '%'
            }));
        }

        const response = {
            success: true,
            data: {
                summary: {
                    period: {
                        start_date: moment(startDate).format('YYYY-MM-DD'),
                        end_date: moment(endDate).format('YYYY-MM-DD')
                    },
                    metrics: {
                        total_calls: parseInt(metrics.total_calls || 0),
                        connected_calls: parseInt(metrics.connected_calls || 0),
                        missed_calls: parseInt(metrics.missed_calls || 0),
                        unique_leads: parseInt(metrics.unique_leads || 0),
                        total_talk_time: formatDuration(parseInt(metrics.total_duration_seconds || 0)),
                        connection_rate: (parseFloat(metrics.connection_rate || 0)).toFixed(2) + '%'
                    }
                },
                ...(agentStats.length > 0 && { agents: agentStats })
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error in getDashboardCallCounts:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


//v2 otptimized

exports.getDetailedCallAnalytics = async (req, res) => {
    try {
        const { 
            startDate, 
            endDate = startDate, 
            agentName,
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'DESC',
            callStatus,  // Optional: 'Connected' or 'Missed'
            searchTerm  // Optional: search in caller number or farmer name
        } = req.query;

        if (!startDate || !moment(startDate).isValid()) {
            return res.status(400).json({
                success: false,
                message: "Valid start date required"
            });
        }

        // Base conditions
        const conditions = [
            `DATE(ic.created_at) BETWEEN :startDate AND :endDate`,
            `ic.ivr_number IN ('8517009998', '7610233333')`
        ];

        if (agentName) {
            conditions.push(`emp.EmployeeName = :agentName`);
        }

        if (callStatus) {
            if (callStatus.toLowerCase() === 'connected') {
                conditions.push(`ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL`);
            } else if (callStatus.toLowerCase() === 'missed') {
                conditions.push(`(ic.connected_at IS NULL OR ic.ended_at IS NULL)`);
            }
        }

        if (searchTerm) {
            conditions.push(`(
                ic.caller_number LIKE :searchTerm 
                OR alt.Farmer_Name LIKE :searchTerm
                OR alt.Lot_Number LIKE :searchTerm
            )`);
        }

        // Build the main query
        const baseQuery = `
            FROM incoming_calls ic
            LEFT JOIN employee_table emp ON ic.agent_number = emp.EmployeePhone
            LEFT JOIN audit_lead_table alt ON ic.caller_number = alt.Mobile
            WHERE ${conditions.join(' AND ')}
        `;

        // Count total records
        const countQuery = `
            SELECT COUNT(DISTINCT ic.call_id) as total
            ${baseQuery}
        `;

        // Get paginated records
        const detailQuery = `
            SELECT 
                ic.call_id,
                ic.created_at,
                ic.connected_at,
                ic.ended_at,
                ic.caller_number,
                ic.agent_number,
                emp.EmployeeName as agent_name,
                alt.Farmer_Name,
                alt.Lot_Number,
                alt.Zone_Name,
                alt.Branch_Name,
                alt.Vendor,
                alt.Shed_Type,
                alt.Placed_Qty,
                alt.Hatch_Date,
                alt.Total_Mortality,
                alt.Total_Mortality_Percentage,
                alt.status as lead_status,
                CASE 
                    WHEN ic.connected_at IS NOT NULL AND ic.ended_at IS NOT NULL THEN 'Connected'
                    ELSE 'Missed'
                END as call_status,
                COALESCE(
                    TIMESTAMPDIFF(SECOND, ic.connected_at, ic.ended_at),
                    0
                ) as call_duration_seconds
            ${baseQuery}
            ORDER BY ic.${sortBy} ${sortOrder}
            LIMIT :offset, :limit
        `;

        const replacements = {
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD'),
            offset: (parseInt(page) - 1) * parseInt(limit),
            limit: parseInt(limit),
            ...(agentName && { agentName }),
            ...(searchTerm && { searchTerm: `%${searchTerm}%` })
        };

        // Execute both queries
        const [[countResult], calls] = await Promise.all([
            sequelize.query(countQuery, {
                replacements,
                type: QueryTypes.SELECT
            }),
            sequelize.query(detailQuery, {
                replacements,
                type: QueryTypes.SELECT
            })
        ]);

        // Process the results
        const formattedCalls = calls.map(call => ({
            call_id: call.call_id,
            date: moment(call.created_at).format('YYYY-MM-DD'),
            time: moment(call.created_at).format('HH:mm:ss'),
            agent: {
                name: call.agent_name,
                number: call.agent_number
            },
            call_status: call.call_status,
            duration: formatDuration(call.call_duration_seconds),
            duration_seconds: call.call_duration_seconds,
            caller_number: call.caller_number,
            customer_details: call.Farmer_Name ? {
                farmer_name: call.Farmer_Name,
                lot_number: call.Lot_Number,
                zone: call.Zone_Name,
                branch: call.Branch_Name,
                vendor: call.Vendor,
                shed_type: call.Shed_Type,
                placed_qty: call.Placed_Qty,
                hatch_date: call.Hatch_Date,
                total_mortality: call.Total_Mortality,
                mortality_percentage: call.Total_Mortality_Percentage,
                status: call.lead_status
            } : null,
            timestamps: {
                created: call.created_at,
                connected: call.connected_at,
                ended: call.ended_at
            }
        }));

        const totalRecords = parseInt(countResult.total);
        const totalPages = Math.ceil(totalRecords / limit);

        const response = {
            success: true,
            data: {
                calls: formattedCalls,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_records: totalRecords,
                    per_page: parseInt(limit),
                    has_more: parseInt(page) < totalPages
                },
                filters: {
                    date_range: {
                        start: moment(startDate).format('YYYY-MM-DD'),
                        end: moment(endDate).format('YYYY-MM-DD')
                    },
                    ...(agentName && { agent_name: agentName }),
                    ...(callStatus && { call_status: callStatus }),
                    ...(searchTerm && { search: searchTerm })
                }
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error in getDetailedCallAnalytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


// new out going report api


 







 
// const formatDateTime = (dateTimeString) => {
//     if (!dateTimeString) return null;
//     const date = new Date(dateTimeString);
//     return {
//         date: date.toLocaleDateString('en-GB'),  // DD/MM/YYYY
//         time: date.toLocaleTimeString('en-US', { hour12: true })  // HH:MM:SS AM/PM
//     };
// };

// const calculateDuration = (endTime, startTime) => {
//     if (!endTime || !startTime) return null;
//     const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000); // in seconds
//     const minutes = Math.floor(duration / 60);
//     const seconds = duration % 60;
//     return `${minutes}:${seconds.toString().padStart(2, '0')}`;
// };

// const transformCallData = (call) => {
//     const startDateTime = formatDateTime(call.callStartTime);
//     return {
//         agentNumber: call.aPartyNo,
//         agentDetails: call.agent ? {
//             name: call.agent.EmployeeName,
//             region: call.agent.EmployeeRegion,
//             employeeId: call.agent.EmployeeId
//         } : null,
//         customerNumber: call.bPartyNo,
//         customerDetails: call.auditLead ? {
//             lotNumber: call.auditLead.Lot_Number,
//             zoneName: call.auditLead.Zone_Name,
//             branchName: call.auditLead.Branch_Name,
//             farmerName: call.auditLead.Farmer_Name,
//             vendor: call.auditLead.Vendor,
//             shedType: call.auditLead.Shed_Type,
//             status: call.auditLead.status,
//             followUpDate: formatDateTime(call.auditLead.follow_up_date)
//         } : null,
//         callStartDate: startDateTime?.date,
//         callStartTime: startDateTime?.time,
//         callStatus: call.bDialStatus,
//         callDuration: calculateDuration(call.bPartyEndTime, call.bPartyConnectedTime),
//         disconnectedBy: call.disconnectedBy,
//         recordingUrl: call.recordVoice
//     };
// };

// exports.getCallAnalysis = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             pageSize = 10,
//             startDate,
//             endDate,
//             dni = "7610233333",
//             aPartyNo
//         } = req.query;

//         let whereClause = {
//             dni: dni,
//             eventType: 'call End'
//         };

//         if (aPartyNo) {
//             whereClause.aPartyNo = aPartyNo;
//         }

//         if (startDate && endDate) {
//             whereClause.createdAt = {
//                 [Op.between]: [new Date(startDate), new Date(endDate)]
//             };
//         }

//         const includeOptions = [
//             {
//                 model: Employee,
//                 as: 'agent',
//                 attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone', 'EmployeeRegion'],
//                 required: false
//             },
//             {
//                 model: AuditLeadTable,
//                 as: 'auditLead',
//                 attributes: [
//                     'Lot_Number',
//                     'Zone_Name',
//                     'Branch_Name',
//                     'Farmer_Name',
//                     'Vendor',
//                     'Shed_Type',
//                     'status',
//                     'follow_up_date'
//                 ],
//                 required: false
//             }
//         ];

//         // Get total calls count
//         const totalCalls = await CallLog.count({
//             where: whereClause
//         });

//         // Get connected calls
//         const connectedCalls = await CallLog.findAndCountAll({
//             where: {
//                 ...whereClause,
//                 bDialStatus: 'Connected'
//             },
//             include: includeOptions,
//             order: [['createdAt', 'DESC']],
//             limit: parseInt(pageSize),
//             offset: (parseInt(page) - 1) * parseInt(pageSize)
//         });

//         // Get not connected calls
//         const notConnectedCalls = await CallLog.findAndCountAll({
//             where: {
//                 ...whereClause,
//                 [Op.or]: [
//                     { bDialStatus: { [Op.ne]: 'Connected' } },
//                     { bDialStatus: null }
//                 ]
//             },
//             include: includeOptions,
//             order: [['createdAt', 'DESC']],
//             limit: parseInt(pageSize),
//             offset: (parseInt(page) - 1) * parseInt(pageSize)
//         });

//         // Transform the data
//         const transformedConnectedCalls = connectedCalls.rows.map(transformCallData);
//         const transformedNotConnectedCalls = notConnectedCalls.rows.map(transformCallData);

//         res.json({
//             success: true,
//             filters: {
//                 dni,
//                 agentNumber: aPartyNo || 'All',
//                 dateRange: startDate && endDate ? {
//                     start: startDate,
//                     end: endDate
//                 } : null
//             },
//             pagination: {
//                 page: parseInt(page),
//                 pageSize: parseInt(pageSize),
//                 totalPages: Math.ceil(totalCalls / parseInt(pageSize))
//             },
//             totalCalls,
//             connected: {
//                 totalCount: connectedCalls.count,
//                 calls: transformedConnectedCalls
//             },
//             notConnected: {
//                 totalCount: notConnectedCalls.count,
//                 calls: transformedNotConnectedCalls
//             }
//         });

//     } catch (error) {
//         console.error('Error in getCallAnalysis:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching call analysis',
//             error: error.message,
//             stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//         });
//     }
// };






// const formatDateTime = (dateTimeString) => {
//     if (!dateTimeString) return null;
//     const date = new Date(dateTimeString);
//     return {
//         date: date.toLocaleDateString('en-GB'),
//         time: date.toLocaleTimeString('en-US', { hour12: true })
//     };
// };

// const calculateDuration = (endTime, startTime) => {
//     if (!endTime || !startTime) return null;
//     const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
//     const minutes = Math.floor(duration / 60);
//     const seconds = duration % 60;
//     return `${minutes}:${seconds.toString().padStart(2, '0')}`;
// };

// const getCustomerDetails = (call) => {
//     // First check AuditLeadTable
//     if (call.auditLead) {
//         return {
//             source: 'AuditLeadTable',
//             lotNumber: call.auditLead.Lot_Number,
//             zoneName: call.auditLead.Zone_Name,
//             branchName: call.auditLead.Branch_Name,
//             farmerName: call.auditLead.Farmer_Name,
//             vendor: call.auditLead.Vendor,
//             shedType: call.auditLead.Shed_Type,
//             status: call.auditLead.status,
//             followUpDate: formatDateTime(call.auditLead.follow_up_date)
//         };
//     }
    
//     // Then check AuditNewFarmer
//     if (call.auditNewFarmer) {
//         const details = {
//             source: 'AuditNewFarmer',
//             zoneName: call.auditNewFarmer.Zone_Name,
//             branchName: call.auditNewFarmer.branch_Name,
//             farmerName: call.auditNewFarmer.farmer_name,
//             shedType: call.auditNewFarmer.Shed_Type,
//             status: call.auditNewFarmer.status,
//             followUpDate: formatDateTime(call.auditNewFarmer.follow_up_date),
//             type: call.auditNewFarmer.type,
//             followUpBy: call.auditNewFarmer.followUpBy,
//             remarks: call.auditNewFarmer.remarks
//         };

//         // Add fields specific to old farmers
//         if (call.auditNewFarmer.type === 'old') {
//             details.oldFarmerDetails = {
//                 ABWT: call.auditNewFarmer.ABWT,
//                 avgLiftWt: call.auditNewFarmer.Avg_Lift_Wt,
//                 totalMortality: call.auditNewFarmer.Total_Mortality,
//                 firstWeekM: call.auditNewFarmer.first_Week_M
//             };
//         }

//         // Add fields specific to new farmers
//         if (call.auditNewFarmer.type === 'new') {
//             details.newFarmerDetails = {
//                 previousCompanyName: call.auditNewFarmer.previousCompanyName,
//                 previousPoultryExperience: call.auditNewFarmer.previousPoultryExperience
//             };
//         }

//         return details;
//     }

//     return null;
// };

// const transformCallData = (call) => {
//     const startDateTime = formatDateTime(call.callStartTime);
//     return {
//         agentNumber: call.aPartyNo,
//         agentDetails: call.agent ? {
//             name: call.agent.EmployeeName,
//             region: call.agent.EmployeeRegion,
//             employeeId: call.agent.EmployeeId
//         } : null,
//         customerNumber: call.bPartyNo,
//         customerDetails: getCustomerDetails(call),
//         callStartDate: startDateTime?.date,
//         callStartTime: startDateTime?.time,
//         callStatus: call.bDialStatus,
//         callDuration: calculateDuration(call.bPartyEndTime, call.bPartyConnectedTime),
//         disconnectedBy: call.disconnectedBy,
//         recordingUrl: call.recordVoice
//     };
// };

// exports.getCallAnalysis = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             pageSize = 10,
//             startDate,
//             endDate,
//             dni = "7610233333",
//             aPartyNo
//         } = req.query;

//         let whereClause = {
//             dni: dni,
//             eventType: 'call End'
//         };

//         if (aPartyNo) {
//             whereClause.aPartyNo = aPartyNo;
//         }

//         if (startDate && endDate) {
//             whereClause.createdAt = {
//                 [Op.between]: [new Date(startDate), new Date(endDate)]
//             };
//         }

//         const includeOptions = [
//             {
//                 model: Employee,
//                 as: 'agent',
//                 attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone', 'EmployeeRegion'],
//                 required: false
//             },
//             {
//                 model: AuditNewFarmer,
//                 as: 'auditFarmer',
//                 attributes: ['Mobile', 'Zone_Name', 'farmer_name', /* other fields */],
//                 required: false
//             },
//             {
//                 model: AuditLeadTable,
//                 as: 'auditLead',
//                 required: false
//             }
//         ];
        
//         const calls = await CallLog.findAndCountAll({
//             where: whereClause,
//             include: includeOptions,
//             distinct: true  // Important when using multiple includes
//         });

//         // Get total calls count
//         const totalCalls = await CallLog.count({
//             where: whereClause
//         });

//         // Get connected calls
//         const connectedCalls = await CallLog.findAndCountAll({
//             where: {
//                 ...whereClause,
//                 bDialStatus: 'Connected'
//             },
//             include: includeOptions,
//             order: [['createdAt', 'DESC']],
//             limit: parseInt(pageSize),
//             offset: (parseInt(page) - 1) * parseInt(pageSize)
//         });

//         // Get not connected calls
//         const notConnectedCalls = await CallLog.findAndCountAll({
//             where: {
//                 ...whereClause,
//                 [Op.or]: [
//                     { bDialStatus: { [Op.ne]: 'Connected' } },
//                     { bDialStatus: null }
//                 ]
//             },
//             include: includeOptions,
//             order: [['createdAt', 'DESC']],
//             limit: parseInt(pageSize),
//             offset: (parseInt(page) - 1) * parseInt(pageSize)
//         });

//         const transformedConnectedCalls = connectedCalls.rows.map(transformCallData);
//         const transformedNotConnectedCalls = notConnectedCalls.rows.map(transformCallData);

//         res.json({
//             success: true,
//             filters: {
//                 dni,
//                 agentNumber: aPartyNo || 'All',
//                 dateRange: startDate && endDate ? { start: startDate, end: endDate } : null
//             },
//             pagination: {
//                 page: parseInt(page),
//                 pageSize: parseInt(pageSize),
//                 totalPages: Math.ceil(totalCalls / parseInt(pageSize))
//             },
//             totalCalls,
//             connected: {
//                 totalCount: connectedCalls.count,
//                 calls: transformedConnectedCalls
//             },
//             notConnected: {
//                 totalCount: notConnectedCalls.count,
//                 calls: transformedNotConnectedCalls
//             }
//         });

//     } catch (error) {
//         console.error('Error in getCallAnalysis:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching call analysis',
//             error: error.message,
//             stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//         });
//     }
// };






// const formatDateTime = (dateTimeString) => {
//     if (!dateTimeString) return null;
//     const date = new Date(dateTimeString);
//     return {
//         date: date.toLocaleDateString('en-GB'),  // DD/MM/YYYY
//         time: date.toLocaleTimeString('en-US', { hour12: true })  // HH:MM:SS AM/PM
//     };
// };

// const calculateDuration = (endTime, startTime) => {
//     if (!endTime || !startTime) return null;
//     const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000); // in seconds
//     const minutes = Math.floor(duration / 60);
//     const seconds = duration % 60;
//     return `${minutes}:${seconds.toString().padStart(2, '0')}`;
// };

// const transformCallData = (call) => {
//     const startDateTime = formatDateTime(call.callStartTime);
//     return {
//         agentNumber: call.aPartyNo,
//         agentDetails: call.agent ? {
//             name: call.agent.EmployeeName,
//             region: call.agent.EmployeeRegion,
//             employeeId: call.agent.EmployeeId
//         } : null,
//         customerNumber: call.bPartyNo,
//         customerDetails: call.auditLead ? {
//             lotNumber: call.auditLead.Lot_Number,
//             zoneName: call.auditLead.Zone_Name,
//             branchName: call.auditLead.Branch_Name,
//             farmerName: call.auditLead.Farmer_Name,
//             vendor: call.auditLead.Vendor,
//             shedType: call.auditLead.Shed_Type,
//             status: call.auditLead.status,
//             followUpDate: formatDateTime(call.auditLead.follow_up_date)
//         } : null,
//         callStartDate: startDateTime?.date,
//         callStartTime: startDateTime?.time,
//         callStatus: call.bDialStatus,
//         callDuration: calculateDuration(call.bPartyEndTime, call.bPartyConnectedTime),
//         disconnectedBy: call.disconnectedBy,
//         recordingUrl: call.recordVoice
//     };
// };



// exports.getCallAnalysis = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             pageSize = 10,
//             startDate,
//             endDate,
//             dni = "7610233333",
//             aPartyNo
//         } = req.query;

//         let whereClause = {
//             dni: dni,
//             eventType: 'call End'
//         };

//         if (aPartyNo) {
//             whereClause.aPartyNo = aPartyNo;
//         }

//         if (startDate && endDate) {
//             whereClause.createdAt = {
//                 [Op.between]: [new Date(startDate), new Date(endDate)]
//             };
//         }

//         const includeOptions = [
//             {
//                 model: Employee,
//                 as: 'agent',
//                 attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone', 'EmployeeRegion'],
//                 required: false
//             },

//             {
//                 model: AuditLeadTable,
//                 as: 'auditLead',
//                 attributes: [
//                     'Lot_Number',
//                     'Zone_Name',
//                     'Branch_Name',
//                     'Farmer_Name',
//                     'Vendor',
//                     'Shed_Type',
//                     'status',
//                     'follow_up_date'
//                 ],
//                 required: false
//             }
//         ];

//         // Get total calls count
//         const totalCalls = await CallLog.count({
//             where: whereClause
//         });

//         // Get connected calls
//         const connectedCalls = await CallLog.findAndCountAll({
//             where: {
//                 ...whereClause,
//                 bDialStatus: 'Connected'
//             },
//             include: includeOptions,
//             order: [['createdAt', 'DESC']],
//             limit: parseInt(pageSize),
//             offset: (parseInt(page) - 1) * parseInt(pageSize)
//         });

//         // Get not connected calls
//         const notConnectedCalls = await CallLog.findAndCountAll({
//             where: {
//                 ...whereClause,
//                 [Op.or]: [
//                     { bDialStatus: { [Op.ne]: 'Connected' } },
//                     { bDialStatus: null }
//                 ]
//             },
//             include: includeOptions,
//             order: [['createdAt', 'DESC']],
//             limit: parseInt(pageSize),
//             offset: (parseInt(page) - 1) * parseInt(pageSize)
//         });

//         // Transform the data
//         const transformedConnectedCalls = connectedCalls.rows.map(transformCallData);
//         const transformedNotConnectedCalls = notConnectedCalls.rows.map(transformCallData);

//         res.json({
//             success: true,
//             filters: {
//                 dni,
//                 agentNumber: aPartyNo || 'All',
//                 dateRange: startDate && endDate ? {
//                     start: startDate,
//                     end: endDate
//                 } : null
//             },
//             pagination: {
//                 page: parseInt(page),
//                 pageSize: parseInt(pageSize),
//                 totalPages: Math.ceil(totalCalls / parseInt(pageSize))
//             },
//             totalCalls,
//             connected: {
//                 totalCount: connectedCalls.count,
//                 calls: transformedConnectedCalls
//             },
//             notConnected: {
//                 totalCount: notConnectedCalls.count,
//                 calls: transformedNotConnectedCalls
//             }
//         });

//     } catch (error) {
//         console.error('Error in getCallAnalysis:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching call analysis',
//             error: error.message,
//             stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//         });
//     }
// };







const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    const date = new Date(dateTimeString);
    return {
        date: date.toLocaleDateString('en-GB'),
        time: date.toLocaleTimeString('en-US', { hour12: true })
    };
};

const calculateDuration = (endTime, startTime) => {
    if (!endTime || !startTime) return null;
    const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getCustomerDetails = (call) => {
    // First check AuditLeadTable
    if (call.auditLead) {
        return {
            source: 'AuditLeadTable',
            lotNumber: call.auditLead.Lot_Number,
            zoneName: call.auditLead.Zone_Name,
            branchName: call.auditLead.Branch_Name,
            farmerName: call.auditLead.Farmer_Name,
            vendor: call.auditLead.Vendor,
            shedType: call.auditLead.Shed_Type,
            status: call.auditLead.status,
            followUpDate: formatDateTime(call.auditLead.follow_up_date)
        };
    }
    
    // Then check AuditNewFarmer
    if (call.auditNewFarmer) {
        const details = {
            source: 'AuditNewFarmer',
            zoneName: call.auditNewFarmer.Zone_Name,
            branchName: call.auditNewFarmer.branch_Name,
            farmerName: call.auditNewFarmer.farmer_name,
            shedType: call.auditNewFarmer.Shed_Type,
            status: call.auditNewFarmer.status,
            followUpDate: formatDateTime(call.auditNewFarmer.follow_up_date),
            type: call.auditNewFarmer.type,
            followUpBy: call.auditNewFarmer.followUpBy,
            remarks: call.auditNewFarmer.remarks
        };

        // Add fields specific to old farmers
        if (call.auditNewFarmer.type === 'old') {
            details.oldFarmerDetails = {
                ABWT: call.auditNewFarmer.ABWT,
                avgLiftWt: call.auditNewFarmer.Avg_Lift_Wt,
                totalMortality: call.auditNewFarmer.Total_Mortality,
                firstWeekM: call.auditNewFarmer.first_Week_M
            };
        }

        // Add fields specific to new farmers
        if (call.auditNewFarmer.type === 'new') {
            details.newFarmerDetails = {
                previousCompanyName: call.auditNewFarmer.previousCompanyName,
                previousPoultryExperience: call.auditNewFarmer.previousPoultryExperience
            };
        }

        return details;
    }

    return null;
};

const transformCallData = (call) => {
    const startDateTime = formatDateTime(call.callStartTime);
    return {
        agentNumber: call.aPartyNo,
        agentDetails: call.agent ? {
            name: call.agent.EmployeeName,
            region: call.agent.EmployeeRegion,
            employeeId: call.agent.EmployeeId
        } : null,
        customerNumber: call.bPartyNo,
        customerDetails: getCustomerDetails(call),
        callStartDate: startDateTime?.date,
        callStartTime: startDateTime?.time,
        callStatus: call.bDialStatus,
        callDuration: calculateDuration(call.bPartyEndTime, call.bPartyConnectedTime),
        disconnectedBy: call.disconnectedBy,
        recordingUrl: call.recordVoice
    };
};




// exports.getCallAnalysis = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             pageSize = 10,
//             startDate,
//             endDate,
//             dni = "7610233333",
//             aPartyNo
//         } = req.query;

//         let whereClause = {
//             dni: dni,
//             eventType: 'call End'
//         };

//         if (aPartyNo) {
//             whereClause.aPartyNo = aPartyNo;
//         }

//         if (startDate && endDate) {
//             whereClause.createdAt = {
//                 [Op.between]: [new Date(startDate), new Date(endDate)]
//             };
//         }

//         const includeOptions = [
//             {
//                 model: Employee,
//                 as: 'agent',
//                 attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone'],
//                 required: false
//             },
//             {
//                 model: AuditLeadTable,
//                 as: 'auditLead',
//                 attributes: [
//                     'Lot_Number', 'Zone_Name', 'Branch_Name', 'Farmer_Name',
//                     'Vendor', 'Shed_Type', 'status', 'follow_up_date'
//                 ],
//                 required: false
//             },
//             {
//                 model: AuditNewFarmer,
//                 as: 'auditFarmer',
//                 attributes: [
//                     'Zone_Name', 'branch_Name', 'farmer_name', 'Shed_Type',
//                     'status', 'follow_up_date', 'type', 'followUpBy', 'remarks',
//                     'ABWT', 'Avg_Lift_Wt', 'Total_Mortality', 'first_Week_M',
//                     'previousCompanyName', 'previousPoultryExperience'
//                 ],
//                 required: false
//             }
//         ];

//         // Get total calls count
//         const totalCalls = await CallLog.count({
//             where: whereClause
//         });

//         // Get connected calls
//         const connectedCalls = await CallLog.findAndCountAll({
//             where: {
//                 ...whereClause,
//                 bDialStatus: 'Connected'
//             },
//             include: includeOptions,
//             order: [['createdAt', 'DESC']],
//             limit: parseInt(pageSize),
//             offset: (parseInt(page) - 1) * parseInt(pageSize)
//         });

//         // Get not connected calls
//         const notConnectedCalls = await CallLog.findAndCountAll({
//             where: {
//                 ...whereClause,
//                 [Op.or]: [
//                     { bDialStatus: { [Op.ne]: 'Connected' } },
//                     { bDialStatus: null }
//                 ]
//             },
//             include: includeOptions,
//             order: [['createdAt', 'DESC']],
//             limit: parseInt(pageSize),
//             offset: (parseInt(page) - 1) * parseInt(pageSize)
//         });

//         const transformedConnectedCalls = connectedCalls.rows.map(transformCallData);
//         const transformedNotConnectedCalls = notConnectedCalls.rows.map(transformCallData);

//         res.json({
//             success: true,
//             filters: {
//                 dni,
//                 agentNumber: aPartyNo || 'All',
//                 dateRange: startDate && endDate ? { start: startDate, end: endDate } : null
//             },
//             pagination: {
//                 page: parseInt(page),
//                 pageSize: parseInt(pageSize),
//                 totalPages: Math.ceil(totalCalls / parseInt(pageSize))
//             },
//             totalCalls,
//             connected: {
//                 totalCount: connectedCalls.count,
//                 calls: transformedConnectedCalls
//             },
//             notConnected: {
//                 totalCount: notConnectedCalls.count,
//                 calls: transformedNotConnectedCalls
//             }
//         });

//     } catch (error) {
//         console.error('Error in getCallAnalysis:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching call analysis',
//             error: error.message,
//             stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//         });
//     }
// };







//changes in 22 jan 




// exports.getCallAnalysis = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             pageSize = 10,
//             startDate,
//             endDate,
//             dni = "7610233333",
//             aPartyNo
//         } = req.query;

//         let whereClause = {
//             dni: dni,
//             eventType: 'call End'
//         };

//         if (aPartyNo) {
//             whereClause.aPartyNo = aPartyNo;
//         }

//         if (startDate && endDate) {
//             whereClause.createdAt = {
//                 [Op.between]: [new Date(startDate), new Date(endDate)]
//             };
//         }

//         // Modified include options - using subquery for AuditLeadTable
//         const includeOptions = [
//             {
//                 model: Employee,
//                 as: 'agent',
//                 attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone'],
//                 required: false
//             },
//             {
//                 model: AuditLeadTable,
//                 as: 'auditLead',
//                 attributes: [
//                     'Lot_Number', 'Zone_Name', 'Branch_Name', 'Farmer_Name',
//                     'Vendor', 'Shed_Type', 'status', 'follow_up_date'
//                 ],
//                 required: false,
//                 // Add subquery to get only the latest record
//                 where: Sequelize.where(
//                     Sequelize.col('auditLead.Lot_Number'),
//                     'IN',
//                     Sequelize.literal(`(
//                         SELECT t1.Lot_Number
//                         FROM audit_lead_table t1
//                         JOIN (
//                             SELECT Mobile, MAX(Lot_Number) as max_lot
//                             FROM audit_lead_table
//                             GROUP BY Mobile
//                         ) t2 ON t1.Mobile = t2.Mobile AND t1.Lot_Number = t2.max_lot
//                         WHERE t1.Mobile = auditLead.Mobile
//                     )`)
//                 )
            
//             },
//             {
//                 model: AuditNewFarmer,
//                 as: 'auditFarmer',
//                 attributes: [
//                     'Zone_Name', 'branch_Name', 'farmer_name', 'Shed_Type',
//                     'status', 'follow_up_date', 'type', 'followUpBy', 'remarks',
//                     'ABWT', 'Avg_Lift_Wt', 'Total_Mortality', 'first_Week_M',
//                     'previousCompanyName', 'previousPoultryExperience'
//                 ],
//                 required: false
//             }
//         ];

//         // Rest of the code remains the same
//         const totalCalls = await CallLog.count({
//             where: whereClause
//         });

//         const connectedCalls = await CallLog.findAndCountAll({
//             where: {
//                 ...whereClause,
//                 bDialStatus: 'Connected'
//             },
//             include: includeOptions,
//             order: [['createdAt', 'DESC']],
//             limit: parseInt(pageSize),
//             offset: (parseInt(page) - 1) * parseInt(pageSize)
//         });

//         const notConnectedCalls = await CallLog.findAndCountAll({
//             where: {
//                 ...whereClause,
//                 [Op.or]: [
//                     { bDialStatus: { [Op.ne]: 'Connected' } },
//                     { bDialStatus: null }
//                 ]
//             },
//             include: includeOptions,
//             order: [['createdAt', 'DESC']],
//             limit: parseInt(pageSize),
//             offset: (parseInt(page) - 1) * parseInt(pageSize)
//         });

//         const transformedConnectedCalls = connectedCalls.rows.map(transformCallData);
//         const transformedNotConnectedCalls = notConnectedCalls.rows.map(transformCallData);

//         res.json({
//             success: true,
//             filters: {
//                 dni,
//                 agentNumber: aPartyNo || 'All',
//                 dateRange: startDate && endDate ? { start: startDate, end: endDate } : null
//             },
//             pagination: {
//                 page: parseInt(page),
//                 pageSize: parseInt(pageSize),
//                 totalPages: Math.ceil(totalCalls / parseInt(pageSize))
//             },
//             totalCalls,
//             connected: {
//                 totalCount: connectedCalls.count,
//                 calls: transformedConnectedCalls
//             },
//             notConnected: {
//                 totalCount: notConnectedCalls.count,
//                 calls: transformedNotConnectedCalls
//             }
//         });

//     } catch (error) {
//         console.error('Error in getCallAnalysis:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching call analysis',
//             error: error.message,
//             stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//         });
//     }
// };
exports.getCallAnalysis = async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            startDate,
            endDate,
            dni = "7610233333",
            aPartyNo,
            callStatus // 'Connected' or 'NotConnected'
        } = req.query;

        let whereClause = {
            dni: dni,
            eventType: 'call End'
        };

        if (aPartyNo) {
            whereClause.aPartyNo = aPartyNo;
        }

        // Add call status filter
        if (callStatus === 'Connected') {
            whereClause.bDialStatus = 'Connected';
        } else if (callStatus === 'NotConnected') {
            whereClause = {
                ...whereClause,
                [Op.or]: [
                    { bDialStatus: { [Op.ne]: 'Connected' } },
                    { bDialStatus: null }
                ]
            };
        }

        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const includeOptions = [
            {
                model: Employee,
                as: 'agent',
                attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone'],
                required: false
            },
            {
                model: AuditLeadTable,
                as: 'auditLead',
                attributes: [
                    'Lot_Number', 'Zone_Name', 'Branch_Name', 'Farmer_Name',
                    'Vendor', 'Shed_Type', 'status', 'follow_up_date'
                ],
                required: false,
                where: Sequelize.where(
                    Sequelize.col('auditLead.Lot_Number'),
                    'IN',
                    Sequelize.literal(`(
                        SELECT t1.Lot_Number
                        FROM audit_lead_table t1
                        JOIN (
                            SELECT Mobile, MAX(Lot_Number) as max_lot
                            FROM audit_lead_table
                            GROUP BY Mobile
                        ) t2 ON t1.Mobile = t2.Mobile AND t1.Lot_Number = t2.max_lot
                        WHERE t1.Mobile = auditLead.Mobile
                    )`)
                )
            },
            {
                model: AuditNewFarmer,
                as: 'auditFarmer',
                attributes: [
                    'Zone_Name', 'branch_Name', 'farmer_name', 'Shed_Type',
                    'status', 'follow_up_date', 'type', 'followUpBy', 'remarks',
                    'ABWT', 'Avg_Lift_Wt', 'Total_Mortality', 'first_Week_M',
                    'previousCompanyName', 'previousPoultryExperience'
                ],
                required: false
            }
        ];

        // Get total calls for summary
        const totalCalls = await CallLog.count({
            where: {
                dni: dni,
                eventType: 'call End',
                ...(aPartyNo && { aPartyNo }),
                ...(startDate && endDate && {
                    createdAt: {
                        [Op.between]: [new Date(startDate), new Date(endDate)]
                    }
                })
            }
        });

        // Get connected calls count and duration
        const connectedCallsData = await CallLog.findAll({
            where: {
                dni: dni,
                eventType: 'call End',
                bDialStatus: 'Connected',
                ...(aPartyNo && { aPartyNo }),
                ...(startDate && endDate && {
                    createdAt: {
                        [Op.between]: [new Date(startDate), new Date(endDate)]
                    }
                })
            },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('*')), 'count'],
                [
                    sequelize.fn(
                        'SUM',
                        sequelize.fn(
                            'TIMESTAMPDIFF',
                            sequelize.literal('SECOND'),
                            sequelize.col('bPartyConnectedTime'),
                            sequelize.col('bPartyEndTime')
                        )
                    ),
                    'total_duration'
                ]
            ],
            raw: true
        });

        const connectedCount = parseInt(connectedCallsData[0].count || 0);
        const totalDurationSeconds = Math.abs(Number(connectedCallsData[0].total_duration || 0));

        // Format duration
        const formatDuration = (seconds) => {
            if (!seconds) return '00:00:00';
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        // Get paginated calls based on callStatus
        const calls = await CallLog.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            order: [['createdAt', 'DESC']],
            limit: parseInt(pageSize),
            offset: (parseInt(page) - 1) * parseInt(pageSize)
        });

        const transformedCalls = calls.rows.map(transformCallData);

        // Calculate connection rate
        const connectionRate = totalCalls ? ((connectedCount / totalCalls) * 100).toFixed(2) : '0.00';

        res.json({
            success: true,
            filters: {
                dni,
                agentNumber: aPartyNo || 'All',
                callStatus: callStatus || 'All',
                dateRange: startDate && endDate ? { start: startDate, end: endDate } : null
            },
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(calls.count / parseInt(pageSize)),
                 totalRecords : totalCalls 
            },
            summary: {
                totalCalls,
                connectedCalls: connectedCount,
                missedCalls: totalCalls - connectedCount,
                connectionRate: `${connectionRate}%`,
                totalDuration: formatDuration(totalDurationSeconds)
            },
            totalCalls,
            connected: {
                totalCount: connectedCount,
                calls: callStatus === 'Connected' ? transformedCalls : []
            },
            notConnected: {
                totalCount: totalCalls - connectedCount,
                calls: callStatus === 'NotConnected' ? transformedCalls : []
            }
        });

    } catch (error) {
        console.error('Error in getCallAnalysis:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching call analysis',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};




 







exports.getEmployeeCallStats = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
        } = req.query;

      
        let dateFilter = {};
        if (startDate && endDate) {
            // Create Date objects for start and end
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);  // Set to beginning of day

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);  // Set to end of day

            dateFilter = {
                createdAt: {
                    [Op.between]: [start, end]
                }
            };
        }

        // Get all employees with RoleID 100
        const employees = await Employee.findAll({
            where: {
                EmployeeRoleID: 100
            },
            attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone']
        });

        // Get call statistics for each employee
        const employeeStats = await Promise.all(employees.map(async (employee) => {
            // Get connected calls stats
            const connectedCalls = await CallLog.findAll({
                where: {
                    aPartyNo: employee.EmployeePhone,
                    bDialStatus: 'Connected',
                    eventType: 'call End',
                    bPartyConnectedTime: { [Op.not]: null },
                    bPartyEndTime: { [Op.not]: null },
                    ...dateFilter
                },
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('*')), 'total_calls'],
                    [
                        sequelize.fn(
                            'SUM',
                            sequelize.fn(
                                'TIMESTAMPDIFF',
                                sequelize.literal('SECOND'),
                                sequelize.col('bPartyConnectedTime'),
                                sequelize.col('bPartyEndTime')
                            )
                        ),
                        'total_duration'
                    ],
                    [
                        sequelize.fn(
                            'AVG',
                            sequelize.fn(
                                'TIMESTAMPDIFF',
                                sequelize.literal('SECOND'),
                                sequelize.col('bPartyConnectedTime'),
                                sequelize.col('bPartyEndTime')
                            )
                        ),
                        'avg_duration'
                    ]
                ],
                raw: true
            });

            // Get not connected calls count
            const notConnectedCalls = await CallLog.count({
                where: {
                    aPartyNo: employee.EmployeePhone,
                    [Op.or]: [
                        { bDialStatus: { [Op.ne]: 'Connected' } },
                        { bDialStatus: null }
                    ],
                    eventType: 'call End',
                    ...dateFilter
                }
            });

            // Calculate percentages and format durations
            const totalCalls = parseInt(connectedCalls[0].total_calls || 0) + notConnectedCalls;
            const connectionRate = totalCalls ? 
                ((parseInt(connectedCalls[0].total_calls || 0) / totalCalls) * 100).toFixed(2) : 0;

            // Convert seconds to hours:minutes:seconds
            const formatDuration = (seconds) => {
                if (!seconds) return '00:00:00';
                seconds = Math.abs(Math.floor(Number(seconds))); // Using abs to handle negative differences
                const hrs = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            };

            return {
                employeeId: employee.EmployeeId,
                employeeName: employee.EmployeeName,
                employeePhone: employee.EmployeePhone,
                callStats: {
                    totalCalls,
                    connectedCalls: parseInt(connectedCalls[0].total_calls || 0),
                    notConnectedCalls,
                    connectionRate: `${connectionRate}%`,
                    duration: {
                        total: formatDuration(connectedCalls[0].total_duration),
                        average: formatDuration(connectedCalls[0].avg_duration)
                    }
                }
            };
        }));

        // Sort employees by total calls in descending order
        const sortedStats = employeeStats.sort((a, b) => 
            b.callStats.totalCalls - a.callStats.totalCalls
        );

        // Calculate overall statistics
        const overallStats = {
            totalEmployees: employees.length,
            totalCalls: sortedStats.reduce((sum, emp) => sum + emp.callStats.totalCalls, 0),
            totalConnectedCalls: sortedStats.reduce((sum, emp) => sum + emp.callStats.connectedCalls, 0),
            totalNotConnectedCalls: sortedStats.reduce((sum, emp) => sum + emp.callStats.notConnectedCalls, 0),
            averageConnectionRate: (
                sortedStats.reduce((sum, emp) => sum + parseFloat(emp.callStats.connectionRate), 0) / 
                employees.length
            ).toFixed(2) + '%'
        };

        res.json({
            success: true,
            filters: {
                roleId: 100,
                dateRange: startDate && endDate ? { start: startDate, end: endDate } : null
            },
            overallStats,
            employeeStats: sortedStats
        });

    } catch (error) {
        console.error('Error in getEmployeeCallStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employee call statistics',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};






// exports.getWorkingHoursReport = async (req, res) => {

//     try {
//         const {
//             startDate,
//             endDate,
//         } = req.query;

//         if (!startDate || !endDate) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Start date and end date are required'
//             });
//         }

//         // Constants for working hours calculation
//         const HOURS_PER_DAY = 7.5;
//         const HOURS_PER_SATURDAY = 4;
        
//         // Get all employees with RoleID 100
//         const employees = await Employee.findAll({
//             where: {
//                 EmployeeRoleID: 100
//             },
//             attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone']
//         });

//         // Function to count weekdays and Saturdays between two dates
//         const getWorkingDays = (startDate, endDate) => {
//             let weekdays = 0;
//             let saturdays = 0;
//             let current = new Date(startDate);
//             const end = new Date(endDate);

//             while (current <= end) {
//                 const day = current.getDay();
//                 if (day !== 0) { // Skip Sundays
//                     if (day === 6) { // Saturday
//                         saturdays++;
//                     } else { // Monday to Friday
//                         weekdays++;
//                     }
//                 }
//                 current.setDate(current.getDate() + 1);
//             }
//             return { weekdays, saturdays };
//         };

//         // Calculate working days for the date range
//         const { weekdays, saturdays } = getWorkingDays(startDate, endDate);

//         const employeeStats = await Promise.all(employees.map(async (employee) => {
//             // Get total call duration for the employee
//             const callDuration = await CallLog.findAll({
//                 where: {
//                     aPartyNo: employee.EmployeePhone,
//                     bDialStatus: 'Connected',
//                     eventType: 'call End',
//                     bPartyConnectedTime: { [Op.not]: null },
//                     bPartyEndTime: { [Op.not]: null },
//                     createdAt: {
//                         [Op.between]: [
//                             new Date(startDate + 'T00:00:00'),
//                             new Date(endDate + 'T23:59:59')
//                         ]
//                     }
//                 },
//                 attributes: [
//                     [
//                         sequelize.fn(
//                             'SUM',
//                             sequelize.fn(
//                                 'TIMESTAMPDIFF',
//                                 sequelize.literal('SECOND'),
//                                 sequelize.col('bPartyConnectedTime'),
//                                 sequelize.col('bPartyEndTime')
//                             )
//                         ),
//                         'total_duration'
//                     ]
//                 ],
//                 raw: true
//             });

//             // Calculate expected and actual working hours
//             const weekdayHours = weekdays * HOURS_PER_DAY;
//             const saturdayHours = saturdays * HOURS_PER_SATURDAY;
//             const totalExpectedHours = weekdayHours + saturdayHours;

//             // Convert call duration from seconds to hours
//             const totalWorkedSeconds = Math.abs(Number(callDuration[0].total_duration || 0));
//             const totalWorkedHours = totalWorkedSeconds / 3600;

//             // Calculate percentage of target achieved
//             const workedPercentage = (totalWorkedHours / totalExpectedHours) * 100;

//             return {
//                 employeeName: employee.EmployeeName,
//                 totalWeekdays: weekdays,
//                 hoursPerDay: HOURS_PER_DAY,
//                 totalWeekdayHours: weekdayHours,
//                 saturdays: saturdays,
//                 hoursPerSaturday: HOURS_PER_SATURDAY,
//                 totalSaturdayHours: saturdayHours,
//                 totalExpectedHours: totalExpectedHours,
//                 totalWorkedHours: parseFloat(totalWorkedHours.toFixed(2)),
//                 totalWorkedPercentage: parseFloat(workedPercentage.toFixed(2))
//             };
//         }));

//         // Calculate grand totals
//         const grandTotal = employeeStats.reduce((total, emp) => ({
//             totalExpectedHours: total.totalExpectedHours + emp.totalExpectedHours,
//             totalWorkedHours: total.totalWorkedHours + emp.totalWorkedHours
//         }), { totalExpectedHours: 0, totalWorkedHours: 0 });

//         // Add percentage for grand total
//         grandTotal.totalWorkedPercentage = parseFloat(
//             ((grandTotal.totalWorkedHours / grandTotal.totalExpectedHours) * 100).toFixed(2)
//         );

//         res.json({
//             success: true,
//             dateRange: {
//                 startDate,
//                 endDate
//             },
//             workingDays: {
//                 weekdays,
//                 saturdays
//             },
//             employeeStats,
//             grandTotal
//         });

//     } catch (error) {
//         console.error('Error in getWorkingHoursReport:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error generating working hours report',
//             error: error.message,
//             stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//         });
//     }
// };




//changes on 22jan  --- workinghours report

//main code 



// exports.getWorkingHoursReport = async (req, res) => {
//     try {
//         const {
//             startDate,
//             endDate,
//         } = req.query;

//         if (!startDate || !endDate) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Start date and end date are required'
//             });
//         }

//         // Constants for working hours calculation
//         const HOURS_PER_DAY = 7.5;
//         const HOURS_PER_SATURDAY = 4;
        
//         // Get all employees with RoleID 100
//         const employees = await Employee.findAll({
//             where: {
//                 EmployeeRoleID: 100
//             },
//             attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone']
//         });

//         // Function to count weekdays and Saturdays between two dates
//         const getWorkingDays = (startDate, endDate) => {
//             let weekdays = 0;
//             let saturdays = 0;
//             let current = new Date(startDate);
//             const end = new Date(endDate);

//             while (current <= end) {
//                 const day = current.getDay();
//                 if (day !== 0) { // Skip Sundays
//                     if (day === 6) { // Saturday
//                         saturdays++;
//                     } else { // Monday to Friday
//                         weekdays++;
//                     }
//                 }
//                 current.setDate(current.getDate() + 1);
//             }
//             return { weekdays, saturdays };
//         };

//         // Calculate working days for the date range
//         const { weekdays, saturdays } = getWorkingDays(startDate, endDate);

//         const employeeStats = await Promise.all(employees.map(async (employee) => {
//             // Get outgoing calls duration from CallLog
//             const outgoingCalls = await CallLog.findAll({
//                 where: {
//                     aPartyNo: employee.EmployeePhone,
//                     bDialStatus: 'Connected',
//                     eventType: 'call End',
//                     bPartyConnectedTime: { [Op.not]: null },
//                     bPartyEndTime: { [Op.not]: null },
//                     createdAt: {
//                         [Op.between]: [
//                             new Date(startDate + 'T00:00:00'),
//                             new Date(endDate + 'T23:59:59')
//                         ]
//                     }
//                 },
//                 attributes: [
//                     [
//                         sequelize.fn(
//                             'SUM',
//                             sequelize.fn(
//                                 'TIMESTAMPDIFF',
//                                 sequelize.literal('SECOND'),
//                                 sequelize.col('bPartyConnectedTime'),
//                                 sequelize.col('bPartyEndTime')
//                             )
//                         ),
//                         'total_duration'
//                     ]
//                 ],
//                 raw: true
//             });

//             // Get incoming calls duration from PostCallData
//             const incomingCalls = await PostCallData.findAll({
//                 where: {
//                     agentNumber: employee.EmployeePhone,
//                     ogCallStatus: 'Connected',
//                     createdAt: {
//                         [Op.between]: [
//                             new Date(startDate + 'T00:00:00'),
//                             new Date(endDate + 'T23:59:59')
//                         ]
//                     }
//                 },
//                 attributes: [
//                     [sequelize.fn('SUM', sequelize.col('total_Call_Duration')), 'total_duration']
//                 ],
//                 raw: true
//             });

//             // Calculate total duration from both sources
//             const totalOutgoingSeconds = Math.abs(Number(outgoingCalls[0].total_duration || 0));
//             const totalIncomingSeconds = Number(incomingCalls[0].total_duration || 0);
//             const totalSeconds = totalOutgoingSeconds + totalIncomingSeconds;

//             // Calculate expected and actual working hours
//             const weekdayHours = weekdays * HOURS_PER_DAY;
//             const saturdayHours = saturdays * HOURS_PER_SATURDAY;
//             const totalExpectedHours = weekdayHours + saturdayHours;

//             // Convert total seconds to hours
//             const totalWorkedHours = totalSeconds / 3600;

//             // Calculate percentage of target achieved
//             const workedPercentage = (totalWorkedHours / totalExpectedHours) * 100;

//             return {
//                 employeeName: employee.EmployeeName,
//                 employeePhone: employee.EmployeePhone,
//                 totalWeekdays: weekdays,
//                 hoursPerDay: HOURS_PER_DAY,
//                 totalWeekdayHours: weekdayHours,
//                 saturdays: saturdays,
//                 hoursPerSaturday: HOURS_PER_SATURDAY,
//                 totalSaturdayHours: saturdayHours,
//                 totalExpectedHours: totalExpectedHours,
//                 totalWorkedHours: parseFloat(totalWorkedHours.toFixed(2)),
//                 totalWorkedPercentage: parseFloat(workedPercentage.toFixed(2)),
//                 callDetails: {
//                     outgoingHours: parseFloat((totalOutgoingSeconds / 3600).toFixed(2)),
//                     incomingHours: parseFloat((totalIncomingSeconds / 3600).toFixed(2))
//                 }
//             };
//         }));

//         // Calculate grand totals
//         const grandTotal = employeeStats.reduce((total, emp) => ({
//             totalExpectedHours: total.totalExpectedHours + emp.totalExpectedHours,
//             totalWorkedHours: total.totalWorkedHours + emp.totalWorkedHours,
//             outgoingHours: total.outgoingHours + emp.callDetails.outgoingHours,
//             incomingHours: total.incomingHours + emp.callDetails.incomingHours
//         }), { 
//             totalExpectedHours: 0, 
//             totalWorkedHours: 0,
//             outgoingHours: 0,
//             incomingHours: 0
//         });

//         // Add percentage for grand total
//         grandTotal.totalWorkedPercentage = parseFloat(
//             ((grandTotal.totalWorkedHours / grandTotal.totalExpectedHours) * 100).toFixed(2)
//         );

//         res.json({
//             success: true,
//             dateRange: {
//                 startDate,
//                 endDate
//             },
//             workingDays: {
//                 weekdays,
//                 saturdays
//             },
//             employeeStats: employeeStats.sort((a, b) => b.totalWorkedHours - a.totalWorkedHours),
//             grandTotal
//         });

//     } catch (error) {
//         console.error('Error in getWorkingHoursReport:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error generating working hours report',
//             error: error.message,
//             stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//         });
//     }
// };




// update code 
exports.getWorkingHoursReport = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            agentNumber
        } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        // Constants for working hours calculation
        const HOURS_PER_DAY = 7.5;
        const HOURS_PER_SATURDAY = 4;
        
        // Get employees with RoleID 100 and optional agentNumber filter
        let employeeWhere = {
            EmployeeRoleID: 100
        };
        
        // Add agentNumber filter if provided
        if (agentNumber) {
            employeeWhere.EmployeePhone = agentNumber;
        }

        const employees = await Employee.findAll({
            where: employeeWhere,
            attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone']
        });

        // Check if employees were found
        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: agentNumber ? 'Agent not found' : 'No employees found'
            });
        }

        // Function to count weekdays and Saturdays between two dates
        const getWorkingDays = (startDate, endDate) => {
            let weekdays = 0;
            let saturdays = 0;
            let current = new Date(startDate);
            const end = new Date(endDate);

            while (current <= end) {
                const day = current.getDay();
                if (day !== 0) { // Skip Sundays
                    if (day === 6) { // Saturday
                        saturdays++;
                    } else { // Monday to Friday
                        weekdays++;
                    }
                }
                current.setDate(current.getDate() + 1);
            }
            return { weekdays, saturdays };
        };

        // Calculate working days for the date range
        const { weekdays, saturdays } = getWorkingDays(startDate, endDate);

        const employeeStats = await Promise.all(employees.map(async (employee) => {
            // Get outgoing calls duration from CallLog
            const outgoingCalls = await CallLog.findAll({
                where: {
                    aPartyNo: employee.EmployeePhone,
                    bDialStatus: 'Connected',
                    eventType: 'call End',
                    bPartyConnectedTime: { [Op.not]: null },
                    bPartyEndTime: { [Op.not]: null },
                    createdAt: {
                        [Op.between]: [
                            new Date(startDate + 'T00:00:00'),
                            new Date(endDate + 'T23:59:59')
                        ]
                    }
                },
                attributes: [
                    [
                        sequelize.fn(
                            'SUM',
                            sequelize.fn(
                                'TIMESTAMPDIFF',
                                sequelize.literal('SECOND'),
                                sequelize.col('bPartyConnectedTime'),
                                sequelize.col('bPartyEndTime')
                            )
                        ),
                        'total_duration'
                    ]
                ],
                raw: true
            });

            // Get incoming calls duration from PostCallData
            const incomingCalls = await PostCallData.findAll({
                where: {
                    agentNumber: employee.EmployeePhone,
                    ogCallStatus: 'Connected',
                    createdAt: {
                        [Op.between]: [
                            new Date(startDate + 'T00:00:00'),
                            new Date(endDate + 'T23:59:59')
                        ]
                    }
                },
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('total_call_duration')), 'total_duration']
                ],
                raw: true
            });

            // Calculate total duration from both sources
            const totalOutgoingSeconds = Math.abs(Number(outgoingCalls[0].total_duration || 0));
            const totalIncomingSeconds = Number(incomingCalls[0].total_duration || 0);
            const totalSeconds = totalOutgoingSeconds + totalIncomingSeconds;

            // Calculate expected and actual working hours
            const weekdayHours = weekdays * HOURS_PER_DAY;
            const saturdayHours = saturdays * HOURS_PER_SATURDAY;
            const totalExpectedHours = weekdayHours + saturdayHours;

            // Convert total seconds to hours
            const totalWorkedHours = totalSeconds / 3600;

            // Calculate percentage of target achieved
            const workedPercentage = (totalWorkedHours / totalExpectedHours) * 100;

            // Get call counts
            const outgoingCallCount = await CallLog.count({
                where: {
                    aPartyNo: employee.EmployeePhone,
                    bDialStatus: 'Connected',
                    eventType: 'call End',
                    createdAt: {
                        [Op.between]: [
                            new Date(startDate + 'T00:00:00'),
                            new Date(endDate + 'T23:59:59')
                        ]
                    }
                }
            });

            const incomingCallCount = await PostCallData.count({
                where: {
                    agentNumber: employee.EmployeePhone,
                    ogCallStatus: 'Connected',
                    createdAt: {
                        [Op.between]: [
                            new Date(startDate + 'T00:00:00'),
                            new Date(endDate + 'T23:59:59')
                        ]
                    }
                }
            });

            return {
                employeeId: employee.EmployeeId,
                employeeName: employee.EmployeeName,
                employeePhone: employee.EmployeePhone,
                totalWeekdays: weekdays,
                hoursPerDay: HOURS_PER_DAY,
                totalWeekdayHours: weekdayHours,
                saturdays: saturdays,
                hoursPerSaturday: HOURS_PER_SATURDAY,
                totalSaturdayHours: saturdayHours,
                totalExpectedHours: totalExpectedHours,
                totalWorkedHours: parseFloat(totalWorkedHours.toFixed(2)),
                totalWorkedPercentage: parseFloat(workedPercentage.toFixed(2)),
                callDetails: {
                    outgoing: {
                        count: outgoingCallCount,
                        hours: parseFloat((totalOutgoingSeconds / 3600).toFixed(2))
                    },
                    incoming: {
                        count: incomingCallCount,
                        hours: parseFloat((totalIncomingSeconds / 3600).toFixed(2))
                    },
                    total: {
                        count: outgoingCallCount + incomingCallCount,
                        hours: parseFloat((totalSeconds / 3600).toFixed(2))
                    }
                }
            };
        }));

        // Calculate grand totals
        const grandTotal = employeeStats.reduce((total, emp) => ({
            totalExpectedHours: total.totalExpectedHours + emp.totalExpectedHours,
            totalWorkedHours: total.totalWorkedHours + emp.totalWorkedHours,
            outgoing: {
                count: total.outgoing?.count || 0 + emp.callDetails.outgoing.count,
                hours: total.outgoing?.hours || 0 + emp.callDetails.outgoing.hours
            },
            incoming: {
                count: total.incoming?.count || 0 + emp.callDetails.incoming.count,
                hours: total.incoming?.hours || 0 + emp.callDetails.incoming.hours
            }
        }), { 
            totalExpectedHours: 0, 
            totalWorkedHours: 0,
            outgoing: { count: 0, hours: 0 },
            incoming: { count: 0, hours: 0 }
        });

        // Add percentage and total calls for grand total
        grandTotal.totalWorkedPercentage = parseFloat(
            ((grandTotal.totalWorkedHours / grandTotal.totalExpectedHours) * 100).toFixed(2)
        );
        grandTotal.totalCalls = {
            count: grandTotal.outgoing.count + grandTotal.incoming.count,
            hours: parseFloat((grandTotal.outgoing.hours + grandTotal.incoming.hours).toFixed(2))
        };

        res.json({
            success: true,
            filters: {
                dateRange: {
                    start: startDate,
                    end: endDate
                },
                agentNumber: agentNumber || 'All'
            },
            workingDays: {
                weekdays,
                saturdays,
                totalDays: weekdays + saturdays,
                totalExpectedHours: (weekdays * HOURS_PER_DAY) + (saturdays * HOURS_PER_SATURDAY)
            },
            employeeStats: employeeStats.sort((a, b) => b.totalWorkedHours - a.totalWorkedHours),
            grandTotal
        });

    } catch (error) {
        console.error('Error in getWorkingHoursReport:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating working hours report',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};










//incoming v3
exports.getIncomingCallStats = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            page = 1,
            pageSize = 10
        } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        // Get all employees with RoleID 100
        const employees = await Employee.findAll({
            where: {
                EmployeeRoleID: 100
            },
            attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone']
        });

        const employeeStats = await Promise.all(employees.map(async (employee) => {
            // Get connected calls
            const connectedCalls = await PostCallData.findAll({
                where: {
                    agentNumber: employee.EmployeePhone,
                    ogCallStatus: 'Connected',
                    createdAt: {
                        [Op.between]: [
                            new Date(startDate + 'T00:00:00'),
                            new Date(endDate + 'T23:59:59')
                        ]
                    }
                },
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('*')), 'call_count'],
                    [sequelize.fn('SUM', sequelize.col('total_call_Duration')), 'total_duration'],
                    [sequelize.fn('AVG', sequelize.col('total_Call_Duration')), 'avg_duration']
                ],
                raw: true
            });

            // Get missed calls (where agent_number exists but call not connected)
            const missedCalls = await PostCallData.count({
                where: {
                    agentNumber: employee.EmployeePhone,
                    ogCallStatus: {
                        [Op.and]: [
                            { [Op.ne]: 'Connected' },
                            { [Op.ne]: null }
                        ]
                    },

                    isOutGoingDone: {
                        [Op.or]: [0, null]
                    },
                    createdAt: {
                        [Op.between]: [
                            new Date(startDate + 'T00:00:00'),
                            new Date(endDate + 'T23:59:59')
                        ]
                    }
                }
            });

            // Format durations to hours:minutes:seconds
            const formatDuration = (seconds) => {
                if (!seconds) return '00:00:00';
                seconds = Math.floor(Number(seconds));
                const hrs = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            };

            // Calculate total calls and connection rate
            const totalCalls = parseInt(connectedCalls[0].call_count || 0) + missedCalls;
            const connectionRate = totalCalls ? 
                ((parseInt(connectedCalls[0].call_count || 0) / totalCalls) * 100).toFixed(2) : 0;

            return {
                employeeId: employee.EmployeeId,
                employeeName: employee.EmployeeName,
                employeePhone: employee.EmployeePhone,
                callStats: {
                    totalCalls,
                    connectedCalls: parseInt(connectedCalls[0].call_count || 0),
                    missedCalls,
                    connectionRate: `${connectionRate}%`,
                    duration: {
                        total: formatDuration(connectedCalls[0].total_duration),
                        average: formatDuration(connectedCalls[0].avg_duration)
                    }
                }
            };
        }));

        // Sort employees by total calls in descending order
        const sortedStats = employeeStats.sort((a, b) => 
            b.callStats.totalCalls - a.callStats.totalCalls
        );

        // Calculate overall statistics
        const overallStats = {
            totalEmployees: employees.length,
            totalCalls: sortedStats.reduce((sum, emp) => sum + emp.callStats.totalCalls, 0),
            totalConnectedCalls: sortedStats.reduce((sum, emp) => sum + emp.callStats.connectedCalls, 0),
            totalMissedCalls: sortedStats.reduce((sum, emp) => sum + emp.callStats.missedCalls, 0),
            averageConnectionRate: (
                sortedStats.reduce((sum, emp) => sum + parseFloat(emp.callStats.connectionRate), 0) / 
                employees.length
            ).toFixed(2) + '%'
        };

        // Implement pagination
        const totalRecords = sortedStats.length;
        const totalPages = Math.ceil(totalRecords / pageSize);
        const paginatedStats = sortedStats.slice(
            (page - 1) * pageSize,
            page * pageSize
        );

        res.json({
            success: true,
            filters: {
                dateRange: {
                    start: startDate,
                    end: endDate
                }
            },
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalPages,
                totalRecords
            },
            overallStats,
            employeeStats: paginatedStats
        });

    } catch (error) {
        console.error('Error in getIncomingCallStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching incoming call statistics',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};





//incoming call detail


exports.getAgentCallDetails = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            agentNumber,
            page = 1,
            pageSize = 10,
            callStatus // optional: 'Connected' or 'Missed'
        } = req.query;

        if (!startDate || !endDate || !agentNumber) {
            return res.status(400).json({
                success: false,
                message: 'Start date, end date, and agent number are required'
            });
        }

        // Base where clause
        let whereClause = {
            agentNumber,
            createdAt: {
                [Op.between]: [
                    new Date(startDate + 'T00:00:00'),
                    new Date(endDate + 'T23:59:59')
                ]
            }
        };

    // Add call status filter if provided
if (callStatus) {
    if (callStatus === 'Connected') {
        whereClause.ogCallStatus = 'Connected';
    } else if (callStatus === 'Missed') {
        whereClause = {
            ...whereClause,
            ogCallStatus: {
                [Op.and]: [
                    { [Op.ne]: 'Connected' },
                    { [Op.ne]: null }
                ]
            },
            isOutGoingDone: {
                [Op.or]: [0, null]
            }
        };
    }
}



        // Get employee details
        const employee = await Employee.findOne({
            where: {
                EmployeePhone: agentNumber
            },
            attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone']
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Get total count of records
        const totalRecords = await PostCallData.count({
            where: whereClause
        });

        // Get paginated call details
        const calls = await PostCallData.findAll({
            where: whereClause,
            attributes: [
                'id',
                'callId',
                'callerNumber',
                'callStartTime',
                'callEndTime',
                'ogStartTime',
                'ogEndTime',
                'ogCallStatus',
                'totalCallDuration',
                'createdAt'
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(pageSize),
            offset: (parseInt(page) - 1) * parseInt(pageSize)
        });

        // Format call records
        const formattedCalls = calls.map(call => {
            const callData = call.get({ plain: true });
            
            // Format duration to HH:MM:SS
            const formatDuration = (seconds) => {
                if (!seconds) return '00:00:00';
                seconds = Math.floor(Number(seconds));
                const hrs = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            };

            return {
                ...callData,
                duration: formatDuration(callData.totalCallDuration),
                isConnected: callData.ogCallStatus === 'Connected',
                callDate: new Date(callData.createdAt).toISOString().split('T')[0],
                callTime: new Date(callData.createdAt).toISOString().split('T')[1].split('.')[0]
            };
        });

        // Calculate summary statistics
        const connectedCalls = await PostCallData.count({
            where: {
                ...whereClause,
                ogCallStatus: 'Connected'
            }
        });

        const missedCalls = await PostCallData.count({
            where: {
                ...whereClause,
                ogCallStatus: {
                    [Op.and]: [
                        { [Op.ne]: 'Connected' },
                        { [Op.ne]: null }
                    ]
                }
            }
        });

        const totalDuration = await PostCallData.sum('totalCallDuration', {
            where: {
                ...whereClause,
                ogCallStatus: 'Connected'
            }
        });

        const formatTotalDuration = (seconds) => {
            if (!seconds) return '00:00:00';
            seconds = Math.floor(Number(seconds));
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        res.json({
            success: true,
            employeeDetails: {
                ...employee.get({ plain: true })
            },
            summary: {
                totalCalls: totalRecords,
                connectedCalls,
                missedCalls,
                connectionRate: `${((connectedCalls / totalRecords) * 100).toFixed(2)}%`,
                totalDuration: formatTotalDuration(totalDuration)
            },
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(totalRecords / parseInt(pageSize)),
                totalRecords
            },
            calls: formattedCalls
        });

    } catch (error) {
        console.error('Error in getAgentCallDetails:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching agent call details',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};




//removed missed call api
exports.updateOutgoingDoneStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Record ID is required'
            });
        }

        // Update the record using the exact column name from database
        const [updatedRows] = await PostCallData.update(
            { isOutGoingDone: true },  // Exact column name from database
            {
                where: {
                    id: id,
                    isOutGoingDone: {  // Exact column name from database
                        [Op.or]: [false, null]
                    }
                }
            }
        );

        if (updatedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Record not found or already marked as outgoing done'
            });
        }

        // Get the updated record
        const updatedRecord = await PostCallData.findByPk(id);

        res.json({
            success: true,
            message: 'Record updated successfully',
            updatedId: id,
            record: updatedRecord
        });

    } catch (error) {
        console.error('Error updating isOutGoingDone status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating outgoing done status',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};