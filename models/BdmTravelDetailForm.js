
const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class BdmTravelDetailForm extends Model {}

BdmTravelDetailForm.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    
    // Employee ID reference (BDM who created the travel record)
    BDMId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'BDM who created the travel detail'
    },
    
    // col1: Task Type - Options: RO Visit, BO visit, HO visit, travel
    // If 'travel' selected, show 'mode_of_travel' (col9)
    // If 'HO visit' selected, show 'ho_selection' (col8)

    taskType: {
      type: DataTypes.ENUM('RO Visit', 'BO Visit', 'HO Visit', 'travel'),
      allowNull: false,
      comment: 'Type of task: RO Visit, BO visit, HO visit, or travel | If travel selected, show mode_of_travel | If HO visit selected, show ho_selection'
    },
    
   
    // Branch name for display (redundant but useful)
    branchName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Branch name for display purposes'
    },
    
    // col3: Regional office name
    regionalOfficeName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Regional Office name'
    },
    
    // col4: Purpose for visit
    // If 'Meeting_with_RH_BM_ZH' selected, show 'concernPersonName' (col5)
    // If 'admin_work' selected, show 'adminTaskSelect' (col6)
    purposeForVisit: {
      type: DataTypes.ENUM('Meeting_with_RH_BM_ZH', 'admin_work', 'customer_meeting', 'other'),
      allowNull: true,
      comment: 'Purpose for visit | If Meeting_with_RH_BM_ZH selected, show concernPersonName | If admin_work selected, show adminTaskSelect'
    },
    
    // col5: Concern person name (shown if purposeForVisit is 'Meeting_with_RH_BM_ZH')
    concernPersonName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Name of the person to meet with (RH/BM/ZH)'
    },
    
    // col6: Admin task selection (shown if purposeForVisit is 'admin_work')
    // If 'others' selected, show 'remarks' (col7)
    adminTaskSelect: {
      type: DataTypes.ENUM('agreement', 'customer_kyc', 'others'),
      allowNull: true,
      comment: 'Admin task selection | If others selected, show remarks field'
    },
    
    // col7: Remarks (shown if adminTaskSelect is 'others' or for any HO selection)
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional remarks for the travel/visit'
    },
    
    // col8: HO selection (shown if taskType is 'HO visit')
    // Any selection will also show 'remarks' (col7)
    hoSelection: {
      type: DataTypes.ENUM('training', 'review', 'other'),
      allowNull: true,
      comment: 'Head Office visit purpose | Any selection will show remarks field'
    },
    
    // col9: Mode of travel (shown if taskType is 'travel')
    modeOfTravel: {
      type: DataTypes.ENUM('air', 'bus', 'train', 'car', 'scooter', 'bike', 'auto', 'other'),
      allowNull: true,
      comment: 'Mode of transportation for travel'
    },
    
    // col10: Travel from location
    travelFrom: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Starting location for travel'
    },
    
    // col11: Travel to location
    travelTo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Destination location for travel'
    },
    
    // col12: Reason for travel
    reasonForTravel: {
      type: DataTypes.ENUM('New Area Development', 'Customer Meeting', 'RO Meeting', 'HO Meeting','Site Visit', 'Travel Back to Base Location', 'BO Meeting',),
      allowNull: true,
      comment: 'Reason for undertaking travel'
    },
    
    // col13: Mandatory visit image (proof of visit)
    mandatoryVisitImage: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Path to mandatory visit image (proof of visit)'
    },
    
    // col14: Optional visit image
    optionalVisitImage: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Path to optional visit image'
    },
    
    // Additional useful fields
    extra1: {
     type: DataTypes.STRING,
     allowNull: true,
    
   },
   extra2: {
    type: DataTypes.STRING,
    allowNull: true,
   
  },
  extra3: {
   type: DataTypes.STRING,
   allowNull: true,
  
 },
 extra4: {
  type: DataTypes.STRING,
  allowNull: true,
 
},
     
    // Standard tracking fields
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    deleted: {
      type: DataTypes.ENUM('Y', 'N'),
      allowNull: false,
      defaultValue: 'N',
      comment: 'Soft delete flag'
    }
  },
  {
    sequelize,
    modelName: 'bdm_travel_detail_form',
    tableName: 'bdm_travel_detail_form',
    timestamps: true, // Enable timestamps for createdAt and updatedAt
    paranoid: false // Not using paranoid delete
  }
);


module.exports = BdmTravelDetailForm;