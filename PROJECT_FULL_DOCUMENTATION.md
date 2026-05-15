# Digital Health Surveillance System - Full Project Documentation

## Project Title

**Digital Health Record and Disease Surveillance System**

## Project Summary

This project is a full-stack healthcare application that combines hospital workflow management with district-level disease surveillance.

The system begins with patient registration and appointment creation. It then moves through nurse vitals, lab report upload, doctor diagnosis, prescription, machine learning severity prediction, optional Gemini diet guidance, and finally DMO analytics.

The important idea is that the same patient data used for treatment is also used for public health monitoring.

## Main Objectives

- Digitize patient registration and hospital workflow.
- Maintain structured medical records for each visit.
- Support role-wise dashboards for hospital users.
- Predict disease severity using ML after doctor diagnosis.
- Provide patient self-view through patient dashboard.
- Help DMO monitor district disease burden and outbreak alerts.
- Show Telangana district severity map using live prediction data.
- Export disease burden data for reporting.

## Technology Stack

### Frontend

- React
- Vite
- Axios
- React Router
- Recharts
- Framer Motion
- Lucide React icons
- GeoJSON + SVG map rendering

React is used because the project has many dashboards, forms, protected routes, charts, modals, and reusable UI components. Vite is used because it gives fast development and simple frontend build.

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Multer

Express is used for REST APIs. MongoDB is used because healthcare data contains nested objects such as vitals, lab values, prescription medicines, prediction features, and audit details. Mongoose gives schema validation and relationship-style references between collections.

### ML Service

- Python
- FastAPI
- scikit-learn
- XGBoost
- NumPy
- joblib

FastAPI exposes `/health` and `/predict`. The trained model is loaded from saved artifacts. The backend calls this service after doctor diagnosis.

### AI Diet Plan

- Gemini API

Gemini is optional. It is used only to generate supportive diet guidance after diagnosis. The core system does not depend on Gemini.

## Folder Structure

```text
src/                         Node.js backend
digital-health-frontend/     React frontend
ml_service/                  Python FastAPI ML service
uploads/                     Uploaded lab report files
postman/                     API testing collections if used
PROJECT_EXPLANATION_SCRIPT.md
PROJECT_FULL_DOCUMENTATION.md
PROJECT_REVIEW_QA.md
```

## User Roles

### Hospital Admin

Hospital Admin manages users and access.

Main functions:

- View users.
- Create staff users.
- Approve or reject accounts.
- Activate or suspend users.
- Access selected operational dashboards when allowed.

### Medical Superintendent

Medical Superintendent is a management role. In this project it shares admin-level supervision access for hospital management.

### Receptionist

Receptionist starts the patient journey.

Main functions:

- Search patient by phone.
- Register new patient.
- Create appointment.
- Send patient to nurse queue.

Reception captures demographic and location data, which later helps DMO analytics.

### Nurse

Nurse records clinical observations.

Main functions:

- View nurse queue.
- Record symptoms.
- Record temperature, blood pressure, pulse, SpO2, respiratory rate.
- Add nurse notes.
- Create one medical record per appointment.

Vitals are important because they become part of ML input.

### Lab Technician

Lab technician uploads lab evidence.

Main functions:

- View lab queue.
- Enter test name.
- Enter lab values.
- Upload optional lab report file.
- Store report summary.

Lab values are used by the doctor and ML service.

### Doctor

Doctor completes the clinical decision.

Main functions:

- View patient summary.
- Review vitals and lab reports.
- Review previous diagnosis history.
- Submit disease diagnosis.
- Add diagnosis notes.
- Add prescription medicines.
- Set doctor severity.
- Schedule follow-up date.

When doctor submits diagnosis, the backend triggers ML severity prediction.

### DMO

DMO stands for District Medical Officer.

Main functions:

- Monitor live disease burden.
- View district map.
- Track high severity percentage.
- View pressure score.
- Monitor outbreak alerts.
- Filter data by date, district, mandal, and threshold.
- Export CSV.

DMO dashboard is based on prediction records generated after doctor diagnosis.

### Patient

Patient can access only their own health data.

Main functions:

- Sign up as patient.
- Login using mobile number.
- View own visits.
- View diagnoses.
- View prescriptions.
- View ML severity.
- View diet plan if generated.
- Use simple patient chatbot.

Patient role does not use staff approval. It uses the patient profile.

## Authentication

Staff login uses:

- email
- password
- selected role

Patient login uses:

- mobile number
- selected Patient role

Passwords are hashed using bcrypt. JWT is generated after successful login. The frontend stores token and user data in localStorage and sends the token with API requests.

## Role-Based Access Implementation

Role-based access is implemented in two layers.

Frontend:

- `ProtectedRoute` checks whether logged-in user role is allowed.
- Routes like `/doctor`, `/dmo`, `/patient`, `/admin` are protected.

Backend:

- `authenticate` middleware verifies JWT.
- `authorize` middleware checks allowed roles for each route.

This prevents unauthorized API access even if a user manually changes the browser URL.

## Patient Code

Each patient receives a unique code such as:

```text
PAT-JGT-MAP-001
```

Purpose of patient code:

- permanent patient identity
- links appointments, records, diagnoses, predictions, prescriptions
- useful when staff search patient history
- avoids confusion when names are repeated

Patient code is generated automatically and is unique.

## Database Collections

### User

Stores staff login accounts and approval status.

Important fields:

- fullName
- email
- passwordHash
- phoneNumber
- role
- approvalStatus
- patientId
- isActive

### Patient

Stores patient demographic and location data.

Important fields:

- patientCode
- fullName
- dateOfBirth
- age
- gender
- district
- mandal
- village
- ward
- area
- contactNumber
- aadharNumber

### Appointment

Stores scheduled visit.

Important fields:

- patient
- scheduledAt
- visitDate
- reason
- status

### MedicalRecord

Stores nurse-entered clinical data.

Important fields:

- symptoms
- vitals
- chiefComplaint
- nurseNotes
- status
- vitalsAlertLevel

### LabReport

Stores lab details and uploaded report information.

Important fields:

- testName
- values
- summary
- abnormalMarkers
- isCritical
- reportImageUrl

### Diagnosis

Stores doctor diagnosis.

Important fields:

- patient
- medicalRecord
- diagnosedBy
- diseaseName
- diagnosisNotes
- doctorSeverity

### Prescription

Stores medicines and advice.

Important fields:

- diagnosis
- medicines
- generalAdvice
- followUpDate

### Prediction

Stores ML output.

Important fields:

- diagnosis
- diseaseName
- probability
- predictedSeverity
- modelSource
- features

### DietPlan

Stores Gemini-generated diet guidance when available.

### Notification

Stores patient notifications such as lab upload or follow-up.

### AuditLog

Stores important user actions for traceability.

## ML Implementation

The ML service runs separately from the backend.

Backend sends:

- age
- temperature
- blood pressure
- lab results
- symptoms
- disease name

ML service returns:

- risk score
- severity

Severity labels:

- low
- moderate
- high

## Why XGBoost

The input data is structured tabular clinical data. XGBoost is suitable because:

- it works well on tabular data
- it handles non-linear relationships
- it can combine signals from symptoms, vitals, lab values, and disease name
- it usually performs better than a simple linear model for mixed structured features
- it is lightweight enough for a mini project demo

The project also includes model comparison scripts, but XGBoost is used as the main deployed model because it is strong for structured classification.

## ML Trigger Flow

1. Doctor submits diagnosis.
2. Backend creates diagnosis.
3. Backend creates prescription.
4. Backend builds ML input.
5. Backend calls FastAPI `/predict`.
6. ML returns severity and risk score.
7. Backend stores prediction.
8. DMO dashboard uses stored prediction.

If ML is unavailable, diagnosis still succeeds and fallback severity is stored. This prevents doctor workflow failure.

## Gemini Diet Plan

Gemini API is used after diagnosis to generate supportive diet guidance.

It uses:

- patient profile
- diagnosis
- severity
- lab report
- prescription

It does not replace doctor advice. If Gemini key is invalid or missing, only diet plan generation fails. Diagnosis, ML prediction, and DMO dashboard continue.

## DMO Dashboard Details

### Data Mode

Live mode uses real prediction records from MongoDB.

### Date Filters

From Date and To Date filter predictions by `createdAt`.

### Alert Threshold

The number field, for example `5`, is the outbreak threshold.

If a mandal/disease group reaches 5 or more cases in the selected date range, it appears as an outbreak alert.

### Refresh

Fetches current analytics from backend.

### Export CSV

Downloads disease burden data.

### Auto Refresh

Automatically reloads DMO analytics every 30 seconds when enabled.

## DMO Metrics

### Total Cases

Total number of prediction records in the selected filter window.

### High Severity Percentage

Formula:

```text
high severity cases / total cases x 100
```

### Pressure Score

Pressure score is a weighted seriousness score.

Formula:

```text
low x 1 + moderate x 2 + high x 3
```

Meaning:

- low cases add less pressure
- moderate cases add medium pressure
- high cases add more pressure

This helps the DMO understand workload seriousness, not just total count.

### Active Alerts

Number of disease/mandal groups crossing the selected threshold.

### Cases Trend

Shows day-wise case count in selected date range.

### Severity Split

Pie chart showing low, moderate, and high distribution.

### Top Diseases

Ranks diseases by number of cases.

### Week-over-Week

Compares current filter period with previous period.

## Telangana Map Implementation

The map is implemented using a Telangana district GeoJSON file.

Implementation steps:

1. Load `telanganaDistricts.json`.
2. Read each district polygon or multipolygon.
3. Calculate map bounds from longitude and latitude.
4. Project coordinates into SVG coordinate space.
5. Build SVG path strings.
6. Match district name with backend disease burden data.
7. Calculate dominant severity.
8. Apply color.

Colors:

- green = low dominant severity
- yellow = moderate dominant severity
- red = high dominant severity
- gray = no data

The map file had spelling `Jagitial`, while database uses `Jagtial`. The frontend normalizes both names to match correctly.

## Jagtial Demo Data

Jagtial cases were seeded across multiple mandals.

Example seeded patient:

```text
Name: Vamshi Krishna
Mobile: 9177324853
Aadhar: 123456789789
Date of birth: 16-07-2004
District: Jagtial
```

Patient login:

```text
Role: Patient
Mobile: 9177324853
```

## Main API Groups

Authentication:

- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/patient/register`
- `/api/auth/me`

Clinical:

- patient search
- patient registration
- appointment creation
- nurse queue
- medical record creation
- lab queue
- lab report upload
- diagnosis submission
- patient history

Analytics:

- DMO overview
- disease burden
- patient cluster
- alerts
- CSV export

Admin:

- user management
- approval
- active/inactive status
- audit logs

## Security Features

- JWT authentication
- bcrypt password hashing
- role-based API authorization
- protected frontend routes
- approval workflow for staff
- patient can view only own records
- audit logging
- validation for required fields
- unique patient code
- unique phone and Aadhar checks

## Why This Project Is Useful

For hospital staff:

- organized workflow
- less duplicate data
- faster patient summary
- structured diagnosis and prescription

For patients:

- self access to records
- diagnosis and prescription transparency

For DMO:

- disease burden visibility
- high severity tracking
- outbreak threshold alerts
- district map
- CSV reporting

## How To Run

Backend:

```powershell
cd "C:\Users\vamsh\OneDrive\Desktop\MINI Project"
npm run dev
```

Frontend:

```powershell
cd "C:\Users\vamsh\OneDrive\Desktop\MINI Project"
npm run frontend:dev
```

ML service:

```powershell
cd "C:\Users\vamsh\OneDrive\Desktop\MINI Project\ml_service"
.\.venv\Scripts\activate
python app.py
```

Seed Jagtial map cases:

```powershell
npm run seed:jagtial-map
```

Cleanup non-Jagtial analytics:

```powershell
npm run cleanup:non-jagtial
```

## Final Summary

This project demonstrates a complete healthcare pipeline:

```text
Reception -> Nurse -> Lab -> Doctor -> ML Prediction -> Patient Dashboard -> DMO Surveillance
```

It combines full-stack development, role-based access, MongoDB design, machine learning integration, optional Gemini AI, and Telangana map-based disease analytics.
