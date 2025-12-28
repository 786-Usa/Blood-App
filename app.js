import express from "express";
// import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import requestRouter from "./routes/request.routes.js";
import donationRouter from "./routes/donation.routes.js";
import adminRouter from "./routes/admin.routes.js";
// import cookieParser from "cookie-parser";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(
//   cors({
//       origin: "http://localhost:5173",
//     credentials: true,
//   })
// );
// app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/request", requestRouter);
app.use("/api/donation", donationRouter);
app.use("/api/admin", adminRouter);

export default app;