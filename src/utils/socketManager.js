const connectedUsers = new Map();

const addUser = (userId, socketId) => {
  if (!userId) return;
  const idStr = userId.toString();
  if (!connectedUsers.has(idStr)) {
    connectedUsers.set(idStr, new Set());
  }
  connectedUsers.get(idStr).add(socketId);
};

const removeUser = (userId, socketId) => {
  if (!userId) return;
  const idStr = userId.toString();
  if (connectedUsers.has(idStr)) {
    const userSockets = connectedUsers.get(idStr);
    userSockets.delete(socketId);

    if (userSockets.size === 0) {
      connectedUsers.delete(idStr);
    }
  }
};

const getSocketIds = (userId) => {
  if (!userId) return [];
  const idStr = userId.toString();
  return connectedUsers.has(idStr) ? Array.from(connectedUsers.get(idStr)) : [];
};

module.exports = {
  addUser,
  removeUser,
  getSocketIds
};