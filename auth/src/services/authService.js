const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/userRepository");
const config = require("../config");
const User = require("../models/user")
class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }
 async findUserByUsername(username) {
    const user = await User.findOne({ username });
    return user;
  }
  async register(user) {
    const exists = await this.userRepository.getUserByUsername(user.username);
    if (exists) throw new Error("Username already taken");
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(user.password, salt);
    return await this.userRepository.createUser({ ...user, password });
  }

  async login(username, password) {
    const user = await this.userRepository.getUserByUsername(username);
    if (!user)  return { success: false, message: "Invalid username or password" };
    const match = await bcrypt.compare(password, user.password);
    if (!match) return { success: false, message: "Invalid username or password" };
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, config.jwtSecret, { expiresIn: "2h" });
    return { success: true, token };
  }

  async getUserById(id) {
    const user = await this.userRepository.getUserById(id);
    if (!user) throw new Error("User not found");
    return user;
  }
  async deleteTestUsers() {
    // Delete all users with a username that starts with "test"
    await User.deleteMany({ username: /^test/ });
  }
  async getUserById(userId){
    return await this.userRepository.getUserById(userId)
  }
}

module.exports = AuthService;
