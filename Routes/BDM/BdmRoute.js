const express = require("express");
const router = express.Router();
const multer = require("multer");
// const upload = multer({ dest: 'uploads/' });
const BDMController = require("../../Controller/BDM/BdmController");
const auth = require("../../middleware/check-auth");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadMiddleware = upload.fields([
  { name: "images", maxCount: 10 },
  // Add any other fields you need here
]);

router.patch(
  "/estimations/:id/status",
  uploadMiddleware,
  auth,
  BDMController.updateEstimationStatus
);
router.get("/leads/bdm/:bdmId", BDMController.getLeadsByBDMId);

router.get("/estimations", BDMController.getAllEstimations);

router.put("/leads/:leadId/bdm-remarks", auth, BDMController.updateBDMRemarks);

router.get("/customer/lead/:employeeId",  BDMController.getEmployeeLeads);

router.get('/distinct/:field/bdm/:bdmId', BDMController.getBdmDistinctValues);


router.get('/zm/region',BDMController.getEmployeeRegionsWithLeads );
 

router.get('/zm/regions',BDMController.getZonalManagerRegions );


module.exports = router;
