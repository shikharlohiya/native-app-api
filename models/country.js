const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');

class Country extends Model {}

Country.init(
  {
    // Model attributes are defined here
    CountryCode: {
        type: DataTypes.STRING(2),
        primaryKey: true, // Set CountryCode as the primary key
      },

     CountryName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: false,
    modelName: 'Country', // We need to choose the model name
    tableName: 'country_table'
  },
);

// the defined model is the class itself
 
module.exports = Country;