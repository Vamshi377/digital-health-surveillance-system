# Contributing

Thanks for improving the Digital Health Record + ML Disease Surveillance System. This short guide covers local setup, branch conventions, and expectations for pull requests.

## 1. Fork & clone

```bash
git clone https://github.com/<your-user>/digital-health-surveillance-system.git
cd digital-health-surveillance-system
```

Follow [deployment.md](./deployment.md) for the full install, `.env`, and seed steps.

## 2. Branch naming

Use short, kebab-case, scoped branches:

- `feat/<scope>-<short-desc>` — e.g. `feat/dmo-week-compare`
- `fix/<scope>-<short-desc>` — e.g. `fix/nurse-duplicate-record`
- `docs/<short-desc>` — e.g. `docs/add-api-reference`
- `chore/<short-desc>` — build/deps/tooling

Never push directly to `main`.

## 3. Commit messages

Conventional-style is preferred:

```
feat(clinical): allow doctor to edit prescription before submit
fix(ml): handle missing bp field gracefully
docs: add data-models reference
```

Keep commits focused and runnable in isolation.

## 4. Running locally

See [deployment.md](./deployment.md). Minimum checks before opening a PR:

```bash
# Backend boot
npm run dev

# Frontend boot
cd frontend && npm run dev

# ML service boot (only if you changed ml_service/)
cd ml_service && source .venv/bin/activate && uvicorn app:app --reload
```

Smoke-test the path you changed using the demo accounts or the Postman collection (`postman/Digital-Health-System.postman_collection.json`).

## 5. Code style

- Backend: CommonJS (`require`/`module.exports`), 2-space indent, single quotes optional — match the surrounding file.
- Frontend: ES modules + JSX, functional components, hooks.
- Prefer small services in `src/services/` over inflating controllers.
- Add indexes in the Mongoose schema for new query shapes you introduce.

## 6. Adding a new role or endpoint

1. If adding a role, update `USER_ROLES` and `APPROVER_BY_ROLE` in [`src/utils/roles.js`](../src/utils/roles.js).
2. Add/adjust route in `src/routes/` with explicit `authorize(...roles)`.
3. Document it in [`docs/roles-and-permissions.md`](./roles-and-permissions.md) and [`docs/api-reference.md`](./api-reference.md).
4. Add/adjust a seed entry in `src/scripts/seedDemoData.js` so demos still work.

## 7. Adding a new ML feature

1. Extend the CSV in `ml_service/data/` using the guide in `ml_service/data/DATASET_GUIDE.md`.
2. Update `featurize_record` in `ml_service/model_utils.py`.
3. Delete `ml_service/artifacts/severity_model.joblib` so the next boot retrains.
4. Update [`docs/ml-service.md`](./ml-service.md) with the new feature.

## 8. Documentation changes

- Put new pages under `docs/` and link them from `docs/README.md`.
- Use relative links to source files so readers can jump into the code.

## 9. Opening a PR

- Target `main`.
- Fill in a concise summary, test plan, and screenshots/GIFs for frontend changes.
- Keep PRs scoped — ideally < 400 lines of diff.

## 10. Reporting bugs

Open a GitHub issue with:

- Expected vs actual behaviour.
- Steps to reproduce (include role + seed state).
- Relevant log output from the affected terminal (backend / ML / frontend).
