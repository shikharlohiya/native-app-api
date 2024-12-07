const Parivartan_Region = require('../../models/Parivartan_Region');
const Parivartan_BDM = require('../../models/Parivartan_BDM');
const sequelize = require("../../models/index");


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