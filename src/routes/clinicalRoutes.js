const express = require("express");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/rbac");
const { uploadLabReportImage } = require("../middlewares/upload");
const {
  searchPatientByPhoneHandler,
  registerPatientHandler,
  createAppointmentHandler,
  nurseQueueHandler,
  createMedicalRecordHandler,
  uploadLabReportHandler,
  diagnosePatientHandler,
  doctorDashboardHandler,
  recordSummaryHandler,
  patientHistoryHandler,
  patientHistoryByCodeHandler,
  myRecordsHandler
} = require("../controllers/clinicalController");

const router = express.Router();

router.use(authenticate);

router.get("/patients/search-by-phone", authorize("receptionist", "admin"), searchPatientByPhoneHandler);
router.post("/patients", authorize("receptionist", "admin"), registerPatientHandler);
router.post("/patients/:patientId/appointments", authorize("receptionist", "admin"), createAppointmentHandler);
router.get("/nurse/queue", authorize("nurse", "admin"), nurseQueueHandler);
router.post("/appointments/:appointmentId/records", authorize("nurse", "admin"), createMedicalRecordHandler);
router.post(
  "/records/:recordId/lab-reports",
  authorize("lab_technician", "admin"),
  uploadLabReportImage.single("reportImage"),
  uploadLabReportHandler
);
router.post("/records/:recordId/diagnosis", authorize("doctor", "admin"), diagnosePatientHandler);

router.get("/doctor/dashboard", authorize("doctor", "admin"), doctorDashboardHandler);
router.get("/records/:recordId/summary", authorize("doctor", "admin"), recordSummaryHandler);
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
