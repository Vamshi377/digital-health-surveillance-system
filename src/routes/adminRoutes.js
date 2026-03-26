const express = require("express");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/rbac");
const {
  createUserHandler,
  updateUserRoleHandler,
  updateUserStatusHandler,
  listUsersHandler,
  reviewUserApprovalHandler
} = require("../controllers/adminController");

const router = express.Router();

router.use(authenticate, authorize("hospital_admin", "medical_superintendent", "dmo"));

router.get("/users", listUsersHandler);
router.patch("/users/:userId/approval", reviewUserApprovalHandler);
router.use(authorize("hospital_admin", "dmo"));
router.post("/users", createUserHandler);
router.patch("/users/:userId/role", updateUserRoleHandler);
router.patch("/users/:userId/status", updateUserStatusHandler);

module.exports = router;
