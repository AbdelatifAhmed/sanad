const bookingService = require("../services/bookingService");
const { getSocketIds } = require("../utils/socketManager");

const checkIn = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduleId } = req.body;
        const companionId = req.user._id;

        const result = await bookingService.checkIn(id, scheduleId, companionId);

        const familySocketIds = getSocketIds(result.familyId);
        const io = req.io;

        const message = "The companion has arrived at the location.";

        const notification = await bookingService.createNotification(
            result.familyId,
            message
        );

        if (familySocketIds.length > 0 && io) {
            familySocketIds.forEach(socketId => {
                io.to(socketId).emit("notification", notification);
            });
        }

        res.status(200).json({
            message: "Check-in successful",
            data: result.booking,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const checkOut = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduleId } = req.body;
        const companionId = req.user._id;

        const result = await bookingService.checkOut(id, scheduleId, companionId);

        const familySocketIds = getSocketIds(result.familyId);
        const io = req.io;

        const message = "The companion has left the location.";
        const notification = await bookingService.createNotification(
            result.familyId,
            message
        );

        if (familySocketIds.length > 0 && io) {
            familySocketIds.forEach(socketId => {
                io.to(socketId).emit("notification", notification);
            });
        }

        res.status(200).json({
            message: "Check-out successful",
            data: result.booking,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    checkIn,
    checkOut
};