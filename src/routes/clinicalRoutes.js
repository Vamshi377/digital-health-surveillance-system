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

router.get("/patients/search-by-phone", authorize("receptionist", "hospital_admin"), searchPatientByPhoneHandler);
router.post("/patients", authorize("receptionist", "hospital_admin"), registerPatientHandler);
router.post("/patients/:patientId/appointments", authorize("receptionist", "hospital_admin"), createAppointmentHandler);
router.get("/nurse/queue", authorize("nurse", "hospital_admin"), nurseQueueHandler);
router.post("/appointments/:appointmentId/records", authorize("nurse", "hospital_admin"), createMedicalRecordHandler);
router.post(
  "/records/:recordId/lab-reports",
  authorize("lab_technician", "hospital_admin"),
  uploadLabReportImage.single("reportImage"),
  uploadLabReportHandler
);
router.post("/records/:recordId/diagnosis", authorize("doctor", "hospital_admin"), diagnosePatientHandler);

router.get("/doctor/dashboard", authorize("doctor", "hospital_admin"), doctorDashboardHandler);
router.get("/records/:recordId/summary", authorize("doctor", "hospital_admin"), recordSummaryHandler);
router.get(
  "/patients/:patientId/history",
  authorize("doctor", "nurse", "lab_technician", "dmo", "hospital_admin"),
  patientHistoryHandler
);
router.get(
  "/patients/by-code/:patientCode/history",
  authorize("doctor", "nurse", "lab_technician", "dmo", "hospital_admin"),
  patientHistoryByCodeHandler
);
router.get("/patient/me/history", authorize("patient"), myRecordsHandler);

module.exports = router;
