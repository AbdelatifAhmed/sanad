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

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.use(socketAuth);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);
  socketManager.addUser(socket.userId, socket.id);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
    socketManager.removeUser(socket.userId, socket.id); 
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());
app.use("/api", routes);
connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Sanad Backend running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
});