# Glossary

| Term | Meaning |
| --- | --- |
| **DMO** | District Medical Officer — a government public-health role responsible for monitoring disease burden at the district level. Mapped to the `dmo` role in this system. |
| **RBAC** | Role-Based Access Control. Permissions are granted to roles, and users inherit permissions through their role. |
| **JWT** | JSON Web Token. The stateless auth token this API issues on login. |
| **Severity** | The model’s predicted outcome: `low`, `moderate`, or `high`. |
| **Risk score** | Probability (0–1) returned by the ML model for the predicted class. Stored as `Prediction.probability`. |
| **Patient code** | Human-readable unique identifier auto-generated per patient (`PAT-XXXXXXXX`). |
| **Medical record** | Nurse-entered observations for a single appointment (vitals + symptoms + chief complaint). One per appointment. |
| **Lab report** | Structured lab values (with optional uploaded file) attached to a medical record. |
| **Diagnosis** | Doctor-confirmed disease + notes. Triggers ML prediction. |
| **Prescription** | Medicines (name, dosage, frequency, duration) + general advice + follow-up date attached to a diagnosis. |
| **Prediction** | ML output linked to both `Diagnosis` and `Patient`. The analytical unit used by the DMO dashboard. |
| **Approval status** | `PENDING` / `APPROVED` / `REJECTED`. New staff accounts start `PENDING` and cannot log in until approved by the correct role. |
| **Hotspot** | An `(area, disease)` combination ranked by total and severe case count. |
| **Outbreak alert** | Generated when an `(area, disease)` pair exceeds a case-count threshold (>5) in the active time window. |
| **Priority** | Combined indicator of high-severity volume within a district/area. |
| **Demo mode (DMO)** | DMO dashboard reads from seed-generated mock data across all Telangana districts. |
| **Live mode (DMO)** | DMO dashboard reads from real `Prediction` documents created by doctor diagnoses. |
| **Audit log** | Server-side record of important create/view actions (actor, action, entityType, entityId, details). |
| **Reference range (CBC)** | Lab value windows used to mark `abnormalMarkers` and flip `isCritical`. Defined in [`src/services/clinicalService.js`](../src/services/clinicalService.js). |
