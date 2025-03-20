const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');

class RegisteredPartner extends Model {}

RegisteredPartner.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mobileNumber: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[6-9]\d{9}$/ // Indian mobile numbers start with 6, 7, 8, or 9
      }
    },
    partnerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    partnerCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    region:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'RegisteredPartner', 
    tableName: 'registered_partners',
    timestamps: true,
  }
);

module.exports = RegisteredPartner;