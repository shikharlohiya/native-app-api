const express = require('express');
const { QueryTypes, Op,fn, literal } = require('sequelize');
const Employee = require('../../models/employee');
const AuditLeadRemark = require('../../models/AuditLeadRemark');
const AuditLeadTable = require('../../models/AuditLeadTable');
const Employee_Role = require('../../models/employeRole');
const sequelize = require("../../models/index");
const ejs = require('ejs');
const path = require('path');
const pdf = require('pdf-creator-node');
const fs = require('fs-extra');
const { Parser } = require('json2csv');
const moment = require("moment");


Employee.belongsTo(Employee_Role, {
    foreignKey: "EmployeeRoleID",
    as: "role",
  });
  
  Employee_Role.hasMany(Employee, {
    foreignKey: "EmployeeRoleID",
    as: "employees",
  });
  
 


  //counting of agent performance

// exports.AgentDetailReport = async (req, res) => {
//     try {
//       const { startDate, endDate, agentName } = req.query;
  
//       // Construct date filter conditions
//       const remarkDateFilter = startDate && endDate 
//         ? `DATE(alr.createdAt) BETWEEN '${startDate}' AND '${endDate}'`
//         : '1=1';
  
//       // For direct table queries (no alias needed)
//       const followupDateFilter = startDate && endDate 
//         ? `DATE(follow_up_date) BETWEEN '${startDate}' AND '${endDate}'`
//         : '1=1';
  
//       // For queries with JOIN (using alias)
//       const followupDateFilterWithAlias = startDate && endDate 
//         ? `DATE(alt.follow_up_date) BETWEEN '${startDate}' AND '${endDate}'`
//         : '1=1';
  
//       // Get remarks count by status
//       const remarkStatusQuery = `
//         SELECT 
//           closure_status,
//           COUNT(*) as count
//         FROM audit_lead_remarks alr
//         WHERE ${remarkDateFilter}
//         GROUP BY closure_status;
//       `;
  
//       const overallStatusCounts = await sequelize.query(remarkStatusQuery, {
//         type: QueryTypes.SELECT
//       });
  
//       // Get total remarks count
//       const totalRemarks = overallStatusCounts.reduce((sum, item) => sum + parseInt(item.count), 0);
  
//       // Get follow-up statistics
//       const followupQuery = `
//         SELECT 
//           COUNT(*) as total_followups,
//           SUM(CASE WHEN DATE(follow_up_date) = DATE(completed_on) THEN 1 ELSE 0 END) as completed_followups
//         FROM audit_lead_table
//         WHERE follow_up_date IS NOT NULL
//         AND ${followupDateFilter};
//       `;
  
//       const followUpStats = await sequelize.query(followupQuery, {
//         type: QueryTypes.SELECT
//       });
  
//       // Get agent-wise stats (using alias in JOIN)
//       const agentStatsQuery = `
//         SELECT 
//           e.EmployeeId,
//           e.EmployeeName,
//           e.EmployeeRegion,
//           e.EmployeePhone,
//           COUNT(DISTINCT alr.id) as total_remarks,
//           SUM(CASE WHEN alr.closure_status = 'open' THEN 1 ELSE 0 END) as open_remarks,
//           SUM(CASE WHEN alr.closure_status = 'closed' THEN 1 ELSE 0 END) as closed_remarks,
//           COUNT(DISTINCT CASE WHEN alt.follow_up_date IS NOT NULL 
//             AND ${followupDateFilterWithAlias} THEN alt.Lot_Number END) as total_followups,
//           COUNT(DISTINCT CASE WHEN DATE(alt.follow_up_date) = DATE(alt.completed_on) 
//             AND ${followupDateFilterWithAlias} THEN alt.Lot_Number END) as completed_followups
//         FROM employee_table e
//         LEFT JOIN audit_lead_remarks alr ON alr.AgentId = e.EmployeeId 
//           AND ${remarkDateFilter}
//         LEFT JOIN audit_lead_table alt ON alt.AgentId = e.EmployeeId 
//         WHERE e.EmployeeRoleID = 100
//         ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
//         GROUP BY e.EmployeeId, e.EmployeeName, e.EmployeeRegion, e.EmployeePhone;
//       `;
  
//       const agentStats = await sequelize.query(agentStatsQuery, {
//         type: QueryTypes.SELECT
//       });
  
//       // Get detailed follow-ups for verification
//       const detailedFollowUps = startDate && endDate ? await sequelize.query(`
//         SELECT 
//           Lot_Number,
//           follow_up_date,
//           completed_on,
//           AgentId
//         FROM audit_lead_table
//         WHERE ${followupDateFilter}
//         AND follow_up_date IS NOT NULL;
//       `, {
//         type: QueryTypes.SELECT
//       }) : [];
  
//       const response = {
//         filters_applied: {
//           date_range: startDate && endDate ? { startDate, endDate } : null,
//           agent_name: agentName || null
//         },
//         summary: {
//           total_remarks: totalRemarks,
//           status_wise_count: overallStatusCounts.reduce((acc, curr) => {
//             acc[curr.closure_status || 'undefined'] = parseInt(curr.count);
//             return acc;
//           }, {}),
//           followup_statistics: {
//             total_followups: parseInt(followUpStats[0]?.total_followups) || 0,
//             completed_followups: parseInt(followUpStats[0]?.completed_followups) || 0,
//             pending_followups: (parseInt(followUpStats[0]?.total_followups) || 0) - 
//                              (parseInt(followUpStats[0]?.completed_followups) || 0)
//           }
//         },
//         agent_wise_summary: agentStats.map(agent => ({
//           agent_details: {
//             id: agent.EmployeeId,
//             name: agent.EmployeeName,
//             region: agent.EmployeeRegion,
//             phone: agent.EmployeePhone
//           },
//           counts: {
//             total_remarks: parseInt(agent.total_remarks) || 0,
//             open_remarks: parseInt(agent.open_remarks) || 0,
//             closed_remarks: parseInt(agent.closed_remarks) || 0,
//             followups: {
//               total: parseInt(agent.total_followups) || 0,
//               completed: parseInt(agent.completed_followups) || 0,
//               pending: (parseInt(agent.total_followups) || 0) - (parseInt(agent.completed_followups) || 0)
//             }
//           }
//         }))
//       };
  
//       res.json({
//         success: true,
//         data: response
//       });
  
//     } catch (error) {
//       console.error('Error fetching remark statistics:', error);
//       res.status(500).json({
//         success: false,
//         error: error.message,
//         sql: error.sql,
//         parameters: error.parameters
//       });
//     }
//   };




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
  
      // Get agent-wise stats  v1 can be change
    //   const agentStatsQuery = `
    //     SELECT 
    //       e.EmployeeId,
    //       e.EmployeeName,
    //       e.EmployeeRegion,
    //       e.EmployeePhone,
    //       COUNT(DISTINCT alr.id) as total_remarks,
    //       SUM(CASE WHEN alr.closure_status = 'open' THEN 1 ELSE 0 END) as open_remarks,
    //       SUM(CASE WHEN alr.closure_status = 'closed' THEN 1 ELSE 0 END) as closed_remarks,
    //       COUNT(DISTINCT CASE WHEN alt.follow_up_date IS NOT NULL 
    //         AND ${followupDateFilterWithAlias} THEN alt.Lot_Number END) as total_followups,
    //       COUNT(DISTINCT CASE WHEN DATE(alt.follow_up_date) = DATE(alt.completed_on) 
    //         AND ${followupDateFilterWithAlias} THEN alt.Lot_Number END) as completed_followups
    //     FROM employee_table e
    //     LEFT JOIN audit_lead_remarks alr ON alr.AgentId = e.EmployeeId 
    //       AND ${remarkDateFilter}
    //     LEFT JOIN audit_lead_table alt ON alt.AgentId = e.EmployeeId 
    //     WHERE e.EmployeeRoleID = 100
    //     ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
    //     GROUP BY e.EmployeeId, e.EmployeeName, e.EmployeeRegion, e.EmployeePhone;
    //   `;

     
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
  

  

  //detail report export in ejs


//   exports.exportAgentDetailReport = async (req, res) => {
//     try {
//         const { startDate, endDate, agentName, format = 'pdf' } = req.query;

//         // Base filters
//         const remarkDateFilter = startDate && endDate 
//             ? `DATE(alr.createdAt) BETWEEN '${startDate}' AND '${endDate}'`
//             : '1=1';
//         const followupDateFilter = startDate && endDate 
//             ? `DATE(follow_up_date) BETWEEN '${startDate}' AND '${endDate}'`
//             : '1=1';
//         const followupDateFilterWithAlias = startDate && endDate 
//             ? `DATE(alt.follow_up_date) BETWEEN '${startDate}' AND '${endDate}'`
//             : '1=1';

//         // Get remarks details with status
//         const remarkDetailsQuery = `
//             SELECT 
//                 alr.id,
//                 alr.Lot_Number,
//                 alr.REMARKS,
//                 alr.DATE,
//                 alr.closure_status,
//                 alr.AGE,
//                 alr.BWT,
//                 alr.M_QTY,
//                 alr.REASON,
//                 alt.Farmer_Name,
//                 alt.Zone_Name,
//                 alt.Branch_Name,
//                 e.EmployeeName as agent_name
//             FROM audit_lead_remarks alr
//             LEFT JOIN audit_lead_table alt ON alt.Lot_Number = alr.Lot_Number
//             LEFT JOIN employee_table e ON e.EmployeeId = alr.AgentId
//             WHERE ${remarkDateFilter}
//             ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
//             ORDER BY alr.DATE DESC;
//         `;

//         const remarkDetails = await sequelize.query(remarkDetailsQuery, {
//             type: QueryTypes.SELECT
//         });

//         // Get follow-up details
//         const followupDetailsQuery = `
//             SELECT 
//                 alt.Lot_Number,
//                 alt.Farmer_Name,
//                 alt.Zone_Name,
//                 alt.Branch_Name,
//                 alt.follow_up_date,
//                 alt.completed_on,
//                 e.EmployeeName as agent_name,
//                 CASE 
//                     WHEN DATE(alt.follow_up_date) = DATE(alt.completed_on) THEN 'completed'
//                     ELSE 'pending'
//                 END as follow_up_status
//             FROM audit_lead_table alt
//             LEFT JOIN employee_table e ON e.EmployeeId = alt.AgentId
//             WHERE ${followupDateFilter}
//             AND alt.follow_up_date IS NOT NULL
//             ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
//             ORDER BY alt.follow_up_date DESC;
//         `;

//         const followupDetails = await sequelize.query(followupDetailsQuery, {
//             type: QueryTypes.SELECT
//         });

//         // Get summary statistics
//         const remarkStatusQuery = `
//             SELECT 
//                 closure_status,
//                 COUNT(*) as count
//             FROM audit_lead_remarks alr
//             LEFT JOIN employee_table e ON e.EmployeeId = alr.AgentId
//             WHERE ${remarkDateFilter}
//             ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
//             GROUP BY closure_status;
//         `;

//         const overallStatusCounts = await sequelize.query(remarkStatusQuery, {
//             type: QueryTypes.SELECT
//         });

//         const followupQuery = `
//             SELECT 
//                 COUNT(*) as total_followups,
//                 SUM(CASE WHEN DATE(follow_up_date) = DATE(completed_on) THEN 1 ELSE 0 END) as completed_followups
//             FROM audit_lead_table alt
//             LEFT JOIN employee_table e ON e.EmployeeId = alt.AgentId
//             WHERE follow_up_date IS NOT NULL
//             AND ${followupDateFilter}
//             ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''};
//         `;

//         const followUpStats = await sequelize.query(followupQuery, {
//             type: QueryTypes.SELECT
//         });

//         // Get agent-wise stats
//         const agentStatsQuery = `
//             SELECT 
//                 e.EmployeeId,
//                 e.EmployeeName,
//                 e.EmployeeRegion,
//                 e.EmployeePhone,
//                 COUNT(DISTINCT alr.id) as total_remarks,
//                 SUM(CASE WHEN alr.closure_status = 'open' THEN 1 ELSE 0 END) as open_remarks,
//                 SUM(CASE WHEN alr.closure_status = 'closed' THEN 1 ELSE 0 END) as closed_remarks,
//                 COUNT(DISTINCT CASE WHEN alt.follow_up_date IS NOT NULL 
//                     AND ${followupDateFilterWithAlias} THEN alt.Lot_Number END) as total_followups,
//                 COUNT(DISTINCT CASE WHEN DATE(alt.follow_up_date) = DATE(alt.completed_on) 
//                     AND ${followupDateFilterWithAlias} THEN alt.Lot_Number END) as completed_followups
//             FROM employee_table e
//             LEFT JOIN audit_lead_remarks alr ON alr.AgentId = e.EmployeeId 
//                 AND ${remarkDateFilter}
//             LEFT JOIN audit_lead_table alt ON alt.AgentId = e.EmployeeId 
//             WHERE e.EmployeeRoleID = 100
//             ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
//             GROUP BY e.EmployeeId, e.EmployeeName, e.EmployeeRegion, e.EmployeePhone;
//         `;

//         const agentStats = await sequelize.query(agentStatsQuery, {
//             type: QueryTypes.SELECT
//         });

//         const totalRemarks = overallStatusCounts.reduce((sum, item) => sum + parseInt(item.count), 0);

//         // Prepare data for template
//         const templateData = {
//             filters: {
//                 startDate,
//                 endDate,
//                 agentName
//             },
//             summary: {
//                 total_remarks: totalRemarks,
//                 status_wise_count: overallStatusCounts.reduce((acc, curr) => {
//                     acc[curr.closure_status || 'undefined'] = parseInt(curr.count);
//                     return acc;
//                 }, {}),
//                 followup_statistics: {
//                     total_followups: parseInt(followUpStats[0]?.total_followups) || 0,
//                     completed_followups: parseInt(followUpStats[0]?.completed_followups) || 0,
//                     pending_followups: (parseInt(followUpStats[0]?.total_followups) || 0) - 
//                                      (parseInt(followUpStats[0]?.completed_followups) || 0)
//                 }
//             },
//             agent_wise_summary: agentStats.map(agent => ({
//                 agent_details: {
//                     id: agent.EmployeeId,
//                     name: agent.EmployeeName,
//                     region: agent.EmployeeRegion,
//                     phone: agent.EmployeePhone
//                 },
//                 counts: {
//                     total_remarks: parseInt(agent.total_remarks) || 0,
//                     open_remarks: parseInt(agent.open_remarks) || 0,
//                     closed_remarks: parseInt(agent.closed_remarks) || 0,
//                     followups: {
//                         total: parseInt(agent.total_followups) || 0,
//                         completed: parseInt(agent.completed_followups) || 0,
//                         pending: (parseInt(agent.total_followups) || 0) - 
//                                 (parseInt(agent.completed_followups) || 0)
//                     }
//                 }
//             })),
//             details: {
//                 remarks: {
//                     open: remarkDetails.filter(r => r.closure_status === 'open'),
//                     closed: remarkDetails.filter(r => r.closure_status === 'closed'),
//                     undefined: remarkDetails.filter(r => !r.closure_status || r.closure_status === 'undefined')
//                 },
//                 followups: {
//                     completed: followupDetails.filter(f => f.follow_up_status === 'completed'),
//                     pending: followupDetails.filter(f => f.follow_up_status === 'pending')
//                 }
//             }
//         };

//         // If format is HTML, render EJS template directly

//         // if (format.toLowerCase() === 'html') {
//         //     const html = await ejs.renderFile(
//         //         path.join(__dirname, '../../views/reports/agent-detail-report.ejs'),
//         //         templateData
//         //     );
//         //     return res.send(html);
//         // }
//         if (format.toLowerCase() === 'html') {
//             const templatePath = path.join(__dirname, '../../views/reports/agent-detail-report.ejs');
//             console.log('Template path:', templatePath);
            
//             const html = await ejs.renderFile(templatePath, templateData);
//             return res.send(html);
//         }

//         if (format.toLowerCase() === 'pdf') {
//             const templatePath = path.join(__dirname, '../../views/reports/agent-detail-report.ejs');
//             console.log('Template path:', templatePath);
            
//             const html = await ejs.renderFile(templatePath, templateData);

//             const options = {
//                 format: 'A4',
//                 orientation: 'portrait',
//                 border: '10mm',
//                 header: {
//                     height: '15mm',
//                 },
//                 footer: {
//                     height: '15mm',
//                 }
//             };

//             const document = {
//                 html: html,
//                 data: {},
//                 path: './tmp/agent-detail-report.pdf'
//             };

//             // Ensure tmp directory exists
//             await fs.ensureDir('./tmp');

//             // Generate PDF
//             await pdf.create(document, options);

//             // Send file and clean up
//             res.download('./tmp/agent-detail-report.pdf', 'agent-detail-report.pdf', (err) => {
//                 if (err) {
//                     console.error('Error downloading file:', err);
//                     res.status(500).send('Error downloading file');
//                 }
//                 // Clean up temp file
//                 fs.removeSync('./tmp/agent-detail-report.pdf');
//             });
//         } else {
//             res.status(400).json({
//                 success: false,
//                 error: 'Invalid export format. Supported formats: pdf, html'
//             });
//         }

//     } catch (error) {
//         console.error('Error exporting agent detail report:', error);
//         res.status(500).json({
//             success: false,
//             error: error.message,
//             sql: error.sql,
//             parameters: error.parameters
//         });
//     }
// };



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





//detail incoming report with count 

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






//detail incoming report with download
// exports.getAgentReportFiltersExport = async (req, res) => {
//     try {
//         const { startDate, endDate, agentName, format = 'pdf' } = req.query;

//         // Base filters
//         const remarkDateFilter = startDate && endDate 
//             ? `DATE(alr.createdAt) BETWEEN '${startDate}' AND '${endDate}'`
//             : '1=1';
//         const followupDateFilter = startDate && endDate 
//             ? `DATE(follow_up_date) BETWEEN '${startDate}' AND '${endDate}'`
//             : '1=1';
//         const followupDateFilterWithAlias = startDate && endDate 
//             ? `DATE(alt.follow_up_date) BETWEEN '${startDate}' AND '${endDate}'`
//             : '1=1';

//         // Get remarks details
//         const remarkDetailsQuery = `
//             SELECT 
//                 alr.id,
//                 alr.Lot_Number,
//                 alr.REMARKS,
//                 alr.DATE,
//                 alr.closure_status,
//                 alr.AGE,
//                 alr.BWT,
//                 alr.M_QTY,
//                 alr.REASON,
//                 alt.Farmer_Name,
//                 alt.Zone_Name,
//                 alt.Branch_Name,
//                 e.EmployeeName as agent_name
//             FROM audit_lead_remarks alr
//             LEFT JOIN audit_lead_table alt ON alt.Lot_Number = alr.Lot_Number
//             LEFT JOIN employee_table e ON e.EmployeeId = alr.AgentId
//             WHERE ${remarkDateFilter}
//             ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
//             ORDER BY alr.DATE DESC;
//         `;

//         const remarkDetails = await sequelize.query(remarkDetailsQuery, {
//             type: QueryTypes.SELECT
//         });

//         // Get follow-up details
//         const followupDetailsQuery = `
//             SELECT 
//                 alt.Lot_Number,
//                 alt.Farmer_Name,
//                 alt.Zone_Name,
//                 alt.Branch_Name,
//                 alt.follow_up_date,
//                 alt.completed_on,
//                 e.EmployeeName as agent_name,
//                 CASE 
//                     WHEN DATE(alt.follow_up_date) = DATE(alt.completed_on) THEN 'completed'
//                     ELSE 'pending'
//                 END as follow_up_status
//             FROM audit_lead_table alt
//             LEFT JOIN employee_table e ON e.EmployeeId = alt.AgentId
//             WHERE ${followupDateFilter}
//             AND alt.follow_up_date IS NOT NULL
//             ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
//             ORDER BY alt.follow_up_date DESC;
//         `;

//         const followupDetails = await sequelize.query(followupDetailsQuery, {
//             type: QueryTypes.SELECT
//         });

//         // Get remark status counts
//         const remarkStatusQuery = `
//             SELECT 
//                 closure_status,
//                 COUNT(*) as count
//             FROM audit_lead_remarks alr
//             LEFT JOIN employee_table e ON e.EmployeeId = alr.AgentId
//             WHERE ${remarkDateFilter}
//             ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
//             GROUP BY closure_status;
//         `;

//         const overallStatusCounts = await sequelize.query(remarkStatusQuery, {
//             type: QueryTypes.SELECT
//         });

//         // Get followup statistics
//         const followupQuery = `
//             SELECT 
//                 COUNT(*) as total_followups,
//                 SUM(CASE WHEN DATE(follow_up_date) = DATE(completed_on) THEN 1 ELSE 0 END) as completed_followups
//             FROM audit_lead_table alt
//             LEFT JOIN employee_table e ON e.EmployeeId = alt.AgentId
//             WHERE follow_up_date IS NOT NULL
//             AND ${followupDateFilter}
//             ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''};
//         `;

//         const followUpStats = await sequelize.query(followupQuery, {
//             type: QueryTypes.SELECT
//         });

//         // Get agent-wise statistics
//         const agentStatsQuery = `
//             SELECT 
//                 e.EmployeeId,
//                 e.EmployeeName,
//                 e.EmployeeRegion,
//                 e.EmployeePhone,
//                 COUNT(DISTINCT alr.id) as total_remarks,
//                 SUM(CASE WHEN alr.closure_status = 'open' THEN 1 ELSE 0 END) as open_remarks,
//                 SUM(CASE WHEN alr.closure_status = 'closed' THEN 1 ELSE 0 END) as closed_remarks,
//                 COUNT(DISTINCT CASE WHEN alt.follow_up_date IS NOT NULL 
//                     AND ${followupDateFilterWithAlias} THEN alt.Lot_Number END) as total_followups,
//                 COUNT(DISTINCT CASE WHEN DATE(alt.follow_up_date) = DATE(alt.completed_on) 
//                     AND ${followupDateFilterWithAlias} THEN alt.Lot_Number END) as completed_followups
//             FROM employee_table e
//             LEFT JOIN audit_lead_remarks alr ON alr.AgentId = e.EmployeeId 
//                 AND ${remarkDateFilter}
//             LEFT JOIN audit_lead_table alt ON alt.AgentId = e.EmployeeId 
//             WHERE e.EmployeeRoleID = 100
//             ${agentName ? `AND e.EmployeeName LIKE '%${agentName}%'` : ''}
//             GROUP BY e.EmployeeId, e.EmployeeName, e.EmployeeRegion, e.EmployeePhone;
//         `;

//         const agentStats = await sequelize.query(agentStatsQuery, {
//             type: QueryTypes.SELECT
//         });

//         // Calculate total remarks
//         const totalRemarks = overallStatusCounts.reduce((sum, item) => sum + parseInt(item.count), 0);

//         // Prepare report data
//         const reportData = {
//             filters: {
//                 startDate: startDate || 'All Time',
//                 endDate: endDate || 'All Time',
//                 agentName: agentName || 'All Agents'
//             },
//             summary: {
//                 total_remarks: totalRemarks,
//                 status_wise_count: overallStatusCounts.reduce((acc, curr) => {
//                     acc[curr.closure_status || 'undefined'] = parseInt(curr.count);
//                     return acc;
//                 }, {}),
//                 followup_statistics: {
//                     total_followups: parseInt(followUpStats[0]?.total_followups) || 0,
//                     completed_followups: parseInt(followUpStats[0]?.completed_followups) || 0,
//                     pending_followups: (parseInt(followUpStats[0]?.total_followups) || 0) - 
//                                      (parseInt(followUpStats[0]?.completed_followups) || 0)
//                 }
//             },
//             agent_stats: agentStats.map(agent => ({
//                 id: agent.EmployeeId,
//                 name: agent.EmployeeName,
//                 region: agent.EmployeeRegion,
//                 phone: agent.EmployeePhone,
//                 total_remarks: parseInt(agent.total_remarks) || 0,
//                 open_remarks: parseInt(agent.open_remarks) || 0,
//                 closed_remarks: parseInt(agent.closed_remarks) || 0,
//                 total_followups: parseInt(agent.total_followups) || 0,
//                 completed_followups: parseInt(agent.completed_followups) || 0,
//                 pending_followups: (parseInt(agent.total_followups) || 0) - 
//                                  (parseInt(agent.completed_followups) || 0)
//             })),
//             remarks: remarkDetails,
//             followups: {
//                 completed: followupDetails.filter(f => f.follow_up_status === 'completed'),
//                 pending: followupDetails.filter(f => f.follow_up_status === 'pending')
//             }
//         };

//         // Handle different export formats
//         switch (format.toLowerCase()) {
//             case 'html':
//                 const templatePath = path.join(__dirname, '../../views/reports/agent-detail-report.ejs');
//                 console.log('Template path:', templatePath);
//                 const html = await ejs.renderFile(templatePath, reportData);
//                 return res.send(html);

//             case 'pdf':
//                 const pdfTemplatePath = path.join(__dirname, '../../views/reports/agent-detail-report.ejs');
//                 console.log('PDF Template path:', pdfTemplatePath);
//                 const pdfHtml = await ejs.renderFile(pdfTemplatePath, reportData);

//                 const options = {
//                     format: 'A4',
//                     orientation: 'landscape',
//                     border: '10mm',
//                     header: {
//                         height: '15mm',
//                     },
//                     footer: {
//                         height: '15mm',
//                     }
//                 };

//                 const document = {
//                     html: pdfHtml,
//                     data: {},
//                     path: './tmp/agent-detail-report.pdf'
//                 };

//                 await fs.ensureDir('./tmp');
//                 await pdf.create(document, options);

//                 res.download('./tmp/agent-detail-report.pdf', 'agent-detail-report.pdf', (err) => {
//                     if (err) {
//                         console.error('Error downloading PDF:', err);
//                         res.status(500).send('Error downloading PDF');
//                     }
//                     fs.removeSync('./tmp/agent-detail-report.pdf');
//                 });
//                 break;

//             case 'csv':
//                 // Prepare data for CSV - combine all relevant data
//                 const csvData = [];

//                 // Add summary section
//                 csvData.push({
//                     section: 'Summary',
//                     total_remarks: reportData.summary.total_remarks,
//                     total_followups: reportData.summary.followup_statistics.total_followups,
//                     completed_followups: reportData.summary.followup_statistics.completed_followups,
//                     pending_followups: reportData.summary.followup_statistics.pending_followups
//                 });

//                 // Add agent statistics
//                 reportData.agent_stats.forEach(agent => {
//                     csvData.push({
//                         section: 'Agent Statistics',
//                         agent_name: agent.name,
//                         region: agent.region,
//                         phone: agent.phone,
//                         total_remarks: agent.total_remarks,
//                         open_remarks: agent.open_remarks,
//                         closed_remarks: agent.closed_remarks,
//                         total_followups: agent.total_followups,
//                         completed_followups: agent.completed_followups,
//                         pending_followups: agent.pending_followups
//                     });
//                 });

//                 // Add remarks
//                 reportData.remarks.forEach(remark => {
//                     csvData.push({
//                         section: 'Remarks',
//                         lot_number: remark.Lot_Number,
//                         farmer_name: remark.Farmer_Name,
//                         zone: remark.Zone_Name,
//                         branch: remark.Branch_Name,
//                         agent: remark.agent_name,
//                         remarks: remark.REMARKS,
//                         date: remark.DATE,
//                         status: remark.closure_status || 'undefined',
//                         age: remark.AGE,
//                         bwt: remark.BWT,
//                         quantity: remark.M_QTY,
//                         reason: remark.REASON
//                     });
//                 });

//                 // Convert to CSV
//                 const json2csvParser = new Parser();
//                 const csv = json2csvParser.parse(csvData);

//                 // Set headers for CSV download
//                 res.header('Content-Type', 'text/csv');
//                 res.attachment('agent-report-filter.csv');
//                 return res.send(csv);

//             default:
//                 return res.status(400).json({
//                     success: false,
//                     error: 'Invalid export format. Supported formats: pdf, html, csv'
//                 });
//         }

//     } catch (error) {
//         console.error('Error exporting agent report:', error);
//         res.status(500).json({
//             success: false,
//             error: error.message,
//             sql: error.sql,
//             parameters: error.parameters
//         });
//     }
// };

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

