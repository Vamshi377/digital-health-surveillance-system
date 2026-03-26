const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { User } = require("../models/User");
const { normalizeRole } = require("../utils/roles");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    const token = authHeader.slice("Bearer ".length);
    const payload = jwt.verify(token, env.jwtSecret);

    const user = await User.findOne({ _id: payload.sub, isActive: true, approvalStatus: "APPROVED" }).lean();
    if (!user) {
      return res.status(401).json({ error: "Invalid token or inactive or unapproved account" });
    }

    req.user = {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: normalizeRole(user.role),
      approvalStatus: user.approvalStatus
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authenticate };
