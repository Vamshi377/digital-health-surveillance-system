from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
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
RESULTS_PATH = BASE_DIR / "artifacts" / "severity_model_comparison.json"


def normalize_severity(label: str) -> str:
    value = str(label).strip().lower()
    if value == "critical":
        return "high"
    if value in {"low", "moderate", "high"}:
        return value
    raise ValueError(f"Unexpected severity label: {label}")


def load_features_and_labels():
    feature_rows: list[dict[str, float]] = []
    labels: list[str] = []
    splits: list[str] = []

    with DATASET_PATH.open("r", encoding="utf-8", newline="") as dataset_file:
        reader = csv.DictReader(dataset_file)
        for row in reader:
            feature_rows.append(
                featurize_record(
                    age=int(row["age"]),
                    temperature=float(row["temperature"]),
                    bp=str(row["bp"]),
                    lab_results=str(row["lab_results"]),
                    symptoms=str(row["symptoms"]),
                    disease_name=str(row.get("disease", "")),
                )
            )
            labels.append(normalize_severity(row["severity"]))
            splits.append(str(row.get("split", "")).strip().lower())

    if not feature_rows:
        raise ValueError("Severity dataset is empty. Cannot compare models.")

    feature_order = list(feature_rows[0].keys())
    x = np.array([[row[column] for column in feature_order] for row in feature_rows], dtype=float)

    encoder = LabelEncoder()
    y = encoder.fit_transform(labels)

    return x, y, splits, feature_order, list(encoder.classes_)


def evaluate_model(model_name: str, model, x_train, x_val, y_train, y_val, class_names: list[str]) -> dict[str, object]:
    model.fit(x_train, y_train)
    y_pred = model.predict(x_val)
    accuracy = float(accuracy_score(y_val, y_pred))
    report = classification_report(
        y_val,
        y_pred,
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )
    return {
        "model": model_name,
        "accuracy": round(accuracy, 4),
        "weighted_f1": round(float(report["weighted avg"]["f1-score"]), 4),
        "macro_f1": round(float(report["macro avg"]["f1-score"]), 4),
        "classification_report": report,
    }


def compare_models() -> dict[str, object]:
    x, y, splits, feature_order, class_names = load_features_and_labels()
    has_explicit_split = all(split in {"train", "test"} for split in splits) and "test" in splits

    if has_explicit_split:
        train_indices = [index for index, split in enumerate(splits) if split == "train"]
        test_indices = [index for index, split in enumerate(splits) if split == "test"]
        x_train = x[train_indices]
        x_val = x[test_indices]
        y_train = y[train_indices]
        y_val = y[test_indices]
    else:
        x_train, x_val, y_train, y_val = train_test_split(
            x,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y,
        )

    random_forest = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        random_state=42,
        n_jobs=1,
    )
    logistic_regression = make_pipeline(
        StandardScaler(),
        LogisticRegression(
            max_iter=5000,
            solver="lbfgs",
            random_state=42,
        ),
    )
    xgboost = XGBClassifier(
        objective="multi:softprob",
        num_class=len(class_names),
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_lambda=1.0,
        min_child_weight=1.0,
        random_state=42,
        n_jobs=1,
        eval_metric="mlogloss",
    )

    logistic_results = evaluate_model(
        "LogisticRegression",
        logistic_regression,
        x_train,
        x_val,
        y_train,
        y_val,
        class_names,
    )
    xgb_results = evaluate_model("XGBoost", xgboost, x_train, x_val, y_train, y_val, class_names)
    rf_results = evaluate_model("RandomForest", random_forest, x_train, x_val, y_train, y_val, class_names)
    ranked_results = [logistic_results, xgb_results, rf_results]

    results = {
        "dataset": str(DATASET_PATH),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "target": "severity",
        "feature_order": feature_order,
        "total_rows": int(len(x)),
        "train_size": int(len(x_train)),
        "validation_size": int(len(x_val)),
        "split_strategy": "explicit 80:20 train/test column" if has_explicit_split else "stratified train_test_split test_size=0.20",
        "models": ranked_results,
        "best_model": max(ranked_results, key=lambda item: (item["accuracy"], item["weighted_f1"]))["model"],
    }

    RESULTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with RESULTS_PATH.open("w", encoding="utf-8") as results_file:
        json.dump(results, results_file, indent=2)

    return results


if __name__ == "__main__":
    comparison = compare_models()
    print(f"Dataset: {comparison['dataset']}")
    print(f"Rows: {comparison['total_rows']} | Train: {comparison['train_size']} | Validation: {comparison['validation_size']}")
    for model in comparison["models"]:
        print(
            f"{model['model']}: accuracy={model['accuracy']:.4f}, "
            f"weighted_f1={model['weighted_f1']:.4f}, macro_f1={model['macro_f1']:.4f}"
        )
    print(f"Best model: {comparison['best_model']}")
    print(f"Saved results to: {RESULTS_PATH}")
