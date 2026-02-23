const env = require("../config/env");
const { createHttpError } = require("../utils/httpError");

function normalizeSeverity(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["low", "moderate", "high", "critical"].includes(normalized)) {
    return normalized === "critical" ? "high" : normalized;
  }
  return "moderate";
}

async function predictSeverity(input) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const headers = {
      "Content-Type": "application/json"
    };

    if (env.mlServiceApiKey) {
      headers["x-api-key"] = env.mlServiceApiKey;
    }

    const response = await fetch(`${env.mlServiceUrl}/predict`, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
      signal: controller.signal
    });

    if (!response.ok) {
      throw createHttpError(502, "ML service prediction failed");
    }

    const data = await response.json();
    return {
      probability: Number(data.risk_score) || 0,
      predictedSeverity: normalizeSeverity(data.severity)
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw createHttpError(502, "Unable to reach ML service");
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { predictSeverity };
