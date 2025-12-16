import { Router } from "express";
import { getAllUsers,
            toggleBlockUser,
            getAllRequests,
            getSystemStats
 } from "../controllers/admin.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { restrictTo } from "../middlewares/role.middleware.js";

const adminRouter = Router();

adminRouter.get("/users", protect, restrictTo("admin"), getAllUsers);
adminRouter.post("/toggle-block", protect, restrictTo("admin"), toggleBlockUser);
adminRouter.get("/requests", protect, restrictTo("admin"), getAllRequests);
adminRouter.get("/stats", protect, restrictTo("admin"), getSystemStats);


export default adminRouter;