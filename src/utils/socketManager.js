const connectedUsers = new Map();

const addUser = (userId, socketId) => {
  connectedUsers.set(userId.toString(), socketId);
};

const removeUser = (userId) => {
  connectedUsers.delete(userId.toString());
};

const getSocketId = (userId) => {
  return connectedUsers.get(userId.toString());
};

module.exports = {
  addUser,
  removeUser,
  getSocketId
};