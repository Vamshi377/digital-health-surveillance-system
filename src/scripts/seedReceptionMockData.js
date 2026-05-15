const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../models/User");
const { Patient } = require("../models/Patient");
const { PatientHospitalIdentity } = require("../models/PatientHospitalIdentity");
const { Appointment } = require("../models/Appointment");
const { receptionCases } = require("./mockData/jagtialReceptionCases");

function buildPhone(patientId) {
  return `8${String(100000000 + patientId).padStart(9, "0")}`.slice(0, 10);
}

function buildAadhar(patientId) {
  return `77${String(1000000000 + patientId).padStart(10, "0")}`.slice(0, 12);
}

function buildDob(patientId) {
  const baseYear = 1980 + (patientId % 18);
  const month = String((patientId % 12) + 1).padStart(2, "0");
  const day = String((patientId % 27) + 1).padStart(2, "0");
  return new Date(`${baseYear}-${month}-${day}T00:00:00.000Z`);
}

function buildPatientCode(patientId) {
  return `PAT-JGT-${String(patientId).padStart(3, "0")}`;
}

function buildScheduledAt(dateValue) {
  return new Date(`${dateValue}T09:30:00.000Z`);
}

function buildVisitDate(dateValue) {
  return new Date(`${dateValue}T11:15:00.000Z`);
}

function buildHospitalPatientId(hospitalId, patientId) {
  const prefix = String(hospitalId || "HOSP").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "HOSP";
  return `${prefix}-PAT-${String(patientId).padStart(4, "0")}`;
}

async function ensureHospitalIdentity(patient, receptionist, seedKey) {
  const hospitalId = String(receptionist?.hospitalId || "HOSP").trim() || "HOSP";
  const hospitalName = String(receptionist?.hospitalName || "").trim();

  const existing = await PatientHospitalIdentity.findOne({ patient: patient._id, hospitalId });
  if (existing) {
    return existing;
  }

  return PatientHospitalIdentity.create({
    patient: patient._id,
    hospitalId,
    hospitalName,
    hospitalPatientId: buildHospitalPatientId(hospitalId, seedKey),
    createdBy: receptionist._id
  });
}

async function run() {
  await connectDatabase();

  const receptionist =
    (await User.findOne({ email: "reception@health.local", role: "receptionist" }).lean()) ||
    (await User.findOne({ role: "hospital_admin" }).lean());

  if (!receptionist) {
    throw new Error("Receptionist or hospital admin user not found. Run npm run seed first.");
  }

  for (const entry of receptionCases) {
    const patientPayload = {
      patientCode: buildPatientCode(entry.patientId),
      fullName: entry.fullName,
      dateOfBirth: buildDob(entry.patientId),
      age: 20 + (entry.patientId % 35),
      gender: entry.patientId % 2 === 0 ? "female" : "male",
      district: entry.district,
      mandal: entry.mandal,
      village: entry.village,
      ward: null,
      area: entry.village,
      addressLine: `${entry.village}, ${entry.mandal}, ${entry.district}`,
      contactNumber: buildPhone(entry.patientId),
      aadharNumber: buildAadhar(entry.patientId),
      registeredBy: receptionist._id
    };

    let patient = await Patient.findOne({ aadharNumber: buildAadhar(entry.patientId) });
    if (patient && !patient.patientCode) {
      await Appointment.deleteMany({ patient: patient._id });
      await Patient.deleteOne({ _id: patient._id });
      patient = null;
    }

    if (patient) {
      Object.assign(patient, patientPayload);
      await patient.save();
    } else {
      patient = await Patient.create(patientPayload);
    }

    await ensureHospitalIdentity(patient, receptionist, entry.patientId);

    await Appointment.findOneAndUpdate(
      { patient: patient._id, scheduledAt: buildScheduledAt(entry.appointmentDate) },
      {
        $set: {
          patient: patient._id,
          scheduledAt: buildScheduledAt(entry.appointmentDate),
          visitDate: buildVisitDate(entry.visitDate),
          reason: `Mock reception registration | Visit date ${entry.visitDate}`,
          createdBy: receptionist._id,
          status: "scheduled"
        }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(10, 0, 0, 0);

  const todayFollowUp = new Date();
  todayFollowUp.setHours(14, 30, 0, 0);

  let followUpPatient = await Patient.findOne({ aadharNumber: "991234567890" });
  if (followUpPatient) {
    followUpPatient.fullName = "Ramesh Followup";
    followUpPatient.dateOfBirth = new Date("1990-05-14T00:00:00.000Z");
    followUpPatient.age = 35;
    followUpPatient.gender = "male";
    followUpPatient.district = "Jagtial";
    followUpPatient.mandal = "Jagtial";
    followUpPatient.village = "Mothe";
    followUpPatient.ward = null;
    followUpPatient.area = "Mothe";
    followUpPatient.addressLine = "Mothe, Jagtial, Jagtial";
    followUpPatient.contactNumber = "9012345678";
    followUpPatient.aadharNumber = "991234567890";
    followUpPatient.registeredBy = receptionist._id;
    await followUpPatient.save();
    await Patient.updateOne({ _id: followUpPatient._id }, { $set: { createdAt: twoDaysAgo, updatedAt: todayFollowUp } });
  } else {
    followUpPatient = await Patient.create({
      patientCode: "PAT-JGT-FUP001",
      fullName: "Ramesh Followup",
      dateOfBirth: new Date("1990-05-14T00:00:00.000Z"),
      age: 35,
      gender: "male",
      district: "Jagtial",
      mandal: "Jagtial",
      village: "Mothe",
      ward: null,
      area: "Mothe",
      addressLine: "Mothe, Jagtial, Jagtial",
      contactNumber: "9012345678",
      aadharNumber: "991234567890",
      registeredBy: receptionist._id,
      createdAt: twoDaysAgo,
      updatedAt: todayFollowUp
    });
  }

  await ensureHospitalIdentity(followUpPatient, receptionist, 9001);

  await Appointment.findOneAndUpdate(
    { patient: followUpPatient._id, scheduledAt: todayFollowUp },
    {
      $set: {
        patient: followUpPatient._id,
        scheduledAt: todayFollowUp,
        visitDate: todayFollowUp,
        reason: "Follow-up visit scheduled after registration two days ago",
        createdBy: receptionist._id,
        status: "scheduled",
        updatedAt: todayFollowUp
      },
      $setOnInsert: {
        createdAt: todayFollowUp
      }
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  console.log(`Reception mock data seeded successfully on ${env.mongoUri}`);
  console.log(`Patients seeded: ${receptionCases.length + 1}`);
  process.exit(0);
}

run().catch((error) => {
  console.error("Reception mock seed failed:", error.message);
  process.exit(1);
});
