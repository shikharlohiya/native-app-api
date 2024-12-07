// routes/customerLeadRoutes.js
const express = require('express');
const { Op } = require("sequelize");
// controllers/customerLeadController.js
const CustomerLeadForm = require('../../models/CustomerLeadForm');
const VistaarBroilerDistribution = require('../../models/VistaarBroilerDistribution');
const ChicksInquiry = require('../../models/ChicksInquiry');
const ExcelJS = require('exceljs');
const Campaign = require('../../models/campaign');
const Employee = require('../../models/employee');
const EmployeeCampaign = require('../../models/EmployeCampaign');
const Source = require('../../models/Source');



exports.createCustomerLead = async (req, res) => {
    try {
        const {
            CustomerName,
            ContactNumber,
            WhatsAppNumber, // New field
            pincode,
            StateName,
            location,
            otherLocation, // New field
            CustomerMailId,
            EC_Shed_Plan,
            // Planning New EC Shed fields
            LandAvailable,
            Land_Size,
            Unit,
            Electricity,
            WaterAvailabilty,
            ApproachableRoad,
            // Investment fields
            Investment_Budget,
            Project, // New field
            NUmberOfShed,
            Source,
            Remark,

            // Open to EC Shed fields
            IntegrationCompany,
            ShedSize,
            CurrentShedDirection,
            ElectricityPhase,
            CurrentBirdCapacity
        } = req.body;

        // Basic required fields check
        const basicRequiredFields = {
            CustomerName,
            ContactNumber,
            StateName,
            location,
            EC_Shed_Plan,
            Investment_Budget,
            Source
        };

        for (const [field, value] of Object.entries(basicRequiredFields)) {
            if (!value && value !== false) {
                return res.status(400).json({
                    success: false,
                    error: `${field} is required`
                });
            }
        }

        // Contact number validation
        if (!/^\d{10}$/.test(ContactNumber)) {
            return res.status(400).json({
                success: false,
                error: "Contact number must be 10 digits"
            });
        }

        // Email validation if provided
        if (CustomerMailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CustomerMailId)) {
            return res.status(400).json({
                success: false,
                error: "Invalid email format"
            });
        }

        // EC Shed Plan validation
        const validEC_Shed_Plans = ["Planning New EC Shed", "Open to EC Shed"];
        if (!validEC_Shed_Plans.includes(EC_Shed_Plan)) {
            return res.status(400).json({
                success: false,
                error: "Invalid EC_Shed_Plan value"
            });
        }

        // Conditional validation based on EC_Shed_Plan
        if (EC_Shed_Plan === "Planning New EC Shed") {
            // First, validate LandAvailable as it's always required
            if (typeof LandAvailable !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    error: "LandAvailable must be true or false"
                });
            }

            // If LandAvailable is true, validate other required fields
            if (LandAvailable === true) {
                // Check required fields when land is available
                const landAvailableFields = {
                    Land_Size,
                    Unit,
                    Electricity,
                    WaterAvailabilty,
                    ApproachableRoad
                };

                for (const [field, value] of Object.entries(landAvailableFields)) {
                    if (!value && value !== false) {
                        return res.status(400).json({
                            success: false,
                            error: `${field} is required when Land is Available`
                        });
                    }
                }

                // Unit validation
                if (!["Acres", "Beegha", "Sq.ft."].includes(Unit)) {
                    return res.status(400).json({
                        success: false,
                        error: "Invalid Unit value"
                    });
                }

                // Electricity validation
                if (!["Single Phase", "Three Phase"].includes(Electricity)) {
                    return res.status(400).json({
                        success: false,
                        error: "Invalid Electricity value"
                    });
                }

                // Boolean validations for WaterAvailabilty and ApproachableRoad
                if (typeof WaterAvailabilty !== 'boolean' || typeof ApproachableRoad !== 'boolean') {
                    return res.status(400).json({
                        success: false,
                        error: "WaterAvailabilty and ApproachableRoad must be boolean values"
                    });
                }
            }

        } else if (EC_Shed_Plan === "Open to EC Shed") {
            // Validation for Open to EC Shed remains the same
            const openToShedFields = {
                IntegrationCompany,
                ShedSize,
                CurrentShedDirection,
                ElectricityPhase,
                CurrentBirdCapacity
            };

            for (const [field, value] of Object.entries(openToShedFields)) {
                if (!value && value !== 0) {
                    return res.status(400).json({
                        success: false,
                        error: `${field} is required for Open to EC Shed`
                    });
                }
            }

            // Integration Company validation
            if (!["IB Group", "Others"].includes(IntegrationCompany)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid Integration Company value"
                });
            }

            // Current Shed Direction validation
            if (!["East West", "North South"].includes(CurrentShedDirection)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid Current Shed Direction value"
                });
            }

            // Electricity Phase validation
            if (!["Single Phase", "Three Phase"].includes(ElectricityPhase)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid Electricity Phase value"
                });
            }

            // Current Bird Capacity validation
            if (!Number.isInteger(Number(CurrentBirdCapacity)) || Number(CurrentBirdCapacity) < 0) {
                return res.status(400).json({
                    success: false,
                    error: "Current Bird Capacity must be a non-negative integer"
                });
            }
        }

        // Investment Budget validation
        const validInvestmentBudgets = [
            "Upto 50 lacs",
            "Between 50 lacs to 1 Cr",
            "Between 1Cr to 1.50 Cr",
            "Between 1.50Cr to 2Cr",
            "Above 2 Cr"
        ];
        if (!validInvestmentBudgets.includes(Investment_Budget)) {
            return res.status(400).json({
                success: false,
                error: "Invalid Investment_Budget value"
            });
        }

        // Number of shed validation
        if (!Number.isInteger(Number(NUmberOfShed)) || Number(NUmberOfShed) < 1) {
            return res.status(400).json({
                success: false,
                error: "Number of Shed must be a positive integer"
            });
        }

        // Create customer lead with conditional fields
        const customerLead = await CustomerLeadForm.create({
            CustomerName,
            ContactNumber,
            pincode,
            StateName,
            location,
            otherLocation, // New field
            CustomerMailId,
            EC_Shed_Plan,
            LandAvailable: EC_Shed_Plan === "Planning New EC Shed" ? LandAvailable : null,
            // Only set these fields if LandAvailable is true
            Land_Size: (EC_Shed_Plan === "Planning New EC Shed" && LandAvailable) ? Land_Size : null,
            Unit: (EC_Shed_Plan === "Planning New EC Shed" && LandAvailable) ? Unit : null,
            Electricity: (EC_Shed_Plan === "Planning New EC Shed" && LandAvailable) ? Electricity : null,
            WaterAvailabilty: (EC_Shed_Plan === "Planning New EC Shed" && LandAvailable) ? WaterAvailabilty : null,
            ApproachableRoad: (EC_Shed_Plan === "Planning New EC Shed" && LandAvailable) ? ApproachableRoad : null,
            // Open to EC Shed fields
            IntegrationCompany: EC_Shed_Plan === "Open to EC Shed" ? IntegrationCompany : null,
            ShedSize: EC_Shed_Plan === "Open to EC Shed" ? ShedSize : null,
            CurrentShedDirection: EC_Shed_Plan === "Open to EC Shed" ? CurrentShedDirection : null,
            ElectricityPhase: EC_Shed_Plan === "Open to EC Shed" ? ElectricityPhase : null,
            CurrentBirdCapacity: EC_Shed_Plan === "Open to EC Shed" ? CurrentBirdCapacity : null,
            Investment_Budget,
            Project, // New field
            NUmberOfShed: Number(NUmberOfShed),
            Source,
            Remark,
            WhatsAppNumber // New field
        });

        return res.status(201).json({
            success: true,
            message: "Customer lead created successfully",
            data: customerLead
        });

    } catch (error) {
        console.error('Error in createCustomerLead:', error);
        
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                error: error.errors.map(e => e.message)
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                error: 'Record already exists'
            });
        }

        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

exports.createVistaarBroilerDistribution = async (req, res) => {
    try {
      const {
        CustomerName,
        MobileNumber,
        whatsappNo,
        Pincode,
        StateName,
        Location,
        CurrentProfession,
        InterestedState,
        InterestedCity,
        PreviousExposure,
        SourceOfInformation,
        OtherLocation,
        extrafield2,
        extrafield3,
        extrafield4
      } = req.body;
  
      // Basic required fields check
      const basicRequiredFields = {
        CustomerName,
        MobileNumber,
        CurrentProfession,
        InterestedState,
        InterestedCity,
        PreviousExposure
      };
  
      for (const [field, value] of Object.entries(basicRequiredFields)) {
        if (!value && value !== false) {
          return res.status(400).json({
            success: false,
            error: `${field} is required`
          });
        }
      }
  
      // Mobile number validation
      if (!/^\d{10}$/.test(MobileNumber)) {
        return res.status(400).json({
          success: false,
          error: "Mobile number must be 10 digits"
        });
      }
  
      // WhatsApp number validation (if provided)
      if (whatsappNo && !/^\d{10}$/.test(whatsappNo)) {
        return res.status(400).json({
          success: false,
          error: "WhatsApp number must be 10 digits"
        });
      }
  
      // Pincode validation (if provided)
      if (Pincode && !/^\d{6}$/.test(Pincode)) {
        return res.status(400).json({
          success: false,
          error: "Invalid pincode format"
        });
      }
  
      // Current Profession validation
      const validCurrentProfessions = ["Service", "Business", "Others"];
      if (!validCurrentProfessions.includes(CurrentProfession)) {
        return res.status(400).json({
          success: false,
          error: "Invalid CurrentProfession value"
        });
      }
  
      // Previous Exposure validation
      if (typeof PreviousExposure !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: "PreviousExposure must be a boolean value"
        });
      }
  
      // Source of Information validation (if provided)
      const validSourcesOfInformation = [
        "Social Media",
        "Employee Referral",
        "Vistaar Team",
        "Offline Market",
        "Others"
      ];
      if (SourceOfInformation && !validSourcesOfInformation.includes(SourceOfInformation)) {
        return res.status(400).json({
          success: false,
          error: "Invalid SourceOfInformation value"
        });
      }
  
      // Create Vistaar Broiler Distribution lead
      const vistaarBroilerDistribution = await VistaarBroilerDistribution.create({
        CustomerName,
        MobileNumber,
        whatsappNo,
        Pincode,
        StateName,
        Location,
        CurrentProfession,
        InterestedState,
        InterestedCity,
        PreviousExposure,
        SourceOfInformation,
        OtherLocation,
        extrafield2,
        extrafield3,
        extrafield4
      });
  
      return res.status(201).json({
        success: true,
        message: "Vistaar Broiler Distribution lead created successfully",
        data: vistaarBroilerDistribution
      });
  
    } catch (error) {
      console.error('Error in createVistaarBroilerDistribution:', error);
  
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          error: error.errors.map(e => e.message)
        });
      }
  
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          error: 'Record already exists'
        });
      }
  
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  };


  exports.createChicksInquiry = async (req, res) => {
    try {
      const {
        CustomerName,
        MobileNumber,
        whatsappNo,
        Occupation,
        chicks_range
      } = req.body;
  
      // Basic required fields check
      const basicRequiredFields = {
        CustomerName,
        MobileNumber,
        Occupation,
        chicks_range
      };
  
      for (const [field, value] of Object.entries(basicRequiredFields)) {
        if (!value && value !== false) {
          return res.status(400).json({
            success: false,
            error: `${field} is required`
          });
        }
      }
  
      // Mobile number validation
      if (!/^\d{10}$/.test(MobileNumber)) {
        return res.status(400).json({
          success: false,
          error: "Mobile number must be 10 digits"
        });
      }
  
      // WhatsApp number validation (if provided)
      if (whatsappNo && !/^\d{10}$/.test(whatsappNo)) {
        return res.status(400).json({
          success: false,
          error: "WhatsApp number must be 10 digits"
        });
      }
  
      // Create Chicks Inquiry
      const chicksInquiry = await ChicksInquiry.create({
        CustomerName,
        MobileNumber,
        whatsappNo,
        Occupation,
        chicks_range
      });
  
      return res.status(201).json({
        success: true,
        message: "Chicks inquiry created successfully",
        data: chicksInquiry
      });
  
    } catch (error) {
      console.error('Error in createChicksInquiry:', error);
  
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          error: error.errors.map(e => e.message)
        });
      }
  
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          error: 'Record already exists'
        });
      }
  
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  };

  const buildFilterConditions = (query) => {
    const conditions = {};
    const {
        source,
        state,
        EC_Shed_Plan,
        project,
        startDate,
        endDate,
        search
    } = query;

    if (source) conditions.Source = source;
    if (state) conditions.StateName = state;
    if (EC_Shed_Plan) conditions.EC_Shed_Plan = EC_Shed_Plan;
    if (project) conditions.Project = project;

    // Date range filter
    if (startDate && endDate) {
        conditions.createdAt = {
            [Op.between]: [new Date(startDate + " 00:00:00"), new Date(endDate + " 23:59:59")]
        };
    }

    // Global search across multiple fields
    if (search) {
        conditions[Op.or] = [
            { CustomerName: { [Op.like]: `%${search}%` } },
            { ContactNumber: { [Op.like]: `%${search}%` } },
            { CustomerMailId: { [Op.like]: `%${search}%` } },
            { location: { [Op.like]: `%${search}%` } },
            { otherLocation: { [Op.like]: `%${search}%` } },
            { pincode: { [Op.like]: `%${search}%` } }
        ];
    }

    return conditions;
};

// Get customers with filters and pagination
exports.getCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        const filterConditions = buildFilterConditions(req.query);

        const { count, rows } = await CustomerLeadForm.findAndCountAll({
            where: filterConditions,
            limit: pageSize,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });
        const totalCustomers = await CustomerLeadForm.count();

        // Process the data to handle WhatsApp number logic
        const formattedData = rows.map(lead => {
            const leadData = lead.toJSON();
            // If WhatsApp number is null, use ContactNumber
            leadData.WhatsAppNumber = leadData.WhatsAppNumber || leadData.ContactNumber;
            return leadData;
        });

        return res.status(200).json({
            success: true,
            data: formattedData,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / pageSize),
                currentPage: page,
                pageSize: pageSize
            },

            summary: {
              totalCustomers: totalCustomers,
              
          },
            filters: {
                source: req.query.source || null,
                state: req.query.state || null,
                EC_Shed_Plan: req.query.EC_Shed_Plan || null,
                project: req.query.project || null,
                dateRange: {
                    startDate: req.query.startDate || null,
                    endDate: req.query.endDate || null
                },
                search: req.query.search || null
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching customer data',
            error: error.message
        });
    }
};

// Export customers to Excel with filters
exports.exportCustomers = async (req, res) => {
    try {
        const filterConditions = buildFilterConditions(req.query);

        const customers = await CustomerLeadForm.findAll({
            where: filterConditions,
            order: [['createdAt', 'DESC']]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Customer Leads');

        // Define Excel columns based on EC_Shed_Plan
        const baseColumns = [
            { header: 'Customer Name', key: 'CustomerName', width: 20 },
            { header: 'Contact Number', key: 'ContactNumber', width: 15 },
            { header: 'WhatsApp Number', key: 'WhatsAppNumber', width: 15 },
            { header: 'Email', key: 'CustomerMailId', width: 25 },
            { header: 'State', key: 'StateName', width: 15 },
            { header: 'Location', key: 'location', width: 20 },
            { header: 'Other Location', key: 'otherLocation', width: 20 },
            { header: 'Pincode', key: 'pincode', width: 10 },
            { header: 'EC Shed Plan', key: 'EC_Shed_Plan', width: 20 },
            { header: 'Project', key: 'Project', width: 15 },
            { header: 'Investment Budget', key: 'Investment_Budget', width: 25 },
            { header: 'Number of Sheds', key: 'NUmberOfShed', width: 15 },
            { header: 'Source', key: 'Source', width: 15 },
            { header: 'Remark', key: 'Remark', width: 30 },
            { header: 'Created At', key: 'createdAt', width: 20 }
        ];

        const planningNewShedColumns = [
            { header: 'Land Available', key: 'LandAvailable', width: 15 },
            { header: 'Land Size', key: 'Land_Size', width: 15 },
            { header: 'Unit', key: 'Unit', width: 10 },
            { header: 'Electricity', key: 'Electricity', width: 15 },
            { header: 'Water Availability', key: 'WaterAvailabilty', width: 15 },
            { header: 'Approachable Road', key: 'ApproachableRoad', width: 15 }
        ];

        const openToShedColumns = [
            { header: 'Integration Company', key: 'IntegrationCompany', width: 20 },
            { header: 'Shed Size', key: 'ShedSize', width: 15 },
            { header: 'Current Shed Direction', key: 'CurrentShedDirection', width: 20 },
            { header: 'Electricity Phase', key: 'ElectricityPhase', width: 15 },
            { header: 'Current Bird Capacity', key: 'CurrentBirdCapacity', width: 20 }
        ];

        // Set all columns
        worksheet.columns = [...baseColumns, ...planningNewShedColumns, ...openToShedColumns];

        // Add data rows with formatting
        customers.forEach(customer => {
            const customerData = customer.toJSON();
            // Handle WhatsApp number logic
            customerData.WhatsAppNumber = customerData.WhatsAppNumber || customerData.ContactNumber;
            
            // Format boolean values
            customerData.LandAvailable = customerData.LandAvailable ? 'Yes' : 'No';
            customerData.WaterAvailabilty = customerData.WaterAvailabilty ? 'Yes' : 'No';
            customerData.ApproachableRoad = customerData.ApproachableRoad ? 'Yes' : 'No';
            
            // Format date
            customerData.createdAt = customerData.createdAt ? 
                new Date(customerData.createdAt).toLocaleString() : '';

            worksheet.addRow(customerData);
        });

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=CustomerLeads_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exporting customers:', error);
        return res.status(500).json({
            success: false,
            message: 'Error exporting customer data',
            error: error.message
        });
    }
};



exports.getEmployeeLeads = async (req, res) => {
  try {
      // Get pagination and sorting parameters from query
      const { 
          page = 1, 
          pageSize = 10, 
          sortBy = 'createdAt', 
          sortOrder = 'DESC' 
      } = req.query;
      
      const { employeeId } = req.params;

      // Find employee with their assigned campaigns
      const employee = await Employee.findOne({
          where: {
              EmployeeId: employeeId
          },
          include: [{
              model: Campaign,
              through: EmployeeCampaign,
              attributes: ['CampaignId', 'CampaignName']
          }]
      });

      // Check if employee exists
      if (!employee) {
          return res.status(201).json({
              success: false,
              message: 'Employee not found'
          });
      }

      // Check if employee has any campaigns
      if (!employee.Campaigns || employee.Campaigns.length === 0) {
          return res.status(404).json({
              success: false,
              message: 'No campaigns assigned to this employee'
          });
      }

      // Get campaign IDs
      const campaignIds = employee.Campaigns.map(campaign => campaign.CampaignId);

      // Find all sources associated with these campaigns
      const sources = await Source.findAll({
          where: {
              campaignId: {
                  [Op.in]: campaignIds
              }
          },
          attributes: ['SourceId']
      });

      const sourceIds = sources.map(source => source.SourceId);

      // If no sources found
      if (sourceIds.length === 0) {
          return res.status(404).json({
              success: false,
              message: 'No sources found for assigned campaigns'
          });
      }

      // Fetch leads with pagination
      const { count, rows: leads } = await CustomerLeadForm.findAndCountAll({
          where: {
              sourceId: {
                  [Op.in]: sourceIds
              }
          },
          include: [{
              model: Source,
              as: 'sourceDetails',
              include: [{
                  model: Campaign,
                  attributes: ['CampaignId', 'CampaignName']
              }]
          }],
          order: [[sortBy, sortOrder]],
          limit: parseInt(pageSize),
          offset: (parseInt(page) - 1) * parseInt(pageSize)
      });

      // Send response
      res.json({
          success: true,
          totalCount: count,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          data: leads,
          debug: {
              employeeId,
              assignedCampaignIds: campaignIds,
              assignedSourceIds: sourceIds
          }
      });

  } catch (error) {
      console.error('Error fetching employee leads:', error);
      res.status(500).json({
          success: false,
          message: 'Error fetching employee leads',
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
  }
};

 


 

 










