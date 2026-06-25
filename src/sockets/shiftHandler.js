const Booking = require("../models/booking.schema");

module.exports = (io, socket) => {
  socket.on("joinBookingRoom", async (data) => {
    try {
      const bookingId = typeof data === 'object' && data !== null ? data.bookingId : data;
      
      if (!bookingId) {
        socket.emit("error", { message: "Booking ID is required to join room." });
        return;
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        socket.emit("error", { message: "Booking not found" });
        return;
      }

      const userId = socket.userId;
      if (!userId) {
        socket.emit("error", { message: "Authentication required." });
        return;
      }

      const isFamily = booking.familyId.toString() === userId.toString();
      const isCompanion = booking.companionId.toString() === userId.toString();

      if (isFamily || isCompanion) {
        const roomName = `booking_${bookingId}`;
        socket.join(roomName);
        console.log(`User ${userId} joined room: ${roomName}`);
        
        socket.emit("joinedRoom", { bookingId, roomName });
      } else {
        socket.emit("error", { message: "Unauthorized to join this booking room." });
      }
    } catch (error) {
      console.error("Error in joinBookingRoom socket event:", error);
      socket.emit("error", { message: "Internal server error during room join." });
    }
  });

  socket.on("leaveBookingRoom", (data) => {
    const bookingId = typeof data === 'object' && data !== null ? data.bookingId : data;
    if (bookingId) {
      const roomName = `booking_${bookingId}`;
      socket.leave(roomName);
      console.log(`User ${socket.userId} left room: ${roomName}`);
      socket.emit("leftRoom", { bookingId, roomName });
    }
  });
};
