require('dotenv').config();

module.exports = {
  mongoURI: process.env.MONGODB_ORDER_URI || 'mongodb://localhost/orders',
  rabbitMQUrl: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
  rabbitMQQueue: 'orders',
  port: process.env.PORT || 3002,
};
