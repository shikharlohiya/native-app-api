const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');
const Region = require('./region'); // Import the Zone model

class Area extends Model {}

Area.init(
  {
    // Model attributes are defined here
  
    AreaId: {
        type: DataTypes.INTEGER,
        primaryKey: true, 

      },
    AreaName: {
      type: DataTypes.STRING,
    },
    AreaHeadEmployeeId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
  },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'area', // We need to choose the model name
    tableName: 'area_table',
    timestamps: false,
  }
);

// Define the association
Area.belongsTo(Region, { foreignKey: 'RegionId'});
 

module.exports = Area;