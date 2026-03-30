const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../models/User");
const { Patient } = require("../models/Patient");
const { Appointment } = require("../models/Appointment");
const { MedicalRecord } = require("../models/MedicalRecord");
const { receptionCases } = require("./mockData/jagtialReceptionCases");
const { nurseRecords } = require("./mockData/jagtialNurseRecords");

function buildAadhar(patientId) {
  return `77${String(1000000000 + patientId).padStart(10, "0")}`.slice(0, 12);
}

function buildScheduledAt(dateValue) {
  return new Date(`${dateValue}T09:30:00.000Z`);
}

function buildVisitDate(dateValue) {
  return new Date(`${dateValue}T11:15:00.000Z`);
}

function parseBp(bpValue) {
  const [systolic, diastolic] = String(bpValue || "120/80")
    .split("/")
    .map((value) => Number(value));
  return {
    bpSystolic: Number.isFinite(systolic) ? systolic : 120,
    bpDiastolic: Number.isFinite(diastolic) ? diastolic : 80
  };
}

function calculateVitalsAlert(temperature, spo2) {
  if (Number(spo2) > 0 && Number(spo2) < 90) {
    return "critical";
  }
  if (Number(temperature) >= 103 || Number(spo2) < 94) {
    return "abnormal";
  }
  return "normal";
}

async function run() {
  await connectDatabase();

  const nurse =
    (await User.findOne({ email: "nurse@health.local", role: "nurse" }).lean()) ||
    (await User.findOne({ role: "hospital_admin" }).lean());

  if (!nurse) {
    throw new Error("Nurse or hospital admin user not found. Run npm run seed first.");
  }

  const receptionCaseMap = receptionCases.reduce((acc, entry) => {
    acc[entry.patientId] = entry;
    return acc;
  }, {});

  for (const entry of nurseRecords) {
    const patient = await Patient.findOne({ aadharNumber: buildAadhar(entry.patientId) }).lean();
    if (!patient) {
      throw new Error(`Patient not found for PatientID ${entry.patientId}. Run npm run seed:reception-mock first.`);
    }

    const receptionCase = receptionCaseMap[entry.patientId];
    if (!receptionCase) {
      throw new Error(`Reception case mapping missing for PatientID ${entry.patientId}`);
    }

    const appointment = await Appointment.findOne({
      patient: patient._id,
      scheduledAt: buildScheduledAt(receptionCase.appointmentDate)
    }).lean();

    if (!appointment) {
      throw new Error(`Appointment not found for PatientID ${entry.patientId}`);
    }

    const { bpSystolic, bpDiastolic } = parseBp(entry.bp);
    const visitDate = buildVisitDate(entry.visitDate);

    await MedicalRecord.findOneAndUpdate(
      { appointment: appointment._id },
      {
        $set: {
          patient: patient._id,
          appointment: appointment._id,
          appointmentAt: visitDate,
          symptoms: entry.symptoms,
          vitals: {
            temperature: entry.temperature,
            bpSystolic,
            bpDiastolic,
            pulse: Number.isFinite(entry.pulse) ? entry.pulse : 88 + (entry.patientId % 8),
            spo2: entry.spo2,
            respiratoryRate: Number.isFinite(entry.respiratoryRate) ? entry.respiratoryRate : 18 + (entry.patientId % 4)
          },
          chiefComplaint: entry.symptoms.join(", "),
          nurseNotes: `Mock nurse note for visit date ${entry.visitDate}`,
          recordedBy: nurse._id,
          status: "in_review",
          vitalsAlertLevel: calculateVitalsAlert(entry.temperature, entry.spo2),
          createdAt: visitDate,
          updatedAt: visitDate
        }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await Appointment.updateOne(
      { _id: appointment._id },
      {
        $set: {
          status: "vitals_recorded",
          updatedAt: visitDate
        }
      }
    );
  }

  console.log(`Nurse mock data seeded successfully on ${env.mongoUri}`);
  console.log(`Medical records seeded: ${nurseRecords.length}`);
  process.exit(0);
}

run().catch((error) => {
  console.error("Nurse mock seed failed:", error.message);
  process.exit(1);
});
