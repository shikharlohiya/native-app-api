
const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');
const Lead_Detail = require('./lead_detail');
const Employee = require('./employee');

class OnCallDiscussionByBdm extends Model {}

OnCallDiscussionByBdm.init(
  {
    follow_up_date: {
      type: DataTypes.DATE,
    },
    category: {
      type: DataTypes.STRING(20),
    },
    sub_category: {
      type: DataTypes.STRING(20),
    },
    remark: {
      type: DataTypes.STRING(250),
    },
    closure_month: {
      type: DataTypes.STRING(20),
    },
    extra_field1: {
        type: DataTypes.STRING,
      },
      extra_field2: {
        type: DataTypes.STRING,
      },
      extra_field3: {
        type: DataTypes.STRING,
      },
      BDMId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      LeadDetailId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
  },
  {
    sequelize,
    modelName: 'OnCallDiscussionByBdm',
    tableName: 'on_call_disscusion_by_bdm',
    timestamps: true,
    
  }
);

 


OnCallDiscussionByBdm.belongsTo(Lead_Detail, { 
  foreignKey: 'LeadDetailId',
  as: 'LeadDetail'
});


// Lead_Detail.hasMany(OnCallDiscussionByBdm, { foreignKey: 'LeadDetailId' });
// OnCallDiscussionByBdm.belongsTo(Lead_Detail, { foreignKey: 'LeadDetailId' });


Employee.hasMany(OnCallDiscussionByBdm, { foreignKey: 'BDMId',as: 'BDM'  });
OnCallDiscussionByBdm.belongsTo(Employee, { foreignKey: 'BDMId',as: 'BDM'});




module.exports = OnCallDiscussionByBdm;
