// controllers/bdmTravelController.js
const BdmTravelDetailForm = require('../../models/BdmTravelDetailForm');
const { validationResult } = require('express-validator');
const { uploadFile } = require('../../Library/awsS3');
const sequelize = require("../../models/index");
const BdmLeadAction = require("../../models/BdmLeadAction")
const {  Employee } = require('../../models/models');
const EmployeeLocation = require('../../models/EmployeeLocation')
const { Op ,QueryTypes,Sequelize } = require('sequelize');


 

/**
 * Create a new BDM travel detail entry with conditional validation
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.createBdmTravel = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    // Extract body data
    const {
      BDMId,
      taskType,
      branchName,
      regionalOfficeName,
      purposeForVisit,
      concernPersonName,
      adminTaskSelect,
      remarks,
      hoSelection,
      modeOfTravel,
      travelFrom,
      travelTo,
      reasonForTravel,
      bdmLeadActionId
    } = req.body;

    // Validate required fields (mandatory for all task types)
    const errors = [];

    // Common mandatory fields
    if (!BDMId) errors.push({ field: 'BDMId', message: 'BDM ID is required' });
    if (!taskType) errors.push({ field: 'taskType', message: 'Task type is required' });
    if (!remarks) errors.push({ field: 'remarks', message: 'Remarks are required' });
    if (!remarks) errors.push({ field: 'BdmLeadActionId', message: 'Remarks are required' });
    
    // Check for mandatory image
    if (!req.files || !req.files.mandatoryVisitImage || req.files.mandatoryVisitImage.length === 0) {
      errors.push({ field: 'mandatoryVisitImage', message: 'Mandatory visit image is required' });
    }

    // Task type specific validations
    if (taskType === 'RO Visit') {
      // Validate RO Visit specific fields
      if (!regionalOfficeName) errors.push({ field: 'regionalOfficeName', message: 'Regional Office name is required for RO Visit' });
      if (!purposeForVisit) errors.push({ field: 'purposeForVisit', message: 'Purpose for visit is required for RO Visit' });
      
      // Nested validation based on purpose selection
      if (purposeForVisit === 'Meeting_with_RH_BM_ZH' && !concernPersonName) {
        errors.push({ field: 'concernPersonName', message: 'Concern person name is required for meeting with RH/BM/ZH' });
      }
      
      if (purposeForVisit === 'admin_work' && !adminTaskSelect) {
        errors.push({ field: 'adminTaskSelect', message: 'Admin task selection is required for admin work' });
      }
    } 
    else if (taskType === 'BO visit') {
      // Validate BO Visit specific fields
      if (!branchName) errors.push({ field: 'branchName', message: 'Branch name is required for BO Visit' });
      if (!purposeForVisit) errors.push({ field: 'purposeForVisit', message: 'Purpose for visit is required for BO Visit' });
      
      // Nested validation based on purpose selection
      if (purposeForVisit === 'Meeting_with_RH_BM_ZH' && !concernPersonName) {
        errors.push({ field: 'concernPersonName', message: 'Concern person name is required for meeting with RH/BM/ZH' });
      }
      
      if (purposeForVisit === 'admin_work' && !adminTaskSelect) {
        errors.push({ field: 'adminTaskSelect', message: 'Admin task selection is required for admin work' });
      }
    } 
    else if (taskType === 'HO visit') {
      // Validate HO Visit specific fields
      if (!hoSelection) errors.push({ field: 'hoSelection', message: 'HO Selection is required for HO Visit' });
    } 
    else if (taskType === 'travel') {
      // Validate Travel specific fields
      if (!modeOfTravel) errors.push({ field: 'modeOfTravel', message: 'Mode of travel is required for Travel' });
      if (!travelFrom) errors.push({ field: 'travelFrom', message: 'Travel from location is required for Travel' });
      if (!travelTo) errors.push({ field: 'travelTo', message: 'Travel to location is required for Travel' });
      if (!reasonForTravel) errors.push({ field: 'reasonForTravel', message: 'Reason for travel is required for Travel' });
    }

    // If any validation errors, return them
    if (errors.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

 

    // Handle image uploads to AWS S3
    let mandatoryVisitImageUrl = '';
    let optionalVisitImageUrl = '';

    // Upload mandatory image
    if (req.files && req.files.mandatoryVisitImage && req.files.mandatoryVisitImage.length > 0) {
      try {
        const file = req.files.mandatoryVisitImage[0];
        const documentResponse = await uploadFile(file, "bdm_travel_images");
        mandatoryVisitImageUrl = `https://ib-paultry-image.s3.ap-south-2.amazonaws.com/${documentResponse.Key}`;
      } catch (uploadError) {
        await t.rollback();
        console.error("Error uploading mandatory image:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Error uploading mandatory image",
          error: uploadError.message
        });
      }
    }

    // Upload optional image if available
    if (req.files && req.files.optionalVisitImage && req.files.optionalVisitImage.length > 0) {
      try {
        const file = req.files.optionalVisitImage[0];
        const documentResponse = await uploadFile(file, "bdm_travel_images");
        optionalVisitImageUrl = `https://ib-paultry-image.s3.ap-south-2.amazonaws.com/${documentResponse.Key}`;
      } catch (uploadError) {
        await t.rollback();
        console.error("Error uploading optional image:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Error uploading optional image",
          error: uploadError.message
        });
      }
    }

    // Create the BDM travel detail
    const bdmTravel = await BdmTravelDetailForm.create({
      BDMId,
      taskType,
      branchName,
      regionalOfficeName,
      purposeForVisit,
      concernPersonName,
      adminTaskSelect,
      remarks,
      hoSelection,
      modeOfTravel,
      travelFrom,
      travelTo,
      reasonForTravel,
      mandatoryVisitImage: mandatoryVisitImageUrl,
      optionalVisitImage: optionalVisitImageUrl || null,
      
    }, { transaction: t });

    if (bdmLeadActionId) {
     const bdmLeadAction = await BdmLeadAction.findByPk(bdmLeadActionId, {
       transaction: t,
     });
     console.log(bdmLeadActionId);
     

     if (!bdmLeadAction) {
       await t.rollback();
       return res.status(400).json({ error: "BdmLeadAction ID not found" });
     }

     try {
       await bdmLeadAction.update(
         {
           completion_status: "completed",
           lead_detail_form_id:bdmTravel.id 
           
         },
         { transaction: t }
       );
     } catch (updateError) {
       await t.rollback();
       console.error("Error updating BdmLeadAction:", updateError);
       return res.status(500).json({
         message: "Error updating BdmLeadAction",
         error: updateError.message
       });
     }
   }


    await t.commit();

    res.status(201).json({
      success: true,
      message: 'BDM travel detail created successfully',
      data: bdmTravel
    });

  } catch (error) {
    await t.rollback();
    console.error('Error creating BDM travel detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create BDM travel detail',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


exports.saveEmployeeLocation = async (req, res) => {
  try {
    const {
      EmployeeId,
      latitude,
      longitude,
      isCheckIn,
      checkInType,
      checkInDetails,
      address,
      deviceInfo,
      batteryLevel
    } = req.body;

    // Validate required fields
    if (!EmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Check if employee exists
    const employee = await Employee.findOne({
      where: { EmployeeId }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Create location record
    const locationData = await EmployeeLocation.create({
      EmployeeId,
      latitude,
      longitude,
      timestamp: new Date(),
      isCheckIn: isCheckIn || false,
      checkInType: isCheckIn ? checkInType : null,
      checkInDetails: isCheckIn ? checkInDetails : null,
      address,
      deviceInfo,
      batteryLevel
    });

    return res.status(201).json({
      success: true,
      message: isCheckIn ? 'Check-in recorded successfully' : 'Location recorded successfully',
      data: locationData
    });

  } catch (error) {
    console.error('Error saving employee location:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save employee location',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get employee location data with date filtering
 * @route GET /api/employee/location
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getEmployeeLocations = async (req, res) => {
  try {
    const { 
      EmployeeId, 
      startDate, 
      endDate, 
      isCheckIn, 
      checkInType 
    } = req.query;

    // Build filter conditions
    const whereConditions = {};
    
    // Employee filter
    if (EmployeeId) {
      whereConditions.EmployeeId = EmployeeId;
    }
    
    // Date range filter
    if (startDate && endDate) {
      whereConditions.timestamp = {
        [Op.between]: [
          new Date(startDate + 'T00:00:00'), 
          new Date(endDate + 'T23:59:59')
        ]
      };
    } else if (startDate) {
      whereConditions.timestamp = {
        [Op.gte]: new Date(startDate + 'T00:00:00')
      };
    } else if (endDate) {
      whereConditions.timestamp = {
        [Op.lte]: new Date(endDate + 'T23:59:59')
      };
    } else {
      // Default to current day if no dates provided
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      whereConditions.timestamp = {
        [Op.between]: [startOfDay, endOfDay]
      };
    }
    
    // Check-in filter
    if (isCheckIn !== undefined) {
      whereConditions.isCheckIn = isCheckIn === 'true';
    }
    
    // Check-in type filter
    if (checkInType) {
      whereConditions.checkInType = checkInType;
    }

    // Query the database
    const locations = await EmployeeLocation.findAll({
      where: whereConditions,
      // include: [
      //   {
      //     model: Employee,
      //     as: 'employee',
      //     attributes: ['EmployeeName', 'EmployeePhone', 'EmployeeRegion']
      //   }
      // ],
      order: [['timestamp', 'ASC']]
    });

    // Process the data to group by date if needed
    const formattedLocations = locations.map(location => {
      const locationData = location.toJSON();
      return {
        ...locationData,
        formattedDate: new Date(locationData.timestamp).toLocaleDateString(),
        formattedTime: new Date(locationData.timestamp).toLocaleTimeString()
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Employee locations retrieved successfully',
      count: locations.length,
      data: formattedLocations
    });

  } catch (error) {
    console.error('Error retrieving employee locations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee locations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};



