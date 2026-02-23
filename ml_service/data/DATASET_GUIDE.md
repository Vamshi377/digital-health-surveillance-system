# Dataset Guide for Severity Model

## Current State

`demo_dataset.csv` is a synthetic/demo dataset used to validate the pipeline and API integration.

It is not sufficient for true clinical-grade deployment accuracy.

## Required Schema

Columns expected by `train.py`:
- `age` (integer)
- `symptoms` (semicolon-separated tokens)
- `temperature` (float)
- `bp` (format: `systolic/diastolic`)
- `lab_results` (semicolon-separated key:value tokens)
- `disease` (doctor-confirmed disease label text)
- `severity` (`low`, `moderate`, `high`, optional legacy `critical`)

## Label Policy

System output classes are:
- `low`
- `moderate`
- `high`

Any legacy `critical` labels are normalized to `high` in training.

## Recommended Production Dataset Quality

- At least 5,000 labeled records initially
- Balanced severity classes (or use class weighting if imbalance exists)
- Multi-site and multi-season data
- Remove direct identifiers (name/phone/address)
- Consistent unit normalization for vitals and labs

## Retraining

```bash
cd ml_service
python train.py
```

Check metrics:
- `ml_service/artifacts/severity_metrics.json`
