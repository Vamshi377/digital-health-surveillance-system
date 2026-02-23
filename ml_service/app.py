from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from ml_service.model_utils import featurize_record
    from ml_service.train import METRICS_PATH, MODEL_PATH, train_and_save
except ModuleNotFoundError:
    from model_utils import featurize_record
    from train import METRICS_PATH, MODEL_PATH, train_and_save


class PredictRequest(BaseModel):
    age: int = Field(..., ge=0, le=130)
    temperature: float = Field(..., ge=90, le=115)
    bp: str = Field(..., description="Blood pressure in systolic/diastolic format, e.g. 120/80")
    lab_results: str
    symptoms: str
    disease_name: str = ""


class PredictResponse(BaseModel):
    risk_score: float
    severity: str


app = FastAPI(title="Clinical Severity ML Service", version="1.0.0")

model = None
feature_order: list[str] = []
class_names: list[str] = []
model_metrics = None


def ensure_artifacts() -> None:
    if not MODEL_PATH.exists():
        train_and_save()


@app.on_event("startup")
def startup_event() -> None:
    global model, feature_order, class_names, model_metrics
    ensure_artifacts()
    artifact = joblib.load(MODEL_PATH)
    model = artifact["model"]
    feature_order = artifact["feature_order"]
    class_names = artifact["classes"]

    if Path(METRICS_PATH).exists():
        import json

        with Path(METRICS_PATH).open("r", encoding="utf-8") as metrics_file:
            model_metrics = json.load(metrics_file)
    else:
        model_metrics = None


@app.get("/health")
def health() -> dict:
    response = {"status": "ok", "model_loaded": model is not None, "classes": class_names}
    if model_metrics:
        response["metrics"] = {
            "accuracy": model_metrics.get("accuracy"),
            "trained_at": model_metrics.get("trained_at"),
        }
    return response


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    try:
        features = featurize_record(
            age=payload.age,
            temperature=payload.temperature,
            bp=payload.bp,
            lab_results=payload.lab_results,
            symptoms=payload.symptoms,
            disease_name=payload.disease_name,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    ordered_values = np.array([[features[column] for column in feature_order]], dtype=float)
    probabilities = model.predict_proba(ordered_values)[0]
    best_idx = int(np.argmax(probabilities))
    predicted_label = class_names[best_idx]
    risk_score = float(probabilities[best_idx])

    return PredictResponse(
        risk_score=round(risk_score, 4),
        severity=predicted_label.capitalize(),
    )
