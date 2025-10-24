require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3001,

  // MongoDB connection
  mongoURI: process.env.MONGODB_URI || process.env.MONGODB_PRODUCT_URI || "mongodb://localhost:27017/product_db",

  // RabbitMQ connection
  rabbitMQUrl: process.env.RABBITMQ_URI || "amqp://localhost:5672",

  // JWT secret (cực quan trọng để verify token)
  jwtSecret: process.env.JWT_SECRET || "superSecretKey_Yb230704",

  // Queue config
  exchangeName: "products_exchange",
  queueName: "products_queue",
};
