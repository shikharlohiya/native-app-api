const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const Employee = require('./employee'); 

class AuditNewFarmer extends Model {}

AuditNewFarmer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Agent relationship - matching Employee table's EmployeeId
    AgentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'employee_table',
        key: 'EmployeeId'
      }
    },
    // Fields from Old type
    ABWT: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Avg_Lift_Wt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Total_Mortality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    first_Week_M: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Fields from New type
    Shed_Type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    branch_Name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    previousCompanyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    previousPoultryExperience: {
      type: DataTypes.ENUM('Yes', 'No'),
      allowNull: true,
    },
    // Common fields between both types
    Mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    Zone_Name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    farmer_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    followUpBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    follow_up_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Open'
    },
    type: {
      type: DataTypes.ENUM('old', 'new'),
      allowNull: false,
    },
    user_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'farmer'
    },
    // Extra fields for future use
    call_id: {
      type: DataTypes.STRING,
      allowNull: true,  
    },
    Lot_Number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    call_type : {
      type: DataTypes.STRING(45),
      allowNull: true,  
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    }
  },
  {
    sequelize,
    modelName: "AuditNewFarmer",
    tableName: "audit_new_farmer",
    timestamps: true,
  }
);

// Define the relationship with Employee model
AuditNewFarmer.belongsTo(Employee, {   // Don't use require() here
  foreignKey: 'AgentId',
  targetKey: 'EmployeeId',
  as: 'agent'
});
module.exports = AuditNewFarmer;