# Clinical workflow

A single patient visit flows through five role-scoped stages. Each stage adds one layer of structured information to the same `MedicalRecord`, and the doctor stage additionally triggers ML severity prediction.

```
Reception ─▶ Nurse ─▶ Lab ─▶ Doctor ─▶ ML prediction ─▶ DMO analytics
```

## Stage 1 — Reception

**Who:** `receptionist`, `hospital_admin`
**Endpoints:** `POST /api/clinical/patients`, `POST /api/clinical/patients/:patientId/appointments`, `GET /api/clinical/patients/search`

- Search existing patient by phone via `GET /api/clinical/patients/search?phone=...`.
- Create a new `Patient` with demographic and geographic fields (district, mandal, area, village/ward, address, contact, optional Aadhaar, lat/lng).
- Duplicate phone numbers are rejected (unique sparse index).
- `patientCode` is auto-generated as `PAT-XXXXXXXX` (uppercase, 8-char UUID slice) and is immutable.
- Create an `Appointment` with `scheduledAt` + `reason`. Default status: `scheduled`.

## Stage 2 — Nurse

**Who:** `nurse`, `hospital_admin`
**Endpoints:** `GET /api/clinical/nurse/queue`, `POST /api/clinical/appointments/:appointmentId/records`

- Nurse queue lists scheduled appointments without a `MedicalRecord`.
- Record vitals + symptoms exactly **once per appointment** (enforced by a unique index on `MedicalRecord.appointment`).
- Vital ranges (see [`MedicalRecord`](../src/models/MedicalRecord.js)):
  - `temperature` 90–115 °F, `bpSystolic` 40–260, `bpDiastolic` 20–180, `pulse` 20–250, `spo2` 0–100, `respiratoryRate` 0–60.
- Automatic `vitalsAlertLevel`:
  - `critical` if SpO₂ < 90
  - `abnormal` if temperature ≥ 103 °F or SpO₂ < 94
  - otherwise `normal`
- Appointment transitions to `vitals_recorded` once saved.

## Stage 3 — Lab

**Who:** `lab_technician`, `hospital_admin`
**Endpoints:** `GET /api/clinical/lab/queue`, `POST /api/clinical/records/:recordId/lab-reports`

- Multipart upload (`reportImage` field, optional) via Multer — stored under `/uploads`.
- Reference ranges currently hard-coded for CBC in [`clinicalService.js`](../src/services/clinicalService.js):
  - `platelet_count` 150,000–450,000 (critical below 100,000)
  - `wbc_count` 4,000–11,000
  - `hemoglobin` 12–17.5 g/dL
- Values outside range become `abnormalMarkers`; `isCritical` flips true if a `criticalBelow` threshold is breached.
- Appointment transitions to `lab_uploaded`.

## Stage 4 — Doctor

**Who:** `doctor`, `hospital_admin`
**Endpoints:**
- `GET /api/clinical/doctor/dashboard`
- `GET /api/clinical/records/:recordId/summary`
- `POST /api/clinical/records/:recordId/diagnosis`
- `GET /api/clinical/patients/:patientId/history`
- `GET /api/clinical/patients/by-code/:patientCode/history`

The **unified summary** combines patient identity, vitals, latest lab report, and prior diagnoses/predictions, so the doctor has one screen to decide on. Submitting a diagnosis performs all of the following atomically within the service:

1. Persist `Diagnosis` (disease name, notes, optional `doctorSeverity`).
2. Persist `Prescription` (medicine rows + general advice + follow-up date).
3. Build the ML payload and call the FastAPI `/predict` endpoint.
4. Persist `Prediction` (probability + predicted severity) linked to both `Diagnosis` and `Patient`.
5. Update `Appointment.status = "diagnosed"` and `MedicalRecord.status = "diagnosed"`.
6. Record an `AuditLog` entry for the action.

## Stage 5 — DMO analytics

**Who:** `dmo`, `hospital_admin`
**Endpoints:** `GET /api/analytics/dmo/overview`, `GET /api/analytics/dmo/disease-burden`, `GET /api/analytics/dmo/patient-cluster`

Aggregations run on `Prediction` documents joined with `Patient` geography. The dashboard surfaces:

- Real-time KPIs (total cases, high-severity %, pressure score).
- Outbreak alerts (disease × area × time window, threshold-based).
- Week-over-week trend.
- Hotspot ranking by total + severe case count.
- 33-district burden table and Telangana choropleth.
- Patient cluster modal for field action.

See [dmo-dashboard.md](./dmo-dashboard.md).

## Patient self-view

Endpoints: `GET /api/clinical/patient/me/history`
Shows the patient their own visits, diagnoses, and latest predicted severity. Requires the user account to be linked to a `Patient` by `patientCode`.

## Notification model (informational)

Follow-up/lab notifications are stored in the [`Notification`](../src/models/Notification.js) collection. There is **no** outbound SMS/email integration in this repo — they are records for the in-app patient dashboard to render.
