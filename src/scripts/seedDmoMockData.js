const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../models/User");
const { Patient } = require("../models/Patient");
const { Prediction } = require("../models/Prediction");

const TELANGANA_AREAS = [
  { district: "Hyderabad", area: "Ameerpet", lat: 17.4375, lng: 78.4482 },
  { district: "Hyderabad", area: "LB Nagar", lat: 17.3457, lng: 78.5522 },
  { district: "Warangal", area: "Hanamkonda", lat: 18.0011, lng: 79.5788 },
  { district: "Karimnagar", area: "Mankammathota", lat: 18.4337, lng: 79.1328 },
  { district: "Jagtial", area: "Jagtial Town", lat: 18.7951, lng: 78.9172 },
  { district: "Nizamabad", area: "Arsapally", lat: 18.6725, lng: 78.0941 },
  { district: "Khammam", area: "Wyra Road", lat: 17.2473, lng: 80.1514 },
  { district: "Nalgonda", area: "Marriguda", lat: 17.0541, lng: 79.2674 }
];

const DISEASES = ["Dengue", "Malaria", "Typhoid", "Chikungunya", "Viral Fever"];
const SEVERITIES = ["low", "moderate", "high"];

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  await connectDatabase();

  const admin =
    (await User.findOne({ role: "admin" }).lean()) ||
    (await User.findOne({ email: "admin@health.local" }).lean());

  if (!admin) {
    throw new Error("Admin user not found. Run npm run seed first.");
  }

  const patients = [];
  for (let i = 0; i < 120; i += 1) {
    const place = pick(TELANGANA_AREAS);
    patients.push({
      fullName: `DMO Demo Patient ${i + 1}`,
      age: rand(5, 78),
      gender: pick(["male", "female", "other"]),
      district: place.district,
      area: place.area,
      addressLine: `${rand(1, 45)}-${rand(1, 12)} Main Road, ${place.area}`,
      contactNumber: `9${String(100000000 + i).padStart(9, "0")}`.slice(0, 10),
      location: { lat: place.lat, lng: place.lng },
      registeredBy: admin._id
    });
  }

  const createdPatients = await Patient.insertMany(patients, { ordered: false }).catch((error) => {
    if (error?.writeErrors?.length) {
      return Patient.find({ fullName: /DMO Demo Patient/ }).lean();
    }
    throw error;
  });

  const patientList = Array.isArray(createdPatients) ? createdPatients : [];
  if (!patientList.length) {
    throw new Error("Unable to seed mock patients");
  }

  const predictions = [];
  patientList.forEach((patient) => {
    const totalPredictions = rand(1, 3);
    for (let i = 0; i < totalPredictions; i += 1) {
      const createdAt = new Date(Date.now() - rand(1, 10) * 24 * 60 * 60 * 1000 - rand(1, 23) * 60 * 60 * 1000);
      predictions.push({
        patient: patient._id,
        diagnosis: new mongoose.Types.ObjectId(),
        diseaseName: pick(DISEASES),
        probability: Number((Math.random() * 0.35 + 0.6).toFixed(2)),
        predictedSeverity: pick(SEVERITIES),
        modelSource: "demo-mock-seed",
        features: { mock: true },
        createdAt,
        updatedAt: createdAt
      });
    }
  });

  await Prediction.insertMany(predictions, { ordered: false });

  console.log(`DMO mock data seeded successfully on ${env.mongoUri}`);
  process.exit(0);
}

run().catch((error) => {
  console.error("DMO mock seed failed:", error.message);
  process.exit(1);
});
