const mongoose = require("mongoose");

const { Schema } = mongoose;

const predictionSchema = new Schema(
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
    diseaseName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    predictedSeverity: {
      type: String,
      required: true,
      enum: ["low", "moderate", "high"],
      index: true
    },
    modelSource: {
      type: String,
      default: "fastapi-ml-service"
    },
    features: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

predictionSchema.index({ diseaseName: 1, predictedSeverity: 1, createdAt: -1 });
predictionSchema.index({ patient: 1, createdAt: -1 });

const Prediction = mongoose.model("Prediction", predictionSchema);

module.exports = { Prediction };
