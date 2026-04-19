# Frontend

The frontend is a React 18 SPA built with Vite, living in [`frontend/`](../frontend). It is a single app with role-scoped dashboards that render different pages based on the logged-in user’s role.

## Stack

- React 18 + Vite 5
- `react-router-dom` for routing
- Recharts for charts (severity, week-over-week, trend)
- Leaflet (via `react-leaflet`) for the 33-district Telangana choropleth map
- Plain CSS (scoped per-page)

## Project layout

```
frontend/
├── index.html
├── vite.config.js
├── public/
│   └── data/
│       ├── telanganaDistricts.json       # GeoJSON district boundaries
│       └── telanganaDistrictMeta.json    # population & literacy metadata
└── src/
    ├── main.jsx                # Vite entry
    ├── App.jsx                 # Router + role-based redirects
    ├── context/AuthContext.jsx # auth state, login/logout, token storage
    ├── services/api.js         # axios/fetch wrapper, attaches Bearer token
    ├── constants/locations.js  # district/mandal options
    └── pages/
        ├── LoginPage.jsx
        ├── AdminDashboard.jsx
        ├── ReceptionDashboard.jsx
        ├── NurseDashboard.jsx
        ├── LabDashboard.jsx
        ├── DoctorDashboard.jsx
        ├── DMODashboard.jsx
        └── PatientDashboard.jsx
```

## Auth flow

1. User submits email/password on `LoginPage`.
2. `POST /api/auth/login` returns `{ token, user }`.
3. `AuthContext` stores both in `localStorage` and memory.
4. `services/api.js` attaches `Authorization: Bearer <token>` on every request.
5. `App.jsx` redirects the user to their role’s default dashboard after login.

If the token is rejected (401), the client clears storage and returns to the login page.

## Dashboards

| Page | Role | Purpose |
| --- | --- | --- |
| `LoginPage` | public | email + password + preset demo buttons |
| `AdminDashboard` | `hospital_admin` (+ `dmo` for parts) | user management, approvals |
| `ReceptionDashboard` | `receptionist` | patient search/registration + appointments |
| `NurseDashboard` | `nurse` | queue + vitals form |
| `LabDashboard` | `lab_technician` | queue + CBC upload + file upload |
| `DoctorDashboard` | `doctor` | summary viewer + diagnosis + prescription |
| `DMODashboard` | `dmo` | analytics, alerts, district map |
| `PatientDashboard` | `patient` | own history + latest severity |

## Telangana map data

- `frontend/public/data/telanganaDistricts.json` — GeoJSON with one feature per district. Accepted name properties: `D_NAME`, `D_N`, `DISTRICT`, `district`, `dist_name`, `name`.
- `frontend/public/data/telanganaDistrictMeta.json` — population and literacy metadata used to annotate the choropleth.

If you replace the GeoJSON, keep one of the accepted name properties so the frontend keying still works.

## Environment

`frontend/.env.example` lists the Vite-exposed variables:

```
VITE_API_BASE_URL=http://localhost:4000
```

In dev, `npm run dev` launches Vite on port 5173; the Node API must be reachable at `VITE_API_BASE_URL`.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Build

```bash
cd frontend
npm run build     # outputs to frontend/dist
npm run preview   # preview the production build
```
