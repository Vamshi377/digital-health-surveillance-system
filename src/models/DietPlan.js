const mongoose = require("mongoose");

const { Schema } = mongoose;

const dietPlanSchema = new Schema(
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
    diagnosis: {
      type: Schema.Types.ObjectId,
      ref: "Diagnosis",
      required: true,
      index: true
    },
    prediction: {
      type: Schema.Types.ObjectId,
      ref: "Prediction",
      default: null
    },
    diseaseName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    severity: {
      type: String,
      enum: ["low", "moderate", "high", "unknown"],
      default: "unknown",
      index: true
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800
    },
    recommendedFoods: {
      type: [String],
      default: []
    },
    avoidFoods: {
      type: [String],
      default: []
    },
    mealPlan: {
      morning: { type: String, trim: true, default: "" },
      afternoon: { type: String, trim: true, default: "" },
      evening: { type: String, trim: true, default: "" },
      night: { type: String, trim: true, default: "" }
    },
    hydrationAdvice: {
      type: String,
      trim: true,
      default: ""
    },
    warningSigns: {
      type: [String],
      default: []
    },
    disclaimer: {
      type: String,
      trim: true,
      default: "This AI diet guidance is supportive and does not replace advice from your doctor."
    },
    modelSource: {
      type: String,
      default: "gemini-2.5-flash"
    },
    rawResponse: {
      type: Schema.Types.Mixed,
      default: {}
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

dietPlanSchema.index({ patient: 1, createdAt: -1 });
dietPlanSchema.index({ medicalRecord: 1, createdAt: -1 });

const DietPlan = mongoose.model("DietPlan", dietPlanSchema);

module.exports = { DietPlan };
