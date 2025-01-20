// const { Sequelize } = require("sequelize");
// require("dotenv").config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT,
//   }
// );

// try {
//   sequelize.authenticate();
//   console.log("connection has been establised succesfully");
// } catch (error) {
//   console.error("unable to connect to the data base", error);
// }

// module.exports = sequelize;









const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    pool: {
      max: 25,        // Conservative setting for production
      min: 5,
      acquire: 60000, 
      idle: 20000,
    },
    retry: {
      max: 2
    },
    logging: (msg) => {
      // Enhanced logging to track connection usage
      if (msg.includes('Connection acquired') || msg.includes('Connection released')) {
        console.log(msg);
      }
    }
  }
);

// Better error handling with async/await
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully");
    
    // Monitor pool status
    setInterval(() => {
      const pool = sequelize.connectionManager.pool;
      if (pool) {
        console.log('Pool Status:', {
          total: pool.size,
          available: pool.available,
          borrowed: pool.borrowed,
        });
      }
    }, 30000);

  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

// Initialize connection
connectDB();

module.exports = sequelize;