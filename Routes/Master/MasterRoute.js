const express = require('express');
const router = express.Router();
const MasterController = require('../../Controller/Master/MasterController');

// Get all zonal managers with their region information
router.get('/get-all-region', MasterController.getAllRegions);
router.get('/get-all-zonal-manager', MasterController.getZonalManagers);
router.post('/zonal-manager', MasterController.addZonalManager);
router.post('/zonal-managers/status', MasterController.updateZonalManagerStatus);
module.exports = router;