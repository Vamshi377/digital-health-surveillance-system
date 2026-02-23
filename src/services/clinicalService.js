const { Patient } = require("../models/Patient");
const { MedicalRecord } = require("../models/MedicalRecord");
const { LabReport } = require("../models/LabReport");
const { Diagnosis } = require("../models/Diagnosis");
const { Prescription } = require("../models/Prescription");
const { Prediction } = require("../models/Prediction");
const { User } = require("../models/User");
const { predictSeverity } = require("./mlService");
const { createHttpError } = require("../utils/httpError");

function isObjectId(value) {
  return /^[0-9a-fA-F]{24}$/.test(String(value || ""));
}

async function findPatientByIdentifier(identifier) {
  const normalized = String(identifier || "").trim();
  if (!normalized) {
    throw createHttpError(400, "Patient identifier is required");
  }

  if (isObjectId(normalized)) {
    const patientById = await Patient.findById(normalized).lean();
    if (patientById) {
      return patientById;
    }
  }

  const patientByCode = await Patient.findOne({ patientCode: normalized.toUpperCase() }).lean();
  if (patientByCode) {
    return patientByCode;
  }

  throw createHttpError(404, "Patient not found");
}

function normalizeSymptoms(symptoms) {
  if (!Array.isArray(symptoms)) {
    return [];
  }

  return symptoms
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

async function registerPatient(payload, actorId) {
  const { fullName, age, gender, district, area, addressLine, contactNumber } = payload;

  if (!fullName || age == null || !gender || !district || !area || !addressLine) {
    throw createHttpError(400, "fullName, age, gender, district, area, addressLine are required");
  }

  const patient = await Patient.create({
    fullName: String(fullName).trim(),
    age: Number(age),
    gender: String(gender).toLowerCase().trim(),
    district: String(district).trim(),
    area: String(area).trim(),
    addressLine: String(addressLine).trim(),
    contactNumber: contactNumber ? String(contactNumber).trim() : null,
    registeredBy: actorId
  });

  return patient;
}

async function createMedicalRecord(patientIdentifier, payload, actorId) {
  const { appointmentAt, symptoms, vitals, nurseNotes } = payload;
  if (!appointmentAt) {
    throw createHttpError(400, "appointmentAt is required");
  }

  const appointmentDate = new Date(appointmentAt);
  if (Number.isNaN(appointmentDate.getTime())) {
    throw createHttpError(400, "Invalid appointmentAt datetime");
  }

  const patient = await findPatientByIdentifier(patientIdentifier);

  const record = await MedicalRecord.create({
    patient: patient._id,
    appointmentAt: appointmentDate,
    symptoms: normalizeSymptoms(symptoms),
    vitals: {
      temperature: vitals?.temperature ?? null,
      bpSystolic: vitals?.bpSystolic ?? null,
      bpDiastolic: vitals?.bpDiastolic ?? null,
      pulse: vitals?.pulse ?? null,
      spo2: vitals?.spo2 ?? null
    },
    nurseNotes: nurseNotes ? String(nurseNotes).trim() : "",
    recordedBy: actorId,
    status: "in_review"
  });

  return record;
}

async function uploadLabReport(recordId, payload, actorId) {
  const { testName, values, summary } = payload;
  if (!testName) {
    throw createHttpError(400, "testName is required");
  }

  const record = await MedicalRecord.findById(recordId).lean();
  if (!record) {
    throw createHttpError(404, "Medical record not found");
  }

  const report = await LabReport.create({
    patient: record.patient,
    medicalRecord: recordId,
    testName: String(testName).trim(),
    values: values && typeof values === "object" ? values : {},
    summary: summary ? String(summary).trim() : "",
    uploadedBy: actorId
  });

  return report;
}

async function createDiagnosisWithPrediction(recordId, payload, actorId) {
  const { diseaseName, diagnosisNotes, doctorSeverity, prescription } = payload;

  if (!diseaseName || !prescription || !Array.isArray(prescription.medicines) || prescription.medicines.length === 0) {
    throw createHttpError(400, "diseaseName and prescription.medicines are required");
  }

  const record = await MedicalRecord.findById(recordId).lean();
  if (!record) {
    throw createHttpError(404, "Medical record not found");
  }

  const patient = await Patient.findById(record.patient).lean();
  if (!patient) {
    throw createHttpError(404, "Patient not found");
  }

  const latestLabReports = await LabReport.find({ medicalRecord: recordId }).sort({ createdAt: -1 }).lean();
  const diagnosis = await Diagnosis.create({
    patient: patient._id,
    medicalRecord: recordId,
    diagnosedBy: actorId,
    diseaseName: String(diseaseName).trim(),
    diagnosisNotes: diagnosisNotes ? String(diagnosisNotes).trim() : "",
    doctorSeverity: doctorSeverity ? String(doctorSeverity).toLowerCase().trim() : null
  });

  const createdPrescription = await Prescription.create({
    patient: patient._id,
    diagnosis: diagnosis._id,
    prescribedBy: actorId,
    medicines: prescription.medicines,
    generalAdvice: prescription.generalAdvice ? String(prescription.generalAdvice).trim() : "",
    followUpDate: prescription.followUpDate ? new Date(prescription.followUpDate) : null
  });

  const firstLab = latestLabReports[0] || null;
  const bp = `${record.vitals?.bpSystolic || 120}/${record.vitals?.bpDiastolic || 80}`;
  const mlPayload = {
    age: patient.age,
    temperature: Number(record.vitals?.temperature ?? 98.6),
    bp,
    lab_results: JSON.stringify(firstLab?.values || {}),
    symptoms: (record.symptoms || []).join(", "),
    disease_name: diagnosis.diseaseName
  };

  const mlPrediction = await predictSeverity(mlPayload);

  const prediction = await Prediction.create({
    patient: patient._id,
    diagnosis: diagnosis._id,
    diseaseName: diagnosis.diseaseName,
    probability: mlPrediction.probability,
    predictedSeverity: mlPrediction.predictedSeverity,
    modelSource: "fastapi-ml-service",
    features: mlPayload
  });

  await MedicalRecord.updateOne({ _id: recordId }, { $set: { status: "diagnosed" } });

  return {
    diagnosis,
    prescription: createdPrescription,
    prediction
  };
}

async function getDoctorDashboard() {
  const records = await MedicalRecord.find({ status: { $in: ["in_review", "diagnosed"] } })
    .populate("patient", "patientCode fullName age gender district area")
    .sort({ createdAt: -1 })
    .lean();

  return records;
}

async function getPatientHistory(patientId) {
  const [patient, medicalRecords, labReports, diagnoses, prescriptions, predictions] = await Promise.all([
    Patient.findById(patientId).lean(),
    MedicalRecord.find({ patient: patientId }).sort({ createdAt: -1 }).lean(),
    LabReport.find({ patient: patientId }).sort({ createdAt: -1 }).lean(),
    Diagnosis.find({ patient: patientId }).sort({ createdAt: -1 }).lean(),
    Prescription.find({ patient: patientId }).sort({ createdAt: -1 }).lean(),
    Prediction.find({ patient: patientId }).sort({ createdAt: -1 }).lean()
  ]);

  if (!patient) {
    throw createHttpError(404, "Patient not found");
  }

  return {
    patient,
    medicalRecords,
    labReports,
    diagnoses,
    prescriptions,
    predictions
  };
}

async function getPatientHistoryByCode(patientCode) {
  const patient = await Patient.findOne({ patientCode: String(patientCode).trim().toUpperCase() }).lean();
  if (!patient) {
    throw createHttpError(404, "Patient not found");
  }
  return getPatientHistory(patient._id);
}

async function getMyPatientHistory(userId) {
  const user = await User.findById(userId).lean();
  if (!user || !user.patientId) {
    throw createHttpError(404, "Patient profile not linked to this account");
  }

  return getPatientHistory(user.patientId);
}

module.exports = {
  registerPatient,
  createMedicalRecord,
  uploadLabReport,
  createDiagnosisWithPrediction,
  getDoctorDashboard,
  getPatientHistory,
  getPatientHistoryByCode,
  getMyPatientHistory
};
