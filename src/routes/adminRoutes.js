const express = require("express");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/rbac");
const {
  createUserHandler,
  updateUserRoleHandler,
  updateUserStatusHandler,
  listUsersHandler
} = require("../controllers/adminController");

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/users", listUsersHandler);
router.post("/users", createUserHandler);
router.patch("/users/:userId/role", updateUserRoleHandler);
router.patch("/users/:userId/status", updateUserStatusHandler);

module.exports = router;
