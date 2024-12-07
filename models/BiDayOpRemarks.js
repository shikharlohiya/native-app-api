 

const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class BiDayOpRemarks extends Model {
  // static associate(models) {
  //   // Association with BiDayOpLotHistory
  //   BiDayOpRemarks.belongsTo(models.BiDayOpLotHistory, {
  //     foreignKey: "lot_history_id",
  //     as: "lotHistory"
  //   });
  // }
}

BiDayOpRemarks.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lot_history_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'BiDayOpLotHistory',
        key: 'id'
      }
    },
  
    medicine_type: {
      type: DataTypes.JSON,
    },
    
    disease_name: {
      type: DataTypes.JSON,
    },
    medicine_with_dose: {
      type: DataTypes.JSON,
    },
    Remarks: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Follow_up_date: {
      type: DataTypes.DATE
    },
    AgentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    sequelize,
    modelName: "BiDayOpRemarks",
    tableName: "bi_day_op_remarks",
    timestamps: true,
  }
);

module.exports = BiDayOpRemarks;