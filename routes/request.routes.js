import { Router } from "express";
import {
  createRequest,
  respondToRequest,
  cancelRequest,
  getMyRequests,
  getRequestById
  ,arrivalConfirmation, markAsDonated

} from "../controllers/request.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const requestRouter = Router();

requestRouter.post("/sos", protect, createRequest);
requestRouter.post("/respond", protect, respondToRequest);
requestRouter.post("/cancel", protect, cancelRequest);
requestRouter.post("/arrived", protect, arrivalConfirmation);
requestRouter.post("/complete", protect, markAsDonated);
requestRouter.get("/my-requests", protect, getMyRequests);
requestRouter.get("/request/:id", protect, getRequestById);


export default requestRouter;