const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const orderRoutes = require("./routes/orderRoutes");
const messageBroker = require("./utils/messageBroker");

class App {
  constructor() {
    this.app = express();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(morgan("dev"));
    this.app.use(express.json());
  }

  routes() {
    this.app.use("/api/orders", orderRoutes);
  }

  async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_ORDER_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log("✅ [Order Service] MongoDB connected");
    } catch (err) {
      console.error("🚫 MongoDB error:", err.message);
    }
  }

  async start() {
    this.middlewares();
    this.routes();
    await this.connectDB();
    await messageBroker.connect();

    const port = process.env.PORT || 3002;
    this.server = this.app.listen(port, () => {
      console.log(`🚀 [Order Service] running on port ${port}`);
    });
    console.log("✅ MongoDB connected (Order Service)");
  }

  async disconnectDB() {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }

  async setupOrderConsumer() {
    console.log("⏳ Connecting to RabbitMQ...");

    setTimeout(async () => {
      try {
        const amqpServer = config.rabbitMQUrl;
        const connection = await amqp.connect(amqpServer);
        const channel = await connection.createChannel();
        await channel.assertQueue("orders");

        console.log("🐇 Connected to RabbitMQ & listening on 'orders' queue");

        channel.consume("orders", async (data) => {
          const { products, username, orderId } = JSON.parse(data.content.toString());
          console.log("📥 Received ORDER:", { products, username, orderId });

          try {
            // ✅ Gọi API sang Product Service để lấy thông tin chi tiết sản phẩm
            const response = await axios.post("http://localhost:3001/api/products/info", {
              ids: products,
            });
            const productDocs = response.data;

            // ✅ Tính tổng tiền
            const totalPrice = productDocs.reduce((sum, p) => sum + (p.price || 0), 0);

            // ✅ Tạo order mới trong DB của Order Service
            const newOrder = new Order({
              products, // chỉ lưu danh sách ObjectId
              totalPrice,
            });

            await newOrder.save();
            console.log(`✅ Order ${orderId} saved (${products.length} products)`);

            // ✅ Gửi phản hồi về Product Service
            channel.sendToQueue(
              "products",
              Buffer.from(
                JSON.stringify({
                  orderId,
                  username,
                  products,
                  totalPrice,
                })
              )
            );

            channel.ack(data);
          } catch (err) {
            console.error("❌ Error processing order:", err.message);
            channel.reject(data, false);
          }
        });
      } catch (err) {
        console.error("🚫 Failed to connect to RabbitMQ:", err.message);
      }
    }, 5000); 
  }

  start() {
    this.server = this.app.listen(config.port, () =>
      console.log(`🚀 Order Service running on port ${config.port}`)
    );
  }

  async stop() {
    if (this.server) this.server.close();
    await mongoose.disconnect();
    console.log("🛑 [Order Service] stopped");
  }
}

module.exports = App;
