const mongoose = require("mongoose");

const { Schema } = mongoose;

const prescriptionItemSchema = new Schema(
  {
    medicineName: { type: String, required: true, trim: true, maxlength: 120 },
    dosage: { type: String, required: true, trim: true, maxlength: 80 },
    frequency: { type: String, required: true, trim: true, maxlength: 80 },
    durationDays: { type: Number, required: true, min: 1, max: 365 },
    instructions: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const prescriptionSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },
    diagnosis: {
      type: Schema.Types.ObjectId,
      ref: "Diagnosis",
      required: true,
      index: true
    },
    prescribedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    medicines: {
      type: [prescriptionItemSchema],
      default: []
    },
    generalAdvice: {
      type: String,
      trim: true,
      default: ""
    },
    followUpDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

prescriptionSchema.index({ patient: 1, createdAt: -1 });

const Prescription = mongoose.model("Prescription", prescriptionSchema);

module.exports = { Prescription };
