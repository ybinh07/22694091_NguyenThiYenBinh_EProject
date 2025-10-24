const amqp = require("amqplib");
require("dotenv").config();
const orderService = require("../services/orderService");

class MessageBroker {
  constructor() {
    this.channel = null;
    this.connection = null;
    this.queueOrders = "orders";
    this.queueProducts = "products";
  }

  async connect() {
    console.log("⏳ [Order Service] Connecting to RabbitMQ...");
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URI || "amqp://localhost:5672");
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(this.queueOrders, { durable: true });
      await this.channel.assertQueue(this.queueProducts, { durable: true });

      console.log("🐇 [Order Service] Connected to RabbitMQ — listening on 'orders' queue.");
      this.consumeOrders();
    } catch (err) {
      console.error("🚫 RabbitMQ connection failed:", err.message);
    }
  }

  consumeOrders() {
    this.channel.consume(this.queueOrders, async (message) => {
      try {
        const orderData = JSON.parse(message.content.toString());
        console.log("📥 Received order data:", orderData);

        // ✅ Gọi service instance trực tiếp
        const newOrder = await orderService.createOrder(orderData.user.id, orderData.products);

        await this.publish(this.queueProducts, {
          orderId: newOrder._id,
          totalPrice: newOrder.totalPrice,
          productIds: newOrder.products,
        });

        console.log(`✅ [Order Service] Processed order ${newOrder._id}`);
        this.channel.ack(message);
      } catch (err) {
        console.error("❌ Error processing message:", err.message);
        this.channel.nack(message, false, false);
      }
    });
  }

  async publish(queue, payload) {
    try {
      if (!this.channel) throw new Error("No RabbitMQ channel available");
      await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
      console.log(`📤 Message sent to "${queue}"`, payload);
    } catch (err) {
      console.error("❌ Publish error:", err.message);
    }
  }
}

module.exports = new MessageBroker();
