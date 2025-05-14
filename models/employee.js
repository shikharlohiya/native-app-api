const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class Employee extends Model {
  static associate(models) {
    Employee.belongsTo(models.Employee_Role, {
      foreignKey: "EmployeeRoleID",
      as: "role",
    });
  }
}

Employee.init(
  {
    EmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    EmployeePhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    EmployeeName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    EmployeeRoleID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Employee_Role",
        key: "RoleId",
      },
    },
    EmployeePassword: {
      type: DataTypes.STRING,
    },
    EmployeeMailId: {
      type: DataTypes.STRING(100),
    },
    EmployeeRegion: {
      type: DataTypes.STRING(1500),
    },
    fcmToken: {               
      type: DataTypes.STRING(255),
      allowNull: true,        
      comment: "Firebase Cloud Messaging token for push notifications"
    },
    sessionId: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: "Unique session identifier for single device login"
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: "Indicates if the employee account is active"
    }
  
  },
  {
    sequelize,
    modelName: "Employee",
    tableName: "employee_table",
    timestamps: false,
  }
);


module.exports = Employee;
