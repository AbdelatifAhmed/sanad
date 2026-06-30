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
      bookingId,
      senderId: req.user._id,
      receiverId,
      messageText: trimmedMessage
    });

    const savedMessage = await message.save();

    const io = req.io;
    if (io) {
      const roomName = `booking_${bookingId.toString()}`;
      const sockets = await io.in(roomName).fetchSockets();
      io.to(roomName).emit('newMessage', savedMessage);
    }

    return res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error sending chat message:', error);
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

    await ChatMessage.updateMany(
      { bookingId, receiverId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await ChatMessage.find({ bookingId }).sort({ createdAt: 1 });

    return res.status(200).json({
      status: 'success',
      results: messages.length,
      data: {
        messages
      }
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    const query = {};
    if (role === 'family') {
      query.familyId = userId;
    } else if (role === 'companion') {
      query.companionId = userId;
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // We fetch all bookings (including completed or pending, except cancelled if they have no messages)
    const bookings = await Booking.find(query)
      .populate('familyId', 'name avatar role')
      .populate('companionId', 'name avatar role')
      .sort({ updatedAt: -1 });

    const conversations = await Promise.all(
      bookings.map(async (booking) => {
        // Find last message
        const lastMessage = await ChatMessage.findOne({ bookingId: booking._id })
          .sort({ createdAt: -1 });

        // Count unread messages received by the current user
        const unreadCount = await ChatMessage.countDocuments({
          bookingId: booking._id,
          receiverId: userId,
          isRead: false
        });

        const otherUser = role === 'family' ? booking.companionId : booking.familyId;

        return {
          bookingId: booking._id.toString(),
          bookingStatus: booking.status,
          startDate: booking.startDate,
          endDate: booking.endDate,
          otherUser: otherUser ? {
            _id: otherUser._id.toString(),
            name: otherUser.name,
            avatar: otherUser.avatar,
            role: otherUser.role
          } : null,
          lastMessage: lastMessage ? {
            messageText: lastMessage.messageText,
            senderId: lastMessage.senderId.toString(),
            createdAt: lastMessage.createdAt
          } : null,
          unreadCount
        };
      })
    );

    // Sort: conversations with messages first, sorted by lastMessage.createdAt desc.
    // Conversations without messages sorted by startDate desc.
    conversations.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.startDate);
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.startDate);
      return dateB - dateA;
    });

    return res.status(200).json({
      status: 'success',
      data: {
        conversations
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

const markChatAsRead = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const isFamily = booking.familyId.toString() === userId.toString();
    const isCompanion = booking.companionId.toString() === userId.toString();

    if (!isFamily && !isCompanion) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await ChatMessage.updateMany(
      { bookingId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Chat messages marked as read.'
    });
  } catch (error) {
    console.error('Error marking chat as read:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  getConversations,
  markChatAsRead
};