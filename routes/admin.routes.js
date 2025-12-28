import { Router } from "express";
import { getAllUsers,
            toggleBlockUser,
            getAllRequests,
            getSystemStats,
            deleteUser
 } from "../controllers/admin.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { restrictTo } from "../middlewares/role.middleware.js";

const adminRouter = Router();

adminRouter.get("/users", protect, restrictTo("admin"), getAllUsers);
// admin.routes.js mein ye line change karein:
adminRouter.put("/toggle-block", protect, restrictTo("admin"), toggleBlockUser);
adminRouter.get("/requests", protect, restrictTo("admin"), getAllRequests);
adminRouter.get("/stats", protect, restrictTo("admin"), getSystemStats);
adminRouter.delete("/delete-user/:id", protect, restrictTo("admin"),deleteUser);

export default adminRouter;