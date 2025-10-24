require("dotenv").config();
module.exports = {
  port: process.env.PORT || 3000,
  mongoURI: process.env.MONGODB_AUTH_URI,
  jwtSecret: process.env.JWT_SECRET || "secret"
};
