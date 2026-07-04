const mongoose = require('mongoose');
const ChatMessage = require('../models/chat.schema');
const Booking = require('../models/booking.schema');
const Proposal = require('../models/proposal.schema');
const JobPost = require('../models/jobPost.schema');
const { getSocketIds } = require('../utils/socketManager');

const sendMessage = async (req, res) => {
  try {
    const { bookingId, proposalId, messageText } = req.body;
    const trimmedMessage = messageText ? messageText.trim() : '';

    if (!trimmedMessage) {
      return res.status(400).json({ error: 'Missing required chat fields (messageText cannot be empty)' });
    }

    if (!bookingId && !proposalId) {
      return res.status(400).json({ error: 'Missing required chat fields (either bookingId or proposalId is required)' });
    }

    let receiverId = null;

    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const isFamily = booking.familyId.toString() === req.user._id.toString();
      const isCompanion = booking.companionId.toString() === req.user._id.toString();

      if (!isFamily && !isCompanion) {
        return res.status(403).json({ error: 'Access denied. You are not authorized to send messages in this booking.' });
      }

      receiverId = isFamily ? booking.companionId : booking.familyId;
    } else if (proposalId) {
      const proposal = await Proposal.findById(proposalId).populate('jobPostId');
      if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
      }

      const isFamily = proposal.jobPostId.familyId.toString() === req.user._id.toString();
      const isCompanion = proposal.companionId.toString() === req.user._id.toString();

      if (!isFamily && !isCompanion) {
        return res.status(403).json({ error: 'Access denied. You are not authorized to send messages in this proposal.' });
      }

      receiverId = isFamily ? proposal.companionId : proposal.jobPostId.familyId;
    }

    const message = new ChatMessage({
      bookingId: bookingId || null,
      proposalId: proposalId || null,
      senderId: req.user._id,
      receiverId,
      messageText: trimmedMessage
    });

    const savedMessage = await message.save();

    const io = req.io;
    if (io) {
      if (bookingId) {
        const roomName = `booking_${bookingId.toString()}`;
        io.to(roomName).emit('newMessage', savedMessage);
      } else if (proposalId) {
        const roomName = `proposal_${proposalId.toString()}`;
        io.to(roomName).emit('newMessage', savedMessage);
      }
      io.to(receiverId.toString()).emit('newMessage', savedMessage);
    }

    return res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error sending chat message:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { bookingId } = req.params; // bookingId can represent bookingId or proposalId
    const userId = req.user._id.toString();

    // 1. Try finding by Booking
    const booking = await Booking.findById(bookingId);
    if (booking) {
      const isFamily = booking.familyId.toString() === userId;
      const isCompanion = booking.companionId.toString() === userId;

      if (!isFamily && !isCompanion) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      const relatedBookings = await Booking.find({
        familyId: booking.familyId,
        companionId: booking.companionId
      });
      const bookingIds = relatedBookings.map((b) => b._id);

      const relatedProposals = await Proposal.find({
        companionId: booking.companionId
      });
      const proposalIds = relatedProposals.map((p) => p._id);

      await ChatMessage.updateMany(
        { 
          $or: [
            { bookingId: { $in: bookingIds } },
            { proposalId: { $in: proposalIds } }
          ],
          receiverId: req.user._id,
          isRead: false
        },
        { $set: { isRead: true } }
      );

      const messages = await ChatMessage.find({
        $or: [
          { bookingId: { $in: bookingIds } },
          { proposalId: { $in: proposalIds } }
        ]
      }).sort({ createdAt: 1 });

      return res.status(200).json({
        status: 'success',
        results: messages.length,
        data: {
          messages
        }
      });
    }

    // 2. Try finding by Proposal
    const proposal = await Proposal.findById(bookingId).populate('jobPostId');
    if (proposal) {
      const isFamily = proposal.jobPostId.familyId.toString() === userId;
      const isCompanion = proposal.companionId.toString() === userId;

      if (!isFamily && !isCompanion) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      const relatedBookings = await Booking.find({
        familyId: proposal.jobPostId.familyId,
        companionId: proposal.companionId
      });
      const bookingIds = relatedBookings.map((b) => b._id);

      const relatedProposals = await Proposal.find({
        companionId: proposal.companionId
      });
      const proposalIds = relatedProposals.map((p) => p._id);

      await ChatMessage.updateMany(
        {
          $or: [
            { bookingId: { $in: bookingIds } },
            { proposalId: { $in: proposalIds } }
          ],
          receiverId: req.user._id,
          isRead: false
        },
        { $set: { isRead: true } }
      );

      const messages = await ChatMessage.find({
        $or: [
          { bookingId: { $in: bookingIds } },
          { proposalId: { $in: proposalIds } }
        ]
      }).sort({ createdAt: 1 });

      return res.status(200).json({
        status: 'success',
        results: messages.length,
        data: {
          messages
        }
      });
    }

    return res.status(404).json({ error: 'Conversation context not found.' });
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

    // Fetch all bookings for grouping
    const bookings = await Booking.find(query)
      .populate('familyId', 'name avatar role')
      .populate('companionId', 'name avatar role')
      .sort({ updatedAt: -1 });

    const interactionMap = {};

    for (const b of bookings) {
      const otherUser = role === 'family' ? b.companionId : b.familyId;
      if (!otherUser) continue;
      const otherUserId = otherUser._id.toString();
      if (!interactionMap[otherUserId]) {
        interactionMap[otherUserId] = { otherUser, bookings: [], proposals: [] };
      }
      interactionMap[otherUserId].bookings.push(b);
    }

    // Fetch all proposals for grouping
    let proposals = [];
    if (role === 'family') {
      const jobPosts = await JobPost.find({ familyId: userId });
      const jobPostIds = jobPosts.map(j => j._id);
      proposals = await Proposal.find({ jobPostId: { $in: jobPostIds } })
        .populate('companionId', 'name avatar role')
        .populate({
          path: 'jobPostId',
          select: 'title familyId'
        });
    } else {
      proposals = await Proposal.find({ companionId: userId })
        .populate({
          path: 'jobPostId',
          select: 'title familyId',
          populate: {
            path: 'familyId',
            select: 'name avatar role'
          }
        });
    }

    for (const p of proposals) {
      const otherUser = role === 'family' 
        ? p.companionId 
        : (p.jobPostId ? p.jobPostId.familyId : null);
      if (!otherUser) continue;
      const otherUserId = otherUser._id.toString();
      if (!interactionMap[otherUserId]) {
        interactionMap[otherUserId] = { otherUser, bookings: [], proposals: [] };
      }
      interactionMap[otherUserId].proposals.push(p);
    }

    const conversations = await Promise.all(
      Object.keys(interactionMap).map(async (otherUserId) => {
        const { otherUser, bookings: userBookings, proposals: userProposals } = interactionMap[otherUserId];

        let primaryId = "";
        let startDate = new Date();
        let endDate = new Date();

        if (userBookings.length > 0) {
          const statusPriority = {
            active: 1,
            approved: 2,
            pending_payment: 3,
            pending: 4,
            completed: 5,
            cancelled: 6
          };
          userBookings.sort((a, b) => {
            const priorityA = statusPriority[a.status] || 99;
            const priorityB = statusPriority[b.status] || 99;
            if (priorityA !== priorityB) return priorityA - priorityB;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          primaryId = userBookings[0]._id.toString();
          startDate = userBookings[0].startDate;
          endDate = userBookings[0].endDate;
        } else if (userProposals.length > 0) {
          userProposals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          primaryId = userProposals[0]._id.toString();
          startDate = userProposals[0].createdAt;
          endDate = userProposals[0].createdAt;
        }

        const bookingIds = userBookings.map((b) => b._id);
        const proposalIds = userProposals.map((p) => p._id);

        const lastMessage = await ChatMessage.findOne({
          $or: [
            { bookingId: { $in: bookingIds } },
            { proposalId: { $in: proposalIds } }
          ]
        }).sort({ createdAt: -1 });

        const unreadCount = await ChatMessage.countDocuments({
          $or: [
            { bookingId: { $in: bookingIds } },
            { proposalId: { $in: proposalIds } }
          ],
          receiverId: userId,
          isRead: false
        });

        return {
          bookingId: primaryId,
          startDate,
          endDate,
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

    conversations.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.startDate);
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.startDate);
      return dateB.getTime() - dateA.getTime();
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
    const { bookingId } = req.params; // bookingId represents bookingId or proposalId
    const userId = req.user._id;

    let familyId = null;
    let companionId = null;

    const booking = await Booking.findById(bookingId);
    if (booking) {
      familyId = booking.familyId;
      companionId = booking.companionId;
    } else {
      const proposal = await Proposal.findById(bookingId).populate('jobPostId');
      if (proposal) {
        familyId = proposal.jobPostId.familyId;
        companionId = proposal.companionId;
      }
    }

    if (!familyId || !companionId) {
      return res.status(404).json({ error: 'Conversation context not found.' });
    }

    const isFamily = familyId.toString() === userId.toString();
    const isCompanion = companionId.toString() === userId.toString();

    if (!isFamily && !isCompanion) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const relatedBookings = await Booking.find({ familyId, companionId });
    const bookingIds = relatedBookings.map((b) => b._id);

    const relatedProposals = await Proposal.find({ companionId });
    const proposalIds = relatedProposals.map((p) => p._id);

    await ChatMessage.updateMany(
      {
        $or: [
          { bookingId: { $in: bookingIds } },
          { proposalId: { $in: proposalIds } }
        ],
        receiverId: userId,
        isRead: false
      },
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