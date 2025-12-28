import { verifyToken } from "../utils/jwt.js";

import { User } from "../models/User.model.js";

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = verifyToken(token);

      // Database se user nikalna zarori hai check karne ke liye ke user delete toh nahi hua
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      // Check if user is blocked (Admin panel functionality sync)
      if (req.user.isBlocked) {
        return res.status(403).json({ message: "Your account has been blocked by Admin" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Session expired, please login again" });
    }
  } else {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
};

export { protect };