# Data models

All clinical and administrative data is stored in MongoDB via Mongoose. Schemas live in [`src/models/`](../src/models/) and are summarised below.

## Collections

| Collection | Purpose | Source |
| --- | --- | --- |
| `User` | Login accounts + role + approval state | [`models/User.js`](../src/models/User.js) |
| `Patient` | Demographic + geographic patient profile | [`models/Patient.js`](../src/models/Patient.js) |
| `Appointment` | Visit scheduling (status-tracked) | [`models/Appointment.js`](../src/models/Appointment.js) |
| `MedicalRecord` | Symptoms + vitals (one per appointment) | [`models/MedicalRecord.js`](../src/models/MedicalRecord.js) |
| `LabReport` | Test values, abnormal markers, report file | [`models/LabReport.js`](../src/models/LabReport.js) |
| `Diagnosis` | Doctor-confirmed disease + notes | [`models/Diagnosis.js`](../src/models/Diagnosis.js) |
| `Prescription` | Medicine table + general advice | [`models/Prescription.js`](../src/models/Prescription.js) |
| `Prediction` | ML output linked to Diagnosis + Patient | [`models/Prediction.js`](../src/models/Prediction.js) |
| `Notification` | Follow-up / lab notifications (in-app) | [`models/Notification.js`](../src/models/Notification.js) |
| `AuditLog` | Trail of key create/view actions | [`models/AuditLog.js`](../src/models/AuditLog.js) |

## Key schemas

### User
- `email` (unique, lowercased), `passwordHash` (bcrypt, `select: false`), `fullName`, optional `phoneNumber`, `hospitalId`, `hospitalName`.
- `role` — one of `doctor`, `nurse`, `lab_technician`, `receptionist`, `medical_superintendent`, `hospital_admin`, `dmo`, `patient`.
- `approvalStatus` — `PENDING` / `APPROVED` / `REJECTED`, plus `approvalRemarks`, `approvalReviewedAt`, `approvalReviewedBy`.
- `patientId` — link to a `Patient` profile (only for `role = patient`).
- `isActive`, `lastLoginAt`.
- `roleProfile` — role-specific fields (registration number, qualification, specialization, employee id, department authority, etc.).

### Patient
- `patientCode` — auto-generated `PAT-XXXXXXXX`, unique and immutable.
- Identity: `fullName`, `dateOfBirth`, `age`, `gender` (`male`/`female`/`other`).
- Geography: `district`, `mandal`, `village`, `ward`, `area`, `addressLine`, `location.{lat,lng}`.
- Contact: `contactNumber` (unique sparse), `aadharNumber` (unique sparse).
- `registeredBy` — User ref.

### Appointment
- `patient` (ref), `scheduledAt`, optional `visitDate`, `reason`, `createdBy`.
- `status` — `scheduled` | `vitals_recorded` | `lab_uploaded` | `diagnosed` | `completed` | `cancelled`.

### MedicalRecord (one per appointment — enforced by unique index)
- `patient`, `appointment` (unique), `appointmentAt`.
- `symptoms` — `string[]`.
- `vitals` — `{ temperature, bpSystolic, bpDiastolic, pulse, spo2, respiratoryRate }` with min/max validation.
- `chiefComplaint`, `nurseNotes`, `recordedBy`.
- `status` — `scheduled` | `in_review` | `diagnosed`.
- `vitalsAlertLevel` — `normal` | `abnormal` | `critical` (auto-computed by [`clinicalService.js`](../src/services/clinicalService.js)).

### LabReport
- `patient`, `medicalRecord`, `testName`, freeform `values` (Mixed), `summary`.
- File metadata: `reportImageUrl`, `reportOriginalName`, `reportMimeType` (served under `/uploads`).
- `abnormalMarkers: string[]`, `isCritical: boolean`, `uploadedBy`.

### Diagnosis
- `patient`, `medicalRecord`, `diagnosedBy`, `diseaseName`, `diagnosisNotes`.
- `doctorSeverity` — optional `low` | `moderate` | `high` override.

### Prescription
- `patient`, `diagnosis`, `prescribedBy`, `generalAdvice`, `followUpDate`.
- `medicines: { medicineName, dosage, frequency, durationDays, instructions }[]`.

### Prediction
- `patient`, `diagnosis`, `diseaseName`.
- `probability: 0..1`, `predictedSeverity: low|moderate|high`.
- `modelSource` (default `"fastapi-ml-service"`), `features` (Mixed — raw payload sent to ML).

### Notification
- `patient`, optional `medicalRecord`.
- `category` — `follow_up` | `lab_report` | `general`.
- `title`, `message`, `followUpDate`, `createdBy`.

### AuditLog
- `actor` (User), `action`, `entityType`, `entityId`, `details` (Mixed).
- Indexed on `createdAt desc + action`.

## Referential integrity

MongoDB does not enforce foreign keys; integrity is enforced at the service layer (`src/services/*`). All `ObjectId` fields use Mongoose `ref` for convenient `populate()` in read handlers.

## Indexes worth noting

- `Patient.contactNumber` — unique sparse (duplicate phone prevention).
- `MedicalRecord.appointment` — unique (one record per appointment).
- `Patient.{district, mandal, area, createdAt desc}` — supports DMO aggregation.
- `Prediction.{diseaseName, predictedSeverity, createdAt desc}` — supports burden queries.
- `User.{role, approvalStatus}` and `User.{role, isActive}` — admin list filters.
