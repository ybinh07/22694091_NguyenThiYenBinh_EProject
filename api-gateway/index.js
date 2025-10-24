const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// =====================
// 🌐 Middlewares chung
// =====================
app.use(cors());
app.use(morgan("dev"));

// Giới hạn request tránh spam
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 80,
  message: { message: "Too many requests, please try again later." },
});
app.use(limiter);

// =====================
// 🔒 Xác thực JWT
// =====================
function verifyToken(req, res, next) {
  // Bỏ qua xác thực cho /auth routes
  if (req.path.startsWith("/auth")) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token" });
  }
}
app.use(verifyToken);

// =====================
// 🧩 Proxy Config
// =====================

// ⚠️ Không đặt express.json() trước proxy
// để tránh đọc hết body request

// ---------- AUTH SERVICE ----------
app.use(
  "/auth",
  createProxyMiddleware({
    target: "http://localhost:3000",
    changeOrigin: true,
    pathRewrite: {
      "^/auth": "", // giữ nguyên /api phía sau
    },
    onProxyReq: (proxyReq, req, res) => {
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
      console.log(`➡️ [Gateway] ${req.method} ${req.originalUrl} → Auth Service (${req.url})`);
    },
    onError: (err, req, res) => {
      console.error("❌ [Gateway] Auth service error:", err.message);
      res.status(502).json({ message: "Auth service unavailable" });
    },
  })
);

// ---------- PRODUCT SERVICE ----------
app.use(
  "/products",
  createProxyMiddleware({
    target: "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: { "^/products": "" },

    // ✅ Thêm đoạn này để forward header Authorization
    onProxyReq: (proxyReq, req, res) => {
      if (req.headers.authorization) {
        proxyReq.setHeader("authorization", req.headers.authorization);
      }
      console.log(`➡️ [Gateway] ${req.method} ${req.originalUrl} → Product Service (${req.url})`);
    },

    onError: (err, req, res) => {
      console.error("❌ [Gateway] Product service error:", err.message);
      res.status(502).json({ message: "Product service unavailable" });
    },
  })
);

// ---------- ORDER SERVICE ----------
app.use(
  "/orders",
  createProxyMiddleware({
    target: "http://localhost:3002",
    changeOrigin: true,
    pathRewrite: { "^/orders": "" },

    // ✅ Forward header Authorization
    onProxyReq: (proxyReq, req, res) => {
      if (req.headers.authorization) {
        proxyReq.setHeader("authorization", req.headers.authorization);
      }
      console.log(`➡️ [Gateway] ${req.method} ${req.originalUrl} → Order Service (${req.url})`);
    },

    onError: (err, req, res) => {
      console.error("❌ [Gateway] Order service error:", err.message);
      res.status(502).json({ message: "Order service unavailable" });
    },
  })
);


// =====================
// 🩺 Health Check
// =====================
app.get("/health", (req, res) => res.json({ ok: true }));

// =====================
// ⚙️ Express JSON cho route nội bộ (nếu có sau này)
// =====================
app.use(express.json());

// =====================
// 🚀 Start Server
// =====================
const port = process.env.PORT || 3003;
app.listen(port, () => console.log(`🚀 [API Gateway] listening on port ${port}`));
