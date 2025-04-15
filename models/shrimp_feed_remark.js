const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');

class ShrimpFeedRemark extends Model {}

ShrimpFeedRemark.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  prospectFarmerCategory: {
    type: DataTypes.ENUM('Modern', 'Traditional', 'Both'),
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mobileNumber: {
    type: DataTypes.STRING(15),
    allowNull: false,
    references: {
      model: 'shrimp_feed_master',
      key: 'mobileNo'
    }
  },
  pondLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  district: {
    type: DataTypes.STRING,
    allowNull: true
  },
  postalCode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fishSpecies: {
    type: DataTypes.STRING,
    allowNull: true
  },
  numberOfPonds: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  pondAreaInAcres: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  currentFeedUsed: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isStocking: {
    type: DataTypes.ENUM('Yes', 'No'),
    allowNull: true
  },
  stockingDensity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  daysOfCulture: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isHarvesting: {
    type: DataTypes.ENUM('Yes', 'No'),
    allowNull: true
  },
  harvestingQuantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  potentialityInMT: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Feed consumption in culture period (Tentative in MT)'
  },
  status: {
    type: DataTypes.ENUM('Open', 'Close', 'In Process'),
    allowNull: true,
    defaultValue: 'Open'
  },
  followUpDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  purpose: {
    type: DataTypes.ENUM(
      'Feed Requirement',
      'Technical Service',
      'Feed Issue',
      'Service Issue',
      'Dealership Enquiry'
    ),
    allowNull: true
  },

  agentRemarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  callId:{
    type: DataTypes.STRING,
    allowNull: true,

  },
  callType:{
    type: DataTypes.STRING,
    allowNull: true,

  },


}, {
  sequelize,
  modelName: 'shrimp_feed_remark',
  tableName: 'shrimp_feed_remarks',
  timestamps: true,
  indexes: [
    {
      fields: ['mobileNumber']
    },
    {
      fields: ['status']
    },
    {
      fields: ['followUpDate']
    }
  ]
});

// Remove the associations here - we'll define them in a separate associations file
module.exports = ShrimpFeedRemark;

