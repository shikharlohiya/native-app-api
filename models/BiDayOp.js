// const { Sequelize, DataTypes, Model } = require("sequelize");
// const sequelize = require("./index");

// class BiDayOp extends Model {}

// BiDayOp.init(
//   {
//     Branch: {
//       type: DataTypes.STRING,
//     },
//     Branch_Description: {
//       type: DataTypes.STRING,
//     },
//     Farm_Name: {
//       type: DataTypes.STRING,
//     },
//     Farmer_Mob: {
//       type: DataTypes.STRING,
//     },
//     Lot_Number: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       primaryKey: true,
//     },
//     Age: {
//       type: DataTypes.INTEGER,
//     },
//     Chicks_Housed_Quantity: {
//       type: DataTypes.INTEGER,
//     },
//     Mortality_Quantity: {
//       type: DataTypes.INTEGER,
//     },
//     Mortality_Percentage: {
//       type: DataTypes.FLOAT,
//     },
//     Balance_Birds: {
//       type: DataTypes.INTEGER,
//     },
//     Mort_Percentage_On_Date: {
//       type: DataTypes.FLOAT,
//     },
//     Mort_Percentage_Date_1: {
//       type: DataTypes.FLOAT,
//     },
//     Mort_Percentage_Date_2: {
//       type: DataTypes.FLOAT,
//     },
//     Mort_Percentage_Date_3: {
//       type: DataTypes.FLOAT,
//     },
//     Mort_Percentage_Date_4: {
//       type: DataTypes.FLOAT,
//     },
//     status: {
//       type: DataTypes.ENUM("open", "working", "closed"),
//       defaultValue: "open",
//       allowNull: false,
//     },
//     last_action_date: {
//       type: DataTypes.DATE,
//       allowNull: true,
//     },
//   },
//   {
//     sequelize,
//     modelName: "bi_day_op",
//     tableName: "bi_day_op",
//   }
// );

// module.exports = BiDayOp;





const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class BiDayOp extends Model {}

BiDayOp.init(
  {
    Branch_Name: {
      type: DataTypes.STRING,
    },
    Branch_Code: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    Farm_Code: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    Branch_Description: {
      type: DataTypes.STRING,
    },
    Farm_Name: {
      type: DataTypes.STRING,
    },
    Farmer_Mob: {
      type: DataTypes.STRING,
    },
    Lot_Number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Age: {
      type: DataTypes.INTEGER,
    },
    Chicks_Housed_Quantity: {
      type: DataTypes.INTEGER,
    },
    Mortality_Quantity: {
      type: DataTypes.INTEGER,
    },
    Mortality_Percentage: {
      type: DataTypes.FLOAT,
    },
    Balance_Birds: {
      type: DataTypes.INTEGER,
    },
    Mort_Percentage_On_Date: {
      type: DataTypes.FLOAT,
    },
    Mort_Percentage_Date_1: {
      type: DataTypes.FLOAT,
    },
    Mort_Percentage_Date_2: {
      type: DataTypes.FLOAT,
    },
    Mort_Percentage_Date_3: {
      type: DataTypes.FLOAT,
    },
    Mort_Percentage_Date_4: {
      type: DataTypes.FLOAT,
    },
    status: {
      type: DataTypes.ENUM("open", "working", "closed"),
      defaultValue: "open",
      allowNull: false,
    },
    last_action_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "bi_day_op",
    tableName: "bi_day_op",
  }
);

module.exports = BiDayOp;