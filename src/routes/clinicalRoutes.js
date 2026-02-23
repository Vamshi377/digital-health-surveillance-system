const express = require("express");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/rbac");
const {
  registerPatientHandler,
  createMedicalRecordHandler,
  uploadLabReportHandler,
  diagnosePatientHandler,
  doctorDashboardHandler,
  patientHistoryHandler,
  patientHistoryByCodeHandler,
  myRecordsHandler
} = require("../controllers/clinicalController");

const router = express.Router();

router.use(authenticate);

router.post("/patients", authorize("receptionist", "admin"), registerPatientHandler);
router.post("/patients/:patientId/records", authorize("nurse", "admin"), createMedicalRecordHandler);
router.post("/records/:recordId/lab-reports", authorize("lab_technician", "admin"), uploadLabReportHandler);
router.post("/records/:recordId/diagnosis", authorize("doctor", "admin"), diagnosePatientHandler);

router.get("/doctor/dashboard", authorize("doctor", "admin"), doctorDashboardHandler);
router.get(
  "/patients/:patientId/history",
  authorize("doctor", "nurse", "lab_technician", "government_officer", "admin"),
  patientHistoryHandler
);
router.get(
  "/patients/by-code/:patientCode/history",
  authorize("doctor", "nurse", "lab_technician", "government_officer", "admin"),
  patientHistoryByCodeHandler
);
router.get("/patient/me/history", authorize("patient"), myRecordsHandler);

module.exports = router;
