const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../models/User");
const { Patient } = require("../models/Patient");
const { Appointment } = require("../models/Appointment");
const { MedicalRecord } = require("../models/MedicalRecord");
const { Diagnosis } = require("../models/Diagnosis");
const { Prescription } = require("../models/Prescription");
const { Prediction } = require("../models/Prediction");
const { LabReport } = require("../models/LabReport");
const { receptionCases } = require("./mockData/jagtialReceptionCases");
const { nurseRecords } = require("./mockData/jagtialNurseRecords");
const { doctorDiagnoses } = require("./mockData/jagtialDoctorDiagnoses");

function buildPatientCode(patientId) {
  return `PAT-JGT-${String(patientId).padStart(3, "0")}`;
}

function buildScheduledAt(dateValue) {
  return new Date(`${dateValue}T09:30:00.000Z`);
}

function buildDiagnosisTime(dateValue) {
  return new Date(`${dateValue}T15:30:00.000Z`);
}

function determineDiagnosis(entry, mappedDisease) {
  const severity =
    entry.spo2 <= 92 || entry.temperature >= 104 ? "high" : entry.spo2 <= 94 || entry.temperature >= 103 ? "moderate" : "low";

  if (mappedDisease === "Malaria") {
    return {
      diseaseName: "Malaria",
      severity,
      notes: "Doctor diagnosis seeded from provided malaria case list.",
      medicines: [
        { medicineName: "Artemether-Lumefantrine", dosage: "20/120 mg", frequency: "Twice daily", durationDays: 3, instructions: "Take after food" },
        { medicineName: "Paracetamol", dosage: "650 mg", frequency: "SOS for fever", durationDays: 3, instructions: "Use only if fever persists" }
      ]
    };
  }

  if (mappedDisease === "Viral Fever") {
    return {
      diseaseName: "Viral Fever",
      severity: severity === "high" ? "moderate" : severity,
      notes: "Doctor diagnosis seeded from provided viral fever case list.",
      medicines: [
        { medicineName: "Paracetamol", dosage: "650 mg", frequency: "Three times daily", durationDays: 3, instructions: "Take after food" },
        { medicineName: "Cetirizine", dosage: "10 mg", frequency: "Once daily", durationDays: 3, instructions: "Supportive care" }
      ]
    };
  }

  return {
    diseaseName: "Dengue",
    severity,
    notes: "Doctor diagnosis seeded from provided dengue case list.",
    medicines: [
      { medicineName: "Paracetamol", dosage: "650 mg", frequency: "Three times daily", durationDays: 5, instructions: "Avoid NSAIDs" },
      { medicineName: "ORS", dosage: "200 ml", frequency: "Frequent sips", durationDays: 5, instructions: "Maintain hydration" }
    ]
  };
}

async function run() {
  await connectDatabase();

  const doctor =
    (await User.findOne({ email: "doctor@health.local", role: "doctor" }).lean()) ||
    (await User.findOne({ role: "hospital_admin" }).lean());

  if (!doctor) {
    throw new Error("Doctor or hospital admin user not found. Run npm run seed first.");
  }

  const receptionCaseMap = receptionCases.reduce((acc, entry) => {
    acc[entry.patientId] = entry;
    return acc;
  }, {});
  const diagnosisMap = doctorDiagnoses.reduce((acc, entry) => {
    acc[entry.patientCode] = entry;
    return acc;
  }, {});

  const patientCodes = nurseRecords.map((entry) => buildPatientCode(entry.patientId));
  const patients = await Patient.find({ patientCode: { $in: patientCodes } }).lean();
  const patientIdMap = patients.reduce((acc, patient) => {
    acc[patient.patientCode] = patient;
    return acc;
  }, {});

  const patientObjectIds = patients.map((patient) => patient._id);
  const medicalRecords = await MedicalRecord.find({ patient: { $in: patientObjectIds } }).lean();
  const medicalRecordIds = medicalRecords.map((record) => record._id);
  const diagnosisIds = (await Diagnosis.find({ medicalRecord: { $in: medicalRecordIds } }).select("_id").lean()).map((row) => row._id);

  await Prediction.deleteMany({ patient: { $in: patientObjectIds } });
  await Prescription.deleteMany({ diagnosis: { $in: diagnosisIds } });
  await Diagnosis.deleteMany({ medicalRecord: { $in: medicalRecordIds } });
  await LabReport.deleteMany({ medicalRecord: { $in: medicalRecordIds } });

  for (const entry of nurseRecords) {
    const patient = patientIdMap[buildPatientCode(entry.patientId)];
    if (!patient) {
      throw new Error(`Patient not found for PatientID ${entry.patientId}. Run reception and nurse seeds first.`);
    }

    const receptionCase = receptionCaseMap[entry.patientId];
    const appointment = await Appointment.findOne({
      patient: patient._id,
      scheduledAt: buildScheduledAt(receptionCase.appointmentDate)
    });

    if (!appointment) {
      throw new Error(`Appointment missing for PatientID ${entry.patientId}`);
    }

    const record = await MedicalRecord.findOne({ appointment: appointment._id });
    if (!record) {
      throw new Error(`Medical record missing for PatientID ${entry.patientId}. Run nurse seed first.`);
    }

    const patientCode = buildPatientCode(entry.patientId);
    const providedDiagnosis = diagnosisMap[patientCode];
    if (!providedDiagnosis) {
      throw new Error(`Diagnosis mapping missing for ${patientCode}`);
    }

    const diagnosisPlan = determineDiagnosis(entry, providedDiagnosis.disease);
    const diagnosisDate = providedDiagnosis.diagnosisDate || receptionCase.visitDate;
    const diagnosedAt = buildDiagnosisTime(diagnosisDate);

    const diagnosis = await Diagnosis.create({
      patient: patient._id,
      medicalRecord: record._id,
      diagnosedBy: doctor._id,
      diseaseName: diagnosisPlan.diseaseName,
      diagnosisNotes: diagnosisPlan.notes,
      doctorSeverity: diagnosisPlan.severity,
      createdAt: diagnosedAt,
      updatedAt: diagnosedAt
    });

    await Prescription.create({
      patient: patient._id,
      diagnosis: diagnosis._id,
      prescribedBy: doctor._id,
      medicines: diagnosisPlan.medicines,
      generalAdvice: "Drink fluids, rest well, and return if symptoms worsen.",
      followUpDate: new Date(diagnosedAt.getTime() + 3 * 24 * 60 * 60 * 1000),
      createdAt: diagnosedAt,
      updatedAt: diagnosedAt
    });

    const probability = diagnosisPlan.severity === "high" ? 0.92 : diagnosisPlan.severity === "moderate" ? 0.76 : 0.58;
    await Prediction.create({
      patient: patient._id,
      diagnosis: diagnosis._id,
      diseaseName: diagnosisPlan.diseaseName,
      probability,
      predictedSeverity: diagnosisPlan.severity,
      modelSource: "mock-doctor-seed",
      features: {
        symptoms: entry.symptoms,
        temperature: entry.temperature,
        bp: entry.bp,
        spo2: entry.spo2
      },
      createdAt: diagnosedAt,
      updatedAt: diagnosedAt
    });

    record.status = "diagnosed";
    record.updatedAt = diagnosedAt;
    await record.save();

    appointment.status = "diagnosed";
    appointment.updatedAt = diagnosedAt;
    await appointment.save();
  }

  console.log(`Doctor mock data seeded successfully on ${env.mongoUri}`);
  console.log(`Diagnosed records created: ${nurseRecords.length}`);
  process.exit(0);
}

run().catch((error) => {
  console.error("Doctor mock seed failed:", error.message);
  process.exit(1);
});
