const User = require("../models/user");

/**
 * Class to encapsulate the logic for the user repository
 */
class UserRepository {
  async createUser(user) {
    return await User.create(user);
  }

  async getUserByUsername(username) {
    return await User.findOne({ username });
    
  }
  async getUserById(id){
    return await User.findById(id).select("-password")
  }
}
  
module.exports = UserRepository;
