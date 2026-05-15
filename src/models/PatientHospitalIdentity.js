const mongoose = require("mongoose");

const { Schema } = mongoose;

const patientHospitalIdentitySchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },
    hospitalId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    hospitalName: {
      type: String,
      trim: true,
      default: ""
    },
    hospitalPatientId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

patientHospitalIdentitySchema.index({ patient: 1, hospitalId: 1 }, { unique: true });
patientHospitalIdentitySchema.index({ hospitalId: 1, hospitalPatientId: 1 }, { unique: true });

const PatientHospitalIdentity = mongoose.model("PatientHospitalIdentity", patientHospitalIdentitySchema);

module.exports = { PatientHospitalIdentity };
