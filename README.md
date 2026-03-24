# Digital Health Record + ML Disease Surveillance

Full-stack hospital workflow platform with severity prediction and DMO district surveillance for Telangana.

## Stack
- Backend: Node.js, Express, MongoDB (Mongoose), JWT, RBAC
- ML service: Python FastAPI + XGBoost
- Frontend: React + Vite + Recharts + Leaflet

## Services
- Node API: `http://localhost:4000`
- ML API: `http://127.0.0.1:8000`
- Frontend: `http://localhost:5173`

## Core Workflow
1. Reception registers patient (duplicate phone prevention, unique `patientCode`).
2. Reception creates appointment.
3. Nurse records vitals/symptoms once per appointment.
4. Lab uploads report values + optional file.
5. Doctor opens unified patient summary, adds diagnosis + prescription table.
6. Node calls ML service for severity prediction.
7. DMO dashboard updates with district and severity analytics.

## Roles
- `admin`
- `receptionist`
- `nurse`
- `lab_technician`
- `doctor`
- `government_officer` (DMO)
- `patient`

## Security
- bcrypt password hashing
- JWT authentication
- RBAC route guards
- schema/service validation
- centralized error handling
- audit logging (`AuditLog`) for key create/view actions

## Project Structure
```text
src/
  controllers/
  routes/
  models/
  middlewares/
  services/
  utils/
  config/
ml_service/
frontend/
```

## Setup
### 1) Backend deps
```bash
npm install
```

### 2) Frontend deps
```bash
cd frontend
npm install
cd ..
```

### 3) ML deps
```bash
cd ml_service
py -3.10 -m venv .venv
.\.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cd ..
```

## Environment
Create root `.env` (example):
```env
PORT=4000
MONGO_URI=<your_mongo_uri>
JWT_SECRET=<strong_secret>
JWT_EXPIRES_IN=8h
ML_SERVICE_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173
```

## Run (3 terminals)
### Terminal A - Backend
```bash
npm run dev
```

### Terminal B - ML
```bash
cd ml_service
.\.venv\Scripts\activate
python train.py
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal C - Frontend
```bash
cd frontend
npm run dev
```

## Health Checks
- Backend: `GET http://localhost:4000/health`
- ML: `GET http://127.0.0.1:8000/health`

## Seed Data
### Base users + basic records
```bash
npm run seed
```

### Extra DMO mock records for analytics demos
```bash
npm run seed:dmo-mock
```
This script now seeds patients/predictions across all Telangana districts from:
`frontend/public/data/telanganaDistricts.json`

## Key API Endpoints
### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Clinical
- `GET /api/clinical/patients/search-by-phone?phone=...` (reception/admin)
- `POST /api/clinical/patients` (reception/admin)
- `POST /api/clinical/patients/:patientId/appointments` (reception/admin)
- `GET /api/clinical/nurse/queue` (nurse/admin)
- `POST /api/clinical/appointments/:appointmentId/records` (nurse/admin)
- `POST /api/clinical/records/:recordId/lab-reports` (lab/admin, multipart `reportImage` optional)
- `GET /api/clinical/doctor/dashboard` (doctor/admin)
- `GET /api/clinical/records/:recordId/summary` (doctor/admin)
- `POST /api/clinical/records/:recordId/diagnosis` (doctor/admin)
- `GET /api/clinical/patients/:patientId/history`
- `GET /api/clinical/patients/by-code/:patientCode/history`
- `GET /api/clinical/patient/me/history` (patient)

### DMO Analytics
- `GET /api/analytics/dmo/disease-burden`
- `GET /api/analytics/dmo/overview`
- `GET /api/analytics/dmo/patient-cluster?district=&area=&disease=&fromDate=&toDate=`

## DMO Dashboard Features
- Real-time auto refresh controls
- Outbreak alert rules
- Week-over-week trend
- Hotspot ranking
- District burden table
- Telangana district choropleth (33 districts)
- District hover tooltip and click popup: Active + low/moderate/high + priority
- District click summary panel below map (updates on each district click)
- Patient cluster modal for field action
- No circle/radius overlays; district-boundary mapping only
- Telangana-themed map background for readability behind district polygons

## Telangana District Map Data
Runtime files used by frontend:
- `frontend/public/data/telanganaDistricts.json` (GeoJSON boundaries)
- `frontend/public/data/telanganaDistrictMeta.json` (population/literacy metadata)

If replacing map data, keep GeoJSON district property as one of:
- `D_NAME`, `D_N`, `DISTRICT`, `district`, `dist_name`, `name`

## Notes
- ML prediction triggers after doctor diagnosis only.
- `MedicalRecord` is one-per-appointment (prevents duplicate nursing records).
- Lab reports store abnormal markers and critical flags.
- DMO view supports both live DB mode and demo mode.
- If only one district shows data in Live mode, reseed demo analytics:
  1. `npm run seed:dmo-mock`
  2. refresh DMO dashboard
