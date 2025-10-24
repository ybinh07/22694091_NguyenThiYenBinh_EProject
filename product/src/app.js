const express = require("express");
const mongoose = require("mongoose");
const config = require("./config");
const messageBroker = require("./utils/messageBroker");
const productsRouter = require("./routes/productRoutes");
const ProductController = require("./controllers/productController");
const cors = require("cors");
const morgan = require("morgan");

require("dotenv").config();

class App {
  constructor() {
    this.app = express();
    this.controller = new ProductController();
    messageBroker.setProductController(this.controller);
    this.connectDB();
    this.setMiddlewares();
    this.setRoutes();
    this.setupMessageBroker();
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

  async disconnectDB() {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }

  setMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cors());
    this.app.use(morgan("dev"));
  }

  setRoutes() {
    // Routes chính của Product service
    this.app.use("/api", productsRouter);

    // Route test health
    this.app.get("/health", (req, res) => res.json({ ok: true }));
  }

  setupMessageBroker() {
    messageBroker.connect();
  }

  start() {
    this.server = this.app.listen(config.port, () =>
      console.log(`🚀 Product Service started on port ${config.port}`)
    );
  }

  async stop() {
    if (this.server) {
      this.server.close();
      console.log("HTTP server closed");
    }
    await mongoose.disconnect();
  }
}

module.exports = App;
