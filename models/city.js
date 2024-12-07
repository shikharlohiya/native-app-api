const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const State = require("./state");

class City extends Model {}

City.init(
  {
    CityId: {
      type: DataTypes.STRING(6),
      primaryKey: true, // Set CityId as the primary key
    },
    CityName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    Deleted: {
      type: DataTypes.STRING(1),
      allowNull: false,
    },

    StateCode: {
      type: DataTypes.STRING(4),
      allowNull: false,
      references: {
        model: State,
        key: "StateCode",
      },
    },
  },
  {
    sequelize,
    modelName: "city",
    tableName: "city_table",
    timestamps: false,
  }
);

// Define the association
City.belongsTo(State, { foreignKey: "StateCode" });

module.exports = City;
