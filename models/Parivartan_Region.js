const { DataTypes, Model } = require('sequelize');
const sequelize = require('./index');
const Parivartan_State = require('./Parivartan_State');

class Parivartan_Region extends Model {}

Parivartan_Region.init(
  {
    RegionId: {
      type: DataTypes.STRING(100),
      primaryKey: true,
    },
    RegionName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    StateId: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: Parivartan_State,
        key: 'StateId',
      },
    },
    Deleted: {
      type: DataTypes.STRING(1),
      allowNull: false,
      defaultValue: 'N',
    },
  },
  {
    sequelize,
    modelName: 'parivartan_region',
    tableName: 'parivartan_region',
    timestamps: false,
  }
);

Parivartan_Region.belongsTo(Parivartan_State, { foreignKey: 'StateId' });
Parivartan_State.hasMany(Parivartan_Region, { foreignKey: 'StateId' });

module.exports = Parivartan_Region;