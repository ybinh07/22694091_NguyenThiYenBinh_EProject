const OrderService = require("../services/orderService");
const orderService = new OrderService();

class OrderController {
  createOrder = async (req, res) => {
    try {
      const { productIds } = req.body;
      const userId = req.user.id;

      const order = await orderService.createOrder(userId, productIds);

      return res.status(201).json({ message: "Order created", order });
    } catch (e) {
      console.error("Order create error:", e.message);
      return res.status(500).json({ message: "Failed to create order" });
    }
  };

  getUserOrders = async (req, res) => {
    try {
      const orders = await orderService.getUserOrders(req.user.id);
      res.json(orders);
    } catch (e) {
      console.error("Get user orders error:", e.message);
      res.status(500).json({ message: "Failed to get user orders" });
    }
  };

  updateOrderStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(id, status);
      res.json(order);
    } catch (e) {
      console.error("Update order status error:", e.message);
      res.status(500).json({ message: "Failed to update order status" });
    }
  };
}

module.exports = OrderController;
