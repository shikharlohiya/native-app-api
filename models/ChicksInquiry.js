const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class ChicksInquiry extends Model {}

ChicksInquiry.init(
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
 
    Occupation: {
        type: DataTypes.STRING(20),
        allowNull: false,
      allowNull: true,
    },

    chicks_range:{
        type: DataTypes.STRING(20),
        allowNull: false,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: "ChicksInquiry",
    tableName: "chicks_inquiry",
    timestamps: true,
  }
);

module.exports = ChicksInquiry;