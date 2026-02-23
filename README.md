# Digital Health Record and ML-Based Disease Surveillance System

Production-style backend system for hospital workflow and district-level disease surveillance.

This project has two services:
- Node.js API service (hospital records, auth, role access, analytics APIs)
- Python ML microservice (severity prediction using XGBoost)

And one client:
- React frontend (role-wise dashboards and workflow UI)

## 1. Problem This Solves

Hospitals record patient data through receptionist, nurse, lab, and doctor workflows.  
After doctor diagnosis, severity is predicted by ML and aggregated for DMO (District Medical Officer) dashboards.

DMO can answer questions like:
- Area A: Dengue total 10
- Severity split: high 5, moderate 2, low 3

## 2. High-Level Architecture

### Service A: Node.js + Express + MongoDB
- Auth (JWT)
- RBAC middleware
- Patient workflow APIs
- Data persistence
- DMO analytics aggregation APIs
- Calls ML service after diagnosis

### Service B: Python + FastAPI + XGBoost
- Trains multiclass severity model
- Exposes `/predict` endpoint
- Returns predicted severity + probability

### Why split into two services?
- Node handles API/business/security
- Python handles model training/inference
- Easier to scale, replace, or retrain ML independently

## 3. Tech Stack and Why Each Is Used

## Backend (Node)
- `express`: HTTP API framework
- `mongoose`: MongoDB ODM for schemas, validation, relations
- `jsonwebtoken`: issue/verify JWT tokens
- `bcryptjs`: hash passwords securely
- `dotenv`: load environment variables
- `nodemon` (dev): auto-restart server while coding
- `cors`: allow browser frontend to call backend securely

## ML Service (Python)
- `fastapi`: fast typed API framework
- `uvicorn`: ASGI server to run FastAPI
- `xgboost`: high-accuracy gradient boosting model for tabular clinical data
- `scikit-learn`: train/validation split, metrics, helpers
- `numpy`: numeric feature arrays
- `joblib`: serialize model artifacts

## Frontend (React)
- `react`: UI framework
- `react-router-dom`: role-based page routing
- `axios`: API client
- `recharts`: DMO charts and data visualization
- `vite`: fast frontend build/dev server

## Why XGBoost?
- Performs strongly on tabular structured data (age, vitals, lab values, symptoms)
- Good practical accuracy and stable in production
- Fast inference and explainable feature importance options

## 4. Roles and Permissions

- `admin`: manage users/roles/status, full access
- `receptionist`: register new patients
- `nurse`: append vitals/visit records
- `lab_technician`: upload lab reports
- `doctor`: fetch old records, diagnose, prescribe
- `government_officer` (DMO): view aggregated disease analytics
- `patient`: view own history

## 5. Core Domain Flow

1. Receptionist registers patient (unique immutable `patientCode`)
2. Nurse creates medical record and vitals
3. Lab uploads test report
4. Doctor reviews history + new data, diagnoses disease, writes prescription
5. Node sends patient clinical features to ML service
6. ML predicts severity (`low/moderate/high`) + probability
7. Prediction stored and included in DMO aggregation APIs

## 6. Project Structure

```text
src/
  app.js
  index.js
  config/
    env.js
    database.js
  controllers/
    authController.js
    adminController.js
    clinicalController.js
    analyticsController.js
  models/
    User.js
    Patient.js
    MedicalRecord.js
    LabReport.js
    Diagnosis.js
    Prescription.js
    Prediction.js
  middlewares/
    auth.js
    rbac.js
    errorHandler.js
  routes/
    authRoutes.js
    adminRoutes.js
    clinicalRoutes.js
    analyticsRoutes.js
    protectedRoutes.js
  services/
    authService.js
    adminService.js
    clinicalService.js
    analyticsService.js
    mlService.js
  scripts/
    seedDemoData.js
  utils/
    httpError.js

ml_service/
  app.py
  train.py
  model_utils.py
  requirements.txt
  data/demo_dataset.csv
  artifacts/

frontend/
  package.json
  src/
    App.jsx
    styles.css
    state/AuthContext.jsx
    services/api.js
    components/
    pages/
```

## 7. Environment Variables

Create `.env` in project root:

```env
PORT=4000
JWT_SECRET=your-strong-secret
JWT_EXPIRES_IN=8h
MONGO_URI=your-mongodb-uri
ML_SERVICE_URL=http://127.0.0.1:8000
ML_SERVICE_API_KEY=
FRONTEND_URL=http://localhost:5173
```

## 8. Installation

## Node API
```bash
npm install
```

## Python ML Service
```bash
cd ml_service
py -3.10 -m venv .venv
.\.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## React Frontend
```bash
cd frontend
npm install
copy .env.example .env
```

## 9. How To Run

## Terminal 1: Node Backend API (mandatory)

Open terminal in project root:
```bash
npm run dev
```

Expected log:
```text
Digital Health Record API running on port 4000
```

## Terminal 2: Python ML Service (mandatory)

Open a second terminal:
```bash
cd ml_service
.\.venv\Scripts\activate
python train.py
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Why these two terminals are required?
- Terminal 1 keeps Node API alive
- Terminal 2 keeps ML prediction API alive
- Node diagnosis endpoint depends on ML endpoint

If ML service is not running, diagnosis-to-prediction step fails.

## Terminal 3: React Frontend (for UI)
```bash
cd frontend
npm run dev
```

Open:
```text
http://localhost:5173
```

Why third terminal?
- Frontend is a separate process (Vite dev server)
- It provides role-based screens for all users
- It consumes backend APIs running in Terminal 1

## 10. Seed Demo Accounts

From project root:
```bash
npm run seed
```

Seeded users:
- `admin@health.local` / `Admin@123`
- `reception@health.local` / `Reception@123`
- `nurse@health.local` / `Nurse@123`
- `doctor@health.local` / `Doctor@123`
- `lab@health.local` / `Lab@123`
- `dmo@health.local` / `Dmo@123`
- `patient@health.local` / `Patient@123`

## 11. API Documentation

Base URL:
```text
http://localhost:4000
```

Use:
```text
Authorization: Bearer <token>
```
for protected routes.

## 11.1 Auth APIs

### POST `/api/auth/register`
Patient self-registration (role fixed as `patient`).

### POST `/api/auth/login`
Login for all roles.

### GET `/api/auth/me`
Returns currently authenticated user summary.

## 11.2 Admin APIs (admin only)

### GET `/api/admin/users`
List all users.

### POST `/api/admin/users`
Create staff/patient users.

### PATCH `/api/admin/users/:userId/role`
Update role.

### PATCH `/api/admin/users/:userId/status`
Activate/suspend account.

## 11.3 Clinical APIs

### POST `/api/clinical/patients`
Role: receptionist/admin  
Registers patient and generates unique `patientCode`.

### POST `/api/clinical/patients/:patientId/records`
Role: nurse/admin  
Appends new visit/medical record and vitals.

### POST `/api/clinical/records/:recordId/lab-reports`
Role: lab_technician/admin  
Appends lab report.

### POST `/api/clinical/records/:recordId/diagnosis`
Role: doctor/admin  
Creates diagnosis + prescription, calls ML, stores prediction.

### GET `/api/clinical/doctor/dashboard`
Role: doctor/admin  
Doctor queue/dashboard records.

### GET `/api/clinical/patients/:patientId/history`
Roles: doctor/nurse/lab_technician/government_officer/admin  
Complete patient history by Mongo ID.

### GET `/api/clinical/patients/by-code/:patientCode/history`
Roles: doctor/nurse/lab_technician/government_officer/admin  
Complete patient history by unique patient code.

### GET `/api/clinical/patient/me/history`
Role: patient  
Own records only.

## 11.4 DMO Analytics APIs

### GET `/api/analytics/dmo/disease-burden`
Role: government_officer/admin  
Area-wise disease counts with severity split (`low/moderate/high`).

Example query:
```text
/api/analytics/dmo/disease-burden?district=Hyderabad&fromDate=2026-01-01&toDate=2026-12-31
```

### GET `/api/analytics/dmo/overview`
Role: government_officer/admin  
Dashboard summary series:
- diseaseTotals
- severityTotals
- dailyTrend

## 12. ML API Documentation

Base URL:
```text
http://127.0.0.1:8000
```

### GET `/health`
Service/model health.

### POST `/predict`

Request:
```json
{
  "age": 62,
  "temperature": 101.4,
  "bp": "158/96",
  "lab_results": "wbc:high;troponin:borderline",
  "symptoms": "chest_pain;breathlessness;fatigue"
}
```

Response:
```json
{
  "risk_score": 0.82,
  "severity": "High"
}
```

## 12.1 Dataset Notes (Important)

Current training data:
- File: `ml_service/data/demo_dataset.csv`
- Purpose: development/demo pipeline validation
- Classes used by system: `low`, `moderate`, `high` (legacy `critical` values are normalized to `high`)
- Includes disease column: `disease` (doctor-confirmed disease text used as ML input)

For production-grade accuracy, replace demo data with real anonymized clinical data:
- minimum target: 5,000+ labeled cases
- balanced class distribution across severity classes
- district/season diversity (to avoid regional bias)
- include key labs (platelets, CRP, WBC, etc.) and symptom combinations

Model retraining:
```bash
cd ml_service
python train.py
```

Model outputs generated:
- `ml_service/artifacts/severity_model.joblib`
- `ml_service/artifacts/severity_metrics.json`

## 13. Sample End-to-End Test Sequence

1. Login as receptionist
2. Create patient
3. Login as nurse and create record
4. Login as lab tech and upload lab report
5. Login as doctor and submit diagnosis
6. Login as DMO and fetch analytics

## 13.1 Postman One-Click Collection

Import this file in Postman:
- `postman/Digital-Health-System.postman_collection.json`

Recommended run order inside collection:
1. `0. Health Checks`
2. `1. Auth Logins` (stores tokens automatically)
3. `2. Clinical Workflow` (stores `patientId`, `patientCode`, `recordId` automatically)
4. `3. DMO Analytics`

## 14. Security and Validation

- Password hashing with bcrypt
- JWT-based authentication
- RBAC authorization middleware
- Input validation in schema/service layers
- Error handling middleware
- Inactive account blocking

## 15. Troubleshooting

## Issue: `querySrv ECONNREFUSED` with Atlas
Cause: SRV DNS lookup blocked.  
Fix: use non-SRV `mongodb://...` connection string.

## Issue: `ModuleNotFoundError: No module named 'ml_service'`
Fix applied in code by import fallback.  
Run from `ml_service` folder with venv active.

## Issue: `uvicorn not recognized`
Use:
```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## 16. Team Onboarding Quick Start

1. Clone/download project
2. Create `.env`
3. Run `npm install`
4. Setup Python 3.10 venv in `ml_service`
5. Install ML dependencies
6. Setup frontend (`cd frontend && npm install`)
7. Start backend terminal
8. Start ML terminal
9. Start frontend terminal
10. Run `npm run seed`
11. Test APIs/UI

---

If you need, you can add this README as your internal onboarding SOP and API contract for frontend and QA teams.
