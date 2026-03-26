# Digital Health Project Full Explanation Script

Use this as a speaking script for demo, viva, or explaining the website to friends.

## 1. Project Introduction

This project is a Digital Health Record and Disease Surveillance System.
It is designed to connect hospital workflow with district-level public health monitoring.

The main idea is:
1. Hospital staff handle the patient step by step.
2. Doctor confirms disease and treatment.
3. The system sends data to the ML service for severity prediction.
4. Those predictions are aggregated in the DMO dashboard for outbreak surveillance.

So this is not just a hospital record system.
It is both:
- a clinical workflow system
- a disease intelligence system

## 2. Technology Stack

Backend:
- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Role-based access control

Frontend:
- React with Vite
- Recharts for graphs
- Leaflet for Telangana district map

ML Service:
- Python FastAPI
- XGBoost-based training and prediction flow

## 3. Roles In The System

The project has seven roles:
- Admin
- Receptionist
- Nurse
- Lab Technician
- Doctor
- Government Officer, which we refer to as DMO
- Patient

Each role sees only its own dashboard.
This is controlled in two places:
- frontend route protection
- backend role authorization

So even if a user manually changes the URL, the API still blocks unauthorized access.

## 4. Login Page

When the website opens, the first page is the login page.
This page asks for:
- email
- password

It also has preset demo buttons for Admin, Reception, Nurse, Lab, Doctor, DMO, and Patient.

Important point:
These preset accounts are not magic frontend accounts.
They come from the backend seed script.

That means if someone clones the project and does not run `npm run seed`, login will fail because those users are not yet stored in MongoDB.

Demo logins are:
- admin@health.local / Admin@123
- reception@health.local / Reception@123
- nurse@health.local / Nurse@123
- lab@health.local / Lab@123
- doctor@health.local / Doctor@123
- dmo@health.local / Dmo@123
- patient@health.local / Patient@123

## 5. Authentication And Security Flow

When a user logs in:
1. frontend sends email and password to `/api/auth/login`
2. backend finds the user by email
3. password is checked using bcrypt hash comparison
4. if valid, backend generates a JWT token
5. frontend stores token and user info in localStorage
6. token is attached in the Authorization header for future API calls

Security features:
- passwords are hashed, not stored as plain text
- inactive users cannot log in
- every important route checks role permissions
- some important actions are written to audit logs

## 6. How Users Are Created

There are two ways accounts are created:

### A. Demo seed creation
When we run `npm run seed`, the system inserts demo users for all major roles.
This is mainly for project demonstration.

### B. Admin creates accounts
Inside the Admin dashboard, the admin can create users by entering:
- full name
- email
- password
- role
- patient code if the role is patient

### How DMO registration works
There is no separate public DMO signup page in the UI.
A DMO account is created by Admin.

For DMO, the admin selects:
- role = `government_officer`

Then that user can log in and access the DMO analytics dashboard.

### How patient registration is different
Patient medical registration is first done by Reception in the clinical workflow.
That creates a patient record with a generated `patientCode`.

If we later want a patient login account, Admin can create a user with:
- role = `patient`
- patientCode = existing patient code

That links the patient user account with the patient medical profile.

## 7. Full End-To-End Website Flow

The best way to explain this project is by following one patient journey.

Example:
A patient named Ravi comes to the hospital with fever, body pain, and weakness.

### Step 1. Reception dashboard

Reception is the first operational module.

What Reception can do:
- search existing patient by phone number
- register a new patient
- create an appointment for the patient

Reception form contains:
- full name
- date of birth
- gender
- district
- area
- address line
- contact number
- latitude and longitude optional

What happens in backend:
- required fields are validated
- age is derived from date of birth if provided
- duplicate phone number is blocked
- a unique patient code is generated automatically like `PAT-XXXXXXXX`
- the patient record is saved

Why district and area matter:
These fields are later used by the DMO analytics dashboard to identify geographic disease spread.

After patient creation, reception creates an appointment with:
- scheduled date and time
- reason for visit

Example explanation:
"Here the receptionist registers Ravi, stores his demographic and location details, and creates his appointment. The patient code is the unique identity used throughout the system."

### Step 2. Nurse dashboard

After appointment creation, the patient appears in the nurse queue.

What Nurse can do:
- view scheduled queue
- select an appointment
- enter symptoms
- record vitals
- save exactly one medical record per appointment

Nurse form contains:
- symptoms
- temperature
- blood pressure systolic
- blood pressure diastolic
- pulse
- SpO2
- nurse notes

Important logic:
- SpO2 greater than 100 is invalid
- SpO2 below 90 is treated as critical
- if vitals are already saved once, the same appointment cannot be recorded again
- after save, appointment moves out of nurse queue

Example explanation:
"At the nurse stage, the system captures the first clinical observation. This creates the medical record that later becomes the basis for lab review, diagnosis, and ML prediction."

### Step 3. Lab dashboard

Now the lab technician works on the medical record created by nurse.

What Lab can do:
- enter medical record ID
- choose test type
- enter lab values
- upload report image or PDF optionally

Current demo lab test:
- CBC

CBC fields shown:
- platelet count
- WBC count
- hemoglobin
- summary

What the system does:
- compares values against reference ranges
- marks abnormal values
- detects critical condition, for example platelet count below critical threshold
- stores the report against the medical record
- optionally stores the uploaded file path

Example explanation:
"In this page, the lab technician uploads measurable evidence. The system does not just store the report, it also calculates abnormal markers and a critical flag."

### Step 4. Doctor dashboard

Doctor is the decision-making module of the system.

What Doctor can do:
- open current medical record queue
- view unified patient summary
- review vitals snapshot
- review latest lab report
- review diagnosis history
- enter disease name
- enter diagnosis notes
- enter prescription table
- submit diagnosis

The unified summary is important because it combines:
- patient identity
- area and district
- nurse vitals
- lab report
- past diagnosis history

Prescription table contains:
- medicine name
- dosage
- frequency
- duration days
- instructions

When doctor submits diagnosis:
1. diagnosis is stored
2. prescription is stored
3. backend prepares ML input using patient age, symptoms, BP, temperature, disease name, and lab data
4. backend calls FastAPI ML service
5. ML returns severity and risk score
6. prediction is saved in database
7. medical record status becomes diagnosed

Example explanation:
"This is the most important stage because the doctor finalizes the disease, gives treatment, and then the system generates ML-based severity prediction. That prediction becomes useful not only for the patient but also for district-level surveillance."

## 8. Example Patient Story For Demo

You can explain one complete story like this:

"Suppose Ravi from Hyderabad comes with high fever and body pain.
Reception registers him and records Hyderabad as district and Kukatpally as area.
The system generates a patient code.
Reception then creates an appointment.
At the nurse station, temperature is recorded as 101 F, pulse 95, and SpO2 97.
The nurse saves the medical record.
In lab, CBC values are uploaded and platelet count is low, which is abnormal.
The doctor opens the full summary, suspects Dengue, prescribes Paracetamol and hydration advice, and submits diagnosis.
Now the ML service predicts severity, for example moderate or high.
That prediction is stored.
Because the patient belongs to Hyderabad district, the DMO dashboard later includes this case in district disease burden and outbreak analysis." 

## 9. Patient Dashboard

The Patient dashboard is a self-view page.

What patient can see:
- own full name
- own patient code
- total visits
- total diagnoses
- latest predicted severity
- diagnosis table with doctor severity and ML severity

This dashboard is linked only if the patient user account is mapped to a patient profile using `patientCode`.

Example explanation:
"This page improves transparency because the patient can track visits, diagnoses, and predicted disease severity from previous records."

## 10. Admin Dashboard

Admin dashboard is for platform management.

What Admin can do:
- view all users
- create new users
- activate or suspend users

Statistics shown:
- total users
- active accounts
- number of doctors and DMO users

Practical use:
- create Reception, Nurse, Doctor, Lab, and DMO accounts
- create patient login accounts after a patient record exists
- suspend an account to block login without deleting the user

Example explanation:
"Admin handles account lifecycle. This is important because hospital and district systems require controlled access based on role."

## 11. DMO Dashboard

This is the public health intelligence part of the project.

DMO stands for District Medical Officer.

This dashboard does not collect raw hospital data directly.
Instead, it uses stored prediction records generated after doctor diagnosis.

That means DMO analytics are based on clinically processed cases, not on random data entry.

What DMO can do:
- switch between demo mode and live mode
- apply district and area filters
- apply time filters
- enable auto refresh
- monitor alert feed
- view hotspot ranking
- view 33 district burden table
- inspect Telangana district map
- check severity charts
- check top diseases
- compare this week vs last week
- open patient cluster modal for a disease and area

### What each analytics section means

Total Cases:
- total predicted cases in current filtered window

High Severity Percentage:
- proportion of high severity predictions

Pressure Score:
- a combined operational indicator derived from severe cases and outbreak alerts

Outbreak Alerts:
- generated when cases in one area and disease cross threshold greater than 5

Live Alert Feed:
- quick operational summary of districts needing attention

Hotspot Ranking:
- ranks areas using total cases and severe case count

33 District Burden:
- district-wise table of total, low, moderate, high and priority

Telangana Outbreak Map:
- district polygons are colored based on case burden
- clicking a district opens summary with total, low, moderate, high, and priority

Severity By Area chart:
- stacked distribution of low, moderate, and high cases by area

Severity Distribution pie:
- overall case split by severity

Cases Trend Over Time:
- shows how cases change day by day

Top Diseases:
- ranks diseases by total affected count

Week-over-Week Comparison:
- compares current window with previous window and shows rising or falling trend

Patient Cluster modal:
- shows patient-level records for one disease in one area
- useful for field action planning

Example explanation:
"The DMO dashboard converts patient-level diagnosis outcomes into district-level public health intelligence. So this project bridges individual treatment with population surveillance."

## 12. Demo Mode Vs Live Mode

The DMO dashboard has two modes.

Demo mode:
- uses generated demo rows based on Telangana district GeoJSON
- useful when live patient records are limited
- helps present all districts in the map

Live mode:
- uses actual prediction records stored in MongoDB
- reflects real cases produced from doctor diagnoses

This is important in explanation because it shows the system supports:
- realistic classroom demo
- real database-backed monitoring

## 13. Why ML Is Useful Here

The ML service predicts severity after the doctor submits diagnosis.

Why we did it this way:
- doctor provides the confirmed disease context
- nurse and lab provide structured inputs
- ML estimates severity level and risk score
- prediction can support triage and district surveillance

This avoids using ML too early without enough clinical context.

## 14. Database Design Summary

Main collections and purpose:
- `User`: login accounts and role information
- `Patient`: demographic and geographic patient profile
- `Appointment`: visit scheduling
- `MedicalRecord`: symptoms, vitals, nurse notes, visit status
- `LabReport`: test results, abnormal markers, critical flags, report file
- `Diagnosis`: doctor diagnosis details
- `Prescription`: medicine table and advice
- `Prediction`: ML output with severity and probability
- `AuditLog`: tracks important actions

This design is modular.
Each stage adds one layer of information to the same patient journey.

## 15. Important Validation Rules To Mention

You can mention these as project strengths:
- duplicate patient phone numbers are prevented
- patient code is auto-generated and unique
- password is hashed with bcrypt
- JWT secures APIs
- role-based access blocks unauthorized modules
- nurse cannot create multiple records for one appointment
- SpO2 above 100 is rejected
- lab abnormalities are calculated automatically
- patient account mapping requires valid patient code
- inactive users cannot log in

## 16. Exact Setup Steps For Friends

If your friends clone the project, tell them to do this:

1. Create root `.env`
2. Add valid `MONGO_URI`
3. Run `npm install`
4. Run `cd frontend` then `npm install`
5. Set up `ml_service` virtual environment and install requirements
6. Run `npm run seed`
7. Start backend with `npm run dev`
8. Start ML service with uvicorn
9. Start frontend with `cd frontend` and `npm run dev`
10. Use seeded login credentials

If they skip step 6, the preset login buttons will fail.

## 17. Short Viva Conclusion

You can end with this:

"In summary, this project demonstrates a full digital healthcare pipeline.
It starts from patient registration, passes through nurse assessment, lab validation, doctor diagnosis, ML severity prediction, and finally reaches district-level surveillance in the DMO dashboard.
So the project is valuable both for hospital operations and for public health decision-making." 
