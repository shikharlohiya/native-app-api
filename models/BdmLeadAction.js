const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const lead_detail = require('./lead_detail')

class BdmLeadAction extends Model {}

BdmLeadAction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    LeadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "lead_detail",
        key: "id",
      },
    },
    BDMId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employee_table",
        key: "EmployeeId",
      },
    },
    task_type: {
      type: DataTypes.ENUM("HO_task", "self_task", "other_task"),
      allowNull: false,
    },
    action_type: {
      type: DataTypes.ENUM("confirm", "postpone"),
      allowNull: true,
    },
    specific_action: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    new_follow_up_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.STRING(1500),
      allowNull: true,
    },
    action_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    task_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    completion_status: {
      type: DataTypes.ENUM("completed", "not_completed"),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "BdmLeadAction",
    tableName: "bdm_lead_actions",
    timestamps: true,
  }
);

lead_detail.hasMany(BdmLeadAction, {
    foreignKey: "LeadId",
    as: 'BdmActions'
  });
  
  BdmLeadAction.belongsTo(lead_detail, {
    foreignKey: "LeadId",
    as: 'Lead'  // Use 'Lead' as the alias
  });

module.exports = BdmLeadAction;
