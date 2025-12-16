import Router from "express";
import { getDonationHistory } from "../controllers/donation.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const donationRouter = Router();

donationRouter.get("/history", protect, getDonationHistory);

export default donationRouter;