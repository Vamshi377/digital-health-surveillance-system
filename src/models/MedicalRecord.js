const mongoose = require("mongoose");

const { Schema } = mongoose;

const medicalRecordSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
      index: true
    },
    appointmentAt: {
      type: Date,
      required: true,
      index: true
    },
    symptoms: {
      type: [String],
      default: []
    },
    vitals: {
      temperature: { type: Number, min: 90, max: 115, default: null },
      bpSystolic: { type: Number, min: 40, max: 260, default: null },
      bpDiastolic: { type: Number, min: 20, max: 180, default: null },
      pulse: { type: Number, min: 20, max: 250, default: null },
      spo2: { type: Number, min: 0, max: 100, default: null }
    },
    nurseNotes: {
      type: String,
      trim: true,
      default: ""
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["scheduled", "in_review", "diagnosed"],
      default: "in_review",
      index: true
    },
    vitalsAlertLevel: {
      type: String,
      enum: ["normal", "abnormal", "critical"],
      default: "normal",
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

medicalRecordSchema.index({ patient: 1, createdAt: -1 });
medicalRecordSchema.index({ appointment: 1 }, { unique: true });

const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);

module.exports = { MedicalRecord };
