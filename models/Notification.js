const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const Lead_Detail = require("./lead_detail");

class Notification extends Model {
  static associate(models) {
    Notification.belongsTo(models.Employee, {
      foreignKey: "employeeId",
      as: "employee",
    });
    
    Notification.belongsTo(models.LeadDetail, {
      foreignKey: "leadDetailId",
      as: "leadDetail",
    });
  }
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employee_table",
        key: "EmployeeId",
      },
    },
    text: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    leadDetailId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "lead_detail",
        key: "id",
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "notifications",
    timestamps: true,
  }
);



Notification.belongsTo(Lead_Detail, {
 foreignKey: 'leadDetailId',
 as: 'leadDetail'
});

module.exports = Notification;