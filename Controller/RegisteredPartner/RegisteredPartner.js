const RegisteredPartner = require('../../models/RegisteredPartner');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const TravelRegistration = require('../../models/TravelRegistration');
const { Op } = require('sequelize');
const axios = require('axios');

// Import necessary modules
const ExcelJS = require('exceljs');
 
 
const moment = require('moment-timezone');
const transliteration = require('transliteration');
 
 

// Get partner details by mobile number


exports.getPartnerByMobile = async (req, res) => {
  try {
    const { mobileNumber } = req.params;

    // Validate mobile number format
    if (!mobileNumber.match(/^[6-9]\d{9}$/)) {
      return res.status(400).json({
        status: "400",
        message: "Invalid mobile number format. Please provide a valid 10-digit Indian mobile number."
      });
    }

    const partner = await RegisteredPartner.findOne({
      where: { mobileNumber }
    });

    if (!partner) {
      return res.status(404).json({
        status: "404",
        message: "Partner not found with the provided mobile number"
      });
    }

    return res.status(200).json({
      status: "200",
      message: "Partner details retrieved successfully",
      data: partner
    });
  } catch (error) {
    console.error("Error fetching partner details:", error);
    return res.status(500).json({
      status: "500",
      message: "An error occurred while fetching partner details",
      error: error.message
    });
  }
};
 


// Setup multer for file uploads


// const storage = multer.diskStorage({
//  destination: (req, file, cb) => {
//    const uploadDir = 'uploads/';
//    if (!fs.existsSync(uploadDir)) {
//      fs.mkdirSync(uploadDir, { recursive: true });
//    }
//    cb(null, uploadDir);
//  },
//  filename: (req, file, cb) => {
//    cb(null, `${Date.now()}-${file.originalname}`);
//  }
// });

// // Modified fileFilter to accept any file
// // We'll attempt to process it as Excel later
// const fileFilter = (req, file, cb) => {
//  // Accept all files - validation moved to processing stage
//  return cb(null, true);
// };

// const upload = multer({ 
//  storage: storage,
//  fileFilter: fileFilter,
//  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
// }).single('file');

// // Function to handle Excel file upload and processing
// exports.bulkUploadPartners = async (req, res) => {
//  upload(req, res, async function(err) {
//    if (err instanceof multer.MulterError) {
//      return res.status(400).json({
//        status: "400",
//        message: `Upload error: ${err.message}`
//      });
//    } else if (err) {
//      return res.status(400).json({
//        status: "400",
//        message: err.message
//      });
//    }

//    // Check if a file was uploaded
//    if (!req.file) {
//      return res.status(400).json({
//        status: "400",
//        message: "No file uploaded. Please upload a file."
//      });
//    }

//    try {
//      const filePath = req.file.path;
     
//      // Try to read the file as Excel - will throw an error if not valid
//      let workbook, partnersData;
//      try {
//        // Read Excel file
//        workbook = XLSX.readFile(filePath);
//        const sheetName = workbook.SheetNames[0];
//        const worksheet = workbook.Sheets[sheetName];
       
//        // Convert to JSON
//        partnersData = XLSX.utils.sheet_to_json(worksheet);
//      } catch (excelError) {
//        // Clean up file
//        if (fs.existsSync(filePath)) {
//          fs.unlinkSync(filePath);
//        }
       
//        return res.status(400).json({
//          status: "400",
//          message: "Could not process file as Excel. Please check file format.",
//          error: excelError.message
//        });
//      }

//      // Delete the file after processing
//      fs.unlinkSync(filePath);
     
//      if (!Array.isArray(partnersData) || partnersData.length === 0) {
//        return res.status(400).json({
//          status: "400",
//          message: "No data found in the file or format is incorrect."
//        });
//      }

//      // Validate all entries
//      const validationErrors = [];
//      for (const partner of partnersData) {
//        const { mobileNumber, partnerName, partnerCode, location } = partner;
       
//        if (!mobileNumber || !partnerName || !partnerCode || !location) {
//          validationErrors.push({
//            entry: partner,
//            error: "Missing required fields"
//          });
//          continue;
//        }

//        if (!String(mobileNumber).match(/^[6-9]\d{9}$/)) {
//          validationErrors.push({
//            entry: partner,
//            error: "Invalid mobile number format"
//          });
//          continue;
//        }
//      }

//      if (validationErrors.length > 0) {
//        return res.status(400).json({
//          status: "400",
//          message: "Validation errors in the data",
//          errors: validationErrors
//        });
//      }

//      // Extract mobile numbers and format the data properly
//      const formattedData = partnersData.map(partner => ({
//        mobileNumber: String(partner.mobileNumber),
//        partnerName: String(partner.partnerName),
//        partnerCode: String(partner.partnerCode),
//        location: String(partner.location)
//      }));

//      const mobileNumbers = formattedData.map(p => p.mobileNumber);
     
//      // Check for existing partners
//      const existingPartners = await RegisteredPartner.findAll({
//        where: { 
//          mobileNumber: { [Op.in]: mobileNumbers }
//        }
//      });

//      const existingMobilesMap = {};
//      existingPartners.forEach(partner => {
//        existingMobilesMap[partner.mobileNumber] = partner;
//      });

//      // Separate new entries and updates
//      const newPartners = [];
//      const updatePromises = [];

//      for (const partner of formattedData) {
//        if (existingMobilesMap[partner.mobileNumber]) {
//          // Update existing partner (except mobile number)
//          const existingPartner = existingMobilesMap[partner.mobileNumber];
//          updatePromises.push(
//            existingPartner.update({
//              partnerName: partner.partnerName,
//              partnerCode: partner.partnerCode, // Note: This will update even the partner code
//              location: partner.location
//            })
//          );
//        } else {
//          // New partner
//          newPartners.push(partner);
//        }
//      }

//      // Process updates and new entries
//      const updatedPartners = await Promise.all(updatePromises);
//      const createdPartners = newPartners.length > 0 ? 
//        await RegisteredPartner.bulkCreate(newPartners) : [];

//      return res.status(200).json({
//        status: "200",
//        message: "Partners bulk upload completed successfully",
//        created: createdPartners.length,
//        updated: updatedPartners.length,
//        total: partnersData.length,
//        newPartners: createdPartners,
//        updatedPartners: updatedPartners
//      });
//    } catch (error) {
//      console.error("Error bulk uploading partners:", error);
//      return res.status(500).json({
//        status: "500",
//        message: "An error occurred during bulk upload",
//        error: error.message
//      });
//    }
//  });
// };



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
 });
 
 // Modified fileFilter to accept any file
 // We'll attempt to process it as Excel later
 const fileFilter = (req, file, cb) => {
  // Accept all files - validation moved to processing stage
  return cb(null, true);
 };
 
 const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
 }).single('file');
 
 // Function to handle Excel file upload and processing
 exports.bulkUploadPartners = async (req, res) => {
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        status: "400",
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        status: "400",
        message: err.message
      });
    }
 
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        status: "400",
        message: "No file uploaded. Please upload a file."
      });
    }
 
    try {
      const filePath = req.file.path;
      
      // Try to read the file as Excel - will throw an error if not valid
      let workbook, partnersData;
      try {
        // Read Excel file
        workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        partnersData = XLSX.utils.sheet_to_json(worksheet);
      } catch (excelError) {
        // Clean up file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        return res.status(400).json({
          status: "400",
          message: "Could not process file as Excel. Please check file format.",
          error: excelError.message
        });
      }
 
      // Delete the file after processing
      fs.unlinkSync(filePath);
      
      if (!Array.isArray(partnersData) || partnersData.length === 0) {
        return res.status(400).json({
          status: "400",
          message: "No data found in the file or format is incorrect."
        });
      }
 
      // Validate all entries
      const validationErrors = [];
      for (const partner of partnersData) {
        const { mobileNumber, partnerName, partnerCode, location, type } = partner;
        
        if (!mobileNumber || !partnerName || !partnerCode || !location || !type) {
          validationErrors.push({
            entry: partner,
            error: "Missing required fields"
          });
          continue;
        }
 
        if (!String(mobileNumber).match(/^[6-9]\d{9}$/)) {
          validationErrors.push({
            entry: partner,
            error: "Invalid mobile number format"
          });
          continue;
        }
        
        // Validate type field (if you have specific valid types)
        const validTypes = ['farmer', 'trader']; // Add any other valid types here
        if (!validTypes.includes(String(type).toLowerCase())) {
          validationErrors.push({
            entry: partner,
            error: "Invalid type. Must be one of: " + validTypes.join(', ')
          });
          continue;
        }
      }
 
      if (validationErrors.length > 0) {
        return res.status(400).json({
          status: "400",
          message: "Validation errors in the data",
          errors: validationErrors
        });
      }
 
      // Extract mobile numbers and format the data properly
      const formattedData = partnersData.map(partner => ({
        mobileNumber: String(partner.mobileNumber),
        partnerName: String(partner.partnerName),
        partnerCode: String(partner.partnerCode),
        location: String(partner.location),
        type: String(partner.type).toLowerCase() // Added type field here
      }));
 
      const mobileNumbers = formattedData.map(p => p.mobileNumber);
      
      // Check for existing partners
      const existingPartners = await RegisteredPartner.findAll({
        where: { 
          mobileNumber: { [Op.in]: mobileNumbers }
        }
      });
 
      const existingMobilesMap = {};
      existingPartners.forEach(partner => {
        existingMobilesMap[partner.mobileNumber] = partner;
      });
 
      // Separate new entries and updates
      const newPartners = [];
      const updatePromises = [];
 
      for (const partner of formattedData) {
        if (existingMobilesMap[partner.mobileNumber]) {
          // Update existing partner (except mobile number)
          const existingPartner = existingMobilesMap[partner.mobileNumber];
          updatePromises.push(
            existingPartner.update({
              partnerName: partner.partnerName,
              partnerCode: partner.partnerCode,
              location: partner.location,
              type: partner.type // Added type field here
            })
          );
        } else {
          // New partner
          newPartners.push(partner);
        }
      }
 
      // Process updates and new entries
      const updatedPartners = await Promise.all(updatePromises);
      const createdPartners = newPartners.length > 0 ? 
        await RegisteredPartner.bulkCreate(newPartners) : [];
 
      return res.status(200).json({
        status: "200",
        message: "Partners bulk upload completed successfully",
        created: createdPartners.length,
        updated: updatedPartners.length,
        total: partnersData.length,
        newPartners: createdPartners,
        updatedPartners: updatedPartners
      });
    } catch (error) {
      console.error("Error bulk uploading partners:", error);
      return res.status(500).json({
        status: "500",
        message: "An error occurred during bulk upload",
        error: error.message
      });
    }
  });
 };








//---------


// Generate unique registration number
const generateRegistrationNumber = (partnerDetails) => {
  // Extract first 4 digits of mobile
  const mobilePrefix = partnerDetails.mobileNumber.substring(0, 4);
  
  // Extract farm code digits (assuming partner code has numbers)
  const partnerCodeDigits = partnerDetails.partnerCode.replace(/\D/g, "").substring(0, 3);
  
  // Get first 2 characters of name and convert to ASCII codes, then take last digit
  const nameChars = partnerDetails.partnerName.substring(0, 2)
    .split('')
    .map(char => char.charCodeAt(0).toString().slice(-1))
    .join('');
  
  // Add timestamp for uniqueness
  const timestamp = Date.now().toString().slice(-4);
  
  // Combine parts to create a 10-digit registration number
  let regNumber = `${mobilePrefix}${partnerCodeDigits}${nameChars}${timestamp}`;
  
  // Ensure exactly 10 digits by truncating or padding if necessary
  regNumber = regNumber.substring(0, 10).padEnd(10, '0');
  
  return regNumber;
};

// Create new travel registration


// exports.createTravelRegistration = async (req, res) => {
//   try {
//     const { 
//       mobileNumber, 
//       travelerName,
//       alternateMobile,
//       // tShirtSize,
//       travelMode,
//       expectedArrivalDateTime,
//       agreedToTerms
//     } = req.body;

//     // Validate required fields
//     if (!mobileNumber || !travelerName || !alternateMobile  || 
//         !travelMode || !expectedArrivalDateTime || agreedToTerms !== true) {
//       return res.status(400).json({
//         status: "400",
//         message: "Missing required fields or terms not agreed to"
//       });
//     }

//     // Validate mobile number format
//     if (!mobileNumber.match(/^[6-9]\d{9}$/) || !alternateMobile.match(/^[6-9]\d{9}$/)) {
//       return res.status(400).json({
//         status: "400",
//         message: "Invalid mobile number format"
//       });
//     }

//     // Check if mobile number is registered
//     const registeredPartner = await RegisteredPartner.findOne({
//       where: { mobileNumber }
//     });

//     if (!registeredPartner) {
//       return res.status(404).json({
//         status: "404",
//         message: "Mobile number is not registered. Please register first."
//       });
//     }

//     // Check if the user has already registered for this event
//     const existingRegistration = await TravelRegistration.findOne({
//       where: { mobileNumber }
//     });

//     if (existingRegistration) {
//       return res.status(409).json({
//         status: "409",
//         message: "You have already registered for this event",
//         data: existingRegistration
//       });
//     }

//     // Format expected arrival date and time
//     const formattedDateTime = new Date(expectedArrivalDateTime);
//     if (isNaN(formattedDateTime)) {
//       return res.status(400).json({
//         status: "400",
//         message: "Invalid date format for expected arrival"
//       });
//     }

//     // Generate registration number
//     const registrationNumber = generateRegistrationNumber(registeredPartner);

//     // Create travel registration
//     const travelRegistration = await TravelRegistration.create({
//       registrationNumber,
//       mobileNumber,
//       partnerName: registeredPartner.partnerName,
//       partnerCode: registeredPartner.partnerCode,
//       location: registeredPartner.location,
//       travelerName,
//       alternateMobile,
//       // tShirtSize,
//       travelMode,
//       expectedArrivalDateTime: formattedDateTime,
//       agreedToTerms
//     });

//     return res.status(201).json({
//       status: "201",
//       message: "Travel registration successful",
//       data: {
//         registrationNumber: travelRegistration.registrationNumber,
//         partnerDetails: {
//           mobileNumber: travelRegistration.mobileNumber,
//           partnerName: travelRegistration.partnerName,
//           partnerCode: travelRegistration.partnerCode,
//           location: travelRegistration.location
//         },             
//         travelDetails: {                                
//           travelerName: travelRegistration.travelerName,
//           // alternateMobile: travelRegistration.alternateMobile,
//           tShirtSize: travelRegistration.tShirtSize,
//           travelMode: travelRegistration.travelMode,
//           expectedArrivalDateTime: travelRegistration.expectedArrivalDateTime
//         },
//         registrationDate: travelRegistration.registrationDate
//       }
//     });
//   } catch (error) {
//     console.error("Error creating travel registration:", error);
//     return res.status(500).json({
//       status: "500",
//       message: "An error occurred while creating travel registration",
//       error: error.message
//     });
//   }
// };



// Send WhatsApp notification


//old whatsap integration


const sendWhatsAppNotification = async (mobileNumber, type, registrationNumber) => {
  try {
    const whatsappApiUrl = 'https://app.aiwati.com/api/whatsapp-base/send_template';
    const apiKey = 'API17422044184eHn09V7bGpuPkaSfOROHrfger0';
    
    // Format the body based on partner type
    const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize first letter
    
    const response = await axios.post(
      `${whatsappApiUrl}?api_key=${apiKey}`,
      {
        to: mobileNumber,
        template: "1321152965788304",
        body: [typeCapitalized, registrationNumber]
      }
    );
    
    console.log('WhatsApp notification sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    // Continue execution even if WhatsApp notification fails
    return null;
  }
};







// 200 msg 
// Send WhatsApp notification with Infobip API


// const sendWhatsAppNotification = async (mobileNumber, type, registrationNumber) => {
//   try {
//     const whatsappApiUrl = 'https://qz8lq.api.infobip.com/whatsapp/1/message/template';
//     const apiKey = '1345580d8d70cb8d9a5fa6a722444a27-20d8b005-9b06-4693-b8f3-15ae7a918c75';
    
//     // Generate a unique messageId
//     const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
//     // Format mobile number to ensure it includes country code (assuming India's +91)
//     // If mobileNumber already has country code, this won't affect it
//     const formattedMobileNumber = mobileNumber.startsWith("91") ? mobileNumber : `91${mobileNumber}`;
    
//     // Format the request body based on the new API requirements
//     const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize first letter
    
//     const requestBody = {
//       messages: [
//         {
//           from: "919754888801", // Static sender number
//           to: formattedMobileNumber,
//           messageId: messageId,
//           content: {
//             templateName: "test1", // Update this with your actual template name
//             templateData: {
//               body: {
//                 placeholders: [typeCapitalized, registrationNumber]
//               }
//             },
//             language: "en"
//           },
//           callbackData: messageId
//         }
//       ]
//     };
    
//     // Set up the request headers according to the Infobip documentation
//     const headers = {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//       'Authorization': `App ${apiKey}`
//     };
    
//     // Configure axios with options to handle SSL/TLS issues
//     const axiosConfig = {
//       headers: headers,
//       timeout: 15000, // 15 second timeout
//       httpsAgent: new require('https').Agent({
//         keepAlive: true,
//         maxSockets: 5
//       })
//     };
    
//     console.log('Sending WhatsApp notification to:', formattedMobileNumber);
//     const response = await axios.post(whatsappApiUrl, requestBody, axiosConfig);
    
//     console.log('WhatsApp notification sent successfully. Status:', response.status);
//     return response.data;
//   } catch (error) {
//     console.error('Error sending WhatsApp notification:', error.message);
//     if (error.response) {
//       // The request was made and the server responded with a status code
//       // that falls out of the range of 2xx
//       console.error('Response status:', error.response.status);
//       console.error('Response headers:', JSON.stringify(error.response.headers));
//       console.error('Response data:', JSON.stringify(error.response.data));
//     } else if (error.request) {
//       // The request was made but no response was received
//       console.error('No response received from API. Request details:', error.request._currentUrl);
//     }
//     // Continue execution even if WhatsApp notification fails
//     return null;
//   }
// };


// Send WhatsApp notification with Infobip API
// const sendWhatsAppNotification = async (mobileNumber, type, registrationNumber) => {
//   try {
//     const whatsappApiUrl = 'https://qz8lq.api.infobip.com/whatsapp/1/message/template';
//     const apiKey = '1345580d8d70cb8d9a5fa6a722444a27-20d8b005-9b06-4693-b8f3-15ae7a918c75';
    
//     // Generate a unique messageId
//     const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
//     // Format mobile number to ensure it includes country code (assuming India's +91)
//     // If mobileNumber already has country code, this won't affect it
//     const formattedMobileNumber = mobileNumber.startsWith("91") ? mobileNumber : `91${mobileNumber}`;
    
//     // Format the request body based on the new API requirements
//     const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize first letter
    
//     const requestBody = {
//       messages: [
//         {
//           from: "919754888801", // Static sender number
//           to: formattedMobileNumber,
//           messageId: messageId,
//           content: {
//             templateName: "test1", // Update this with your actual template name
//             templateData: {
//               body: {
//                 placeholders: [typeCapitalized, registrationNumber]
//               }
//             },
//             language: "en"
//           },
//           callbackData: messageId
//         }
//       ]
//     };
    
//     // Set up the request headers according to the Infobip documentation
//     const headers = {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//       'Authorization': `App ${apiKey}`
//     };
    
//     // Configure axios with options to handle SSL/TLS issues
//     const axiosConfig = {
//       headers: headers,
//       timeout: 15000, // 15 second timeout
//       httpsAgent: new require('https').Agent({
//         keepAlive: true,
//         maxSockets: 5
//       })
//     };
    
//     console.log('Sending WhatsApp notification to:', formattedMobileNumber);
//     const response = await axios.post(whatsappApiUrl, requestBody, axiosConfig);
    
//     console.log('WhatsApp notification sent successfully. Status:', response.status);
//     console.log('API Response:', JSON.stringify(response.data, null, 4));
    
//     // Check the message status
//     if (response.data && response.data.messages && response.data.messages.length > 0) {
//       const messageStatus = response.data.messages[0].status;
//       console.log(`Message status: ${messageStatus.groupName} (${messageStatus.name}) - ${messageStatus.description}`);
//     }
    
//     return response.data;
//   } catch (error) {
//     console.error('Error sending WhatsApp notification:', error.message);
//     if (error.response) {
//       // The request was made and the server responded with a status code
//       // that falls out of the range of 2xx
//       console.error('Response status:', error.response.status);
//       console.error('Response headers:', JSON.stringify(error.response.headers));
//       console.error('Response data:', JSON.stringify(error.response.data));
//     } else if (error.request) {
//       // The request was made but no response was received
//       console.error('No response received from API. Request details:', error.request._currentUrl);
//     }
//     // Continue execution even if WhatsApp notification fails
//     return null;
//   }
// };








exports.createTravelRegistration = async (req, res) => {
  try {
    const {
      mobileNumber,
      travelerName,
      alternateMobile,
      // tShirtSize,
      travelMode,
      expectedArrivalDateTime,
      agreedToTerms,
      type // Added type parameter
    } = req.body;

    // Validate required fields
    if (!mobileNumber || !travelerName || !alternateMobile || 
        !travelMode || !expectedArrivalDateTime || agreedToTerms !== true || !type) {
      return res.status(400).json({
        status: "400",
        message: "Missing required fields or terms not agreed to"
      });
    }

    // Validate mobile number format
    if (!mobileNumber.match(/^[6-9]\d{9}$/) || !alternateMobile.match(/^[6-9]\d{9}$/)) {
      return res.status(400).json({
        status: "400",
        message: "Invalid mobile number format"
      });
    }

    // Check if mobile number is registered
    const registeredPartner = await RegisteredPartner.findOne({
      where: { mobileNumber }
    });

    if (!registeredPartner) {
      return res.status(404).json({
        status: "404",
        message: "Mobile number is not registered. Please register first."
      });
    }
    
    // Verify that the type matches the partner's type
    if (registeredPartner.type !== type) {
      return res.status(400).json({
        status: "400",
        message: "Partner type mismatch. Please try again."
      });
    }

    // Check if the user has already registered for this event
    const existingRegistration = await TravelRegistration.findOne({
      where: { mobileNumber }
    });

    if (existingRegistration) {
      return res.status(409).json({
        status: "409",
        message: "You have already registered for this event",
        data: existingRegistration
      });
    }

    // Format expected arrival date and time
    const formattedDateTime = new Date(expectedArrivalDateTime);
    if (isNaN(formattedDateTime)) {
      return res.status(400).json({
        status: "400",
        message: "Invalid date format for expected arrival"
      });
    }
    
    // Validate arrival date based on partner type
    const arrivalDate = new Date(expectedArrivalDateTime);
    const expectedDate = type === 'farmer' 
      ? new Date('2025-04-08')
      : new Date('2025-04-07');
      
    // Check if the date part matches the expected date for the partner type
    if (
      arrivalDate.getFullYear() !== expectedDate.getFullYear() ||
      arrivalDate.getMonth() !== expectedDate.getMonth() ||
      arrivalDate.getDate() !== expectedDate.getDate()
    ) {
      return res.status(400).json({
        status: "400",
        message: `Invalid arrival date. ${type === 'farmer' ? 'Farmers' : 'Traders'} must arrive on ${type === 'farmer' ? 'April 8th' : 'April 7th'}, 2025.`
      });
    }

    // Generate registration number
    const registrationNumber = generateRegistrationNumber(registeredPartner);

    // Create travel registration
    const travelRegistration = await TravelRegistration.create({
      registrationNumber,
      mobileNumber,
      partnerName: registeredPartner.partnerName,
      partnerCode: registeredPartner.partnerCode,
      location: registeredPartner.location,
      type: type, // Store the partner type
      travelerName,
      alternateMobile,
      // tShirtSize,
      travelMode,
      expectedArrivalDateTime: formattedDateTime,
      agreedToTerms
    });
    
    // Send WhatsApp notification (don't await to not block response)
    sendWhatsAppNotification(mobileNumber, type, registrationNumber)
      .then(() => console.log('WhatsApp notification process completed'))
      .catch(err => console.error('Error in WhatsApp notification process:', err));

    return res.status(201).json({
      status: "201",
      message: "Travel registration successful",
      data: {
        registrationNumber: travelRegistration.registrationNumber,
        partnerDetails: {
          mobileNumber: travelRegistration.mobileNumber,
          partnerName: travelRegistration.partnerName,
          partnerCode: travelRegistration.partnerCode,
          location: travelRegistration.location,
          type: travelRegistration.type // Include type in response
        },
        travelDetails: {
          travelerName: travelRegistration.travelerName,
          // alternateMobile: travelRegistration.alternateMobile,
          tShirtSize: travelRegistration.tShirtSize,
          travelMode: travelRegistration.travelMode,
          expectedArrivalDateTime: travelRegistration.expectedArrivalDateTime
        },
        registrationDate: travelRegistration.registrationDate
      }
    });
  } catch (error) {
    console.error("Error creating travel registration:", error);
    return res.status(500).json({
      status: "500",
      message: "An error occurred while creating travel registration",
      error: error.message
    });
  }
};



//---------------------xxx---------------------------



// exports.getAllTravelRegistrations = async (req, res) => {
//   try {
//     // Extract query parameters
//     const { status, search, page = 1, limit = 10 } = req.query;
    
//     // Build query conditions
//     const whereConditions = {};
    
//     // Filter by status if provided
//     if (status && ['Confirmed', 'Pending', 'Cancelled'].includes(status)) {
//       whereConditions.status = status;
//     }
    
//     // Apply search filter if provided
//     if (search) {
//       whereConditions[Op.or] = [
//         { partnerName: { [Op.like]: `%${search}%` } },
//         { mobileNumber: { [Op.like]: `%${search}%` } },
//         { registrationNumber: { [Op.like]: `%${search}%` } },
//         { travelerName: { [Op.like]: `%${search}%` } }
//       ];
//     }
    
//     // Calculate pagination
//     const offset = (page - 1) * limit;
    
//     // Get total count for pagination
//     const totalCount = await TravelRegistration.count({
//       where: whereConditions
//     });
    
//     // Get registrations with pagination
//     const registrations = await TravelRegistration.findAll({
//       where: whereConditions,
//       order: [['registrationDate', 'DESC']],
//       limit: parseInt(limit),
//       offset: parseInt(offset)
//     });
    
//     return res.status(200).json({
//       status: "200",
//       message: "Travel registrations retrieved successfully",
//       totalCount,
//       totalPages: Math.ceil(totalCount / limit),
//       currentPage: parseInt(page),
//       data: registrations
//     });
//   } catch (error) {
//     console.error("Error fetching travel registrations:", error);
//     return res.status(500).json({
//       status: "500",
//       message: "An error occurred while fetching travel registrations",
//       error: error.message
//     });
//   }
// };




exports.getAllTravelRegistrations = async (req, res) => {
  try {
    // Extract query parameters
    const { status, search, page = 1, limit = 10, type } = req.query;
    
    // Build query conditions
    const whereConditions = {};
    
    // Filter by status if provided
    if (status && ['Confirmed', 'Pending', 'Cancelled'].includes(status)) {
      whereConditions.status = status;
    }
    
    // Filter by type if provided
    if (type && ['farmer', 'trader'].includes(type)) {
      whereConditions.type = type;
    }
    
    // Apply search filter if provided
    if (search) {
      whereConditions[Op.or] = [
        { partnerName: { [Op.like]: `%${search}%` } },
        { mobileNumber: { [Op.like]: `%${search}%` } },
        { registrationNumber: { [Op.like]: `%${search}%` } },
        { travelerName: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await TravelRegistration.count({
      where: whereConditions
    });
    
    // Get registrations with pagination
    const registrations = await TravelRegistration.findAll({
      where: whereConditions,
      order: [['registrationDate', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Get counts for different categories
    const [
      totalRegistrations,
      totalFarmers,
      totalTraders,
      pendingFarmers,
      confirmedFarmers,
      pendingTraders,
      confirmedTraders
    ] = await Promise.all([
      // Total registrations
      TravelRegistration.count(),
      
      // Total farmers
      TravelRegistration.count({
        where: { type: 'farmer' }
      }),
      
      // Total traders
      TravelRegistration.count({
        where: { type: 'trader' }
      }),
      
      // Pending farmers
      TravelRegistration.count({
        where: {
          type: 'farmer',
          status: 'Pending'
        }
      }),
      
      // Confirmed farmers
      TravelRegistration.count({
        where: {
          type: 'farmer',
          status: 'Confirmed'
        }
      }),
      
      // Pending traders
      TravelRegistration.count({
        where: {
          type: 'trader',
          status: 'Pending'
        }
      }),
      
      // Confirmed traders
      TravelRegistration.count({
        where: {
          type: 'trader',
          status: 'Confirmed'
        }
      })
    ]);
    
    return res.status(200).json({
      status: "200",
      message: "Travel registrations retrieved successfully",
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      counts: {
        totalRegistrations,
        totalFarmers,
        totalTraders,
        pendingFarmers,
        confirmedFarmers,
        pendingTraders,
        confirmedTraders
      },
      data: registrations
    });
  } catch (error) {
    console.error("Error fetching travel registrations:", error);
    return res.status(500).json({
      status: "500",
      message: "An error occurred while fetching travel registrations",
      error: error.message
    });
  }
};





// Get registration statistics
exports.getRegistrationStats = async (req, res) => {
  try {
    // Get counts for each status
    const confirmedCount = await TravelRegistration.count({
      where: { status: 'Confirmed' }
    });
    
    const pendingCount = await TravelRegistration.count({
      where: { status: 'Pending' }
    });
    
    const cancelledCount = await TravelRegistration.count({
      where: { status: 'Cancelled' }
    });
    
    // Get travel mode statistics
    const travelStats = await TravelRegistration.findAll({
      attributes: ['travelMode', [sequelize.fn('COUNT', sequelize.col('travelMode')), 'count']],
      group: ['travelMode']
    });
    
    // Get registrations with accommodations assigned
    const accommodatedCount = await TravelRegistration.count({
      where: {
        hotelName: { [Op.not]: null }
      }
    });
    
    return res.status(200).json({
      status: "200",
      message: "Registration statistics retrieved successfully",
      stats: {
        statusCounts: {
          confirmed: confirmedCount,
          pending: pendingCount,
          cancelled: cancelledCount,
          total: confirmedCount + pendingCount + cancelledCount
        },
        travelStats: travelStats.reduce((acc, stat) => {
          acc[stat.travelMode.toLowerCase()] = stat.dataValues.count;
          return acc;
        }, {}),
        accommodationStats: {
          assigned: accommodatedCount,
          unassigned: confirmedCount + pendingCount - accommodatedCount
        }
      }
    });
  } catch (error) {
    console.error("Error fetching registration statistics:", error);
    return res.status(500).json({
      status: "500",
      message: "An error occurred while fetching registration statistics",
      error: error.message
    });
  }
};

// Update accommodation details





// exports.updateAccommodation = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { 
//       hotelName, 
//       hotelLocation, 
//       roomNumber, 
//       familyMemberRelation,
//       familyMemberName,
//       otherRelation
//     } = req.body;
    
//     // Validate required fields
//     if (!hotelName || !hotelLocation || !roomNumber) {
//       return res.status(400).json({
//         status: "400",
//         message: "Hotel name, location, and room number are required"
//       });
//     }
    
//     // Additional validation for family member if provided
//     if (familyMemberRelation && !familyMemberName) {
//       return res.status(400).json({
//         status: "400",
//         message: "Family member name is required when relation is specified"
//       });
//     }
    
//     if (familyMemberRelation === 'Other' && !otherRelation) {
//       return res.status(400).json({
//         status: "400",
//         message: "Please specify the relation when 'Other' is selected"
//       });
//     }
    
//     // Find registration
//     const registration = await TravelRegistration.findByPk(id);
    
//     if (!registration) {
//       return res.status(404).json({
//         status: "404",
//         message: "Registration not found"
//       });
//     }
    
//     // Update registration
//     await registration.update({
//       hotelName,
//       hotelLocation,
//       roomNumber,
//       familyMemberRelation: familyMemberRelation || null,
//       familyMemberName: familyMemberName || null,
//       otherRelation: familyMemberRelation === 'Other' ? otherRelation : null,
//       // Set to confirmed if it was pending
//       status: registration.status === 'Pending' ? 'Confirmed' : registration.status
//     });
    
//     return res.status(200).json({
//       status: "200",
//       message: "Accommodation details updated successfully",
//       data: await TravelRegistration.findByPk(id)
//     });
//   } catch (error) {
//     console.error("Error updating accommodation:", error);
//     return res.status(500).json({
//       status: "500",
//       message: "An error occurred while updating accommodation details",
//       error: error.message
//     });
//   }
// };


exports.updateAccommodation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      hotelName,
      hotelLocation,
      roomNumber,
      familyMemberRelation,
      familyMemberName,
      otherRelation,
      travelerName,
      alternateMobile,
      expectedArrivalDateTime
    } = req.body;
    
    // Validate required fields
    if (!hotelName || !hotelLocation || !roomNumber) {
      return res.status(400).json({
        status: "400",
        message: "Hotel name, location, and room number are required"
      });
    }
    
    // Additional validation for family member if provided
    if (familyMemberRelation && !familyMemberName) {
      return res.status(400).json({
        status: "400",
        message: "Family member name is required when relation is specified"
      });
    }
    
    if (familyMemberRelation === 'Other' && !otherRelation) {
      return res.status(400).json({
        status: "400",
        message: "Please specify the relation when 'Other' is selected"
      });
    }
    
    // Validate mobile number format if provided
    if (alternateMobile && !/^[6-9]\d{9}$/.test(alternateMobile)) {
      return res.status(400).json({
        status: "400",
        message: "Please provide a valid 10-digit Indian mobile number"
      });
    }
    
    // Find registration
    const registration = await TravelRegistration.findByPk(id);
    
    if (!registration) {
      return res.status(404).json({
        status: "404",
        message: "Registration not found"
      });
    }
    
    // Prepare update data
    const updateData = {
      hotelName,
      hotelLocation,
      roomNumber,
      familyMemberRelation: familyMemberRelation || null,
      familyMemberName: familyMemberName || null,
      otherRelation: familyMemberRelation === 'Other' ? otherRelation : null,
      // Set to confirmed if it was pending
      status: registration.status === 'Pending' ? 'Confirmed' : registration.status
    };
    
    // Add optional fields only if they're provided
    if (travelerName !== undefined) {
      updateData.travelerName = travelerName;
    }
    
    if (alternateMobile !== undefined) {
      updateData.alternateMobile = alternateMobile;
    }
    
    if (expectedArrivalDateTime !== undefined) {
      updateData.expectedArrivalDateTime = expectedArrivalDateTime;
    }
    
    // Update registration
    await registration.update(updateData);
    
    return res.status(200).json({
      status: "200",
      message: "Accommodation details updated successfully",
      data: await TravelRegistration.findByPk(id)
    });
  } catch (error) {
    console.error("Error updating accommodation:", error);
    return res.status(500).json({
      status: "500",
      message: "An error occurred while updating accommodation details",
      error: error.message
    });
  }
};



// Update registration status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!status || !['Confirmed', 'Pending', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        status: "400",
        message: "Invalid status. Must be Confirmed, Pending, or Cancelled"
      });
    }
    
    // Find registration
    const registration = await TravelRegistration.findByPk(id);
    
    if (!registration) {
      return res.status(404).json({
        status: "404",
        message: "Registration not found"
      });
    }
    
    // Update status
    await registration.update({ status });
    
    return res.status(200).json({
      status: "200",
      message: "Registration status updated successfully",
      data: await TravelRegistration.findByPk(id)
    });
  } catch (error) {
    console.error("Error updating registration status:", error);
    return res.status(500).json({
      status: "500",
      message: "An error occurred while updating registration status",
      error: error.message
    });
  }
};

// Get registration by ID
exports.getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const registration = await TravelRegistration.findByPk(id);
    
    if (!registration) {
      return res.status(404).json({
        status: "404",
        message: "Registration not found"
      });
    }
    
    return res.status(200).json({
      status: "200",
      message: "Registration retrieved successfully",
      data: registration
    });
  } catch (error) {
    console.error("Error fetching registration:", error);
    return res.status(500).json({
      status: "500",
      message: "An error occurred while fetching registration",
      error: error.message
    });
  }
};






// API function to download travel registrations as Excel
  // exports.downloadRegistrationsExcel = async (req, res) => {
  //   try {
  //     // Fetch all registrations
  //     const registrations = await TravelRegistration.findAll({
  //       order: [['registrationDate', 'DESC']],
  //       raw: true
  //     });

  //     // Create a new Excel workbook and worksheet
  //     const workbook = new ExcelJS.Workbook();
  //     const worksheet = workbook.addWorksheet('Registrations');

  //     // Define columns for the Excel file
  //     worksheet.columns = [
  //       { header: 'Registration #', key: 'registrationNumber', width: 15 },
  //       { header: 'Status', key: 'status', width: 12 },
  //       { header: 'Partner Name', key: 'partnerName', width: 20 },
  //       { header: 'Partner Code', key: 'partnerCode', width: 15 },
  //       { header: 'Mobile Number', key: 'mobileNumber', width: 15 },
  //       { header: 'Location', key: 'location', width: 20 },
  //       { header: 'Type', key: 'type', width: 10 },
  //       { header: 'Traveler Name', key: 'travelerName', width: 20 },
  //       { header: 'Alternate Mobile', key: 'alternateMobile', width: 15 },
  //       { header: 'T-Shirt Size', key: 'tShirtSize', width: 12 },
  //       { header: 'Travel Mode', key: 'travelMode', width: 12 },
  //       { header: 'Expected Arrival (IST)', key: 'expectedArrivalDateTime', width: 25 },
  //       { header: 'Hotel Name', key: 'hotelName', width: 20 },
  //       { header: 'Hotel Location', key: 'hotelLocation', width: 20 },
  //       { header: 'Room Number', key: 'roomNumber', width: 12 },
  //       { header: 'Family Member Name', key: 'familyMemberName', width: 20 },
  //       { header: 'Family Member Relation', key: 'familyMemberRelation', width: 20 },
  //       { header: 'Other Relation', key: 'otherRelation', width: 15 },
  //       { header: 'Registration Date (IST)', key: 'registrationDate', width: 25 },
  //       { header: 'Last Updated (IST)', key: 'lastUpdated', width: 25 }
  //     ];

  //     // Style the header row
  //     worksheet.getRow(1).font = { bold: true };
  //     worksheet.getRow(1).fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FFD3D3D3' } // Light grey background
  //     };

  //     // Process and add each registration to the worksheet
  //     if (registrations && registrations.length > 0) {
  //       registrations.forEach(registration => {
  //         // Convert non-English characters to English where needed
  //         const processedRegistration = {
  //           ...registration,
  //           // Transliterate names to ensure they're in English characters
  //           partnerName: transliteration.transliterate(registration.partnerName || ''),
  //           travelerName: transliteration.transliterate(registration.travelerName || ''),
  //           familyMemberName: transliteration.transliterate(registration.familyMemberName || ''),
            
  //           // Convert UTC dates to IST (Indian Standard Time)
  //           expectedArrivalDateTime: registration.expectedArrivalDateTime ? 
  //             moment(registration.expectedArrivalDateTime).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss') : '',
  //           registrationDate: registration.registrationDate ? 
  //             moment(registration.registrationDate).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss') : '',
  //           lastUpdated: registration.lastUpdated ? 
  //             moment(registration.lastUpdated).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss') : ''
  //         };

  //         // Add the processed data to the worksheet
  //         worksheet.addRow(processedRegistration);
  //       });
  //     }

  //     // Auto-filter for all columns
  //     worksheet.autoFilter = {
  //       from: { row: 1, column: 1 },
  //       to: { row: 1, column: worksheet.columns.length }
  //     };

  //     // Set filename with current date for better organization
  //     const currentDate = moment().format('YYYY-MM-DD');
  //     const filename = `PoultryRegistrations_${currentDate}.xlsx`;

  //     // Set response headers for file download
  //     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  //     res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  //     res.setHeader('Cache-Control', 'no-cache');

  //     // Write the workbook to the response
  //     await workbook.xlsx.write(res);
  //     res.end();
      
  //   } catch (error) {
  //     console.error("Error generating Excel:", error);
      
  //     // Send a simple error page instead of JSON for browser access
  //     res.status(500).send(`
  //       <html>
  //         <head><title>Error Downloading Excel</title></head>
  //         <body>
  //           <h1>Error Downloading Excel</h1>
  //           <p>Sorry, there was an error generating the Excel file: ${error.message}</p>
  //           <p><a href="javascript:history.back()">Go Back</a></p>
  //         </body>
  //       </html>
  //     `);
  //   }
  // };


  exports.downloadRegistrationsExcel = async (req, res) => {
    try {
      // Fetch all registrations
      const registrations = await TravelRegistration.findAll({
        order: [['registrationDate', 'ASC']],
        raw: true
      });
  
      // Create a new Excel workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Registrations');
  
      // Define columns for the Excel file - removed tShirtSize, familyMemberName, 
      // familyMemberRelation, otherRelation, and moved status to the end
      worksheet.columns = [
        { header: 'Registration #', key: 'registrationNumber', width: 15 },
        { header: 'Partner Name', key: 'partnerName', width: 20 },
        { header: 'Partner Code', key: 'partnerCode', width: 15 },
        { header: 'Mobile Number', key: 'mobileNumber', width: 15 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Traveler Name', key: 'travelerName', width: 20 },
        { header: 'Alternate Mobile', key: 'alternateMobile', width: 15 },
        { header: 'Travel Mode', key: 'travelMode', width: 12 },
        { header: 'Expected Arrival (IST)', key: 'expectedArrivalDateTime', width: 25 },
        { header: 'Hotel Name', key: 'hotelName', width: 20 },
        { header: 'Hotel Location', key: 'hotelLocation', width: 20 },
        { header: 'Room Number', key: 'roomNumber', width: 12 },
        { header: 'Registration Date (IST)', key: 'registrationDate', width: 25 },
        { header: 'Last Updated (IST)', key: 'lastUpdated', width: 25 },
        { header: 'Status', key: 'status', width: 12 } // Moved status to the end
      ];
  
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' } // Light grey background
      };
  
      // Process and add each registration to the worksheet
      if (registrations && registrations.length > 0) {
        registrations.forEach(registration => {
          // Convert non-English characters to English where needed
          const processedRegistration = {
            ...registration,
            // Transliterate names to ensure they're in English characters
            partnerName: transliteration.transliterate(registration.partnerName || ''),
            travelerName: transliteration.transliterate(registration.travelerName || ''),
            
            // Convert UTC dates to IST (Indian Standard Time)
            expectedArrivalDateTime: registration.expectedArrivalDateTime ? 
              moment(registration.expectedArrivalDateTime).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss') : '',
            registrationDate: registration.registrationDate ? 
              moment(registration.registrationDate).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss') : '',
            lastUpdated: registration.lastUpdated ? 
              moment(registration.lastUpdated).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss') : ''
          };
  
          // Add the processed data to the worksheet
          worksheet.addRow(processedRegistration);
        });
      }
  
      // Auto-filter for all columns
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columns.length }
      };
  
      // Set filename with current date for better organization
      const currentDate = moment().format('YYYY-MM-DD');
      const filename = `PoultryRegistrations_${currentDate}.xlsx`;
  
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Cache-Control', 'no-cache');
  
      // Write the workbook to the response
      await workbook.xlsx.write(res);
      res.end();
      
    } catch (error) {
      console.error("Error generating Excel:", error);
      
      // Send a simple error page instead of JSON for browser access
      res.status(500).send(`
        <html>
          <head><title>Error Downloading Excel</title></head>
          <body>
            <h1>Error Downloading Excel</h1>
            <p>Sorry, there was an error generating the Excel file: ${error.message}</p>
            <p><a href="javascript:history.back()">Go Back</a></p>
          </body>
        </html>
      `);
    }
  };


// exports.downloadRegistrationsExcel = async (req, res) => {
//   try {
//     const travelRegistrations = await TravelRegistration.findAll({
//       include: [
//         {
//           model: RegisteredPartner,
//           attributes: ['mobileNumber', 'partnerName', 'partnerCode', 'location']
//         }
//       ]
//     });

//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Travel Registrations');

//     worksheet.columns = [
//       { header: 'Registration Number', key: 'registrationNumber', width: 20 },
//       { header: 'Mobile Number', key: 'mobileNumber', width: 15 },
//       { header: 'Partner Name', key: 'partnerName', width: 25 },
//       { header: 'Partner Code', key: 'partnerCode', width: 15 },
//       { header: 'Location', key: 'location', width: 20 },
//       { header: 'Type', key: 'type', width: 10 },
//       { header: 'Traveler Name', key: 'travelerName', width: 25 },
//       { header: 'Alternate Mobile', key: 'alternateMobile', width: 15 },
//       { header: 'T-Shirt Size', key: 'tShirtSize', width: 10 },
//       { header: 'Travel Mode', key: 'travelMode', width: 10 },
//       { header: 'Expected Arrival', key: 'expectedArrivalDateTime', width: 20 },
//       { header: 'Hotel Name', key: 'hotelName', width: 25 },
//       { header: 'Hotel Location', key: 'hotelLocation', width: 25 },
//       { header: 'Room Number', key: 'roomNumber', width: 15 },
//       { header: 'Family Member Relation', key: 'familyMemberRelation', width: 25 },
//       { header: 'Family Member Name', key: 'familyMemberName', width: 25 },
//       { header: 'Other Relation', key: 'otherRelation', width: 25 },
//       { header: 'Status', key: 'status', width: 15 },
//       { header: 'Registration Date', key: 'registrationDate', width: 20 }
//     ];

//     travelRegistrations.forEach(registration => {
//       const travelerName = registration.travelerName.replace(/[^A-Za-z0-9]/g, '');
//       const expectedArrival = moment(registration.expectedArrivalDateTime).utcOffset("+05:30").format('DD-MM-YYYY HH:mm');

//       worksheet.addRow({
//         registrationNumber: registration.registrationNumber,
//         mobileNumber: registration.mobileNumber,
//         partnerName: registration.RegisteredPartner.partnerName,
//         partnerCode: registration.RegisteredPartner.partnerCode,
//         location: registration.RegisteredPartner.location,
//         type: registration.type,
//         travelerName: travelerName,
//         alternateMobile: registration.alternateMobile,
//         tShirtSize: registration.tShirtSize,
//         travelMode: registration.travelMode,
//         expectedArrivalDateTime: expectedArrival,
//         hotelName: registration.hotelName,
//         hotelLocation: registration.hotelLocation,
//         roomNumber: registration.roomNumber,
//         familyMemberRelation: registration.familyMemberRelation,
//         familyMemberName: registration.familyMemberName,
//         otherRelation: registration.otherRelation,
//         status: registration.status,
//         registrationDate: moment(registration.registrationDate).format('DD-MM-YYYY HH:mm')
//       });
//     });

//     res.setHeader(
//       'Content-Type',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     );
//     res.setHeader(
//       'Content-Disposition',
//       'attachment; filename=travel_registrations.xlsx'
//     );

//     await workbook.xlsx.write(res);
//     res.end();

//   } catch (error) {
//     console.error('Error downloading travel registrations:', error);
//     res.status(500).json({
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

