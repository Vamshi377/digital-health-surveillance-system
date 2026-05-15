# Digital Health Record and Disease Surveillance System

This project combines hospital workflow automation, machine learning-based severity prediction, and district-level public health monitoring in one platform. It supports patient handling from reception to diagnosis, then turns confirmed clinical outcomes into analytics that can be viewed by a District Medical Officer (DMO).

## What the system does

- Registers patients and creates appointments at the reception desk.
- Captures symptoms and vitals through the nursing workflow.
- Records lab observations, abnormal markers, and optional report files.
- Lets doctors review a unified patient summary, add diagnosis details, and issue prescriptions.
- Sends structured clinical data to a FastAPI service for severity prediction.
- Aggregates confirmed cases and predictions into DMO dashboards for district surveillance in Telangana.

## Technology stack

- Backend: Node.js, Express, MongoDB, Mongoose, JWT, role-based access control
- Frontend: React, Vite, Axios, Recharts
- Mapping and analytics UI: Leaflet-compatible Telangana district data and dashboard visualizations
- ML service: Python, FastAPI, scikit-learn, XGBoost, joblib

## Main modules

### Clinical workflow

The clinical side of the project follows a staged hospital flow:

1. Receptionist registers or searches for a patient.
2. Receptionist creates an appointment.
3. Nurse records symptoms, vitals, and notes.
4. Lab technician adds test values and uploads supporting files if needed.
5. Doctor reviews the full case summary, confirms the disease, and submits treatment.
6. The backend calls the ML service and stores the predicted severity and risk score.

### Surveillance workflow

Once a diagnosis is completed, the case contributes to the DMO analytics layer. District and area metadata help the platform estimate disease burden, severity mix, hotspots, and trend signals across Telangana.

## User roles

- `receptionist`
- `nurse`
- `lab_technician`
- `doctor`
- `medical_superintendent`
- `hospital_admin`
- `dmo`
- `patient`

Each role is restricted to its own dashboard and API permissions.

## Security and validation highlights

- Passwords are hashed with `bcryptjs`.
- JWT tokens are used for authenticated API access.
- Route protection is enforced with role-based access control.
- New staff accounts can go through an approval workflow using `PENDING`, `APPROVED`, and `REJECTED`.
- Duplicate patient registration by phone is prevented.
- One medical record is allowed per appointment.
- Validation is applied to vitals, uploaded reports, and core workflow transitions.
- Audit logging is available for important actions.

## Repository structure

```text
src/                         Node.js backend
digital-health-frontend/     React frontend
ml_service/                  FastAPI severity prediction service
uploads/                     Uploaded lab files
IMPLEMENTATION_RESULTS_DATA.md
PROJECT_EXPLANATION_SCRIPT.md
```

## Services and default local URLs

- Backend API: `http://localhost:4000`
- ML API: `http://127.0.0.1:8000`
- Frontend: `http://localhost:5173`

## Setup

### 1. Install backend dependencies

```bash
npm install
```

### 2. Install frontend dependencies

```bash
npm run frontend:install
```

### 3. Install ML service dependencies

```bash
cd ml_service
py -3.10 -m venv .venv
.\.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cd ..
```

## Environment configuration

Create a root `.env` file. A working example is shown below:

```env
PORT=4000
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=8h
MONGO_URI=mongodb://127.0.0.1:27017/digital_health_records
ML_SERVICE_URL=http://127.0.0.1:8000
ML_SERVICE_API_KEY=
FRONTEND_URL=http://localhost:5173
```

The frontend also includes its own `.env.example` inside `digital-health-frontend/` if you need to override the API base URL for Vite.

## Running the project

Open three terminals.

### Terminal 1: backend

```bash
npm run dev
```

### Terminal 2: ML service

```bash
cd ml_service
.\.venv\Scripts\activate
python app.py
```

### Terminal 3: frontend

```bash
npm run frontend:dev
```

## Health checks

- Backend: `GET http://localhost:4000/health`
- ML service: `GET http://127.0.0.1:8000/health`

## Seed data and demo usage

### Base seed

```bash
npm run seed
```

This step is required if you want the preset login accounts to work. On a fresh clone, login will fail until MongoDB is connected and the seed script has created the demo users.

### Demo accounts

- `hospitaladmin@health.local` / `HospitalAdmin@123`
- `reception@health.local` / `Reception@123`
- `nurse@health.local` / `Nurse@123`
- `lab@health.local` / `Lab@123`
- `doctor@health.local` / `Doctor@123`
- `ms@health.local` / `Superintendent@123`
- `dmo@health.local` / `Dmo@123`
- `patient@health.local` / `Patient@123`

### Extra analytics demo data

```bash
npm run seed:dmo-mock
```

This adds mock prediction records across Telangana districts using the district map data in `digital-health-frontend/public/data/`.

Additional helper scripts are also available:

- `npm run seed:reception-mock`
- `npm run seed:nurse-mock`
- `npm run seed:doctor-mock`

## Approval workflow

The project includes role-specific account approval rules:

- `doctor`, `nurse`, and `lab_technician` are approved by `medical_superintendent`
- `receptionist` is approved by `hospital_admin`
- `medical_superintendent` and `hospital_admin` are approved by `dmo`
- `dmo` can be pre-created by the system or seed data

Users who are pending or rejected should not be able to use the platform normally.

## Key API areas

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `PATCH /api/admin/users/:userId/approval`

### Clinical workflow

- `GET /api/clinical/patients/search?phone=...`
- `POST /api/clinical/patients`
- `POST /api/clinical/patients/:patientId/appointments`
- `GET /api/clinical/nurse/queue`
- `POST /api/clinical/appointments/:appointmentId/records`
- `POST /api/clinical/records/:recordId/lab-reports`
- `GET /api/clinical/doctor/dashboard`
- `GET /api/clinical/records/:recordId/summary`
- `POST /api/clinical/records/:recordId/diagnosis`
- `GET /api/clinical/patients/:patientId/history`
- `GET /api/clinical/patients/by-code/:patientCode/history`
- `GET /api/clinical/patient/me/history`

### DMO analytics

- `GET /api/analytics/dmo/disease-burden`
- `GET /api/analytics/dmo/overview`
- `GET /api/analytics/dmo/patient-cluster?district=&area=&disease=&fromDate=&toDate=`

## Frontend notes

The React application lives in `digital-health-frontend/`. It includes role-based dashboards for login, reception, nursing, lab, doctor, patient, admin, and DMO use cases. API calls are centralized in `digital-health-frontend/src/services/api.js`, which makes backend integration easier to maintain.

If the backend is unavailable, some screens may still render fallback or mock data to keep the UI demonstrable.

## ML service summary

The ML service is stored in `ml_service/` and predicts severity using structured clinical inputs. It also contains scripts for training, comparing models, and generating evaluation artifacts.

### Core ML files

- `ml_service/app.py`: FastAPI prediction service
- `ml_service/train.py`: training script for the deployed model
- `ml_service/compare_severity_models.py`: side-by-side evaluation
- `ml_service/visualize_severity_results.py`: artifact generation for charts and summaries
- `ml_service/data/severity_dataset.csv`: severity dataset
- `ml_service/artifacts/`: saved models and metrics

### ML input fields

- `age`
- `temperature`
- `bp`
- `lab_results`
- `symptoms`
- `disease_name`

### ML output

- `severity`
- `risk_score`

### Run model training

```bash
cd ml_service
.\.venv\Scripts\activate
python train.py
```

### Compare algorithms

```bash
cd ml_service
.\.venv\Scripts\activate
python compare_severity_models.py
```

### Generate evaluation visuals

```bash
cd ml_service
.\.venv\Scripts\activate
python visualize_severity_results.py
```

### Prediction endpoint

`POST /predict`

Example request:

```json
{
  "age": 62,
  "temperature": 101.4,
  "bp": "158/96",
  "lab_results": "wbc:high;troponin:borderline",
  "symptoms": "chest_pain;breathlessness;fatigue",
  "disease_name": "dengue"
}
```

Example response:

```json
{
  "risk_score": 0.82,
  "severity": "High"
}
```

## DMO dashboard features

- District-level disease burden view
- Severity distribution summaries
- Hotspot ranking
- Week-over-week trend tracking
- Outbreak alert indicators
- Telangana district map interactions
- Patient cluster drill-down for field review
- Demo mode and live mode support

Map assets are loaded from:

- `digital-health-frontend/public/data/telanganaDistricts.json`
- `digital-health-frontend/public/data/telanganaDistrictMeta.json`

If you replace the GeoJSON, keep district naming fields compatible with the frontend parser.

## Troubleshooting

### Login fails on a fresh clone

1. Make sure the root `.env` exists and contains a valid `MONGO_URI`.
2. Confirm MongoDB is running or your Atlas connection string is correct.
3. Run `npm install`.
4. Run `npm run frontend:install`.
5. Run `npm run seed`.
6. Start the backend with `npm run dev`.
7. Start the ML service if you want severity prediction.
8. Start the frontend with `npm run frontend:dev`.

### DMO dashboard looks empty in live mode

If your real database has too few diagnosed cases, seed analytics data again:

```bash
npm run seed:dmo-mock
```

Then refresh the DMO dashboard.

### Prediction is not appearing

- Check that the ML service is running.
- Verify `ML_SERVICE_URL` in the root `.env`.
- Confirm the doctor diagnosis step completed successfully.

## Supporting documentation

These files are still useful for reports, demos, and viva preparation:

- `IMPLEMENTATION_RESULTS_DATA.md` for model evaluation and screenshot notes
- `PROJECT_EXPLANATION_SCRIPT.md` for a spoken project walkthrough
- `ml_service/README.md` for ML-specific quick reference
- `digital-health-frontend/README.md` for frontend-specific notes

## Project summary

This repository is designed as more than a standard hospital record app. It connects operational healthcare tasks with severity-aware analytics so that a diagnosed patient case can contribute both to treatment workflow and to district-level surveillance insights.
