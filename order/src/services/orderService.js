const axios = require("axios");
const Order = require("../models/order");
const messageBroker = require("../utils/messageBroker");

class OrderService {
  /**
   * 🔹 Tạo đơn hàng mới
   * @param {String} userId - ID người dùng (từ token)
   * @param {Array<String>} productIds - Danh sách sản phẩm
   * @returns {Promise<Object>} Đơn hàng đã tạo
   */
  async createOrder(userId, productIds) {
    try {
      // 🔸 Gọi sang Product Service để lấy thông tin sản phẩm
      const { data: products } = await axios.post(process.env.PRODUCT_SERVICE_URL, { ids: productIds });

      // 🔸 Tính tổng giá tiền
      const totalPrice = products.reduce((sum, p) => sum + Number(p.price || 0), 0);

      // 🔸 Tạo đơn hàng mới trong MongoDB
      const order = await Order.create({
        userId,
        products: productIds,
        totalPrice,
        status: "Completed", // đơn giản: hoàn tất sau khi tính tổng
      });

      // 🔸 Gửi message sang Product Service để cập nhật tồn kho
      await messageBroker.publish("products", {
        orderId: order._id,
        totalPrice: order.totalPrice,
        productIds: order.products,
      });

      console.log(`✅ [OrderService] Created order ${order._id}`);
      return order;
    } catch (err) {
      console.error("❌ [OrderService] Create order failed:", err.message);
      throw err;
    }
  }

  /**
   * 🔹 Lấy lịch sử đơn hàng của 1 người dùng
   */
  async getUserOrders(userId) {
    return await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  /**
   * 🔹 Cập nhật trạng thái đơn hàng
   */
  async updateOrderStatus(orderId, status) {
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) throw new Error("Order not found");
    return order;
  }
}

module.exports = OrderService;
