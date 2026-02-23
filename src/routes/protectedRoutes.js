const express = require("express");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/rbac");

const router = express.Router();

router.get("/doctor-dashboard", authenticate, authorize("doctor", "admin"), (req, res) => {
  return res.status(200).json({
    message: "Protected doctor/admin resource accessed successfully",
    user: req.user
  });
});

module.exports = router;