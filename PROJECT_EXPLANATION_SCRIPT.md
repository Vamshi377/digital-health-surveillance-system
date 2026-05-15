# External Faculty Project Explanation Script

## Opening

Good morning sir/madam. My mini project is **Digital Health Record and Disease Surveillance System**.

The project is designed for two connected purposes:

1. To digitize the hospital patient workflow from registration to diagnosis.
2. To convert diagnosed patient data into district-level disease surveillance for the DMO.

In a normal hospital system, patient records usually stay inside the hospital. In my project, the same clinical data also helps public health officers understand disease spread, high severity cases, and outbreak pressure.

## Problem Statement

Hospitals collect patient details, symptoms, vitals, lab reports, and diagnosis, but this data is often fragmented. District health officers also need quick information about where cases are increasing and which locations require attention.

So the problem is:

- patient records are not always connected across hospital roles
- severity is not automatically estimated
- disease trends are not easy to see district-wise
- public health officers do not get fast analytics from clinical data

My project solves this by creating one connected workflow.

## Main Users

The system has these roles:

- Hospital Admin
- Receptionist
- Nurse
- Lab Technician
- Doctor
- DMO
- Patient

Each role has a separate dashboard. A user can access only the pages allowed for their role.

## End-To-End Flow

First, the receptionist registers a patient and creates an appointment.

Then the nurse records symptoms and vitals like temperature, blood pressure, pulse, SpO2, and notes.

After that, the lab technician uploads lab report details such as CBC values and report summary.

Then the doctor opens the patient summary, reviews vitals, lab results, and history, and submits diagnosis and prescription.

When diagnosis is submitted, the backend calls the ML service. The ML service predicts severity as low, moderate, or high and returns a risk score. This prediction is stored in MongoDB.

Finally, the DMO dashboard uses the stored prediction records to show district severity map, disease trends, severity split, top diseases, outbreak alerts, and pressure score.

## Technology Stack

The frontend is built with **React and Vite**. React is used because the project has multiple dashboards, reusable UI components, protected routes, forms, charts, and dynamic API data.

The backend is built with **Node.js and Express.js**. Express is used to create REST APIs for login, patient registration, appointments, records, diagnosis, analytics, and admin operations.

The database is **MongoDB with Mongoose**. MongoDB is suitable here because healthcare records have nested and flexible data, such as vitals, lab values, medicines, prediction features, and audit details.

The ML service is built with **Python FastAPI**. FastAPI gives a simple API endpoint for prediction and is suitable for serving a trained machine learning model.

For charts, I used **Recharts**. For the map, I used a **Telangana GeoJSON file** and rendered district polygons using SVG paths in React.

## Authentication And Role-Based Access

For staff roles, login uses email, password, and role. Passwords are stored as bcrypt hashes. After successful login, the backend returns a JWT token. The frontend stores that token and sends it in the Authorization header.

Protected frontend routes check user role before showing dashboards. Backend middleware also checks the role before allowing API access. So even if someone changes the URL manually, unauthorized API calls are blocked.

For patient login, the patient selects Patient role and enters mobile number. The backend links that mobile number to the patient record and gives access only to that patient's own dashboard.

## Patient Code

Every patient gets a unique patient code such as `PAT-JGT-MAP-001`.

The patient code is important because it acts as a stable hospital identity for the patient. Phone numbers or addresses can change, but the patient code remains unique and helps link medical history, diagnosis, prescriptions, and patient dashboard access.

## ML Severity Prediction

The ML model is triggered only after doctor diagnosis.

This is intentional because the model needs meaningful clinical input:

- patient age
- temperature
- blood pressure
- symptoms
- lab values
- confirmed disease name

The ML service returns:

- predicted severity: low, moderate, or high
- risk score/probability

If the ML service is unavailable, the system still saves the diagnosis and uses a fallback severity, so the doctor workflow does not fail.

## Why This Model

The service uses a trained severity classification model. The project includes model training and comparison scripts. XGBoost is preferred because it handles structured tabular healthcare-like data well, captures non-linear relationships, and performs better than simple linear models when symptoms, vitals, and lab values interact.

For a mini project, this is a good fit because the inputs are structured fields, not images or long text.

## Gemini Diet Plan

After diagnosis, the backend can also call Gemini to generate a safe supportive diet plan. This is optional. If the Gemini API key is missing or invalid, diagnosis and DMO analytics still work. Gemini is only for the AI diet guidance shown in patient records.

## DMO Dashboard

The DMO dashboard is the surveillance part of the project.

It contains:

- total cases
- high severity percentage
- pressure score
- active alerts
- cases trend
- severity split
- top diseases
- week-over-week comparison
- Telangana district severity map
- disease burden table
- export CSV
- auto-refresh

The date filters decide which prediction records are included. The alert threshold field decides how many cases are required before an outbreak alert is shown.

## Pressure Score

Pressure score is a weighted seriousness score.

The formula is:

- low severity case = 1 point
- moderate severity case = 2 points
- high severity case = 3 points

Example:

If there are 25 low, 18 moderate, and 25 high cases:

```text
25 x 1 = 25
18 x 2 = 36
25 x 3 = 75
Pressure Score = 136
```

This score is useful because total case count alone does not show seriousness. Ten high severity cases are more serious than ten low severity cases.

## Severity Meaning

Low severity means the case is less risky and can usually be managed with normal monitoring.

Moderate severity means the case needs attention and follow-up.

High severity means the case is risky and may require priority care or closer monitoring.

High Severity Percentage means:

```text
high severity cases / total cases x 100
```

## Telangana Map Implementation

The Telangana map is implemented using a GeoJSON file stored in the frontend public data folder.

Each district boundary is stored as polygon coordinates. In React, I convert those coordinates into SVG paths. Then I match each district name with backend analytics data.

The district color is based on dominant severity:

- green = low
- yellow = moderate
- red = high
- gray = no data

There was a spelling mismatch in the map file where Jagtial was written as `Jagitial`. I handled this by normalizing district names so map and database values match.

## Current Jagtial Demo Data

For demonstration, I added Jagtial diagnosed cases across different mandals. One record is:

- Name: Vamshi Krishna
- Mobile: 9177324853
- Aadhar: 123456789789
- Date of birth: 16-07-2004
- District: Jagtial

This patient can login from Patient role using the mobile number.

## Patient Dashboard

The patient dashboard shows the patient's own medical data:

- visits
- diagnoses
- prescriptions
- ML severity
- diet plan if generated
- notifications
- patient chatbot for simple record questions

The patient cannot see other patients' data.

## Conclusion

To conclude, this project connects hospital workflow and public health surveillance. It starts from patient registration, moves through nurse, lab, and doctor workflows, uses ML for severity prediction, and finally visualizes disease burden in the DMO dashboard.

The project demonstrates full-stack development, role-based security, MongoDB database design, machine learning integration, AI diet guidance, and district-level analytics.
