const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');

class ShrimpFeedMaster extends Model {}

ShrimpFeedMaster.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  feedType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mobileNo: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  district: {
    type: DataTypes.STRING,
    allowNull: true
  },
  postalCode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  farmerVillage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  region: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shrimpZone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dealerCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dealerName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dealerType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  enteredBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  latitudeValue: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitudeValue: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  prospectFarmerInd: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  employeeCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  feedGodownCapacity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  zone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  farmerType: {
    type: DataTypes.ENUM('Old', 'New'),
    allowNull: true
  },
  lastActionDate:{
    type: DataTypes.STRING,
    allowNull: true
  },
  status:{
    type: DataTypes.STRING,
    allowNull: true
  }

}, {
  sequelize,
  modelName: 'shrimp_feed_master',
  tableName: 'shrimp_feed_master',
  timestamps: true, // This will add createdAt and updatedAt fields
  indexes: [
    {
      fields: ['mobileNo']
    },
    {
      fields: ['dealerCode']
    },
    {
      fields: ['employeeCode']
    }
  ]
});

// Remove the association here - we'll define it in a separate associations file
module.exports = ShrimpFeedMaster;

