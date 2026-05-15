const express = require("express");
const authController = require("../controllers/authController");
const { selfRegisterPatientHandler } = require("../controllers/clinicalController");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

router.post("/register", authController.register);
router.post("/patient/register", selfRegisterPatientHandler);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPasswordHandler);
router.get("/me", authenticate, authController.me);

module.exports = router;
