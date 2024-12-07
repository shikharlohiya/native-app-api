const XLSX = require('xlsx');
const { Op } = require('sequelize');
const BiDayOp = require('../../models/BiDayOp');
const sequelize = require('../../models/index');
const { Sequelize } = require('sequelize');
const BiDayOpRemarks = require('../../models/BiDayOpRemarks');
const Employee = require("../../models/employee");
const BiBrooding = require('../../models/BiBrooding');
const multer = require("multer");
const path = require('path');
const  BiDayOpMaster  = require('../../models/BiDayOpMaster');
 const BiDayOpLot = require('../../models/BiDayOpLot');
 const BiDayOpLotHistory = require('../../models/BiDayOpLotHistory');


// function excelDateToJSDate(excelDate) {
//   if (typeof excelDate === "string" && excelDate.includes("-")) {
//     return excelDate; // Already in the correct format
//   }
//   const date = new Date((excelDate - 25569) * 86400 * 1000);
//   return date.toISOString().split("T")[0];
// }

// exports.uploadAuditLeads = async (req, res) => {
//   try {
//     const file = req.file;
//     const workbook = XLSX.readFile(file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = XLSX.utils.sheet_to_json(sheet);

//     const updatedRecords = [];
//     const invalidRecords = [];

//     for (const row of data) {
//       const lotNumber = row["Lot Number"];

//       if (!lotNumber) {
//         invalidRecords.push(row);
//         continue;
//       }

//       const recordData = {
//         Branch: row["Branch"],
//         Branch_Description: row["Branch Description"],
//         Farm_Name: row["Farm Name"],
//         Farmer_Mob: row["Farmer Mob"],
//         Lot_Number: lotNumber,
//         Age: row["Age"],
//         Chicks_Housed_Quantity: row["Chicks Housed Quantity"],
//         Mortality_Quantity: row["Mortality Quantity"],
//         Mortality_Percentage: row["Mortality %"],
//         Balance_Birds: row["Balance Birds"],
//         Mort_Percentage_On_Date: row["Mort(%):On Date"],
//         Mort_Percentage_Date_1: row["Mort(%):Date-1"],
//         Mort_Percentage_Date_2: row["Mort(%):Date-2"],
//         Mort_Percentage_Date_3: row["Mort(%):Date-3"],
//         Mort_Percentage_Date_4: row["Mort(%):Date-4"],
//         status: "open",
//       };

//       updatedRecords.push(recordData);
//     }

//     await sequelize.transaction(async (transaction) => {
//       if (updatedRecords.length > 0) {
//         const lotNumbers = updatedRecords.map((record) => record.Lot_Number);

//         // Update all existing records to 'open' status, including those not in the current batch
//         await BiDayOp.update(
//           { status: "open" },
//           {
//             where: {
//               [Op.or]: [
//                 { Lot_Number: lotNumbers },
//                 { status: { [Op.ne]: "open" } },
//               ],
//             },
//             transaction,
//           }
//         );

//         // Perform upsert for each record
//         for (const record of updatedRecords) {
//           await BiDayOp.upsert(record, {
//             transaction,
//             logging: false,
//           });
//         }
//       }
//     });

//     let message = "";
//     if (updatedRecords.length > 0) {
//       message = `${updatedRecords.length} audit lead(s) uploaded/updated successfully. All records set to 'open' status. `;
//     }
//     if (invalidRecords.length > 0) {
//       message += `${invalidRecords.length} record(s) skipped due to missing or invalid Lot Number.`;
//     }

//     if (updatedRecords.length === 0 && invalidRecords.length === 0) {
//       message = "No audit leads uploaded or updated.";
//     }

//     res.status(200).json({
//       message,
//       uploadedCount: updatedRecords.length,
//       skippedCount: invalidRecords.length,
//     });
//   } catch (error) {
//     console.error("Error uploading audit leads:", error);

//     if (error.name === "SequelizeDatabaseError") {
//       if (error.parent && error.parent.code === "ER_DATA_TOO_LONG") {
//         res.status(400).json({
//           message: "Data exceeds the maximum length allowed for a field",
//         });
//       } else if (
//         error.parent &&
//         error.parent.code === "ER_NO_DEFAULT_FOR_FIELD"
//       ) {
//         res.status(400).json({ message: "Missing required field value" });
//       } else {
//         res.status(500).json({ message: "Database error occurred" });
//       }
//     } else if (error.name === "SequelizeValidationError") {
//       const errors = error.errors.map((err) => ({
//         field: err.path,
//         message: err.message,
//       }));
//       res.status(400).json({ message: "Validation failed", errors });
//     } else if (error instanceof multer.MulterError) {
//       if (error.code === "LIMIT_FILE_SIZE") {
//         res.status(400).json({ message: "File size exceeds the limit" });
//       } else {
//         res.status(400).json({ message: "File upload error occurred" });
//       }
//     } else {
//       res.status(500).json({ message: "Internal server error" });
//     }
//   }
// };

//06-11-2024


// function excelDateToJSDate(excelDate) {
//   if (typeof excelDate === "string" && excelDate.includes("-")) {
//     return excelDate; // Already in the correct format
//   }
//   const date = new Date((excelDate - 25569) * 86400 * 1000);
//   return date.toISOString().split("T")[0];
// }

// exports.uploadAuditLeads = async (req, res) => {
//   try {
//     const file = req.file;
//     const workbook = XLSX.readFile(file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = XLSX.utils.sheet_to_json(sheet);

//     const updatedRecords = [];
//     const invalidRecords = [];

//     for (const row of data) {
//       const branchCode = row["Branch Code"];
//       const farmCode = row["Farm Code"];

//       // Validate both Branch Code and Farm Code are present
//       if (!branchCode || !farmCode) {
//         invalidRecords.push(row);
//         continue;
//       }

//       const recordData = {
//         Branch_Name: row["Branch Name"],
//         Branch_Code: branchCode,
//         Farm_Code: farmCode,
//         Branch_Description: row["Branch Description"],
//         Farm_Name: row["Farm Name"],
//         Farmer_Mob: row["Farmer Mob"],
//         Lot_Number: row["Lot Number"],
//         Age: row["Age"],
//         Chicks_Housed_Quantity: row["Chicks Housed Quantity"],
//         Mortality_Quantity: row["Mortality Quantity"],
//         Mortality_Percentage: row["Mortality %"],
//         Balance_Birds: row["Balance Birds"],
//         Mort_Percentage_On_Date: row["Mort(%):On Date"],
//         Mort_Percentage_Date_1: row["Mort(%):Date-1"],
//         Mort_Percentage_Date_2: row["Mort(%):Date-2"],
//         Mort_Percentage_Date_3: row["Mort(%):Date-3"],
//         Mort_Percentage_Date_4: row["Mort(%):Date-4"],
//         status: "open",
//       };

//       updatedRecords.push(recordData);
//     }

//     await sequelize.transaction(async (transaction) => {
//       if (updatedRecords.length > 0) {
//         // Create composite key pairs for matching
//         const branchFarmPairs = updatedRecords.map((record) => ({
//           Branch_Code: record.Branch_Code,
//           Farm_Code: record.Farm_Code,
//         }));

//         // Update all existing records to 'open' status
//         await BiDayOp.update(
//           { status: "open" },
//           {
//             where: {
//               [Op.or]: [
//                 {
//                   [Op.or]: branchFarmPairs.map(pair => ({
//                     [Op.and]: [
//                       { Branch_Code: pair.Branch_Code },
//                       { Farm_Code: pair.Farm_Code }
//                     ]
//                   }))
//                 },
//                 { status: { [Op.ne]: "open" } },
//               ],
//             },
//             transaction,
//           }
//         );

//         // Perform upsert for each record
//         for (const record of updatedRecords) {
//           await BiDayOp.upsert(record, {
//             transaction,
//             logging: false,
//           });
//         }
//       }
//     });

//     let message = "";
//     if (updatedRecords.length > 0) {
//       message = `${updatedRecords.length} audit lead(s) uploaded/updated successfully. All records set to 'open' status. `;
//     }
//     if (invalidRecords.length > 0) {
//       message += `${invalidRecords.length} record(s) skipped due to missing or invalid Branch Code or Farm Code.`;
//     }

//     if (updatedRecords.length === 0 && invalidRecords.length === 0) {
//       message = "No audit leads uploaded or updated.";
//     }

//     res.status(200).json({
//       message,
//       uploadedCount: updatedRecords.length,
//       skippedCount: invalidRecords.length,
//     });
//   } catch (error) {
//     console.error("Error uploading audit leads:", error);

//     if (error.name === "SequelizeDatabaseError") {
//       if (error.parent && error.parent.code === "ER_DATA_TOO_LONG") {
//         res.status(400).json({
//           message: "Data exceeds the maximum length allowed for a field",
//         });
//       } else if (
//         error.parent &&
//         error.parent.code === "ER_NO_DEFAULT_FOR_FIELD"
//       ) {
//         res.status(400).json({ message: "Missing required field value" });
//       } else {
//         res.status(500).json({ message: "Database error occurred" });
//       }
//     } else if (error.name === "SequelizeValidationError") {
//       const errors = error.errors.map((err) => ({
//         field: err.path,
//         message: err.message,
//       }));
//       res.status(400).json({ message: "Validation failed", errors });
//     } else if (error instanceof multer.MulterError) {
//       if (error.code === "LIMIT_FILE_SIZE") {
//         res.status(400).json({ message: "File size exceeds the limit" });
//       } else {
//         res.status(400).json({ message: "File upload error occurred" });
//       }
//     } else {
//       res.status(500).json({ message: "Internal server error" });
//     }
//   }
// };

// exports.uploadAuditLeads = async (req, res) => {
//   try {
//     const file = req.file;
//     const workbook = XLSX.readFile(file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = XLSX.utils.sheet_to_json(sheet);

//     const masterRecords = [];
//     const performanceRecords = [];
//     const invalidRecords = [];

//     for (const row of data) {
//       // Validate required fields
//       if (!row["Branch Code"] || !row["Farm Code"] || !row["Farmer Mob"]) {
//         invalidRecords.push(row);
//         continue;
//       }

//       // Prepare master data
//       const masterData = {
//         zone: row["ZONE"],
//         region: row["REGION"],
//         branch_name: row["Branch Name"],
//         branch_code: row["Branch Code"],
//         farm_code: row["Farm Code"],
//         branch_description: row["Branch Description"],
//         farm_name: row["Farm Name"],
//         farmer_mob: row["Farmer Mob"],
//       };

//       // Prepare performance data
//       const performanceData = {
//         lot_number: row["Lot Number"],
//         age: row["Age"],
//         chicks_housed_quantity: row["Chicks Housed Quantity"],
//         mortality_quantity: row["Mortality Quantity"],
//         mortality_percentage: row["Mortality %"],
//         balance_birds: row["Balance Birds"],
//         mort_on_date: row["Mort(%):On Date"],
//         mort_date_1: row["Mort(%):Date-1"],
//         mort_date_2: row["Mort(%):Date-2"],
//         mort_date_3: row["Mort(%):Date-3"],
//         mort_date_4: row["Mort(%):Date-4"],
//       };

//       masterRecords.push(masterData);
//       performanceRecords.push(performanceData);
//     }

//     await sequelize.transaction(async (transaction) => {
//       if (masterRecords.length > 0) {
//         // Process each master record and its corresponding performance data
//         for (let i = 0; i < masterRecords.length; i++) {
//           const masterData = masterRecords[i];
//           const performanceData = performanceRecords[i];

//           // Find or create master record
//           const [farmMaster, created] = await FarmMaster.findOrCreate({
//             where: {
//               zone: masterData.zone,
//               region: masterData.region,
//               branch_code: masterData.branch_code,
//               farm_code: masterData.farm_code,
//               farmer_mob: masterData.farmer_mob
//             },
//             defaults: masterData,
//             transaction
//           });

//           // If master record exists but needs update
//           if (!created) {
//             await farmMaster.update(masterData, { transaction });
//           }

//           // Create or update performance record
//           await FarmPerformance.upsert(
//             {
//               ...performanceData,
//               farm_master_id: farmMaster.id
//             },
//             {
//               where: {
//                 farm_master_id: farmMaster.id,
//                 lot_number: performanceData.lot_number
//               },
//               transaction
//             }
//           );
//         }
//       }
//     });

//     // Prepare response message
//     let message = "";
//     if (masterRecords.length > 0) {
//       message = `${masterRecords.length} farm record(s) processed successfully. `;
//     }
//     if (invalidRecords.length > 0) {
//       message += `${invalidRecords.length} record(s) skipped due to missing required fields.`;
//     }
//     if (masterRecords.length === 0 && invalidRecords.length === 0) {
//       message = "No records processed.";
//     }

//     res.status(200).json({
//       message,
//       processedCount: masterRecords.length,
//       skippedCount: invalidRecords.length,
//     });

//   } catch (error) {
//     console.error("Error uploading farm data:", error);

//     if (error.name === "SequelizeDatabaseError") {
//       if (error.parent?.code === "ER_DATA_TOO_LONG") {
//         return res.status(400).json({
//           message: "Data exceeds the maximum length allowed for a field",
//         });
//       } else if (error.parent?.code === "ER_NO_DEFAULT_FOR_FIELD") {
//         return res.status(400).json({ 
//           message: "Missing required field value" 
//         });
//       }
//       return res.status(500).json({ 
//         message: "Database error occurred" 
//       });
//     }

//     if (error.name === "SequelizeValidationError") {
//       const errors = error.errors.map((err) => ({
//         field: err.path,
//         message: err.message,
//       }));
//       return res.status(400).json({ 
//         message: "Validation failed", 
//         errors 
//       });
//     }

//     if (error instanceof multer.MulterError) {
//       if (error.code === "LIMIT_FILE_SIZE") {
//         return res.status(400).json({ 
//           message: "File size exceeds the limit" 
//         });
//       }
//       return res.status(400).json({ 
//         message: "File upload error occurred" 
//       });
//     }

//     res.status(500).json({ 
//       message: "Internal server error",
//       error: error.message 
//     });
//   }
// };

// exports.uploadAuditLeads = async (req, res) => {
//   try {
//     const file = req.file;
//     const workbook = XLSX.readFile(file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = XLSX.utils.sheet_to_json(sheet);

//     const processedRecords = [];
//     const invalidRecords = [];

//     await sequelize.transaction(async (transaction) => {
//       for (const row of data) {
//         try {
//           // Validate required fields
//           if (!row["Branch Code"] || !row["Farm Code"]) {
//             invalidRecords.push(row);
//             continue;
//           }

//           // Create or find master record
//           const [masterRecord, created] = await BiDayOpMaster.findOrCreate({
//             where: {
//               branch_code: row["Branch Code"],
//               farm_code: row["Farm Code"],
//               farmer_mob: row["Farmer Mob"]
//             },
//             defaults: {
//               zone: row["ZONE"],
//               region: row["REGION"],
//               branch_name: row["Branch Name"],
//               branch_description: row["Branch Description"],
//               farm_name: row["Farm Name"]
//             },
//             transaction
//           });

//           // Create lot record with master ID
//           const lotRecord = await BiDayOpLot.create({
//             lot_number: row["Lot Number"],
//             age: row["Age"],
//             chicks_housed_quantity: row["Chicks Housed Quantity"],
//             mortality_quantity: row["Mortality Quantity"],
//             mortality_percentage: row["Mortality %"],
//             balance_birds: row["Balance Birds"],
//             mort_on_date: row["Mort(%):On Date"],
//             mort_date_1: row["Mort(%):Date-1"],
//             mort_date_2: row["Mort(%):Date-2"],
//             mort_date_3: row["Mort(%):Date-3"],
//             mort_date_4: row["Mort(%):Date-4"],
//             farm_master_id: row["Farm Master ID"] || null,
//             dayop_master_id: masterRecord.id  // Setting the foreign key
//           }, { transaction });

//           processedRecords.push({
//             master: masterRecord,
//             lot: lotRecord
//           });
//         } catch (error) {
//           console.error("Error processing row:", error);
//           invalidRecords.push({ ...row, error: error.message });
//         }
//       }
//     });

//     // Prepare response
//     const message = processedRecords.length > 0
//       ? `Successfully processed ${processedRecords.length} records. ${invalidRecords.length} records were invalid.`
//       : "No records were processed.";

//     res.status(200).json({
//       success: true,
//       message,
//       processedCount: processedRecords.length,
//       invalidCount: invalidRecords.length,
//       invalidRecords: invalidRecords
//     });

//   } catch (error) {
//     console.error("Error in uploadBiDayOpData:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error processing upload",
//       error: error.message
//     });
//   }
// };

exports.uploadAuditLeads = async (req, res) => {
  try {
    const file = req.file;
    const workbook = XLSX.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const processedRecords = {
      newLots: [],
      updatedLots: [],
      invalidRecords: []
    };

    // Get existing masters lookup
    const existingMasters = await BiDayOpMaster.findAll({
      attributes: ['id', 'branch_code', 'farm_code', 'farmer_mob'],
      raw: true
    });

    const masterLookup = {};
    existingMasters.forEach(master => {
      const key = `${master.branch_code}_${master.farm_code}_${master.farmer_mob}`;
      masterLookup[key] = master.id;
    });

    // Get existing lots lookup
    const existingLots = await BiDayOpLot.findAll({
      attributes: ['id', 'lot_number', 'dayop_master_id'],
      where: { is_active: true },
      raw: true
    });

    const lotLookup = {};
    existingLots.forEach(lot => {
      lotLookup[`${lot.dayop_master_id}_${lot.lot_number}`] = lot.id;
    });

    await sequelize.transaction(async (transaction) => {
      for (const row of data) {
        try {
          // Validate required fields
          if (!row["Branch Code"] || !row["Farm Code"] || !row["Farmer Mob"] || !row["Lot Number"]) {
            processedRecords.invalidRecords.push({
              ...row,
              error: "Missing required fields"
            });
            continue;
          }

          // Get or create master record
          const lookupKey = `${row["Branch Code"]}_${row["Farm Code"]}_${row["Farmer Mob"]}`;
          let masterId = masterLookup[lookupKey];

          if (!masterId) {
            const masterRecord = await BiDayOpMaster.create({
              zone: row["ZONE"],
              region: row["REGION"],
              branch_name: row["Branch Name"],
              branch_code: row["Branch Code"],
              farm_code: row["Farm Code"],
              branch_description: row["Branch Description"],
              farm_name: row["Farm Name"],
              farmer_mob: row["Farmer Mob"]
            }, { transaction });

            masterId = masterRecord.id;
            masterLookup[lookupKey] = masterId;
          }

          // Check if lot exists
          const lotLookupKey = `${masterId}_${row["Lot Number"]}`;
          let lotId = lotLookup[lotLookupKey];
          let isNewLot = false;

          if (!lotId) {
            // Create new lot
            const lotRecord = await BiDayOpLot.create({
              lot_number: row["Lot Number"],
              dayop_master_id: masterId,
              farm_master_id: row["Farm Master ID"] || null,
              is_active: true
            }, { transaction });

            lotId = lotRecord.id;
            lotLookup[lotLookupKey] = lotId;
            isNewLot = true;
          }

          // Create history record
          const historyRecord = await BiDayOpLotHistory.create({
            lot_id: lotId,
            age: row["Age"],
            chicks_housed_quantity: row["Chicks Housed Quantity"],
            mortality_quantity: row["Mortality Quantity"],
            mortality_percentage: row["Mortality %"],
            balance_birds: row["Balance Birds"],
            mort_on_date: row["Mort(%):On Date"],
            mort_date_1: row["Mort(%):Date-1"],
            mort_date_2: row["Mort(%):Date-2"],
            mort_date_3: row["Mort(%):Date-3"],
            mort_date_4: row["Mort(%):Date-4"]
          }, { transaction });

          if (isNewLot) {
            processedRecords.newLots.push({
              lotId,
              masterId,
              historyId: historyRecord.id,
              lotNumber: row["Lot Number"]
            });
          } else {
            processedRecords.updatedLots.push({
              lotId,
              masterId,
              historyId: historyRecord.id,
              lotNumber: row["Lot Number"]
            });
          }

        } catch (error) {
          console.error("Error processing row:", error);
          processedRecords.invalidRecords.push({
            ...row,
            error: error.message
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Processed successfully: ${processedRecords.newLots.length} new lots, ${processedRecords.updatedLots.length} updated lots, ${processedRecords.invalidRecords.length} invalid records`,
      details: {
        newLots: processedRecords.newLots,
        updatedLots: processedRecords.updatedLots,
        invalidRecords: processedRecords.invalidRecords
      }
    });

  } catch (error) {
    console.error("Error in uploadBiDayOpData:", error);
    res.status(500).json({
      success: false,
      message: "Error processing upload",
      error: error.message
    });
  }
};



// Helper function to validate numeric fields
const validateNumericField = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${fieldName} is required`);
  }
  const numValue = Number(value);
  if (isNaN(numValue)) {
    throw new Error(`${fieldName} must be a number`);
  }
  return numValue;
};





const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.createBiDayOpRemark = async (req, res) => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    const transaction = await sequelize.transaction();

    try {
      const {
        medicine_type,
        medicine_list,
        disease_name,
        dosage,
        Remarks,
        Follow_up_date,
        Lot_Number,
        AgentId,
      } = req.body;

      const biDayOpRemark = await BiDayOpRemarks.create(
        {
          medicine_type,
          medicine_list,
          disease_name,
          dosage,
          Remarks,
          Follow_up_date,
          Lot_Number,
          AgentId,
        },
        { transaction }
      );

      // Update the corresponding BiDayOpDetail record
      await BiDayOp.update(
        {
          last_action_date: sequelize.literal("CURRENT_TIMESTAMP"),
          // You might want to update other fields here if necessary
        },
        {
          where: { Lot_Number: Lot_Number },
          transaction,
        }
      );

      await transaction.commit();

      return res.status(200).json({
        message: "Created Bi-Day OP remark successfully",
        biDayOpRemark,
      });
    } catch (error) {
      await transaction.rollback();

      if (
        error.name === "SequelizeDatabaseError" &&
        error.parent.code === "ER_LOCK_WAIT_TIMEOUT"
      ) {
        retries++;
        console.log(
          `Lock wait timeout. Retrying (${retries}/${MAX_RETRIES})...`
        );
        await sleep(RETRY_DELAY);
      } else {
        console.error("Error creating Bi-Day OP remark:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  console.error("Max retries reached. Failed to create Bi-Day OP remark.");
  return res.status(500).json({
    message: "Failed to create Bi-Day OP remark after multiple attempts",
  });
};



exports.getBiLeads = async (req, res) => {
    try {
      const { agentId } = req.query; // Assuming you'll pass the agent's ID as a query parameter
  
      if (!agentId) {
        return res.status(400).json({ message: "Agent ID is required" });
      }
  
      // First, fetch the agent's details to get their mapped regions
      const agent = await Employee.findByPk(agentId, {
        attributes: ["EmployeeName", "EmployeeRegion"],
      });
  
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
  
      // Assuming MappedRegions is stored as a comma-separated string
      const mappedRegions = agent.EmployeeRegion.split(",").map((region) =>
        region.trim()
      );
  
      // Fetch audit leads for the mapped regions
      const auditLeads = await BiDayOp.findAll({
        where: {
        Branch_Description: {
            [Op.in]: mappedRegions,
          },
        },
        order: [["updatedAt", "DESC"]],
      });
      const totalCount = auditLeads.length;
  
      res.status(200).json({
        data: auditLeads,
        agent: {
          name: agent.EmployeeName,
          mappedRegions: mappedRegions,
        },
        totalCount: totalCount,
      });
    } catch (error) {
      console.error("Error retrieving audit leads:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };


  exports.getBiLeadRemarksByLotNumber = async (req, res) => {
    try {
      const { lotNumber } = req.params;
  
      const auditLeadRemarks = await BiDayOpRemarks.findAll({
        order: [["updatedAt", "DESC"]],
        where: {
          Lot_Number: lotNumber,
        },
        include: [
          {
            model: Employee,
            as: "Agent",
            attributes: ["EmployeeName"],
          },
        ],
      });
  
      if (auditLeadRemarks.length === 0) {
        return res
          .status(200)
          .json({
            message: "No audit lead remarks found for the specified Lot Number",
          });
      }
  
      res.status(200).json({ auditLeadRemarks });
    } catch (error) {
      console.error("Error retrieving audit lead remarks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };



  exports.getAllLeadsForDayOpSuperviser = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        region,
        status,
        sortBy = "updatedAt",
        sortOrder = "DESC",
      } = req.query;
  
      const offset = (page - 1) * limit;
  
      let whereClause = {};
      if (region) whereClause.Branch_Description = region;
      if (status) whereClause.status = status;
  
      const { count, rows: auditLeads } = await BiDayOp.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
  
      res.status(200).json({
        data: auditLeads,
        totalCount: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      console.error("Error retrieving audit leads:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };






  /////////////

  exports.uploadBiBrooding = async (req, res) => {
    try {
      const file = req.file;
      const workbook = XLSX.readFile(file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
  
      const updatedRecords = [];
      const invalidRecords = [];
  
      for (const row of data) {
        const lotNo = row["LOT NO"];
  
        if (!lotNo) {
          invalidRecords.push(row);
          continue;
        }
  
        const recordData = {
          ZONE: row["ZONE"],
          REGION: row["REGION"],
          BRANCH: row["BRANCH"],
          LOT_NO: lotNo,
          FARMER_NAME: row["FARMER NAME"],
          AGE: row["AGE"],
          SHED_TYPE: row["SHED TYPE"],
          CHICKS_PLANNED_HOUSED: row["CHICKS PLANNED/HOUSED"],
          FARMER_CONTACT_NO: row["FARMER CONTACT NO"],
          LOT_STATUS: row["LOT STATUS"],
          status: "open",
        };
  
        updatedRecords.push(recordData);
      }
  
      await sequelize.transaction(async (transaction) => {
        if (updatedRecords.length > 0) {
          const lotNumbers = updatedRecords.map((record) => record.LOT_NO);
  
          // Update all existing records to 'open' status, including those not in the current batch
          await BiBrooding.update(
            { status: "open" },
            {
              where: {
                [Op.or]: [
                  { LOT_NO: lotNumbers },
                  { status: { [Op.ne]: "open" } },
                ],
              },
              transaction,
            }
          );
  
          // Perform upsert for each record
          for (const record of updatedRecords) {
            await BiBrooding.upsert(record, {
              transaction,
              logging: false,
            });
          }
        }
      });
  
      let message = "";
      if (updatedRecords.length > 0) {
        message = `${updatedRecords.length} Bi-Brooding record(s) uploaded/updated successfully. All records set to 'open' status. `;
      }
      if (invalidRecords.length > 0) {
        message += `${invalidRecords.length} record(s) skipped due to missing or invalid LOT NO.`;
      }
  
      if (updatedRecords.length === 0 && invalidRecords.length === 0) {
        message = "No Bi-Brooding records uploaded or updated.";
      }
  
      res.status(200).json({
        message,
        uploadedCount: updatedRecords.length,
        skippedCount: invalidRecords.length,
      });
    } catch (error) {
      console.error("Error uploading Bi-Brooding records:", error);
  
      if (error.name === "SequelizeDatabaseError") {
        if (error.parent && error.parent.code === "ER_DATA_TOO_LONG") {
          res.status(400).json({
            message: "Data exceeds the maximum length allowed for a field",
          });
        } else if (
          error.parent &&
          error.parent.code === "ER_NO_DEFAULT_FOR_FIELD"
        ) {
          res.status(400).json({ message: "Missing required field value" });
        } else {
          res.status(500).json({ message: "Database error occurred" });
        }
      } else if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        }));
        res.status(400).json({ message: "Validation failed", errors });
      } else if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ message: "File size exceeds the limit" });
        } else {
          res.status(400).json({ message: "File upload error occurred" });
        }
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  };


 
exports.addRemarks = async (req, res) => {
  try {
    const {
      lot_history_id,
      medicine_type,
      disease_name,
      medicine_with_dose,
      remarks,
      follow_up_date,
      AgentId
    } = req.body;

    // Validate required fields
    if (!lot_history_id || !AgentId || !remarks) {
      return res.status(400).json({
        success: false,
        message: "lot_history_id, AgentId, and remarks are required fields"
      });
    }

    // Validate lot_history_id exists

    // const lotHistory = await BiDayOpLotHistory.findByPk(lot_history_id);
    // if (!lotHistory) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Lot history record not found"
    //   });
    // }

    // Validate Agent exists (assuming you have an Employee model)
    // const agent = await Employee.findByPk(AgentId);
    // if (!agent) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Agent not found"
    //   });
    // }

    // Validate arrays if provided
    if (medicine_type && !Array.isArray(medicine_type)) {
      return res.status(400).json({
        success: false,
        message: "medicine_type must be an array"
      });
    }

    if (disease_name && !Array.isArray(disease_name)) {
      return res.status(400).json({
        success: false,
        message: "disease_name must be an array"
      });
    }

    if (medicine_with_dose && !Array.isArray(medicine_with_dose)) {
      return res.status(400).json({
        success: false,
        message: "medicine_with_dose must be an array"
      });
    }

    // Validate medicine_with_dose structure if provided
    if (medicine_with_dose && medicine_with_dose.length > 0) {
      const isValidMedicineWithDose = medicine_with_dose.every(item => 
        item.medicine && 
        item.dose && 
        typeof item.medicine === 'string' && 
        typeof item.dose === 'string'
      );

      if (!isValidMedicineWithDose) {
        return res.status(400).json({
          success: false,
          message: "Each medicine_with_dose item must have medicine and dose fields"
        });
      }
    }

    // Create remarks record
    const remarkRecord = await BiDayOpRemarks.create({
      lot_history_id,
      medicine_type: medicine_type || [],
      disease_name: disease_name || [],
      medicine_with_dose: medicine_with_dose || [],
      Remarks: remarks,
      Follow_up_date: follow_up_date,
      AgentId
    });

    // Fetch the created record with associations
    // const remarkWithDetails = await BiDayOpRemarks.findOne({
    //   where: { id: remarkRecord.id },
    //   include: [
    //     {
    //       model: BiDayOpLotHistory,
    //       as: "lotHistory"
    //     },
    //     // {
    //     //   model: Employee,
    //     //   as: "agent",
    //     //   attributes: ['id', 'name', 'email'] // Adjust attributes based on your Employee model
    //     // }
    //   ]
    // });

    res.status(201).json({
      success: true,
      message: "Remarks added successfully",
      // data: remarkWithDetails
    });

  } catch (error) {
    console.error("Error adding remarks:", error);
    res.status(500).json({
      success: false,
      message: "Error adding remarks",
      error: error.message
    });
  }
};


  