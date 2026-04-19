# API reference

Base URL: `http://localhost:4000`
All non-auth endpoints require `Authorization: Bearer <jwt>`.
All responses are JSON unless stated otherwise. Errors are returned as `{ "error": "<message>" }` with an appropriate HTTP status.

A ready-to-import Postman collection is available at [`postman/Digital-Health-System.postman_collection.json`](../postman/Digital-Health-System.postman_collection.json).

---

## Health

### `GET /health`
Liveness probe. No auth required.

Response `200`:
```json
{ "status": "ok" }
```

---

## Auth (`/api/auth`)

### `POST /api/auth/register`
Register a new user (defaults to `PENDING` approval for non-patient roles).

Request:
```json
{
  "fullName": "Dr. Asha",
  "email": "asha@hospital.example",
  "password": "Secret@123",
  "role": "doctor",
  "roleProfile": {
    "registrationNumber": "TS-MCI-12345",
    "specialization": "General Medicine",
    "yearsOfExperience": 6
  }
}
```

Response `201`:
```json
{ "user": { "id": "...", "email": "asha@hospital.example", "role": "doctor", "approvalStatus": "PENDING" } }
```

### `POST /api/auth/login`
Request:
```json
{ "email": "doctor@health.local", "password": "Doctor@123" }
```

Response `200`:
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "email": "...", "role": "doctor", "fullName": "..." }
}
```

Failure modes:
- `401` `Invalid credentials`
- `403` `Your account is under verification` (approval is not `APPROVED`)
- `403` `Account inactive` (when `isActive = false`)

### `GET /api/auth/me`
Returns the authenticated user profile.

---

## Admin (`/api/admin`) — auth + role-gated

All routes require one of `hospital_admin`, `medical_superintendent`, or `dmo` (see [roles-and-permissions.md](./roles-and-permissions.md) for per-route rules).

### `GET /api/admin/users?role=&approvalStatus=&isActive=&q=`
List users with optional filters.

### `PATCH /api/admin/users/:userId/approval`
Approve or reject a pending user.
```json
{ "approvalStatus": "APPROVED", "approvalRemarks": "Verified MCI number" }
```

### `POST /api/admin/users`
Create a user (e.g. Admin creating a Reception/Nurse/DMO/Patient account).

### `PATCH /api/admin/users/:userId/role`
Update role.

### `PATCH /api/admin/users/:userId/status`
Activate/deactivate a user.

---

## Clinical (`/api/clinical`)

### Reception

#### `GET /api/clinical/patients/search?phone=<phone>`
Find an existing patient by phone number.

#### `POST /api/clinical/patients`
Register a patient.
```json
{
  "fullName": "Ravi Kumar",
  "dateOfBirth": "1994-05-10",
  "gender": "male",
  "district": "Hyderabad",
  "mandal": "Kukatpally",
  "area": "KPHB",
  "addressLine": "Flat 203, Sai Residency",
  "contactNumber": "9876543210",
  "location": { "lat": 17.491, "lng": 78.391 }
}
```
Response includes the generated `patientCode`.

#### `POST /api/clinical/patients/:patientId/appointments`
```json
{ "scheduledAt": "2025-04-20T09:30:00.000Z", "reason": "High fever since 2 days" }
```

### Nurse

#### `GET /api/clinical/nurse/queue`
Today’s scheduled appointments without a `MedicalRecord`.

#### `POST /api/clinical/appointments/:appointmentId/records`
```json
{
  "symptoms": ["fever", "body pain"],
  "vitals": { "temperature": 101.2, "bpSystolic": 124, "bpDiastolic": 80, "pulse": 92, "spo2": 97 },
  "chiefComplaint": "Fever x 2 days",
  "nurseNotes": "Patient alert, oriented"
}
```
Duplicates are blocked — one `MedicalRecord` per appointment.

### Lab

#### `GET /api/clinical/lab/queue`
Medical records pending lab input.

#### `POST /api/clinical/records/:recordId/lab-reports` (multipart/form-data)
Form fields:
- `testName` — e.g. `CBC`
- `values` — JSON string: `{"platelet_count":98000,"wbc_count":6200,"hemoglobin":13.2}`
- `summary` — free text
- `reportImage` — optional file (JPG/PNG/PDF)

### Doctor

#### `GET /api/clinical/doctor/dashboard`
Records awaiting diagnosis plus high-level stats.

#### `GET /api/clinical/records/:recordId/summary`
Unified summary for one record: patient, vitals, latest lab, prior diagnoses, predictions.

#### `POST /api/clinical/records/:recordId/diagnosis`
```json
{
  "diseaseName": "Dengue",
  "diagnosisNotes": "Low platelets, fever pattern",
  "doctorSeverity": "moderate",
  "prescription": {
    "medicines": [
      { "medicineName": "Paracetamol", "dosage": "500mg", "frequency": "TDS", "durationDays": 5, "instructions": "After food" }
    ],
    "generalAdvice": "Oral hydration, avoid NSAIDs",
    "followUpDate": "2025-04-25"
  }
}
```
Triggers ML prediction; response includes the stored `Prediction`.

### Histories

- `GET /api/clinical/patients/:patientId/history`
- `GET /api/clinical/patients/by-code/:patientCode/history`
- `GET /api/clinical/patient/me/history` — patient self-view

---

## Analytics (`/api/analytics`)

All require `dmo` or `hospital_admin`.

### `GET /api/analytics/dmo/overview`
Returns KPIs (total cases, high-severity %, pressure score), outbreak alerts, severity distribution, top diseases, week-over-week trend, and hotspot ranking.

### `GET /api/analytics/dmo/disease-burden?district=&area=&disease=&fromDate=&toDate=`
District/area-wise burden table (low/moderate/high/priority/total).

### `GET /api/analytics/dmo/patient-cluster?district=&area=&disease=&fromDate=&toDate=`
Patient-level rows for one disease in one area, used by the cluster modal for field action.

---

## Upload (`/uploads`)

Lab report files uploaded via multer are served statically at `/uploads/<filename>`. Path is saved on `LabReport.reportImageUrl`.

---

## Error handling

Errors are raised via `createHttpError(status, message)` in [`src/utils/httpError.js`](../src/utils/httpError.js) and serialised by [`src/middlewares/errorHandler.js`](../src/middlewares/errorHandler.js):

| Status | Meaning |
| --- | --- |
| `400` | Validation error |
| `401` | Missing / invalid token |
| `403` | Authenticated but not authorised |
| `404` | Resource not found |
| `409` | Conflict (duplicate phone, duplicate nurse record) |
| `502` | ML service unreachable / failed |
| `500` | Unexpected server error |
