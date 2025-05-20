const express = require('express');
const router = express.Router();
const models = require('../models/models.js');
const sequelize = require('../models/index.js');
const auth = require('../middleware/check-auth.js');
const Region = require('../models/region.js');
const Parivartan_BDM = require('../models/Parivartan_BDM.js')
const Parivartan_Region = require('../models/Parivartan_Region.js')
const Parivartan_State = require('../models/Parivartan_State.js');
const { Op } = require('sequelize');
const State = require('../models/state.js');
const City = require('../models/city.js');
const verifySession = require(".././middleware/sessionVerify.js");


router.get('/places/:pincode',auth, async (req, res) => {
  try {
    const pincode = req.params.pincode;
    const query = `
      SELECT 
        place.PlaceId,
        place.PlaceName,
        place.CityId,
        place.PINCode,
        place.Deleted,
        city.CityId AS "city.CityId",
        city.CityName AS "city.CityName",
        state.StateCode AS "state.StateCode",
        state.StateName AS "state.StateName"
      FROM place_table AS place
      LEFT OUTER JOIN city_table AS city ON place.CityId = city.CityId
      LEFT OUTER JOIN state_table AS state ON city.StateCode = state.StateCode
      WHERE place.PINCode = :pincode;
    `;

    const places = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { pincode: pincode },
    });

    if (places.length > 0) {
      const response = {
        cityId: places[0]["city.CityId"],
        cityName: places[0]["city.CityName"],
        stateCode: places[0]["state.StateCode"],
        stateName: places[0]["state.StateName"],
        places: places.map(place => ({
          placeId: place.PlaceId,
          placeName: place.PlaceName,
        })),
      };

      res.json(response);
    } else {
      res.status(404).json({ error: 'No places found for the provided pincode' });
    }
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/regions', async (req, res) => {
  try {
    const { stateName } = req.query;
    
    if (!stateName) {
      return res.status(400).json({ error: 'State name is required' });
    }

    const regions = await Region.findAll({
      where: {
        stateName: {
          [Op.like]: `%${stateName}%`
        }
      }
    });

    if (regions.length === 0) {
      return res.status(404).json({ message: 'No regions found for the given state name' });
    }

    res.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

 
// API to get regions by state
router.get('/regions/:stateName', async (req, res) => {
  try {
    const { stateName } = req.params;
    const state = await Parivartan_State.findOne({
      where: {
        StateName: stateName,
        Deleted: 'N'
      },
      include: [{
        model: Parivartan_Region,
        where: { Deleted: 'N' },
        attributes: ['RegionId', 'RegionName']
      }]
    });

    if (!state) {
      return res.status(404).json({ message: 'State not found' });
    }

    if (state.parivartan_regions.length === 0) {
      return res.status(404).json({ message: 'No regions found for this state' });
    }

    res.json(state.parivartan_regions);
  } catch (error) {
    console.error('Error in /regions/:stateName:', error);
    res.status(500).json({ error: error.message });
  }
});




router.get('/v3/regions',verifySession, async (req, res) => {
  try {
    const { stateName } = req.query;
    
    if (!stateName) {
      return res.status(400).json({ error: 'State name is required' });
    }

    const regions = await Region.findAll({
      where: {
        stateName: {
          [Op.like]: `%${stateName}%`
        }
      }
    });

    if (regions.length === 0) {
      return res.status(404).json({ message: 'No regions found for the given state name' });
    }

    res.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

 
// API to get regions by state
router.get('/v3/regions/:stateName',verifySession, async (req, res) => {
  try {
    const { stateName } = req.params;
    const state = await Parivartan_State.findOne({
      where: {
        StateName: stateName,
        Deleted: 'N'
      },
      include: [{
        model: Parivartan_Region,
        where: { Deleted: 'N' },
        attributes: ['RegionId', 'RegionName']
      }]
    });

    if (!state) {
      return res.status(404).json({ message: 'State not found' });
    }

    if (state.parivartan_regions.length === 0) {
      return res.status(404).json({ message: 'No regions found for this state' });
    }

    res.json(state.parivartan_regions);
  } catch (error) {
    console.error('Error in /regions/:stateName:', error);
    res.status(500).json({ error: error.message });
  }
});




// API to get employee by region
 


// router.get('/employee/:regionName', async (req, res) => {
//   try {
//     const { regionName } = req.params;
//     const region = await Parivartan_Region.findOne({
//       where: {
//         RegionName: regionName,
//         Deleted: 'N'
//       },
//       include: [{
//         model: Parivartan_BDM,
//         where: { Deleted: 'N' },
//         attributes: ['EmployeeId', 'EmployeeName']
//       }]
//     });

//     if (!region) {
//       return res.status(404).json({ message: 'Region not found' });
//     }

//     if (region.parivartan_bdms.length === 0) {
//       return res.json({ message: 'No employee assigned to this region' });
//     }

//     const bdm = region.parivartan_bdms[0];
//     res.json({
//       EmployeeId: bdm.EmployeeId,
//       EmployeeName: bdm.EmployeeName
//     });
//   } catch (error) {
//     console.error('Error in /employee/:regionName:', error);
//     res.status(500).json({ error: error.message });
//   }
// });





// router.get('/employee/:regionId', async (req, res) => {
//   try {
//       const { regionId } = req.params;

//       const bdm = await Parivartan_BDM.findAll({
//           where: {
//               RegionId: regionId,
//               is_active: 'Active',
//               Deleted: 'N'
//           },
//           attributes: ['EmployeeId', 'EmployeeName', 'Project']
//       });
//       console.log(bdm,'..............');
      

//       if (!bdm || bdm.length === 0) {
//           return res.status(404).json({
//               success: false,
//               message: 'No active employee found for this region'
//           });
//       }

//       res.json({
//           success: true,
//           data: bdm.map(employee => ({
//               EmployeeId: employee.EmployeeId,
//               EmployeeName: employee.EmployeeName,
//               Project: employee.Project
//           }))
//       });

//   } catch (error) {
//       console.error('Error in /employee/:regionId:', error);
//       res.status(500).json({
//           success: false,
//           message: 'Error fetching employee details',
//           error: error.message
//       });
//   }
// });
router.get('/v3/employee/:regionId', async (req, res) => {
  try {
      const { regionId } = req.params;

      const bdm = await Parivartan_BDM.findAll({
          where: {
              RegionId: regionId,
              is_active: 'Active',
              Deleted: 'N'
          },
          attributes: ['EmployeeId', 'EmployeeName', 'Project', 'is_bdm', 'is_zonal_manager']
      });

      if (!bdm || bdm.length === 0) {
          return res.status(404).json({
              success: false,
              message: 'No active employee found for this region'
          });
      }

      res.json({
          success: true,
          data: bdm.map(employee => {
              // Determine lead sources based on roles
              let leadSources = [];
              if (employee.is_zonal_manager === 'Yes') {
                leadSources.push({
                    id: 19,
                    name: 'PZH_lead'
                });
            }
            if (employee.is_bdm === 'Yes') {
                leadSources.push({
                    id: 13,
                    name: 'BDM_Lead'
                });
            }

              return {
                  EmployeeId: employee.EmployeeId,
                  EmployeeName: employee.EmployeeName,
                  Project: employee.Project,
                  leadSources: leadSources,
                  is_bdm: employee.is_bdm,
                  is_zonal_manager: employee.is_zonal_manager
              };
          })
      });

  } catch (error) {
      console.error('Error in /employee/:regionId:', error);
      res.status(500).json({
          success: false,
          message: 'Error fetching employee details',
          error: error.message
      });
  }
});



router.get('/states/search', async (req, res) => {
  try {
      const { query } = req.query;

      // if (!query) {
      //     return res.status(400).json({
      //         success: false,
      //         message: 'Search query is required'
      //     });
      // }

      const states = await State.findAll({
          attributes: ['StateCode', 'StateName'],
          where: {
              CountryCode: 'IN',
              // StateName: {
              //     [Op.like]: `%${query}%`
              // }
          },
          order: [
              ['StateName', 'ASC']
          ]
      });

      return res.status(200).json({
          success: true,
          data: states,
          message: 'States searched successfully'
      });
  } catch (error) {
      console.error('Error searching states:', error);
      return res.status(500).json({
          success: false,
          message: 'Error searching states',
          error: error.message
      });
  }
});


router.get('/cities/search/:stateCode', async (req, res) => {
  try {
      const { stateCode } = req.params;
      const { query } = req.query;

      if (!stateCode) {
          return res.status(400).json({
              success: false,
              message: 'Both state code and search query are required'
          });
      }

      const cities = await City.findAll({
          attributes: ['CityId', 'CityName'],
          where: {
              StateCode: stateCode,
              // Deleted: 'N',
              // CityName: {
              //     [Op.like]: `%${query}%`
              // }
          },
          order: [
              ['CityName', 'ASC']
          ]
      });

      return res.status(200).json({
          success: true,
          data: cities,
          message: 'Cities searched successfully'
      });
  } catch (error) {
      console.error('Error searching cities:', error);
      return res.status(500).json({
          success: false,
          message: 'Error searching cities',
          error: error.message
      });
  }
});


module.exports = router;


