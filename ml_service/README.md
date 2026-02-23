# ML Service (Phase 2 - Step 1 & Step 2)

This folder contains a separate Python service for severity prediction using XGBoost.

## What is included

- Demo structured dataset: `data/demo_dataset.csv`
- Training script: `train.py` (XGBoost multiclass classifier)
- Prediction API: `app.py` (FastAPI)

## Input features used

- `age`
- `temperature`
- `bp` (systolic/diastolic, e.g. `120/80`)
- `lab_results` (semi-colon separated key:value pairs)
- `symptoms` (semi-colon separated symptoms)
- `disease_name` (doctor-confirmed disease)

## Target label

- `severity` with classes: `low`, `moderate`, `high`

## Setup

```bash
cd ml_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Train model

```bash
python train.py
```

Artifacts are saved to:
- `artifacts/severity_model.joblib`
- `artifacts/severity_metrics.json`

## Run service

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoint

`POST /predict`

Request body:

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

Response body:

```json
{
  "risk_score": 0.82,
  "severity": "High"
}
```
