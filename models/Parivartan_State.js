// models/parivartan_state.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('./index');

class Parivartan_State extends Model {}

Parivartan_State.init(
  {
    StateId: {
      type: DataTypes.STRING(100),
      primaryKey: true,
    },
    StateName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    Deleted: {
      type: DataTypes.STRING(1),
      allowNull: false,
      defaultValue: 'N',
    },
  },
  {
    sequelize,
    modelName: 'parivartan_state',
    tableName: 'parivartan_state',
    timestamps: false,
  }
);

module.exports = Parivartan_State;