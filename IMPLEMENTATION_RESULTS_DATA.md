# Digital Health Record + ML Disease Surveillance

## 1. Brief Overview of Implementation

### System flow
1. Receptionist registers the patient and creates an appointment.
2. Nurse records symptoms and vitals for the appointment.
3. Lab technician uploads lab findings and abnormal markers.
4. Doctor reviews the complete patient summary and confirms disease.
5. Node.js backend sends structured clinical data to the FastAPI ML service.
6. The ML service predicts severity as `Low`, `Moderate`, or `High`.
7. Prediction is stored and reflected in dashboards, including DMO analytics.

### Algorithms used
- Authentication and access control: JWT + Role-Based Access Control
- Data persistence: MongoDB with Mongoose schemas
- Severity prediction models explored: Logistic Regression, Random Forest, and XGBoost multiclass classifiers
- Feature engineering:
  - Blood pressure split into systolic and diastolic values
  - Symptom token counting
  - High-risk symptom counting
  - Abnormal lab marker counting
  - Disease text hashing and disease-specific indicator flags
- Model validation: explicit `80% / 20%` train-test split with classification metrics

## 2. Implementation Steps with Pseudocode

### A. Patient workflow pseudocode
```text
START
  User logs in with approved role
  IF role == receptionist:
      register patient
      create appointment
  IF role == nurse:
      record vitals and symptoms
  IF role == lab_technician:
      upload lab report and abnormal markers
  IF role == doctor:
      open patient summary
      enter diagnosis and prescription
      call ML severity prediction service
      save prediction result
  IF role == dmo:
      aggregate district-wise disease and severity data
      display surveillance dashboard
END
```

### B. Severity prediction pseudocode
```text
INPUT: age, temperature, bp, lab_results, symptoms, disease_name

PARSE bp into systolic and diastolic
TOKENIZE symptoms and lab_results
COUNT symptom_count
COUNT high_risk_symptom_count
COUNT abnormal_lab_count
ENCODE disease text into numeric features

BUILD feature vector
LOAD trained severity model
PREDICT class probabilities
SELECT class with maximum probability

OUTPUT: severity label, risk score
```

### C. Training pseudocode
```text
LOAD severity_dataset.csv
FOR each patient record:
    extract engineered features
    normalize severity label
USE explicit split column for 80% training and 20% testing
TRAIN Random Forest and XGBoost multiclass classifiers
PREDICT on test set
CALCULATE accuracy, precision, recall, and F1-score
SAVE model artifact and metrics JSON
```

## 3. Execution Screenshots with Labels

Use these exact labels in your report screenshots.

### Screenshot 1: ML model training completed
- Command:
```bash
cd ml_service
.\.venv\Scripts\activate
python train.py
```
- Expected visible output:
```text
Model artifact saved: ...\ml_service\artifacts\severity_model.joblib
Validation accuracy: 0.9464
```
- Caption:
`Figure 1. XGBoost severity model training completed successfully on the 25,000-record severity dataset with an explicit 80:20 split and saved model artifacts.`

### Screenshot 2: ML service health check
- Command:
```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
- Open:
`http://127.0.0.1:8000/health`
- Expected response content:
```json
{
  "status": "ok",
  "model_loaded": true,
  "classes": ["high", "low", "moderate"],
  "metrics": {
    "accuracy": 0.9464
  }
}
```
- Caption:
`Figure 2. FastAPI ML prediction service running and model loaded successfully.`

### Screenshot 3: Prediction API execution
- Sample input:
```json
{
  "age": 62,
  "temperature": 101.4,
  "bp": "158/96",
  "lab_results": "wbc:high;troponin:borderline",
  "symptoms": "chest_pain;breathlessness;fatigue",
  "disease_name": "dengue"
}
```
- Example output format:
```json
{
  "risk_score": 0.82,
  "severity": "High"
}
```
- Caption:
`Figure 3. Severity prediction API returning risk score and severity class for a patient case.`

### Screenshot 4: Doctor dashboard after diagnosis
- Capture screen showing:
  - patient summary
  - diagnosis entry
  - prediction result
- Caption:
`Figure 4. Doctor dashboard showing diagnosis workflow and generated severity prediction.`

### Screenshot 5: DMO analytics dashboard
- Capture screen showing:
  - district burden overview
  - severity distribution
  - hotspots/trends
- Caption:
`Figure 5. DMO dashboard visualizing district-wise surveillance and severity burden.`

## 4. Model Testing and Evaluation

### Evaluation setup
- Dataset used: `ml_service/data/severity_dataset.csv`
- Total records: `25,000`
- Train-test split: `80% / 20%`
- Training size: `20,000`
- Test size: `5,000`
- Models compared: `LogisticRegression`, `RandomForestClassifier`, and `XGBClassifier`
- Validation strategy: explicit split column with `train` and `test`

### Class distribution

| Severity Class | Record Count |
|---|---:|
| Low | 10,251 |
| Moderate | 3,990 |
| High | 10,759 |

### Model comparison metrics

| Model | Accuracy | Macro F1-score | Weighted F1-score |
|---|---:|---:|---:|
| Logistic Regression | 0.9242 | 0.8910 | 0.9229 |
| Random Forest | 0.9448 | 0.9222 | 0.9444 |
| XGBoost | 0.9464 | 0.9243 | 0.9459 |

### Selected deployment model

For both the deployed FastAPI severity service and the model comparison on the generated severity dataset, `XGBoost` is the selected model because it produced the highest test accuracy under the explicit `80% / 20%` split.

### Class-wise evaluation

| Class | Precision | Recall | F1-score | Support |
|---|---:|---:|---:|---:|
| High | 0.9632 | 0.9703 | 0.9667 | 2156 |
| Low | 0.9601 | 0.9719 | 0.9660 | 2032 |
| Moderate | 0.8625 | 0.8190 | 0.8402 | 812 |

### Confusion matrix

Rows = Actual, Columns = Predicted

| Actual \ Predicted | High | Low | Moderate |
|---|---:|---:|---:|
| High | 2092 | 9 | 55 |
| Low | 6 | 1975 | 51 |
| Moderate | 74 | 73 | 665 |

### Sample test predictions

| Disease | Symptoms | Actual | Predicted | Confidence |
|---|---|---|---|---:|
| influenza | breathlessness;chest_pain;fatigue;fever | High | High | 0.98 |
| gastro_enteric_fever | dehydration;vomiting | Low | Low | 0.95 |
| dengue | body_pain;fatigue;fever;headache;sweating | Moderate | Moderate | 0.93 |
| cardio_respiratory_infection | breathlessness;chest_pain;confusion;sweating | High | High | 0.99 |
| typhoid | abdominal_pain;appetite_loss;fatigue | Moderate | Moderate | 0.91 |
| malaria | chills;fever;headache;vomiting | Moderate | Moderate | 0.92 |
| influenza | cough;runny_nose;sore_throat | Low | Low | 0.94 |
| dengue | fever;headache;nausea;rash | Moderate | Moderate | 0.90 |
| cardio_respiratory_infection | breathlessness;dizziness;fatigue | High | Moderate | 0.81 |
| gastro_enteric_fever | abdominal_pain;dehydration;diarrhea;vomiting | High | High | 0.97 |

## 5. Detailed Result Analysis

### Key observations
- A larger synthetic severity dataset of `25,000` records was generated to support more realistic ML evaluation.
- `XGBoost` achieved the best overall test accuracy at `94.64%` and is the currently deployed model in the FastAPI service.
- `Random Forest` performed very closely at `94.48%`, while `Logistic Regression` reached `92.42%`.
- `High` and `Low` severity classes both achieved strong precision and recall on the 5,000-row test set.
- Most classification errors occurred around the `Moderate` class, which is expected because these cases sit closer to the decision boundary.

### Feature importance analysis

| Rank | Feature | Importance |
|---|---|---:|
| 1 | temperature | High influence |
| 2 | age | High influence |
| 3 | bp_systolic | High influence |
| 4 | bp_diastolic | High influence |
| 5 | abnormal_lab_count | Medium influence |
| 6 | high_risk_symptom_count | Medium influence |
| 7 | symptom_count | Supporting influence |

Interpretation:
- Temperature is one of the strongest predictors in the severity pipeline.
- Age and blood pressure contribute heavily to risk separation.
- Abnormal lab findings and high-risk symptoms improve differentiation, especially for severe patients.
- Moderate cases remain the most difficult because they partially overlap with both low-risk and high-risk patterns.

## 6. Graph Data for Report

### Graph 1: Severity class distribution

| Class | Count |
|---|---:|
| Low | 10,251 |
| Moderate | 3,990 |
| High | 10,759 |

### Graph 2: Model comparison accuracy

| Model | Accuracy |
|---|---:|
| Logistic Regression | 0.9242 |
| Random Forest | 0.9448 |
| XGBoost | 0.9464 |

### Graph 3: XGBoost class-wise precision, recall, and F1-score

| Class | Precision | Recall | F1-score |
|---|---:|---:|---:|
| High | 0.9632 | 0.9703 | 0.9667 |
| Low | 0.9601 | 0.9719 | 0.9660 |
| Moderate | 0.8625 | 0.8190 | 0.8402 |

### Graph 4: XGBoost confusion matrix values

| Actual Class | Predicted High | Predicted Low | Predicted Moderate |
|---|---:|---:|---:|
| High | 2092 | 9 | 55 |
| Low | 6 | 1975 | 51 |
| Moderate | 74 | 73 | 665 |

## 7. Conclusion

The implemented system successfully integrates hospital workflow automation with ML-based severity prediction and disease surveillance. Using the generated `25,000`-record severity dataset with an explicit `80% / 20%` split, the project achieved strong predictive performance. `XGBoost` produced the highest test accuracy at `94.64%` and is also the deployed model in the FastAPI service, while `Random Forest` followed closely at `94.48%`. The current limitation is that the dataset is synthetic, so future work should include real hospital records and external validation to improve clinical reliability and generalization.
