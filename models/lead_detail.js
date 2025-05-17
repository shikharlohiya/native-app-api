const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
class Lead_Detail extends Model {}
const Employee = require("./employee");
const Campaign = require("./campaign");
const ParivatanRegion = require("./Parivartan_Region"); // Add this import

Lead_Detail.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },

    // Model attributes are defined here
    InquiryType: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    Project: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    CustomerName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    MobileNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    AlternateMobileNo: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    WhatsappNo: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    CustomerMailId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    state_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    region_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    site_location_address: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    call_status: {
      type: DataTypes.ENUM("Connected", "Failed"),
    },
    call_type: {
      type: DataTypes.ENUM("Inbound", "OutBound"),
      allowNull: true,
    },

    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    sub_category: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    agent_remark: {
      type: DataTypes.STRING(1500),
      allowNull: true,
    },
    bdm_remark: {
      type: DataTypes.STRING(1500),
    },

    follow_up_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    lead_transfer_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    source_of_lead_generated: {
      type: DataTypes.INTEGER,
    },

    close_month: {
      type: DataTypes.STRING(20),
    },

    AgentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    BDMId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    SuperviserID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    lead_created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    last_action: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    RegionId:{
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    categoryId:{
            type: DataTypes.INTEGER,
      allowNull: true,
    },
        subCategoryId:{
            type: DataTypes.INTEGER,
      allowNull: true,
    },
     branchName:{
            type: DataTypes.STRING,
      allowNull: true,
    },
         branchId:{
            type: DataTypes.INTEGER,
      allowNull: true,
    },
        districtName:{
        type: DataTypes.STRING,
      allowNull: true,
            

    }




  },

  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: "LeadDetail", // We need to choose the model name
    tableName: "lead_detail",
    timestamps: true,
  }
);

Lead_Detail.belongsTo(Employee, { foreignKey: "AgentId", as: "Agent" });
Lead_Detail.belongsTo(Employee, { foreignKey: "BDMId", as: "BDM" });
Lead_Detail.belongsTo(Employee, {
  foreignKey: "SuperviserID",
  as: "Superviser",
});

Lead_Detail.belongsTo(Campaign, {
  foreignKey: "source_of_lead_generated",
  as: "Campaign",
});

Lead_Detail.belongsTo(ParivatanRegion, {
  foreignKey: 'RegionId',
  as: 'Region'
});




module.exports = Lead_Detail;
const OnCallDiscussionByBdm = require("./OnCallDiscussionByBdm");
const Notification = require("./Notification");

Lead_Detail.hasMany(OnCallDiscussionByBdm, {
  foreignKey: 'LeadDetailId',
  as: 'Updatess'
});


Lead_Detail.hasMany(Notification, {
 foreignKey: 'leadDetailId',
 as: 'Notifications'
});
