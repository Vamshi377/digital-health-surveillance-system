# Documentation — Digital Health Record + ML Disease Surveillance

This folder contains the full technical documentation for the **Digital Health Record and ML Disease Surveillance System** — a full-stack hospital workflow platform with severity prediction and DMO-level district surveillance for Telangana.

For quick setup and demo login information, see the root [`README.md`](../README.md).
For a narrated demo script (viva/presentation), see [`PROJECT_EXPLANATION_SCRIPT.md`](../PROJECT_EXPLANATION_SCRIPT.md).

## Table of contents

| Document | What it covers |
| --- | --- |
| [overview.md](./overview.md) | High-level purpose, users, and value proposition |
| [architecture.md](./architecture.md) | System architecture, services, data flow, diagrams |
| [workflow.md](./workflow.md) | End-to-end clinical workflow (reception → DMO) |
| [roles-and-permissions.md](./roles-and-permissions.md) | Roles, approval hierarchy, RBAC matrix |
| [data-models.md](./data-models.md) | MongoDB collections and schemas |
| [api-reference.md](./api-reference.md) | Complete REST API reference |
| [ml-service.md](./ml-service.md) | FastAPI severity model, features, training, contract |
| [frontend.md](./frontend.md) | React/Vite app structure and dashboards |
| [dmo-dashboard.md](./dmo-dashboard.md) | DMO analytics, map, alerts, demo vs live mode |
| [deployment.md](./deployment.md) | Local run, seeding, environment config, production notes |
| [security.md](./security.md) | Authentication, RBAC, audit logging, validation rules |
| [contributing.md](./contributing.md) | Dev setup, branch/commit conventions, testing tips |
| [glossary.md](./glossary.md) | Domain terms (DMO, RBAC, severity, etc.) |

## Quick links

- Backend API: `http://localhost:4000` (health: `/health`)
- ML service: `http://127.0.0.1:8000` (health: `/health`)
- Frontend: `http://localhost:5173`
- Postman collection: [`postman/Digital-Health-System.postman_collection.json`](../postman/Digital-Health-System.postman_collection.json)
