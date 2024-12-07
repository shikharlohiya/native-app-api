const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const Lead_Detail = require("./lead_detail");
const Employee = require("./employee");

class LeadLog extends Model {}

LeadLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    action_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sub_category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    performed_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    LeadDetailId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    follow_up_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estimations_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    extra_fields3: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "LeadLog",
    tableName: "lead_logs",
    timestamps: true,
  }
);

// Associations
LeadLog.belongsTo(Lead_Detail, {
  foreignKey: "LeadDetailId",
  as: "LeadDetail",
});
Lead_Detail.hasMany(LeadLog, { foreignKey: "LeadDetailId", as: "Logs" });

LeadLog.belongsTo(Employee, { foreignKey: "performed_by", as: "PerformedBy" });
Employee.hasMany(LeadLog, {
  foreignKey: "performed_by",
  as: "PerformedActions",
});

module.exports = LeadLog;
