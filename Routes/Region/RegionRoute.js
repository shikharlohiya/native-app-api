// routes/regionRoutes.js

const express = require('express');
const router = express.Router();
const regionController = require('../../Controller/Region/RegionController');

router.get('/region', regionController.getRegionsByState);

module.exports = router;