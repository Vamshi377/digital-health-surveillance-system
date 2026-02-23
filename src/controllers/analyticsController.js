const { getDmoDiseaseBurden, getDmoOverview } = require("../services/analyticsService");

async function dmoDiseaseBurdenHandler(req, res, next) {
  try {
    const data = await getDmoDiseaseBurden({
      district: req.query.district,
      area: req.query.area,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate
    });

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

async function dmoOverviewHandler(req, res, next) {
  try {
    const data = await getDmoOverview({
      district: req.query.district,
      area: req.query.area,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate
    });

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = { dmoDiseaseBurdenHandler, dmoOverviewHandler };
