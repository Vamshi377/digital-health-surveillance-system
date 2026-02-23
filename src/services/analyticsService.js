const { Prediction } = require("../models/Prediction");

async function getDmoDiseaseBurden({ district, area, fromDate, toDate }) {
  const match = {};

  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) {
      match.createdAt.$gte = new Date(fromDate);
    }
    if (toDate) {
      match.createdAt.$lte = new Date(toDate);
    }
  }

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
  const match = {};
  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) {
      match.createdAt.$gte = new Date(fromDate);
    }
    if (toDate) {
      match.createdAt.$lte = new Date(toDate);
    }
  }

  const geoFilterStages = [
    ...(district ? [{ $match: { "patient.district": district } }] : []),
    ...(area ? [{ $match: { "patient.area": area } }] : [])
  ];

  const [diseaseTotals, severityTotals, dailyTrend] = await Promise.all([
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
    ])
  ]);

  return {
    generatedAt: new Date().toISOString(),
    diseaseTotals: diseaseTotals.map((item) => ({ disease: item._id, totalAffected: item.totalAffected })),
    severityTotals: severityTotals.map((item) => ({ severity: item._id, total: item.total })),
    dailyTrend: dailyTrend.map((item) => ({ date: item._id.day, disease: item._id.disease, total: item.total }))
  };
}

module.exports = { getDmoDiseaseBurden, getDmoOverview };
