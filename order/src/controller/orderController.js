const orderService = require("../services/orderService"); // ✅ export instance, không cần new

class OrderController {
  /**
   * 🛒 Tạo đơn hàng mới
   */
  async createOrder(req, res) {
    try {
      const { productIds } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: Missing user info" });
      }
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: "Invalid product list" });
      }

      console.log(`📦 [OrderController] Creating order for user ${userId}...`);

      const order = await orderService.createOrder(userId, productIds);

      return res.status(201).json({
        message: "Order created successfully",
        order,
      });
    } catch (err) {
      console.error("❌ [OrderController] Create order error:", err.message);
      return res.status(500).json({ message: "Failed to create order" });
    }
  }

  /**
   * 📜 Lấy danh sách đơn hàng của user hiện tại
   */
  async getUserOrders(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orders = await orderService.getUserOrders(userId);
      return res.status(200).json(orders);
    } catch (err) {
      console.error("❌ [OrderController] Get user orders error:", err.message);
      return res.status(500).json({ message: "Failed to get user orders" });
    }
  }

  /**
   * ✏️ Cập nhật trạng thái đơn hàng
   */
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ message: "Missing order ID or status" });
      }

      const order = await orderService.updateOrderStatus(id, status);
      return res.status(200).json(order);
    } catch (err) {
      console.error("❌ [OrderController] Update order status error:", err.message);
      return res.status(500).json({ message: "Failed to update order status" });
    }
  }
}

module.exports = new OrderController(); // ✅ export instance luôn cho router dùng trực tiếp
