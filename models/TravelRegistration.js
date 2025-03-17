// const { Sequelize, DataTypes, Model } = require('sequelize');
// const sequelize = require('./index');
// const RegisteredPartner = require('./RegisteredPartner');

// class TravelRegistration extends Model {}

// TravelRegistration.init(
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     registrationNumber: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     mobileNumber: {
//       type: DataTypes.STRING(10),
//       allowNull: false,
//       references: {
//         model: RegisteredPartner,
//         key: 'mobileNumber'
//       }
//     },
//     // Details fetched from RegisteredPartner
//     partnerName: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     partnerCode: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     location: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     // Details submitted by customer
//     travelerName: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     alternateMobile: {
//       type: DataTypes.STRING(10),
//       allowNull: false,
//       validate: {
//         is: /^[6-9]\d{9}$/ // Indian mobile numbers
//       }
//     },
//     tShirtSize: {
//       type: DataTypes.ENUM('S', 'M', 'L', 'XL', 'XXL'),
//       allowNull: false,
//     },
//     travelMode: {
//       type: DataTypes.ENUM('Air', 'Train', 'Road'),
//       allowNull: false,
//     },
//     expectedArrivalDateTime: {
//       type: DataTypes.DATE,
//       allowNull: false,
//     },
//     agreedToTerms: {
//       type: DataTypes.BOOLEAN,
//       allowNull: false,
//       defaultValue: false,
//     },
//     registrationDate: {
//       type: DataTypes.DATE,
//       defaultValue: Sequelize.NOW,
//     },
//     status: {
//       type: DataTypes.ENUM('Confirmed', 'Pending', 'Cancelled'),
//       defaultValue: 'Pending',
//     }
//   },
//   {
//     sequelize,
//     modelName: 'TravelRegistration', 
//     tableName: 'travel_registrations',
//     timestamps: true,
//   }
// );

// // Define associations
// TravelRegistration.belongsTo(RegisteredPartner, { foreignKey: 'mobileNumber', targetKey: 'mobileNumber' });

// module.exports = TravelRegistration;




///17march 

// const { Sequelize, DataTypes, Model } = require('sequelize');
// const sequelize = require('./index');
// const RegisteredPartner = require('./RegisteredPartner');

// class TravelRegistration extends Model {}

// TravelRegistration.init(
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     registrationNumber: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       unique: true,
//     },
//     mobileNumber: {
//       type: DataTypes.STRING(10),
//       allowNull: false,
//       references: {
//         model: RegisteredPartner,
//         key: 'mobileNumber'
//       }
//     },
//     // Details fetched from RegisteredPartner
//     partnerName: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     partnerCode: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     location: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     // Details submitted by customer
//     travelerName: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     alternateMobile: {
//       type: DataTypes.STRING(10),
//       allowNull: false,
//       validate: {
//         is: /^[6-9]\d{9}$/ // Indian mobile numbers
//       }
//     },
//     tShirtSize: {
//       type: DataTypes.ENUM('S', 'M', 'L', 'XL', 'XXL'),
//       allowNull: true,
//     },
//     travelMode: {
//       type: DataTypes.ENUM('Air', 'Train', 'Road'),
//       allowNull: false,
//     },
//     expectedArrivalDateTime: {
//       type: DataTypes.DATE,
//       allowNull: false,
//     },
//     agreedToTerms: {
//       type: DataTypes.BOOLEAN,
//       allowNull: false,
//       defaultValue: false,
//     },
//     // New accommodation fields
//     hotelName: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     hotelLocation: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     roomNumber: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     // New family member fields
//     familyMemberRelation: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     familyMemberName: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     otherRelation: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     // Status and dates
//     status: {
//       type: DataTypes.ENUM('Confirmed', 'Pending', 'Cancelled'),
//       defaultValue: 'Pending',
//     },
//     registrationDate: {
//       type: DataTypes.DATE,
//       defaultValue: Sequelize.NOW,
//     },
//     lastUpdated: {
//       type: DataTypes.DATE,
//       defaultValue: Sequelize.NOW,
//     }
//   },
//   {
//     sequelize,
//     modelName: 'TravelRegistration', 
//     tableName: 'travel_registrations',
//     timestamps: true,
//     hooks: {
//       beforeUpdate: (registration) => {
//         registration.lastUpdated = new Date();
//       }
//     }
//   }
// );

// // Define associations
// TravelRegistration.belongsTo(RegisteredPartner, { foreignKey: 'mobileNumber', targetKey: 'mobileNumber' });

// module.exports = TravelRegistration;




const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./index');
const RegisteredPartner = require('./RegisteredPartner');

class TravelRegistration extends Model {}

TravelRegistration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    mobileNumber: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: RegisteredPartner,
        key: 'mobileNumber'
      }
    },
    // Details fetched from RegisteredPartner
    partnerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    partnerCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Added type field
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['farmer', 'trader']] // Ensure type is either 'farmer' or 'trader'
      }
    },
    // Details submitted by customer
    travelerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    alternateMobile: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        is: /^[6-9]\d{9}$/ // Indian mobile numbers
      }
    },
    tShirtSize: {
      type: DataTypes.ENUM('S', 'M', 'L', 'XL', 'XXL'),
      allowNull: true,
    },
    travelMode: {
      type: DataTypes.ENUM('Air', 'Train', 'Road'),
      allowNull: false,
    },
    expectedArrivalDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    agreedToTerms: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // New accommodation fields
    hotelName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hotelLocation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    roomNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // New family member fields
    familyMemberRelation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    familyMemberName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otherRelation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Status and dates
    status: {
      type: DataTypes.ENUM('Confirmed', 'Pending', 'Cancelled'),
      defaultValue: 'Pending',
    },
    registrationDate: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    }
  },
  {
    sequelize,
    modelName: 'TravelRegistration', 
    tableName: 'travel_registrations',
    timestamps: true,
    hooks: {
      beforeUpdate: (registration) => {
        registration.lastUpdated = new Date();
      }
    }
  }
);

// Define associations
TravelRegistration.belongsTo(RegisteredPartner, { foreignKey: 'mobileNumber', targetKey: 'mobileNumber' });

module.exports = TravelRegistration;




