const axios = require("axios");
const Order = require("../models/order");

/**
 * 🛒 Order Service
 * Xử lý toàn bộ logic nghiệp vụ của đơn hàng.
 */
class OrderService {
  /**
   * 🔹 Tạo đơn hàng mới
   * @param {String} userId - ID người dùng (từ token)
   * @param {Array<String>} productIds - Danh sách sản phẩm
   * @returns {Promise<Object>} Đơn hàng đã tạo
   */
  async createOrder(userId, productIds) {
    try {
      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new Error("Invalid product IDs");
      }

      console.log("📦 [OrderService] Fetching product info from Product Service...");

      // 🔸 Gọi sang Product Service để lấy thông tin sản phẩm
      const response = await axios.post(
        process.env.PRODUCT_SERVICE_URL,
        { ids: productIds },
        {
          timeout: 5000,
          headers: {
            Authorization: process.env.SERVICE_TOKEN, // ✅ gửi token nội bộ
          },
        }
      );

      const products = response.data;
      if (!products || !Array.isArray(products) || products.length === 0) {
        throw new Error("No products found from Product Service");
      }

      // 🔸 Tính tổng giá tiền
      const totalPrice = products.reduce((sum, p) => sum + Number(p.price || 0), 0);

      // 🔸 Tạo đơn hàng mới trong MongoDB
      const order = await Order.create({
        userId,
        products: productIds,
        totalPrice,
        status: "Completed", // Đơn giản: hoàn tất sau khi tính tổng
      });

      console.log(`✅ [OrderService] Created order ${order._id} (User: ${userId})`);
      return order;
    } catch (err) {
      console.error("❌ [OrderService] Create order failed:", err.message);
      throw err;
    }
  }

  /**
   * 🔹 Lấy lịch sử đơn hàng của 1 người dùng
   * @param {String} userId
   */
  async getUserOrders(userId) {
    try {
      const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
      return orders;
    } catch (err) {
      console.error("❌ [OrderService] Failed to get user orders:", err.message);
      throw err;
    }
  }

  /**
   * 🔹 Cập nhật trạng thái đơn hàng
   * @param {String} orderId
   * @param {String} status
   */
  async updateOrderStatus(orderId, status) {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
      if (!order) throw new Error("Order not found");
      console.log(`📝 [OrderService] Updated order ${orderId} → ${status}`);
      return order;
    } catch (err) {
      console.error("❌ [OrderService] Update order status failed:", err.message);
      throw err;
    }
  }
}

module.exports = new OrderService();
