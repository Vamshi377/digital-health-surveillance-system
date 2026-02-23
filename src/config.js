const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const rootDir = path.resolve(__dirname, "..");

module.exports = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  dbPath: path.resolve(rootDir, process.env.DB_PATH || "./data/health_system.db"),
  seedAdmin: {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin123",
    fullName: process.env.ADMIN_NAME || "System Admin"
  }
};
