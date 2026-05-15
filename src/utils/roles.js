const ROLE_ALIASES = Object.freeze({
  admin: "hospital_admin",
  government_officer: "dmo"
});

const USER_ROLES = Object.freeze([
  "doctor",
  "nurse",
  "lab_technician",
  "receptionist",
  "hospital_admin",
  "dmo",
  "patient"
]);

const APPROVAL_STATUSES = Object.freeze(["PENDING", "APPROVED", "REJECTED"]);

const APPROVER_BY_ROLE = Object.freeze({
  doctor: "hospital_admin",
  nurse: "hospital_admin",
  lab_technician: "hospital_admin",
  receptionist: "hospital_admin",
  hospital_admin: "dmo"
});

function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  return ROLE_ALIASES[normalized] || normalized;
}

function getRequiredApproverRole(role) {
  return APPROVER_BY_ROLE[normalizeRole(role)] || null;
}

module.exports = {
  USER_ROLES,
  APPROVAL_STATUSES,
  APPROVER_BY_ROLE,
  normalizeRole,
  getRequiredApproverRole
};
