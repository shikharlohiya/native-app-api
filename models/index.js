const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  }
);

try {
  sequelize.authenticate();
  console.log("connection has been establised succesfully");
} catch (error) {
  console.error("unable to connect to the data base", error);
}

module.exports = sequelize;
