const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "staff", "customer"], default: "customer" },
  createdAt: { type: Date, default: Date.now }
}, { collection: "users" });

module.exports = mongoose.model("User", userSchema);
