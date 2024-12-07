const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index"); // Adjust this path to your Sequelize instance

class IncomingCall extends Model {}

IncomingCall.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    callId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    event: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ivrNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    callerNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    agentNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    connectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
 
  },
  {
    sequelize,
    modelName: "IncomingCall",
    tableName: "incoming_calls",
    timestamps: true,
    underscored: true,
  }
);

module.exports = IncomingCall;