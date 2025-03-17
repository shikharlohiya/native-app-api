const RegisteredPartner = require('../../models/RegisteredPartner');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const TravelRegistration = require('../../models/TravelRegistration');
const { Op } = require('sequelize');
 

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
       const { mobileNumber, partnerName, partnerCode, location } = partner;
       
       if (!mobileNumber || !partnerName || !partnerCode || !location) {
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
       location: String(partner.location)
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
             partnerCode: partner.partnerCode, // Note: This will update even the partner code
             location: partner.location
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
exports.createTravelRegistration = async (req, res) => {
  try {
    const { 
      mobileNumber, 
      travelerName,
      alternateMobile,
      // tShirtSize,
      travelMode,
      expectedArrivalDateTime,
      agreedToTerms
    } = req.body;

    // Validate required fields
    if (!mobileNumber || !travelerName || !alternateMobile  || 
        !travelMode || !expectedArrivalDateTime || agreedToTerms !== true) {
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

    // Generate registration number
    const registrationNumber = generateRegistrationNumber(registeredPartner);

    // Create travel registration
    const travelRegistration = await TravelRegistration.create({
      registrationNumber,
      mobileNumber,
      partnerName: registeredPartner.partnerName,
      partnerCode: registeredPartner.partnerCode,
      location: registeredPartner.location,
      travelerName,
      alternateMobile,
      // tShirtSize,
      travelMode,
      expectedArrivalDateTime: formattedDateTime,
      agreedToTerms
    });

    return res.status(201).json({
      status: "201",
      message: "Travel registration successful",
      data: {
        registrationNumber: travelRegistration.registrationNumber,
        partnerDetails: {
          mobileNumber: travelRegistration.mobileNumber,
          partnerName: travelRegistration.partnerName,
          partnerCode: travelRegistration.partnerCode,
          location: travelRegistration.location
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

exports.getAllTravelRegistrations = async (req, res) => {
  try {
    // Extract query parameters
    const { status, search, page = 1, limit = 10 } = req.query;
    
    // Build query conditions
    const whereConditions = {};
    
    // Filter by status if provided
    if (status && ['Confirmed', 'Pending', 'Cancelled'].includes(status)) {
      whereConditions.status = status;
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
      order: [['registrationDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    return res.status(200).json({
      status: "200",
      message: "Travel registrations retrieved successfully",
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
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
exports.updateAccommodation = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      hotelName, 
      hotelLocation, 
      roomNumber, 
      familyMemberRelation,
      familyMemberName,
      otherRelation
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
    
    // Find registration
    const registration = await TravelRegistration.findByPk(id);
    
    if (!registration) {
      return res.status(404).json({
        status: "404",
        message: "Registration not found"
      });
    }
    
    // Update registration
    await registration.update({
      hotelName,
      hotelLocation,
      roomNumber,
      familyMemberRelation: familyMemberRelation || null,
      familyMemberName: familyMemberName || null,
      otherRelation: familyMemberRelation === 'Other' ? otherRelation : null,
      // Set to confirmed if it was pending
      status: registration.status === 'Pending' ? 'Confirmed' : registration.status
    });
    
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