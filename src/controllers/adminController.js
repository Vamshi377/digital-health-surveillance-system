const {
  createUserByAdmin,
  updateUserRole,
  updateUserStatus,
  listUsers
} = require("../services/adminService");

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
    const users = await listUsers();
    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createUserHandler,
  updateUserRoleHandler,
  updateUserStatusHandler,
  listUsersHandler
};
