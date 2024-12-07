const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');
 

class Zone extends Model {}

Zone.init(
  {
    // Model attributes are defined here
    ZoneId: {
        type: DataTypes.STRING,
        primaryKey: true, // Set CountryCode as the primary key  
      },
    ZoneName: {
      type: DataTypes.STRING,
    },
    ZoneHeadEmployeeId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
  },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'zone', // We need to choose the model name
    tableName: 'zone_table',
    timestamps: false,
  }
);

// Define the association
 

module.exports = Zone;