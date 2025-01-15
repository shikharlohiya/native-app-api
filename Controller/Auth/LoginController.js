const jwt = require("jsonwebtoken");
const { Employee, Campaign } = require("../../models/models");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const axios = require("axios"); // Make sure to install axios



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















exports.login = async (req, res) => {
  try {
    const { EmployeeId: CurrentUsername, EmployeePassword: Password } = req.body;

    // First, authenticate with external API
    try {
      const externalAuthResponse = await axios.post(
        'https://myib.co.in:8052/v2/mobile/profile/Login',
        {
          CurrentUsername,
          Password
        }
      );

      // Check if external authentication was successful
      if (!externalAuthResponse.data.IsSuccess) {
        return res.status(401).json({ 
          message:  "Invalid Credentials" 
        });
      }

      // If external auth successful, proceed with your existing logic
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

      // Generate JWT token
      const token = jwt.sign(
        {
          EmployeeId: employee.EmployeeId,
          EmployeeName: employee.EmployeeName,
          EmployeeRoleID: employee.EmployeeRoleID,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Return employee data, campaign names, and token
      res.json({
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
        },
        token,
      });

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