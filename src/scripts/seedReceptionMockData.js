const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../models/User");
const { Patient } = require("../models/Patient");
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

  console.log(`Reception mock data seeded successfully on ${env.mongoUri}`);
  console.log(`Patients seeded: ${receptionCases.length}`);
  process.exit(0);
}

run().catch((error) => {
  console.error("Reception mock seed failed:", error.message);
  process.exit(1);
});
