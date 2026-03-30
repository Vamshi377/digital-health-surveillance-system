const { Patient } = require("../models/Patient");
const { Appointment } = require("../models/Appointment");
const { MedicalRecord } = require("../models/MedicalRecord");
const { LabReport } = require("../models/LabReport");
const { Diagnosis } = require("../models/Diagnosis");
const { Prescription } = require("../models/Prescription");
const { Prediction } = require("../models/Prediction");
const { Notification } = require("../models/Notification");
const { User } = require("../models/User");
const { predictSeverity } = require("./mlService");
const { createHttpError } = require("../utils/httpError");
const { logAudit } = require("./auditService");

const LAB_REFERENCE_RANGES = {
  CBC: {
    platelet_count: { min: 150000, max: 450000, criticalBelow: 100000 },
    wbc_count: { min: 4000, max: 11000 },
    hemoglobin: { min: 12, max: 17.5 }
  }
};

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

function calculateAgeFromDob(dateOfBirth) {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}

function calculateVitalsAlert(vitals) {
  const spo2 = Number(vitals?.spo2 ?? 0);
  const temperature = Number(vitals?.temperature ?? 0);

  if (spo2 > 0 && spo2 < 90) {
    return "critical";
  }
  if (temperature >= 103 || spo2 < 94) {
    return "abnormal";
  }
  return "normal";
}

function getAbnormalLabMarkers(testName, values) {
  const ranges = LAB_REFERENCE_RANGES[String(testName || "").toUpperCase()];
  if (!ranges || !values || typeof values !== "object") {
    return { markers: [], isCritical: false };
  }

  const markers = [];
  let isCritical = false;

  Object.entries(ranges).forEach(([key, range]) => {
    const raw = values[key];
    const numeric = Number(raw);
    if (Number.isNaN(numeric)) {
      return;
    }

    if (numeric < range.min || numeric > range.max) {
      markers.push(`${key}:${numeric} (normal ${range.min}-${range.max})`);
    }

    if (typeof range.criticalBelow === "number" && numeric < range.criticalBelow) {
      isCritical = true;
    }
  });

  return { markers, isCritical };
}

function severityRank(value) {
  switch (String(value || "").toLowerCase()) {
    case "high":
      return 3;
    case "moderate":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

function buildRiskInsight(predictions) {
  const history = Array.isArray(predictions) ? predictions : [];
  if (!history.length) {
    return {
      latest: null,
      previous: null,
      trend: "no_history",
      recommendation: "No earlier ML prediction is available for comparison."
    };
  }

  const latest = history[0];
  const previous = history[1] || null;

  if (!previous) {
    return {
      latest,
      previous: null,
      trend: "baseline_only",
      recommendation:
        "Use this as the patient's baseline ML risk and compare it with symptoms, vitals, and the next visit."
    };
  }

  const latestProbability = Number(latest.probability || 0);
  const previousProbability = Number(previous.probability || 0);
  const probabilityDelta = Number((latestProbability - previousProbability).toFixed(2));
  const severityDelta = severityRank(latest.predictedSeverity) - severityRank(previous.predictedSeverity);

  let trend = "stable";
  if (severityDelta > 0 || probabilityDelta >= 0.1) {
    trend = "rising";
  } else if (severityDelta < 0 || probabilityDelta <= -0.1) {
    trend = "falling";
  }

  let recommendation = "Risk trend is stable. Continue with clinical correlation and planned follow-up.";
  if (trend === "rising") {
    recommendation =
      "Risk is higher than the previous visit. Doctor should reassess progression, labs, and whether escalation or admission is needed.";
  } else if (trend === "falling") {
    recommendation =
      "Risk is lower than the previous visit. This can support recovery tracking, but treatment should still follow current clinical findings.";
  }

  return {
    latest,
    previous,
    trend,
    probabilityDelta,
    severityDelta,
    recommendation
  };
}

async function searchPatient(phone, aadharNumber) {
  const normalizedPhone = phone ? String(phone).trim() : "";
  const normalizedAadhar = aadharNumber ? String(aadharNumber).trim() : "";

  if (!normalizedPhone && !normalizedAadhar) {
    throw createHttpError(400, "phone or aadharNumber is required");
  }

  const patient = await Patient.findOne({
    $or: [
      ...(normalizedPhone ? [{ contactNumber: normalizedPhone }] : []),
      ...(normalizedAadhar ? [{ aadharNumber: normalizedAadhar }] : [])
    ]
  }).lean();
  return patient;
}

async function registerPatient(payload, actorId) {
  const {
    fullName,
    age,
    dateOfBirth,
    gender,
    district,
    city,
    mandal,
    village,
    ward,
    area,
    addressLine,
    contactNumber,
    aadharNumber,
    location
  } = payload;

  const resolvedCity = city || district;
  const resolvedMandal = String(mandal || area || "").trim();
  const resolvedVillage = String(village || "").trim();
  const resolvedWard = String(ward || "").trim();
  const resolvedLocality = resolvedVillage || resolvedWard || String(area || "").trim();

  if (!fullName || !gender || !resolvedCity || !resolvedMandal || !resolvedLocality || !contactNumber || !aadharNumber) {
    throw createHttpError(
      400,
      "fullName, gender, city/district, mandal, village or ward, contactNumber, aadharNumber are required"
    );
  }

  let derivedAge = Number(age);
  let parsedDob = null;
  if (dateOfBirth) {
    parsedDob = new Date(dateOfBirth);
    if (Number.isNaN(parsedDob.getTime())) {
      throw createHttpError(400, "Invalid dateOfBirth");
    }
    if (parsedDob > new Date()) {
      throw createHttpError(400, "Date of birth cannot be in the future");
    }
    derivedAge = calculateAgeFromDob(parsedDob);
  }

  if (Number.isNaN(derivedAge) || derivedAge < 0 || derivedAge > 130) {
    throw createHttpError(400, "Valid age or dateOfBirth is required");
  }

  const normalizedPhone = String(contactNumber || "").trim();
  if (!/^\d{10}$/.test(normalizedPhone)) {
    throw createHttpError(400, "Contact number must be exactly 10 digits");
  }
  const existingByPhone = await Patient.findOne({ contactNumber: normalizedPhone }).lean();
  if (existingByPhone) {
    throw createHttpError(
      409,
      `Phone already exists with patientCode ${existingByPhone.patientCode}`
    );
  }

  const normalizedAadhar = String(aadharNumber || "").trim();
  if (!/^\d{12}$/.test(normalizedAadhar)) {
    throw createHttpError(400, "Aadhar number must be exactly 12 digits");
  }
  const existingByAadhar = await Patient.findOne({ aadharNumber: normalizedAadhar }).lean();
  if (existingByAadhar) {
    throw createHttpError(
      409,
      `Aadhar already exists with patientCode ${existingByAadhar.patientCode}`
    );
  }

  const patient = await Patient.create({
    fullName: String(fullName).trim(),
    dateOfBirth: parsedDob,
    age: derivedAge,
    gender: String(gender).toLowerCase().trim(),
    district: String(resolvedCity).trim(),
    mandal: resolvedMandal,
    village: resolvedVillage || null,
    ward: resolvedWard || null,
    area: resolvedLocality,
    addressLine: String(addressLine || `${resolvedLocality}, ${resolvedMandal}, ${String(resolvedCity).trim()}`).trim(),
    contactNumber: normalizedPhone,
    aadharNumber: normalizedAadhar,
    location: {
      lat: location?.lat ?? null,
      lng: location?.lng ?? null
    },
    registeredBy: actorId
  });

  await logAudit({
    actorId,
    action: "CREATE_PATIENT",
    entityType: "Patient",
    entityId: patient._id,
    details: { patientCode: patient.patientCode }
  });

  return patient;
}

async function createAppointment(patientIdentifier, payload, actorId) {
  const { scheduledAt, visitDate, reason } = payload;
  if (!scheduledAt) {
    throw createHttpError(400, "scheduledAt is required");
  }

  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    throw createHttpError(400, "Invalid scheduledAt datetime");
  }

  const parsedVisitDate = visitDate ? new Date(visitDate) : date;
  if (Number.isNaN(parsedVisitDate.getTime())) {
    throw createHttpError(400, "Invalid visitDate datetime");
  }

  const patient = await findPatientByIdentifier(patientIdentifier);
  const appointment = await Appointment.create({
    patient: patient._id,
    scheduledAt: date,
    visitDate: parsedVisitDate,
    reason: reason ? String(reason).trim() : "",
    createdBy: actorId
  });

  await logAudit({
    actorId,
    action: "CREATE_APPOINTMENT",
    entityType: "Appointment",
    entityId: appointment._id,
    details: { patient: appointment.patient, scheduledAt: appointment.scheduledAt }
  });

  return appointment;
}

async function getNurseQueue() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return Appointment.find({
    status: "scheduled",
    $or: [
      { visitDate: { $gte: startOfDay, $lte: endOfDay } },
      {
        visitDate: null,
        scheduledAt: { $gte: startOfDay, $lte: endOfDay }
      }
    ]
  })
    .populate("patient", "patientCode fullName age gender district mandal village ward area contactNumber")
    .sort({ visitDate: 1, scheduledAt: 1 })
    .lean();
}

async function createMedicalRecord(appointmentId, payload, actorId) {
  const { symptoms, vitals, nurseNotes, chiefComplaint } = payload;

  const appointment = await Appointment.findById(appointmentId).lean();
  if (!appointment) {
    throw createHttpError(404, "Appointment not found");
  }

  if (appointment.status !== "scheduled") {
    throw createHttpError(409, "Vitals already recorded for this appointment");
  }

  const existingRecord = await MedicalRecord.findOne({ appointment: appointmentId }).lean();
  if (existingRecord) {
    throw createHttpError(409, "Medical record already exists for this appointment");
  }

  if (Number(vitals?.spo2 ?? 0) > 100) {
    throw createHttpError(400, "SpO2 cannot be greater than 100");
  }

  const vitalsAlertLevel = calculateVitalsAlert(vitals);

  const record = await MedicalRecord.create({
    patient: appointment.patient,
    appointment: appointment._id,
    appointmentAt: appointment.scheduledAt,
    symptoms: normalizeSymptoms(symptoms),
    vitals: {
      temperature: vitals?.temperature ?? null,
      bpSystolic: vitals?.bpSystolic ?? null,
      bpDiastolic: vitals?.bpDiastolic ?? null,
      pulse: vitals?.pulse ?? null,
      spo2: vitals?.spo2 ?? null,
      respiratoryRate: vitals?.respiratoryRate ?? null
    },
    chiefComplaint: chiefComplaint ? String(chiefComplaint).trim() : "",
    nurseNotes: nurseNotes ? String(nurseNotes).trim() : "",
    recordedBy: actorId,
    status: "in_review",
    vitalsAlertLevel
  });

  await Appointment.updateOne({ _id: appointmentId }, { $set: { status: "vitals_recorded" } });

  await logAudit({
    actorId,
    action: "CREATE_MEDICAL_RECORD",
    entityType: "MedicalRecord",
    entityId: record._id,
    details: { appointmentId, vitalsAlertLevel }
  });

  return record;
}

async function getLabQueue() {
  return MedicalRecord.find({ status: "in_review" })
    .populate("patient", "patientCode fullName district mandal village ward area")
    .sort({ createdAt: -1 })
    .lean();
}

async function uploadLabReport(recordId, payload, actorId, fileInfo) {
  const { testName, values, summary } = payload;
  if (!testName) {
    throw createHttpError(400, "testName is required");
  }

  const record = await MedicalRecord.findById(recordId).lean();
  if (!record) {
    throw createHttpError(404, "Medical record not found");
  }

  const labSignals = getAbnormalLabMarkers(testName, values);

  const report = await LabReport.create({
    patient: record.patient,
    medicalRecord: recordId,
    testName: String(testName).trim(),
    values: values && typeof values === "object" ? values : {},
    summary: summary ? String(summary).trim() : "",
    reportImageUrl: fileInfo?.url || "",
    reportOriginalName: fileInfo?.originalName || "",
    reportMimeType: fileInfo?.mimeType || "",
    abnormalMarkers: labSignals.markers,
    isCritical: labSignals.isCritical,
    uploadedBy: actorId
  });

  await Appointment.updateOne({ _id: record.appointment }, { $set: { status: "lab_uploaded" } });

  await logAudit({
    actorId,
    action: "UPLOAD_LAB_REPORT",
    entityType: "LabReport",
    entityId: report._id,
    details: { testName: report.testName, isCritical: report.isCritical }
  });

  return report;
}

async function createDiagnosisWithPrediction(recordId, payload, actorId) {
  const { diseaseName, diagnosisNotes, doctorSeverity, prescription } = payload;

  if (!prescription || !Array.isArray(prescription.medicines) || prescription.medicines.length === 0) {
    throw createHttpError(400, "prescription.medicines are required");
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
  const previousDiagnosis = await Diagnosis.findOne({ patient: patient._id }).sort({ createdAt: -1 }).lean();
  const resolvedDiseaseName = String(diseaseName || previousDiagnosis?.diseaseName || "").trim();

  if (!resolvedDiseaseName) {
    throw createHttpError(400, "diseaseName is required for first-time diagnosis");
  }

  const diagnosis = await Diagnosis.create({
    patient: patient._id,
    medicalRecord: recordId,
    diagnosedBy: actorId,
    diseaseName: resolvedDiseaseName,
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

  if (createdPrescription.followUpDate) {
    const followUpDateText = createdPrescription.followUpDate.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    await Notification.create({
      patient: patient._id,
      medicalRecord: recordId,
      category: "follow_up",
      title: "Follow-up visit scheduled",
      message: `Hospital team requested a follow-up visit for ${diagnosis.diseaseName} on ${followUpDateText}.`,
      followUpDate: createdPrescription.followUpDate,
      createdBy: actorId
    });
  }

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
  await Appointment.updateOne({ _id: record.appointment }, { $set: { status: "diagnosed" } });

  await logAudit({
    actorId,
    action: "CREATE_DIAGNOSIS",
    entityType: "Diagnosis",
    entityId: diagnosis._id,
    details: { diseaseName: diagnosis.diseaseName, predictedSeverity: prediction.predictedSeverity }
  });

  return {
    diagnosis,
    prescription: createdPrescription,
    prediction
  };
}

async function getDoctorDashboard() {
  const records = await MedicalRecord.find({ status: { $in: ["in_review", "diagnosed"] } })
    .populate("patient", "patientCode fullName age gender district mandal village ward area")
    .sort({ createdAt: -1 })
    .lean();

  return records;
}

async function getPatientHistory(patientId, actorId) {
  const [patient, medicalRecords, labReports, diagnoses, prescriptions, predictions, notifications] = await Promise.all([
    Patient.findById(patientId).lean(),
    MedicalRecord.find({ patient: patientId }).sort({ createdAt: -1 }).lean(),
    LabReport.find({ patient: patientId }).sort({ createdAt: -1 }).lean(),
    Diagnosis.find({ patient: patientId }).sort({ createdAt: -1 }).lean(),
    Prescription.find({ patient: patientId }).sort({ createdAt: -1 }).lean(),
    Prediction.find({ patient: patientId }).sort({ createdAt: -1 }).lean(),
    Notification.find({ patient: patientId }).sort({ createdAt: -1 }).lean()
  ]);

  if (!patient) {
    throw createHttpError(404, "Patient not found");
  }

  if (actorId) {
    await logAudit({
      actorId,
      action: "VIEW_PATIENT_HISTORY",
      entityType: "Patient",
      entityId: patientId,
      details: { patientCode: patient.patientCode }
    });
  }

  const existingFollowUpDates = new Set(
    notifications
      .filter((item) => item.category === "follow_up" && item.followUpDate)
      .map((item) => new Date(item.followUpDate).toISOString())
  );

  const derivedFollowUpNotifications = prescriptions
    .filter((item) => item.followUpDate)
    .filter((item) => !existingFollowUpDates.has(new Date(item.followUpDate).toISOString()))
    .map((item) => ({
      _id: `prescription-followup-${item._id}`,
      patient: patientId,
      medicalRecord: null,
      category: "follow_up",
      title: "Follow-up visit scheduled",
      message: "Hospital team has scheduled a follow-up visit based on your prescription.",
      followUpDate: item.followUpDate,
      createdAt: item.createdAt
    }));

  return {
    patient,
    medicalRecords,
    labReports,
    diagnoses,
    prescriptions,
    predictions,
    notifications: [...notifications, ...derivedFollowUpNotifications].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
  };
}

async function getRecordSummary(recordId, actorId) {
  const record = await MedicalRecord.findById(recordId)
    .populate("patient", "patientCode fullName age gender district mandal village ward area contactNumber")
    .lean();
  if (!record) {
    throw createHttpError(404, "Medical record not found");
  }

  const [labReports, diagnoses, prescriptions, predictions, medicalRecords, notifications] = await Promise.all([
    LabReport.find({ medicalRecord: recordId }).sort({ createdAt: -1 }).lean(),
    Diagnosis.find({ patient: record.patient._id }).sort({ createdAt: -1 }).lean(),
    Prescription.find({ patient: record.patient._id }).sort({ createdAt: -1 }).lean(),
    Prediction.find({ patient: record.patient._id }).sort({ createdAt: -1 }).lean(),
    MedicalRecord.find({ patient: record.patient._id }).sort({ createdAt: -1 }).lean(),
    Notification.find({ patient: record.patient._id }).sort({ createdAt: -1 }).lean()
  ]);

  await logAudit({
    actorId,
    action: "VIEW_RECORD_SUMMARY",
    entityType: "MedicalRecord",
    entityId: recordId,
    details: { patientCode: record.patient.patientCode }
  });

  return {
    record,
    latestLabReport: labReports[0] || null,
    labReports,
    diagnosisHistory: diagnoses,
    prescriptions,
    predictionHistory: predictions,
    visitHistory: medicalRecords.filter((item) => String(item._id) !== String(recordId)),
    notifications,
    riskInsight: buildRiskInsight(predictions)
  };
}

async function getPatientHistoryByCode(patientCode, actorId) {
  const patient = await Patient.findOne({ patientCode: String(patientCode).trim().toUpperCase() }).lean();
  if (!patient) {
    throw createHttpError(404, "Patient not found");
  }
  return getPatientHistory(patient._id, actorId);
}

async function getMyPatientHistory(userId, actorId) {
  const user = await User.findById(userId).lean();
  if (!user || !user.patientId) {
    throw createHttpError(404, "Patient profile not linked to this account");
  }

  return getPatientHistory(user.patientId, actorId);
}

module.exports = {
  searchPatient,
  registerPatient,
  createAppointment,
  getNurseQueue,
  createMedicalRecord,
  getLabQueue,
  uploadLabReport,
  createDiagnosisWithPrediction,
  getDoctorDashboard,
  getPatientHistory,
  getPatientHistoryByCode,
  getMyPatientHistory,
  getRecordSummary
};
