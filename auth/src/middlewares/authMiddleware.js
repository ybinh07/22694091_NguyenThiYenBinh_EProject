const jwt = require("jsonwebtoken");
const config = require("../config");

module.exports = function (req, res, next) {
  // Lấy token từ header x-auth-token
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Giải mã token
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // Gắn user id vào req.user
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid token" });
  }
};
