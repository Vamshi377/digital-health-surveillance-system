from __future__ import annotations

import hashlib
from typing import Dict, List, Tuple


HIGH_RISK_SYMPTOMS = {
    "chest_pain",
    "breathlessness",
    "confusion",
    "sweating",
    "dizziness",
}


def parse_bp(bp_value: str) -> Tuple[int, int]:
    if not bp_value or "/" not in bp_value:
        raise ValueError("bp must be in systolic/diastolic format, e.g. 120/80")

    systolic_raw, diastolic_raw = bp_value.split("/", maxsplit=1)
    return int(systolic_raw.strip()), int(diastolic_raw.strip())


def split_tokens(raw_value: str) -> List[str]:
    if not raw_value:
        return []

    normalized = raw_value.replace(",", ";")
    return [token.strip().lower() for token in normalized.split(";") if token.strip()]


def count_abnormal_labs(lab_results: str) -> int:
    abnormal_markers = {
        "high",
        "positive",
        "weak_positive",
        "borderline",
    }

    count = 0
    for token in split_tokens(lab_results):
        parts = token.split(":", maxsplit=1)
        value = parts[1].strip() if len(parts) == 2 else parts[0]
        if value in abnormal_markers:
            count += 1
    return count


def featurize_record(
    *,
    age: int,
    temperature: float,
    bp: str,
    lab_results: str,
    symptoms: str,
    disease_name: str = "",
) -> Dict[str, float]:
    systolic, diastolic = parse_bp(bp)
    symptom_tokens = split_tokens(symptoms)
    high_risk_count = sum(1 for symptom in symptom_tokens if symptom in HIGH_RISK_SYMPTOMS)
    abnormal_lab_count = count_abnormal_labs(lab_results)
    normalized_disease = str(disease_name or "").strip().lower()

    # Stable numeric embedding from disease text so model can learn disease-specific severity patterns.
    digest = hashlib.sha256(normalized_disease.encode("utf-8")).hexdigest()
    disease_hash_scaled = int(digest[:8], 16) / float(0xFFFFFFFF)

    return {
        "age": float(age),
        "temperature": float(temperature),
        "bp_systolic": float(systolic),
        "bp_diastolic": float(diastolic),
        "symptom_count": float(len(symptom_tokens)),
        "high_risk_symptom_count": float(high_risk_count),
        "abnormal_lab_count": float(abnormal_lab_count),
        "disease_hash": float(disease_hash_scaled),
        "disease_name_length": float(len(normalized_disease)),
        "is_dengue": 1.0 if "dengue" in normalized_disease else 0.0,
        "is_malaria": 1.0 if "malaria" in normalized_disease else 0.0,
        "is_typhoid": 1.0 if "typhoid" in normalized_disease else 0.0,
        "is_influenza": 1.0 if "influenza" in normalized_disease or "flu" in normalized_disease else 0.0,
    }
