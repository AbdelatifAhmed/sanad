const jwt = require("jsonwebtoken");

const socketAuth = (socket, next) => {
  let token = socket.handshake.auth.token;

  if (token && token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return next(new Error("Authentication error: Invalid token payload"));
    }
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
};

module.exports = socketAuth;
