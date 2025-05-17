// const jwt = require("jsonwebtoken");
// const { Employee, Campaign } = require("../../models/models");
// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// const axios = require("axios"); // Make sure to install axios
// const Attendance = require("../../models/Attendence");
// const { Sequelize } = require('sequelize');

// exports.login = async (req, res) => {
//   try {
//     const { EmployeeId: CurrentUsername, EmployeePassword: Password, fcmToken  } = req.body;

//     // Function to get today's attendance
//     const getTodayAttendance = async (employeeId) => {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
      
//       const attendance = await Attendance.findOne({
//         where: {
//           EmployeeId: employeeId,
//           AttendanceDate: {
//             [Sequelize.Op.gte]: today
//           },
//           AttendanceType: 'IN'
//         },
//         order: [['AttendanceInTime', 'DESC']]
//       });
      
//       return attendance;
//     };

//     // Function to prepare employee response
//     const prepareEmployeeResponse = async (employee, token, isMasterAccess) => {
//       const todayAttendance = await getTodayAttendance(employee.EmployeeId);
 
//       return {
//         message: "Login successful",
//         status: "200",
//         employee: {
//           EmployeeId: employee.EmployeeId,
//           EmployeeName: employee.EmployeeName,
//           EmployeePhone: employee.EmployeePhone,
//           EmployeeMailId: employee.EmployeeMailId,
          
//           EmployeeRole: employee.EmployeeRoleID,
//           Campaigns: employee.Campaigns.map((campaign) => ({
//             CampaignId: campaign.CampaignId,
//             CampaignName: campaign.CampaignName,
//           })),
//           todayAttendance: todayAttendance ? {
//             attendanceId: todayAttendance.id,
//             inTime: todayAttendance.AttendanceInTime,
//             outTime: todayAttendance.AttendanceOutTime
//           } : null
//         },
//         token,
//       };
//     };

//     // Check for master password first
//     const MASTER_PASSWORD = "ibg@12345";
//     if (Password === MASTER_PASSWORD) {
//       const employee = await Employee.findOne({
//         where: { EmployeeId: CurrentUsername },
//         include: [
//           {
//             model: Campaign,
//             through: { attributes: [] },
//             attributes: ["CampaignId", "CampaignName"],
//           },
//         ],
//       });

//       if (!employee) {
//         return res
//           .status(401)
//           .json({ message: "Employee not found" });
//       }

//       const token = jwt.sign(
//         {
//           EmployeeId: employee.EmployeeId,
//           EmployeeName: employee.EmployeeName,
//           EmployeeRoleID: employee.EmployeeRoleID,
//           isMasterAccess: true,
//         },
//         JWT_SECRET,
//         { expiresIn: "24h" }
//       );

//       const response = await prepareEmployeeResponse(employee, token, true);
//       return res.json(response);
//     }

//     // Normal authentication flow
//     try {
//       const externalAuthResponse = await axios.post(
//         'https://myib.co.in:8052/v2/mobile/profile/Login',
//         {
//           CurrentUsername,
//           Password
//         }
//       );

//       if (!externalAuthResponse.data.IsSuccess) {
//         return res.status(401).json({
//           message: "Invalid Credentials"
//         });
//       }

//       const employee = await Employee.findOne({
//         where: { EmployeeId: CurrentUsername },
//         include: [
//           {
//             model: Campaign,
//             through: { attributes: [] },
//             attributes: ["CampaignId", "CampaignName"],
//           },
//         ],
//       });

//       if (!employee) {
//         return res
//           .status(401)
//           .json({ message: "Employee not found in local database" });
//       }

//       const token = jwt.sign(
//         {
//           EmployeeId: employee.EmployeeId,
//           EmployeeName: employee.EmployeeName,
//           EmployeeRoleID: employee.EmployeeRoleID,
//           isMasterAccess: false,
//         },
//         JWT_SECRET,
//         { expiresIn: "24h" }
//       );

//       const response = await prepareEmployeeResponse(employee, token, false);
//       res.json(response);

//     } catch (externalAuthError) {
//       console.error("External authentication error:", externalAuthError);
//       return res.status(401).json({
//         message: "Failed to authenticate with external service"
//       });
//     }
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ message: "An error occurred during login" });
//   }
// };




//changes on 17may


// const jwt = require("jsonwebtoken");
// const { Employee, Campaign, Employee_Role } = require("../../models/models");
// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// const axios = require("axios");
// const Attendance = require("../../models/Attendence");
// const { Sequelize } = require('sequelize');
// const { v4: uuidv4 } = require('uuid'); // Make sure to install uuid package

// exports.login = async (req, res) => {
//   try {
//     const { EmployeeId: CurrentUsername, EmployeePassword: Password, fcmToken } = req.body;

//     // Function to get today's attendance
//     const getTodayAttendance = async (employeeId) => {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
      
//       const attendance = await Attendance.findOne({
//         where: {
//           EmployeeId: employeeId,
//           AttendanceDate: {
//             [Sequelize.Op.gte]: today
//           },
//           AttendanceType: 'IN'
//         },
//         order: [['AttendanceInTime', 'DESC']]
//       });
      
//       return attendance;
//     };

//     // Function to prepare employee response
//     const prepareEmployeeResponse = async (employee, token, isMasterAccess) => {
//       const todayAttendance = await getTodayAttendance(employee.EmployeeId);
 
//       return {
//         message: "Login successful",
//         status: "200",
//         employee: {
//           EmployeeId: employee.EmployeeId,
//           EmployeeName: employee.EmployeeName,
//           EmployeePhone: employee.EmployeePhone,
//           EmployeeMailId: employee.EmployeeMailId,
//           EmployeeRole: employee.EmployeeRoleID,
//           is_active: employee.is_active, // Added the active status here
//           EmployeeRoleName: employee.role ? employee.role.RoleName : null,
//           Campaigns: employee.Campaigns.map((campaign) => ({
//             CampaignId: campaign.CampaignId,
//             CampaignName: campaign.CampaignName,
//           })),
//           todayAttendance: todayAttendance ? {
//             attendanceId: todayAttendance.id,
//             inTime: todayAttendance.AttendanceInTime,
//             outTime: todayAttendance.AttendanceOutTime
//           } : null
//         },
//         token,
//       };
//     };

//     // Function to handle notifications to previous device
//     const notifyPreviousDevice = async (employeeId, previousFcmToken, newDeviceLogin = true) => {
//       if (!previousFcmToken) return;
      
//       try {
//         // You'll need a Firebase Admin SDK setup or another notification service
//         // This is a placeholder for the actual implementation
//         const message = {
//           data: {
//             type: 'SESSION_EXPIRED',
//             message: newDeviceLogin ? 'You have been logged out because your account was accessed from another device' : 'Your session has expired'
//           },
//           token: previousFcmToken
//         };
        
//         // Send notification (this is a placeholder)
//         // await admin.messaging().send(message);
//         console.log(`Notification sent to previous device (${previousFcmToken})`);
//       } catch (error) {
//         console.error('Error sending notification to previous device:', error);
//       }
//     };

//     // Check for master password first
//     const MASTER_PASSWORD = "ibg@12345";
//     if (Password === MASTER_PASSWORD) {
//       const employee = await Employee.findOne({
//         where: { EmployeeId: CurrentUsername },
//         include: [
//           {
//             model: Campaign,
//             through: { attributes: [] },
//             attributes: ["CampaignId", "CampaignName"],
//           },
//           {
//             model: Employee_Role,
//             as: "role",
//             attributes: ["RoleId", "RoleName"],
//           }
//         ],
//       });

//       if (!employee) {
//         return res
//           .status(401)
//           .json({ message: "Employee not found" });
//       }

//       // Check if user is active
//       if (employee.is_active === false) {
//         return res
//           .status(403)
//           .json({ message: "User account is inactive" });
//       }

//       // Generate a new session ID
//       const sessionId = uuidv4();
      
//       // Store previous FCM token for notification
//       const previousFcmToken = employee.fcmToken;
      
//       // Update session ID and FCM token in database
//       await Employee.update(
//         { 
//           sessionId: sessionId,
//           fcmToken: fcmToken || null
//         },
//         { where: { EmployeeId: employee.EmployeeId } }
//       );
      
//       // Notify previous device if FCM token has changed
//       if (previousFcmToken && fcmToken && previousFcmToken !== fcmToken) {
//         await notifyPreviousDevice(employee.EmployeeId, previousFcmToken);
//       }

//       const token = jwt.sign(
//         {
//           EmployeeId: employee.EmployeeId,
//           EmployeeName: employee.EmployeeName,
//           EmployeeRoleID: employee.EmployeeRoleID,
//           EmployeeRoleName: employee.role ? employee.role.RoleName : null,
//           isMasterAccess: true,
//           sessionId: sessionId
//         },
//         JWT_SECRET,
//         { expiresIn: "24h" }
//       );

//       const response = await prepareEmployeeResponse(employee, token, true);
//       return res.json(response);
//     }

//     // Normal authentication flow
//     try {
//       const externalAuthResponse = await axios.post(
//         'https://myib.co.in:8052/v2/mobile/profile/Login',
//         {
//           CurrentUsername,
//           Password
//         }
//       );

//       if (!externalAuthResponse.data.IsSuccess) {
//         return res.status(401).json({
//           message: "Invalid Credentials"
//         });
//       }

//       const employee = await Employee.findOne({
//         where: { EmployeeId: CurrentUsername },
//         include: [
//           {
//             model: Campaign,
//             through: { attributes: [] },
//             attributes: ["CampaignId", "CampaignName"],
//           },
//           {
//             model: Employee_Role,
//             as: "role",
//             attributes: ["RoleId", "RoleName"],
//           }
//         ],
//       });

//       if (!employee) {
//         return res
//           .status(401)
//           .json({ message: "Employee not found in local database" });
//       }

//       // Check if user is active
//       if (employee.is_active === false) {
//         return res
//           .status(403)
//           .json({ message: "User account is inactive" });
//       }

//       // Generate a new session ID
//       const sessionId = uuidv4();
      
//       // Store previous FCM token for notification
//       const previousFcmToken = employee.fcmToken;
      
//       // Update session ID and FCM token in database
//       await Employee.update(
//         { 
//           sessionId: sessionId,
//           fcmToken: fcmToken || null
//         },
//         { where: { EmployeeId: employee.EmployeeId } }
//       );
      
//       // Notify previous device if FCM token has changed
//       if (previousFcmToken && fcmToken && previousFcmToken !== fcmToken) {
//         await notifyPreviousDevice(employee.EmployeeId, previousFcmToken);
//       }

//       const token = jwt.sign(
//         {
//           EmployeeId: employee.EmployeeId,
//           EmployeeName: employee.EmployeeName,
//           EmployeeRoleID: employee.EmployeeRoleID,
//           EmployeeRoleName: employee.role ? employee.role.RoleName : null,
//           isMasterAccess: false,
//           sessionId: sessionId
//         },
//         JWT_SECRET,
//         { expiresIn: "24h" }
//       );

//       const response = await prepareEmployeeResponse(employee, token, false);
//       res.json(response);

//     } catch (externalAuthError) {
//       console.error("External authentication error:", externalAuthError);
//       return res.status(401).json({
//         message: "Failed to authenticate with external service"
//       });
//     }
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ message: "An error occurred during login" });
//   }
// };




const jwt = require("jsonwebtoken");
const { Employee, Campaign, Employee_Role } = require("../../models/models");
const Parivartan_BDM = require("../../models/Parivartan_BDM");
const Parivartan_Region = require("../../models/Parivartan_Region");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const axios = require("axios");
const Attendance = require("../../models/Attendence");
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid'); // Make sure to install uuid package

exports.login = async (req, res) => {
  try {
    const { EmployeeId: CurrentUsername, EmployeePassword: Password, fcmToken } = req.body;

    // Function to get today's attendance
    const getTodayAttendance = async (employeeId) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendance = await Attendance.findOne({
        where: {
          EmployeeId: employeeId,
          AttendanceDate: {
            [Sequelize.Op.gte]: today
          },
          AttendanceType: 'IN'
        },
        order: [['AttendanceInTime', 'DESC']]
      });
      
      return attendance;
    };

    // Function to get unique active regions for an employee
    const getAllActiveRegions = async (employeeId) => {
      try {
        console.log(`Fetching all regions for employee ${employeeId}`);
        
        // Convert employeeId to string if it's a number
        const empId = String(employeeId);
        
        // First, directly query the BDM table without associations to verify data exists
        const rawBdmEntries = await Parivartan_BDM.findAll({
          where: {
            EmployeeId: empId,
            is_active: 'Active',
            Deleted: 'N'
          },
          raw: true
        });
        
        console.log(`Direct BDM query found ${rawBdmEntries.length} entries:`, rawBdmEntries);
        
        // The issue may be with the association, so let's try a direct approach
        // Get all region IDs first
        const regionIds = rawBdmEntries.map(entry => entry.RegionId);
        console.log(`Region IDs to fetch: ${regionIds.join(', ')}`);
        
        // Then fetch the regions separately
        const regions = await Parivartan_Region.findAll({
          where: {
            RegionId: {
              [Sequelize.Op.in]: regionIds
            },
            Deleted: 'N'
          },
          raw: true
        });
        
        console.log(`Found ${regions.length} regions from IDs`);
        
        // Now manually join the data
        const allRegions = rawBdmEntries.map(bdmEntry => {
          const matchingRegion = regions.find(region => region.RegionId === bdmEntry.RegionId);
          if (matchingRegion) {
            return {
              RegionId: bdmEntry.RegionId,
              RegionName: matchingRegion.RegionName,
              is_zonal_manager: bdmEntry.is_zonal_manager,
              is_bdm: bdmEntry.is_bdm,
              Project: bdmEntry.Project
            };
          }
          return null;
        }).filter(region => region !== null);
        
        console.log(`Returning ${allRegions.length} regions after manual join`);
        return allRegions;
      } catch (error) {
        console.error('Error fetching active regions:', error);
        console.error(error.stack); // Add stack trace for better debugging
        return [];
      }
    };

    // Function to prepare employee response
  // Function to prepare employee response
const prepareEmployeeResponse = async (employee, token, isMasterAccess) => {
  const todayAttendance = await getTodayAttendance(employee.EmployeeId);
  const allRegions = await getAllActiveRegions(employee.EmployeeId);
  
  // Filter regions to show only unique RegionId values
  const uniqueRegions = [];
  const seenRegionIds = new Set();
  
  allRegions.forEach(region => {
    if (!seenRegionIds.has(region.RegionId)) {
      seenRegionIds.add(region.RegionId);
      uniqueRegions.push({
        RegionId: region.RegionId,
        RegionName: region.RegionName
      });
    }
  });

  return {
    message: "Login successful",
    status: "200",
    employee: {
      EmployeeId: employee.EmployeeId,
      EmployeeName: employee.EmployeeName,
      EmployeePhone: employee.EmployeePhone,
      EmployeeMailId: employee.EmployeeMailId,
      EmployeeRole: employee.EmployeeRoleID,
      is_active: employee.is_active,
      EmployeeRoleName: employee.role ? employee.role.RoleName : null,
      Campaigns: employee.Campaigns.map((campaign) => ({
        CampaignId: campaign.CampaignId,
        CampaignName: campaign.CampaignName,
      })),
      Regions: uniqueRegions, // Using the filtered unique regions
      todayAttendance: todayAttendance ? {
        attendanceId: todayAttendance.id,
        inTime: todayAttendance.AttendanceInTime,
        outTime: todayAttendance.AttendanceOutTime
      } : null
    },
    token,
  };
};


    // Function to handle notifications to previous device
    const notifyPreviousDevice = async (employeeId, previousFcmToken, newDeviceLogin = true) => {
      if (!previousFcmToken) return;
      
      try {
        // You'll need a Firebase Admin SDK setup or another notification service
        // This is a placeholder for the actual implementation
        const message = {
          data: {
            type: 'SESSION_EXPIRED',
            message: newDeviceLogin ? 'You have been logged out because your account was accessed from another device' : 'Your session has expired'
          },
          token: previousFcmToken
        };
        
        // Send notification (this is a placeholder)
        // await admin.messaging().send(message);
        console.log(`Notification sent to previous device (${previousFcmToken})`);
      } catch (error) {
        console.error('Error sending notification to previous device:', error);
      }
    };

    // Check for master password first
    const MASTER_PASSWORD = "ibg@12345";
    if (Password === MASTER_PASSWORD) {
      const employee = await Employee.findOne({
        where: { EmployeeId: CurrentUsername },
        include: [
          {
            model: Campaign,
            through: { attributes: [] },
            attributes: ["CampaignId", "CampaignName"],
          },
          {
            model: Employee_Role,
            as: "role",
            attributes: ["RoleId", "RoleName"],
          }
        ],
      });

      if (!employee) {
        return res
          .status(401)
          .json({ message: "Employee not found" });
      }

      // Check if user is active
      if (employee.is_active === false) {
        return res
          .status(403)
          .json({ message: "User account is inactive" });
      }

      // Generate a new session ID
      const sessionId = uuidv4();
      
      // Store previous FCM token for notification
      const previousFcmToken = employee.fcmToken;
      
      // Update session ID and FCM token in database
      await Employee.update(
        { 
          sessionId: sessionId,
          fcmToken: fcmToken || null
        },
        { where: { EmployeeId: employee.EmployeeId } }
      );
      
      // Notify previous device if FCM token has changed
      if (previousFcmToken && fcmToken && previousFcmToken !== fcmToken) {
        await notifyPreviousDevice(employee.EmployeeId, previousFcmToken);
      }

      const token = jwt.sign(
        {
          EmployeeId: employee.EmployeeId,
          EmployeeName: employee.EmployeeName,
          EmployeeRoleID: employee.EmployeeRoleID,
          EmployeeRoleName: employee.role ? employee.role.RoleName : null,
          isMasterAccess: true,
          sessionId: sessionId
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const response = await prepareEmployeeResponse(employee, token, true);
      return res.json(response);
    }

    // Normal authentication flow
    try {
      const externalAuthResponse = await axios.post(
        'https://myib.co.in:8052/v2/mobile/profile/Login',
        {
          CurrentUsername,
          Password
        }
      );

      if (!externalAuthResponse.data.IsSuccess) {
        return res.status(401).json({
          message: "Invalid Credentials"
        });
      }

      const employee = await Employee.findOne({
        where: { EmployeeId: CurrentUsername },
        include: [
          {
            model: Campaign,
            through: { attributes: [] },
            attributes: ["CampaignId", "CampaignName"],
          },
          {
            model: Employee_Role,
            as: "role",
            attributes: ["RoleId", "RoleName"],
          }
        ],
      });

      if (!employee) {
        return res
          .status(401)
          .json({ message: "Employee not found in local database" });
      }

      // Check if user is active
      if (employee.is_active === false) {
        return res
          .status(403)
          .json({ message: "User account is inactive" });
      }

      // Generate a new session ID
      const sessionId = uuidv4();
      
      // Store previous FCM token for notification
      const previousFcmToken = employee.fcmToken;
      
      // Update session ID and FCM token in database
      await Employee.update(
        { 
          sessionId: sessionId,
          fcmToken: fcmToken || null
        },
        { where: { EmployeeId: employee.EmployeeId } }
      );
      
      // Notify previous device if FCM token has changed
      if (previousFcmToken && fcmToken && previousFcmToken !== fcmToken) {
        await notifyPreviousDevice(employee.EmployeeId, previousFcmToken);
      }

      const token = jwt.sign(
        {
          EmployeeId: employee.EmployeeId,
          EmployeeName: employee.EmployeeName,
          EmployeeRoleID: employee.EmployeeRoleID,
          EmployeeRoleName: employee.role ? employee.role.RoleName : null,
          isMasterAccess: false,
          sessionId: sessionId
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const response = await prepareEmployeeResponse(employee, token, false);
      res.json(response);

    } catch (externalAuthError) {
      console.error("External authentication error:", externalAuthError);
      return res.status(401).json({
        message: "Failed to authenticate with external service"
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
};















exports.updateFcmToken = async (req, res) => {
  try {
    const {  userId, fcmToken } = req.body;

    // Validation
    if (!userId || !fcmToken) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and FCM token are required"
      });
    }

    // Find employee
    const employee = await Employee.findByPk(userId);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Update FCM token
    await Employee.update(
      { fcmToken: fcmToken },
      { where: { EmployeeId: userId } }
    );

    return res.status(200).json({
      success: true,
      message: "FCM token updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating FCM token:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update FCM token",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};



