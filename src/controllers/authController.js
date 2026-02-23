const { registerUser, loginUser } = require("../services/authService");

async function register(req, res, next) {
  try {
    const result = await registerUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return res.status(200).json({ user: req.user });
}

module.exports = { register, login, me };
