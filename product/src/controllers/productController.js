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
        user: { id: req.user?.id, username: req.user?.username }

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

    getProducts = async (req, res) => {
    try {
      const { category, brand, minPrice, maxPrice, page = 1, limit = 20, sort } = req.query;
      const filter = {};
      if (category) filter.category = category;
      if (brand) filter.brand = brand;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }
      const q = Product.find(filter);
      if (sort) q.sort(sort.replace(":", " "));
      const items = await q.skip((page - 1) * limit).limit(Number(limit));
      res.json(items);
    } catch (e) {
      res.status(500).json({ message: "Server error" });
    }
  };
  
  async getProductInfo(req, res) {
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

   async handleOrderResponse(data) {
    const { orderId, totalPrice, products, username } = data;

    if (this.ordersMap.has(orderId)) {
      const order = this.ordersMap.get(orderId);
      this.ordersMap.set(orderId, {
        ...order,
        totalPrice,
        products,
        username,
        status: "completed",
      });
    }

    console.log(`✅ Order ${orderId} updated from Order Service`, data);
  }
}

module.exports = ProductController;
