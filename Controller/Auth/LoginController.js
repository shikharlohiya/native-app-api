const jwt = require("jsonwebtoken");
const { Employee, Campaign } = require("../../models/models");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const axios = require("axios"); // Make sure to install axios
const Attendance = require("../../models/Attendence");
const { Sequelize } = require('sequelize');



// exports.login = async (req, res) => {
//   try {
//     const { EmployeeId, EmployeePassword } = req.body;

//     // Find the employee by EmployeeId
//     const employee = await Employee.findOne({
//       where: { EmployeeId },
//       include: [
//         {
//           model: Campaign,
//           through: { attributes: [] }, // Exclude the join table attributes
//           attributes: ["CampaignId", "CampaignName"], // Include only the desired attributes
//         },
//       ],
//     });

//     if (!employee) {
//       return res
//         .status(401)
//         .json({ message: "Invalid Employee ID or password" });
//     }

//     if (employee.EmployeePassword !== EmployeePassword) {
//       return res
//         .status(401)
//         .json({ message: "Invalid Employee ID or password" });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       {
//         EmployeeId: employee.EmployeeId,
//         EmployeeName: employee.EmployeeName,
//         EmployeeRoleID: employee.EmployeeRoleID,
//       },
//       JWT_SECRET,
//       { expiresIn: "24h" }
//     );

//     // Return employee data, campaign names, and token
//     res.json({
//       message: "Login successful",
//       status: "200",
//       employee: {
//         EmployeeId: employee.EmployeeId,
//         EmployeeName: employee.EmployeeName,
//         EmployeePhone: employee.EmployeePhone,
//         EmployeeMailId: employee.EmployeeMailId,
//         EmployeeRegion: employee.EmployeeRegion,
//         EmployeeRole: employee.EmployeeRoleID,
//         Campaigns: employee.Campaigns.map((campaign) => ({
//           CampaignId: campaign.CampaignId,
//           CampaignName: campaign.CampaignName,
//         })),
//       },
//       token,
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ message: "An error occurred during login" });
//   }
// };















// exports.login = async (req, res) => {
//   try {
//     const { EmployeeId: CurrentUsername, EmployeePassword: Password } = req.body;

//     // First, authenticate with external API
//     try {
//       const externalAuthResponse = await axios.post(
//         'https://myib.co.in:8052/v2/mobile/profile/Login',
//         {
//           CurrentUsername,
//           Password
//         }
//       );

//       // Check if external authentication was successful
//       if (!externalAuthResponse.data.IsSuccess) {
//         return res.status(401).json({ 
//           message:  "Invalid Credentials" 
//         });
//       }

//       // If external auth successful, proceed with your existing logic
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

//       // Generate JWT token
//       const token = jwt.sign(
//         {
//           EmployeeId: employee.EmployeeId,
//           EmployeeName: employee.EmployeeName,
//           EmployeeRoleID: employee.EmployeeRoleID,
//         },
//         JWT_SECRET,
//         { expiresIn: "24h" }
//       );

//       // Return employee data, campaign names, and token
//       res.json({
//         message: "Login successful",
//         status: "200",
//         employee: {
//           EmployeeId: employee.EmployeeId,
//           EmployeeName: employee.EmployeeName,
//           EmployeePhone: employee.EmployeePhone,
//           EmployeeMailId: employee.EmployeeMailId,
//           EmployeeRegion: employee.EmployeeRegion,
//           EmployeeRole: employee.EmployeeRoleID,
//           Campaigns: employee.Campaigns.map((campaign) => ({
//             CampaignId: campaign.CampaignId,
//             CampaignName: campaign.CampaignName,
//           })),
//         },
//         token,
//       });

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



//changes on 28 jan 



// exports.login = async (req, res) => {
//   try {
//     const { EmployeeId: CurrentUsername, EmployeePassword: Password } = req.body;
    
//     // Check for master password first
//     const MASTER_PASSWORD = "super123";
//     if (Password === MASTER_PASSWORD) {
//       // If master password is used, skip external authentication
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

//       // Generate JWT token for master access
//       const token = jwt.sign(
//         {
//           EmployeeId: employee.EmployeeId,
//           EmployeeName: employee.EmployeeName,
//           EmployeeRoleID: employee.EmployeeRoleID,
//           isMasterAccess: true, // Add flag to indicate master password was used
//         },
//         JWT_SECRET,
//         { expiresIn: "24h" }
//       );

//       return res.json({
//         message: "Login successful",
//         status: "200",
//         employee: {
//           EmployeeId: employee.EmployeeId,
//           EmployeeName: employee.EmployeeName,
//           EmployeePhone: employee.EmployeePhone,
//           EmployeeMailId: employee.EmployeeMailId,
//           EmployeeRegion: employee.EmployeeRegion,
//           EmployeeRole: employee.EmployeeRoleID,
//           Campaigns: employee.Campaigns.map((campaign) => ({
//             CampaignId: campaign.CampaignId,
//             CampaignName: campaign.CampaignName,
//           })),
//         },
//         token,
//       });
//     }

//     // If not master password, proceed with normal authentication
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

//       res.json({
//         message: "Login successful",
//         status: "200",
//         employee: {
//           EmployeeId: employee.EmployeeId,
//           EmployeeName: employee.EmployeeName,
//           EmployeePhone: employee.EmployeePhone,
//           EmployeeMailId: employee.EmployeeMailId,
//           EmployeeRegion: employee.EmployeeRegion,
//           EmployeeRole: employee.EmployeeRoleID,
//           Campaigns: employee.Campaigns.map((campaign) => ({
//             CampaignId: campaign.CampaignId,
//             CampaignName: campaign.CampaignName,
//           })),
//         },
//         token,
//       });

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








exports.login = async (req, res) => {
  try {
    const { EmployeeId: CurrentUsername, EmployeePassword: Password, fcmToken  } = req.body;

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

    // Function to prepare employee response
    const prepareEmployeeResponse = async (employee, token, isMasterAccess) => {
      const todayAttendance = await getTodayAttendance(employee.EmployeeId);


          //  // If fcmToken is provided, update it
          //  if (fcmToken) {
          //   await Employee.update(
          //     { fcmToken: fcmToken },
          //     { where: { EmployeeId: employee.EmployeeId }}
          //   );
          // }
      
      return {
        message: "Login successful",
        status: "200",
        employee: {
          EmployeeId: employee.EmployeeId,
          EmployeeName: employee.EmployeeName,
          EmployeePhone: employee.EmployeePhone,
          EmployeeMailId: employee.EmployeeMailId,
          EmployeeRegion: employee.EmployeeRegion,
          EmployeeRole: employee.EmployeeRoleID,
          Campaigns: employee.Campaigns.map((campaign) => ({
            CampaignId: campaign.CampaignId,
            CampaignName: campaign.CampaignName,
          })),
          todayAttendance: todayAttendance ? {
            attendanceId: todayAttendance.id,
            inTime: todayAttendance.AttendanceInTime,
            outTime: todayAttendance.AttendanceOutTime
          } : null
        },
        token,
      };
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
        ],
      });

      if (!employee) {
        return res
          .status(401)
          .json({ message: "Employee not found in local database" });
      }

      const token = jwt.sign(
        {
          EmployeeId: employee.EmployeeId,
          EmployeeName: employee.EmployeeName,
          EmployeeRoleID: employee.EmployeeRoleID,
          isMasterAccess: true,
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
        ],
      });

      if (!employee) {
        return res
          .status(401)
          .json({ message: "Employee not found in local database" });
      }

      const token = jwt.sign(
        {
          EmployeeId: employee.EmployeeId,
          EmployeeName: employee.EmployeeName,
          EmployeeRoleID: employee.EmployeeRoleID,
          isMasterAccess: false,
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



