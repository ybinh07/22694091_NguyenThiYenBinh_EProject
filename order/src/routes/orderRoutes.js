const express = require("express");
const isAuthenticated = require("../utils/isAuthenticated");
const OrderController = require("../controller/orderController");

const router = express.Router();
const controller = new OrderController();

router.post("/", isAuthenticated, controller.createOrder);
router.get("/user/history", isAuthenticated, controller.getUserOrders);
router.patch("/:id/status", isAuthenticated, controller.updateOrderStatus);

module.exports = router;
