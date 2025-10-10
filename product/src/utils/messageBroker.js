const amqp = require("amqplib");

class MessageBroker {
  constructor() {
    this.channel = null;
    this.productController = null;
  }

  setProductController(controller) {
    this.productController = controller;
  }

  async connect() {
    console.log("Connecting to RabbitMQ...");
    try {
      const connection = await amqp.connect("amqp://localhost:5672");
      this.channel = await connection.createChannel();

      await this.channel.assertQueue("orders", { durable: true });
      await this.channel.assertQueue("products", { durable: true });

      console.log("RabbitMQ connected and queues declared");

      // 🟢 Nhận phản hồi từ Order Service
      this.channel.consume("products", (message) => {
        const data = JSON.parse(message.content.toString());
        const { orderId, totalPrice } = data;

        if (this.productController && this.productController.ordersMap.has(orderId)) {
          const order = this.productController.ordersMap.get(orderId);
          this.productController.ordersMap.set(orderId, {
            ...order,
            ...data,
            status: "completed",
          });
          console.log(`✅ Order ${orderId} completed`);
        }

        this.channel.ack(message);
      });
    } catch (err) {
      console.error("Failed to connect to RabbitMQ:", err.message);
    }
  }

  async publishMessage(queue, message) {
    if (!this.channel) {
      console.error("No RabbitMQ channel available.");
      return;
    }
    try {
      await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
      console.log(`📤 Message sent to ${queue}`, message);
    } catch (err) {
      console.error("Error publishing message:", err);
    }
  }
}

module.exports = new MessageBroker();
