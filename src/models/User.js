const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { USER_ROLES, APPROVAL_STATUSES, normalizeRole } = require("../utils/roles");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: 20,
      default: ""
    },
    hospitalId: {
      type: String,
      trim: true,
      default: ""
    },
    hospitalName: {
      type: String,
      trim: true,
      default: ""
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "doctor",
      index: true
    },
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: "PENDING",
      index: true
    },
    approvalRemarks: {
      type: String,
      trim: true,
      default: ""
    },
    approvalReviewedAt: {
      type: Date,
      default: null
    },
    approvalReviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    roleProfile: {
      registrationNumber: { type: String, trim: true, default: "" },
      qualification: { type: String, trim: true, default: "" },
      specialization: { type: String, trim: true, default: "" },
      yearsOfExperience: { type: Number, default: null },
      nursingRegistrationNumber: { type: String, trim: true, default: "" },
      certificationId: { type: String, trim: true, default: "" },
      labType: { type: String, trim: true, default: "" },
      highestQualification: { type: String, trim: true, default: "" },
      basicExperience: { type: Number, default: null },
      employeeId: { type: String, trim: true, default: "" },
      officialEmail: { type: String, trim: true, default: "" },
      departmentAuthority: { type: String, trim: true, default: "" }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ role: 1, approvalStatus: 1 });

userSchema.pre("validate", function normalizeUserRole(next) {
  this.role = normalizeRole(this.role);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 12);
};

const User = mongoose.model("User", userSchema);

module.exports = { User, USER_ROLES };
