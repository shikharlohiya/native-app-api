


const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const BiDayOpLot = require("./BiDayOpLot");
class BiDayOpLotHistory extends Model {}

BiDayOpLotHistory.init(
  {
    lot_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bi_day_op_lot',
        key: 'id'
      }
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    chicks_housed_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mortality_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mortality_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    balance_birds: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mort_on_date: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    mort_date_1: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    mort_date_2: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    mort_date_3: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    mort_date_4: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    }
  },
  {
    sequelize,
    modelName: "BiDayOpLotHistory",
    tableName: "bi_day_op_lot_history",
    timestamps: true,
  }
);

// Define relationships
BiDayOpLot.hasMany(BiDayOpLotHistory, { foreignKey: 'lot_id' });
BiDayOpLotHistory.belongsTo(BiDayOpLot, { foreignKey: 'lot_id' });

module.exports = BiDayOpLotHistory;