const mongoose = require("mongoose");

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: String,
      required: true,
      index: true
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

auditLogSchema.index({ createdAt: -1, action: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = { AuditLog };
