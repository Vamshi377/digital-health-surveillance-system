const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/database");

async function startServer() {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      console.log(`Digital Health Record API running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
