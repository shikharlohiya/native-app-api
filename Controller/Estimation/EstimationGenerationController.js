/**
 * Estimation Generation Controller
 *
 * This controller handles the generation of estimation PDFs based on user input.
 * It parses natural language input to extract customer details and shed dimensions,
 * then generates a customized PDF estimation document using EJS templates.
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const pdf = require('pdf-creator-node');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

// Helper function to extract customer name from input text
// const extractCustomerName = (inputText) => {
//   // Look for patterns like "for [name]" or "customer [name]"
//   const forPattern = /for\s+([A-Za-z\s]+?)(?:\s+shed|\s+size|\s+\d|\s*$)/i;
//   const customerPattern = /customer\s+([A-Za-z\s]+?)(?:\s+shed|\s+size|\s+\d|\s*$)/i;

//   let match = inputText.match(forPattern) || inputText.match(customerPattern);

//   if (match && match[1]) {
//     return match[1].trim();
//   }

//   // If no specific pattern found, try to extract name based on position
//   const words = inputText.split(' ');
//   const forIndex = words.findIndex(word => word.toLowerCase() === 'for');

//   if (forIndex !== -1 && forIndex + 1 < words.length) {
//     // Take up to 3 words after "for" as the name
//     return words.slice(forIndex + 1, forIndex + 4).join(' ').replace(/shed|size|\d+x\d+/gi, '').trim();
//   }

//   return 'Customer'; // Default if no name found
// };

// // Helper function to extract shed dimensions from input text
// const extractShedDimensions = (inputText) => {
//   // Look for pattern like "300x25" or "size 300 x 25" or "dimensions 300 by 25"
//   const dimensionPattern = /(\d+)\s*[xX]\s*(\d+)/;
//   const sizePattern = /size\s+(\d+)\s*[xX]\s*(\d+)/i;
//   const dimensionsPattern = /dimensions\s+(\d+)\s*(?:by|x)\s*(\d+)/i;

//   const match = inputText.match(dimensionPattern) ||
//                 inputText.match(sizePattern) ||
//                 inputText.match(dimensionsPattern);

//   if (match) {
//     return {
//       length: parseInt(match[1]),
//       width: parseInt(match[2])
//     };
//   }

//   return { length: 300, width: 25 }; // Default dimensions if not found
// };

/**
 * Generate and download an estimation PDF based on user input
 *
 * Parses natural language input to extract customer details and shed dimensions,
 * then generates a customized PDF estimation document using EJS template and returns it as a download.
 */
exports.generateAndDownloadEstimation = async (req, res) => {
  try {
    const { inputText } = req.body;

    if (!inputText) {
      return res.status(400).json({
        success: false,
        message: "Input text is required"
      });
    }

    // Extract customer name and shed dimensions from input text
    const customerName = extractCustomerName(inputText);
    const dimensions = extractShedDimensions(inputText);

    // Calculate area
    const area = dimensions.length * dimensions.width;

    // Generate a unique estimation ID
    const estimationId = uuidv4().substring(0, 8);
    const filename = `estimation_${estimationId}.pdf`;
    const outputPath = path.join(__dirname, '../../public/templates/pdf', filename);

    // Current date in DD.MM.YYYY format
    const estimationDate = moment().format('DD.MM.YYYY');

    // Prepare data for the template
    const data = {
      estimationId,
      estimationDate,
      customerName,
      customerLocation: 'N/A', // You can add this as a parameter if needed
      length: dimensions.length,
      width: dimensions.width,
      area: area
    };

    // Read the EJS template
    const templatePath = path.join(__dirname, '../../views/templates/estimation.ejs');

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        message: "Estimation template not found. Please check the template directory."
      });
    }

    // Render the EJS template to HTML
    const html = await ejs.renderFile(templatePath, data);

    // PDF document options
    const options = {
      format: "A4",
      orientation: "portrait",
      border: "10mm",
      childProcessOptions: {
        env: {
          OPENSSL_CONF: '/dev/null',
        },
      },
      base: `file://${path.resolve(__dirname, '../../')}`,
      timeout: 30000,
      header: {
        height: "0mm"
      },
      footer: {
        height: "0mm"
      }
    };

    // PDF document definition
    const document = {
      html: html,
      data: data,
      path: outputPath,
      type: "buffer"
    };

    // Generate PDF
    const buffer = await pdf.create(document, options);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send the PDF buffer directly to the client
    return res.send(buffer);

  } catch (error) {
    console.error("Error generating estimation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate estimation",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Download a generated estimation PDF
 *
 * Returns the requested PDF file for download
 */
exports.downloadEstimation = (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../public/templates/pdf', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Estimation file not found"
      });
    }

    res.download(filePath);

  } catch (error) {
    console.error("Error downloading estimation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download estimation",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Upload an estimation template PDF
 *
 * This function can be used to upload a new template PDF
 * Note: This is not exposed via a route yet, but can be added if needed
 */
exports.uploadEstimationTemplate = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const templatePath = path.join(__dirname, '../../public/templates/pdf/estimation_template.pdf');

    // Move the uploaded file to the template location
    fs.renameSync(req.file.path, templatePath);

    res.status(200).json({
      success: true,
      message: "Estimation template uploaded successfully"
    });

  } catch (error) {
    console.error("Error uploading estimation template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload estimation template",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Generate an estimation PDF based on user input (GET method for browser testing)
 *
 * This endpoint allows testing directly from a browser using query parameters
 * Example: /api/estimation/generate?name=Shikhar%20Lohiya&length=300&width=25
 */
exports.generateEstimationGet = async (req, res) => {
  try {
    const { name, length, width, text, location } = req.query;

    // If text parameter is provided, use it for natural language processing
    // Otherwise use the explicit parameters
    let customerName, dimensions;

    if (text) {
      customerName = extractCustomerName(text);
      dimensions = extractShedDimensions(text);
    } else {
      // Validate required parameters if not using text
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Customer name is required. Use 'name' parameter or provide 'text' for natural language processing."
        });
      }

      customerName = name;
      dimensions = {
        length: parseInt(length) || 300,
        width: parseInt(width) || 25
      };
    }

    // Calculate area
    const area = dimensions.length * dimensions.width;

    // Generate a unique estimation ID
    const estimationId = uuidv4().substring(0, 8);
    const filename = `estimation_${estimationId}.pdf`;
    const outputPath = path.join(__dirname, '../../public/templates/pdf', filename);

    // Current date in DD.MM.YYYY format
    const estimationDate = moment().format('DD.MM.YYYY');

    // Prepare data for the template
    const data = {
      estimationId,
      estimationDate,
      customerName,
      customerLocation: location || 'N/A',
      length: dimensions.length,
      width: dimensions.width,
      area: area
    };

    // Read the EJS template
    const templatePath = path.join(__dirname, '../../views/templates/estimation.ejs');

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        message: "Estimation template not found. Please check the template directory."
      });
    }

    // Render the EJS template to HTML
    const html = await ejs.renderFile(templatePath, data);

    // PDF document options
    const options = {
      format: "A4",
      orientation: "portrait",
      border: "10mm",
      childProcessOptions: {
        env: {
          OPENSSL_CONF: '/dev/null',
        },
      },
      base: `file://${path.resolve(__dirname, '../../')}`,
      timeout: 30000,
      header: {
        height: "0mm"
      },
      footer: {
        height: "0mm"
      }
    };

    // PDF document definition
    const document = {
      html: html,
      data: {},
      path: outputPath,
      type: "buffer"
    };

    // Generate PDF
    const buffer = await pdf.create(document, options);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send the PDF buffer directly to the client
    return res.send(buffer);

  } catch (error) {
    console.error("Error generating estimation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate estimation",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};



/**
 * Helper function to extract customer name from text
 * @param {string} text - Text to extract customer name from
 * @returns {string} - Extracted customer name or default value
 */
const extractCustomerName = (text) => {
  // Basic NLP to extract name - you can replace with more sophisticated logic
  const nameMatch = text.match(/for\s+([A-Za-z\s]+)/i);
  return nameMatch ? nameMatch[1].trim() : 'Customer';
};

/**
 * Helper function to extract shed dimensions from text
 * @param {string} text - Text to extract dimensions from
 * @returns {Object} - Extracted dimensions or default values
 */
const extractShedDimensions = (text) => {
  // Basic dimension extraction - replace with better logic as needed
  const lengthMatch = text.match(/(\d+)\s*(?:ft|feet|foot)?\s*(?:x|by)/i);
  const widthMatch = text.match(/(?:x|by)\s*(\d+)\s*(?:ft|feet|foot)?/i);

  return {
    length: lengthMatch ? parseInt(lengthMatch[1]) : 300,
    width: widthMatch ? parseInt(widthMatch[1]) : 25
  };
};

/**
 * Controller to generate an estimation PDF
 */
exports.generateEstimationGet = async (req, res) => {
  try {
    const { name, length, width, text, location } = req.query;

    // If text parameter is provided, use it for natural language processing
    // Otherwise use the explicit parameters
    let customerName, dimensions;

    if (text) {
      customerName = extractCustomerName(text);
      dimensions = extractShedDimensions(text);
    } else {
      // Validate required parameters if not using text
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Customer name is required. Use 'name' parameter or provide 'text' for natural language processing."
        });
      }

      customerName = name;
      dimensions = {
        length: parseInt(length) || 300,
        width: parseInt(width) || 25
      };
    }

    // Calculate area
    const area = dimensions.length * dimensions.width;

    // Generate a unique estimation ID
    const estimationId = uuidv4().substring(0, 8);
    const filename = `estimation_${estimationId}.pdf`;
    const outputPath = path.join(__dirname, '../../public/templates/pdf', filename);

    // Current date in DD.MM.YYYY format
    const estimationDate = moment().format('DD.MM.YYYY');

    // Prepare data for the template
    const data = {
      estimationId,
      estimationDate,
      customerName,
      customerLocation: location || 'N/A',
      length: dimensions.length,
      width: dimensions.width,
      area: area
    };

    // Read the EJS template
    const templatePath = path.join(__dirname, '../../views/templates/estimation.ejs');

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        message: "Estimation template not found. Please check the template directory."
      });
    }

    // Render the EJS template to HTML
    const html = await ejs.renderFile(templatePath, data);

    // PDF document options
    const options = {
      format: "A4",
      orientation: "portrait",
      border: "10mm"
    };

    // PDF document definition
    const document = {
      html: html,
      data: data,
      path: outputPath,
      type: "buffer"
    };

    // Generate PDF
    const buffer = await pdf.create(document, options);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send the PDF buffer directly to the client
    return res.send(buffer);
  } catch (error) {
    console.error("Error generating estimation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate estimation",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};




/**
 * Helper function to extract customer name from text
 * @param {string} text - Text to extract customer name from
 * @returns {string} - Extracted customer name or default value
 */


/**
 * Helper function to extract shed dimensions from text
 * @param {string} text - Text to extract dimensions from
 * @returns {Object} - Extracted dimensions or default values
 */


/**
 * Prepare data for estimation template
 */
const prepareEstimationData = (req) => {
  const { name, length, width, text, location } = req.query;

  // If text parameter is provided, use it for natural language processing
  // Otherwise use the explicit parameters
  let customerName, dimensions;

  if (text) {
    customerName = extractCustomerName(text);
    dimensions = extractShedDimensions(text);
  } else {
    // Validate required parameters if not using text
    if (!name) {
      throw new Error("Customer name is required. Use 'name' parameter or provide 'text' for natural language processing.");
    }

    customerName = name;
    dimensions = {
      length: parseInt(length) || 300,
      width: parseInt(width) || 25
    };
  }

  // Calculate area
  const area = dimensions.length * dimensions.width;

  // Generate a unique estimation ID
  const estimationId = uuidv4().substring(0, 8);

  // Current date in DD.MM.YYYY format
  const estimationDate = moment().format('DD.MM.YYYY');

  // Prepare data for the template
  return {
    estimationId,
    estimationDate,
    customerName,
    customerLocation: location || 'N/A',
    length: dimensions.length,
    width: dimensions.width,
    area: area
  };
};

/**
 * Controller to preview estimation in HTML
 */
exports.previewEstimationHtml = async (req, res) => {
  try {
    // Prepare data for template
    const data = prepareEstimationData(req);

    // Read the EJS template
    const templatePath = path.join(__dirname, '../../views/templates/estimation.ejs');

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        message: "Estimation template not found. Please check the template directory."
      });
    }

    // Render the EJS template to HTML
    const html = await ejs.renderFile(templatePath, data);

    // Send HTML response
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);

  } catch (error) {
    console.error("Error generating HTML preview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate HTML preview",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Controller to generate an estimation PDF
 */
exports.generateEstimationPdf = async (req, res) => {
  try {
    // Prepare data for template
    const data = prepareEstimationData(req);

    const filename = `estimation_${data.estimationId}.pdf`;
    const outputPath = path.join(__dirname, '../../public/templates/pdf', filename);

    // Read the EJS template
    const templatePath = path.join(__dirname, '../../views/templates/estimation.ejs');

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        message: "Estimation template not found. Please check the template directory."
      });
    }

    // Render the EJS template to HTML
    const html = await ejs.renderFile(templatePath, data);

    // PDF document options
    const options = {
      format: "A4",
      orientation: "portrait",
      border: "10mm"
    };

    // PDF document definition
    const document = {
      html: html,
      data: {},
      path: outputPath,
      type: "buffer"
    };

    // Generate PDF
    const buffer = await pdf.create(document, options);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send the PDF buffer directly to the client
    return res.send(buffer);

  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Legacy handler for backward compatibility
 */
exports.generateEstimationGet = async (req, res) => {
  // Check if preview is requested
  if (req.query.preview === 'true' || req.query.preview === '1') {
    return await exports.previewEstimationHtml(req, res);
  } else {
    return await exports.generateEstimationPdf(req, res);
  }
};