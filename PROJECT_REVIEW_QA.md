# Viva Questions And Answers

## 1. What is your project title?

My project title is **Digital Health Record and Disease Surveillance System**.

## 2. What is the main idea of this project?

The main idea is to connect hospital workflow with public health surveillance. Patient data moves through reception, nurse, lab, and doctor. After doctor diagnosis, ML predicts severity, and the DMO dashboard uses those predictions for district-level disease monitoring.

## 3. What problem does it solve?

It solves fragmented hospital records and lack of fast disease surveillance. It helps hospital staff manage patient flow and helps DMO identify disease burden, high severity areas, and outbreak alerts.

## 4. What are the main modules?

The main modules are:

- Authentication
- Admin dashboard
- Reception dashboard
- Nurse dashboard
- Lab dashboard
- Doctor dashboard
- Patient dashboard
- DMO analytics dashboard
- ML severity service
- Gemini diet guidance

## 5. What roles are available?

The roles are:

- Hospital Admin
- Medical Superintendent
- Receptionist
- Nurse
- Lab Technician
- Doctor
- DMO
- Patient

## 6. Why did you use role-based access?

Each healthcare worker has a different responsibility. A receptionist should not access doctor diagnosis, and a patient should not access other patients' records. Role-based access improves security and workflow discipline.

## 7. How is role-based access implemented?

It is implemented in frontend and backend.

Frontend uses protected routes. Backend uses JWT authentication and authorization middleware. The backend checks if the logged-in role is allowed for each API route.

## 8. What is JWT?

JWT means JSON Web Token. After successful login, the backend generates a token. The frontend sends it in the Authorization header for protected API calls.

## 9. How are passwords stored?

Passwords are hashed using bcrypt. Plain text passwords are never stored in the database.

## 10. How does patient login work?

Patient login uses mobile number. The patient selects Patient role and enters mobile number. The backend finds the patient by contact number and creates a patient token.

## 11. Why is patient login different from staff login?

Staff users need email, password, and approval. Patients are linked to patient records and can sign in using mobile number for easy access.

## 12. What is patient sign-up?

Patient sign-up creates a patient profile with name, date of birth, gender, mobile number, Aadhar number, district, mandal, village/ward, area, and address.

## 13. What is patient code?

Patient code is a unique ID generated for every patient, for example `PAT-JGT-MAP-001`. It links patient history, appointments, records, diagnoses, prescriptions, and predictions.

## 14. Why is patient code useful?

It prevents confusion between patients with similar names and provides a permanent identifier for hospital history.

## 15. What technologies did you use?

Frontend uses React, Vite, Axios, Recharts, React Router, and SVG map rendering.

Backend uses Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, and Multer.

ML service uses Python, FastAPI, scikit-learn, XGBoost, NumPy, and joblib.

## 16. Why did you use React?

React is good for multi-page dashboards, reusable components, dynamic forms, protected routes, and chart-based interfaces.

## 17. Why did you use Node.js and Express?

Node.js and Express are lightweight and efficient for REST API development. They are easy to connect with React and MongoDB.

## 18. Why did you use MongoDB?

MongoDB is flexible for healthcare data because records can contain nested objects such as vitals, lab values, prescription medicines, and ML prediction features.

## 19. What is Mongoose?

Mongoose is an ODM for MongoDB. It provides schemas, validation, references, indexes, and model methods.

## 20. What are the main database collections?

Main collections are:

- User
- Patient
- Appointment
- MedicalRecord
- LabReport
- Diagnosis
- Prescription
- Prediction
- DietPlan
- Notification
- AuditLog

## 21. What does the Receptionist do?

Receptionist searches or registers patients and creates appointments. This starts the hospital workflow.

## 22. What does the Nurse do?

Nurse records symptoms, vitals, and notes. This creates the medical record for the visit.

## 23. What does the Lab Technician do?

Lab technician uploads lab report details, lab values, and optional report file. Lab values support diagnosis and ML prediction.

## 24. What does the Doctor do?

Doctor reviews patient summary, submits diagnosis, adds notes, creates prescription, and triggers ML severity prediction.

## 25. What does the DMO do?

DMO monitors disease burden, severity distribution, outbreak alerts, map view, trends, and exports reports.

## 26. What does the Patient dashboard show?

It shows the patient's own visits, diagnoses, prescriptions, ML severity, diet plan if available, notifications, and simple chatbot answers based on records.

## 27. When is ML triggered?

ML is triggered after the doctor submits diagnosis.

## 28. Why after diagnosis?

Because the model needs disease name along with symptoms, vitals, lab values, and patient age. Prediction is more meaningful after doctor confirmation.

## 29. What inputs go to ML?

Inputs include:

- age
- temperature
- blood pressure
- lab results
- symptoms
- disease name

## 30. What output does ML return?

It returns risk score and severity.

Severity can be:

- low
- moderate
- high

## 31. Why did you use XGBoost?

XGBoost works well with structured tabular data. The project data is structured: age, vitals, symptoms, disease name, and lab values. XGBoost can learn non-linear relationships and is strong for classification.

## 32. Did you compare models?

The project includes model comparison and visualization scripts. XGBoost is used as the deployed model because it is suitable for structured healthcare-like data and gives strong classification performance.

## 33. What happens if ML service is not running?

The diagnosis still succeeds. The backend stores a fallback severity so the doctor workflow does not fail. But for actual ML prediction, the FastAPI service should be running.

## 34. What is Gemini used for?

Gemini is used to generate supportive diet guidance after diagnosis. It is optional and does not affect diagnosis, ML prediction, or DMO analytics.

## 35. What happens if Gemini API key is invalid?

Only diet plan generation fails. Diagnosis and prediction still work.

## 36. What is the DMO dashboard?

It is the disease surveillance dashboard. It converts patient-level prediction records into district-level analytics.

## 37. What is Live mode?

Live mode uses actual MongoDB prediction records generated from diagnoses.

## 38. What do date filters do?

They filter predictions by created date, so DMO can view disease burden for a selected period.

## 39. What is the number 5 in the DMO filter?

It is the alert threshold. If any mandal/disease group has 5 or more cases in the selected date range, it becomes an outbreak alert.

## 40. What is Total Cases?

It is the total number of prediction records in the selected filter range.

## 41. What is High Severity Percentage?

It is:

```text
high severity cases / total cases x 100
```

It shows what percentage of cases are high risk.

## 42. What is Pressure Score?

Pressure score is a weighted seriousness score:

```text
low x 1 + moderate x 2 + high x 3
```

It shows operational pressure. High severity cases contribute more than low severity cases.

## 43. Why not only show total cases?

Total cases do not show seriousness. For example, 20 high severity cases need more attention than 20 low severity cases. Pressure score solves this.

## 44. What is Cases Trend?

It shows day-wise case count in the selected date range.

## 45. What is Severity Split?

It is a pie chart showing low, moderate, and high case distribution.

## 46. What are Top Diseases?

Top Diseases ranks diseases by number of cases.

## 47. What is Week-over-Week comparison?

It compares the current selected period with the previous period to show whether cases are rising, falling, or stable.

## 48. How is the Telangana map implemented?

The frontend loads a Telangana district GeoJSON file. It converts district polygon coordinates into SVG paths, matches district names with analytics data, and colors each district based on dominant severity.

## 49. Why did Jagtial not show before?

The map file used spelling `Jagitial`, but database used `Jagtial`. I fixed this by normalizing district names.

## 50. What do map colors mean?

- green means low dominant severity
- yellow means moderate dominant severity
- red means high dominant severity
- gray means no data

## 51. What is dominant severity?

Dominant severity is the severity category with the highest count for that district.

## 52. What is DMO CSV export?

It exports disease burden data so officers can use it in reports.

## 53. What validations are implemented?

Examples:

- required fields validation
- unique phone number
- unique Aadhar number
- valid date of birth
- valid role
- valid password length for staff
- valid SpO2 range
- one medical record per appointment

## 54. How are files uploaded?

Lab reports are uploaded through Multer and stored under uploads. The file path is stored in MongoDB.

## 55. What is audit logging?

Audit logging records important actions like patient creation, medical record creation, lab upload, and diagnosis creation.

## 56. What is the current Jagtial patient example?

The sample patient is:

```text
Name: Vamshi Krishna
Mobile: 9177324853
Aadhar: 123456789789
Date of birth: 16-07-2004
District: Jagtial
Patient code: PAT-JGT-MAP-001
```

## 57. How can this patient login?

Select Patient role and enter:

```text
9177324853
```

## 58. What is the main strength of the project?

The main strength is that it combines individual hospital treatment workflow with population-level disease surveillance.

## 59. What are possible future enhancements?

Future enhancements:

- SMS OTP patient login
- real hospital integration
- more disease models
- map drill-down to mandal level
- mobile app
- automated email/SMS alerts
- stronger analytics forecasting

## 60. Give a short final explanation.

This project starts from patient registration, captures nurse and lab data, allows doctor diagnosis, triggers ML severity prediction, and uses the prediction data in the DMO dashboard for disease surveillance. It is a complete full-stack healthcare and analytics system.
