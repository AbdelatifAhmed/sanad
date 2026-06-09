const connectDB = require("./src/config/db.js");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const routes = require("./src/routes");
const socketManager = require("./src/utils/socketManager");
const socketAuth = require("./src/middleware/socketMiddleware");
dotenv.config();
const app = express();
const cookieParser = require("cookie-parser");

app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4200',],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
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

  if (socket.userId) {
    socket.join(socket.userId.toString());
    console.log(`User ${socket.userId} automatically joined their personal room.`);
  }

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
        console.log(`User ${userId} joined booking room: ${bookingId}`);

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
    socketManager.removeUser(socket.userId);
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