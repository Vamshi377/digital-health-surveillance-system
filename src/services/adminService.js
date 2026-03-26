const { User } = require("../models/User");
const { Patient } = require("../models/Patient");
const { createHttpError } = require("../utils/httpError");
const { USER_ROLES, APPROVAL_STATUSES, normalizeRole, getRequiredApproverRole } = require("../utils/roles");

const STAFF_ROLES = new Set(["hospital_admin", "receptionist", "nurse", "doctor", "lab_technician", "medical_superintendent", "dmo"]);

async function createUserByAdmin(payload) {
  const { fullName, email, password, role, patientCode } = payload;

  if (!fullName || !email || !password || !role) {
    throw createHttpError(400, "fullName, email, password, role are required");
  }

  const normalizedRole = normalizeRole(role);
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
    approvalStatus: "APPROVED",
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

  const normalizedRole = normalizeRole(role);
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

async function listUsers(filters = {}) {
  const query = {};
  if (filters.role) {
    query.role = normalizeRole(filters.role);
  }
  if (filters.approvalStatus) {
    const normalizedStatus = String(filters.approvalStatus).toUpperCase().trim();
    if (!APPROVAL_STATUSES.includes(normalizedStatus)) {
      throw createHttpError(400, "Invalid approvalStatus");
    }
    query.approvalStatus = normalizedStatus;
  }

  return User.find(query, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
}

async function reviewUserApproval(userId, payload, actor) {
  const target = await User.findById(userId);
  if (!target) {
    throw createHttpError(404, "User not found");
  }

  const nextStatus = String(payload.status || "").toUpperCase().trim();
  if (!["APPROVED", "REJECTED"].includes(nextStatus)) {
    throw createHttpError(400, "status must be APPROVED or REJECTED");
  }

  const actorRole = normalizeRole(actor?.role);
  const requiredApproverRole = getRequiredApproverRole(target.role);
  if (!requiredApproverRole) {
    throw createHttpError(400, "This role does not require approval workflow");
  }
  if (actorRole !== requiredApproverRole) {
    throw createHttpError(403, `Only ${requiredApproverRole} can review this registration`);
  }

  target.approvalStatus = nextStatus;
  target.approvalRemarks = payload.remarks ? String(payload.remarks).trim() : "";
  target.approvalReviewedAt = new Date();
  target.approvalReviewedBy = actor.id;
  await target.save();

  return {
    id: target._id,
    fullName: target.fullName,
    email: target.email,
    role: target.role,
    approvalStatus: target.approvalStatus,
    approvalRemarks: target.approvalRemarks,
    approvalReviewedAt: target.approvalReviewedAt,
    approvalReviewedBy: target.approvalReviewedBy
  };
}

module.exports = {
  createUserByAdmin,
  updateUserRole,
  updateUserStatus,
  listUsers,
  reviewUserApproval
};
