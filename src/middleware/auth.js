const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");
const { getUserById } = require("../db");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization token" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = getUserById(payload.sub);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Account not active or user not found" });
    }

    req.user = {
      id: user.id,
      role: user.role,
      fullName: user.full_name,
      patientId: user.patient_id
    };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authenticate };
