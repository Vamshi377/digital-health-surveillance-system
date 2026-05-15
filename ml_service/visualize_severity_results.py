from __future__ import annotations

import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
COMPARISON_PATH = BASE_DIR / "artifacts" / "severity_model_comparison.json"
METRICS_PATH = BASE_DIR / "artifacts" / "severity_metrics.json"
HTML_PATH = BASE_DIR / "artifacts" / "severity_visualization.html"
TEXT_PATH = BASE_DIR / "artifacts" / "severity_summary.txt"


def percent(value: float) -> str:
    return f"{value * 100:.2f}%"


def make_accuracy_svg(models: list[dict[str, object]]) -> str:
    width = 820
    height = 340
    chart_x = 180
    chart_y = 50
    bar_height = 50
    gap = 40
    max_bar_width = 560

    lines = [
        f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
        '<rect x="0" y="0" width="100%" height="100%" fill="#f8fafc"/>',
        '<text x="20" y="30" font-size="20" font-family="Segoe UI, Arial, sans-serif" fill="#0f172a">Model Accuracy Comparison</text>',
        f'<line x1="{chart_x}" y1="{chart_y - 10}" x2="{chart_x}" y2="{height - 35}" stroke="#64748b" stroke-width="1"/>',
        f'<line x1="{chart_x}" y1="{height - 35}" x2="{chart_x + max_bar_width + 12}" y2="{height - 35}" stroke="#64748b" stroke-width="1"/>',
    ]

    for index, model in enumerate(models):
        y = chart_y + index * (bar_height + gap)
        accuracy = float(model.get("accuracy", 0.0))
        bar_width = int(max_bar_width * accuracy)
        label = str(model.get("model", "Unknown"))
        color = "#2563eb" if "random" in label.lower() else "#16a34a"

        lines.extend(
            [
                f'<text x="20" y="{y + 32}" font-size="16" font-family="Segoe UI, Arial, sans-serif" fill="#1e293b">{label}</text>',
                f'<rect x="{chart_x}" y="{y}" width="{bar_width}" height="{bar_height}" fill="{color}" rx="6" ry="6"/>',
                f'<text x="{chart_x + bar_width + 10}" y="{y + 32}" font-size="15" font-family="Segoe UI, Arial, sans-serif" fill="#0f172a">{percent(accuracy)}</text>',
            ]
        )

    lines.append("</svg>")
    return "\n".join(lines)


def make_confusion_table(report: dict[str, object]) -> str:
    rows = []
    classes = [key for key in report.keys() if key not in {"accuracy", "macro avg", "weighted avg"}]
    for class_name in classes:
        metrics = report[class_name]
        rows.append(
            "<tr>"
            f"<td>{class_name}</td>"
            f"<td>{float(metrics['precision']):.4f}</td>"
            f"<td>{float(metrics['recall']):.4f}</td>"
            f"<td>{float(metrics['f1-score']):.4f}</td>"
            f"<td>{int(metrics['support'])}</td>"
            "</tr>"
        )
    return "\n".join(rows)


def make_summary_metric_cards(metrics: dict[str, object]) -> str:
    report = metrics.get("classification_report", {})
    macro_avg = report.get("macro avg", {})
    weighted_avg = report.get("weighted avg", {})
    cards = [
        ("Accuracy", percent(float(metrics.get("accuracy", 0.0)))),
        ("Macro F1", f"{float(macro_avg.get('f1-score', 0.0)):.4f}"),
        ("Weighted F1", f"{float(weighted_avg.get('f1-score', 0.0)):.4f}"),
        ("Validation Size", str(int(metrics.get("validation_size", 0)))),
    ]
    return "\n".join(
        [
            "<div class=\"metric-grid\">",
            *[
                (
                    "<div class=\"metric-card\">"
                    f"<div class=\"metric-label\">{label}</div>"
                    f"<div class=\"metric-value\">{value}</div>"
                    "</div>"
                )
                for label, value in cards
            ],
            "</div>",
        ]
    )


def main() -> None:
    if not COMPARISON_PATH.exists():
        raise FileNotFoundError(
            f"Missing comparison file: {COMPARISON_PATH}. Run compare_severity_models.py first."
        )

    data = json.loads(COMPARISON_PATH.read_text(encoding="utf-8"))
    if not METRICS_PATH.exists():
        raise FileNotFoundError(
            f"Missing metrics file: {METRICS_PATH}. Run train.py or app.py first."
        )

    deployed_metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
    models = data.get("models", [])
    if len(models) < 2:
        raise ValueError("Expected at least two model results in severity_model_comparison.json")

    best_model = str(data.get("best_model", "Unknown"))
    accuracy_svg = make_accuracy_svg(models)
    deployed_metric_cards = make_summary_metric_cards(deployed_metrics)

    xgboost_row = next((item for item in models if str(item.get("model", "")).lower() == "xgboost"), models[0])
    class_rows = make_confusion_table(xgboost_row["classification_report"])
    deployed_rows = make_confusion_table(deployed_metrics["classification_report"])

    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Severity Model Visualization</title>
  <style>
    body {{
      margin: 24px;
      font-family: Segoe UI, Arial, sans-serif;
      background: #eef2ff;
      color: #0f172a;
    }}
    .card {{
      background: #ffffff;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
    }}
    h1, h2 {{
      margin: 0 0 12px 0;
    }}
    table {{
      border-collapse: collapse;
      width: 100%;
    }}
    th, td {{
      border: 1px solid #cbd5e1;
      padding: 10px;
      text-align: center;
    }}
    th {{
      background: #dbeafe;
    }}
    .highlight {{
      font-size: 18px;
      font-weight: 600;
      color: #1e3a8a;
    }}
    .metric-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }}
    .metric-card {{
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 14px;
    }}
    .metric-label {{
      font-size: 13px;
      color: #475569;
      margin-bottom: 6px;
    }}
    .metric-value {{
      font-size: 22px;
      font-weight: 700;
      color: #1e3a8a;
    }}
  </style>
</head>
<body>
  <div class="card">
    <h1>Severity Prediction Model Comparison</h1>
    <p><strong>Dataset:</strong> {data.get("dataset", "")}</p>
    <p><strong>Split:</strong> {data.get("train_size", 0)} train / {data.get("validation_size", 0)} test</p>
    <p class="highlight">Best model: {best_model}</p>
  </div>

  <div class="card">
    <h2>Accuracy Visualization</h2>
    {accuracy_svg}
  </div>

  <div class="card">
    <h2>Deployed Project Model Metrics</h2>
    <p><strong>Model used in project:</strong> XGBoost</p>
    <p><strong>Dataset:</strong> {deployed_metrics.get("dataset", "")}</p>
    <p><strong>Split:</strong> {deployed_metrics.get("train_size", 0)} train / {deployed_metrics.get("validation_size", 0)} test ({deployed_metrics.get("split_strategy", "")})</p>
    <p><strong>Trained at:</strong> {deployed_metrics.get("trained_at", "")}</p>
    {deployed_metric_cards}
    <table style="margin-top: 16px;">
      <thead>
        <tr>
          <th>Class</th>
          <th>Precision</th>
          <th>Recall</th>
          <th>F1-score</th>
          <th>Support</th>
        </tr>
      </thead>
      <tbody>
        {deployed_rows}
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>XGBoost Class-wise Metrics</h2>
    <table>
      <thead>
        <tr>
          <th>Class</th>
          <th>Precision</th>
          <th>Recall</th>
          <th>F1-score</th>
          <th>Support</th>
        </tr>
      </thead>
      <tbody>
        {class_rows}
      </tbody>
    </table>
  </div>
</body>
</html>
"""
    HTML_PATH.write_text(html, encoding="utf-8")

    summary_lines = [
        "Severity Model Comparison Summary",
        f"Dataset: {data.get('dataset', '')}",
        f"Split: {data.get('train_size', 0)} train / {data.get('validation_size', 0)} test",
    ]
    for model in models:
        summary_lines.append(
            f"{model['model']}: accuracy={percent(float(model['accuracy']))}, "
            f"macro_f1={float(model['macro_f1']):.4f}, weighted_f1={float(model['weighted_f1']):.4f}"
        )
    summary_lines.append(f"Best model: {best_model}")
    summary_lines.append(
        "Deployed project model: "
        f"XGBoost accuracy={percent(float(deployed_metrics.get('accuracy', 0.0)))}, "
        f"macro_f1={float(deployed_metrics['classification_report']['macro avg']['f1-score']):.4f}, "
        f"weighted_f1={float(deployed_metrics['classification_report']['weighted avg']['f1-score']):.4f}"
    )
    summary_lines.append(f"HTML visualization: {HTML_PATH}")

    TEXT_PATH.write_text("\n".join(summary_lines) + "\n", encoding="utf-8")

    print(f"Visualization generated: {HTML_PATH}")
    print(f"Summary generated: {TEXT_PATH}")


if __name__ == "__main__":
    main()
