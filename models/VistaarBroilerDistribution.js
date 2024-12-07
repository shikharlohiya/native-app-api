const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class VistaarBroilerDistribution extends Model {}

VistaarBroilerDistribution.init(
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
    MobileNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    whatsappNo: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
    Pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    StateName: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    Location: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    CurrentProfession: {
      type: DataTypes.ENUM("Service", "Business", "Others"),
      allowNull: false,
    },
    InterestedState: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

    InterestedCity: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    PreviousExposure: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    SourceOfInformation: {
      type: DataTypes.ENUM(
        "Social Media",
        "Employee Referral",
        "Vistaar Team",
        "Offline Market",
        "Others"
      ),
      allowNull: true,
    },

    OtherLocation:{
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    extrafield2:{
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    extrafield3:{
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    extrafield4:{
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    
  },
  {
    sequelize,
    modelName: "VistaarBroilerDistribution",
    tableName: "vistaar_broiler_distribution",
    timestamps: true,
  }
);

module.exports = VistaarBroilerDistribution;