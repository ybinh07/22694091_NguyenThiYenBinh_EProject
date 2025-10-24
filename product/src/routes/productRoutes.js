const express = require("express");
const ProductController = require("../controllers/productController");
const isAuthenticated = require("../utils/isAuthenticated");

const router = express.Router();
const productController = new ProductController();

router.post("/create", isAuthenticated, productController.createProduct);
router.post("/buy", isAuthenticated, productController.createOrder);
router.get("/", isAuthenticated, productController.getProducts);

router.post("/info", productController.getProductInfo);
router.get("/orders/:orderId/status", isAuthenticated, productController.getOrderStatus);


module.exports = router;
