const express = require("express");
const { db } = require("../db");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");

const router = express.Router();

function getPatientRecord(patientId) {
  const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(patientId);
  if (!patient) {
    return null;
  }

  const vitals = db
    .prepare("SELECT * FROM vitals WHERE patient_id = ? ORDER BY created_at DESC")
    .all(patientId);
  const labOrders = db
    .prepare("SELECT * FROM lab_orders WHERE patient_id = ? ORDER BY created_at DESC")
    .all(patientId);
  const labResults = db
    .prepare(
      `SELECT lr.*, lo.patient_id
       FROM lab_results lr
       JOIN lab_orders lo ON lo.id = lr.lab_order_id
       WHERE lo.patient_id = ?
       ORDER BY lr.created_at DESC`
    )
    .all(patientId);
  const diagnoses = db
    .prepare("SELECT * FROM diagnoses WHERE patient_id = ? ORDER BY created_at DESC")
    .all(patientId);

  return {
    patient,
    vitals,
    labOrders,
    labResults,
    diagnoses
  };
}

router.use(authenticate);

router.post("/patients", authorize("receptionist"), (req, res) => {
  const { fullName, age, address } = req.body;
  if (!fullName || !age || !address) {
    return res.status(400).json({ error: "fullName, age, address are required" });
  }

  const result = db
    .prepare(
      `INSERT INTO patients (full_name, age, address, created_by)
       VALUES (?, ?, ?, ?)`
    )
    .run(fullName, age, address, req.user.id);

  return res.status(201).json({ id: result.lastInsertRowid, message: "Patient registered" });
});

router.post("/patients/:id/vitals", authorize("nurse"), (req, res) => {
  const { symptoms, temperature, bpSystolic, bpDiastolic, pulse } = req.body;
  if (!symptoms || temperature == null || !bpSystolic || !bpDiastolic || !pulse) {
    return res.status(400).json({
      error: "symptoms, temperature, bpSystolic, bpDiastolic, pulse are required"
    });
  }

  const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  db.prepare(
    `INSERT INTO vitals (patient_id, recorded_by, symptoms, temperature, bp_systolic, bp_diastolic, pulse)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(req.params.id, req.user.id, symptoms, temperature, bpSystolic, bpDiastolic, pulse);

  return res.status(201).json({ message: "Vitals recorded" });
});

router.get(
  "/patients/:id",
  authorize("doctor", "nurse", "lab_technician", "receptionist", "admin"),
  (req, res) => {
    const record = getPatientRecord(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Patient not found" });
    }
    return res.json(record);
  }
);

router.get("/doctor/dashboard", authorize("doctor"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.id, p.full_name, p.age, p.address, p.created_at,
              (SELECT v.created_at FROM vitals v WHERE v.patient_id = p.id ORDER BY v.created_at DESC LIMIT 1) AS latest_vitals_at,
              (SELECT d.severity_level FROM diagnoses d WHERE d.patient_id = p.id ORDER BY d.created_at DESC LIMIT 1) AS latest_severity
       FROM patients p
       ORDER BY p.created_at DESC`
    )
    .all();

  return res.json({ patients: rows });
});

router.post("/patients/:id/lab-orders", authorize("doctor"), (req, res) => {
  const { testName, instructions } = req.body;
  if (!testName) {
    return res.status(400).json({ error: "testName is required" });
  }

  const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const result = db
    .prepare(
      `INSERT INTO lab_orders (patient_id, ordered_by, test_name, instructions)
       VALUES (?, ?, ?, ?)`
    )
    .run(req.params.id, req.user.id, testName, instructions || null);

  return res.status(201).json({ id: result.lastInsertRowid, message: "Lab test ordered" });
});

router.post("/lab-orders/:id/results", authorize("lab_technician"), (req, res) => {
  const { resultSummary, reportData } = req.body;
  if (!resultSummary) {
    return res.status(400).json({ error: "resultSummary is required" });
  }

  const order = db.prepare("SELECT * FROM lab_orders WHERE id = ?").get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Lab order not found" });
  }
  if (order.status === "completed") {
    return res.status(409).json({ error: "Lab order already completed" });
  }

  db.prepare(
    `INSERT INTO lab_results (lab_order_id, uploaded_by, result_summary, report_data)
     VALUES (?, ?, ?, ?)`
  ).run(req.params.id, req.user.id, resultSummary, reportData || null);

  db.prepare("UPDATE lab_orders SET status = 'completed' WHERE id = ?").run(req.params.id);

  return res.status(201).json({ message: "Lab result uploaded" });
});

router.post("/patients/:id/diagnosis", authorize("doctor"), (req, res) => {
  const { diagnosisText, severityLevel, prescription, followUpDate } = req.body;
  const allowedSeverity = ["low", "moderate", "high", "critical"];

  if (!diagnosisText || !severityLevel || !prescription) {
    return res.status(400).json({
      error: "diagnosisText, severityLevel, prescription are required"
    });
  }
  if (!allowedSeverity.includes(severityLevel)) {
    return res.status(400).json({ error: "Invalid severityLevel" });
  }

  const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  db.prepare(
    `INSERT INTO diagnoses (patient_id, doctor_id, diagnosis_text, severity_level, prescription, follow_up_date)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(req.params.id, req.user.id, diagnosisText, severityLevel, prescription, followUpDate || null);

  const message = `Severity: ${severityLevel}. Follow-up: ${followUpDate || "Not specified"}.`;
  db.prepare("INSERT INTO notifications (patient_id, message) VALUES (?, ?)").run(req.params.id, message);

  return res.status(201).json({ message: "Diagnosis and prescription saved" });
});

router.get("/patient/me", authorize("patient"), (req, res) => {
  if (!req.user.patientId) {
    return res.status(400).json({ error: "Patient account is not linked to a patient record" });
  }

  const record = getPatientRecord(req.user.patientId);
  if (!record) {
    return res.status(404).json({ error: "Patient record not found" });
  }

  const notifications = db
    .prepare("SELECT * FROM notifications WHERE patient_id = ? ORDER BY created_at DESC")
    .all(req.user.patientId);

  return res.json({
    ...record,
    notifications
  });
});

module.exports = router;
