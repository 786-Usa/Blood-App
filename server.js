import dotenv from 'dotenv';
import connectDB from './db/index.js';
import app from './app.js';
import http from "http";
import { Server } from "socket.io";

dotenv.config({
    path: ".env",
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Join personal room
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

export { io };

const port = process.env.PORT || 5000;

connectDB()
    .then(() => {
        server.listen(port, () => {
            console.log(`Server is running on port ${port}`)
        })
    })
    .catch((error) => {
        console.error("Failed to start server:", error.message);
    });
