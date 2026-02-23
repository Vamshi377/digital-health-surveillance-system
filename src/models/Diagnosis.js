const mongoose = require("mongoose");

const { Schema } = mongoose;

const diagnosisSchema = new Schema(
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
    diagnosedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    diseaseName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true
    },
    diagnosisNotes: {
      type: String,
      trim: true,
      default: ""
    },
    doctorSeverity: {
      type: String,
      enum: ["low", "moderate", "high"],
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

diagnosisSchema.index({ diseaseName: 1, createdAt: -1 });
diagnosisSchema.index({ patient: 1, createdAt: -1 });

const Diagnosis = mongoose.model("Diagnosis", diagnosisSchema);

module.exports = { Diagnosis };
