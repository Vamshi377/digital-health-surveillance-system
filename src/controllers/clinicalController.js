const {
  registerPatient,
  createMedicalRecord,
  uploadLabReport,
  createDiagnosisWithPrediction,
  getDoctorDashboard,
  getPatientHistory,
  getPatientHistoryByCode,
  getMyPatientHistory
} = require("../services/clinicalService");

async function registerPatientHandler(req, res, next) {
  try {
    const patient = await registerPatient(req.body, req.user.id);
    return res.status(201).json({ patient });
  } catch (error) {
    return next(error);
  }
}

async function createMedicalRecordHandler(req, res, next) {
  try {
    const record = await createMedicalRecord(req.params.patientId, req.body, req.user.id);
    return res.status(201).json({ medicalRecord: record });
  } catch (error) {
    return next(error);
  }
}

async function uploadLabReportHandler(req, res, next) {
  try {
    const labReport = await uploadLabReport(req.params.recordId, req.body, req.user.id);
    return res.status(201).json({ labReport });
  } catch (error) {
    return next(error);
  }
}

async function diagnosePatientHandler(req, res, next) {
  try {
    const result = await createDiagnosisWithPrediction(req.params.recordId, req.body, req.user.id);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function doctorDashboardHandler(req, res, next) {
  try {
    const dashboard = await getDoctorDashboard();
    return res.status(200).json({ records: dashboard });
  } catch (error) {
    return next(error);
  }
}

async function patientHistoryHandler(req, res, next) {
  try {
    const history = await getPatientHistory(req.params.patientId);
    return res.status(200).json(history);
  } catch (error) {
    return next(error);
  }
}

async function patientHistoryByCodeHandler(req, res, next) {
  try {
    const history = await getPatientHistoryByCode(req.params.patientCode);
    return res.status(200).json(history);
  } catch (error) {
    return next(error);
  }
}

async function myRecordsHandler(req, res, next) {
  try {
    const history = await getMyPatientHistory(req.user.id);
    return res.status(200).json(history);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  registerPatientHandler,
  createMedicalRecordHandler,
  uploadLabReportHandler,
  diagnosePatientHandler,
  doctorDashboardHandler,
  patientHistoryHandler,
  patientHistoryByCodeHandler,
  myRecordsHandler
};
