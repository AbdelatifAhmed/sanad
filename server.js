const connectDB = require("./src/config/db.js");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const routes = require("./src/routes");
const socketManager = require("./src/utils/socketManager");
const socketAuth = require("./src/middleware/socketMiddleware");
const registerShiftHandlers = require("./src/sockets/shiftHandler");
dotenv.config();
const app = express();
const cookieParser = require("cookie-parser");

app.use(helmet());

// Custom recursive NoSQL query injection sanitizer (Express 5 compatible)
const sanitizeObject = (obj) => {
  if (obj && typeof obj === "object") {
    for (const key in obj) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
};

const customMongoSanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) {
    for (const key in req.query) {
      if (key.startsWith("$") || key.includes(".")) {
        delete req.query[key];
      } else if (req.query[key] && typeof req.query[key] === "object") {
        sanitizeObject(req.query[key]);
      }
    }
  }
  next();
};

app.use(customMongoSanitize);
app.use(cookieParser());
const allowedOrigins = ["http://localhost:3000", "http://localhost:4200"];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

global.io = io;

io.use(socketAuth);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);

  socketManager.addUser(socket.userId, socket.id);

  if (socket.userId) {
    socket.join(socket.userId.toString());
    console.log(
      `User ${socket.userId} automatically joined their personal room.`,
    );
  }

  // Register shift real-time event handlers
  registerShiftHandlers(io, socket);

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
