const { ShrimpFeedMaster, ShrimpFeedRemark } = require('../../models/associations');
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `shrimp_feed_${Date.now()}${path.extname(file.originalname)}`);
    }
});

exports.upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.xlsx', '.xls'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'));
        }
    }
}).single('file');



// exports.createShrimpFeedRemark = async (req, res) => {
//     try {
//         const {
//             type,
//             prospectFarmerCategory,
//             name,
//             mobileNumber,
//             pondLocation,
//             district,
//             postalCode,
//             state,
//             fishSpecies,
//             numberOfPonds,
//             pondAreaInAcres,
//             currentFeedUsed,
//             isStocking,
//             stockingDensity,
//             daysOfCulture,
//             isHarvesting,
//             harvestingQuantity,
//             potentialityInMT,
//             status,
//             followUpDate,
//             purpose,
//             remarks
//         } = req.body;

//         // Check if the mobile number exists in master table
//         const masterRecord = await ShrimpFeedMaster.findOne({
//             where: { mobileNo: mobileNumber }
//         });

//         if (!masterRecord) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Mobile number not found in master records"
//             });
//         }

//         const shrimpFeedRemark = await ShrimpFeedRemark.create({
//             type,
//             prospectFarmerCategory,
//             name,
//             mobileNumber,
//             pondLocation,
//             district,
//             postalCode,
//             state,
//             fishSpecies,
//             numberOfPonds,
//             pondAreaInAcres,
//             currentFeedUsed,
//             isStocking,
//             stockingDensity,
//             daysOfCulture,
//             isHarvesting,
//             harvestingQuantity,
//             potentialityInMT,
//             status,
//             followUpDate,
//             purpose,
//             remarks
//         });

//         res.status(201).json({
//             success: true,
//             message: "Shrimp feed remark created successfully",
//             data: shrimpFeedRemark
//         });

//     } catch (error) {
//         console.error("Error creating shrimp feed remark:", error);
//         res.status(500).json({
//             success: false,
//             message: "Error creating shrimp feed remark",
//             error: error.message
//         });
//     }
// };






exports.createShrimpFeedRemark = async (req, res) => {
    try {
        const {
            type,
            prospectFarmerCategory,
            name,
            mobileNumber,
            pondLocation,
            district,
            postalCode,
            state,
            fishSpecies,
            numberOfPonds,
            pondAreaInAcres,
            currentFeedUsed,
            isStocking,
            stockingDensity,
            daysOfCulture,
            isHarvesting,
            harvestingQuantity,
            potentialityInMT,
            status,
            followUpDate,
            purpose,
            remarks
        } = req.body;
        
        // Check if the mobile number exists in master table
        const masterRecord = await ShrimpFeedMaster.findOne({
            where: { mobileNo: mobileNumber }
        });
        
        if (!masterRecord) {
            return res.status(404).json({
                success: false,
                message: "Mobile number not found in master records"
            });
        }
        
        // Create the remark record
        const shrimpFeedRemark = await ShrimpFeedRemark.create({
            type,
            prospectFarmerCategory,
            name,
            mobileNumber,
            pondLocation,
            district,
            postalCode,
            state,
            fishSpecies,
            numberOfPonds,
            pondAreaInAcres,
            currentFeedUsed,
            isStocking,
            stockingDensity,
            daysOfCulture,
            isHarvesting,
            harvestingQuantity,
            potentialityInMT, //
            status,
            followUpDate,
            purpose,
            agentRemarks: remarks,
            callId: req.body.callId,
            callType: req.body.callType
        });
        
        // Update the master record with the current date and status
        await masterRecord.update({
            lastActionDate: new Date().toISOString(),
            status: status || masterRecord.status // Use the new status if provided, otherwise keep existing
        });
        
        res.status(201).json({
            success: true,
            message: "Shrimp feed remark created successfully",
            data: shrimpFeedRemark
        });
        
    } catch (error) {
        console.error("Error creating shrimp feed remark:", error);
        res.status(500).json({
            success: false,
            message: "Error creating shrimp feed remark",
            error: error.message
        });
    }
};

 


exports.getShrimpFeedDetails = async (req, res) => {
    try {
        const { mobileNumber } = req.params;

        const shrimpFeedDetails = await ShrimpFeedMaster.findOne({
            where: { mobileNo: mobileNumber },
            include: [{
                model: ShrimpFeedRemark,
                as: 'feedRemarks',  // Changed from 'remarks' to 'feedRemarks'
                separate: true,
                order: [['createdAt', 'DESC']]
            }]
        });

        if (!shrimpFeedDetails) {
            return res.status(404).json({
                success: false,
                message: "No records found for this mobile number"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                masterDetails: shrimpFeedDetails,
                remarkCount: shrimpFeedDetails.feedRemarks.length,  // Changed from remarks to feedRemarks
                latestRemark: shrimpFeedDetails.feedRemarks[0] || null  // Changed from remarks to feedRemarks
            }
        });

    } catch (error) {
        console.error("Error fetching shrimp feed details:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching shrimp feed details",
            error: error.message
        });
    }
};




exports.getAllShrimpFeedRemarks = async (req, res) => {
    try {
        const { mobileNumber } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        const remarks = await ShrimpFeedRemark.findAndCountAll({
            where: { mobileNumber },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            success: true,
            data: {
                remarks: remarks.rows,
                totalCount: remarks.count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(remarks.count / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching shrimp feed remarks:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching shrimp feed remarks",
            error: error.message
        });
    }
};




// exports.uploadShrimpFeedMaster = async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Please upload an Excel file"
//             });
//         }

//         const workbook = XLSX.readFile(req.file.path);
//         const sheetName = workbook.SheetNames[0];
//         const sheet = workbook.Sheets[sheetName];
//         const data = XLSX.utils.sheet_to_json(sheet);

//         if (data.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Excel file is empty"
//             });
//         }

//         // Get all existing mobile numbers
//         const existingMobileNumbers = new Set(
//             (await ShrimpFeedMaster.findAll({
//                 attributes: ['mobileNo'],
//                 raw: true
//             })).map(record => record.mobileNo)
//         );

//         const results = {
//             success: [],
//             failed: [],
//             duplicates: []
//         };

//         // Find the mobile number column
//         const firstRow = data[0];
//         const mobileNumberColumn = Object.keys(firstRow).find(key => 
//             key.toLowerCase().includes('mobile') || 
//             key.toLowerCase().includes('phone') ||
//             key.toLowerCase().includes('contact')
//         );

//         if (!mobileNumberColumn) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Could not find mobile number column in Excel"
//             });
//         }

//         for (const row of data) {
//             const mobileNo = String(row[mobileNumberColumn]).trim();

//             // Skip if mobile number is empty or invalid
//             if (!mobileNo || mobileNo.length < 10) {
//                 results.failed.push({
//                     row,
//                     reason: "Invalid mobile number"
//                 });
//                 continue;
//             }

//             // Check for duplicates
//             if (existingMobileNumbers.has(mobileNo)) {
//                 results.duplicates.push({
//                     row,
//                     reason: "Mobile number already exists"
//                 });
//                 continue;
//             }

//             try {
//                 // Create record with dynamic mapping
//                 const recordData = {
//                     mobileNo,
//                     // Map other fields dynamically
//                     ...Object.entries(row).reduce((acc, [key, value]) => {
//                         // Convert Excel column names to model field names
//                         const fieldName = key.toLowerCase()
//                             .replace(/\s+/g, '_')
//                             .replace(/[^a-z0-9_]/g, '');

//                         // Only include non-null values
//                         if (value != null) {
//                             acc[fieldName] = value;
//                         }
//                         return acc;
//                     }, {})
//                 };

//                 const newRecord = await ShrimpFeedMaster.create(recordData);
//                 existingMobileNumbers.add(mobileNo);
//                 results.success.push({
//                     mobileNo,
//                     id: newRecord.id
//                 });
//             } catch (error) {
//                 results.failed.push({
//                     row,
//                     reason: error.message
//                 });
//             }
//         }

//         // Clean up uploaded file
//         fs.unlinkSync(req.file.path);

//         res.status(200).json({
//             success: true,
//             message: "File processed successfully",
//             summary: {
//                 total: data.length,
//                 successful: results.success.length,
//                 failed: results.failed.length,
//                 duplicates: results.duplicates.length
//             },
//             details: results
//         });

//     } catch (error) {
//         // Clean up uploaded file if it exists
//         if (req.file && fs.existsSync(req.file.path)) {
//             fs.unlinkSync(req.file.path);
//         }

//         console.error("Error processing Excel file:", error);
//         res.status(500).json({
//             success: false,
//             message: "Error processing Excel file",
//             error: error.message
//         });
//     }
// };


exports.uploadShrimpFeedMaster = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an Excel file"
            });
        }

        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Excel file is empty"
            });
        }

        // Get all existing mobile numbers
        const existingMobileNumbers = new Set(
            (await ShrimpFeedMaster.findAll({
                attributes: ['mobileNo'],
                raw: true
            })).map(record => record.mobileNo)
        );

        const results = {
            success: [],
            failed: [],
            duplicates: []
        };

        for (const row of data) {
            // Get mobile number from "Mobile No 1" field
            const mobileNo = row['Mobile No 1']?.toString();

            if (!mobileNo) {
                results.failed.push({
                    row,
                    reason: "Mobile number is required"
                });
                continue;
            }

            // Check for duplicates
            if (existingMobileNumbers.has(mobileNo)) {
                results.duplicates.push({
                    mobileNo,
                    row
                });
                continue;
            }

            try {
                // Map Excel fields to database fields
                const recordData = {
                    farmerCode: row['Farmer Code'],
                    businessUnit: row['Bussiness Unit'],
                    name: row['Name 1'],
                    farmerType: row['Old/New Farmer'] || row['Farmer Type'],
                    feedType: row['Feed Type'],
                    remarks: row['Remarks'],
                    mobileNo: mobileNo,
                    district: row['District'],
                    postalCode: row['PostalCode']?.toString(),
                    farmerVillage: row['Farmer Village'],
                    state: row['State'],
                    region: row['Region'],
                    shrimpZone: row['Shrimp--Zone'],
                    dealerCode: row['Dealer Code'],
                    dealerName: row['Dealer Name'],
                    dealerType: row['Dealer Type'],
                    enteredBy: row['Enter by'],
                    latitudeValue: row['Latitude Value'] ? parseFloat(row['Latitude Value']) : null,
                    longitudeValue: row['Longitude Value'] ? parseFloat(row['Longitude Value']) : null,
                    prospectFarmerInd: row['Prospect Farmer Ind.'] === 'Yes',
                    employeeCode: row['Employee Code'],
                    feedGodownCapacity: row['Feed godown capacity']?.toString()
                };

                // Remove null or undefined values
                Object.keys(recordData).forEach(key => 
                    (recordData[key] === null || recordData[key] === undefined) && delete recordData[key]
                );

                const newRecord = await ShrimpFeedMaster.create(recordData);
                existingMobileNumbers.add(mobileNo);
                results.success.push({
                    mobileNo,
                    id: newRecord.id
                });
            } catch (error) {
                results.failed.push({
                    row,
                    reason: error.message
                });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            message: "File processed successfully",
            summary: {
                total: data.length,
                successful: results.success.length,
                failed: results.failed.length,
                duplicates: results.duplicates.length
            },
            details: results
        });

    } catch (error) {
        // Clean up uploaded file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        console.error("Error processing Excel file:", error);
        res.status(500).json({
            success: false,
            message: "Error processing Excel file",
            error: error.message
        });
    }
};


// Add validation helper function
exports.validateExcelFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an Excel file"
            });
        }

        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        // Get column headers
        const headers = Object.keys(data[0] || {});

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            message: "File structure validated successfully",
            data: {
                totalRows: data.length,
                columns: headers,
                sampleRow: data[0] || {}
            }
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: "Error validating Excel file",
            error: error.message
        });
    }
};





/**
 * Get all ShrimpFeedMaster records with pagination
 * @route GET /api/shrimp-feed-masters
 * @access Public
 */
exports.getAllShrimpFeedMasters = async (req, res) => {
    try {
        // Extract query parameters with defaults
        const { 
            page = 1, 
            limit = 10,
            sortBy = 'createdAt',
            order = 'DESC',
            mobileNo,
            dealerCode,
            employeeCode,
            region,
            state,
            district,
            farmerType,
            status
        } = req.query;

        // Calculate offset for pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Build where clause based on provided filters
        const whereClause = {};
        
        if (mobileNo) whereClause.mobileNo = mobileNo;
        if (dealerCode) whereClause.dealerCode = dealerCode;
        if (employeeCode) whereClause.employeeCode = employeeCode;
        if (region) whereClause.region = region;
        if (state) whereClause.state = state;
        if (district) whereClause.district = district;
        if (farmerType) whereClause.farmerType = farmerType;
        if (status) whereClause.status = status;

        // Fetch data with pagination and filtering
        const shrimpFeedMasters = await ShrimpFeedMaster.findAndCountAll({
            where: whereClause,
            order: [[sortBy, order]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Send response
        res.status(200).json({
            success: true,
            data: {
                records: shrimpFeedMasters.rows,
                totalCount: shrimpFeedMasters.count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(shrimpFeedMasters.count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("Error fetching shrimp feed masters:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching shrimp feed masters",
            error: error.message
        });
    }
};

