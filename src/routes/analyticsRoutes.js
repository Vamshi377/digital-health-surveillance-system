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
  authorize("dmo", "hospital_admin"),
  dmoDiseaseBurdenHandler
);

router.get(
  "/dmo/overview",
  authenticate,
  authorize("dmo", "hospital_admin"),
  dmoOverviewHandler
);

router.get(
  "/dmo/patient-cluster",
  authenticate,
  authorize("dmo", "hospital_admin"),
  dmoPatientClusterHandler
);

module.exports = router;
