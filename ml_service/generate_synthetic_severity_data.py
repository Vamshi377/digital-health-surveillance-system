from __future__ import annotations

import csv
import random
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_PATH = BASE_DIR / "data" / "severity_dataset.csv"

TOTAL_ROWS = 25_000
TRAIN_ROWS = 20_000
RANDOM_SEED = 42


DISEASES = {
    "dengue": {
        "symptoms": ["fever", "headache", "body_pain", "fatigue", "nausea", "rash"],
        "base_temp": (99.5, 102.8),
        "base_bp": (108, 142, 68, 90),
        "labs": ["platelets:low", "wbc:normal", "crp:positive"],
        "prevalence": 0.18,
        "base_risk": 0.40,
    },
    "influenza": {
        "symptoms": ["fever", "cough", "sore_throat", "fatigue", "body_pain", "runny_nose"],
        "base_temp": (99.2, 102.2),
        "base_bp": (110, 145, 70, 92),
        "labs": ["wbc:high", "crp:positive", "spo2:borderline"],
        "prevalence": 0.24,
        "base_risk": 0.35,
    },
    "malaria": {
        "symptoms": ["fever", "chills", "vomiting", "fatigue", "sweating", "headache"],
        "base_temp": (100.0, 103.5),
        "base_bp": (102, 138, 66, 88),
        "labs": ["parasite_test:positive", "hemoglobin:low", "bilirubin:high"],
        "prevalence": 0.13,
        "base_risk": 0.55,
    },
    "typhoid": {
        "symptoms": ["fever", "abdominal_pain", "diarrhea", "fatigue", "headache", "appetite_loss"],
        "base_temp": (99.4, 102.6),
        "base_bp": (106, 140, 68, 90),
        "labs": ["widal:positive", "wbc:borderline", "crp:positive"],
        "prevalence": 0.14,
        "base_risk": 0.45,
    },
    "cardio_respiratory_infection": {
        "symptoms": ["chest_pain", "breathlessness", "cough", "fatigue", "dizziness", "fever"],
        "base_temp": (99.0, 102.4),
        "base_bp": (118, 176, 76, 108),
        "labs": ["troponin:borderline", "d_dimer:high", "crp:positive"],
        "prevalence": 0.11,
        "base_risk": 0.75,
    },
    "gastro_enteric_fever": {
        "symptoms": ["nausea", "vomiting", "diarrhea", "fatigue", "abdominal_pain", "dehydration"],
        "base_temp": (98.9, 101.9),
        "base_bp": (98, 136, 62, 86),
        "labs": ["crp:positive", "electrolytes:borderline", "wbc:high"],
        "prevalence": 0.20,
        "base_risk": 0.42,
    },
}

HIGH_RISK_SYMPTOMS = {"chest_pain", "breathlessness", "confusion", "sweating", "dizziness"}
GENERAL_SYMPTOMS = [
    "confusion",
    "back_pain",
    "joint_pain",
    "weakness",
    "sneezing",
    "insomnia",
    "palpitations",
    "anxiety",
]
NORMAL_LABS = ["wbc:normal", "crp:negative", "spo2:normal", "hemoglobin:normal", "bilirubin:normal"]


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def choose_disease(rng: random.Random) -> str:
    names = list(DISEASES.keys())
    weights = [DISEASES[name]["prevalence"] for name in names]
    return rng.choices(names, weights=weights, k=1)[0]


def sample_age(rng: random.Random, disease_name: str) -> int:
    if disease_name == "cardio_respiratory_infection":
        age = int(round(rng.gauss(58, 16)))
    elif disease_name == "influenza":
        age = int(round(rng.gauss(34, 20)))
    elif disease_name == "dengue":
        age = int(round(rng.gauss(29, 15)))
    elif disease_name == "malaria":
        age = int(round(rng.gauss(31, 19)))
    elif disease_name == "typhoid":
        age = int(round(rng.gauss(27, 14)))
    else:
        age = int(round(rng.gauss(36, 22)))
    return clamp(age, 1, 90)


def choose_target_severity(rng: random.Random, disease_name: str, age: int) -> str:
    risk = DISEASES[disease_name]["base_risk"]
    if age >= 70:
        risk += 0.22
    elif age >= 55:
        risk += 0.13
    elif age <= 10:
        risk += 0.08
    risk = max(0.0, min(1.0, risk + rng.uniform(-0.04, 0.04)))

    low_prob = max(0.15, 0.52 - risk * 0.55)
    high_prob = max(0.12, 0.15 + risk * 0.55)
    moderate_prob = max(0.20, 1.0 - low_prob - high_prob)
    total = low_prob + moderate_prob + high_prob
    low_prob, moderate_prob, high_prob = low_prob / total, moderate_prob / total, high_prob / total
    return rng.choices(["low", "moderate", "high"], weights=[low_prob, moderate_prob, high_prob], k=1)[0]


def choose_symptoms(rng: random.Random, disease_name: str, target_severity: str) -> list[str]:
    disease_symptoms = list(DISEASES[disease_name]["symptoms"])
    count_ranges = {"low": (2, 4), "moderate": (3, 5), "high": (4, 6)}
    lower, upper = count_ranges[target_severity]
    symptoms = set(rng.sample(disease_symptoms, k=rng.randint(lower, min(upper, len(disease_symptoms)))))

    if target_severity == "high" and rng.random() < 0.86:
        symptoms.add(rng.choice(list(HIGH_RISK_SYMPTOMS)))
        if rng.random() < 0.45:
            symptoms.add("confusion")
    elif target_severity == "moderate" and rng.random() < 0.30:
        symptoms.add(rng.choice(["dizziness", "sweating"]))

    noise_count = 1 if rng.random() < 0.20 else 0
    if rng.random() < 0.06:
        noise_count += 1
    for _ in range(noise_count):
        symptoms.add(rng.choice(GENERAL_SYMPTOMS))

    return sorted(symptoms)


def choose_lab_results(rng: random.Random, disease_name: str, target_severity: str) -> list[str]:
    disease_labs = list(DISEASES[disease_name]["labs"])
    chosen: list[str] = []

    if target_severity == "low":
        chosen.extend(rng.sample(NORMAL_LABS, k=2))
        if rng.random() < 0.35:
            chosen.append(rng.choice(["crp:weak_positive", "wbc:borderline", "platelets:low"]))
    elif target_severity == "moderate":
        chosen.extend(rng.sample(disease_labs, k=2))
        chosen.append(rng.choice(["wbc:high", "crp:positive", "spo2:borderline", "troponin:borderline"]))
        if rng.random() < 0.28:
            chosen.append(rng.choice(NORMAL_LABS))
    else:
        chosen.extend(rng.sample(disease_labs, k=min(3, len(disease_labs))))
        chosen.extend(rng.sample(["troponin:positive", "d_dimer:high", "crp:positive", "spo2:low"], k=2))
        if rng.random() < 0.18:
            chosen.append(rng.choice(NORMAL_LABS))

    if rng.random() < 0.03:
        chosen.append(rng.choice(["wbc:normal", "crp:negative", "spo2:normal"]))
    return sorted(set(chosen))


def choose_bp_and_temp(rng: random.Random, disease_name: str, target_severity: str, age: int) -> tuple[float, str]:
    temp_low, temp_high = DISEASES[disease_name]["base_temp"]
    sys_low, sys_high, dia_low, dia_high = DISEASES[disease_name]["base_bp"]

    if target_severity == "low":
        temperature = rng.uniform(max(97.9, temp_low - 1.1), temp_low + 1.0)
        systolic = rng.randint(clamp(sys_low - 8, 88, 170), clamp(sys_low + 14, 100, 180))
        diastolic = rng.randint(clamp(dia_low - 6, 56, 102), clamp(dia_low + 10, 62, 110))
    elif target_severity == "moderate":
        temperature = rng.uniform(temp_low + 0.2, min(102.6, temp_high + 0.3))
        systolic = rng.randint(clamp(sys_low + 2, 94, 178), clamp(sys_high - 4, 104, 186))
        diastolic = rng.randint(clamp(dia_low + 1, 60, 108), clamp(dia_high - 1, 67, 114))
    else:
        temperature = rng.uniform(max(100.0, temp_high - 1.0), min(104.3, temp_high + 1.1))
        systolic = rng.randint(clamp(sys_high - 6, 108, 186), clamp(sys_high + 16, 120, 206))
        diastolic = rng.randint(clamp(dia_high - 4, 70, 112), clamp(dia_high + 12, 80, 124))

    if age >= 65:
        systolic += rng.randint(3, 10)
        diastolic += rng.randint(1, 6)
    elif age <= 10:
        systolic -= rng.randint(2, 6)
        diastolic -= rng.randint(1, 4)

    if rng.random() < 0.04:
        temperature += rng.uniform(-0.4, 0.4)
    if rng.random() < 0.04:
        systolic += rng.randint(-8, 8)
        diastolic += rng.randint(-5, 5)

    systolic = clamp(systolic, 82, 210)
    diastolic = clamp(diastolic, 50, 130)
    return round(temperature, 1), f"{systolic}/{diastolic}"


def determine_severity(
    rng: random.Random,
    disease_name: str,
    age: int,
    symptoms: list[str],
    temperature: float,
    bp: str,
    lab_results: list[str],
) -> str:
    systolic, diastolic = [int(part) for part in bp.split("/", maxsplit=1)]
    high_risk_count = sum(1 for symptom in symptoms if symptom in HIGH_RISK_SYMPTOMS)
    abnormal_labs = sum(
        1
        for item in lab_results
        if any(marker in item for marker in ("high", "positive", "weak_positive", "borderline", "low"))
    )

    score = 0.0
    if age >= 65:
        score += 1.4
    elif age <= 10:
        score += 0.5
    if temperature >= 102.0:
        score += 2.1
    elif temperature >= 100.0:
        score += 1.0
    if systolic >= 160 or diastolic >= 100:
        score += 1.9
    elif systolic >= 140 or diastolic >= 90:
        score += 0.9

    score += high_risk_count * 1.8
    score += abnormal_labs * 0.85
    score += DISEASES[disease_name]["base_risk"] * 1.2

    score += rng.gauss(0.0, 0.30)
    if rng.random() < 0.02:
        score -= rng.uniform(0.3, 0.8)
    if rng.random() < 0.02:
        score += rng.uniform(0.2, 0.7)

    if score >= 7.1:
        return "high"
    if score >= 4.6:
        return "moderate"
    return "low"


def generate_row(rng: random.Random, index: int) -> dict[str, str]:
    disease_name = choose_disease(rng)
    age = sample_age(rng, disease_name)
    target_severity = choose_target_severity(rng, disease_name, age)
    symptoms = choose_symptoms(rng, disease_name, target_severity)
    temperature, bp = choose_bp_and_temp(rng, disease_name, target_severity, age)
    lab_results = choose_lab_results(rng, disease_name, target_severity)
    severity = determine_severity(rng, disease_name, age, symptoms, temperature, bp, lab_results)

    if rng.random() < 0.01:
        severity = rng.choice(["low", "moderate", "high"])

    return {
        "record_id": str(index),
        "age": str(age),
        "symptoms": ";".join(symptoms),
        "temperature": f"{temperature:.1f}",
        "bp": bp,
        "lab_results": ";".join(lab_results),
        "disease": disease_name,
        "severity": severity,
        "split": "train" if index <= TRAIN_ROWS else "test",
    }


def main() -> None:
    rng = random.Random(RANDOM_SEED)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = ["record_id", "age", "symptoms", "temperature", "bp", "lab_results", "disease", "severity", "split"]
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as dataset_file:
        writer = csv.DictWriter(dataset_file, fieldnames=fieldnames)
        writer.writeheader()
        for index in range(1, TOTAL_ROWS + 1):
            writer.writerow(generate_row(rng, index))

    print(f"Generated {TOTAL_ROWS} severity records at {OUTPUT_PATH}")
    print(f"Train rows: {TRAIN_ROWS}")
    print(f"Test rows: {TOTAL_ROWS - TRAIN_ROWS}")


if __name__ == "__main__":
    main()
