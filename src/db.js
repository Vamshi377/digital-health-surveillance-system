const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const { dbPath, seedAdmin } = require("./config");

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN (
        'receptionist','nurse','doctor','lab_technician','patient','government_officer','admin'
      )),
      is_active INTEGER NOT NULL DEFAULT 1,
      patient_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      address TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS vitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      recorded_by INTEGER NOT NULL,
      symptoms TEXT NOT NULL,
      temperature REAL NOT NULL,
      bp_systolic INTEGER NOT NULL,
      bp_diastolic INTEGER NOT NULL,
      pulse INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(recorded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS lab_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      ordered_by INTEGER NOT NULL,
      test_name TEXT NOT NULL,
      instructions TEXT,
      status TEXT NOT NULL DEFAULT 'ordered' CHECK(status IN ('ordered','completed')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(ordered_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS lab_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab_order_id INTEGER NOT NULL UNIQUE,
      uploaded_by INTEGER NOT NULL,
      result_summary TEXT NOT NULL,
      report_data TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(lab_order_id) REFERENCES lab_orders(id),
      FOREIGN KEY(uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS diagnoses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      diagnosis_text TEXT NOT NULL,
      severity_level TEXT NOT NULL CHECK(severity_level IN ('low','moderate','high','critical')),
      prescription TEXT NOT NULL,
      follow_up_date TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(doctor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id)
    );
  `);

  const existingAdmin = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(seedAdmin.username);

  if (!existingAdmin) {
    const hash = bcrypt.hashSync(seedAdmin.password, 10);
    db.prepare(
      `INSERT INTO users (full_name, username, password_hash, role, is_active)
       VALUES (?, ?, ?, 'admin', 1)`
    ).run(seedAdmin.fullName, seedAdmin.username, hash);
  }
}

function getUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

module.exports = {
  db,
  initDb,
  getUserById
};
