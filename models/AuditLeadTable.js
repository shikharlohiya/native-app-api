const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class AuditLeadTable extends Model {}

AuditLeadTable.init(
  {
    Zone_Name: {
      type: DataTypes.STRING,
    },
    Branch_Name: {
      type: DataTypes.STRING,
    },
    Lot_Number: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true, // Set Lot_Number as the primary key
    },
    Vendor: {
      type: DataTypes.STRING,
    },
    Shed_Type: {
      type: DataTypes.STRING,
    },
    Farmer_Name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Placed_Qty: {
      type: DataTypes.STRING,
    },
    Hatch_Date: {
      type: DataTypes.STRING,
    },
    CA: {
      type: DataTypes.STRING,
    },
    Age_SAP: {
      type: DataTypes.STRING,
    },
    Diff: {
      type: DataTypes.STRING,
    },
    first_Week_M: {
      type: DataTypes.STRING,
    },

    First_Week_Mortality_Percentage: {
      type: DataTypes.STRING,
    },
    Total_Mortality: {
      type: DataTypes.STRING,
    },
    Total_Mortality_Percentage: {
      type: DataTypes.STRING,
    },
    Lifting_EA: {
      type: DataTypes.STRING,
    },
    Lift_Percentage: {
      type: DataTypes.STRING,
    },
    Avg_Lift_Wt: {
      type: DataTypes.STRING,
    },
    Bal_Birds: {
      type: DataTypes.STRING,
    },
    ABWT: {
      type: DataTypes.STRING,
    },
    BWT_Age: {
      type: DataTypes.STRING,
    },
    Feed_Cons: {
      type: DataTypes.STRING,
    },
    Prev_Grade: {
      type: DataTypes.STRING,
    },
    FCR: {
      type: DataTypes.STRING,
    },
    Mobile: {
      type: DataTypes.STRING(20),
    },
    Line: {
      type: DataTypes.STRING,
    },
    Hatchery_Name: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM("open", "working", "closed"),
      defaultValue: "open",
      allowNull: false,
    },
    last_action_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    extra_feild1: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    extra_feild2: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    extra_feild3: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "AuditLeadDetail",
    tableName: "audit_lead_table",
  }
);

module.exports = AuditLeadTable;
