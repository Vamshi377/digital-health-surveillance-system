const mongoose = require("mongoose");
const env = require("./env");

async function connectDatabase() {
  await mongoose.connect(env.mongoUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000
  });
}

module.exports = { connectDatabase };
