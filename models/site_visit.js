const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const Lead_Detail = require("./lead_detail");

class site_visit extends Model {}

site_visit.init(
  {
    // Model attributes are defined here

    BirdsCapacity: {
      type: DataTypes.STRING,
    },
    LandDimension: {
      type: DataTypes.STRING,
    },
    ShedSize: {
      type: DataTypes.STRING,
    },
    IsLandDirectionEastWest: {
      type: DataTypes.BOOLEAN,
    },
    DirectionDeviationDegree: {
      type: DataTypes.STRING,
    },
    ElectricityPower: {
      type: DataTypes.BOOLEAN,
    },
    Water: {
      type: DataTypes.BOOLEAN,
    },
    ApproachRoad: {
      type: DataTypes.BOOLEAN,
    },
    ModelType: {
      type: DataTypes.STRING,
    },
    EstimationRequirement: {
      type: DataTypes.BOOLEAN,
    },
    Image: {
      type: DataTypes.JSON,
    },
    category: {
      type: DataTypes.STRING,
    },
    sub_category: {
      type: DataTypes.STRING,
    },
    closure_month: {
      type: DataTypes.STRING,
    },
    follow_up_date: {
      type: DataTypes.DATE,
    },
    ActionType: {
      type: DataTypes.STRING,
    },
    extra_field1: {
      type: DataTypes.STRING,
    },
    extra_field2: {
      type: DataTypes.STRING,
    },
    extra_field3: {
      type: DataTypes.STRING,
    },
    extra_field4: {
      type: DataTypes.STRING,
    },
    BDMId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    remark: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: "site_visit",
    tableName: "site_visit",
  }
);
Lead_Detail.hasMany(site_visit, {
  foreignKey: "LeadDetailId",
  as: "site_visits",
});
site_visit.belongsTo(Lead_Detail, { foreignKey: "LeadDetailId" });

module.exports = site_visit;
