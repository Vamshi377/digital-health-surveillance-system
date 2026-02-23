const { User, USER_ROLES } = require("../models/User");
const { Patient } = require("../models/Patient");
const { createHttpError } = require("../utils/httpError");

const STAFF_ROLES = new Set(["admin", "receptionist", "nurse", "doctor", "lab_technician", "government_officer"]);

async function createUserByAdmin(payload) {
  const { fullName, email, password, role, patientCode } = payload;

  if (!fullName || !email || !password || !role) {
    throw createHttpError(400, "fullName, email, password, role are required");
  }

  const normalizedRole = String(role).trim().toLowerCase();
  if (!USER_ROLES.includes(normalizedRole)) {
    throw createHttpError(400, "Invalid role");
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    throw createHttpError(409, "Email already registered");
  }

  let linkedPatientId = null;
  if (normalizedRole === "patient") {
    if (!patientCode) {
      throw createHttpError(400, "patientCode is required for patient role");
    }
    const patient = await Patient.findOne({ patientCode: String(patientCode).trim().toUpperCase() }).lean();
    if (!patient) {
      throw createHttpError(404, "Patient not found for patientCode");
    }
    linkedPatientId = patient._id;
  }

  const passwordHash = await User.hashPassword(String(password));
  const user = await User.create({
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    passwordHash,
    role: normalizedRole,
    patientId: linkedPatientId
  });

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    patientId: user.patientId
  };
}

async function updateUserRole(userId, payload) {
  const { role } = payload;
  if (!role) {
    throw createHttpError(400, "role is required");
  }

  const normalizedRole = String(role).trim().toLowerCase();
  if (!USER_ROLES.includes(normalizedRole)) {
    throw createHttpError(400, "Invalid role");
  }
  if (normalizedRole === "patient") {
    throw createHttpError(400, "Use dedicated patient account mapping for patient role");
  }
  if (!STAFF_ROLES.has(normalizedRole)) {
    throw createHttpError(400, "Invalid target role");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role: normalizedRole, patientId: null },
    { new: true, runValidators: true }
  ).lean();
  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return user;
}

async function updateUserStatus(userId, payload) {
  const { isActive } = payload;
  if (typeof isActive !== "boolean") {
    throw createHttpError(400, "isActive must be boolean");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive },
    { new: true, runValidators: true }
  ).lean();
  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return user;
}

async function listUsers() {
  return User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
}

module.exports = {
  createUserByAdmin,
  updateUserRole,
  updateUserStatus,
  listUsers
};
