const { Prediction } = require("../models/Prediction");
const { logAudit } = require("./auditService");
const { createHttpError } = require("../utils/httpError");

const DEFAULT_ACTIVE_WINDOW_DAYS = 14;

function buildPredictionDateMatch(fromDate, toDate) {
  if (!fromDate && !toDate) {
    const now = new Date();
    return {
      createdAt: {
        $gte: new Date(now.getTime() - DEFAULT_ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000),
        $lte: now
      }
    };
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
  const currentFrom = fromDate
    ? new Date(fromDate)
    : new Date(currentTo.getTime() - DEFAULT_ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const duration = Math.max(1, currentTo.getTime() - currentFrom.getTime());
  const previousTo = new Date(currentFrom.getTime());
  const previousFrom = new Date(currentFrom.getTime() - duration);

  return { currentFrom, currentTo, previousFrom, previousTo };
}

function buildLatestPatientPredictionStages() {
  return [
    { $sort: { patient: 1, createdAt: -1, _id: -1 } },
    {
      $group: {
        _id: "$patient",
        latestPrediction: { $first: "$$ROOT" }
      }
    },
    { $replaceRoot: { newRoot: "$latestPrediction" } }
  ];
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

function buildGeoFilterStages(district, mandal) {
  return [
    ...(district ? [{ $match: { "patient.district": district } }] : []),
    ...(mandal ? [{ $match: { $or: [{ "patient.mandal": mandal }, { "patient.area": mandal }] } }] : [])
  ];
}

function buildMandalGroupId() {
  return {
    district: "$patient.district",
    mandal: { $ifNull: ["$patient.mandal", "$patient.area"] },
    locality: {
      $ifNull: [
        "$patient.village",
        {
          $ifNull: ["$patient.ward", "$patient.area"]
        }
      ]
    },
    disease: "$diseaseName"
  };
}

async function getDmoDiseaseBurden({ district, mandal, area, fromDate, toDate }) {
  const match = buildPredictionDateMatch(fromDate, toDate);
  const resolvedMandal = mandal || area;

  const pipeline = [
    { $match: match },
    ...buildLatestPatientPredictionStages(),
    {
      $lookup: {
        from: "patients",
        localField: "patient",
        foreignField: "_id",
        as: "patient"
      }
    },
    { $unwind: "$patient" },
    ...buildGeoFilterStages(district, resolvedMandal),
    {
      $group: {
        _id: buildMandalGroupId(),
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
    { $sort: { "_id.district": 1, "_id.mandal": 1, "_id.locality": 1, "_id.disease": 1 } }
  ];

  const rows = await Prediction.aggregate(pipeline);

  const mandalSummary = rows.map((item) => ({
    district: item._id.district,
    mandal: item._id.mandal || "Unknown",
    villageOrWard: item._id.locality || "Unknown",
    area: item._id.mandal || "Unknown",
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
    totalBuckets: mandalSummary.length,
    mandalSummary,
    areaSummary: mandalSummary
  };
}

async function getDmoOverview({ district, mandal, area, fromDate, toDate }) {
  const match = buildPredictionDateMatch(fromDate, toDate);
  const { currentFrom, currentTo, previousFrom, previousTo } = buildWindow(fromDate, toDate);
  const resolvedMandal = mandal || area;
  const geoFilterStages = buildGeoFilterStages(district, resolvedMandal);

  const [
    diseaseTotals,
    severityTotals,
    dailyTrend,
    areaDensity,
    outbreakWarnings,
    currentWindowDiseaseTotals,
    previousWindowDiseaseTotals,
    currentAreaTotals,
    previousAreaTotals
  ] = await Promise.all([
    Prediction.aggregate([
      { $match: match },
      ...buildLatestPatientPredictionStages(),
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
      ...buildLatestPatientPredictionStages(),
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
      ...buildLatestPatientPredictionStages(),
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
      ...buildLatestPatientPredictionStages(),
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
            mandal: { $ifNull: ["$patient.mandal", "$patient.area"] }
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
      ...buildLatestPatientPredictionStages(),
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
            mandal: { $ifNull: ["$patient.mandal", "$patient.area"] },
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
      ...buildLatestPatientPredictionStages(),
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
      ...buildLatestPatientPredictionStages(),
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
      { $match: { createdAt: { $gte: currentFrom, $lte: currentTo } } },
      ...buildLatestPatientPredictionStages(),
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
            mandal: { $ifNull: ["$patient.mandal", "$patient.area"] }
          },
          totalAffected: { $sum: 1 }
        }
      }
    ]),
    Prediction.aggregate([
      { $match: { createdAt: { $gte: previousFrom, $lte: previousTo } } },
      ...buildLatestPatientPredictionStages(),
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
            mandal: { $ifNull: ["$patient.mandal", "$patient.area"] }
          },
          totalAffected: { $sum: 1 }
        }
      }
    ])
  ]);

  const warnings = outbreakWarnings.map((row) => ({
    district: row._id.district,
    mandal: row._id.mandal,
    area: row._id.mandal,
    disease: row._id.disease,
    totalCases: row.totalCases,
    outbreakWarning: true
  }));

  const currentMap = mapDiseaseTotals(currentWindowDiseaseTotals);
  const previousMap = mapDiseaseTotals(previousWindowDiseaseTotals);
  const allDiseases = Array.from(new Set([...Object.keys(currentMap), ...Object.keys(previousMap)])).sort();
  const currentAreaMap = currentAreaTotals.reduce((acc, item) => {
    const key = `${item._id.district}::${item._id.mandal}`;
    acc[key] = Number(item.totalAffected || 0);
    return acc;
  }, {});
  const previousAreaMap = previousAreaTotals.reduce((acc, item) => {
    const key = `${item._id.district}::${item._id.mandal}`;
    acc[key] = Number(item.totalAffected || 0);
    return acc;
  }, {});
  const allAreaKeys = Array.from(new Set([...Object.keys(currentAreaMap), ...Object.keys(previousAreaMap)])).sort();

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
  const mandalComparisons = allAreaKeys.map((key) => {
    const [districtName, mandalName] = key.split("::");
    const current = currentAreaMap[key] || 0;
    const previous = previousAreaMap[key] || 0;
    const deltaPct = calculateDelta(current, previous);

    return {
      district: districtName,
      mandal: mandalName,
      area: mandalName,
      currentCases: current,
      previousCases: previous,
      deltaPct,
      trend: deltaPct > 0 ? "rising" : deltaPct < 0 ? "falling" : "stable"
    };
  });

  const diseaseDistribution = diseaseTotals.reduce((acc, item) => {
    const total = Number(item.totalAffected || 0);
    const percentage = currentTotal > 0 ? Number(((total / currentTotal) * 100).toFixed(2)) : 0;
    acc.push({ disease: item._id, totalAffected: total, percentage });
    return acc;
  }, []);

  const districtSummary = {
    totalCases: currentTotal,
    topDisease: diseaseComparisons.sort((a, b) => b.currentCases - a.currentCases)[0]?.disease || "Unknown",
    highRiskMandals: mandalComparisons.filter((item) => item.currentCases >= 15 || item.deltaPct >= 50).length,
    totalMandals: mandalComparisons.length
  };

  return {
    generatedAt: new Date().toISOString(),
    diseaseTotals: diseaseTotals.map((item) => ({ disease: item._id, totalAffected: item.totalAffected })),
    diseaseDistribution,
    severityTotals: severityTotals.map((item) => ({ severity: item._id, total: item.total })),
    dailyTrend: dailyTrend.map((item) => ({ date: item._id.day, disease: item._id.disease, total: item.total })),
    geoHeatmap: areaDensity
      .filter((row) => typeof row.lat === "number" && typeof row.lng === "number")
      .map((row) => ({
        district: row._id.district,
        mandal: row._id.mandal,
        area: row._id.mandal,
        totalCases: row.totalCases,
        lat: Number(row.lat.toFixed(6)),
        lng: Number(row.lng.toFixed(6))
      })),
    districtSummary,
    outbreakSummary: {
      threshold: 5,
      totalAlerts: warnings.length,
      activeWindowDays: fromDate || toDate ? null : DEFAULT_ACTIVE_WINDOW_DAYS
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
    },
    mandalComparisons,
    areaComparisons: mandalComparisons
  };
}

async function getDmoPatientCluster({ district, mandal, area, disease, fromDate, toDate, limit = 100 }, actorId) {
  const resolvedMandal = mandal || area;
  if (!resolvedMandal || !disease) {
    throw createHttpError(400, "mandal and disease are required");
  }

  const match = buildPredictionDateMatch(fromDate, toDate);

  const cluster = await Prediction.aggregate([
    { $match: { ...match, diseaseName: disease } },
    ...buildLatestPatientPredictionStages(),
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
    { $match: { $or: [{ "patient.mandal": resolvedMandal }, { "patient.area": resolvedMandal }] } },
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
        mandal: { $ifNull: ["$patient.mandal", "$patient.area"] },
        village: "$patient.village",
        ward: "$patient.ward",
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
      entityId: `${district || "ALL"}:${resolvedMandal}:${disease}`,
      details: { district, mandal: resolvedMandal, disease, fromDate, toDate, limit }
    });
  }

  return {
    district: district || "All",
    mandal: resolvedMandal,
    area: resolvedMandal,
    disease,
    activeWindowDays: fromDate || toDate ? null : DEFAULT_ACTIVE_WINDOW_DAYS,
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
