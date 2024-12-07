const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const BiBrooding = require("./BiBrooding");

class BroodingRemark extends Model {}

BroodingRemark.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    BROODING_TYPE: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    SPACE_PER_CHICK: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    HEATING_SOURCE: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    TOTAL_NO_OF_CHICKS: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    DRINKER_REQUIRED: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    NO_OF_CHICKS_PER_FEEDER: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    FEEDERS_REQUIRED: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    CURTAIN_AVAILABILITY: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    FALL_CEILING: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    DOUBLE_SIDE_CURTAIN: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    THERMOMETER: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    DRUM_BHUKHARI: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    GAS: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    TIN: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    DIESEL: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    LOT_NO: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: BiBrooding,
        key: 'LOT_NO'
      }
    }
  },
  {
    sequelize,
    modelName: "BroodingRemark",
    tableName: "brooding_remarks",
  }
);

// Establish the association
BiBrooding.hasOne(BroodingRemark, { foreignKey: 'LOT_NO' });
BroodingRemark.belongsTo(BiBrooding, { foreignKey: 'LOT_NO' });

module.exports = BroodingRemark;