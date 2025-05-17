const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class EmployeeLocation extends Model {
  static associate(models) {
    if (models.Employee) {
      EmployeeLocation.belongsTo(models.Employee, {
        foreignKey: "EmployeeId",
        targetKey: "EmployeeId",
        as: "employee",
      });
    }
  }
}

EmployeeLocation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    EmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employee_table",
        key: "EmployeeId",
      },
      index: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      validate: {
        min: -90,
        max: 90,
      },
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 7),
      allowNull: false,
      validate: {
        min: -180,
        max: 180,
      },
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    isCheckIn: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    checkInType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    checkInDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deviceInfo: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    batteryLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
  },
  {
    sequelize,
    modelName: "EmployeeLocation",
    tableName: "employee_location",
    timestamps: true,
    indexes: [
      {
        name: "idx_employee_date",
        fields: ["EmployeeId", "timestamp"],
      },
    ],
  }
);


module.exports = EmployeeLocation;