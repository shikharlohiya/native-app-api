const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');
const Country = require('./country');

class State extends Model {}

State.init(
  {
    StateCode: {
        type: DataTypes.STRING(4),
        primaryKey: true, // Set CountryCode as the primary key
      },

    StateName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    CountryCode: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
  },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'State', // We need to choose the model name
    tableName: 'state_table',
    timestamps: false,
  }
);

// Define the association
//  State.belongsTo(Country, { foreignKey: 'CountryCode' });

module.exports = State;