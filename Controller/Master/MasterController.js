const Parivartan_Region = require('../../models/Parivartan_Region');
const Parivartan_BDM = require('../../models/Parivartan_BDM');
const Campaign = require('../../models/campaign');
const sequelize = require("../../models/index");
const fs = require('fs');

// Get all regions
exports.getAllRegions = async (req, res) => {
  try {
    const regions = await Parivartan_Region.findAll({
      where: {
        Deleted: 'N'
      },
      attributes: ['RegionId', 'RegionName'], 
    });

    if (!regions.length) {
      return res.status(404).json({ 
        message: "No regions found" 
      });
    }

    res.status(200).json({
      message: "Regions fetched successfully",
      data: regions
    });
  } catch (error) {
    console.error("Error fetching regions:", error);
    res.status(500).json({ 
      message: "Internal server error" 
    });
  }
};

//get all zonal manager 
exports.getZonalManagers = async (req, res) => {
    try {
      const zonalManagers = await Parivartan_BDM.findAll({
        where: {
          is_zonal_manager: 'Yes',
          Deleted: 'N'
        },
        attributes: ['EmployeeId', 'EmployeeName', 'is_active'],
        include: [{
          model: Parivartan_Region,
          attributes: ['RegionId', 'RegionName'],
          where: {
            Deleted: 'N'
          }
        }]
      });
  
      if (!zonalManagers.length) {
        return res.status(404).json({
          success: false,
          message: "No zonal managers found"
        });
      }
  
      // Format the response data
      const formattedData = zonalManagers.map(manager => ({
        employeeId: manager.EmployeeId,
        employeeName: manager.EmployeeName,
        regionId: manager.parivartan_region.RegionId,
        regionName: manager.parivartan_region.RegionName,
        isActive: manager.is_active
      }));
  
      res.status(200).json({
        success: true,
        message: "Zonal managers fetched successfully",
        data: formattedData
      });
  
    } catch (error) {
      console.error("Error fetching zonal managers:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

 

exports.addZonalManager = async (req, res) => {
    const transaction = await sequelize.transaction();
  
    try {
      const {
        EmployeeId,
        EmployeeName,
        RegionIds // Changed to accept an array of region IDs
      } = req.body;
  
      // Validate required fields
      if (!EmployeeId || !EmployeeName || !RegionIds || !Array.isArray(RegionIds) || RegionIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "EmployeeId, EmployeeName, and at least one RegionId are required"
        });
      }
  
      // Validate all regions
      const validRegions = await Parivartan_Region.findAll({
        where: {
          RegionId: RegionIds,
          Deleted: 'N'
        },
        transaction
      });
  
      // Check if all provided regions are valid
      if (validRegions.length !== RegionIds.length) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "One or more Region IDs are invalid"
        });
      }
  
      // Check for existing entries
      const existingEntries = await Parivartan_BDM.findAll({
        where: {
          EmployeeId: EmployeeId,
          RegionId: RegionIds
        },
        transaction
      });
  
      // If any region is already assigned, prevent duplicate
      if (existingEntries.length > 0) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: "One or more regions are already assigned to this employee",
          duplicateRegions: existingEntries.map(entry => entry.RegionId)
        });
      }
  
      // Prepare bulk create data
      const zonalManagersToCreate = RegionIds.map(RegionId => ({
        EmployeeId,
        EmployeeName,
        RegionId,
        Deleted: 'N',
        is_active: 'Active',
        is_zonal_manager: 'Yes'
      }));
  
      // Bulk create zonal managers
      const newZonalManagers = await Parivartan_BDM.bulkCreate(
        zonalManagersToCreate,
        { transaction }
      );
  
      // Commit transaction
      await transaction.commit();
  
      // Format response
      const formattedResponse = newZonalManagers.map(manager => ({
        employeeId: manager.EmployeeId,
        employeeName: manager.EmployeeName,
        regionId: manager.RegionId,
        isActive: manager.is_active,
        isZonalManager: manager.is_zonal_manager
      }));
  
      res.status(201).json({
        success: true,
        message: "Zonal managers added successfully",
        data: formattedResponse
      });
  
    } catch (error) {
      // Rollback transaction if it hasn't been committed
      if (transaction) await transaction.rollback();
  
      console.error("Error adding zonal managers:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };


  exports.updateZonalManagerStatus = async (req, res) => {
    try {
      const { 
        EmployeeId, 
        RegionId,  // Optional: to update specific region
        is_active  // 'Active' or 'Inactive'
      } = req.body;
  
      // Validate required fields
      if (!EmployeeId || !is_active) {
        return res.status(400).json({
          success: false,
          message: "EmployeeId and is_active status are required"
        });
      }
  
      // Validate is_active value
      if (!['Active', 'Inactive'].includes(is_active)) {
        return res.status(400).json({
          success: false,
          message: "is_active must be either 'Active' or 'Inactive'"
        });
      }
  
      // Prepare where condition
      const whereCondition = {
        EmployeeId: EmployeeId,
        is_zonal_manager: 'Yes',
        Deleted: 'N'
      };
  
      // Add RegionId to condition if provided
      if (RegionId) {
        whereCondition.RegionId = RegionId;
      }
  
      // Find existing zonal manager entries
      const existingEntries = await Parivartan_BDM.findAll({
        where: whereCondition
      });
  
      // Check if any entries exist
      if (existingEntries.length === 0) {
        return res.status(404).json({
          success: false,
          message: RegionId 
            ? "No zonal manager found for the given Employee ID and Region ID" 
            : "No zonal manager found for the given Employee ID"
        });
      }
  
      // Update status
      const [updatedCount] = await Parivartan_BDM.update(
        { is_active: is_active },
        { 
          where: whereCondition 
        }
      );
  
      // Fetch updated entries to return in response
      const updatedEntries = await Parivartan_BDM.findAll({
        where: whereCondition,
        attributes: ['EmployeeId', 'EmployeeName', 'RegionId', 'is_active']
      });
  
      res.status(200).json({
        success: true,
        message: `Zonal manager status updated successfully`,
        data: updatedEntries.map(entry => ({
          employeeId: entry.EmployeeId,
          employeeName: entry.EmployeeName,
          regionId: entry.RegionId,
          isActive: entry.is_active
        })),
        updatedCount: updatedCount
      });
  
    } catch (error) {
      console.error("Error updating zonal manager status:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };



//list of all the zonal manager if the zonal manager is yes 




//campaign list------> <---------------------------------------------
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      attributes: ['CampaignId', 'CampaignName']
    });

    if (!campaigns.length) {
      return res.status(404).json({
        message: "No campaigns found"
      });
    }

    res.status(200).json({
      message: "Campaigns fetched successfully",
      data: campaigns
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};




const XLSX = require('xlsx');
const { Op } = require('sequelize');
 
const Parivartan_Branch = require('../../models/Parivartan_Branch');
 

 /**
 * Upload branch data from Excel file with flexible column header mapping
 * @param {Request} req - Express request object with file from multer
 * @param {Response} res - Express response object
 */
exports.uploadBranchData = async (req, res) => {
  try {
    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({
        message: 'Please upload an Excel file'
      });
    }

    const file = req.file;
    // Read the Excel file with header row included
    const workbook = XLSX.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Read raw data with headers
    const data = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null });

    // Debug: Print the headers to see what we're working with
    if (data.length > 0) {
      console.log("Column headers detected in Excel:", Object.keys(data[0]));
    } else {
      return res.status(400).json({
        message: 'Excel file contains no data'
      });
    }

    // Possible variations of column headers for flexible mapping
    const possibleHeaderMappings = {
      branchCode: ['Branch Code', 'BranchCode', 'Branch_Code', 'Branchcode', 'BRANCH CODE', 'branch_code', 'branch code'],
      branch: ['Branch', 'BranchName', 'Branch Name', 'Branch_Name', 'BRANCH', 'branch', 'branch name'],
      regionId: ['RegionId', 'Region Id', 'Region_Id', 'REGIONID', 'region_id', 'region id', 'Region Name', 'RegionName'],
      zone: ['Zone', 'ZONE', 'zone'],
      ro: ['RO', 'R.O.', 'Regional Office', 'ro', 'regional office'],
      deleted: ['Deleted', 'IsDeleted', 'Is_Deleted', 'Status', 'deleted', 'isdeleted']
    };

    // Find actual column headers in the Excel file
    const headerMapping = {};
    if (data.length > 0) {
      const excelHeaders = Object.keys(data[0]);
      
      // For each field we need, find the matching Excel column header
      for (const [field, possibleHeaders] of Object.entries(possibleHeaderMappings)) {
        const matchedHeader = excelHeaders.find(header => 
          possibleHeaders.includes(header)
        );
        headerMapping[field] = matchedHeader;
      }
      
      console.log("Mapped headers:", headerMapping);
    }

    // Check if we found the branch column, which is required
    if (!headerMapping.branch) {
      return res.status(400).json({
        message: 'Could not find the Branch column in the Excel file. Please ensure your Excel has one of these headers: ' + 
                possibleHeaderMappings.branch.join(', ')
      });
    }

    const updatedRecords = [];
    const invalidRecords = [];
    const duplicateRecords = [];

    // First, validate all regions exist if we found a region column
    if (headerMapping.regionId) {
      const uniqueRegionIds = [...new Set(data
        .map(row => row[headerMapping.regionId])
        .filter(Boolean))];
        
      if (uniqueRegionIds.length > 0) {
        const existingRegions = await Parivartan_Region.findAll({
          where: {
            RegionId: uniqueRegionIds
          },
          attributes: ['RegionId']
        });

        const existingRegionIds = existingRegions.map(region => region.RegionId);
        const nonExistentRegionIds = uniqueRegionIds.filter(id => !existingRegionIds.includes(id));

        if (nonExistentRegionIds.length > 0) {
          return res.status(400).json({
            message: `The following RegionIds do not exist in the database: ${nonExistentRegionIds.join(', ')}. Please add these regions first.`
          });
        }
      }
    }

    // Process each row in the Excel file
    for (const row of data) {
      // Branch is mandatory
      if (!row[headerMapping.branch]) {
        console.log("Skipping row due to missing Branch:", row);
        invalidRecords.push(row);
        continue;
      }

      const recordData = {
        BranchCode: headerMapping.branchCode ? (row[headerMapping.branchCode] || null) : null,
        Branch: row[headerMapping.branch],
        RegionId: headerMapping.regionId ? (row[headerMapping.regionId] || null) : null,
        Zone: headerMapping.zone ? (row[headerMapping.zone] || null) : null,
        RO: headerMapping.ro ? (row[headerMapping.ro] || null) : null,
        Deleted: headerMapping.deleted ? (row[headerMapping.deleted] || 'N') : 'N'
      };

      // Handle case where BranchCode is an empty string
      if (recordData.BranchCode === '') {
        recordData.BranchCode = null;
      }

      updatedRecords.push(recordData);
    }

    await sequelize.transaction(async (transaction) => {
      // Process each record one by one for better error handling
      for (const record of updatedRecords) {
        try {
          // First check if this exact branch with the same branch code exists
          let existingBranch = null;
          
          if (record.BranchCode) {
            // If we have a branch code, look up by branch code
            existingBranch = await Parivartan_Branch.findOne({
              where: { 
                BranchCode: record.BranchCode
              },
              transaction
            });
          } else {
            // If no branch code, look up by branch name
            existingBranch = await Parivartan_Branch.findOne({
              where: { 
                Branch: record.Branch,
                BranchCode: null
              },
              transaction
            });
          }
          
          if (existingBranch) {
            // Update existing record
            await existingBranch.update(record, { transaction });
            duplicateRecords.push(record);
          } else {
            // Insert new record
            await Parivartan_Branch.create(record, { transaction });
          }
        } catch (error) {
          console.error(`Error processing branch ${record.Branch}:`, error);
          invalidRecords.push(record);
        }
      }
    });

    // Clean up - delete uploaded file after processing
    fs.unlinkSync(file.path);

    let message = "";
    if (updatedRecords.length > 0) {
      const newRecords = updatedRecords.length - duplicateRecords.length - invalidRecords.length;
      message = `${newRecords} new branch(es) inserted and ${duplicateRecords.length} existing branch(es) updated successfully. `;
    }
    
    if (invalidRecords.length > 0) {
      message += `${invalidRecords.length} record(s) skipped due to errors.`;
    }

    if (updatedRecords.length === 0 && invalidRecords.length === 0) {
      message = "No branches uploaded or updated.";
    }

    res.status(200).json({
      message,
      insertedCount: updatedRecords.length - duplicateRecords.length - invalidRecords.length,
      updatedCount: duplicateRecords.length,
      skippedCount: invalidRecords.length,
    });
  } catch (error) {
    console.error("Error uploading branch data:", error);

    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }

    if (error.name === "SequelizeDatabaseError") {
      if (error.parent && error.parent.code === "ER_DATA_TOO_LONG") {
        res.status(400).json({
          message: "Data exceeds the maximum length allowed for a field"
        });
      } else if (error.parent && error.parent.code === "ER_NO_DEFAULT_FOR_FIELD") {
        res.status(400).json({ message: "Missing required field value" });
      } else {
        res.status(500).json({ message: "Database error occurred", error: error.message });
      }
    } else if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      res.status(400).json({ message: "Validation failed", errors });
    } else {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }
};

/**
 * Get all branches
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Parivartan_Branch.findAll({
      where: { Deleted: 'N' },
      include: [{
        model: Parivartan_Region,
        attributes: ['RegionName']
      }]
    });
    
    res.status(200).json({
      count: branches.length,
      branches
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ message: "Error fetching branches", error: error.message });
  }
};

/**
 * Get branch by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getBranchById = async (req, res) => {
  try {
    const branch = await Parivartan_Branch.findOne({
      where: { 
        BranchCode: req.params.branchCode,
        Deleted: 'N'
      },
      include: [{
        model: Parivartan_Region,
        attributes: ['RegionName']
      }]
    });
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    res.status(200).json(branch);
  } catch (error) {
    console.error("Error fetching branch:", error);
    res.status(500).json({ message: "Error fetching branch", error: error.message });
  }
};

/**
 * Get branches by region
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getBranchesByRegion = async (req, res) => {
  try {
    const branches = await Parivartan_Branch.findAll({
      where: { 
        RegionId: req.params.regionId,
        Deleted: 'N' 
      },
      include: [{
        model: Parivartan_Region,
        attributes: ['RegionName']
      }]
    });
    
    res.status(200).json({
      count: branches.length,
      branches
    });
  } catch (error) {
    console.error("Error fetching branches by region:", error);
    res.status(500).json({ message: "Error fetching branches by region", error: error.message });
  }
};

/**
 * Create new branch
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.createBranch = async (req, res) => {
  try {
    const { BranchCode, Branch, RegionId, Zone, RO } = req.body;
    
    if (!Branch) {
      return res.status(400).json({ message: "Branch name is required" });
    }
    
    // Check if Region exists
    if (RegionId) {
      const region = await Parivartan_Region.findByPk(RegionId);
      if (!region) {
        return res.status(400).json({ message: "Region does not exist" });
      }
    }
    
    // Check if branch already exists
    let existingBranch = null;
    
    if (BranchCode) {
      existingBranch = await Parivartan_Branch.findOne({
        where: { BranchCode }
      });
    } else {
      existingBranch = await Parivartan_Branch.findOne({
        where: { 
          Branch,
          BranchCode: null
        }
      });
    }
    
    if (existingBranch) {
      return res.status(400).json({ message: "Branch already exists" });
    }
    
    const newBranch = await Parivartan_Branch.create({
      BranchCode,
      Branch,
      RegionId,
      Zone,
      RO,
      Deleted: 'N'
    });
    
    res.status(201).json({
      message: "Branch created successfully",
      branch: newBranch
    });
  } catch (error) {
    console.error("Error creating branch:", error);
    res.status(500).json({ message: "Error creating branch", error: error.message });
  }
};

/**
 * Update existing branch
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.updateBranch = async (req, res) => {
  try {
    const { Branch, RegionId, Zone, RO } = req.body;
    const { branchCode } = req.params;
    
    // Check if branch exists
    const branch = await Parivartan_Branch.findOne({
      where: { 
        BranchCode: branchCode,
        Deleted: 'N'
      }
    });
    
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    
    // Check if Region exists
    if (RegionId) {
      const region = await Parivartan_Region.findByPk(RegionId);
      if (!region) {
        return res.status(400).json({ message: "Region does not exist" });
      }
    }
    
    // Update branch
    await branch.update({
      Branch: Branch || branch.Branch,
      RegionId: RegionId || branch.RegionId,
      Zone: Zone || branch.Zone,
      RO: RO || branch.RO
    });
    
    res.status(200).json({
      message: "Branch updated successfully",
      branch
    });
  } catch (error) {
    console.error("Error updating branch:", error);
    res.status(500).json({ message: "Error updating branch", error: error.message });
  }
};

/**
 * Soft delete branch (set Deleted = 'Y')
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.deleteBranch = async (req, res) => {
  try {
    const { branchCode } = req.params;
    
    // Check if branch exists
    const branch = await Parivartan_Branch.findOne({
      where: { 
        BranchCode: branchCode,
        Deleted: 'N'
      }
    });
    
    if (!branch) {
      return res.status(404).json({ message: "Branch not found or already deleted" });
    }
    
    // Soft delete branch
    await branch.update({ Deleted: 'Y' });
    
    res.status(200).json({
      message: "Branch deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting branch:", error);
    res.status(500).json({ message: "Error deleting branch", error: error.message });
  }
};




//--------
/**
 * Get all branches for a specific employee by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
// exports.getEmployeeBranchesById = async (req, res) => {
//   try {
//     const { employeeId } = req.params;

//     if (!employeeId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Employee ID is required'
//       });
//     }

//     // Find the employee with the given ID
//     const employee = await Parivartan_BDM.findOne({
//       where: {
//         EmployeeId: employeeId,
//         Deleted: 'N'
//       },
//       include: [
//         {
//           model: Parivartan_Region,
//           attributes: ['RegionId', 'RegionName']
//         }
//       ]
//     });

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: 'Employee not found or inactive'
//       });
//     }

//     // Find all branches for this employee's region
//     const branches = await Parivartan_Branch.findAll({
//       where: {
//         RegionId: employee.RegionId,
//         Deleted: 'N'
//       },
//       include: [
//         {
//           model: Parivartan_Region,
//           attributes: ['RegionName']
//         }
//       ]
//     });

//     const branchData = branches.map(branch => ({
//       BranchCode: branch.BranchCode,
//       Branch: branch.Branch,
//       Zone: branch.Zone,
//       RO: branch.RO,
//       RegionName: branch.parivartan_region?.RegionName
//     }));

//     res.status(200).json({
//       success: true,
//       employee: {
//         EmployeeId: employee.EmployeeId,
//         EmployeeName: employee.EmployeeName,
//         RegionId: employee.RegionId,
//         RegionName: employee.parivartan_region?.RegionName,
//         is_bdm: employee.is_bdm,
//         is_zonal_manager: employee.is_zonal_manager,
//         Project: employee.Project
//       },
//       branchCount: branchData.length,
//       branches: branchData
//     });
//   } catch (error) {
//     console.error('Error fetching employee branches by ID:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching employee branches',
//       error: error.message
//     });
//   }
// };

/**
 * Get all branches for a specific employee by ID, including all regions assigned to them
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */


// exports.getEmployeeBranchesById = async (req, res) => {


//   try {
//     const { employeeId } = req.params;

//     if (!employeeId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Employee ID is required'
//       });
//     }

//     // Find all employee records with the given ID (might have multiple regions)
//     const employeeRecords = await Parivartan_BDM.findAll({
//       where: {
//         EmployeeId: employeeId,
//         Deleted: 'N'
//       },
//       include: [
//         {
//           model: Parivartan_Region,
//           attributes: ['RegionId', 'RegionName']
//         }
//       ]
//     });

//     if (!employeeRecords || employeeRecords.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Employee not found or inactive'
//       });
//     }

//     // Extract all unique RegionIds assigned to this employee
//     const regionIds = [...new Set(employeeRecords.map(emp => emp.RegionId))].filter(Boolean);

//     // Find all branches for these regions
//     const branches = await Parivartan_Branch.findAll({
//       where: {
//         RegionId: {
//           [Op.in]: regionIds
//         },
//         Deleted: 'N'
//       },
//       include: [
//         {
//           model: Parivartan_Region,
//           attributes: ['RegionName']
//         }
//       ]
//     });

//     // Group branches by RegionId
//     const branchesByRegion = {};
//     branches.forEach(branch => {
//       if (!branchesByRegion[branch.RegionId]) {
//         branchesByRegion[branch.RegionId] = [];
//       }
//       branchesByRegion[branch.RegionId].push({
//         BranchCode: branch.BranchCode,
//         Branch: branch.Branch,
//         Zone: branch.Zone,
//         RO: branch.RO,
//         RegionId: branch.RegionId,
//         RegionName: branch.parivartan_region?.RegionName
//       });
//     });

//     // Extract unique employee info (assuming EmployeeId, EmployeeName, etc. are the same across records)
//     const employeeInfo = {
//       EmployeeId: employeeRecords[0].EmployeeId,
//       EmployeeName: employeeRecords[0].EmployeeName,
//       is_bdm: employeeRecords[0].is_bdm,
//       is_zonal_manager: employeeRecords[0].is_zonal_manager,
//       Project: employeeRecords[0].Project,
//       regions: employeeRecords.map(emp => ({
//         RegionId: emp.RegionId,
//         RegionName: emp.parivartan_region?.RegionName
//       }))
//     };

//     // Prepare region-wise branch data
//     const regionsData = employeeRecords.map(emp => {
//       const regionId = emp.RegionId;
//       return {
//         RegionId: regionId,
//         RegionName: emp.parivartan_region?.RegionName,
//         branchCount: branchesByRegion[regionId]?.length || 0,
//         branches: branchesByRegion[regionId] || []
//       };
//     });

//     // Calculate total branches across all regions
//     const totalBranches = Object.values(branchesByRegion).reduce(
//       (total, branches) => total + branches.length, 0
//     );

//     // Flatten all branches into a single array
//     const allBranches = Object.values(branchesByRegion).flat();

//     res.status(200).json({
//       success: true,
//       employee: employeeInfo,
//       totalRegions: regionIds.length,
//       totalBranches: totalBranches,
//       regions: regionsData,
//       // Include all branches in a flat array for convenience
//       allBranches: allBranches
      
//     });
//   } catch (error) {
//     console.error('Error fetching employee branches by ID:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching employee branches',
//       error: error.message
//     });
//   }
// };

exports.getEmployeeBranchesById = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Find all employee records with the given ID (might have multiple regions)
    const employeeRecords = await Parivartan_BDM.findAll({
      where: {
        EmployeeId: employeeId,
        Deleted: 'N'
      },
      include: [
        {
          model: Parivartan_Region,
          attributes: ['RegionId', 'RegionName']
        }
      ]
    });

    if (!employeeRecords || employeeRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or inactive'
      });
    }

    // Extract all UNIQUE RegionIds assigned to this employee
    const regionIds = [...new Set(employeeRecords.map(emp => emp.RegionId))].filter(Boolean);
    
    // Get a map of unique regions with their names
    const uniqueRegionsMap = {};
    employeeRecords.forEach(record => {
      if (record.RegionId && !uniqueRegionsMap[record.RegionId]) {
        uniqueRegionsMap[record.RegionId] = {
          RegionId: record.RegionId,
          RegionName: record.parivartan_region?.RegionName
        };
      }
    });
    
    // Convert the map to an array
    const uniqueRegions = Object.values(uniqueRegionsMap);

    // Find all branches for the unique regions
    const branches = await Parivartan_Branch.findAll({
      where: {
        RegionId: {
          [Op.in]: regionIds
        },
        Deleted: 'N'
      },
      include: [
        {
          model: Parivartan_Region,
          attributes: ['RegionName']
        }
      ]
    });

    // Group branches by RegionId
    const branchesByRegion = {};
    branches.forEach(branch => {
      if (!branchesByRegion[branch.RegionId]) {
        branchesByRegion[branch.RegionId] = [];
      }
      branchesByRegion[branch.RegionId].push({
        BranchCode: branch.BranchCode,
        Branch: branch.Branch,
        Zone: branch.Zone,
        RO: branch.RO,
        RegionId: branch.RegionId,
        RegionName: branch.parivartan_region?.RegionName
      });
    });

    // Extract employee info, combining info from all records if needed
    const employeeInfo = {
      EmployeeId: employeeRecords[0].EmployeeId,
      EmployeeName: employeeRecords[0].EmployeeName,
      // Collect all project values the employee is assigned to
      Projects: [...new Set(employeeRecords.map(emp => emp.Project))].filter(Boolean),
      is_bdm: employeeRecords[0].is_bdm,
      is_zonal_manager: employeeRecords[0].is_zonal_manager,
      // Use the unique regions list
      regions: uniqueRegions
    };

    // Prepare region-wise branch data for unique regions only
    const regionsData = uniqueRegions.map(region => {
      const regionId = region.RegionId;
      return {
        RegionId: regionId,
        RegionName: region.RegionName,
        branchCount: branchesByRegion[regionId]?.length || 0,
        branches: branchesByRegion[regionId] || []
      };
    });

    // Calculate total branches across all unique regions
    const totalBranches = Object.values(branchesByRegion).reduce(
      (total, branches) => total + branches.length, 0
    );

    // Flatten all branches into a single array
    const allBranches = Object.values(branchesByRegion).flat();

    res.status(200).json({
      success: true,
      employee: employeeInfo,
      totalRegions: uniqueRegions.length,
      totalBranches: totalBranches,
      regions: regionsData,
      // Include all branches in a flat array for convenience
      allBranches: allBranches
    });
  } catch (error) {
    console.error('Error fetching employee branches by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee branches',
      error: error.message
    });
  }
};