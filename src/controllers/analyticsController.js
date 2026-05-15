const {
  getDmoDiseaseBurden,
  getDmoOverviewWithAudit,
  getDmoPatientCluster,
  getDmoAlerts,
  exportDmoDiseaseBurdenCsv
} = require("../services/analyticsService");

async function dmoDiseaseBurdenHandler(req, res, next) {
  try {
    const data = await getDmoDiseaseBurden({
      district: req.query.district,
      mandal: req.query.mandal,
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
    const filters = {
      district: req.query.district,
      mandal: req.query.mandal,
      area: req.query.area,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      alertThreshold: req.query.alertThreshold
    };
    const data = await getDmoOverviewWithAudit(filters, req.user?.id);

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

async function dmoPatientClusterHandler(req, res, next) {
  try {
    const data = await getDmoPatientCluster(
      {
        district: req.query.district,
        mandal: req.query.mandal,
        area: req.query.area,
        disease: req.query.disease,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        limit: req.query.limit
      },
      req.user?.id
    );

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

async function dmoAlertsHandler(req, res, next) {
  try {
    const data = await getDmoAlerts(
      {
        district: req.query.district,
        mandal: req.query.mandal,
        area: req.query.area,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        alertThreshold: req.query.alertThreshold
      },
      req.user?.id
    );

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

async function dmoExportHandler(req, res, next) {
  try {
    const csv = await exportDmoDiseaseBurdenCsv(
      {
        district: req.query.district,
        mandal: req.query.mandal,
        area: req.query.area,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate
      },
      req.user?.id
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=dmo-disease-burden.csv");
    return res.status(200).send(csv);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  dmoDiseaseBurdenHandler,
  dmoOverviewHandler,
  dmoPatientClusterHandler,
  dmoAlertsHandler,
  dmoExportHandler
};
