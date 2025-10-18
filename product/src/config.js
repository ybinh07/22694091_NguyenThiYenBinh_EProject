require("dotenv").config();

module.exports = {
  port: 3001,
  mongoURI: process.env.MONGODB_PRODUCT_URI || "mongodb://localhost/products",
  rabbitMQUrl: process.env.RABBITMQ_URI || "amqp://localhost:5672",
  exchangeName: "products",
  queueName: "products_queue",
};
