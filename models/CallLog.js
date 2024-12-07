const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class CallLog extends Model {}

CallLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    serviceType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    callId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dni: {
      type: DataTypes.STRING,
    },
    aPartyNo: {
      type: DataTypes.STRING,
    },
    callStartTime: {
      type: DataTypes.DATE,
    },
    aPartyDialStartTime: {
      type: DataTypes.DATE,
    },
    aPartyDialEndTime: {
      type: DataTypes.DATE,
    },
    aPartyConnectedTime: {
      type: DataTypes.DATE,
    },
    aDialStatus: {
      type: DataTypes.STRING,
    },
    aPartyEndTime: {
      type: DataTypes.DATE,
    },
    aPartyReleaseReason: {
      type: DataTypes.STRING,
    },
    bPartyNo: {
      type: DataTypes.STRING,
    },
    bPartyDialStartTime: {
      type: DataTypes.DATE,
    },
    bPartyDialEndTime: {
      type: DataTypes.DATE,
    },
    bPartyConnectedTime: {
      type: DataTypes.DATE,
    },
    bPartyEndTime: {
      type: DataTypes.DATE,
    },
    bPartyReleaseReason: {
      type: DataTypes.STRING,
    },
    bDialStatus: {
      type: DataTypes.STRING,
    },
    cPartyNo: {
      type: DataTypes.STRING,
    },
    cPartyDialStartTime: {
      type: DataTypes.DATE,
    },
    cPartyDialEndTime: {
      type: DataTypes.DATE,
    },
    cPartyConnectedTime: {
      type: DataTypes.DATE,
    },
    cPartyEndTime: {
      type: DataTypes.DATE,
    },
    cPartyReleaseReason: {
      type: DataTypes.STRING,
    },
    cDialStatus: {
      type: DataTypes.STRING,
    },
    refId: {
      type: DataTypes.STRING,
    },
    recordVoice: {
      type: DataTypes.STRING,
    },
    disconnectedBy: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: "CallLog",
    tableName: "call_logs",
    timestamps: true,
  }
);

module.exports = CallLog;