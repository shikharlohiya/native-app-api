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
const Category = require('./Category.js');
const SubCategory = require('./SubCategory.js');
const EmployeeLocation = require('./EmployeeLocation.js')
const { ShrimpFeedMaster, ShrimpFeedRemark } = require('./associations');

  



const salesCategoriesData = {
  categories: [
    {
      id: 1,
      name: "Hot",
      color: "#FFF2CC", // Yellow background
      subCategories: [
        {
          id: 101,
          name: "Payment by end of Month",
          priority: "High",
          priorityColor: "#00B050" // Green
        },
        {
          id: 102,
          name: "Payment by next Month",
          priority: "Medium",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 103,
          name: "Payment within 1 Week",
          priority: "High",
          priorityColor: "#00B050" // Green
        },
        {
          id: 104,
          name: "Payment within 15 Days",
          priority: "High",
          priorityColor: "#00B050" // Green
        },
        {
          id: 105,
          name: "Already constructed/under process",
          priority: "High",
          priorityColor: "#00B050" // Green
        }
      ]
    },
    {
      id: 2,
      name: "Warm",
      color: "#FCE4D6", // Light orange background
      subCategories: [
        {
          id: 201,
          name: "Approval for NOC/PCB PENDING",
          priority: "Medium",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 202,
          name: "Bank Loan Under Process",
          priority: "Medium",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 203,
          name: "Blocked Marketing issues",
          priority: "Low",
          priorityColor: "#FF0000" // Red
        },
        {
          id: 204,
          name: "Compare Estimation To Other",
          priority: "High",
          priorityColor: "#00B050" // Green
        },
        {
          id: 205,
          name: "Confirmation after Discussion with BDM",
          priority: "Medium",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 206,
          name: "Confirmation after Discussion with Family",
          priority: "Medium",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 207,
          name: "Estimation shared, follow required",
          priority: "High",
          priorityColor: "#00B050" // Green
        },
        {
          id: 208,
          name: "Farmer not responding after meeting / site visit",
          priority: "Low",
          priorityColor: "#FF0000" // Red
        },
        {
          id: 209,
          name: "Integration not available",
          priority: "Low",
          priorityColor: "#FF0000" // Red
        },
        {
          id: 210,
          name: "Language Barrier",
          priority: "High",
          priorityColor: "#00B050" // Green
        },
        {
          id: 211,
          name: "On Call Discussion Required",
          priority: "High",
          priorityColor: "#00B050" // Green
        },
        {
          id: 212,
          name: "Ongoing land registration",
          priority: "Medium",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 213,
          name: "Planning after 3-6 months",
          priority: "Medium",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 214,
          name: "Site Visit Required",
          priority: "High",
          priorityColor: "#00B050" // Green
        },
        {
          id: 215,
          name: "Start Construction after 1 Year",
          priority: "Low",
          priorityColor: "#FF0000" // Red
        },
        {
          id: 216,
          name: "Start Construction in few Days",
          priority: "High",
          priorityColor: "#00B050" // Green
        },
        {
          id: 217,
          name: "Start Construction within 3-6 Months",
          priority: "Medium",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 218,
          name: "Start Construction within 6-12 Months",
          priority: "Low",
          priorityColor: "#FF0000" // Red
        },
        {
          id: 219,
          name: "Want Estimation(New/Revised)",
          priority: "High",
          priorityColor: "#00B050" // Green
        },
        {
          id: 220,
          name: "Want Meetings With BDM",
          priority: "High",
          priorityColor: "#00B050" // Green
        },
        {
          id: 221,
          name: "Will arrange Basics in Future",
          priority: "Medium",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 222,
          name: "Customer out of State/ Country",
          priority: "Medium",
          priorityColor: "#FFFF00" // Yellow
        }
      ]
    },
    {
      id: 3,
      name: "Lost",
      color: "#FFC7CE", // Light red background
      subCategories: [
        {
          id: 301,
          name: "Price High",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 302,
          name: "BDM did not connect",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 303,
          name: "BI did not connect",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 304,
          name: "Influenced by other Farmers",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 305,
          name: "Negative Feedback in local area",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 306,
          name: "Local Team Behaviour not Good",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 307,
          name: "BDM did not attended the customer well",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        }
      ]
    },
    {
      id: 4,
      name: "Pending",
      color: "#FFEB9C", // Light amber background
      subCategories: [
        {
          id: 401,
          name: "Busy_Need to Recall",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 402,
          name: "No Call Response",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 403,
          name: "Number Switched Off",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        }
      ]
    },
    {
      id: 5,
      name: "Closed",
      color: "#C6EFCE", // Light green background
      subCategories: [
        {
          id: 501,
          name: "Converted_P",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 502,
          name: "LOI Done_PGN",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        }
      ]
    },
    {
      id: 6,
      name: "Cold",
      color: "#D9E1F2", // Light blue background
      subCategories: [
        {
          id: 601,
          name: "Complaint",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 602,
          name: "Integration not available",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 603,
          name: "Interested in Layer Farming",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 604,
          name: "Invalid/Incorrect Number",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 605,
          name: "Just Enquiry",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 606,
          name: "Land on Lease",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 607,
          name: "Land/Shed not Suitable",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 608,
          name: "Lost To Competitor",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 609,
          name: "No Budget",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 610,
          name: "No Electricity",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 611,
          name: "No Land",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 612,
          name: "No Road",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 613,
          name: "North South Direction",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 614,
          name: "Not Interested",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 615,
          name: "Other Business Inquiry",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 616,
          name: "Rejected by BI Team",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 617,
          name: "RNR Multiple Times",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 618,
          name: "Want Only Integration",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 619,
          name: "Incoming Not Available",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        },
        {
          id: 620,
          name: "Plan Dropped",
          priority: "NA",
          priorityColor: "#FFFF00" // Yellow
        }
      ]
    }
  ]
};
 

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Reset the auto-increment counters
    await SubCategory.destroy({ truncate: { cascade: true } });
    await Category.destroy({ truncate: { cascade: true } });
    
    console.log('Existing data cleared');
    
    // Create categories
    for (const categoryData of salesCategoriesData.categories) {
      console.log(`Creating category: ${categoryData.name}`);
      
      const category = await Category.create({
        CategoryId: categoryData.id,
        CategoryName: categoryData.name,
        Color: categoryData.color,
        Deleted: "N"
      });
      
      // Create subcategories for this category
      for (const subCategoryData of categoryData.subCategories) {
        console.log(`Creating subcategory: ${subCategoryData.name}`);
        
        await SubCategory.create({
          SubCategoryId: subCategoryData.id,
          SubCategoryName: subCategoryData.name,
          Priority: subCategoryData.priority,
          PriorityColor: subCategoryData.priorityColor,
          CategoryId: category.CategoryId,
          Deleted: "N"
        });
      }
    }
    
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Failed to seed database:', err);
      process.exit(1);
    });
}

 



// EmployeeLocation.sync({force: true});

  



// seedDatabase();







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
