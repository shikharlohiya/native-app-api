const { Sequelize } = require("sequelize");





const sequelize = new Sequelize("crm_parivartan_prd", "root", "loglin", {
  host: "localhost",
  dialect: "mysql",
});







// const sequelize = new Sequelize( 'crm_parivartan_prd' , 'crmuser' , 'loglin', {
//     host : '172.16.2.22',
//     dialect : 'mysql'
//    });



//




try {
  sequelize.authenticate();
  console.log("connection has been establised succesfully");
} catch (error) {
  console.error("unable to connect to the data base", error);
}

module.exports = sequelize
