const express = require("express");
const { db } = require("../db");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");

const router = express.Router();

router.use(authenticate, authorize("dmo", "hospital_admin"));

router.get("/trends", (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.address,
              d.severity_level,
              COUNT(*) AS cases
       FROM diagnoses d
       JOIN patients p ON p.id = d.patient_id
       GROUP BY p.address, d.severity_level
       ORDER BY p.address, d.severity_level`
    )
    .all();

  const grouped = rows.reduce((acc, row) => {
    if (!acc[row.address]) {
      acc[row.address] = {
        low: 0,
        moderate: 0,
        high: 0,
        critical: 0,
        total: 0
      };
    }
    acc[row.address][row.severity_level] = row.cases;
    acc[row.address].total += row.cases;
    return acc;
  }, {});

  return res.json({ trendsByAddress: grouped });
});

module.exports = router;
