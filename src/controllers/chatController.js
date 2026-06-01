const mongoose = require('mongoose');
const ChatMessage = require('../models/chat.schema');
const Booking = require('../models/booking.schema');
const { getSocketIds } = require('../utils/socketManager');

const sendMessage = async (req, res) => {
  try {
    const { bookingId, messageText } = req.body;

    const trimmedMessage = messageText ? messageText.trim() : '';
    if (!bookingId || !trimmedMessage) {
      return res.status(400).json({ error: 'Missing required chat fields (bookingId, messageText cannot be empty)' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isFamily = booking.familyId.toString() === req.user._id.toString();
    const isCompanion = booking.companionId.toString() === req.user._id.toString();

    if (!isFamily && !isCompanion) {
      return res.status(403).json({ error: 'Access denied. You are not authorized to send messages in this booking.' });
    }

    const receiverId = isFamily ? booking.companionId : booking.familyId;

    const message = new ChatMessage({
      _id: new mongoose.Types.ObjectId(),
      bookingId,
      senderId: req.user._id,
      receiverId,
      messageText: trimmedMessage,
      isRead: false,
      createdAt: new Date()
    });

    const savedMessage = await message.save();

    const recipientSocketIds = getSocketIds(receiverId);
    const io = req.io;
    if (recipientSocketIds.length > 0 && io) {
      recipientSocketIds.forEach(socketId => {
        io.to(socketId).emit('newMessage', savedMessage);
      });
    }

    return res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error sending chat message:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: `Invalid field: ${error.path}` });
    }
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const isFamily = booking.familyId.toString() === req.user._id.toString();
    const isCompanion = booking.companionId.toString() === req.user._id.toString();

    if (!isFamily && !isCompanion) {
      return res.status(403).json({ error: 'Access denied. You are not authorized to view the chat history for this booking.' });
    }

    const [messages] = await Promise.all([
      ChatMessage.find({ bookingId }).sort({ createdAt: 1 }),
      ChatMessage.updateMany(
        { bookingId, receiverId: req.user._id, isRead: false },
        { $set: { isRead: true } }
      )
    ]);

    return res.status(200).json({
      status: 'success',
      results: messages.length,
      data: {
        messages
      }
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: `Invalid field: ${error.path}` });
    }
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

module.exports = {
  sendMessage,
  getChatHistory
};
