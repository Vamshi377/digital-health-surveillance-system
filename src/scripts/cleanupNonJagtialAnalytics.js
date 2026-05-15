const { connectDatabase } = require("../config/database");
const { Patient } = require("../models/Patient");
const { Appointment } = require("../models/Appointment");
const { MedicalRecord } = require("../models/MedicalRecord");
const { LabReport } = require("../models/LabReport");
const { Diagnosis } = require("../models/Diagnosis");
const { Prescription } = require("../models/Prescription");
const { Prediction } = require("../models/Prediction");
const { Notification } = require("../models/Notification");
const { DietPlan } = require("../models/DietPlan");

async function run() {
  await connectDatabase();

  const nonJagtialPatients = await Patient.find({
    district: { $ne: "Jagtial" }
  }).select("_id district fullName").lean();

  const patientIds = nonJagtialPatients.map((patient) => patient._id);
  const nonJagtialPredictions = await Prediction.find({ patient: { $in: patientIds } }).select("_id diagnosis").lean();
  const diagnosisIds = nonJagtialPredictions.map((prediction) => prediction.diagnosis);
  const records = await MedicalRecord.find({ patient: { $in: patientIds } }).select("_id appointment").lean();
  const recordIds = records.map((record) => record._id);
  const appointmentIds = records.map((record) => record.appointment);

  const result = {};
  result.dietPlans = await DietPlan.deleteMany({
    $or: [{ patient: { $in: patientIds } }, { diagnosis: { $in: diagnosisIds } }, { medicalRecord: { $in: recordIds } }]
  });
  result.notifications = await Notification.deleteMany({
    $or: [{ patient: { $in: patientIds } }, { medicalRecord: { $in: recordIds } }]
  });
  result.predictions = await Prediction.deleteMany({ patient: { $in: patientIds } });
  result.prescriptions = await Prescription.deleteMany({
    $or: [{ patient: { $in: patientIds } }, { diagnosis: { $in: diagnosisIds } }]
  });
  result.diagnoses = await Diagnosis.deleteMany({
    $or: [{ patient: { $in: patientIds } }, { _id: { $in: diagnosisIds } }]
  });
  result.labReports = await LabReport.deleteMany({
    $or: [{ patient: { $in: patientIds } }, { medicalRecord: { $in: recordIds } }]
  });
  result.medicalRecords = await MedicalRecord.deleteMany({ _id: { $in: recordIds } });
  result.appointments = await Appointment.deleteMany({
    $or: [{ _id: { $in: appointmentIds } }, { patient: { $in: patientIds } }]
  });
  result.patients = await Patient.deleteMany({ _id: { $in: patientIds } });

  console.log(`Removed ${nonJagtialPatients.length} non-Jagtial patients and linked analytics records.`);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

run().catch((error) => {
  console.error("Non-Jagtial cleanup failed:", error.message);
  process.exit(1);
});
