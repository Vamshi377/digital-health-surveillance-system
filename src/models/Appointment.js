const mongoose = require("mongoose");

const { Schema } = mongoose;

const appointmentSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true
    },
    reason: {
      type: String,
      trim: true,
      default: ""
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["scheduled", "vitals_recorded", "lab_uploaded", "diagnosed", "completed", "cancelled"],
      default: "scheduled",
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

appointmentSchema.index({ patient: 1, scheduledAt: -1 });
appointmentSchema.index({ status: 1, scheduledAt: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = { Appointment };
