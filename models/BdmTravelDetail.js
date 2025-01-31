const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');

class BdmTravelDetail extends Model {}

BdmTravelDetail.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bdm_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employee_table',
      key: 'EmployeeId'
    }
  },
  leaddetail_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'lead_detail',
      key: 'id'
    }
  },
  attendance_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'attendances',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
 
  checkin_latitude: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  checkin_longitude: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  checkout_latitude: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  checkout_longitude: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  checkin_time: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.NOW
  },
  checkout_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
//   action: {
//    type: DataTypes.STRING(100),
//    allowNull: false
//  },


bdm_lead_action_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
  references: {
    model: 'bdm_lead_actions',
    key: 'id'
  }
},
 extrafield1: {
  type: DataTypes.STRING(100),
  allowNull: true
},
extrafield2: {
 type: DataTypes.STRING(100),
 allowNull: true
},
extrafield3: {
 type: DataTypes.STRING(100),
 allowNull: true
},
 
 
}, {
  sequelize,
  modelName: 'BdmTravelDetail',
  tableName: 'bdm_travel_details',
  timestamps: true
});

module.exports = BdmTravelDetail;