const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.resolve(__dirname, "..", "..", "uploads", "lab-reports");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const allowedMimes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf"
]);

const uploadLabReportImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      cb(new Error("Only png/jpg/jpeg/pdf files are allowed"));
      return;
    }
    cb(null, true);
  }
});

module.exports = { uploadLabReportImage };
