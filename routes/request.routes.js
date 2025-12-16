import { Router } from "express";
import {
  createRequest,
  respondToRequest,
  cancelRequest

} from "../controllers/request.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const requestRouter = Router();

requestRouter.post("/sos", protect, createRequest);
requestRouter.post("/respond", protect, respondToRequest);
requestRouter.post("/cancel", protect, cancelRequest);


export default requestRouter;