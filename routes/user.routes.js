import { Router } from "express";
import { findNearbyDonors } from "../controllers/matching.controller.js";
import { 
    getProfile,
    updateAvailability,
    updateLocation,
    checkEligibility,
    updateProfile
 } from "../controllers/user.controller.js";
import {protect} from "../middlewares/auth.middleware.js";
const userRouter = Router();

userRouter.post("/nearby-donors", protect, findNearbyDonors);
userRouter.get("/profile", protect, getProfile);
userRouter.put("/availability", protect, updateAvailability);
userRouter.put("/location", protect, updateLocation);
userRouter.get("/eligibility", protect, checkEligibility); //“The eligibility API dynamically calculates whether a donor can donate again based on medical safety intervals.”
userRouter.put("/update-profile", protect, updateProfile); // For Name, Phone, Blood Group
export default userRouter;
