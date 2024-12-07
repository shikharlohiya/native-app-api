const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const Lead_Detail = require("./lead_detail");
const Employee = require("./employee");

class LeadUpdate extends Model {}

LeadUpdate.init(
  {
    follow_up_date: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.STRING,
    },
    sub_category: {
      type: DataTypes.STRING,
    },
    remark: {
      type: DataTypes.STRING,
    },
    closure_month: {
      type: DataTypes.STRING,
    },
    // Add the BDMId field
    BDMId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "LeadUpdate",
    tableName: "lead_update",
  }
);

Lead_Detail.hasMany(LeadUpdate, { foreignKey: "LeadDetailId", as: "Updates" });
LeadUpdate.belongsTo(Lead_Detail, {
  foreignKey: "LeadDetailId",
  as: "LeadDetail",
});

Employee.hasMany(LeadUpdate, { foreignKey: "AgentId", as: "AgentLeadUpdates" });
LeadUpdate.belongsTo(Employee, { foreignKey: "AgentId", as: "Agent" });

Employee.hasMany(LeadUpdate, { foreignKey: "BDMId", as: "BDMLeadUpdates" });
LeadUpdate.belongsTo(Employee, { foreignKey: "BDMId", as: "BDM" });

module.exports = LeadUpdate;
