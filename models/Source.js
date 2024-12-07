const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const campaign = require("./campaign")

class Source extends Model {}

Source.init(
  {
    SourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    SourceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    campaignId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: campaign,
          key: 'campaignId',
        },
      },
      is_active: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        allowNull: true,
      },
  },
  {
    sequelize,
    modelName: "source",
    tableName: "source_table",
    timestamps: false,
  }
);


// Add Source associations
Source.belongsTo(campaign, { 
    foreignKey: 'campaignId' 
});
campaign.hasMany(Source, { 
    foreignKey: 'campaignId' 
  });

module.exports = Source;
