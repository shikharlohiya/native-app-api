const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const Lead_Detail = require("./lead_detail");
const Employee = require("./employee");

class FollowUPByAgent extends Model {}

FollowUPByAgent.init(
  {
    follow_up_date: {
      type: DataTypes.DATE,
    },
    category: {
      type: DataTypes.STRING(20),
    },
    sub_category: {
      type: DataTypes.STRING(100),
    },
    remark: {
      type: DataTypes.STRING(250),
    },
    closure_month: {
      type: DataTypes.STRING(20),
    },
    extra_field1: {
      type: DataTypes.STRING,
    },
    extra_field2: {
      type: DataTypes.STRING,
    },
    extra_field3: {
      type: DataTypes.STRING,
    },
    AgentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    LeadDetailId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "FollowUPByAgent",
    tableName: "follow_up_by_agent",
    timestamps: true,
  }
);

Lead_Detail.hasMany(FollowUPByAgent, { foreignKey: "LeadDetailId" });
FollowUPByAgent.belongsTo(Lead_Detail, { foreignKey: "LeadDetailId" });

Employee.hasMany(FollowUPByAgent, { foreignKey: "AgentId", as: "AgentName" });
FollowUPByAgent.belongsTo(Employee, { foreignKey: "AgentId", as: "AgentName" });

// Employee.hasMany(LeadUpdate, { foreignKey: 'BDMId', as: 'BDMLeadUpdates' });
// LeadUpdate.belongsTo(Employee, { foreignKey: 'BDMId', as: 'BDM' });

module.exports = FollowUPByAgent;
