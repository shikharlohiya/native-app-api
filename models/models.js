const Country = require("./country");
const State = require("./state");
const City = require("./city");
const Place = require("./place");
const Zone = require("./zone");
const Region = require("./region");
const Area = require("./area");
const Employee = require("./employee");
const Employee_Role = require("./employeRole");
const Lead_Detail = require("./lead_detail");
const lead_Meeting = require("./lead_meeting.js");
const Campaign = require("./campaign.js");
const Employee_Campaign = require("./EmployeCampaign.js");
const Lead_Update = require("./lead_update.js");
const Site_Visit = require("./site_visit.js");
const Estimation = require("./estimation.js");
const AuditLeadDetail = require("./AuditLeadTable.js");
const AuditLeadRemark = require("./AuditLeadRemark.js");
const LeadConverted = require("./Lead_converted.js");
const AuditTraderTable = require("./AuditTraderTable.js");
const LeadLog = require("./leads_logs.js");
const FollowUPByAgent = require("./FollowUpByAgent.js");
const OnCallDiscussionByBdm = require("./OnCallDiscussionByBdm.js");
const BdmLeadAction = require("./BdmLeadAction.js");
const Attendance = require("./Attendence.js");
const Parivartan_State = require("./Parivartan_State.js");
const Parivartan_Region = require("./Parivartan_Region.js");
const Parivartan_Employee = require("./Parivartan_BDM.js");
const  BiDayOp = require("./BiDayOp.js");
const BiDayOpRemarks = require("./BiDayOpRemarks.js");
const BiBrooding = require("./BiBrooding.js");
const call_logs = require("./CallLog.js");
const incoming_calls  = require('./IncomingCall.js')
const PostCallData = require('./PostCallData.js');

const BiDayOpMaster = require('./BiDayOpMaster.js');
const BiDayOpLot = require('./BiDayOpLot.js');
const BiDayOpLotHistory = require('./BiDayOpLotHistory.js');
const CustomerLeadForm = require('./CustomerLeadForm.js');
const VistaarBroilerDistribution = require('./VistaarBroilerDistribution.js');
const chicks_inquiry = require('./ChicksInquiry.js');
const Parivartan_BDM = require('./Parivartan_BDM.js');
const source = require('./Source.js');
 
const sequelize = require('./index.js');

// CustomerLeadForm.sync({alter: true});

// const dropLeadUpdateTable = async () => {
//   try {
//     await Lead_Detail.drop();
//     console.log("Lead_Update table has been dropped successfully");
//   } catch (error) {
//     console.error("An error occurred while dropping the table:", error);
//   }
// };

// // // Call the function
// dropLeadUpdateTable();

// Uncomment and adjust the sync options as needed

//  source.sync({force:true});

// chicks_inquiry.sync({force: true});
// Parivartan_BDM.sync({alter: true});
// Country.sync({force:true});
// call_logs.sync({force:true});
// City.sync({alter:true});
// Place.sync({force:true});
// Zone.sync({force:true});
// Region.sync({force:true});
// Area.sync({force:true});
// Site_Visit.sync({force:true})
// BDM.sync({force:true})
// Employee.sync({alter: true});
// Employee_Role.sync({alter: true});
// Estimation.sync({alter: true});

// Attendance.sync();

// Parivartan_Employee.sync({force: true});

// lead_Meeting.sync({alter:true});

//  AuditLeadRemark.sync({force:true});
// Employee_Campaign.sync({force:true});

// Parivartan_Region.sync({force: true});

// Parivartan_Employee.sync({force: true});

// Lead_Update.sync({alter: true})

// Call associate method for each model
// Object.keys(models).forEach(modelName => {
//     if (models[modelName].associate) {
//       models[modelName].associate(models);
//     }
//   });


// const excelData = [
//   { StateName: "Andhra Pradesh", RegionName: "Andhra Pradesh 1", EmployeeId: "10014559", EmployeeName: "Baki Tarun Kumar" },
//   { StateName: "Andhra Pradesh", RegionName: "Andhra Pradesh 2", EmployeeId: "10001801", EmployeeName: "C M Lokesh" },
//   { StateName: "Chhattisgarh", RegionName: "Chhattisgarh", EmployeeId: "10005300", EmployeeName: "Priyadatta Kumar Swain" },
//   { StateName: "Gujarat", RegionName: "Gujarat", EmployeeId: "10013346", EmployeeName: "Vishal Kumar Gupta" },
//   { StateName: "Haryana", RegionName: "Haryana 1", EmployeeId: "10013531", EmployeeName: "Ranjan Rahi" },
//   { StateName: "Haryana", RegionName: "Haryana 2", EmployeeId: "10013531", EmployeeName: "Ranjan Rahi" },
//   { StateName: "Himachal Pradesh", RegionName: "Himachal Pradesh", EmployeeId: "10013531", EmployeeName: "Ranjan Rahi" },
//   { StateName: "Jammu and Kashmir", RegionName: "Jammu and Kashmir", EmployeeId: "10013531", EmployeeName: "Ranjan Rahi" },
//   { StateName: "Jharkhand", RegionName: "Jharkhand", EmployeeId: "10005300", EmployeeName: "Priyadatta Kumar Swain" },
//   { StateName: "Karnataka", RegionName: "Karnataka 1", EmployeeId: "10009604", EmployeeName: "Yallappa Ajjodi" },
//   { StateName: "Karnataka", RegionName: "Karnataka 2", EmployeeId: "10001801", EmployeeName: "C M Lokesh" },
//   { StateName: "Assam", RegionName: "Lower Assam", EmployeeId: "10023324", EmployeeName: "Arijit Dutta" },
//   { StateName: "Madhya Pradesh", RegionName: "Madhya Pradesh 1", EmployeeId: "10019059", EmployeeName: "Deepanker Kumar Dubey" },
//   { StateName: "Madhya Pradesh", RegionName: "Madhya Pradesh 2", EmployeeId: "10013346", EmployeeName: "Vishal Kumar Gupta" },
//   { StateName: "Maharashtra", RegionName: "Maharashtra 1", EmployeeId: "10003754", EmployeeName: "Girish Gopal Lakkewar" },
//   { StateName: "Maharashtra", RegionName: "Maharashtra 2", EmployeeId: "10020353", EmployeeName: "Sachin Suresh Nangare" },
//   { StateName: "West Bengal", RegionName: "North Bengal 1", EmployeeId: "10007894", EmployeeName: "Abhijit Saha" },
//   { StateName: "West Bengal", RegionName: "North Bengal 2", EmployeeId: "10013212", EmployeeName: "Somnath Chatterjee" },
//   { StateName: "Bihar", RegionName: "North Bihar", EmployeeId: "10023324", EmployeeName: "Arijit Dutta" },
//   { StateName: "Odisha", RegionName: "Odisha 1", EmployeeId: "10006206", EmployeeName: "Mrutyunjaya Samal" },
//   { StateName: "Odisha", RegionName: "Odisha 2", EmployeeId: "10021958", EmployeeName: "Narayan Behera" },
//   { StateName: "Punjab", RegionName: "Punjab 1", EmployeeId: "10013531", EmployeeName: "Ranjan Rahi" },
//   { StateName: "Punjab", RegionName: "Punjab 2", EmployeeId: "10013531", EmployeeName: "Ranjan Rahi" },
//   { StateName: "Rajasthan", RegionName: "Rajasthan", EmployeeId: "10023999", EmployeeName: "Vikas Singh" },
//   { StateName: "West Bengal", RegionName: "South Bengal 1", EmployeeId: "10004733", EmployeeName: "Anup Sarkar" },
//   { StateName: "West Bengal", RegionName: "South Bengal 2", EmployeeId: "10005917", EmployeeName: "Kanhu Charan Sardarsingh" },
//   { StateName: "Bihar", RegionName: "South Bihar", EmployeeId: "10023324", EmployeeName: "Arijit Dutta" },
//   { StateName: "Tamil Nadu", RegionName: "Tamil Nadu 1", EmployeeId: "10009829", EmployeeName: "Dharmaraj R" },
//   { StateName: "Tamil Nadu", RegionName: "Tamil Nadu 2", EmployeeId: "10009829", EmployeeName: "Dharmaraj R" },
//   { StateName: "Telangana", RegionName: "Telangana 1", EmployeeId: "10015791", EmployeeName: "Shaik Shafiuddin" },
//   { StateName: "Telangana", RegionName: "Telangana 2", EmployeeId: "10019564", EmployeeName: "Firoz Khan" },
//   { StateName: "Arunachal Pradesh", RegionName: "Arunachal Pradesh", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Goa", RegionName: "Goa", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Kerala", RegionName: "Kerala", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Manipur", RegionName: "Manipur", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Meghalaya", RegionName: "Meghalaya", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Mizoram", RegionName: "Mizoram", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Nagaland", RegionName: "Nagaland", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Sikkim", RegionName: "Sikkim", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Tripura", RegionName: "Tripura", EmployeeId: "", EmployeeName: "" }
// ];






// const excelData = [
//   { StateName: "Andhra Pradesh", RegionName: "Andhra Pradesh 1", EmployeeId: "10014559", EmployeeName: "Baki Tarun Kumar" },
//   { StateName: "Andhra Pradesh", RegionName: "Andhra Pradesh 2", EmployeeId: "10001801", EmployeeName: "C M Lokesh" },
//   { StateName: "Chhattisgarh", RegionName: "Chhattisgarh", EmployeeId: "10005300", EmployeeName: "Priyadatta Kumar Swain" },
//   { StateName: "Gujarat", RegionName: "Gujarat", EmployeeId: "10013346", EmployeeName: "Vishal Kumar Gupta" },
//   { StateName: "Haryana", RegionName: "Haryana 1", EmployeeId: "10013531", EmployeeName: "Ranjan Rahi" },
//   { StateName: "Haryana", RegionName: "Haryana 2", EmployeeId: "10013531", EmployeeName: "Ranjan Rahi" },
//   { StateName: "Himachal Pradesh", RegionName: "Himachal Pradesh", EmployeeId: "10013531", EmployeeName: "Ranjan Rahi" },
//   { StateName: "Jammu and Kashmir", RegionName: "Jammu and Kashmir", EmployeeId: "10013531", EmployeeName: "Ranjan Rahi" },
//   { StateName: "Jharkhand", RegionName: "Jharkhand", EmployeeId: "10005300", EmployeeName: "Priyadatta Kumar Swain" },
//   { StateName: "Karnataka", RegionName: "Karnataka 1", EmployeeId: "10009604", EmployeeName: "Yallappa Ajjodi" },
//   { StateName: "Karnataka", RegionName: "Karnataka 2", EmployeeId: "10001801", EmployeeName: "C M Lokesh" },
//   { StateName: "Assam", RegionName: "Lower Assam", EmployeeId: "10023324", EmployeeName: "Arijit Dutta" },
//   { StateName: "Assam", RegionName: "UPPER ASSAM", EmployeeId: "10013328", EmployeeName: "Abhijit Kurmi" },
//   { StateName: "Madhya Pradesh", RegionName: "Madhya Pradesh 1", EmployeeId: "10019059", EmployeeName: "Deepanker Kumar Dubey" },
//   { StateName: "Madhya Pradesh", RegionName: "Madhya Pradesh 2", EmployeeId: "10013346", EmployeeName: "Vishal Kumar Gupta" },
//   { StateName: "Maharashtra", RegionName: "Maharashtra 1", EmployeeId: "10003754", EmployeeName: "Girish Gopal Lakkewar" },
//   { StateName: "Maharashtra", RegionName: "Maharashtra 2", EmployeeId: "10020353", EmployeeName: "Sachin Suresh Nangare" },
//   { StateName: "West Bengal", RegionName: "North Bengal 1", EmployeeId: "10007894", EmployeeName: "Abhijit Saha" },
//   { StateName: "West Bengal", RegionName: "North Bengal 2", EmployeeId: "10013212", EmployeeName: "Somnath Chatterjee" },
//   { StateName: "Bihar", RegionName: "North Bihar", EmployeeId: "10023324", EmployeeName: "Arijit Dutta" },
//   { StateName: "Odisha", RegionName: "Odisha 1", EmployeeId: "10006206", EmployeeName: "Mrutyunjaya Samal" },
//   { StateName: "Odisha", RegionName: "Odisha 2", EmployeeId: "10021958", EmployeeName: "Narayan Behera" },
//   { StateName: "Punjab", RegionName: "Punjab 1", EmployeeId: "10013531", EmployeeName: "Ranjan Rahi" },
//   { StateName: "Punjab", RegionName: "Punjab 2", EmployeeId: "10013531", EmployeeName: "Ranjan Rahi" },
//   { StateName: "Rajasthan", RegionName: "Rajasthan", EmployeeId: "10023999", EmployeeName: "Vikas Singh" },
//   { StateName: "West Bengal", RegionName: "South Bengal 1", EmployeeId: "10004733", EmployeeName: "Anup Sarkar" },
//   { StateName: "West Bengal", RegionName: "South Bengal 2", EmployeeId: "10005917", EmployeeName: "Kanhu Charan Sardarsingh" },
//   { StateName: "Bihar", RegionName: "South Bihar", EmployeeId: "10023324", EmployeeName: "Arijit Dutta" },
//   { StateName: "Tamil Nadu", RegionName: "Tamil Nadu 1", EmployeeId: "10009829", EmployeeName: "Dharmaraj R" },
//   { StateName: "Tamil Nadu", RegionName: "Tamil Nadu 2", EmployeeId: "10009829", EmployeeName: "Dharmaraj R" },
//   { StateName: "Telangana", RegionName: "Telangana 1", EmployeeId: "10015791", EmployeeName: "Shaik Shafiuddin" },
//   { StateName: "Telangana", RegionName: "Telangana 2", EmployeeId: "10019564", EmployeeName: "Firoz Khan" },
//   { StateName: "Arunachal Pradesh", RegionName: "Arunachal Pradesh", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Goa", RegionName: "Goa", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Kerala", RegionName: "Kerala", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Manipur", RegionName: "Manipur", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Meghalaya", RegionName: "Meghalaya", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Mizoram", RegionName: "Mizoram", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Nagaland", RegionName: "Nagaland", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Sikkim", RegionName: "Sikkim", EmployeeId: "", EmployeeName: "" },
//   { StateName: "Tripura", RegionName: "Tripura", EmployeeId: "", EmployeeName: "" },
//   // Adding the three Uttar Pradesh entries
//   { StateName: "Uttar Pradesh", RegionName: "UTTAR PRADESH - I", EmployeeId: "10020477", EmployeeName: "Jang Bahadur" },
//   { StateName: "Uttar Pradesh", RegionName: "UTTAR PRADESH - II", EmployeeId: "10014191", EmployeeName: "Rajan Pandey" },
//   { StateName: "Uttar Pradesh", RegionName: "UTTAR PRADESH - III", EmployeeId: "10019564", EmployeeName: "Firoz Khan" },
//   { StateName: "Uttarakhand", RegionName: "UTTARAKHAND", EmployeeId: "10019564", EmployeeName: "Firoz Khan" }
// ];










// function generateShortId(prefix) {
//   return `${prefix}${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;
// }

// async function insertData() {
//   try {
//     await sequelize.sync();

//     for (const row of excelData) {
//       const [state] = await Parivartan_State.findOrCreate({
//         where: { StateName: row.state },
//         defaults: {
//           StateId: generateShortId('ST'),
//           Deleted: 'N'
//         }
//       });

//       const [region] = await Parivartan_Region.findOrCreate({
//         where: { RegionName: row.region, StateId: state.StateId },
//         defaults: {
//           RegionId: generateShortId('RG'),
//           Deleted: 'N'
//         }
//       });

//       await Parivartan_Employee.upsert({
//         EmployeeId: row.employeeId,
//         EmployeeName: row.employeeName,
//         RegionId: region.RegionId,
//         Deleted: 'N'
//       });
//     }

//     console.log('Data insertion completed successfully.');
//   } catch (error) {
//     console.error('Error inserting data:', error);
//   } finally {
//     await sequelize.close();
//   }
// }

// insertData();


// function generateShortId(prefix) {
//   return `${prefix}${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;
// }

// async function insertData() {
//   try {
//     await sequelize.sync();

//     for (const row of excelData) {
//       const [state] = await Parivartan_State.findOrCreate({
//         where: { StateName: row.StateName },
//         defaults: {
//           StateId: generateShortId('ST'),
//           Deleted: 'N'
//         }
//       });

//       const [region] = await Parivartan_Region.findOrCreate({
//         where: { RegionName: row.RegionName, StateId: state.StateId },
//         defaults: {
//           RegionId: generateShortId('RG'),
//           Deleted: 'N'
//         }
//       });

//       if (row.EmployeeId && row.EmployeeName) {
//         await Parivartan_Employee.upsert({
//           EmployeeId: row.EmployeeId,
//           EmployeeName: row.EmployeeName,
//           RegionId: region.RegionId,
//           Deleted: 'N'
//         });
//       }
//     }

//     console.log('Data insertion completed successfully.');
//   } catch (error) {
//     console.error('Error inserting data:', error);
//   } finally {
//     await sequelize.close();
//   }
// }

// insertData();




// function generateShortId(prefix) {
//   return `${prefix}${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;
// }

// async function insertData() {
//   try {
//     await sequelize.sync();

//     for (const row of excelData) {
//       // Find or create state
//       const [state] = await Parivartan_State.findOrCreate({
//         where: { StateName: row.StateName },
//         defaults: {
//           StateId: generateShortId('ST'),
//           Deleted: 'N'
//         }
//       });

//       // Find or create region
//       const [region] = await Parivartan_Region.findOrCreate({
//         where: { RegionName: row.RegionName, StateId: state.StateId },
//         defaults: {
//           RegionId: generateShortId('RG'),
//           Deleted: 'N'
//         }
//       });

//       // Only update or create BDM if EmployeeId and EmployeeName are provided
//       if (row.EmployeeId && row.EmployeeName) {
//         await Parivartan_Employee.upsert({
//           EmployeeId: row.EmployeeId,
//           EmployeeName: row.EmployeeName,
//           RegionId: region.RegionId,
//           Deleted: 'N'
//         });
//       }
//     }

//     console.log('Data insertion completed successfully.');
//   } catch (error) {
//     console.error('Error inserting data:', error);
//   } finally {
//     await sequelize.close();
//   }
// }

// insertData();


// function generateShortId(prefix) {
//   return `${prefix}${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;
// }

// async function insertData() {
//   try {
//     await sequelize.sync();

//     for (const row of excelData) {
//       // Find or create state
//       const [state] = await Parivartan_State.findOrCreate({
//         where: { StateName: row.StateName },
//         defaults: {
//           StateId: generateShortId('ST'),
//           Deleted: 'N'
//         }
//       });

//       // Find or create region
//       const [region] = await Parivartan_Region.findOrCreate({
//         where: { RegionName: row.RegionName, StateId: state.StateId },
//         defaults: {
//           RegionId: generateShortId('RG'),
//           Deleted: 'N'
//         }
//       });

//       // Only create BDM entry if EmployeeId and EmployeeName are provided
//       if (row.EmployeeId && row.EmployeeName) {
//         await Parivartan_Employee.create({
//           EmployeeId: row.EmployeeId,
//           EmployeeName: row.EmployeeName,
//           RegionId: region.RegionId,
//           Deleted: 'N'
//         });
//       }
//     }

//     console.log('Data insertion completed successfully.');
//   } catch (error) {
//     console.error('Error inserting data:', error);
//   } finally {
//     await sequelize.close();
//   }
// }

// insertData();

module.exports = {
  Lead_Update,
  Site_Visit,
  lead_Meeting,
  Employee,
  Employee_Role,
  Country,
  State,
  City,
  Place,
  Zone,
  Region,
  Area,
  Lead_Detail,
  Campaign,
  AuditLeadDetail,
};
