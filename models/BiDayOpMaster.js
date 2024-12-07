// farm_master.js
const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class FarmMaster extends Model {}

FarmMaster.init(
  {
    zone: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    branch_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    branch_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    farm_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    branch_description: {
      type: DataTypes.STRING(250),
    },
    farm_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    farmer_mob: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    
  },
  {
    sequelize,
    modelName: "bi_day_op_master",
    tableName: "bi_day_op_master",
    timestamps: true,
    // indexes: [
    //   {
    //     unique: true,
    //     fields: ["zone", "region", "branch_code", "farm_code", "farmer_mob"],
    //   },
    // ],
  }
);

module.exports = FarmMaster;