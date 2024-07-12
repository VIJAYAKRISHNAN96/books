const User = require("../model/userModel");
const userManagement = {
blockUnblockUser : async (req, res) => {
    const userId = req.params.userId;
    console.log(userId, "jilll");
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
  
      // Toggle the is_verified status
      user.isBlocked = !user.isBlocked;
  
      await user.save();
      res.status(200).json({
        success: true,
        message: user.is_blocked ? "User unblocked successfully" : "User blocked successfully",
        user,
        isBlocked: user.isBlocked,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Internal Server Error", details: error });
    }
  },
}

module.exports = userManagement