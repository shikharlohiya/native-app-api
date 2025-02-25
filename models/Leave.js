const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');
const Employee = require('./employee');

class Leave extends Model {}

Leave.init({
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
  LeaveType: {
    type: DataTypes.ENUM('PAID_LEAVE', 'REGIONAL_HOLIDAY', 'SICK_LEAVE', 'UNPAID_LEAVE'),
    allowNull: false
  },
  StartDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  EndDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  Remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Status: {
  //   type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
  //   allowNull: false,
  //   defaultValue: 'PENDING'
  // }
}, {
  sequelize,
  modelName: 'Leave',
  tableName: 'leaves',
  timestamps: true
});

Employee.hasMany(Leave, {
  foreignKey: 'EmployeeId',
  as: 'Leaves'
});

Leave.belongsTo(Employee, {
  foreignKey: 'EmployeeId',
  as: 'Employee'
});

module.exports = Leave;