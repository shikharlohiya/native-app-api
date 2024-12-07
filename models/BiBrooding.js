const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class BiBrooding extends Model {}

BiBrooding.init(
  {
    S_NO: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ZONE: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    REGION: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    BRANCH: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    LOT_NO: {
      type: DataTypes.STRING,
    },
    FARMER_NAME: {
      type: DataTypes.STRING,
      allowNull: false,
    },
      
    AGE: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    SHED_TYPE: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    CHICKS_PLANNED_HOUSED: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    FARMER_CONTACT_NO: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    LOT_STATUS: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'working', 'closed'),
      defaultValue: 'open',
    },
 
 
  },
  {
    sequelize,
    modelName: "BiBrooding",
    tableName: "bi_brooding",
  }
);

module.exports = BiBrooding;