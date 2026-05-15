from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

try:
    from ml_service.model_utils import featurize_record
except ModuleNotFoundError:
    from model_utils import featurize_record


BASE_DIR = Path(__file__).resolve().parent
PRIMARY_DATASET_PATH = BASE_DIR / "data" / "severity_dataset.csv"
LEGACY_DATASET_PATH = BASE_DIR / "data" / "severity_dataset_25000.csv"
DATASET_PATH = (
    PRIMARY_DATASET_PATH
    if PRIMARY_DATASET_PATH.exists()
    else LEGACY_DATASET_PATH
    if LEGACY_DATASET_PATH.exists()
    else BASE_DIR / "data" / "demo_dataset.csv"
)
MODEL_PATH = BASE_DIR / "artifacts" / "severity_model.joblib"
METRICS_PATH = BASE_DIR / "artifacts" / "severity_metrics.json"


def normalize_severity(label: str) -> str:
    value = str(label).strip().lower()
    if value == "critical":
        return "high"
    if value in {"low", "moderate", "high"}:
        return value
    raise ValueError(f"Unexpected severity label: {label}")


def train_and_save() -> None:
    feature_rows: list[dict[str, float]] = []
    labels: list[str] = []
    splits: list[str] = []

    with DATASET_PATH.open("r", encoding="utf-8") as dataset_file:
        reader = csv.DictReader(dataset_file)
        for row in reader:
            features = featurize_record(
                age=int(row["age"]),
                temperature=float(row["temperature"]),
                bp=str(row["bp"]),
                lab_results=str(row["lab_results"]),
                symptoms=str(row["symptoms"]),
                disease_name=str(row.get("disease", "")),
            )
            feature_rows.append(features)
            labels.append(normalize_severity(str(row["severity"])))
            splits.append(str(row.get("split", "")).strip().lower())

    if not feature_rows:
        raise ValueError("Dataset is empty. Cannot train model.")

    feature_order = list(feature_rows[0].keys())
    X = np.array([[row[column] for column in feature_order] for row in feature_rows], dtype=float)

    encoder = LabelEncoder()
    y = encoder.fit_transform(labels)
    has_explicit_split = all(split in {"train", "test"} for split in splits) and "test" in splits

    if has_explicit_split:
        train_indices = [index for index, split in enumerate(splits) if split == "train"]
        test_indices = [index for index, split in enumerate(splits) if split == "test"]
        X_train = X[train_indices]
        X_val = X[test_indices]
        y_train = y[train_indices]
        y_val = y[test_indices]
    else:
        X_train, X_val, y_train, y_val = train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y,
        )

    model = XGBClassifier(
        objective="multi:softprob",
        num_class=len(encoder.classes_),
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_lambda=1.0,
        min_child_weight=1.0,
        random_state=42,
        eval_metric="mlogloss",
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_val)
    accuracy = float(accuracy_score(y_val, y_pred))
    report = classification_report(
        y_val,
        y_pred,
        target_names=list(encoder.classes_),
        output_dict=True,
        zero_division=0,
    )

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model": model,
        "feature_order": feature_order,
        "classes": list(encoder.classes_),
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }
    joblib.dump(artifact, MODEL_PATH)

    metrics = {
        "accuracy": round(accuracy, 4),
        "classification_report": report,
        "classes": list(encoder.classes_),
        "dataset": str(DATASET_PATH),
        "split_strategy": "explicit 80:20 train/test column" if has_explicit_split else "stratified train_test_split test_size=0.20",
        "train_size": int(len(y_train)),
        "validation_size": int(len(y_val)),
        "total_rows": int(len(y)),
        "trained_at": artifact["trained_at"],
    }
    with METRICS_PATH.open("w", encoding="utf-8") as metrics_file:
        json.dump(metrics, metrics_file, indent=2)

    print(f"Model artifact saved: {MODEL_PATH}")
    print(f"Validation accuracy: {metrics['accuracy']}")


if __name__ == "__main__":
    train_and_save()
