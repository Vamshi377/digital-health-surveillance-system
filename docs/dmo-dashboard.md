# DMO dashboard

The DMO (District Medical Officer) dashboard turns individual-level doctor-confirmed predictions into district-level public health intelligence.

- Frontend: [`frontend/src/pages/DMODashboard.jsx`](../frontend/src/pages/DMODashboard.jsx)
- Backend: [`src/controllers/analyticsController.js`](../src/controllers/analyticsController.js), [`src/services/analyticsService.js`](../src/services/analyticsService.js)
- Endpoints: `/api/analytics/dmo/overview`, `/api/analytics/dmo/disease-burden`, `/api/analytics/dmo/patient-cluster`

## Key features

- **Real-time auto refresh** (configurable interval).
- **Outbreak alerts** — generated when a `(disease, area)` pair exceeds the threshold (>5 cases) in the active time window.
- **Live alert feed** — quick operational summary of districts needing attention.
- **Hotspot ranking** — ranks areas by total cases and severe case count.
- **33-district burden table** — per-district totals across severity buckets and a `priority` score.
- **Telangana choropleth map** — district polygons coloured by case burden; hover tooltip + click popup with Active / Low / Moderate / High / Priority. Click also updates a summary panel below the map.
- **Severity-by-area** (stacked bar) and **severity distribution** (pie).
- **Cases trend over time** (line) and **top diseases** (ranked list).
- **Week-over-week comparison** (rising/falling indicator).
- **Patient cluster modal** — per-disease, per-area patient list for field action.
- **Filters** — district, area, disease, date range.

## Demo mode vs Live mode

| Mode | Data source | When to use |
| --- | --- | --- |
| Demo | Generated rows across all Telangana districts (seeded via `npm run seed:dmo-mock`) | Presentations / classroom demos where real records are sparse |
| Live | Actual `Prediction` documents from MongoDB | Production / realistic monitoring |

If only one district shows data in Live mode on a fresh clone, re-run:

```bash
npm run seed:dmo-mock
```

and refresh the DMO dashboard.

## Aggregations

Analytics run on `Prediction` joined with `Patient` geography. The main groupings are:

- `by district` — totals + severity split + priority score.
- `by (district, area, disease)` — outbreak alert candidates.
- `by disease` — top disease ranking.
- `by day` — trend line.
- `week vs previous week` — comparison.

See [`src/services/analyticsService.js`](../src/services/analyticsService.js) for the exact aggregation pipelines.

## Important properties of DMO data

- DMO data is **not** raw hospital data — it is **post-diagnosis** prediction data. This means every data point has already passed through nurse, lab, and doctor, giving each record clinical context.
- Because it relies on doctor diagnosis, the pipeline is resilient to noise from incomplete records.
- `priority` is a combined indicator of high-severity volume within an area.
