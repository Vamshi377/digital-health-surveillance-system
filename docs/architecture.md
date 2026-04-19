# Architecture

The platform is composed of three independently runnable services and a shared MongoDB database.

```
┌──────────────────────────┐         ┌──────────────────────────┐
│   Frontend (React+Vite)  │◀──HTTP──▶│   Node API (Express)    │
│   localhost:5173         │  JSON   │   localhost:4000         │
└──────────────────────────┘         │   /api/*  /health        │
                                     └────────────┬─────────────┘
                                                  │
                           ┌──────────────────────┼──────────────────────┐
                           │                      │                      │
                           ▼                      ▼                      ▼
                    ┌──────────────┐     ┌──────────────┐        ┌──────────────┐
                    │   MongoDB    │     │ ML Service    │        │  Filesystem  │
                    │ (Mongoose)   │     │ FastAPI 8000  │        │  /uploads    │
                    └──────────────┘     └──────────────┘        └──────────────┘
```

## Services

### 1. Node API (`src/`)
- Express 4 app bootstrapped in [`src/app.js`](../src/app.js) and started by [`src/index.js`](../src/index.js).
- Connects to MongoDB via [`src/config/database.js`](../src/config/database.js).
- Environment variables loaded via [`src/config/env.js`](../src/config/env.js) (see [`.env.example`](../.env.example)).
- Exposes:
  - `GET /health` — liveness probe.
  - `/api/auth/*` — login/register/me.
  - `/api/admin/*` — user CRUD + approval review.
  - `/api/clinical/*` — the full clinical workflow.
  - `/api/analytics/*` — DMO analytics.
  - `/api/protected/*` — smoke-test for role-guarded routes.
- Static files under `/uploads` (lab report images).

### 2. ML service (`ml_service/`)
- FastAPI app ([`ml_service/app.py`](../ml_service/app.py)) serving `POST /predict` and `GET /health`.
- Trained on [`ml_service/data/demo_dataset.csv`](../ml_service/data/demo_dataset.csv) via [`ml_service/train.py`](../ml_service/train.py).
- Model artefact at `ml_service/artifacts/severity_model.joblib`, metrics at `ml_service/artifacts/severity_metrics.json`.
- Called from the Node API through [`src/services/mlService.js`](../src/services/mlService.js) with an 8s timeout, and optional `x-api-key` header if `ML_SERVICE_API_KEY` is set.
- Detailed contract in [ml-service.md](./ml-service.md).

### 3. Frontend (`frontend/`)
- React 18 + Vite SPA.
- Context-based auth in [`frontend/src/context/AuthContext.jsx`](../frontend/src/context/AuthContext.jsx) — token stored in `localStorage`.
- Role-scoped dashboards in `frontend/src/pages/` (Reception, Nurse, Lab, Doctor, DMO, Patient, Admin).
- Recharts for charts; Leaflet for the 33-district Telangana map (data in `frontend/public/data/`).
- See [frontend.md](./frontend.md) and [dmo-dashboard.md](./dmo-dashboard.md).

## Request lifecycle

1. Client calls an API endpoint with `Authorization: Bearer <jwt>`.
2. `authenticate` middleware ([`src/middlewares/auth.js`](../src/middlewares/auth.js)) validates JWT and loads `req.user`.
3. `authorize(...roles)` middleware ([`src/middlewares/rbac.js`](../src/middlewares/rbac.js)) gates by role.
4. Controller (`src/controllers/*`) validates the request and delegates to a service (`src/services/*`).
5. Service performs Mongo operations, calls the ML service when needed, and writes audit log entries via [`src/services/auditService.js`](../src/services/auditService.js).
6. Errors bubble up to the centralised handler [`src/middlewares/errorHandler.js`](../src/middlewares/errorHandler.js).

## Data flow — doctor submits diagnosis

```
Doctor POST /api/clinical/records/:recordId/diagnosis
        │
        ▼
 clinicalService.diagnosePatient
  ├─ load MedicalRecord + LabReport + Patient
  ├─ persist Diagnosis (+ Prescription)
  ├─ build ML payload (age, temperature, bp, lab_results, symptoms, disease_name)
  ├─ POST  ML service  /predict    ──► risk_score, severity
  ├─ persist Prediction linked to Diagnosis + Patient
  ├─ set Appointment.status = "diagnosed"
  └─ audit log entry
```

Those stored `Prediction` documents are what the DMO dashboard aggregates by district/area to compute burden, hotspots, and outbreak alerts.

## Folder layout

```
digital-health-surveillance-system/
├── src/                     # Node API
│   ├── app.js               # Express app & route wiring
│   ├── index.js             # Boot entrypoint
│   ├── config/              # env & database connection
│   ├── controllers/         # HTTP handlers
│   ├── middlewares/         # auth, rbac, upload, errors
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routers
│   ├── services/            # business logic, mlService, auditService
│   ├── scripts/             # seed scripts (demo, DMO mock, etc.)
│   └── utils/               # roles, httpError
├── ml_service/              # FastAPI + XGBoost severity model
├── frontend/                # React + Vite SPA
├── postman/                 # Postman collection
├── docs/                    # You are here
└── README.md
```

## Legacy / transitional code

`src/routes/patientRoutes.js`, `src/routes/govRoutes.js`, `src/middleware/*` (note the non-plural directory name), and `src/db.js` appear to be an earlier SQLite-based prototype. They are **not** wired into `app.js` and can be treated as reference-only. The active code uses MongoDB via Mongoose.
