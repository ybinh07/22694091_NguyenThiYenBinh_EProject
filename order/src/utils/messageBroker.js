const amqp = require("amqplib");
const config = require("../config");
const OrderService = require("../services/orderService");

class MessageBroker {
  static async connect() {
    try {
      const connection = await amqp.connect(config.rabbitMQUrl); // ✅ đổi key
      const channel = await connection.createChannel();

      await channel.assertQueue(config.rabbitMQQueue, { durable: true });

      channel.consume(config.rabbitMQQueue, async (message) => {
        try {
          const order = JSON.parse(message.content.toString());
          const orderService = new OrderService();
          await orderService.createOrder(order);
          channel.ack(message);
        } catch (error) {
          console.error(error);
          channel.reject(message, false);
        }
      });
    } catch (error) {
      console.error("RabbitMQ connection failed:", error.message);
    }
  }
}

module.exports = MessageBroker;
