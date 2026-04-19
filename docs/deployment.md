# Deployment & local run

## Prerequisites

- Node.js 18+ (for both backend and frontend).
- Python 3.10+ for the ML service.
- MongoDB 6+ (local or Atlas).

## 1. Clone & install

```bash
git clone https://github.com/Vamshi377/digital-health-surveillance-system.git
cd digital-health-surveillance-system

# Backend
npm install

# Frontend
cd frontend && npm install && cd ..

# ML service
cd ml_service
python3 -m venv .venv
source .venv/bin/activate          # Windows: .\.venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..
```

## 2. Environment variables

Create a root `.env` (copy from [`.env.example`](../.env.example)):

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/digital_health_records
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=8h
ML_SERVICE_URL=http://127.0.0.1:8000
ML_SERVICE_API_KEY=
FRONTEND_URL=http://localhost:5173
```

Frontend — copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

## 3. Seed demo data

The login page demo buttons only work **after** seeding.

```bash
# Base users + a handful of clinical records
npm run seed

# Extra DMO analytics rows across all Telangana districts
npm run seed:dmo-mock

# Optional role-specific mock data
npm run seed:reception-mock
npm run seed:nurse-mock
npm run seed:doctor-mock
```

Demo accounts (created by `npm run seed`):

| Role | Email | Password |
| --- | --- | --- |
| hospital_admin | hospitaladmin@health.local | HospitalAdmin@123 |
| receptionist | reception@health.local | Reception@123 |
| nurse | nurse@health.local | Nurse@123 |
| lab_technician | lab@health.local | Lab@123 |
| doctor | doctor@health.local | Doctor@123 |
| medical_superintendent | ms@health.local | Superintendent@123 |
| dmo | dmo@health.local | Dmo@123 |
| patient | patient@health.local | Patient@123 |

## 4. Run (three terminals)

```bash
# Terminal A — Backend
npm run dev

# Terminal B — ML service
cd ml_service
source .venv/bin/activate
python train.py          # first run only; artefacts cached in ml_service/artifacts
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# Terminal C — Frontend
cd frontend
npm run dev
```

Then open http://localhost:5173.

## 5. Health checks

- Backend: `GET http://localhost:4000/health` → `{"status":"ok"}`
- ML: `GET http://127.0.0.1:8000/health` → model + metrics

## Troubleshooting

**Login fails on a fresh clone**
1. `.env` missing or `MONGO_URI` unreachable.
2. `npm run seed` was not run — demo users don’t exist.
3. Account was created but `approvalStatus !== "APPROVED"` — you will see “Your account is under verification”.

**“Unable to reach ML service”**
- ML service is not running on `ML_SERVICE_URL`, or blocked by firewall.
- The Node side has an 8-second timeout; on very slow machines, pre-warm by hitting `GET /health` first.

**DMO dashboard shows only one district in Live mode**
Run `npm run seed:dmo-mock` and refresh.

## Production notes

This repo is optimised for local development and demos. For production:

- Put the Node API and ML service behind a reverse proxy (nginx / caddy).
- Use a managed MongoDB cluster; replace `MONGO_URI` with the connection string and set `tls=true`.
- Serve the Vite build (`frontend/dist`) as static assets from the reverse proxy or a CDN.
- Set a strong `JWT_SECRET` and a short `JWT_EXPIRES_IN` (e.g. `2h`), and consider a refresh-token flow.
- Set `ML_SERVICE_API_KEY` and forward it as `x-api-key` to the ML service (the Node side already does this when configured).
- Move file uploads from local disk (`/uploads`) to object storage (S3/GCS) and update `LabReport.reportImageUrl` accordingly.
- Add structured logging + metrics (e.g. pino + OpenTelemetry).
