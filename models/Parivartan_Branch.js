const { DataTypes, Model } = require('sequelize');
const sequelize = require('./index');
const Parivartan_Region = require('./Parivartan_Region');

class Parivartan_Branch extends Model {}

Parivartan_Branch.init(
  {
    BranchCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Branch: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    RegionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      references: {
        model: Parivartan_Region,
        key: 'RegionId',
      },
    },
    Zone: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    RO: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Deleted: {
      type: DataTypes.STRING(1),
      allowNull: false,
      defaultValue: 'N',
    },
  },
  {
    sequelize,
    modelName: 'parivartan_branch',
    tableName: 'parivartan_branch',
    timestamps: false,
  }
);

// Define the relationship between Branch and Region
Parivartan_Branch.belongsTo(Parivartan_Region, { foreignKey: 'RegionId' });
Parivartan_Region.hasMany(Parivartan_Branch, { foreignKey: 'RegionId' });

module.exports = Parivartan_Branch;