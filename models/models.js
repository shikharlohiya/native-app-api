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
const AuditNewFarmer = require('./AuditNewFarmer.js');
const BdmTravelDetail = require('./BdmTravelDetail.js'); 
const Leave = require('./Leave.js');
const Notification = require('./Notification.js');
const RegisteredPartner = require('./RegisteredPartner.js');
const TravelRegistration = require('./TravelRegistration.js');
const GroupMeeting = require('./GroupMeeting.js');
const Parivartan_Branch = require('./Parivartan_Branch.js');
const BdmTravelDetailForm = require('./BdmTravelDetailForm.js');

const { ShrimpFeedMaster, ShrimpFeedRemark } = require('./associations');

  
 


//  const sequelize = require('./index.js');



// BdmTravelDetailForm.sync({force: true});

 
// async function syncTables() {
//   try {
//     // First drop and recreate the child table (remarks)
//     await ShrimpFeedRemark.drop({ force: true });
    
//     // Then drop and recreate the parent table (master)
//     await ShrimpFeedMaster.drop({ force: true });
    
//     // Now recreate the tables in correct order
//     await ShrimpFeedMaster.sync({ force: true });
//     await ShrimpFeedRemark.sync({ force: true });
    
//     console.log('Shrimp Feed tables created successfully');
//   } catch (error) {
//     console.error('Error creating Shrimp Feed tables:', error);
//   }
// }




// syncTables();







//  GroupMeeting.sync({force: true});


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
