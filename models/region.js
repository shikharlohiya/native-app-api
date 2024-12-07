const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');
const Zone = require('./zone'); // Import the Zone model
const State  = require('./state');

class Region extends Model {}
  
Region.init(
  {
    // Model attributes are defined here
    // RegionId: {
    //     type: DataTypes.STRING,
    //     primaryKey: true, // Set CountryCode as the primary key
    //   },

    
      stateCode:{
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'state_table',
          key: 'StateCode',
        },   
      },
      StateName: {
        type: DataTypes.STRING,
      },

    RegionName: {
      type: DataTypes.STRING,
    },
    BDMName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      BDMMailId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      BDMEmployeeId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
  },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'region', // We need to choose the model name
    tableName: 'region_table',
    timestamps: false,
  }
);

State.hasMany(Region, { foreignKey: 'stateCode' });
Region.belongsTo(State, { foreignKey: 'stateCode' });

// Define the association

module.exports = Region;