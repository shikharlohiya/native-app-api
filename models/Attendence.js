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
  AttendanceInTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  AttendanceOutTime: {
    type: DataTypes.DATE,
    allowNull: true
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
  },
  
  AttendanceOutLatitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },

 AttendanceOutLongitude: {
  type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },


  AttendanceOut: {
    type: DataTypes.ENUM('OUT'),
    allowNull: true
  },
}, {
  sequelize,
  modelName: 'Attendance',
  tableName: 'attendances',
  timestamps: true
});

module.exports = Attendance;