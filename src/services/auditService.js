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

module.exports = { logAudit };
