// // farm_performance.js
// const { Sequelize, DataTypes, Model } = require("sequelize");
// const sequelize = require("./index");
// const FarmMaster = require("./BiDayOpMaster");

// class FarmPerformance extends Model {}

// FarmPerformance.init(
//   {
//     lot_number: {
//       type: DataTypes.STRING(50),
//       allowNull: false,
//     },
//     age: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     chicks_housed_quantity: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     mortality_quantity: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     mortality_percentage: {
//       type: DataTypes.DECIMAL(5, 2),
//       allowNull: false,
//     },
//     balance_birds: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     mort_on_date: {
//       type: DataTypes.DECIMAL(5, 2),
//       allowNull: false,
//     },
//     mort_date_1: {
//       type: DataTypes.DECIMAL(5, 2),
//       allowNull: false,
//     },
//     mort_date_2: {
//       type: DataTypes.DECIMAL(5, 2),
//       allowNull: false,
//     },
//     mort_date_3: {
//       type: DataTypes.DECIMAL(5, 2),
//       allowNull: false,
//     },
//     mort_date_4: {
//       type: DataTypes.DECIMAL(5, 2),
//       allowNull: false,
//     },
    
     
//   },
//   {
//     sequelize,
//     modelName: "bi_day_op_lot",
//     tableName: "bi_day_op_lot",
//     timestamps: true,
//     // indexes: [
//     //   {
//     //     fields: ["farm_master_id"],
//     //   },
//     //   {
//     //     unique: true,
//     //     fields: ["farm_master_id", "lot_number"],
//     //   },
//     // ],
//   }
// );

// // Define the relationship
// FarmMaster.hasMany(FarmPerformance, { foreignKey: "dayop_master_id" });
// FarmPerformance.belongsTo(FarmMaster, { foreignKey: "dayop_master_id" });

// module.exports = FarmPerformance;


const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class BiDayOpLot extends Model {}

BiDayOpLot.init(
  {
    lot_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    dayop_master_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bi_day_op_master',
        key: 'id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: "BiDayOpLot",
    tableName: "bi_day_op_lot",
    timestamps: true,
  }
);

module.exports = BiDayOpLot;