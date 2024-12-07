const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const Employee = require("./employee");
const Campaign = require("./campaign");

class EmployeeCampaign extends Model {}

EmployeeCampaign.init(
  {
    EmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Employee_table",
        key: "EmployeeId",
      },
    },
    CampaignId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Campaign_table",
        key: "CampaignId",
      },
    },
  },
  {
    sequelize,
    modelName: "EmployeeCampaign",
    tableName: "employee_campaign",
    timestamps: false,
  }
);

// Define associations
Employee.belongsToMany(Campaign, {
  through: EmployeeCampaign,
  foreignKey: "EmployeeId",
  otherKey: "CampaignId",
});

Campaign.belongsToMany(Employee, {
  through: EmployeeCampaign,
  foreignKey: "CampaignId",
  otherKey: "EmployeeId",
});

//added new---
Campaign.hasMany(EmployeeCampaign, { 
  foreignKey: 'CampaignId' 
});

module.exports = EmployeeCampaign;
