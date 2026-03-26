const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../models/User");
const { Patient } = require("../models/Patient");
const { Prediction } = require("../models/Prediction");

const DEFAULT_AREAS = [
  { district: "Hyderabad", area: "Hyderabad", lat: 17.4375, lng: 78.4482 },
  { district: "Nizamabad", area: "Nizamabad", lat: 18.6725, lng: 78.0941 }
];

const DISEASES = ["Dengue", "Malaria", "Typhoid", "Chikungunya", "Viral Fever"];
const SEVERITIES = ["low", "moderate", "high"];

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getFirstCoordinate(geometry) {
  if (!geometry || !geometry.coordinates) return null;
  if (geometry.type === "Polygon") return geometry.coordinates?.[0]?.[0] || null;
  if (geometry.type === "MultiPolygon") return geometry.coordinates?.[0]?.[0]?.[0] || null;
  return null;
}

function loadTelanganaAreas() {
  const geoPath = path.resolve(__dirname, "..", "..", "frontend", "public", "data", "telanganaDistricts.json");
  if (!fs.existsSync(geoPath)) {
    return DEFAULT_AREAS;
  }

  const geo = JSON.parse(fs.readFileSync(geoPath, "utf-8"));
  const features = Array.isArray(geo?.features) ? geo.features : [];
  if (!features.length) {
    return DEFAULT_AREAS;
  }

  return features.map((feature) => {
    const props = feature.properties || {};
    const district =
      props.D_NAME || props.D_N || props.district || props.DISTRICT || props.dist_name || props.name || "Unknown";
    const point = getFirstCoordinate(feature.geometry) || [78.5, 17.8];
    return {
      district: String(district).trim(),
      area: String(district).trim(),
      lat: Number(point[1]),
      lng: Number(point[0])
    };
  });
}

async function run() {
  await connectDatabase();

  const admin =
    (await User.findOne({ role: "hospital_admin" }).lean()) ||
    (await User.findOne({ email: "hospitaladmin@health.local" }).lean());

  if (!admin) {
    throw new Error("Hospital admin user not found. Run npm run seed first.");
  }

  const telanganaAreas = loadTelanganaAreas();
  const patients = [];
  for (let i = 0; i < 240; i += 1) {
    const place = pick(telanganaAreas);
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
