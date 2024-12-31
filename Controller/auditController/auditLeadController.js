const Lead_Detail = require("../../models/lead_detail");
const Employee = require("../../models/employee");
const LeadUpdate = require("../../models/lead_update");
const Campaign = require("../../models/campaign");
const site_visit = require("../../models/site_visit");
const lead_Meeting = require("../../models/lead_meeting");
const estimation = require("../../models/estimation");
const AuditLeadDetail = require("../../models/AuditLeadTable");
const {  Op, literal, where, fn, col } = require("sequelize");
const sequelize = require("../../models/index");
const XLSX = require("xlsx");
const multer = require("multer");
const AuditLeadRemark = require("../../models/AuditLeadRemark");
const AuditTraderTable = require("../../models/AuditTraderTable");
const AuditNewFarmer  = require("../../models/AuditNewFarmer");

function excelDateToJSDate(excelDate) {
  if (typeof excelDate === "string" && excelDate.includes("-")) {
    return excelDate; // Already in the correct format
  }
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split("T")[0].split("-").reverse().join("-");
}

exports.uploadAuditLeads = async (req, res) => {
  try {
    const file = req.file;
    const workbook = XLSX.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const updatedRecords = [];
    const invalidRecords = [];

    for (const row of data) {
      const lotNumber = row["Lot Number"];

      if (!lotNumber) {
        invalidRecords.push(row);
        continue;
      }

      const formattedHatchDate = excelDateToJSDate(row["Hatch Date"]);

      const recordData = {
        Zone_Name: row["Zone Name"],
        Branch_Name: row["Branch Name"],
        Vendor: row["Vendor"],
        Shed_Type: row["Shed Type"],
        Farmer_Name: row["Farmer Name"],
        Placed_Qty: row["Placed Qty"],
        Hatch_Date: formattedHatchDate,
        CA: row["CA"],
        Age_SAP: row["Age (SAP)"],
        Diff: row["Diff"],
        first_Week_M: row["1st Week M."],
        First_Week_Mortality_Percentage: row["1st Week M.%"],
        Total_Mortality: row["Total M."],
        Total_Mortality_Percentage: row["Total M%"],
        Lifting_EA: row["Lifting (EA)"],
        Lift_Percentage: row["Lift%"],
        Avg_Lift_Wt: row["Avg. Lift Wt."],
        Bal_Birds: row["Bal. Birds"],
        ABWT: row["ABWT"],
        BWT_Age: row["BWT Age"],
        Feed_Cons: row["Feed Cons."],
        Prev_Grade: row["Prev Grade."],
        FCR: row["FCR"],
        Mobile: row["Mobile"],
        Line: row["Line"],
        Hatchery_Name: row["Hatchery Name"],
        Lot_Number: lotNumber,
        status: "open",
      };

      updatedRecords.push(recordData);
    }

    await sequelize.transaction(async (transaction) => {
      if (updatedRecords.length > 0) {
        const lotNumbers = updatedRecords.map((record) => record.Lot_Number);

        // Update all existing records to 'open' status, including those not in the current batch
        await AuditLeadDetail.update(
          { status: "open" },
          {
            where: {
              [Op.or]: [
                { Lot_Number: lotNumbers },
                { status: { [Op.ne]: "open" } },
              ],
            },
            transaction,
          }
        );

        // Perform upsert for each record
        for (const record of updatedRecords) {
          await AuditLeadDetail.upsert(record, {
            transaction,
            logging: false,
          });
        }
      }
    });

    let message = "";
    if (updatedRecords.length > 0) {
      message = `${updatedRecords.length} audit lead(s) uploaded/updated successfully. All records set to 'open' status. `;
    }
    if (invalidRecords.length > 0) {
      message += `${invalidRecords.length} record(s) skipped due to missing or invalid Lot Number.`;
    }

    if (updatedRecords.length === 0 && invalidRecords.length === 0) {
      message = "No audit leads uploaded or updated.";
    }

    res.status(200).json({
      message,
      uploadedCount: updatedRecords.length,
      skippedCount: invalidRecords.length,
    });
  } catch (error) {
    console.error("Error uploading audit leads:", error);

    if (error.name === "SequelizeDatabaseError") {
      if (error.parent && error.parent.code === "ER_DATA_TOO_LONG") {
        res
          .status(400)
          .json({
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


 
 //v1

// exports.getAuditLeads = async (req, res) => {
//   try {
//     const { 
//       agentId, 
//       page = 1, 
//       limit = 10, 
//       zoneName, //contaion //equal
//       branchName,//contaion //equal
//       farmerName, //none
//       shedType, //equal
//       lotNumber,// none
//       line, //equal
//       hatcheryName,//contaion //equal
//       status,//equal
//       sortFCR,// //equal // greaterthanequal // lessthanequal //greathan //leassthan 
//       sortBirdAge, //equal // greaterthanequal // lessthanequal //greathan //leassthan //contain
//       commonSearch,
//       vendor,//contain//equal
//       Placed_Qty, //equal // greaterthanequal // lessthanequal //greathan //leassthan
//       ca,//equal // greaterthanequal // lessthanequal //greathan //leassthan
//       Diif,//equal // greaterthanequal // lessthanequal //greathan //leassthan // contain 
//       first_Week_M, //equal // greaterthanequal // lessthanequal //greathan //leassthan // contain
//       First_Week_Mortality_Percentage,//equal // greaterthanequal // lessthanequal //greathan //leassthan // contain
//       Total_Mortality,//equal // greaterthanequal // lessthanequal //greathan //leassthan // contain
//       Lift_Percentage,//equal // greaterthanequal // lessthanequal //greathan //leassthan // contain
//       Bal_Birds,
//     } = req.query;

//     if (!agentId) {
//       return res.status(400).json({ message: "Agent ID is required" });
//     }

//     const agent = await Employee.findByPk(agentId, {
//       attributes: ["EmployeeName", "EmployeeRegion"],
//     });

//     if (!agent) {
//       return res.status(404).json({ message: "Agent not found" });
//     }

//     const mappedRegions = agent.EmployeeRegion.split(",").map((region) =>
//       region.trim()
//     );

//     const whereClause = {
//       Zone_Name: {
//         [Op.in]: mappedRegions,
//       },
//     };

    // // Add specific filters
    // if (zoneName) whereClause.Zone_Name = { [Op.like]: `%${zoneName}%` };
    // if (branchName) whereClause.Branch_Name = { [Op.like]: `%${branchName}%` };
    // if (farmerName) whereClause.Farmer_Name = { [Op.like]: `%${farmerName}%` };
    // if (shedType) whereClause.Shed_Type = { [Op.like]: `%${shedType}%` };
    // if (lotNumber) whereClause.Lot_Number = { [Op.like]: `%${lotNumber}%` };
    // if (line) whereClause.Line = { [Op.like]: `%${line}%` };
    // if (hatcheryName) whereClause.Hatchery_Name = { [Op.like]: `%${hatcheryName}%` };
    // if (status) whereClause.status = status;

    // // Add common search
    // if (commonSearch) {
    //   whereClause[Op.or] = [
    //     { Zone_Name: { [Op.like]: `%${commonSearch}%` } },
    //     { Branch_Name: { [Op.like]: `%${commonSearch}%` } },
    //     { Farmer_Name: { [Op.like]: `%${commonSearch}%` } },
    //     { Shed_Type: { [Op.like]: `%${commonSearch}%` } },
    //     { Lot_Number: { [Op.like]: `%${commonSearch}%` } },
    //     { Line: { [Op.like]: `%${commonSearch}%` } },
    //     { Hatchery_Name: { [Op.like]: `%${commonSearch}%` } },
    //     { FCR: { [Op.like]: `%${commonSearch}%` } },
    //     { Age_SAP: { [Op.like]: `%${commonSearch}%` } },
    //   ];
    // }

//     const order = [];
//     if (sortFCR) {
//       order.push([literal('CAST(FCR AS DECIMAL)'), sortFCR.toUpperCase()]);
//     }
//     if (sortBirdAge) {
//       order.push([literal('CAST(Age_SAP AS DECIMAL)'), sortBirdAge.toUpperCase()]);
//     }
//     if (order.length === 0) {
//       order.push(['updatedAt', 'DESC']);
//     }

//     const offset = (page - 1) * limit;

//     const { count, rows: auditLeads } = await AuditLeadDetail.findAndCountAll({
//       where: whereClause,
//       order: order,
//       limit: parseInt(limit),
//       offset: offset,
//     });

//     // Get total status counts for all records
//     const totalStatusCounts = await AuditLeadDetail.count({
//       where: {
//         Zone_Name: {
//           [Op.in]: mappedRegions,
//         },
//       },
//       group: ['status'],
//       attributes: ['status'],
//     });

//     const formattedTotalStatusCounts = totalStatusCounts.reduce((acc, curr) => {
//       acc[curr.status] = curr.count;
//       return acc;
//     }, {open: 0, working: 0, closed: 0});

//     // Get filtered status counts
//     const filteredStatusCounts = await AuditLeadDetail.count({
//       where: whereClause,
//       group: ['status'],
//       attributes: ['status'],
//     });

//     const formattedFilteredStatusCounts = filteredStatusCounts.reduce((acc, curr) => {
//       acc[curr.status] = curr.count;
//       return acc;
//     }, {open: 0, working: 0, closed: 0});

//     res.status(200).json({
//       data: auditLeads,
//       agent: {
//         name: agent.EmployeeName,
//         mappedRegions: mappedRegions,
//       },
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(count / limit),
//         totalCount: count,
//         perPage: parseInt(limit),
//       },
//       totalStatusCounts: formattedTotalStatusCounts,
//       filteredStatusCounts: formattedFilteredStatusCounts,
//     });
//   } catch (error) {
//     console.error("Error retrieving audit leads:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };





//v2
exports.getAuditLeads = async (req, res) => {
  try {
    const { 
      agentId, 
      page = 1, 
      limit = 10,
      filters = [],
      sortFCR,
      sortBirdAge,
      status,
      commonSearch
    } = req.query;

    if (!agentId) {
      return res.status(400).json({ message: "Agent ID is required" });
    }

    // Parse filters if it's a string
    let parsedFilters = filters;
    if (typeof filters === 'string') {
      try {
        parsedFilters = JSON.parse(filters);
      } catch (error) {
        console.error("Error parsing filters:", error);
        return res.status(400).json({ message: "Invalid filters format" });
      }
    }

    const agent = await Employee.findByPk(agentId, {
      attributes: ["EmployeeName", "EmployeeRegion"],
    });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const mappedRegions = agent.EmployeeRegion.split(",").map((region) =>
      region.trim()
    );

    // Base where clause with region restriction
    const whereClause = {
      Zone_Name: {
        [Op.in]: mappedRegions,
      },
    };
        // Add specific filters
        if (status) whereClause.status = status;
    
        // Add common search
        if (commonSearch) {
          whereClause[Op.or] = [
            { Zone_Name: { [Op.like]: `%${commonSearch}%` } },
            { Branch_Name: { [Op.like]: `%${commonSearch}%` } },
            { Farmer_Name: { [Op.like]: `%${commonSearch}%` } },
            { Shed_Type: { [Op.like]: `%${commonSearch}%` } },
            { Lot_Number: { [Op.like]: `%${commonSearch}%` } },
            { Line: { [Op.like]: `%${commonSearch}%` } },
            { Hatchery_Name: { [Op.like]: `%${commonSearch}%` } },
            { FCR: { [Op.like]: `%${commonSearch}%` } },
            { Age_SAP: { [Op.like]: `%${commonSearch}%` } },
            { Mobile: { [Op.like]: `%${commonSearch}%` } },
          ];
        }

    // Process dynamic filters
    if (Array.isArray(parsedFilters) && parsedFilters.length > 0) {
      const filterConditions = parsedFilters.map(filter => {
        const { field, condition, value } = filter;
        
        // Validate field exists in the model
        
        if (!field || !condition || value === undefined) {
          return null;
        }

        const numericFields = ['CA', 'FCR', 'Age_SAP', 'Total_Mortality'];


      //   switch (condition.toLowerCase()) {
      //     case 'contains':
      //       return sequelize.where(sequelize.fn('LOWER', sequelize.col(field)), 'LIKE', `%${value.toLowerCase()}%`);
      //     case 'equal':
      //       return { [field]: { [Op.eq]: value } }; // Exact match
      //     case 'greaterthanequal':
      //       return { [field]: { [Op.gte]: value } };
      //     case 'lessthanequal':
      //       return { [field]: { [Op.lte]: value } };
      //     case 'greaterthan':
      //       return { [field]: { [Op.gt]: value } };
      //     case 'lessthan':
      //       return { [field]: { [Op.lt]: value } };
      //     default:
      //       return null;
      //   }
      // }).filter(condition => condition !== null);

      switch (condition.toLowerCase()) {
        case 'contains':
          return sequelize.where(sequelize.fn('LOWER', sequelize.col(field)), 'LIKE', `%${value.toLowerCase()}%`);
        case 'equal':
          if (numericFields.includes(field)) {
            return sequelize.where(sequelize.cast(sequelize.col(field), 'DECIMAL'), value);
          }
          return { [field]: { [Op.eq]: value } };
        case 'greaterthan':
          if (numericFields.includes(field)) {
            return sequelize.where(sequelize.cast(sequelize.col(field), 'DECIMAL'), Op.gt, parseFloat(value));
          }
          return { [field]: { [Op.gt]: value } };
        case 'greaterthanequal':
          if (numericFields.includes(field)) {
            return sequelize.where(sequelize.cast(sequelize.col(field), 'DECIMAL'), Op.gte, parseFloat(value));
          }
          return { [field]: { [Op.gte]: value } };
        case 'lessthan':
          if (numericFields.includes(field)) {
            return sequelize.where(sequelize.cast(sequelize.col(field), 'DECIMAL'), Op.lt, parseFloat(value));
          }
          return { [field]: { [Op.lt]: value } };
        case 'lessthanequal':
          if (numericFields.includes(field)) {
            return sequelize.where(sequelize.cast(sequelize.col(field), 'DECIMAL'), Op.lte, parseFloat(value));
          }
          return { [field]: { [Op.lte]: value } };
        default:
          return null;
      }
    }).filter(condition => condition !== null);



      if (filterConditions.length > 0) {
        whereClause[Op.and] = filterConditions;
      }
    }

    // Handle sorting
    const order = [];
    if (sortFCR) {
      order.push([literal('CAST(FCR AS DECIMAL)'), sortFCR.toUpperCase()]);
    }
    if (sortBirdAge) {
      order.push([literal('CAST(Age_SAP AS DECIMAL)'), sortBirdAge.toUpperCase()]);
    }
    if (order.length === 0) {
      order.push(['updatedAt', 'DESC']);
    }

    const offset = (page - 1) * limit;

    // Get filtered results
    const { count, rows: auditLeads } = await AuditLeadDetail.findAndCountAll({
      where: whereClause,
      order: order,
      limit: parseInt(limit),
      offset: offset,
    });

    // Get total status counts for all records
    const totalStatusCounts = await AuditLeadDetail.count({
      where: {
        Zone_Name: {
          [Op.in]: mappedRegions,
        },
      },
      group: ['status'],
      attributes: ['status'],
    });

    const formattedTotalStatusCounts = totalStatusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr.count;
      return acc;
    }, {open: 0, working: 0, closed: 0});

    // Get filtered status counts
    const filteredStatusCounts = await AuditLeadDetail.count({
      where: whereClause,
      group: ['status'],
      attributes: ['status'],
    });

    const formattedFilteredStatusCounts = filteredStatusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr.count;
      return acc;
    }, {open: 0, working: 0, closed: 0});

    res.status(200).json({
      data: auditLeads,
      agent: {
        name: agent.EmployeeName,
        mappedRegions: mappedRegions,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalCount: count,
        perPage: parseInt(limit),
      },
      totalStatusCounts: formattedTotalStatusCounts,
      filteredStatusCounts: formattedFilteredStatusCounts,
      appliedFilters: parsedFilters, // Return applied filters for debugging
    });
  } catch (error) {
    console.error("Error retrieving audit leads:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};






// const MAX_RETRIES = 3;
// const RETRY_DELAY = 1000; // 1 second
// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// exports.createAuditLeadRemark = async (req, res) => {
//   let retries = 0;

//   while (retries < MAX_RETRIES) {
//     const transaction = await sequelize.transaction();

//     try {
//       const {
//         CH,
//         AGE,
//         BWT,
//         M_QTY,
//         REASON,
//         MED,
//         FEED,
//         STOCK,
//         IFFT_IN,
//         IFFT_OUT,
//         LS_VISIT,
//         BM_VISIT,
//         DAILY_ENT,
//         FEED_ENT,
//         MORT_ENT,
//         BWT_ENT,
//         MED_ENT,
//         REMARKS,
//         DATE,
//         Lot_Number,
//         AgentId,
//         status,
//         follow_up_date
//       } = req.body;

//       const auditLeadRemark = await AuditLeadRemark.create(
//         {
//           CH,
//           AGE,
//           BWT,
//           M_QTY,
//           REASON,
//           MED,
//           FEED,
//           STOCK,
//           IFFT_IN,
//           IFFT_OUT,
//           LS_VISIT,
//           BM_VISIT,
//           DAILY_ENT,
//           FEED_ENT,
//           MORT_ENT,
//           BWT_ENT,
//           MED_ENT,
//           REMARKS,
//           DATE,
//           Lot_Number,
//           AgentId,
//           closure_status:status,
//           follow_up_date
//         },
//         { transaction }
//       );

//       await AuditLeadDetail.update(
//         {
//           last_action_date: sequelize.literal("CURRENT_TIMESTAMP"),
//           status: status, // Update the status field,
//           follow_up_date,
//           // completed_on: sequelize.literal("CURRENT_TIMESTAMP"),
//           AgentId

          
//         },
//         {
//           where: { Lot_Number: Lot_Number },
//           transaction,
//         }
//       );

//       await transaction.commit();

//       return res
//         .status(200)
//         .json({
//           message: "Created audit lead remark successfully",
//           auditLeadRemark,
//         });
//     } catch (error) {
//       await transaction.rollback();

//       if (
//         error.name === "SequelizeDatabaseError" &&
//         error.parent.code === "ER_LOCK_WAIT_TIMEOUT"
//       ) {
//         retries++;
//         console.log(
//           `Lock wait timeout. Retrying (${retries}/${MAX_RETRIES})...`
//         );
//         await sleep(RETRY_DELAY);
//       } else {
//         console.error("Error creating audit lead remark:", error);
//         return res.status(500).json({ message: "Internal server error" });
//       }
//     }
//   }

//   console.error("Max retries reached. Failed to create audit lead remark.");
//   return res
//     .status(500)
//     .json({
//       message: "Failed to create audit lead remark after multiple attempts",
//     });
// };






// const MAX_RETRIES = 3;
// const RETRY_DELAY = 1000;

// const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// const getDetailedErrorMessage = (error) => {
//   if (error.name === 'SequelizeValidationError') {
//     return {
//       type: 'Validation Error',
//       message: 'Data validation failed',
//       details: error.errors.map(err => ({
//         field: err.path,
//         value: err.value,
//         problem: err.message
//       })) 
//     };
//   }
  
//   if (error.name === 'SequelizeUniqueConstraintError') {
//     return {
//       type: 'Unique Constraint Error',
//       message: 'Duplicate entry found',
//       details: error.errors.map(err => ({
//         field: err.path,
//         value: err.value,
//         problem: 'This value already exists'
//       }))
//     };
//   }

//   if (error.name === 'SequelizeForeignKeyConstraintError') {
//     return {
//       type: 'Foreign Key Error',
//       message: 'Invalid reference to related data',
//       details: {
//         field: error.fields?.[0],
//         value: error.value,
//         problem: 'Referenced record does not exist'
//       }
//     };
//   }

//   if (error.name === 'SequelizeDatabaseError') {
//     if (error.parent?.code === 'ER_LOCK_WAIT_TIMEOUT') {
//       return {
//         type: 'Database Lock Error',
//         message: 'Database lock timeout',
//         details: 'The operation took too long due to database locks'
//       };
//     }
//     if (error.parent?.code === 'ER_DATA_TOO_LONG') {
//       return {
//         type: 'Data Length Error',
//         message: 'Data too long for column',
//         details: error.parent.sqlMessage
//       };
//     }
//     return {
//       type: 'Database Error',
//       message: 'Database operation failed',
//       details: error.parent?.sqlMessage || error.message
//     };
//   }

//   return {
//     type: 'Unknown Error',
//     message: error.message,
//     details: error.stack
//   };
// };

// exports.createAuditLeadRemark = async (req, res) => {
//   let retries = 0;

//   while (retries < MAX_RETRIES) {
//     const transaction = await sequelize.transaction();

//     try {
//       const {
//         type,
//         AgentId,
//         status,
//         follow_up_date,
        
//         // Fields for type = 'running'
//         CH, AGE, BWT, M_QTY, REASON, MED, FEED, STOCK,
//         IFFT_IN, IFFT_OUT, LS_VISIT, BM_VISIT, DAILY_ENT,
//         FEED_ENT, MORT_ENT, BWT_ENT, MED_ENT, REMARKS,
//         DATE, Lot_Number,

//         // Fields for type = 'old' or 'new'
//         ABWT, Avg_Lift_Wt, Total_Mortality, Zone_Name,
//         farmer_name, first_Week_M, followUpBy, Mobile,
//         Shed_Type, branch_Name, previousCompanyName,
//         previousPoultryExperience
//       } = req.body;

//       let result;

//       // Validate AgentId exists
//       const agentExists = await sequelize.models.Employee.findByPk(AgentId);
//       if (!agentExists) {
//         throw new Error(`Invalid AgentId: ${AgentId} - Agent does not exist`);
//       }

//       if (type === 'running') {
//         // Validate Lot_Number exists for running type
//         const lotExists = await AuditLeadDetail.findByPk(Lot_Number);
//         if (!lotExists) {
//           throw new Error(`Invalid Lot_Number: ${Lot_Number} - Lot does not exist`);
//         }

//         // Handle running type - save to AuditLeadRemark
//         result = await AuditLeadRemark.create({
//           CH, AGE, BWT, M_QTY, REASON, MED, FEED, STOCK,
//           IFFT_IN, IFFT_OUT, LS_VISIT, BM_VISIT, DAILY_ENT,
//           FEED_ENT, MORT_ENT, BWT_ENT, MED_ENT, REMARKS,
//           DATE, Lot_Number, AgentId,
//           closure_status: status,
//           follow_up_date
//         }, { 
//           transaction,
//           validate: true // Enable validation
//         });

//         // Update AuditLeadDetail
//         await AuditLeadDetail.update({
//           last_action_date: sequelize.literal("CURRENT_TIMESTAMP"),
//           status,
//           follow_up_date: status === 'closed' ? null : follow_up_date,
//           AgentId,
//           completed_on: sequelize.literal("CURRENT_TIMESTAMP"),
          

//         }, {
//           where: { Lot_Number },
//           transaction
//         });

//       } else if (type === 'old' || type === 'new') {
//         // Validate mobile number format
//         if (Mobile && !/^\d{10,15}$/.test(Mobile)) {
//           throw new Error(`Invalid mobile number format: ${Mobile}`);
//         }

//         // Handle old or new type - save to AuditNewFarmer
//         result = await AuditNewFarmer.create({
//           type,
//           AgentId,
//           status,
//           follow_up_date: status === 'closed' ? null : follow_up_date,
//           ABWT: type === 'old' ? ABWT : null,
//           Avg_Lift_Wt: type === 'old' ? Avg_Lift_Wt : null,
//           Total_Mortality: type === 'old' ? Total_Mortality : null,
//           first_Week_M: type === 'old' ? first_Week_M : null,
//           Shed_Type: type === 'new' ? Shed_Type : null,
//           branch_Name: type === 'new' ? branch_Name : null,
//           previousCompanyName: type === 'new' ? previousCompanyName : null,
//           previousPoultryExperience: type === 'new' ? previousPoultryExperience : null,
//           Mobile,
//           Zone_Name,
//           farmer_name,
//           followUpBy,
//           remarks: REMARKS,
//           user_type: 'farmer'
//         }, { 
//           transaction,
//           validate: true // Enable validation
//         });
//       } else {
//         throw new Error(`Invalid type specified: ${type}. Must be 'running', 'old', or 'new'`);
//       }

//       await transaction.commit();

//       return res.status(200).json({
//         success: true,
//         message: `Created ${type} audit record successfully`,
//         data: result
//       });

//     } catch (error) {
//       await transaction.rollback();

//       if (error.name === "SequelizeDatabaseError" && 
//           error.parent?.code === "ER_LOCK_WAIT_TIMEOUT") {
//         retries++;
//         console.log(`Lock wait timeout. Retrying (${retries}/${MAX_RETRIES})...`);
//         await sleep(RETRY_DELAY);
//         continue;
//       }

//       const errorDetails = getDetailedErrorMessage(error);
//       console.error("Error creating audit record:", errorDetails);

//       return res.status(500).json({ 
//         success: false,
//         message: "Failed to create audit record",
//         error: errorDetails
//       });
//     }
//   }

//   return res.status(500).json({
//     success: false,
//     message: "Failed to create audit record after multiple attempts",
//     error: {
//       type: 'Retry Error',
//       details: `Maximum retries (${MAX_RETRIES}) reached due to database locks`
//     }
//   });
// };

// exports.validateAuditData = async (req, res, next) => {
//   try {
//     const { type } = req.body;

//     if (!type) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Validation Error",
//         error: {
//           type: 'Validation Error',
//           details: 'Type is required'
//         }
//       });
//     }

//     const commonRequiredFields = ['AgentId', 'status', 'follow_up_date'];
//     let requiredFields = [...commonRequiredFields];

//       // Add follow_up_date requirement only if status is not 'closed'
//       if (status !== 'closed') {
//         requiredFields.push('follow_up_date');
//       }
      
//     if (type === 'running') {
//       requiredFields = [...requiredFields, 'Lot_Number'];
//     } else if (type === 'old' || type === 'new') {
//       requiredFields = [...requiredFields, 'Mobile', 'Zone_Name', 'farmer_name', 'followUpBy'];
//     } else {
//       return res.status(400).json({ 
//         success: false,
//         message: "Validation Error",
//         error: {
//           type: 'Validation Error',
//           details: `Invalid type: ${type}. Must be 'running', 'old', or 'new'`
//         }
//       });
//     }

//     const missingFields = requiredFields.filter(field => !req.body[field]);

//     if (missingFields.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation Error",
//         error: {
//           type: 'Validation Error',
//           message: 'Missing required fields',
//           details: missingFields
//         }
//       });
//     }

//     next();
//   } catch (error) {
//     console.error("Validation error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Validation Error",
//       error: {
//         type: 'Validation Error',
//         details: error.message
//       }
//     });
//   }
// };



// with message 
// Constants


const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get user-friendly error messages
const getUserFriendlyError = (error) => {
  if (error.name === "SequelizeValidationError") {
    return "Please check the provided information. Some fields contain invalid data.";
  }
  if (error.name === "SequelizeUniqueConstraintError") {
    return "This record already exists in the system.";
  }
  if (error.name === "SequelizeForeignKeyConstraintError") {
    return "One or more referenced records don't exist in the system.";
  }
  return "An unexpected error occurred. Please try again later.";
};

exports.createAuditLeadRemark = async (req, res) => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    const transaction = await sequelize.transaction();

    try {
      const {
        type,
        AgentId,
        status,
        follow_up_date,
        // Fields for type = 'running'
        CH, AGE, BWT, M_QTY, REASON, MED, FEED, STOCK,
        IFFT_IN, IFFT_OUT, LS_VISIT, BM_VISIT, DAILY_ENT,
        FEED_ENT, MORT_ENT, BWT_ENT, MED_ENT, REMARKS,
        DATE, Lot_Number,
        // Fields for type = 'old' or 'new'
        ABWT, Avg_Lift_Wt, Total_Mortality, Zone_Name,
        farmer_name, first_Week_M, followUpBy, Mobile,
        Shed_Type, branch_Name, previousCompanyName,
        previousPoultryExperience
      } = req.body;

      // Validate AgentId exists
      const agentExists = await sequelize.models.Employee.findByPk(AgentId);
      if (!agentExists) {
        return res.status(400).json({
          success: false,
          message: "The selected agent no longer exists in the system. Please refresh and try again."
        });
      }

      let result;
      if (type === 'running') {
        // Validate Lot_Number exists
        const lotExists = await AuditLeadDetail.findByPk(Lot_Number);
        if (!lotExists) {
          return res.status(400).json({
            success: false,
            message: "The specified lot number was not found. Please verify and try again."
          });
        }

        // Create running type record
        result = await AuditLeadRemark.create({
          CH, AGE, BWT, M_QTY, REASON, MED, FEED, STOCK,
          IFFT_IN, IFFT_OUT, LS_VISIT, BM_VISIT, DAILY_ENT,
          FEED_ENT, MORT_ENT, BWT_ENT, MED_ENT, REMARKS,
          DATE, Lot_Number, AgentId,
          closure_status: status,
          follow_up_date
        }, { transaction });

        // Update AuditLeadDetail
        await AuditLeadDetail.update({
          last_action_date: sequelize.literal("CURRENT_TIMESTAMP"),
          status,
          follow_up_date: status === 'closed' ? null : follow_up_date,
          AgentId,
          completed_on: sequelize.literal("CURRENT_TIMESTAMP")
        }, {
          where: { Lot_Number },
          transaction
        });

      } else if (type === 'old' || type === 'new') {
        // Validate mobile number
        if (Mobile && !/^\d{10,15}$/.test(Mobile)) {
          return res.status(400).json({
            success: false,
            message: "Please enter a valid mobile number between 10 and 15 digits."
          });
        }

        // Create old/new type record
        result = await AuditNewFarmer.create({
          type,
          AgentId,
          status,
          follow_up_date: status === 'closed' ? null : follow_up_date,
          ABWT: type === 'old' ? ABWT : null,
          Avg_Lift_Wt: type === 'old' ? Avg_Lift_Wt : null,
          Total_Mortality: type === 'old' ? Total_Mortality : null,
          first_Week_M: type === 'old' ? first_Week_M : null,
          Shed_Type: type === 'new' ? Shed_Type : null,
          branch_Name: type === 'new' ? branch_Name : null,
          previousCompanyName: type === 'new' ? previousCompanyName : null,
          previousPoultryExperience: type === 'new' ? previousPoultryExperience : null,
          Mobile,
          Zone_Name,
          farmer_name,
          followUpBy,
          remarks: REMARKS,
          user_type: 'farmer'
        }, { transaction });

      } else {
        return res.status(400).json({
          success: false,
          message: "Please select a valid record type (running, old, or new)."
        });
      }

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: `Record created successfully`,
        data: result
      });

    } catch (error) {
      await transaction.rollback();

      if (error.name === "SequelizeDatabaseError" && 
          error.parent?.code === "ER_LOCK_WAIT_TIMEOUT") {
        retries++;
        console.log(`Lock wait timeout. Retrying (${retries}/${MAX_RETRIES})...`);
        await sleep(RETRY_DELAY);
        continue;
      }

      console.error("Error creating audit record:", error);
      
      return res.status(500).json({
        success: false,
        message: getUserFriendlyError(error)
      });
    }
  }

  return res.status(500).json({
    success: false,
    message: "Unable to save the record due to high system load. Please try again in a few moments."
  });
};

exports.validateAuditData = async (req, res, next) => {
  try {
    const { type, status } = req.body;

    // Check type
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Please specify the record type."
      });
    }

    // Validate record type
    if (!['running', 'old', 'new'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid record type (running, old, or new)."
      });
    }

    // Required fields based on type
    const commonRequiredFields = ['AgentId', 'status'];
    if (status !== 'closed') {
      commonRequiredFields.push('follow_up_date');
    }

    let requiredFields = [...commonRequiredFields];
    
    if (type === 'running') {
      requiredFields.push('Lot_Number');
    } else if (type === 'old' || type === 'new') {
      requiredFields = [
        ...requiredFields,
        'Mobile',
        'Zone_Name',
        'farmer_name',
        'followUpBy'
      ];
    }

    // Check for missing fields
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      const fieldLabels = {
        AgentId: 'Agent',
        status: 'Status',
        follow_up_date: 'Follow-up Date',
        Lot_Number: 'Lot Number',
        Mobile: 'Mobile Number',
        Zone_Name: 'Zone Name',
        farmer_name: 'Farmer Name',
        followUpBy: 'Follow-up By'
      };

      const missingFieldNames = missingFields
        .map(field => fieldLabels[field] || field)
        .join(', ');

      return res.status(400).json({
        success: false,
        message: `Please provide the following required information: ${missingFieldNames}`
      });
    }

    next();
  } catch (error) {
    console.error("Validation error:", error);
    return res.status(400).json({
      success: false,
      message: "Please check the provided information and try again."
    });
  }
};





exports.getAuditLeadRemarksByLotNumber = async (req, res) => {
  try {
    const { lotNumber } = req.params;

    const auditLeadRemarks = await AuditLeadRemark.findAll({
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

//get Audit detail by lot number ----------

exports.getAuditLeadDetailsByLotNumber = async (req, res) => {
  try {
    const { lotNumber } = req.params;

    // Get the main audit lead details
    const auditLeadDetails = await AuditLeadDetail.findOne({
      where: {
        Lot_Number: lotNumber,
      }
    });

    if (!auditLeadDetails) {
      return res.status(404).json({
        success: false,
        message: "No audit lead details found for the specified Lot Number"
      });
    }

    // Get associated remarks
    const auditLeadRemarks = await AuditLeadRemark.findAll({
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

    // Calculate additional metrics if needed
    // const detailsWithMetrics = {
    //   ...auditLeadDetails.toJSON(),
    //   // Calculate mortality rate if both values are present
    //   mortalityRate: auditLeadDetails.Total_Mortality && auditLeadDetails.Placed_Qty 
    //     ? ((parseFloat(auditLeadDetails.Total_Mortality) / parseFloat(auditLeadDetails.Placed_Qty)) * 100).toFixed(2)
    //     : null,
    //   // Calculate age in days if Hatch_Date is present
    //   ageInDays: auditLeadDetails.Hatch_Date 
    //     ? Math.floor((new Date() - new Date(auditLeadDetails.Hatch_Date)) / (1000 * 60 * 60 * 24))
    //     : null,
    // };

    // Combine all information
    const response = {
      success: true,
      data: {
        details: auditLeadDetails,
        remarks: auditLeadRemarks,
        summary: {
          totalRemarks: auditLeadRemarks.length,
          status: auditLeadDetails.status,
          lastUpdated: auditLeadDetails.updatedAt,
          farmerId: auditLeadDetails.Farmer_Name,
          location: {
            zone: auditLeadDetails.Zone_Name,
            branch: auditLeadDetails.Branch_Name
          }
        }
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Error retrieving audit lead details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



exports.getSupervisorDashboard = async (req, res) => {
  try {
    // Fetch all agents
    const agents = await Employee.findAll({
      attributes: ["EmployeeName", "EmployeeRegion"],
      where: {
        // Add any condition to filter employees who are agents
        // For example: Role: 'Agent'
        EmployeeRoleID: 100,
      },
    });

    const dashboardData = await Promise.all(
      agents.map(async (agent) => {
        // Add null check for EmployeeRegion
        const mappedRegions = agent.EmployeeRegion
          ? agent.EmployeeRegion.split(",").map((region) => region.trim())
          : [];

        // Rest of the code remains the same
        const auditLeads = await AuditLeadDetail.findAll({
          where: {
            Zone_Name: {
              [Op.in]: mappedRegions,
            },
          },
          include: [
            {
              model: AuditLeadRemark,
              as: "AuditRemarks",
              include: [
                {
                  model: Employee,
                  as: "Agent",
                  attributes: ["EmployeeName"],
                },
              ],
            },
          ],
        });

        // Calculate counts
        const openCount = auditLeads.filter(
          (lead) => lead.status === "open"
        ).length;
        const closedCount = auditLeads.filter(
          (lead) => lead.status === "closed"
        ).length;
        const workingCount = auditLeads.filter(
          (lead) => lead.status === "working"
        ).length;

        // Collect all remarks
        const remarks = auditLeads.flatMap((lead) =>
          lead.AuditRemarks.map((remark) => ({
            lotNumber: lead.Lot_Number,
            remark: remark.REMARKS,
            date: remark.DATE,
            agentName: remark.Agent.EmployeeName,
          }))
        );

        return {     
          agentId: agent.id,
          agentName: agent.EmployeeName,
          mappedRegions: mappedRegions,
          totalLeads: auditLeads.length,
          openCount,
          closedCount,
          workingCount,
          remarks,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error fetching supervisor dashboard:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateAuditLeadStatus = async (req, res) => {
  try {
    const { lotNumber, newStatus } = req.body;

    if (!lotNumber || !newStatus) {
      return res
        .status(400)
        .json({ message: "Lot number and new status are required" });
    }

    if (!["open", "working", "closed"].includes(newStatus)) {
      return res
        .status(400)
        .json({ message: "Invalid status. Must be open, working, or closed" });
    }

    const auditLead = await AuditLeadDetail.findByPk(lotNumber);

    if (!auditLead) {
      return res.status(404).json({ message: "Audit lead not found" });
    }

    auditLead.status = newStatus;
    await auditLead.save();

    res.status(200).json({
      success: true,
      message: "Audit lead status updated successfully",
      data: auditLead,
    });
  } catch (error) {
    console.error("Error updating audit lead status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



exports.getAllLeadsForSupervisor = async (req, res) => {
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
    if (region) whereClause.Zone_Name = region;
    if (status) whereClause.status = status;

    const { count, rows: auditLeads } = await AuditLeadDetail.findAndCountAll({
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


//for trader ------------------------
function excelDateToJSDate(excelDate) {
  if (typeof excelDate === "string" && excelDate.includes("-")) {
    return excelDate; // Already in the correct format
  }
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split("T")[0].split("-").reverse().join("-");
}

exports.uploadAuditTraders = async (req, res) => {
  try {
    const file = req.file;
    const workbook = XLSX.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const updatedRecords = [];
    const invalidRecords = [];

    for (const row of data) {
      const customerID = row["Customer"];

      if (!customerID) {
        invalidRecords.push(row);
        continue;
      }

      const formattedCreationDate = excelDateToJSDate(row["Creation date"]);

      const recordData = {
        CustomerID: customerID,
        City: row["City"],
        Name: row["Name"],
        Region: row["Region"],
        RegionName: row["Region Name"],
        Telephone1: row["Telephone 1"],
        CentralOrderBlock: row["Central order block"],
        OrderBlockForSalesArea: row["Order block for sales area"],
        CentralDeliveryBlock: row["Central delivery block"],
        DeliveryBlockForSalesArea: row["Delivery block for sales area"],
        CentralBillingBlock: row["Central billing block"],
        BillingBlockForSalesArea: row["Billing block for sales area"],
        DelIndicatorForSalesArea: row["Del. indicator for sales area"],
        IncotermsPartTwo: row["Incoterms (Part 2)"],
        PayTermDesc: row["PayTermDesc"],
        CreationDate: formattedCreationDate,
        GSTNumber: row["GST Number"],
        PANNo: row["PAN No."],
        Group2Name: row["Group2 Name"],
        AadharNo: row["aadharNo."],
      };

      updatedRecords.push(recordData);
    }

    await sequelize.transaction(async (transaction) => {
      if (updatedRecords.length > 0) {
        await AuditTraderTable.bulkCreate(updatedRecords, {
          updateOnDuplicate: Object.keys(updatedRecords[0]),
          transaction,
          logging: false,
        });
      }
    });

    let message = "";
    if (updatedRecords.length > 0) {
      message = `${updatedRecords.length} audit trader(s) uploaded/updated successfully. `;
    }
    if (invalidRecords.length > 0) {
      message += `${invalidRecords.length} record(s) skipped due to missing or invalid CustomerID.`;
    }

    if (updatedRecords.length === 0 && invalidRecords.length === 0) {
      message = "No audit traders uploaded or updated.";
    }

    res.status(200).json({
      message,
      uploadedCount: updatedRecords.length,
      skippedCount: invalidRecords.length,
    });
  } catch (error) {
    console.error("Error uploading audit traders:", error);

    if (error.name === "SequelizeDatabaseError") {
      if (error.parent && error.parent.code === "ER_DATA_TOO_LONG") {
        res
          .status(400)
          .json({
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

exports.getAuditTraders = async (req, res) => {
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

    // Fetch audit traders for the mapped regions
    const auditTraders = await AuditTraderTable.findAll({
      // where: {
      //   Region: {
      //     [Op.in]: mappedRegions
      //   }
      // },
      order: [["updatedAt", "DESC"]],
    });

    const totalCount = auditTraders.length;

    res.status(200).json({
      data: auditTraders,
      agent: {
        name: agent.EmployeeName,
        mappedRegions: mappedRegions,
      },
      totalCount: totalCount,
    });
  } catch (error) {
    console.error("Error retrieving audit traders:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.toString() });
  }
};



exports.downloadAuditLeadsExcel = async (req, res) => {
  try {
    // Fetch all audit lead details with their remarks
    const auditLeads = await AuditLeadDetail.findAll({
      include: [
        {
          model: AuditLeadRemark,
          as: "AuditRemarks",
          include: [
            {
              model: Employee,
              as: "Agent",
              attributes: ["EmployeeId", "EmployeeName"],
            },
          ],
        },
      ],
      order: [
        ["Lot_Number", "ASC"],
        [{ model: AuditLeadRemark, as: "AuditRemarks" }, "DATE", "DESC"],
      ],
    });

    // Function to filter out unwanted fields
    const filterFields = (obj) => {
      const {
        extra_feild1,
        extra_feild2,
        extra_feild3,
        createdAt,
        updatedAt,
        id,
        ...rest
      } = obj;
      return rest;
    };

    // Process the data for Excel
    const excelData = auditLeads.flatMap((lead) => {
      const leadData = filterFields(lead.get({ plain: true }));
      if (leadData.AuditRemarks.length === 0) {
        return [
          {
            ...leadData,
            CH: "",
            AGE: "",
            BWT: "",
            M_QTY: "",
            REASON: "",
            MED: "",
            FEED: "",
            STOCK: "",
            IFFT_IN: "",
            IFFT_OUT: "",
            LS_VISIT: "",
            BM_VISIT: "",
            DAILY_ENT: "",
            FEED_ENT: "",
            MORT_ENT: "",
            BWT_ENT: "",
            MED_ENT: "",
            REMARKS: "",
            DATE: "",
            AgentName: "",
          },
        ];
      }
      return leadData.AuditRemarks.map((remark) => {
        const filteredRemark = filterFields(remark);
        return {
          ...leadData,
          CH: filteredRemark.CH,
          AGE: filteredRemark.AGE,
          BWT: filteredRemark.BWT,
          M_QTY: filteredRemark.M_QTY,
          REASON: filteredRemark.REASON,
          MED: filteredRemark.MED,
          FEED: filteredRemark.FEED,
          STOCK: filteredRemark.STOCK,
          IFFT_IN: filteredRemark.IFFT_IN,
          IFFT_OUT: filteredRemark.IFFT_OUT,
          LS_VISIT: filteredRemark.LS_VISIT,
          BM_VISIT: filteredRemark.BM_VISIT,
          DAILY_ENT: filteredRemark.DAILY_ENT,
          FEED_ENT: filteredRemark.FEED_ENT,
          MORT_ENT: filteredRemark.MORT_ENT,
          BWT_ENT: filteredRemark.BWT_ENT,
          MED_ENT: filteredRemark.MED_ENT,
          REMARKS: filteredRemark.REMARKS,
          DATE: filteredRemark.DATE,
          AgentName: filteredRemark.Agent
            ? filteredRemark.Agent.EmployeeName
            : "",
        };
      });
    });

    // Create a new workbook and add the data
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Leads");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Set headers for file download
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=audit_leads.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Send the file
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    res.status(500).json({ message: "Error generating Excel file" });
  }
};


//Add lead for the new farmers


exports.createAuditLead = async (req, res) => {
  try {
      const auditData = req.body;

      // Validate required fields
      if (!auditData.Farmer_Name) {
          return res.status(400).json({
              success: false,
              message: "Farmer Name is required"
          });
      }

      // If Lot_Number is not provided, generate using current date and time
      if (!auditData.Lot_Number) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
          
          auditData.Lot_Number = `LOT-${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;
      }

      // Validate status if provided
      if (auditData.status && !['open', 'working', 'closed'].includes(auditData.status)) {
          return res.status(400).json({
              success: false,
              message: "Invalid status value. Must be 'open', 'working', or 'closed'"
          });
      }

      // Set last_action_date to current timestamp
      auditData.last_action_date = new Date();

      // Data validation for numeric fields
      const numericFields = [
          'Placed_Qty',
          'First_Week_Mortality_Percentage',
          'Total_Mortality_Percentage',
          'Lift_Percentage',
          'Avg_Lift_Wt',
          'ABWT',
          'FCR'
      ];

      numericFields.forEach(field => {
          if (auditData[field] && isNaN(parseFloat(auditData[field]))) {
              throw new Error(`${field} must be a valid number`);
          }
      });

      // Validate mobile number length
      if (auditData.Mobile && auditData.Mobile.length > 20) {
          return res.status(400).json({
              success: false,
              message: "Mobile number exceeds maximum length of 20 characters"
          });
      }

      // Create the record
      const newAuditLead = await AuditLeadDetail.create(auditData);

      return res.status(201).json({
          success: true,
          message: "Audit lead created successfully",
          data: newAuditLead
      });

  } catch (error) {
      // Check for Sequelize unique constraint error
      if (error.name === 'SequelizeUniqueConstraintError') {
          return res.status(409).json({
              success: false,
              message: "Lot Number already exists"
          });
      }

      // Check for Sequelize validation errors
      if (error.name === 'SequelizeValidationError') {
          return res.status(400).json({
              success: false,
              message: "Validation error",
              errors: error.errors.map(err => ({
                  field: err.path,
                  message: err.message
              }))
          });
      }

      // Log the error for debugging
      console.error('Error creating audit lead:', error);

      return res.status(500).json({
          success: false,
          message: "An error occurred while creating the audit lead",
          error: error.message
      });
  }
};




// exports.getLotNumbersByMobile = async (req, res) => {
//   try {
//       const { mobile } = req.params;

//       // Validate mobile parameter
//       if (!mobile) {
//           return res.status(400).json({
//               success: false,
//               message: "Mobile number is required"
//           });
//       }

//       // Validate mobile number format and length
//       if (mobile.length > 20) {
//           return res.status(400).json({
//               success: false,
//               message: "Invalid mobile number length"
//           });
//       }

//       // Find all records with the given mobile number
//       const auditRecords = await AuditLeadDetail.findAll({
//           where: {
//               Mobile: mobile
//           },
//           attributes: [
//               'Lot_Number', 
//               'Farmer_Name',
//               'Zone_Name',
//               'Branch_Name',
//               'status',
//               'last_action_date'
//           ],
//           order: [
//               ['last_action_date', 'DESC']  // Most recent first
//           ]
//       });

//       if (!auditRecords || auditRecords.length === 0) {
//           return res.status(404).json({
//               success: false,
//               message: "No records found for this mobile number"
//           });
//       }

//       return res.status(200).json({
//           success: true,
//           message: "Records retrieved successfully",
//           count: auditRecords.length,
//           data: auditRecords
//       });

//   } catch (error) {
//       console.error('Error fetching lot numbers:', error);
//       return res.status(500).json({
//           success: false,
//           message: "An error occurred while fetching the records",
//           error: error.message
//       });
//   }
// };


// changes on 25/12/2024

// exports.getLotNumbersByMobile = async (req, res) => {
//   try {
//       const { mobile } = req.params;

//       // Validate mobile parameter
//       if (!mobile) {
//           return res.status(400).json({
//               success: false,
//               message: "Mobile number is required"
//           });
//       }

//       // Validate mobile number format and length
//       if (mobile.length > 20) {
//           return res.status(400).json({
//               success: false,
//               message: "Invalid mobile number length"
//           });
//       }

//       // Find records in AuditLeadDetail
//       const existingRecords = await AuditLeadDetail.findAll({
//           where: {
//               Mobile: mobile
//           },
//           attributes: [
//               'Lot_Number',
//               'Farmer_Name',
//               'Zone_Name',
//               'Branch_Name',
//               'status',
//               'last_action_date'
//           ],
//           order: [
//               ['last_action_date', 'DESC']
//           ]
//       });

//       // Find records in AuditNewFarmer
//       const newRecords = await AuditNewFarmer.findAll({
//           where: {
//               Mobile: mobile
//           },
//           attributes: [
//               'id',
//               'farmer_name',
//               'Zone_Name',
//               'branch_Name',
//               'type',
//               'status',
//               'follow_up_date',
//               'previousCompanyName',
//               'previousPoultryExperience',
//               'Shed_Type',
//               'ABWT',
//               'Avg_Lift_Wt',
//               'Total_Mortality',
//               'first_Week_M',
//               'remarks',
//               'createdAt',
//               'updatedAt'
//           ],
//           order: [
//               ['createdAt', 'DESC']
//           ]
//       });

//       // Prepare response based on found records
//       const response = {
//           success: true,
//           message: "Records retrieved successfully",
//           data: {
//               existing_customer: {
//                   found: existingRecords.length > 0,
//                   count: existingRecords.length,
//                   records: existingRecords
//               },
//               new_customer: {
//                   found: newRecords.length > 0,
//                   count: newRecords.length,
//                   records: newRecords
//               }
//           }
//       };

//       // Add customer status summary
//       response.data.customer_status = {
//           is_existing: existingRecords.length > 0,
//           is_new: newRecords.length > 0,
//           total_records: existingRecords.length + newRecords.length,
//           latest_status: getLatestStatus(existingRecords, newRecords)
//       };

//       if (existingRecords.length === 0 && newRecords.length === 0) {
//           return res.status(404).json({
//               success: false,
//               message: "No records found for this mobile number",
//               data: response.data
//           });
//       }

//       return res.status(200).json(response);

//   } catch (error) {
//       console.error('Error fetching customer details:', error);
//       return res.status(500).json({
//           success: false,
//           message: "An error occurred while fetching the customer details",
//           error: {
//               type: error.name,
//               details: error.message,
//               stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//           }
//       });
//   }
// };


exports.getLotNumbersByMobile = async (req, res) => {
  try {
      const { mobile } = req.params;

      // Validate mobile parameter
      if (!mobile) {
          return res.status(400).json({
              success: false,
              message: "Mobile number is required"
          });
      }

      // Validate mobile number format and length
      if (mobile.length > 20) {
          return res.status(400).json({
              success: false,
              message: "Invalid mobile number length"
          });
      }

      // Find records in AuditLeadDetail with remarks
      const existingRecords = await AuditLeadDetail.findAll({
          where: {
              Mobile: mobile
          },
          attributes: [
              'Lot_Number',
              'Farmer_Name',
              'Zone_Name',
              'Branch_Name',
              'status',
              'last_action_date'
          ],
          include: [{
              model: AuditLeadRemark,
              as: 'AuditRemarks',
              include: [{
                  model: Employee,
                  as: 'Agent',
                  attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone']
              }],
              order: [['DATE', 'DESC']]
          }],
          order: [
              ['last_action_date', 'DESC']
          ]
      });

      // Find records in AuditNewFarmer
      const newRecords = await AuditNewFarmer.findAll({
          where: {
              Mobile: mobile
          },
          attributes: [
              'id',
              'farmer_name',
              'Zone_Name',
              'branch_Name',
              'type',
              'status',
              'follow_up_date',
              'previousCompanyName',
              'previousPoultryExperience',
              'Shed_Type',
              'ABWT',
              'Avg_Lift_Wt',
              'Total_Mortality',
              'first_Week_M',
              'remarks',
              'createdAt',
              'updatedAt'
          ],
          order: [
              ['createdAt', 'DESC']
          ]
      });

      // Process existing records to include formatted remarks
      const processedExistingRecords = existingRecords.map(record => {
          const plainRecord = record.get({ plain: true });
          return {
              ...plainRecord,
              remarks_summary: {
                  total_remarks: plainRecord.AuditRemarks?.length || 0,
                  latest_remark: plainRecord.AuditRemarks?.[0] || null,
                  all_remarks: plainRecord.AuditRemarks?.map(remark => ({
                      id: remark.id,
                      date: remark.DATE,
                      remarks: remark.REMARKS,
                      status: remark.closure_status,
                      follow_up_date: remark.follow_up_date,
                      agent: remark.Agent,
                      details: {
                          CH: remark.CH,
                          AGE: remark.AGE,
                          BWT: remark.BWT,
                          M_QTY: remark.M_QTY,
                          REASON: remark.REASON,
                          MED: remark.MED,
                          FEED: remark.FEED,
                          STOCK: remark.STOCK,
                          IFFT_IN: remark.IFFT_IN,
                          IFFT_OUT: remark.IFFT_OUT,
                          LS_VISIT: remark.LS_VISIT,
                          BM_VISIT: remark.BM_VISIT,
                          DAILY_ENT: remark.DAILY_ENT,
                          FEED_ENT: remark.FEED_ENT,
                          MORT_ENT: remark.MORT_ENT,
                          BWT_ENT: remark.BWT_ENT,
                          MED_ENT: remark.MED_ENT
                      }
                  }))
              }
          };
      });

      // Prepare response
      const response = {
          success: true,
          message: "Records retrieved successfully",
          data: {
              existing_customer: {
                  found: processedExistingRecords.length > 0,
                  count: processedExistingRecords.length,
                  records: processedExistingRecords
              },
              new_customer: {
                  found: newRecords.length > 0,
                  count: newRecords.length,
                  records: newRecords
              }
          }
      };

      // Add customer status summary
      response.data.customer_status = {
          is_existing: existingRecords.length > 0,
          is_new: newRecords.length > 0,
          total_records: existingRecords.length + newRecords.length,
          latest_status: getLatestStatus(existingRecords, newRecords)
      };

      if (existingRecords.length === 0 && newRecords.length === 0) {
          return res.status(404).json({
              success: false,
              message: "No records found for this mobile number",
              data: response.data
          });
      }

      return res.status(200).json(response);

  } catch (error) {
      console.error('Error fetching customer details:', error);
      return res.status(500).json({
          success: false,
          message: "An error occurred while fetching the customer details",
          error: {
              type: error.name,
              details: error.message,
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }
      });
  }
};

function getLatestStatus(existingRecords, newRecords) {
  const allDates = [
      ...existingRecords.map(record => ({
          date: new Date(record.last_action_date),
          status: record.status,
          type: 'existing',
          remarks: record.AuditRemarks?.[0]?.REMARKS || null
      })),
      ...newRecords.map(record => ({
          date: new Date(record.createdAt),
          status: record.status,
          type: record.type,
          remarks: record.remarks
      }))
  ];

  if (allDates.length === 0) return null;

  const latestRecord = allDates.reduce((latest, current) => {
      return latest.date > current.date ? latest : current;
  });

  return {
      status: latestRecord.status,
      type: latestRecord.type,
      last_updated: latestRecord.date,
      latest_remarks: latestRecord.remarks
  };
}



// Helper function to determine the latest status from both record types
function getLatestStatus(existingRecords, newRecords) {
  const allDates = [
      ...existingRecords.map(record => ({
          date: new Date(record.last_action_date),
          status: record.status,
          type: 'existing'
      })),
      ...newRecords.map(record => ({
          date: new Date(record.createdAt),
          status: record.status,
          type: record.type
      }))
  ];

  if (allDates.length === 0) return null;

  const latestRecord = allDates.reduce((latest, current) => {
      return latest.date > current.date ? latest : current;
  });

  return {
      status: latestRecord.status,
      type: latestRecord.type,
      last_updated: latestRecord.date
  };
}

// Optional: Add detailed validation middleware if needed
exports.validateMobileNumber = (req, res, next) => {
  const { mobile } = req.params;
  
  if (!mobile) {
      return res.status(400).json({
          success: false,
          message: "Mobile number is required"
      });
  }

  // Basic mobile number validation (adjust regex as per your requirements)
  const mobileRegex = /^\d{10,15}$/;
  if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
          success: false,
          message: "Invalid mobile number format"
      });
  }

  next();
};






exports.getAuditNewFarmers = async (req, res) => {
  try {
    const {
      type,                 // 'old' or 'new'
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status,
      agentId,
      zone,
      startDate,
      endDate,
      search
    } = req.query;

    // Base where clause
    const whereClause = {};

    // Type filter
    if (type) {
      whereClause.type = type;
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Agent filter
    if (agentId) {
      whereClause.AgentId = agentId;
    }

    // Zone filter
    if (zone) {
      whereClause.Zone_Name = zone;
    }

    // Date range filter
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { farmer_name: { [Op.like]: `%${search}%` } },
        { Mobile: { [Op.like]: `%${search}%` } },
        { Zone_Name: { [Op.like]: `%${search}%` } },
        { branch_Name: { [Op.like]: `%${search}%` } },
        { previousCompanyName: { [Op.like]: `%${search}%` } }
      ];
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get total count before pagination
    const totalCount = await AuditNewFarmer.count({ where: whereClause });

    // Get data with pagination
    const data = await AuditNewFarmer.findAll({
      where: whereClause,
      include: [{
        model: Employee,
        as: 'agent',
        attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone', 'EmployeeRegion']
      }],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset,
      attributes: [
        'id', 'type', 'status', 'AgentId', 'farmer_name', 'Mobile',
        'Zone_Name', 'branch_Name', 'previousCompanyName',
        'previousPoultryExperience', 'Shed_Type', 'ABWT',
        'Avg_Lift_Wt', 'Total_Mortality', 'first_Week_M',
        'remarks', 'follow_up_date', 'createdAt', 'updatedAt'
      ]
    });

    // Get status counts
    const statusCounts = await AuditNewFarmer.count({
      where: {
        ...whereClause,
        status: { [Op.ne]: null }
      },
      group: ['status']
    });

    // Get type counts
    const typeCounts = await AuditNewFarmer.count({
      where: {
        ...whereClause,
        type: { [Op.ne]: null }
      },
      group: ['type']
    });

    const response = {
      success: true,
      data: {
        records: data,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalRecords: totalCount,
          perPage: parseInt(limit)
        },
        summary: {
          status: statusCounts.reduce((acc, curr) => {
            acc[curr.status.toLowerCase()] = curr.count;
            return acc;
          }, {}),
          type: typeCounts.reduce((acc, curr) => {
            acc[curr.type] = curr.count;
            return acc;
          }, { old: 0, new: 0 })
        },
        filters_applied: {
          type,
          status,
          agentId,
          zone,
          date_range: startDate && endDate ? { startDate, endDate } : null,
          search: search || null
        }
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching audit new farmers:', error);
    return res.status(500).json({
      success: false,
      message: "Error fetching data",
      error: {
        type: error.name,
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

// Get Status Summary
exports.getStatusSummary = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const whereClause = {};
    if (type) {
      whereClause.type = type;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const summary = await AuditNewFarmer.findAll({
      where: whereClause,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    return res.status(200).json({
      success: true,
      data: summary.reduce((acc, curr) => {
        acc[curr.status.toLowerCase()] = parseInt(curr.get('count'));
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Error getting status summary:', error);
    return res.status(500).json({
      success: false,
      message: "Error getting summary",
      error: error.message
    });
  }
};