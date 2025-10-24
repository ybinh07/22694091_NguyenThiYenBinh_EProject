const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: String },
  brand: { type: String },
  stock: { type: Number, required: true, default: 100 },
  createdAt: { type: Date, default: Date.now }
}, { collection: "products" });

module.exports = mongoose.model("Product", productSchema);
