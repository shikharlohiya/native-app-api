const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index"); // Adjust this path to your Sequelize instance

class PostCallData extends Model {}

PostCallData.init(
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
    callStartTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    callEndTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dtmf: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ogStartTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ogEndTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ogCallStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    agentNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    totalCallDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    voiceRecording: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isOutGoingDone: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "PostCallData",
    tableName: "post_call_data",
    timestamps: true,
    underscored: true,
  }
);

module.exports = PostCallData;