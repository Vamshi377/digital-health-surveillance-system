# ML service

The ML service is a standalone FastAPI app that predicts severity (`low` / `moderate` / `high`) from a structured clinical payload. It is called by the Node API only after a doctor submits a diagnosis.

- Source: [`ml_service/`](../ml_service)
- Entrypoint: [`ml_service/app.py`](../ml_service/app.py)
- Training: [`ml_service/train.py`](../ml_service/train.py)
- Feature engineering: [`ml_service/model_utils.py`](../ml_service/model_utils.py)
- Dataset: [`ml_service/data/demo_dataset.csv`](../ml_service/data/demo_dataset.csv)
- Dataset guide: [`ml_service/data/DATASET_GUIDE.md`](../ml_service/data/DATASET_GUIDE.md)

## Model

- Algorithm: **XGBoost multiclass classifier** wrapped in a scikit-learn pipeline.
- Classes: `low`, `moderate`, `high`.
- Artefacts saved to `ml_service/artifacts/`:
  - `severity_model.joblib` — pickled pipeline.
  - `severity_metrics.json` — accuracy, trained timestamp, class distribution.
- The service auto-trains on first boot if the artefact does not exist (`ensure_artifacts` in `app.py`).

## Input features

The training pipeline and predict endpoint both use [`featurize_record`](../ml_service/model_utils.py), which expects:

| Field | Type | Notes |
| --- | --- | --- |
| `age` | int 0–130 | |
| `temperature` | float 90–115 °F | |
| `bp` | string | e.g. `"120/80"` (systolic/diastolic) |
| `lab_results` | string | `;`-separated key:value pairs, e.g. `"wbc:high;platelet:low"` |
| `symptoms` | string | `;`-separated symptoms, e.g. `"fever;body_pain"` |
| `disease_name` | string | doctor-confirmed disease (can be empty) |

## Endpoints

### `GET /health`
Returns model status and (when available) training metrics.

```json
{
  "status": "ok",
  "model_loaded": true,
  "classes": ["low", "moderate", "high"],
  "metrics": { "accuracy": 0.86, "trained_at": "2025-03-29T10:15:00Z" }
}
```

### `POST /predict`
Request:
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

Response `200`:
```json
{ "risk_score": 0.82, "severity": "High" }
```

Error `400` — feature parsing failed (ValueError); `422` — Pydantic validation; `500` — model inference failure.

## Integration with Node API

[`src/services/mlService.js`](../src/services/mlService.js) calls `POST ${ML_SERVICE_URL}/predict` with:
- 8-second abort timeout.
- Optional `x-api-key: ${ML_SERVICE_API_KEY}` header when set.
- Response `risk_score` → `Prediction.probability`; `severity` is normalised (lowercased, `critical` collapsed to `high`) and stored as `Prediction.predictedSeverity`.

## Running locally

```bash
cd ml_service
python3 -m venv .venv
source .venv/bin/activate        # on Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
python train.py                  # optional; app auto-trains on first boot
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Retraining with new data

1. Replace `ml_service/data/demo_dataset.csv` following the schema in [`DATASET_GUIDE.md`](../ml_service/data/DATASET_GUIDE.md).
2. Delete `ml_service/artifacts/severity_model.joblib` (or run `python train.py`).
3. Restart the service — it will pick up the new artefact on startup.

## Disclaimers

- The bundled dataset is a synthetic demo dataset intended for development and demo purposes only.
- The model is **not** clinically validated and must not be used for actual patient care decisions.
- To use a different ML backend (e.g. a hosted API), change `ML_SERVICE_URL` and keep the request/response contract above.
