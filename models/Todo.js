

const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');
const State = require('./state');

class Todo_BDM extends Model {}

Todo_BDM.init(
  {
    leadId: {
      type: DataTypes.STRING(6),
      primaryKey: true, // Set CityId as the primary key
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    customer_mobile_number: { 
        type: DataTypes.STRING(1),
        allowNull: false,
      },

    ho_task_done: {
      type: DataTypes.STRING(4),
      allowNull: false,
      references: {
        model: State,
        key: 'StateCode',
      },
    },
   
    


  },
  {
    sequelize,
    modelName: 'city',
    tableName: 'city_table',
    timestamps: false,
  }
);

// Define the association
Todo_BDM.belongsTo(State, { foreignKey: 'StateCode' });

module.exports = City;
