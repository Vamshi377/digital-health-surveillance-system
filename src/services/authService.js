const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");
const { User } = require("../models/User");
const { Patient } = require("../models/Patient");
const { createHttpError } = require("../utils/httpError");
const { USER_ROLES, normalizeRole, getRequiredApproverRole } = require("../utils/roles");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhoneNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) {
    return digits.slice(-10);
  }
  return digits;
}

function validateRegisterInput(payload) {
  const { fullName, email, password, phoneNumber, hospitalId, hospitalName, role } = payload;

  if (!fullName || !email || !password || !phoneNumber || !hospitalId || !hospitalName || !role) {
    throw createHttpError(
      400,
      "fullName, email, phoneNumber, password, hospitalId, hospitalName, and role are required"
    );
  }

  if (!emailPattern.test(String(email).toLowerCase())) {
    throw createHttpError(400, "Invalid email format");
  }

  if (String(password).length < 8) {
    throw createHttpError(400, "Password must be at least 8 characters");
  }

  if (!USER_ROLES.includes(normalizeRole(role)) || normalizeRole(role) === "patient") {
    throw createHttpError(400, "Invalid registration role");
  }
}

function toOptionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function buildRoleProfile(role, payload) {
  const normalizedRole = normalizeRole(role);
  const profile = {
    registrationNumber: "",
    qualification: "",
    specialization: "",
    yearsOfExperience: null,
    nursingRegistrationNumber: "",
    certificationId: "",
    labType: "",
    highestQualification: "",
    basicExperience: null,
    employeeId: "",
    officialEmail: "",
    departmentAuthority: ""
  };

  if (normalizedRole === "doctor") {
    if (!payload.registrationNumber || !payload.qualification || !payload.specialization || payload.yearsOfExperience === undefined) {
      throw createHttpError(400, "Doctor registration requires registrationNumber, qualification, specialization, yearsOfExperience");
    }
    profile.registrationNumber = String(payload.registrationNumber).trim();
    profile.qualification = String(payload.qualification).trim();
    profile.specialization = String(payload.specialization).trim();
    profile.yearsOfExperience = toOptionalNumber(payload.yearsOfExperience);
  }

  if (normalizedRole === "nurse") {
    if (!payload.nursingRegistrationNumber || !payload.qualification || payload.experience === undefined) {
      throw createHttpError(400, "Nurse registration requires nursingRegistrationNumber, qualification, experience");
    }
    profile.nursingRegistrationNumber = String(payload.nursingRegistrationNumber).trim();
    profile.qualification = String(payload.qualification).trim();
    profile.yearsOfExperience = toOptionalNumber(payload.experience);
  }

  if (normalizedRole === "lab_technician") {
    if (!payload.certificationId || !payload.labType || payload.experience === undefined) {
      throw createHttpError(400, "Lab technician registration requires certificationId, labType, experience");
    }
    profile.certificationId = String(payload.certificationId).trim();
    profile.labType = String(payload.labType).trim();
    profile.yearsOfExperience = toOptionalNumber(payload.experience);
  }

  if (normalizedRole === "receptionist") {
    if (!payload.highestQualification) {
      throw createHttpError(400, "Receptionist registration requires highestQualification");
    }
    profile.highestQualification = String(payload.highestQualification).trim();
    profile.basicExperience = toOptionalNumber(payload.basicExperience);
  }

  if (["hospital_admin", "dmo"].includes(normalizedRole)) {
    if (!payload.employeeId || !payload.officialEmail || !payload.departmentAuthority) {
      throw createHttpError(400, "This role requires employeeId, officialEmail, departmentAuthority");
    }
    if (!emailPattern.test(String(payload.officialEmail).toLowerCase())) {
      throw createHttpError(400, "Invalid officialEmail format");
    }
    profile.employeeId = String(payload.employeeId).trim();
    profile.officialEmail = String(payload.officialEmail).toLowerCase().trim();
    profile.departmentAuthority = String(payload.departmentAuthority).trim();
  }

  return profile;

}

function signAuthToken(user) {
  return jwt.sign(
    { role: user.role, authType: user.authType || "user" },
    env.jwtSecret,
    {
      subject: String(user._id),
      expiresIn: env.jwtExpiresIn
    }
  );
}

async function registerUser(payload) {
  validateRegisterInput(payload);

  const fullName = String(payload.fullName).trim();
  const email = String(payload.email).toLowerCase().trim();
  const password = String(payload.password);
  const phoneNumber = String(payload.phoneNumber).trim();
  const hospitalId = String(payload.hospitalId).trim();
  const hospitalName = String(payload.hospitalName).trim();
  const role = normalizeRole(payload.role);
  const patientCode = payload.patientCode ? String(payload.patientCode).trim().toUpperCase() : null;

  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    throw createHttpError(409, "Email already registered");
  }

  const existingPhone = await User.findOne({ phoneNumber }).lean();
  if (existingPhone) {
    throw createHttpError(409, "Phone number already registered");
  }

  let patientId = null;
  if (patientCode) {
    const patient = await Patient.findOne({ patientCode }).lean();
    if (!patient) {
      throw createHttpError(404, "Invalid patientCode");
    }
    patientId = patient._id;
  }

  const passwordHash = await User.hashPassword(password);
  const approvalStatus = role === "dmo" ? "APPROVED" : "PENDING";
  const roleProfile = buildRoleProfile(role, payload);
  const user = await User.create({
    fullName,
    email,
    passwordHash,
    phoneNumber,
    hospitalId,
    hospitalName,
    role,
    patientId,
    roleProfile,
    approvalStatus
  });

  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      requiredApproverRole: getRequiredApproverRole(user.role)
    },
    message:
      approvalStatus === "APPROVED"
        ? "Registration completed"
        : "Registration submitted. Your account is under verification."
  };
}

async function loginUser(payload) {
  const { role } = payload;
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) {
    throw createHttpError(400, "role is required");
  }

  if (normalizedRole === "patient") {
    const phoneNumber = normalizePhoneNumber(payload.phoneNumber);

    if (!phoneNumber) {
      throw createHttpError(400, "phoneNumber and role are required for patient login");
    }

    const patient = await Patient.findOne({ contactNumber: phoneNumber }).lean();
    if (!patient) {
      throw createHttpError(401, "Invalid patient credentials");
    }

    const token = signAuthToken({ _id: patient._id, role: "patient", authType: "patient" });

    return {
      token,
      user: {
        id: patient._id,
        fullName: patient.fullName,
        email: "",
        role: "patient",
        approvalStatus: "APPROVED",
        patientCode: patient.patientCode,
        patientId: patient._id
      }
    };
  }

  const { email, password } = payload;
  if (!email || !password) {
    throw createHttpError(400, "email, password, and role are required");
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail, isActive: true }).select("+passwordHash");

  if (!user) {
    throw createHttpError(401, "Invalid credentials");
  }

  if (normalizeRole(user.role) !== normalizedRole) {
    throw createHttpError(401, "Invalid credentials");
  }

  const validPassword = await user.comparePassword(String(password));
  if (!validPassword) {
    throw createHttpError(401, "Invalid credentials");
  }

  if (user.approvalStatus !== "APPROVED") {
    throw createHttpError(403, "Your account is under verification");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signAuthToken(user);

  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus
    }
  };
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

async function requestPasswordReset(payload) {
  const email = String(payload.email || "").toLowerCase().trim();
  const role = normalizeRole(payload.role);

  if (!email || !role) {
    throw createHttpError(400, "email and role are required");
  }

  const user = await User.findOne({ email, role, isActive: true });
  if (!user) {
    return {
      message: "If an active account exists, a reset token has been generated."
    };
  }

  const resetToken = crypto.randomBytes(24).toString("hex");
  user.passwordResetTokenHash = hashResetToken(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  return {
    message: "Password reset token generated. It expires in 15 minutes.",
    resetToken
  };
}

async function resetPassword(payload) {
  const token = String(payload.token || "").trim();
  const password = String(payload.password || "");

  if (!token || !password) {
    throw createHttpError(400, "token and password are required");
  }

  if (password.length < 8) {
    throw createHttpError(400, "Password must be at least 8 characters");
  }

  const user = await User.findOne({
    passwordResetTokenHash: hashResetToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
    isActive: true
  }).select("+passwordHash +passwordResetTokenHash");

  if (!user) {
    throw createHttpError(400, "Invalid or expired reset token");
  }

  user.passwordHash = await User.hashPassword(password);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  return { message: "Password reset successfully. You can now sign in." };
}

module.exports = { registerUser, loginUser, requestPasswordReset, resetPassword };
