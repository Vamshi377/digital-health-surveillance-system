const { AuditLog } = require("../models/AuditLog");

async function logAudit({ actorId, action, entityType, entityId, details = {} }) {
  if (!actorId || !action || !entityType || !entityId) {
    return;
  }

  try {
    await AuditLog.create({
      actor: actorId,
      action,
      entityType,
      entityId: String(entityId),
      details
    });
  } catch {
    // Ignore audit failures to avoid blocking core clinical workflow.
  }
}

async function listAuditLogs({ action, entityType, limit = 50 } = {}) {
  const query = {};
  if (action) query.action = action;
  if (entityType) query.entityType = entityType;

  const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return AuditLog.find(query)
    .populate("actor", "fullName email role")
    .sort({ createdAt: -1 })
    .limit(cappedLimit)
    .lean();
}

module.exports = { logAudit, listAuditLogs };
