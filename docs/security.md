# Security

## Authentication

- Passwords are hashed with **bcrypt** (12 rounds) — `User.passwordHash` is `select: false`, so it is never returned by default.
- JWT tokens are signed with `JWT_SECRET` and carry `{ sub, role }`. Expiry is controlled by `JWT_EXPIRES_IN` (default `8h`).
- Tokens are validated by [`authenticate`](../src/middlewares/auth.js) on every protected route. An invalid/expired token yields `401`.
- Login explicitly rejects users whose `approvalStatus !== "APPROVED"` or `isActive === false`.

## Authorisation (RBAC)

- Role strings are normalised in [`src/utils/roles.js`](../src/utils/roles.js) (aliases: `admin → hospital_admin`, `government_officer → dmo`).
- Every route uses `authorize(...roles)` from [`src/middlewares/rbac.js`](../src/middlewares/rbac.js); unauthorised calls return `403`.
- See [roles-and-permissions.md](./roles-and-permissions.md) for the full matrix.

## Approval workflow

- New staff sign-ups default to `PENDING`.
- Approvers are deterministic per role (`APPROVER_BY_ROLE` in `roles.js`).
- `PATCH /api/admin/users/:userId/approval` updates `approvalStatus` + `approvalRemarks` + `approvalReviewedBy/At`.
- Pending/rejected users see a clear message at login: **“Your account is under verification.”**

## Validation

Enforced at schema (Mongoose) and service layers:

- Patient phone uniqueness (unique sparse index) — duplicate registrations fail with `409`.
- `Patient.patientCode` is immutable and auto-generated as `PAT-XXXXXXXX`.
- `MedicalRecord.appointment` is unique — a nurse cannot save two records for the same appointment.
- Vitals have hard min/max ranges (e.g. SpO₂ 0–100, temperature 90–115 °F). Out-of-range values fail validation.
- SpO₂ < 90 is flagged `critical`; SpO₂ < 94 or temperature ≥ 103 is `abnormal`.
- CBC values outside reference ranges produce `abnormalMarkers`; below the critical threshold flips `isCritical`.

## Audit logging

[`src/services/auditService.js`](../src/services/auditService.js) writes entries to `AuditLog` for important actions (patient creation, diagnosis, approvals, etc.). Each entry includes `actor`, `action`, `entityType`, `entityId`, and structured `details`. Audit logs are indexed on `createdAt desc + action` for chronological queries.

## Centralised error handling

All thrown errors pass through [`errorHandler`](../src/middlewares/errorHandler.js):

- `HttpError` (from `createHttpError`) → `{ error: message }` with its status code.
- Validation / cast errors → `400`.
- Duplicate-key errors (Mongo code 11000) → `409`.
- Everything else → `500` with a generic message (full stack only logged server-side).

## File upload safety

Lab report uploads are handled by Multer ([`src/middlewares/upload.js`](../src/middlewares/upload.js)):

- Stored under `/uploads` with generated filenames (no client-controlled paths).
- Metadata (original name, MIME type) is persisted on `LabReport`.
- Served read-only via `app.use("/uploads", express.static(...))`.

## CORS

CORS is restricted to `FRONTEND_URL` with `credentials: false`. Adjust `src/app.js` if you need to allow additional origins in production.

## Secrets hygiene

- Never commit `.env` — it is gitignored. `.env.example` is the only checked-in template.
- `ML_SERVICE_API_KEY` is optional; when set, the Node API forwards it as `x-api-key` to the ML service.
- Use a strong `JWT_SECRET` in production (32+ random bytes).

## Known limitations

- Rate limiting is **not** implemented — add an express-rate-limit or a reverse-proxy layer in production.
- No password reset / email verification flow — accounts are managed through the admin UI.
- No refresh-token rotation — tokens are long-lived until expiry.
- The demo dataset and severity model are not clinically validated.
