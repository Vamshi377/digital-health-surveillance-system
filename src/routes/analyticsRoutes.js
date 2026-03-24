const express = require("express");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/rbac");
const {
  dmoDiseaseBurdenHandler,
  dmoOverviewHandler,
  dmoPatientClusterHandler
} = require("../controllers/analyticsController");

const router = express.Router();

router.get(
  "/dmo/disease-burden",
  authenticate,
  authorize("government_officer", "admin"),
  dmoDiseaseBurdenHandler
);

router.get(
  "/dmo/overview",
  authenticate,
  authorize("government_officer", "admin"),
  dmoOverviewHandler
);

router.get(
  "/dmo/patient-cluster",
  authenticate,
  authorize("government_officer", "admin"),
  dmoPatientClusterHandler
);

module.exports = router;
