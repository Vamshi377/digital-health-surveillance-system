# Roles and permissions

The system defines eight roles. Role strings are normalised by [`src/utils/roles.js`](../src/utils/roles.js); the aliases `admin → hospital_admin` and `government_officer → dmo` are accepted on input.

## Roles

| Role | Purpose |
| --- | --- |
| `receptionist` | Register patients, book appointments |
| `nurse` | Record vitals/symptoms for appointments |
| `lab_technician` | Upload lab reports to medical records |
| `doctor` | Review summary, write diagnosis + prescription |
| `medical_superintendent` | Approve clinical staff (doctor/nurse/lab) |
| `hospital_admin` | Manage users, approve receptionists |
| `dmo` | District-level analytics, approve hospital_admin / medical_superintendent |
| `patient` | Read own medical history |

## Approval hierarchy

New staff registrations default to `approvalStatus = "PENDING"` and cannot log in until approved. Approval is performed via `PATCH /api/admin/users/:userId/approval`.

```
              ┌──► doctor
medical_superintendent ──► nurse
              └──► lab_technician

hospital_admin ──► receptionist

dmo ──► medical_superintendent
dmo ──► hospital_admin
dmo  (seeded / pre-created by system)
patient (created by hospital_admin, must link to an existing patientCode)
```

Mapping is defined by `APPROVER_BY_ROLE` in [`src/utils/roles.js`](../src/utils/roles.js).

## RBAC matrix (active routes)

Generated from [`src/routes/*.js`](../src/routes/). “H.admin” = `hospital_admin`.

### Auth (`/api/auth`)
| Endpoint | Allowed roles |
| --- | --- |
| `POST /register` | public |
| `POST /login` | public |
| `GET /me` | any authenticated |

### Admin (`/api/admin`) — all require auth
| Endpoint | Allowed roles |
| --- | --- |
| `GET /users` | hospital_admin, medical_superintendent, dmo |
| `PATCH /users/:userId/approval` | hospital_admin, medical_superintendent, dmo |
| `POST /users` | hospital_admin, dmo |
| `PATCH /users/:userId/role` | hospital_admin, dmo |
| `PATCH /users/:userId/status` | hospital_admin, dmo |

### Clinical (`/api/clinical`)
| Endpoint | Allowed roles |
| --- | --- |
| `GET /patients/search` | receptionist, hospital_admin |
| `POST /patients` | receptionist, hospital_admin |
| `POST /patients/:patientId/appointments` | receptionist, hospital_admin |
| `GET /nurse/queue` | nurse, hospital_admin |
| `POST /appointments/:appointmentId/records` | nurse, hospital_admin |
| `GET /lab/queue` | lab_technician, hospital_admin |
| `POST /records/:recordId/lab-reports` | lab_technician, hospital_admin |
| `POST /records/:recordId/diagnosis` | doctor, hospital_admin |
| `GET /doctor/dashboard` | doctor, hospital_admin |
| `GET /records/:recordId/summary` | doctor, hospital_admin |
| `GET /patients/:patientId/history` | doctor, nurse, lab_technician, dmo, hospital_admin |
| `GET /patients/by-code/:patientCode/history` | doctor, nurse, lab_technician, dmo, hospital_admin |
| `GET /patient/me/history` | patient |

### Analytics (`/api/analytics`)
| Endpoint | Allowed roles |
| --- | --- |
| `GET /dmo/overview` | dmo, hospital_admin |
| `GET /dmo/disease-burden` | dmo, hospital_admin |
| `GET /dmo/patient-cluster` | dmo, hospital_admin |

## Enforcement

- Frontend guards routes by role using the auth context.
- Backend enforces on every request via `authenticate` + `authorize(...roles)` middlewares. Even if a user edits the URL, the API will reject the call with `401`/`403`.
- Inactive users (`isActive = false`) and non-approved users (`approvalStatus !== "APPROVED"`) cannot obtain tokens.
