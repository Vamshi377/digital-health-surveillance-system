const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { User } = require("../models/User");
const { Patient } = require("../models/Patient");
const { normalizeRole } = require("../utils/roles");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    const token = authHeader.slice("Bearer ".length);
    const payload = jwt.verify(token, env.jwtSecret);

    if (payload.authType === "patient" || normalizeRole(payload.role) === "patient") {
      const patient = await Patient.findById(payload.sub).lean();
      if (!patient) {
        return res.status(401).json({ error: "Invalid token or patient not found" });
      }

      req.user = {
        id: String(patient._id),
        fullName: patient.fullName,
        email: "",
        role: "patient",
        approvalStatus: "APPROVED",
        patientId: String(patient._id),
        patientCode: patient.patientCode
      };

      return next();
    }

    const user = await User.findOne({ _id: payload.sub, isActive: true, approvalStatus: "APPROVED" }).lean();
    if (!user) {
      return res.status(401).json({ error: "Invalid token or inactive or unapproved account" });
    }

    req.user = {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: normalizeRole(user.role),
      approvalStatus: user.approvalStatus,
      hospitalId: user.hospitalId || "",
      hospitalName: user.hospitalName || "",
      patientId: user.patientId ? String(user.patientId) : null
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authenticate };
