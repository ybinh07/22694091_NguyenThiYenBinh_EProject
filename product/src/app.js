const express = require("express");
const mongoose = require("mongoose");
const config = require("./config");
const messageBroker = require("./utils/messageBroker");
const productsRouter = require("./routes/productRoutes");
const ProductController = require("./controllers/productController");

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
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  }

  async disconnectDB() {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }

  setMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  setRoutes() {
    this.app.use("/api/products", productsRouter);
  }

  setupMessageBroker() {
    messageBroker.connect();
  }

  start() {
    this.server = this.app.listen(config.port, () =>
      console.log(`Server started on port ${config.port}`)
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
