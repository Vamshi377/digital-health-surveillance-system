const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../models/User");
const { Patient } = require("../models/Patient");

async function upsertUser({ fullName, email, password, role, patientId = null }) {
  const existing = await User.findOne({ email }).lean();
  const passwordHash = await User.hashPassword(password);

  if (existing) {
    await User.updateOne(
      { _id: existing._id },
      {
        $set: {
          fullName,
          passwordHash,
          role,
          isActive: true,
          patientId
        }
      }
    );
    return;
  }

  await User.create({
    fullName,
    email,
    passwordHash,
    role,
    isActive: true,
    patientId
  });
}

async function seed() {
  await connectDatabase();

  await upsertUser({
    fullName: "System Admin",
    email: "admin@health.local",
    password: "Admin@123",
    role: "admin"
  });
  const admin = await User.findOne({ email: "admin@health.local" }).lean();
  if (!admin) {
    throw new Error("Admin seed failed");
  }

  const demoPatient = await Patient.findOneAndUpdate(
    { patientCode: "PAT-DEMO001" },
    {
      $set: {
        fullName: "Demo Patient",
        age: 30,
        gender: "male",
        district: "District-1",
        area: "Area-A",
        addressLine: "Demo Address Line",
        contactNumber: "9000000000",
        registeredBy: admin._id
      }
    },
    { upsert: true, new: true, runValidators: true }
  );
  await upsertUser({
    fullName: "Front Desk Reception",
    email: "reception@health.local",
    password: "Reception@123",
    role: "receptionist"
  });
  await upsertUser({
    fullName: "Nurse One",
    email: "nurse@health.local",
    password: "Nurse@123",
    role: "nurse"
  });
  await upsertUser({
    fullName: "Doctor One",
    email: "doctor@health.local",
    password: "Doctor@123",
    role: "doctor"
  });
  await upsertUser({
    fullName: "Lab Technician One",
    email: "lab@health.local",
    password: "Lab@123",
    role: "lab_technician"
  });
  await upsertUser({
    fullName: "District Medical Officer",
    email: "dmo@health.local",
    password: "Dmo@123",
    role: "government_officer"
  });
  await upsertUser({
    fullName: "Demo Patient User",
    email: "patient@health.local",
    password: "Patient@123",
    role: "patient",
    patientId: demoPatient._id
  });

  console.log(`Seed completed for DB: ${env.mongoUri}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
