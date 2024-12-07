const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class Campaign extends Model {}

Campaign.init(
  {
    CampaignId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    CampaignName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Campaign",
    tableName: "campaign_table",
    timestamps: false,
  }
);



module.exports = Campaign;
