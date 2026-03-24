const { Prediction } = require("../models/Prediction");
const { logAudit } = require("./auditService");
const { createHttpError } = require("../utils/httpError");

function buildPredictionDateMatch(fromDate, toDate) {
  if (!fromDate && !toDate) {
    return {};
  }

  const match = { createdAt: {} };
  if (fromDate) {
    match.createdAt.$gte = new Date(fromDate);
  }
  if (toDate) {
    match.createdAt.$lte = new Date(toDate);
  }
  return match;
}

function buildWindow(fromDate, toDate) {
  const now = new Date();
  const currentTo = toDate ? new Date(toDate) : now;
  const currentFrom = fromDate ? new Date(fromDate) : new Date(currentTo.getTime() - 7 * 24 * 60 * 60 * 1000);
  const duration = Math.max(1, currentTo.getTime() - currentFrom.getTime());
  const previousTo = new Date(currentFrom.getTime());
  const previousFrom = new Date(currentFrom.getTime() - duration);

  return { currentFrom, currentTo, previousFrom, previousTo };
}

function mapDiseaseTotals(rows) {
  return rows.reduce((acc, item) => {
    acc[item._id] = Number(item.totalAffected || 0);
    return acc;
  }, {});
}

function calculateDelta(current, previous) {
  if (previous <= 0 && current > 0) {
    return 100;
  }
  if (previous <= 0 && current <= 0) {
    return 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

async function getDmoDiseaseBurden({ district, area, fromDate, toDate }) {
  const match = buildPredictionDateMatch(fromDate, toDate);

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "patients",
        localField: "patient",
        foreignField: "_id",
        as: "patient"
      }
    },
    { $unwind: "$patient" },
    ...(district ? [{ $match: { "patient.district": district } }] : []),
    ...(area ? [{ $match: { "patient.area": area } }] : []),
    {
      $group: {
        _id: {
          district: "$patient.district",
          area: "$patient.area",
          disease: "$diseaseName"
        },
        totalAffected: { $sum: 1 },
        lat: { $avg: "$patient.location.lat" },
        lng: { $avg: "$patient.location.lng" },
        low: {
          $sum: { $cond: [{ $eq: ["$predictedSeverity", "low"] }, 1, 0] }
        },
        moderate: {
          $sum: { $cond: [{ $eq: ["$predictedSeverity", "moderate"] }, 1, 0] }
        },
        high: {
          $sum: { $cond: [{ $eq: ["$predictedSeverity", "high"] }, 1, 0] }
        }
      }
    },
    { $sort: { "_id.district": 1, "_id.area": 1, "_id.disease": 1 } }
  ];

  const rows = await Prediction.aggregate(pipeline);

  const areaSummary = rows.map((item) => ({
    district: item._id.district,
    area: item._id.area,
    disease: item._id.disease,
    totalAffected: item.totalAffected,
    lat: typeof item.lat === "number" ? Number(item.lat.toFixed(6)) : null,
    lng: typeof item.lng === "number" ? Number(item.lng.toFixed(6)) : null,
    severity: {
      low: item.low,
      moderate: item.moderate,
      high: item.high
    }
  }));

  return {
    generatedAt: new Date().toISOString(),
    totalBuckets: areaSummary.length,
    areaSummary
  };
}

async function getDmoOverview({ district, area, fromDate, toDate }) {
  const match = buildPredictionDateMatch(fromDate, toDate);
  const { currentFrom, currentTo, previousFrom, previousTo } = buildWindow(fromDate, toDate);

  const geoFilterStages = [
    ...(district ? [{ $match: { "patient.district": district } }] : []),
    ...(area ? [{ $match: { "patient.area": area } }] : [])
  ];

  const [diseaseTotals, severityTotals, dailyTrend, areaDensity, outbreakWarnings, currentWindowDiseaseTotals, previousWindowDiseaseTotals] = await Promise.all([
    Prediction.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient"
        }
      },
      { $unwind: "$patient" },
      ...geoFilterStages,
      { $group: { _id: "$diseaseName", totalAffected: { $sum: 1 } } },
      { $sort: { totalAffected: -1, _id: 1 } }
    ]),
    Prediction.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient"
        }
      },
      { $unwind: "$patient" },
      ...geoFilterStages,
      { $group: { _id: "$predictedSeverity", total: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Prediction.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient"
        }
      },
      { $unwind: "$patient" },
      ...geoFilterStages,
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            disease: "$diseaseName"
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { "_id.day": 1, "_id.disease": 1 } }
    ]),
    Prediction.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient"
        }
      },
      { $unwind: "$patient" },
      ...geoFilterStages,
      {
        $group: {
          _id: {
            district: "$patient.district",
            area: "$patient.area"
          },
          totalCases: { $sum: 1 },
          lat: { $avg: "$patient.location.lat" },
          lng: { $avg: "$patient.location.lng" }
        }
      },
      { $sort: { totalCases: -1 } }
    ]),
    Prediction.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient"
        }
      },
      { $unwind: "$patient" },
      ...geoFilterStages,
      {
        $group: {
          _id: {
            district: "$patient.district",
            area: "$patient.area",
            disease: "$diseaseName"
          },
          totalCases: { $sum: 1 }
        }
      },
      { $match: { totalCases: { $gt: 5 } } },
      { $sort: { totalCases: -1 } }
    ]),
    Prediction.aggregate([
      { $match: { createdAt: { $gte: currentFrom, $lte: currentTo } } },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient"
        }
      },
      { $unwind: "$patient" },
      ...geoFilterStages,
      { $group: { _id: "$diseaseName", totalAffected: { $sum: 1 } } }
    ]),
    Prediction.aggregate([
      { $match: { createdAt: { $gte: previousFrom, $lte: previousTo } } },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient"
        }
      },
      { $unwind: "$patient" },
      ...geoFilterStages,
      { $group: { _id: "$diseaseName", totalAffected: { $sum: 1 } } }
    ])
  ]);

  const warnings = outbreakWarnings.map((row) => ({
    district: row._id.district,
    area: row._id.area,
    disease: row._id.disease,
    totalCases: row.totalCases,
    outbreakWarning: true
  }));

  const currentMap = mapDiseaseTotals(currentWindowDiseaseTotals);
  const previousMap = mapDiseaseTotals(previousWindowDiseaseTotals);
  const allDiseases = Array.from(new Set([...Object.keys(currentMap), ...Object.keys(previousMap)])).sort();

  const diseaseComparisons = allDiseases.map((disease) => {
    const current = currentMap[disease] || 0;
    const previous = previousMap[disease] || 0;
    const deltaPct = calculateDelta(current, previous);
    const trend = deltaPct > 0 ? "rising" : deltaPct < 0 ? "falling" : "stable";

    return {
      disease,
      currentCases: current,
      previousCases: previous,
      deltaPct,
      trend
    };
  });

  const currentTotal = diseaseComparisons.reduce((acc, row) => acc + row.currentCases, 0);
  const previousTotal = diseaseComparisons.reduce((acc, row) => acc + row.previousCases, 0);
  const totalDeltaPct = calculateDelta(currentTotal, previousTotal);

  return {
    generatedAt: new Date().toISOString(),
    diseaseTotals: diseaseTotals.map((item) => ({ disease: item._id, totalAffected: item.totalAffected })),
    severityTotals: severityTotals.map((item) => ({ severity: item._id, total: item.total })),
    dailyTrend: dailyTrend.map((item) => ({ date: item._id.day, disease: item._id.disease, total: item.total })),
    geoHeatmap: areaDensity
      .filter((row) => typeof row.lat === "number" && typeof row.lng === "number")
      .map((row) => ({
        district: row._id.district,
        area: row._id.area,
        totalCases: row.totalCases,
        lat: Number(row.lat.toFixed(6)),
        lng: Number(row.lng.toFixed(6))
      })),
    outbreakSummary: {
      threshold: 5,
      totalAlerts: warnings.length
    },
    outbreakWarnings: warnings,
    weeklyComparison: {
      currentWindow: {
        from: currentFrom.toISOString(),
        to: currentTo.toISOString()
      },
      previousWindow: {
        from: previousFrom.toISOString(),
        to: previousTo.toISOString()
      },
      totals: {
        current: currentTotal,
        previous: previousTotal,
        deltaPct: totalDeltaPct,
        trend: totalDeltaPct > 0 ? "rising" : totalDeltaPct < 0 ? "falling" : "stable"
      },
      diseases: diseaseComparisons
    }
  };
}

async function getDmoPatientCluster({ district, area, disease, fromDate, toDate, limit = 100 }, actorId) {
  if (!area || !disease) {
    throw createHttpError(400, "area and disease are required");
  }

  const match = buildPredictionDateMatch(fromDate, toDate);

  const cluster = await Prediction.aggregate([
    { $match: { ...match, diseaseName: disease } },
    {
      $lookup: {
        from: "patients",
        localField: "patient",
        foreignField: "_id",
        as: "patient"
      }
    },
    { $unwind: "$patient" },
    ...(district ? [{ $match: { "patient.district": district } }] : []),
    { $match: { "patient.area": area } },
    { $sort: { createdAt: -1 } },
    { $limit: Number(limit) || 100 },
    {
      $project: {
        _id: 0,
        predictionId: "$_id",
        patientCode: "$patient.patientCode",
        fullName: "$patient.fullName",
        contactNumber: "$patient.contactNumber",
        addressLine: "$patient.addressLine",
        district: "$patient.district",
        area: "$patient.area",
        diseaseName: "$diseaseName",
        predictedSeverity: "$predictedSeverity",
        probability: "$probability",
        detectedAt: "$createdAt"
      }
    }
  ]);

  if (actorId) {
    await logAudit({
      actorId,
      action: "VIEW_PATIENT_CLUSTER",
      entityType: "Dashboard",
      entityId: `${district || "ALL"}:${area}:${disease}`,
      details: { district, area, disease, fromDate, toDate, limit }
    });
  }

  return {
    district: district || "All",
    area,
    disease,
    totalPatients: cluster.length,
    patients: cluster
  };
}

async function getDmoOverviewWithAudit(filters, actorId) {
  const data = await getDmoOverview(filters);
  if (actorId) {
    await logAudit({
      actorId,
      action: "VIEW_DMO_OVERVIEW",
      entityType: "Dashboard",
      entityId: "DMO_OVERVIEW",
      details: filters || {}
    });
  }
  return data;
}

module.exports = { getDmoDiseaseBurden, getDmoOverview, getDmoOverviewWithAudit, getDmoPatientCluster };
