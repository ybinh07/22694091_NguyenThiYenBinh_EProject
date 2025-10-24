const express = require("express");
const mongoose = require("mongoose");
const config = require("./config");
const authMiddleware = require("./middlewares/authMiddleware");
const AuthController = require("./controllers/authController");
const morgan = require("morgan");
const cors = require("cors");

class App {
  constructor() {
    this.app = express();
    this.authController = new AuthController();
    this.connectDB();
    this.setMiddlewares();
    this.setRoutes();
  }

  async connectDB() {
    try {
      await mongoose.connect(config.mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB connected");
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err.message);
      process.exit(1);
    }
  }

  setMiddlewares() {
    this.app.use(express.json());
    this.app.use(cors());
    this.app.use(morgan("dev"));
  }

  setRoutes() {
    // Auth routes có prefix /api
    this.app.post("/api/login", (req, res) => this.authController.login(req, res));
    this.app.post("/api/register", (req, res) => this.authController.register(req, res));
    this.app.get("/api/profile", authMiddleware, (req, res) => this.authController.getProfile(req, res));
    this.app.get("/api/dashboard", authMiddleware, (req, res) => res.json({ message: "Welcome to dashboard" }));
  }

  start() {
    this.server = this.app.listen(3000, () => console.log("🚀 Auth Service started on port 3000"));
  }
}

module.exports = App;
