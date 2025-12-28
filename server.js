import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import { BloodRequest } from "./models/BloodRequest.model.js";

dotenv.config({ path: ".env" });

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Make io accessible in controllers
app.set("socketio", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join-user", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined private room`);
  });
  // inside io.on("connection", (socket) => { ... })
socket.on("respond-sos", async (payload, callback) => {
  try {
    const { requestId, response, donorId: payloadDonorId } = payload || {};
    // Prefer authenticated user if you store it on socket, otherwise use provided donorId
    const donorId = socket.userId || payloadDonorId;

    // Update request: mark fulfilled/cancelled if accepting
    const update = {};
    if (response === "accepted" || response === "accepted") {
      update.status = "fulfilled";
      update.fulfilledBy = donorId;
      update.fulfilledAt = new Date();
    } else if (response === "rejected") {
      // optional: mark donorResponses array or leave status pending
    }

    const request = await BloodRequest.findOneAndUpdate(
      { _id: requestId, status: "pending" },
      { $set: update },
      { new: true }
    );

    if (!request) {
      if (callback) callback({ ok: false, message: "Request not found or not pending" });
      return;
    }

    // Emit to recipient room (you use recipientId as room name)
    const recipientRoom = request.recipientId.toString();
    console.log(`📡 (socket) Emitting to Recipient Room: ${recipientRoom}`);
    io.to(recipientRoom).emit("sos-update", {
      requestId: request._id,
      status: request.status,
      donor: { id: donorId },
    });

    if (callback) callback({ ok: true, status: request.status, request });
  } catch (err) {
    console.error("respond-sos (socket) error:", err);
    if (callback) callback({ ok: false, message: err.message || "Server error" });
  }
});

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

export { io };

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
  });
