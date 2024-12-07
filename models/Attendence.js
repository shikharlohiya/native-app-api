const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');

class Attendance extends Model {}

Attendance.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  EmployeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employee_table',
      key: 'EmployeeId'
    }
  },
  AttendanceType: {
    type: DataTypes.ENUM('IN', 'OUT'),
    allowNull: false
  },
  AttendanceDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  Latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  Longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Attendance',
  tableName: 'attendances',
  timestamps: true
});

module.exports = Attendance;