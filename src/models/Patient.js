const mongoose = require("mongoose");
const crypto = require("crypto");

const { Schema } = mongoose;

const patientSchema = new Schema(
  {
    patientCode: {
      type: String,
      unique: true,
      required: true,
      immutable: true,
      index: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 130
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"]
    },
    district: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    area: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    contactNumber: {
      type: String,
      trim: true,
      maxlength: 20,
      default: null,
      index: true
    },
    location: {
      lat: { type: Number, min: -90, max: 90, default: null },
      lng: { type: Number, min: -180, max: 180, default: null }
    },
    registeredBy: {
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

patientSchema.index({ district: 1, area: 1, createdAt: -1 });
patientSchema.index(
  { contactNumber: 1 },
  { unique: true, sparse: true, partialFilterExpression: { contactNumber: { $type: "string" } } }
);

patientSchema.pre("validate", function setPatientCode(next) {
  if (!this.patientCode) {
    this.patientCode = `PAT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }
  next();
});

const Patient = mongoose.model("Patient", patientSchema);

module.exports = { Patient };
