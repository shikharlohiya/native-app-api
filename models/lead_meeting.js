const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');
const Lead_Detail = require('./lead_detail');

class lead_Meeting extends Model {}

lead_Meeting.init(
  {
    // Model attributes are defined here
 

    BirdsCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,

    },
    LandDimension: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ShedSize: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    IsLandDirectionEastWest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    DirectionDeviationDegree: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
    },
    ElectricityPower: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Water: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    ApproachRoad: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    ModelType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    EstimationRequirement: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Image: {
      type: DataTypes.JSON,
    },
    category : {
      type: DataTypes.STRING,
    },
    sub_category :{
      type: DataTypes.STRING,
    },
    closure_month : {
      type: DataTypes.STRING,
    },
    follow_up_date :{
      type: DataTypes.STRING,
    },
    ActionType:{
      type: DataTypes.STRING,
    },
    LeadDetailId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    BDMId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    remark: {
      type: DataTypes.STRING,
    },
    extra_field3: {
      type: DataTypes.STRING,
    },
    

  },
  {
    sequelize,
    modelName: 'lead_Meeting',
    tableName: 'lead_meeting',
  }
);

Lead_Detail.hasMany(lead_Meeting, { foreignKey: 'LeadDetailId', as: 'lead_meetings' });
lead_Meeting.belongsTo(Lead_Detail, { foreignKey: 'LeadDetailId' });

module.exports = lead_Meeting;