const User = require("../models/user");

class UserRepository {
  async getUserByUsername(username) {
    return await User.findOne({ username });
    
  }
  async getUserById(id){
    return await User.findById(id).select("-password")
  }
  async createUser(user) {
    const u = await User.create(user);
    return u.toObject();
  }
  async getUserById(id) {
    return await User.findById(id).lean();
  }
}
  
module.exports = UserRepository;
