const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../models/User");
const { Patient } = require("../models/Patient");
const { Prediction } = require("../models/Prediction");
const { receptionCases } = require("./mockData/jagtialReceptionCases");

const JAGTIAL_PRIORITY_PLAN = [
  { mandal: "Jagtial", count: 18, high: 6 },
  { mandal: "Korutla", count: 12, high: 5 },
  { mandal: "Metpally", count: 10, high: 5 },
  { mandal: "Raikal", count: 8, high: 3 },
  { mandal: "Dharmapuri", count: 8, high: 3 },
  { mandal: "Gollapalli", count: 6, high: 2 }
];

function buildPhone(index) {
  return `7${String(100000000 + index).padStart(9, "0")}`.slice(0, 10);
}

function buildAadhar(index) {
  return `88${String(1000000000 + index).padStart(10, "0")}`.slice(0, 12);
}

function buildPatientCode(index) {
  return `PAT-JGT-DMO-${String(index).padStart(3, "0")}`;
}

function buildCreatedAt(sequence, offsetHours) {
  const now = new Date();
  const dayOffset = sequence % 4;
  const createdAt = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
  createdAt.setHours(9 + (offsetHours % 8), (sequence * 7) % 60, 0, 0);
  return createdAt;
}

function getMandalEntries(mandal) {
  return receptionCases.filter((entry) => entry.mandal === mandal);
}

function getSeverity(index, highCount) {
  if (index < highCount) return "high";
  if (index < highCount + 2) return "moderate";
  return "low";
}

function getDisease(mandal, index) {
  if (mandal === "Jagtial" || mandal === "Korutla") {
    return index % 4 === 0 ? "Malaria" : "Dengue";
  }
  if (mandal === "Metpally") {
    return index % 3 === 0 ? "Viral Fever" : "Dengue";
  }
  return index % 2 === 0 ? "Dengue" : "Malaria";
}

async function run() {
  await connectDatabase();

  const seededBy =
    (await User.findOne({ email: "reception@health.local", role: "receptionist" }).lean()) ||
    (await User.findOne({ email: "doctor@health.local", role: "doctor" }).lean()) ||
    (await User.findOne({ role: "hospital_admin" }).lean());

  if (!seededBy) {
    throw new Error("Receptionist, doctor, or hospital admin user not found. Run npm run seed first.");
  }

  await Prediction.deleteMany({ modelSource: "jagtial-dmo-mock" });

  const patients = [];
  let sequence = 1;

  for (const plan of JAGTIAL_PRIORITY_PLAN) {
    const entries = getMandalEntries(plan.mandal);
    if (!entries.length) {
      throw new Error(`No mock entries found for mandal ${plan.mandal}`);
    }

    for (let i = 0; i < plan.count; i += 1) {
      const source = entries[i % entries.length];
      const phoneNumber = buildPhone(sequence);
      const aadharNumber = buildAadhar(sequence);
      const patientCode = buildPatientCode(sequence);

      let patient = await Patient.findOne({ contactNumber: phoneNumber });
      const payload = {
        patientCode,
        fullName: `${source.fullName} Jagtial Mock ${sequence}`,
        dateOfBirth: new Date(`199${sequence % 10}-0${(sequence % 8) + 1}-1${sequence % 9}T00:00:00.000Z`),
        age: 18 + (sequence % 45),
        gender: sequence % 2 === 0 ? "female" : "male",
        district: "Jagtial",
        mandal: source.mandal,
        village: source.village,
        ward: null,
        area: source.village,
        addressLine: `${source.village}, ${source.mandal}, Jagtial`,
        contactNumber: phoneNumber,
        aadharNumber,
        registeredBy: seededBy._id
      };

      if (patient) {
        Object.assign(patient, payload);
        await patient.save();
      } else {
        patient = await Patient.create(payload);
      }

      const severity = getSeverity(i, plan.high);
      const diseaseName = getDisease(plan.mandal, i);
      const createdAt = buildCreatedAt(sequence, i);

      await Prediction.create({
        patient: patient._id,
        diagnosis: new mongoose.Types.ObjectId(),
        diseaseName,
        probability: severity === "high" ? 0.91 : severity === "moderate" ? 0.74 : 0.58,
        predictedSeverity: severity,
        modelSource: "jagtial-dmo-mock",
        features: {
          district: "Jagtial",
          mandal: source.mandal,
          village: source.village,
          mock: true
        },
        createdAt,
        updatedAt: createdAt
      });

      patients.push(patient);
      sequence += 1;
    }
  }

  console.log(`Jagtial DMO mock data seeded successfully on ${env.mongoUri}`);
  console.log(`Patients ensured: ${patients.length}`);
  console.log(`Predictions ensured: ${patients.length}`);
  process.exit(0);
}

run().catch((error) => {
  console.error("Jagtial DMO mock seed failed:", error.message);
  process.exit(1);
});
