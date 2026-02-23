const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/digital_health_records",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://127.0.0.1:8000",
  mlServiceApiKey: process.env.ML_SERVICE_API_KEY || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
};

module.exports = env;
