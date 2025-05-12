const express = require('express');
const router = express.Router();
const estimationGenerationController = require('../../Controller/Estimation/EstimationGenerationController');
const auth = require('../../middleware/check-auth');

// Route to generate and download estimation based on user input
router.post('/generate-and-download',  estimationGenerationController.generateAndDownloadEstimation);

// Route to get a previously generated estimation PDF (for record access)
router.get('/download/:filename', auth, estimationGenerationController.downloadEstimation);

// Browser-friendly GET route for testing (with query parameters)
router.get('/generate', estimationGenerationController.generateEstimationGet);

 
router.get('/preview', estimationGenerationController.previewEstimationHtml);

module.exports = router;
