const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../models/User");
const { Patient } = require("../models/Patient");
const { Appointment } = require("../models/Appointment");
const { MedicalRecord } = require("../models/MedicalRecord");
const { Diagnosis } = require("../models/Diagnosis");
const { Prescription } = require("../models/Prescription");
const { Prediction } = require("../models/Prediction");

const MODEL_SOURCE = "jagtial-20-map-seed";

const cases = [
  {
    fullName: "Vamshi Krishna",
    contactNumber: "9177324853",
    aadharNumber: "123456789789",
    dateOfBirth: "2004-07-16",
    age: 21,
    gender: "male",
    mandal: "Jagtial",
    village: "Mothe",
    diseaseName: "Dengue",
    predictedSeverity: "high",
    probability: 0.91
  },
  { fullName: "Ramesh Kumar", mandal: "Korutla", village: "Ailapur", diseaseName: "Dengue", predictedSeverity: "high", probability: 0.88, gender: "male", age: 32 },
  { fullName: "Lakshmi Devi", mandal: "Metpally", village: "Vempet", diseaseName: "Viral Fever", predictedSeverity: "moderate", probability: 0.72, gender: "female", age: 28 },
  { fullName: "Suresh Babu", mandal: "Raikal", village: "Kummaripalli", diseaseName: "Malaria", predictedSeverity: "high", probability: 0.86, gender: "male", age: 41 },
  { fullName: "Kavitha Rani", mandal: "Dharmapuri", village: "Donthapur", diseaseName: "Dengue", predictedSeverity: "moderate", probability: 0.69, gender: "female", age: 35 },
  { fullName: "Naveen Reddy", mandal: "Mallial", village: "Gorrekunta", diseaseName: "Malaria", predictedSeverity: "low", probability: 0.48, gender: "male", age: 24 },
  { fullName: "Priya Sharma", mandal: "Kathlapur", village: "Thakkallapalli", diseaseName: "Dengue", predictedSeverity: "high", probability: 0.9, gender: "female", age: 30 },
  { fullName: "Mahesh Goud", mandal: "Pegadapalli", village: "Aravelli", diseaseName: "Viral Fever", predictedSeverity: "moderate", probability: 0.67, gender: "male", age: 37 },
  { fullName: "Swathi Rao", mandal: "Ibrahimpatnam", village: "Erdandi", diseaseName: "Dengue", predictedSeverity: "low", probability: 0.46, gender: "female", age: 26 },
  { fullName: "Rajesh Naik", mandal: "Gollapalli", village: "Bonkur", diseaseName: "Malaria", predictedSeverity: "high", probability: 0.84, gender: "male", age: 45 },
  { fullName: "Geetha Bai", mandal: "Jagtial", village: "Polasa", diseaseName: "Dengue", predictedSeverity: "moderate", probability: 0.73, gender: "female", age: 39 },
  { fullName: "Kiran Kumar", mandal: "Korutla", village: "Venkatapur", diseaseName: "Malaria", predictedSeverity: "low", probability: 0.44, gender: "male", age: 22 },
  { fullName: "Divya Sri", mandal: "Metpally", village: "Jaggasagar", diseaseName: "Dengue", predictedSeverity: "high", probability: 0.89, gender: "female", age: 31 },
  { fullName: "Srikanth Reddy", mandal: "Raikal", village: "Ramajipet", diseaseName: "Viral Fever", predictedSeverity: "moderate", probability: 0.65, gender: "male", age: 27 },
  { fullName: "Niharika", mandal: "Dharmapuri", village: "Velgatoor", diseaseName: "Dengue", predictedSeverity: "low", probability: 0.43, gender: "female", age: 19 },
  { fullName: "Ajay Kumar", mandal: "Mallial", village: "Maddutla", diseaseName: "Malaria", predictedSeverity: "high", probability: 0.87, gender: "male", age: 34 },
  { fullName: "Pooja", mandal: "Kathlapur", village: "Chintakunta", diseaseName: "Dengue", predictedSeverity: "moderate", probability: 0.7, gender: "female", age: 25 },
  { fullName: "Harish", mandal: "Pegadapalli", village: "Bathkapalli", diseaseName: "Viral Fever", predictedSeverity: "low", probability: 0.41, gender: "male", age: 29 },
  { fullName: "Sneha", mandal: "Ibrahimpatnam", village: "Komatikunta", diseaseName: "Dengue", predictedSeverity: "high", probability: 0.92, gender: "female", age: 33 },
  { fullName: "Vikas", mandal: "Gollapalli", village: "Lothunur", diseaseName: "Malaria", predictedSeverity: "moderate", probability: 0.68, gender: "male", age: 38 }
];

function phoneFor(index) {
  return `91990000${String(index).padStart(2, "0")}`;
}

function aadharFor(index) {
  return `4567891200${String(index).padStart(2, "0")}`;
}

function patientCodeFor(index) {
  return `PAT-JGT-MAP-${String(index).padStart(3, "0")}`;
}

function visitDateFor(index) {
  const date = new Date();
  date.setDate(date.getDate() - (index % 5));
  date.setHours(10 + (index % 7), (index * 3) % 60, 0, 0);
  return date;
}

async function removePreviousSeedData() {
  const seededPredictions = await Prediction.find({ modelSource: MODEL_SOURCE }).select("patient diagnosis").lean();
  const patientIds = seededPredictions.map((item) => item.patient);
  const diagnosisIds = seededPredictions.map((item) => item.diagnosis);
  const seededDiagnoses = await Diagnosis.find({ _id: { $in: diagnosisIds } }).select("medicalRecord").lean();
  const seededRecordIds = seededDiagnoses.map((item) => item.medicalRecord);

  const seededPatients = await Patient.find({ patientCode: /^PAT-JGT-MAP-/ }).select("_id").lean();
  const seededPatientIds = seededPatients.map((patient) => patient._id);
  seededPatientIds.forEach((patientId) => patientIds.push(patientId));

  const records = await MedicalRecord.find({
    $or: [{ _id: { $in: seededRecordIds } }, { patient: { $in: seededPatientIds } }]
  }).select("_id appointment").lean();
  const recordIds = records.map((item) => item._id);
  const appointmentIds = records.map((item) => item.appointment);

  await Promise.all([
    Prediction.deleteMany({ $or: [{ modelSource: MODEL_SOURCE }, { patient: { $in: seededPatientIds } }] }),
    Prescription.deleteMany({ $or: [{ diagnosis: { $in: diagnosisIds } }, { patient: { $in: seededPatientIds } }] }),
    Diagnosis.deleteMany({ $or: [{ _id: { $in: diagnosisIds } }, { patient: { $in: seededPatientIds } }] }),
    MedicalRecord.deleteMany({ _id: { $in: recordIds } }),
    Appointment.deleteMany({ $or: [{ _id: { $in: appointmentIds } }, { patient: { $in: patientIds } }] })
  ]);
}

async function upsertPatient(entry, index, actorId) {
  const contactNumber = entry.contactNumber || phoneFor(index);
  const aadharNumber = entry.aadharNumber || aadharFor(index);
  const dateOfBirth = entry.dateOfBirth
    ? new Date(`${entry.dateOfBirth}T00:00:00.000Z`)
    : new Date(`${1990 + (index % 14)}-0${(index % 8) + 1}-15T00:00:00.000Z`);

  const payload = {
    fullName: entry.fullName,
    dateOfBirth,
    age: entry.age,
    gender: entry.gender,
    district: "Jagtial",
    mandal: entry.mandal,
    village: entry.village,
    ward: null,
    area: entry.village,
    addressLine: `${entry.village}, ${entry.mandal}, Jagtial`,
    contactNumber,
    aadharNumber,
    location: { lat: null, lng: null },
    registeredBy: actorId
  };

  const existing = await Patient.findOne({
    $or: [{ contactNumber }, { aadharNumber }, { patientCode: patientCodeFor(index) }]
  });

  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return existing;
  }

  return Patient.create({
    patientCode: patientCodeFor(index),
    ...payload
  });
}

async function createCase(entry, index, actors) {
  const patient = await upsertPatient(entry, index, actors.receptionist._id);
  const scheduledAt = visitDateFor(index);

  const appointment = await Appointment.create({
    patient: patient._id,
    scheduledAt,
    visitDate: scheduledAt,
    reason: `${entry.diseaseName} symptoms and public health surveillance review`,
    createdBy: actors.receptionist._id,
    status: "diagnosed"
  });

  const record = await MedicalRecord.create({
    patient: patient._id,
    appointment: appointment._id,
    appointmentAt: scheduledAt,
    symptoms: entry.diseaseName === "Dengue" ? ["fever", "body pain", "headache"] : ["fever", "fatigue", "chills"],
    vitals: {
      temperature: entry.predictedSeverity === "high" ? 103 : entry.predictedSeverity === "moderate" ? 101 : 99,
      bpSystolic: 120,
      bpDiastolic: 80,
      pulse: entry.predictedSeverity === "high" ? 104 : 88,
      spo2: 98,
      respiratoryRate: 18
    },
    chiefComplaint: `${entry.diseaseName} suspected case`,
    nurseNotes: "Seeded Jagtial DMO map case.",
    recordedBy: actors.nurse._id,
    status: "diagnosed",
    vitalsAlertLevel: entry.predictedSeverity === "high" ? "critical" : "normal"
  });

  const diagnosis = await Diagnosis.create({
    patient: patient._id,
    medicalRecord: record._id,
    diagnosedBy: actors.doctor._id,
    diseaseName: entry.diseaseName,
    diagnosisNotes: "Seeded diagnosis for Jagtial DMO severity map.",
    doctorSeverity: entry.predictedSeverity
  });

  await Prescription.create({
    patient: patient._id,
    diagnosis: diagnosis._id,
    prescribedBy: actors.doctor._id,
    medicines: [
      {
        medicineName: "Paracetamol",
        dosage: "500mg",
        frequency: "TDS",
        durationDays: 5,
        instructions: "After food"
      }
    ],
    generalAdvice: "Hydration and follow-up if symptoms worsen.",
    followUpDate: null
  });

  await Prediction.create({
    patient: patient._id,
    diagnosis: diagnosis._id,
    diseaseName: entry.diseaseName,
    probability: entry.probability,
    predictedSeverity: entry.predictedSeverity,
    modelSource: MODEL_SOURCE,
    features: {
      district: "Jagtial",
      mandal: entry.mandal,
      village: entry.village,
      seededFor: "DMO severity map"
    },
    createdAt: scheduledAt,
    updatedAt: scheduledAt
  });
}

async function run() {
  await connectDatabase();

  const admin = await User.findOne({ role: "hospital_admin" }).lean();
  const receptionist = (await User.findOne({ role: "receptionist" }).lean()) || admin;
  const nurse = (await User.findOne({ role: "nurse" }).lean()) || admin;
  const doctor = (await User.findOne({ role: "doctor" }).lean()) || admin;

  if (!admin || !receptionist || !nurse || !doctor) {
    throw new Error("Required users not found. Run npm run seed first.");
  }

  await removePreviousSeedData();

  for (let i = 0; i < cases.length; i += 1) {
    await createCase(cases[i], i + 1, { receptionist, nurse, doctor });
  }

  console.log(`Seeded ${cases.length} diagnosed Jagtial records on ${env.mongoUri}`);
  console.log("DMO map distribution: high=8, moderate=7, low=5");
  process.exit(0);
}

run().catch((error) => {
  console.error("Jagtial 20 map seed failed:", error.message);
  process.exit(1);
});
