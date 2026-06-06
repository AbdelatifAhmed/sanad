const connectDB = require("./src/config/db.js");
const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const routes = require("./src/routes");
const socketManager = require("./src/utils/socketManager");
const socketAuth = require("./src/middleware/socketMiddleware");
dotenv.config();
const app = express();

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

global.io = io;

io.use(socketAuth);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);
  socketManager.addUser(socket.userId, socket.id);

  socket.on("joinBookingRoom", async (bookingId) => {
    try {
      const Booking = require("./src/models/booking.schema");
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        socket.emit("error", { message: "Booking not found" });
        return;
      }

      const userId = socket.userId;
      if (booking.familyId.toString() === userId.toString() || booking.companionId.toString() === userId.toString()) {
        socket.join(bookingId);
        console.log(`User ${userId} joined room: ${bookingId}`);
        socket.emit("joinedRoom", { bookingId });
      } else {
        socket.emit("error", { message: "Unauthorized to join this booking room" });
      }
    } catch (err) {
      console.error("Socket joinBookingRoom error:", err);
      socket.emit("error", { message: "Internal server error" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
    socketManager.removeUser(socket.userId, socket.id); 
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api", routes);
connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Sanad Backend running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
});