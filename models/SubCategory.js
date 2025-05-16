// models/SubCategory.js
const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");
const Category = require("./Category");

class SubCategory extends Model {}

SubCategory.init(
  {
    SubCategoryId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    SubCategoryName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    Priority: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    PriorityColor: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    Deleted: {
      type: DataTypes.STRING(1),
      allowNull: false,
      defaultValue: "N",
    },
    CategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Category,
        key: "CategoryId",
      },
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    UpdatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    sequelize,
    modelName: "subcategory",
    tableName: "subcategory_table",
    timestamps: false, // We're handling timestamps manually
  }
);

// Define the association
SubCategory.belongsTo(Category, { foreignKey: "CategoryId" });
Category.hasMany(SubCategory, { foreignKey: "CategoryId" });

module.exports = SubCategory;