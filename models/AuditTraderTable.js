const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');

class AuditTraderTable extends Model {}

AuditTraderTable.init(
  {
    CustomerID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
 
    City: {
      type: DataTypes.STRING,
    },
    Name: {
      type: DataTypes.STRING,
    },
    Region: {
      type: DataTypes.STRING,
    },
    RegionName: {
      type: DataTypes.STRING,
    },
    Telephone1: {
      type: DataTypes.STRING,
    },
    CentralOrderBlock: {
      type: DataTypes.STRING,
    },
    OrderBlockForSalesArea: {
      type: DataTypes.STRING,
    },
    CentralDeliveryBlock: {
      type: DataTypes.STRING,
    },
    DeliveryBlockForSalesArea: {
      type: DataTypes.STRING,
    },
    CentralBillingBlock: {
      type: DataTypes.STRING,
    },
    BillingBlockForSalesArea: {
      type: DataTypes.STRING,
    },
    DelIndicatorForSalesArea: {
      type: DataTypes.STRING,
    },
    IncotermsPartTwo: {
      type: DataTypes.STRING,
    },
    PayTermDesc: {
      type: DataTypes.STRING,
    },
    CreationDate: {
      type: DataTypes.STRING,
    },
    GSTNumber: {
      type: DataTypes.STRING,
    },
    PANNo: {
      type: DataTypes.STRING,
    },
    Group2Name: {
      type: DataTypes.STRING,
    },
    AadharNo: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: 'AuditTraderTable',
    tableName: 'audit_trader_table',
  }
);

module.exports = AuditTraderTable;