const amqp = require("amqplib");
const Product = require("../models/product");

class MessageBroker {
  constructor() {
    this.channel = null;
    this.productController = null;
  }
  setProductController(controller) { this.productController = controller; }

  async connect() {
    console.log("Product Service: connecting to RabbitMQ...");
    const conn = await amqp.connect(process.env.RABBITMQ_URI || "amqp://localhost:5672");
    const ch = await conn.createChannel();
    this.channel = ch;

    await ch.assertQueue("orders", { durable: true });
    await ch.assertQueue("products", { durable: true });
    console.log("Product Service: queues ready");

    // Consume responses from Order Service
    ch.consume("products", async (msg) => {
      try {
        const data = JSON.parse(msg.content.toString());
        const { orderId, totalPrice, productIds } = data;

        // Update in-memory order status for quick polling
        if (this.productController && this.productController.ordersMap.has(orderId)) {
          const order = this.productController.ordersMap.get(orderId);
          this.productController.ordersMap.set(orderId, { ...order, totalPrice, status: "completed" });
        }

        // Inventory sync: decrement stock
        if (Array.isArray(productIds)) {
          for (const id of productIds) {
            await Product.findByIdAndUpdate(id, { $inc: { stock: -1 } });
          }
        }
        ch.ack(msg);
      } catch (e) {
        console.error("Product consume error:", e.message);
        ch.nack(msg, false, false);
      }
    });
  }

  async publishMessage(queue, message) {
    if (!this.channel) throw new Error("No RabbitMQ channel");
    await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
  }
}

module.exports = new MessageBroker();
