const {
  searchPatientByPhone,
  registerPatient,
  createAppointment,
  getNurseQueue,
  createMedicalRecord,
  uploadLabReport,
  createDiagnosisWithPrediction,
  getDoctorDashboard,
  getPatientHistory,
  getPatientHistoryByCode,
  getMyPatientHistory,
  getRecordSummary
} = require("../services/clinicalService");

async function searchPatientByPhoneHandler(req, res, next) {
  try {
    const patient = await searchPatientByPhone(req.query.phone);
    return res.status(200).json({ patient });
  } catch (error) {
    return next(error);
  }
}

async function registerPatientHandler(req, res, next) {
  try {
    const patient = await registerPatient(req.body, req.user.id);
    return res.status(201).json({ patient });
  } catch (error) {
    return next(error);
  }
}

async function createAppointmentHandler(req, res, next) {
  try {
    const appointment = await createAppointment(req.params.patientId, req.body, req.user.id);
    return res.status(201).json({ appointment });
  } catch (error) {
    return next(error);
  }
}

async function nurseQueueHandler(req, res, next) {
  try {
    const queue = await getNurseQueue();
    return res.status(200).json({ queue });
  } catch (error) {
    return next(error);
  }
}

async function createMedicalRecordHandler(req, res, next) {
  try {
    const record = await createMedicalRecord(req.params.appointmentId, req.body, req.user.id);
    return res.status(201).json({ medicalRecord: record });
  } catch (error) {
    return next(error);
  }
}

async function uploadLabReportHandler(req, res, next) {
  try {
    let parsedValues = req.body.values;
    if (typeof parsedValues === "string") {
      try {
        parsedValues = JSON.parse(parsedValues);
      } catch {
        parsedValues = {};
      }
    }

    const payload = {
      testName: req.body.testName,
      values: parsedValues,
      summary: req.body.summary
    };

    const fileInfo = req.file
      ? {
          url: `/uploads/lab-reports/${req.file.filename}`,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype
        }
      : null;

    const labReport = await uploadLabReport(req.params.recordId, payload, req.user.id, fileInfo);
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
    const history = await getPatientHistory(req.params.patientId, req.user.id);
    return res.status(200).json(history);
  } catch (error) {
    return next(error);
  }
}

async function patientHistoryByCodeHandler(req, res, next) {
  try {
    const history = await getPatientHistoryByCode(req.params.patientCode, req.user.id);
    return res.status(200).json(history);
  } catch (error) {
    return next(error);
  }
}

async function myRecordsHandler(req, res, next) {
  try {
    const history = await getMyPatientHistory(req.user.id, req.user.id);
    return res.status(200).json(history);
  } catch (error) {
    return next(error);
  }
}

async function recordSummaryHandler(req, res, next) {
  try {
    const summary = await getRecordSummary(req.params.recordId, req.user.id);
    return res.status(200).json(summary);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  searchPatientByPhoneHandler,
  registerPatientHandler,
  createAppointmentHandler,
  nurseQueueHandler,
  createMedicalRecordHandler,
  uploadLabReportHandler,
  diagnosePatientHandler,
  doctorDashboardHandler,
  recordSummaryHandler,
  patientHistoryHandler,
  patientHistoryByCodeHandler,
  myRecordsHandler
};
