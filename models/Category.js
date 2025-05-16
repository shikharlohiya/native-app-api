// models/Category.js
const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class Category extends Model {}

Category.init(
  {
    CategoryId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    CategoryName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    Color: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    Deleted: {
      type: DataTypes.STRING(1),
      allowNull: false,
      defaultValue: "N",
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
    modelName: "category",
    tableName: "category_table",
    timestamps: false, // We're handling timestamps manually
  }
);

module.exports = Category;