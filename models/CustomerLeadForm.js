const { Sequelize, DataTypes, Model } = require("sequelize");
const Campaign = require("./campaign"); // Import Campaign model
const sequelize = require("./index");
const Source = require("./Source");
class CustomerLeadForm extends Model {}

CustomerLeadForm.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    CustomerName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    ContactNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    StateName: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    location: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    CustomerMailId: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
 
    EC_Shed_Plan: {
      type: DataTypes.ENUM("Planning New EC Shed", "Open to EC Shed"),
      allowNull: false,
    },

    LandAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },

    Land_Size: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    Unit: {
      type: DataTypes.ENUM("Acres", "Beegha", "Sq.ft."),
      allowNull: true,
    },

    Electricity: {
      type: DataTypes.ENUM("Single Phase", "Three Phase"),
      allowNull: true,
    },

    WaterAvailabilty: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    ApproachableRoad: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },


    IntegrationCompany: {
        type: DataTypes.ENUM("IB Group", "Others"),
        allowNull: true,
    },
    ShedSize:{
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    CurrentShedDirection: {
        type: DataTypes.ENUM("East West", "North South"),
        allowNull: true,

    },
    ElectricityPhase:{
        type: DataTypes.ENUM("Single Phase", "Three Phase"),
        allowNull: true,
    },
    CurrentBirdCapacity:{
        type: DataTypes.INTEGER(50)
    },


    Investment_Budget: {
      type: DataTypes.ENUM(
        "Upto 50 lacs",
        "Between 50 lacs to 1 Cr",
        "Between 1Cr to 1.50 Cr",
        "Between 1.50Cr to 2Cr",
        "Above 2 Cr"
      ),
      allowNull: false,
    },
    NUmberOfShed: {
      type: DataTypes.INTEGER(2),
    },
    Source: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    Remark: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },

    otherLocation:{
        type: DataTypes.STRING(80),
        allowNull: true,
    },
    Project:{
        type: DataTypes.STRING(80),
        allowNull: true,
    },
    WhatsAppNumber:{
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    sourceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'source_table',
        key: 'SourceId'
      }
    },
    extra_field4:{
        type: DataTypes.STRING(80),
        allowNull: true,
    },

  },
  

  {
    sequelize, // We need to pass the connection instance
    modelName: "CustomerLeadForm", // We need to choose the model name
    tableName: "customer_lead_form",
    timestamps: true,
  }
);
CustomerLeadForm.belongsTo(Source, {
  foreignKey: 'sourceId',
  as: 'sourceDetails'
});



module.exports = CustomerLeadForm;
