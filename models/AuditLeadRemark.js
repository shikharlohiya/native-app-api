const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const AuditLleadDetail = require("./AuditLeadTable");
const Employee = require("./employee");

class AuditLeadRemark extends Model {}

AuditLeadRemark.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    CH: {
      type: DataTypes.STRING,
    },
    AGE: {
      type: DataTypes.STRING,
    },
    BWT: {
      type: DataTypes.STRING,
    },
    M_QTY: {
      type: DataTypes.STRING,
    },
    REASON: {
      type: DataTypes.STRING,
    },
    MED: {
      type: DataTypes.STRING,
    },
    FEED: {
      type: DataTypes.STRING,
    },
    STOCK: {
      type: DataTypes.STRING,
    },
    IFFT_IN: {
      type: DataTypes.STRING,
    },
    IFFT_OUT: {
      type: DataTypes.STRING,
    },
    LS_VISIT: {
      type: DataTypes.STRING,
    },
    BM_VISIT: {
      type: DataTypes.STRING,
    },
    DAILY_ENT: {
      type: DataTypes.STRING,
    },
    FEED_ENT: {
      type: DataTypes.STRING,
    },
    MORT_ENT: {
      type: DataTypes.STRING,
    },
    BWT_ENT: {
      type: DataTypes.STRING,
    },
    MED_ENT: {
      type: DataTypes.STRING,
    },
    REMARKS: {
      type: DataTypes.TEXT,
    },
    DATE: {
      type: DataTypes.DATEONLY,
    },
    AgentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "AuditLeadRemark",
    tableName: "audit_lead_remarks",
  }
);

Employee.hasMany(AuditLeadRemark, {
  foreignKey: "AgentId",
  as: "AgentAuditUpdate",
});
AuditLeadRemark.belongsTo(Employee, { foreignKey: "AgentId", as: "Agent" });

AuditLleadDetail.hasMany(AuditLeadRemark, {
  foreignKey: "Lot_Number",
  as: "AuditRemarks",
});
AuditLeadRemark.belongsTo(AuditLleadDetail, { foreignKey: "Lot_Number" });

module.exports = AuditLeadRemark;
