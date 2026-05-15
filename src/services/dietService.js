const env = require("../config/env");
const { DietPlan } = require("../models/DietPlan");
const { createHttpError } = require("../utils/httpError");

const DIET_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    recommendedFoods: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 10
    },
    avoidFoods: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 8
    },
    mealPlan: {
      type: "object",
      properties: {
        morning: { type: "string" },
        afternoon: { type: "string" },
        evening: { type: "string" },
        night: { type: "string" }
      },
      required: ["morning", "afternoon", "evening", "night"]
    },
    hydrationAdvice: { type: "string" },
    warningSigns: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 8
    },
    disclaimer: { type: "string" }
  },
  required: [
    "summary",
    "recommendedFoods",
    "avoidFoods",
    "mealPlan",
    "hydrationAdvice",
    "warningSigns",
    "disclaimer"
  ]
};

function cleanString(value, fallback = "") {
  return String(value || fallback).trim();
}

function cleanList(value, maxItems) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item))
    .filter(Boolean)
    .slice(0, maxItems);
}

function sanitizeDietPlan(plan) {
  const forbidden = /\b(stop|discontinue|change|reduce|increase)\s+(medicine|medication|tablet|dose|dosage|drug)\b/i;
  const cleanText = (value, fallback = "") => {
    const text = cleanString(value, fallback);
    return forbidden.test(text)
      ? "Follow your doctor's medicine advice. This diet guidance does not change medicines."
      : text;
  };

  return {
    summary: cleanText(plan.summary, "AI-generated supportive diet guidance for recovery."),
    recommendedFoods: cleanList(plan.recommendedFoods, 10),
    avoidFoods: cleanList(plan.avoidFoods, 8),
    mealPlan: {
      morning: cleanText(plan.mealPlan?.morning),
      afternoon: cleanText(plan.mealPlan?.afternoon),
      evening: cleanText(plan.mealPlan?.evening),
      night: cleanText(plan.mealPlan?.night)
    },
    hydrationAdvice: cleanText(plan.hydrationAdvice),
    warningSigns: cleanList(plan.warningSigns, 8),
    disclaimer:
      cleanText(plan.disclaimer) ||
      "This AI diet guidance is supportive and does not replace advice from your doctor."
  };
}

function buildDietPrompt(context) {
  return [
    "Generate a safe supportive diet plan for the patient using the clinical context.",
    "Do not diagnose. Do not prescribe medicines. Do not change medicines or dosage.",
    "Use practical Indian food examples where suitable.",
    "Keep advice patient-friendly and concise.",
    "Always include warning signs and a doctor-advice disclaimer.",
    "",
    JSON.stringify(context, null, 2)
  ].join("\n");
}

function parseGeminiJson(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function callGeminiDietGenerator(context) {
  const apiKey = String(env.geminiApiKey || "").trim();
  if (!apiKey || /^your[_-]?gemini[_-]?api[_-]?key$/i.test(apiKey)) {
    throw createHttpError(503, "Gemini API key is not configured");
  }

  const model = env.geminiDietModel || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildDietPrompt(context) }]
        }
      ],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
        responseSchema: DIET_SCHEMA
      }
    })
  });

  if (!response.ok) {
    let message = "Gemini diet generation failed";
    try {
      const body = await response.json();
      const reason = body?.error?.details?.find((item) => item.reason)?.reason;
      if (body?.error?.status === "INVALID_ARGUMENT" && reason === "API_KEY_INVALID") {
        message = "Gemini API key is invalid";
      } else if (body?.error?.message) {
        message = body.error.message;
      }
    } catch {
      // Keep the short generic message if Google returns a non-JSON error.
    }
    throw createHttpError(response.status, message);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  return {
    parsed: sanitizeDietPlan(parseGeminiJson(text)),
    raw: data,
    model
  };
}

function buildDietContext({ patient, record, diagnosis, prescription, prediction, labReports }) {
  const firstLab = labReports?.[0] || null;
  return {
    patient: {
      age: patient.age,
      gender: patient.gender,
      district: patient.district,
      area: patient.area
    },
    diagnosis: {
      diseaseName: diagnosis.diseaseName,
      doctorSeverity: diagnosis.doctorSeverity,
      notes: diagnosis.diagnosisNotes
    },
    mlPrediction: {
      severity: prediction.predictedSeverity,
      probability: prediction.probability
    },
    symptoms: record.symptoms || [],
    vitals: record.vitals || {},
    labReport: firstLab
      ? {
          testName: firstLab.testName,
          values: firstLab.values,
          abnormalMarkers: firstLab.abnormalMarkers,
          isCritical: firstLab.isCritical
        }
      : null,
    prescription: {
      medicines: prescription.medicines || [],
      generalAdvice: prescription.generalAdvice || "",
      followUpDate: prescription.followUpDate || null
    }
  };
}

async function generateAndSaveDietPlan({ patient, record, diagnosis, prescription, prediction, labReports, actorId }) {
  const context = buildDietContext({ patient, record, diagnosis, prescription, prediction, labReports });
  const generated = await callGeminiDietGenerator(context);
  const plan = generated.parsed;

  return DietPlan.create({
    patient: patient._id,
    medicalRecord: record._id,
    diagnosis: diagnosis._id,
    prediction: prediction._id,
    diseaseName: diagnosis.diseaseName,
    severity: prediction.predictedSeverity || "unknown",
    summary: plan.summary,
    recommendedFoods: plan.recommendedFoods,
    avoidFoods: plan.avoidFoods,
    mealPlan: plan.mealPlan,
    hydrationAdvice: plan.hydrationAdvice,
    warningSigns: plan.warningSigns,
    disclaimer: plan.disclaimer,
    modelSource: generated.model,
    rawResponse: generated.raw,
    generatedBy: actorId
  });
}

module.exports = { generateAndSaveDietPlan };
