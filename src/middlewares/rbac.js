const { normalizeRole } = require("../utils/roles");

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const allowed = allowedRoles.map((role) => normalizeRole(role));
    if (!allowed.includes(normalizeRole(req.user.role))) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    return next();
  };
}

module.exports = { authorize };
