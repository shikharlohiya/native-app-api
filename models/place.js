const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');
const City = require('./city');

class Place extends Model {}

Place.init(
  {
    PlaceId: {
      type: DataTypes.STRING(10),
      primaryKey: true,
    },
    PlaceName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    CityId: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: City,
        key: 'CityId',
      },
    },
    PINCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    Deleted: {
      type: DataTypes.STRING(1),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'place',
    tableName: 'place_table',
    timestamps: false,
  }
);

Place.belongsTo(City, { foreignKey: 'CityId' });

module.exports = Place;