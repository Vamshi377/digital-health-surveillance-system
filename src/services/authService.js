const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { User } = require("../models/User");
const { Patient } = require("../models/Patient");
const { createHttpError } = require("../utils/httpError");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterInput(payload) {
  const { fullName, email, password } = payload;

  if (!fullName || !email || !password) {
    throw createHttpError(400, "fullName, email, and password are required");
  }

  if (!emailPattern.test(String(email).toLowerCase())) {
    throw createHttpError(400, "Invalid email format");
  }

  if (String(password).length < 8) {
    throw createHttpError(400, "Password must be at least 8 characters");
  }

}

function signAuthToken(user) {
  return jwt.sign(
    { role: user.role },
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
  const patientCode = payload.patientCode ? String(payload.patientCode).trim().toUpperCase() : null;

  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    throw createHttpError(409, "Email already registered");
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
  const user = await User.create({
    fullName,
    email,
    passwordHash,
    role: "patient",
    patientId
  });

  const token = signAuthToken(user);

  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  };
}

async function loginUser(payload) {
  const { email, password } = payload;

  if (!email || !password) {
    throw createHttpError(400, "email and password are required");
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail, isActive: true }).select("+passwordHash");

  if (!user) {
    throw createHttpError(401, "Invalid credentials");
  }

  const validPassword = await user.comparePassword(String(password));
  if (!validPassword) {
    throw createHttpError(401, "Invalid credentials");
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
      role: user.role
    }
  };
}

module.exports = { registerUser, loginUser };
