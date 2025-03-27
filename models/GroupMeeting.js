const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const Employee = require("./employee");

class GroupMeeting extends Model {}

GroupMeeting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    group_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // unique: true,
    },
    group_meeting_title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    is_unique: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    action_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      
    },
    bdm_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    meeting_location:{
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nearest_branch:{
      type: DataTypes.STRING(255),
      allowNull: false,
    }
    
  },
  {
    sequelize,
    modelName: "GroupMeeting",
    tableName: "group_meetings",
    timestamps: true,
  }
);

// Define relationships
// GroupMeeting.belongsTo(Employee, { foreignKey: "bdm_id", as: "BDM" });

module.exports = GroupMeeting;