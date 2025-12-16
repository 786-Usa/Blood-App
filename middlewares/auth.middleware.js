import { verifyToken } from "../utils/jwt.js";

import { User } from "../models/User.model.js";

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ message: "Invalid token" });
      }

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user || req.user.isBlocked) {
        return res.status(401).json({ message: "Unauthorized access" });
      }
      if (req.user.isBlocked) {
        return res.status(403).json({
          message: "Account is blocked by admin",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

export { protect };
