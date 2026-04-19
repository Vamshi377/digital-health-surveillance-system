# Overview

The **Digital Health Record + ML Disease Surveillance System** is a full-stack platform that connects day-to-day hospital operations with district-level public health surveillance for Telangana.

It is two systems in one:

1. **Clinical workflow system** — patient registration, vitals, lab reports, diagnosis, and prescriptions.
2. **Disease intelligence system** — ML-based severity prediction feeding a DMO (District Medical Officer) dashboard with outbreak alerts, hotspot ranking, and a 33-district choropleth map.

## Goals

- Digitise the hospital workflow end-to-end, from reception to discharge.
- Enforce clear role boundaries (reception, nurse, lab, doctor, admin, DMO, patient) via RBAC.
- Automatically compute severity using a trained XGBoost model after every confirmed diagnosis.
- Aggregate predictions geographically to enable early-warning outbreak surveillance at the district level.
- Keep an auditable trail of create/view actions on clinical records.

## Primary users

| User type | Example task |
| --- | --- |
| Receptionist | Register walk-in patient, book appointment |
| Nurse | Record vitals and symptoms for one appointment |
| Lab technician | Enter lab values (e.g. CBC), upload report file |
| Doctor | Review unified summary, finalise diagnosis and prescription |
| Medical Superintendent | Approve doctor/nurse/lab staff |
| Hospital Admin | Manage users and approve receptionists |
| DMO | Monitor outbreaks and district burden analytics |
| Patient | View own history, diagnoses, and predicted severity |

## High-level data flow

```
Reception → Nurse → Lab → Doctor ─▶ ML service (severity)
                                 │
                                 ▼
                         DMO dashboard (district analytics)
```

See [architecture.md](./architecture.md) for the full system diagram and [workflow.md](./workflow.md) for a detailed clinical walkthrough.

## Tech stack at a glance

- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Multer
- **ML service**: Python 3.10+, FastAPI, XGBoost, scikit-learn, Pydantic
- **Frontend**: React 18 + Vite, Recharts, Leaflet (Telangana district GeoJSON)
- **Ops**: Nodemon (dev), dotenv, CORS, centralised error handling, audit logging

## What this repo does **not** do (today)

- No billing/payments module.
- No hospital inventory or bed-management module.
- ML model is trained on a bundled demo dataset (`ml_service/data/demo_dataset.csv`) — it is a proof-of-concept, not a clinically validated model.
- No SMS/email notifications — notifications are stored in MongoDB only.
