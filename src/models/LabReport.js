const mongoose = require("mongoose");

const { Schema } = mongoose;

const labReportSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },
    medicalRecord: {
      type: Schema.Types.ObjectId,
      ref: "MedicalRecord",
      required: true,
      index: true
    },
    testName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    values: {
      type: Schema.Types.Mixed,
      default: {}
    },
    summary: {
      type: String,
      trim: true,
      default: ""
    },
    reportImageUrl: {
      type: String,
      trim: true,
      default: ""
    },
    reportOriginalName: {
      type: String,
      trim: true,
      default: ""
    },
    reportMimeType: {
      type: String,
      trim: true,
      default: ""
    },
    abnormalMarkers: {
      type: [String],
      default: []
    },
    isCritical: {
      type: Boolean,
      default: false,
      index: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

labReportSchema.index({ patient: 1, createdAt: -1 });
labReportSchema.index({ medicalRecord: 1, createdAt: -1 });

const LabReport = mongoose.model("LabReport", labReportSchema);

module.exports = { LabReport };
