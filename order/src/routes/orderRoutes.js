const express = require("express");
const isAuthenticated = require("../utils/isAuthenticated");
const orderController = require("../controller/orderController"); // ✅ import instance (đã new ở trong file đó)

const router = express.Router();

// 🔹 Tạo đơn hàng mới
router.post("/", isAuthenticated, orderController.createOrder.bind(orderController));

// 🔹 Lấy lịch sử đơn hàng của người dùng hiện tại
router.get("/user/history", isAuthenticated, orderController.getUserOrders.bind(orderController));

// 🔹 Cập nhật trạng thái đơn hàng
router.patch("/:id/status", isAuthenticated, orderController.updateOrderStatus.bind(orderController));

module.exports = router;
