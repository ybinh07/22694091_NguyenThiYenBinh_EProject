const Product = require("../models/product");
const messageBroker = require("../utils/messageBroker");
const uuid = require("uuid");

/**
 * Class to hold the API implementation for the product services
 */
class ProductController {
  constructor() {
    this.createOrder = this.createOrder.bind(this);
    this.getOrderStatus = this.getOrderStatus.bind(this);
    this.ordersMap = new Map();
  }

  async createProduct(req, res) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const product = new Product(req.body);
      const validationError = product.validateSync();
      if (validationError) {
        return res.status(400).json({ message: validationError.message });
      }

      await product.save();
      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }

  async createOrder(req, res) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { ids } = req.body;
      const products = await Product.find({ _id: { $in: ids } });

      if (!products.length) {
        return res.status(404).json({ message: "No products found" });
      }

      const orderId = uuid.v4();

      // Lưu trạng thái ban đầu
      this.ordersMap.set(orderId, {
        status: "pending",
        products,
        username: req.user?.username || "guest",
      });

      // ✅ Chỉ gửi danh sách _id sang Order Service
      const productIds = products.map((p) => p._id);

      await messageBroker.publishMessage("orders", {
        orderId,
        products: products.map(p => p._id), // chỉ gửi _id
        username: req.user?.username || "guest",
      });


      // ✅ Trả response ngay lập tức thay vì chờ vòng while
      return res.status(201).json({
        message: "Order placed successfully and is being processed",
        orderId,
        status: "pending",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }


  async getOrderStatus(req, res) {
    const { orderId } = req.params;
    const order = this.ordersMap.get(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json(order);
  }

  async getProducts(req, res) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const products = await Product.find({});
      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  } async getProductInfo(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid product IDs" });
      }

      const products = await Product.find({ _id: { $in: ids } });

      if (!products.length) {
        return res.status(404).json({ message: "No products found" });
      }

      res.status(200).json(products);
    } catch (error) {
      console.error("❌ Error fetching product info:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  }

}

module.exports = ProductController;
