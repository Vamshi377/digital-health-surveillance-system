const {
  createUserByAdmin,
  updateUserRole,
  updateUserStatus,
  listUsers,
  reviewUserApproval
} = require("../services/adminService");
const { listAuditLogs } = require("../services/auditService");

async function createUserHandler(req, res, next) {
  try {
    const user = await createUserByAdmin(req.body);
    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
}

async function updateUserRoleHandler(req, res, next) {
  try {
    const user = await updateUserRole(req.params.userId, req.body);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

async function updateUserStatusHandler(req, res, next) {
  try {
    const user = await updateUserStatus(req.params.userId, req.body);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

async function listUsersHandler(req, res, next) {
  try {
    const users = await listUsers(req.query);
    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
}

async function reviewUserApprovalHandler(req, res, next) {
  try {
    const user = await reviewUserApproval(req.params.userId, req.body, req.user);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

async function listAuditLogsHandler(req, res, next) {
  try {
    const logs = await listAuditLogs(req.query);
    return res.status(200).json({ logs });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createUserHandler,
  updateUserRoleHandler,
  updateUserStatusHandler,
  listUsersHandler,
  reviewUserApprovalHandler,
  listAuditLogsHandler
};
